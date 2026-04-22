#!/usr/bin/env npx tsx
// scripts/validate-i18n.ts
// Validates i18n translation completeness:
//   2a. en.json ↔ zh-CN.json key synchronization (recursive)
//   2b. All Refine resources have i18n resource-name entries
//   2c. All menu.* translation keys match resource definitions
//   2d. Status values from backend code covered by i18n status object
//   2e. Hardcoded CJK text in frontend pages (should use t())
//
// Run: npx tsx scripts/validate-i18n.ts

import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';

const ROOT = resolve(new URL('.', import.meta.url).pathname, '..');
const FRONTEND = join(ROOT, 'frontend/src');
const EN_PATH = join(FRONTEND, 'i18n/en.json');
const ZH_PATH = join(FRONTEND, 'i18n/zh-CN.json');
const APP_TSX = join(FRONTEND, 'App.tsx');

interface Issue {
  level: 'error' | 'warn';
  check: string;
  message: string;
}

const issues: Issue[] = [];
function error(check: string, msg: string) { issues.push({ level: 'error', check, message: msg }); }
function warn(check: string, msg: string) { issues.push({ level: 'warn', check, message: msg }); }

// ─── Load translations ──────────────────────────────────────────────────────

const en = JSON.parse(readFileSync(EN_PATH, 'utf-8'));
const zh = JSON.parse(readFileSync(ZH_PATH, 'utf-8'));

// ─── 2a: Recursive key synchronization ──────────────────────────────────────

function compareKeys(objA: any, objB: any, pathPrefix: string, nameA: string, nameB: string) {
  const keysA = Object.keys(objA);
  const keysB = new Set(Object.keys(objB));

  for (const k of keysA) {
    const fullKey = pathPrefix ? `${pathPrefix}.${k}` : k;
    if (!keysB.has(k)) {
      error('2a:key-sync', `Key '${fullKey}' exists in ${nameA} but missing in ${nameB}`);
    } else if (typeof objA[k] === 'object' && objA[k] !== null && typeof objB[k] === 'object' && objB[k] !== null) {
      compareKeys(objA[k], objB[k], fullKey, nameA, nameB);
    }
  }
  // Reverse: keys in B not in A
  for (const k of Object.keys(objB)) {
    const fullKey = pathPrefix ? `${pathPrefix}.${k}` : k;
    if (!keysA.includes(k)) {
      error('2a:key-sync', `Key '${fullKey}' exists in ${nameB} but missing in ${nameA}`);
    }
  }
}

compareKeys(en, zh, '', 'en.json', 'zh-CN.json');

// ─── 2b: Resource name translations ─────────────────────────────────────────

function extractResourceNames(): string[] {
  const content = readFileSync(APP_TSX, 'utf-8');
  const names: string[] = [];
  const re = /name:\s*'([^']+)'/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    names.push(m[1]!);
  }
  return names;
}

const resourceNames = extractResourceNames();
for (const name of resourceNames) {
  // Each resource should have a top-level key: { "resource-name": { "resource-name": "Label" } }
  if (!en[name]) {
    warn('2b:resource-i18n', `Resource '${name}' has no entry in en.json`);
  }
  if (!zh[name]) {
    warn('2b:resource-i18n', `Resource '${name}' has no entry in zh-CN.json`);
  }
}

// ─── 2c: Menu translation completeness ──────────────────────────────────────

// Extract menu.xxx references from App.tsx
const appContent = readFileSync(APP_TSX, 'utf-8');
const menuKeyRe = /menu\.(\w+)/g;
let mm: RegExpExecArray | null;
const referencedMenuKeys = new Set<string>();
while ((mm = menuKeyRe.exec(appContent)) !== null) {
  referencedMenuKeys.add(mm[1]!);
}

const enMenu = en.menu ?? {};
const zhMenu = zh.menu ?? {};
const enMenuKeys = new Set(Object.keys(enMenu));
const zhMenuKeys = new Set(Object.keys(zhMenu));

// Check referenced keys exist in both locales
for (const key of referencedMenuKeys) {
  if (!enMenuKeys.has(key)) {
    error('2c:menu-i18n', `App.tsx references menu.${key} but it's missing in en.json`);
  }
  if (!zhMenuKeys.has(key)) {
    error('2c:menu-i18n', `App.tsx references menu.${key} but it's missing in zh-CN.json`);
  }
}

// ─── 2d: Status translation coverage ────────────────────────────────────────

function extractStatusValues(): Set<string> {
  const statuses = new Set<string>();
  const backendDirs = [join(ROOT, 'src/routes'), join(ROOT, 'src/tools')];

  for (const dir of backendDirs) {
    let files: string[];
    try { files = readdirSync(dir).filter(f => f.endsWith('.ts')); } catch { continue; }

    for (const file of files) {
      const content = readFileSync(join(dir, file), 'utf-8');
      // Match status assignments: status: 'xxx' or status === 'xxx' or .eq('status', 'xxx')
      const statusRe = /status['":\s]*[:=]==?\s*['"]([a-z_]+)['"]/g;
      let sm: RegExpExecArray | null;
      while ((sm = statusRe.exec(content)) !== null) {
        statuses.add(sm[1]!);
      }
      // Match status in CHECK-like inline arrays or enums
      const enumRe = /status.*(?:IN|in)\s*\(([^)]+)\)/g;
      while ((sm = enumRe.exec(content)) !== null) {
        const vals = sm[1]!.match(/'([a-z_]+)'/g);
        if (vals) vals.forEach(v => statuses.add(v.replace(/'/g, '')));
      }
    }
  }
  return statuses;
}

const backendStatuses = extractStatusValues();
const i18nStatuses = new Set(Object.keys(en.status ?? {}));

for (const status of backendStatuses) {
  if (!i18nStatuses.has(status)) {
    warn('2d:status-i18n', `Backend status '${status}' has no translation in i18n status object`);
  }
}

// ─── 2e: Hardcoded CJK text detection ───────────────────────────────────────

function walkDir(dir: string, ext: string): string[] {
  const result: string[] = [];
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) result.push(...walkDir(full, ext));
      else if (entry.name.endsWith(ext)) result.push(full);
    }
  } catch { /* skip */ }
  return result;
}

const CJK_RE = /[\u4e00-\u9fff\u3400-\u4dbf]/;
const I18N_IGNORE = /\/\/\s*i18n-ignore/;
const pageFiles = walkDir(join(FRONTEND, 'pages'), '.tsx');
const componentFiles = walkDir(join(FRONTEND, 'components'), '.tsx');
const allFrontendFiles = [...pageFiles, ...componentFiles];
let hardcodedCjkCount = 0;

for (const file of allFrontendFiles) {
  const content = readFileSync(file, 'utf-8');
  const lines = content.split('\n');
  const relPath = relative(ROOT, file);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    if (I18N_IGNORE.test(line)) continue;

    // Match title="中文", placeholder="中文", label="中文" in JSX attributes
    const attrRe = /(?:title|placeholder|label|description)\s*=\s*"([^"]+)"/g;
    let am: RegExpExecArray | null;
    while ((am = attrRe.exec(line)) !== null) {
      if (CJK_RE.test(am[1]!)) {
        hardcodedCjkCount++;
        if (hardcodedCjkCount <= 30) {
          warn('2e:hardcoded-cjk', `${relPath}:${i + 1} hardcoded CJK: ${am[0].substring(0, 60)}`);
        }
      }
    }
    // Match title: '中文' or title: "中文" in objects (e.g., ColumnConfig)
    const objAttrRe = /(?:title|label)\s*:\s*['"]([^'"]+[一-龥][^'"]*)['"]/ ;
    const objMatch = line.match(objAttrRe);
    if (objMatch && CJK_RE.test(objMatch[1]!) && !line.includes('t(') && !line.includes('fl(')) {
      hardcodedCjkCount++;
      if (hardcodedCjkCount <= 30) {
        warn('2e:hardcoded-cjk', `${relPath}:${i + 1} hardcoded CJK in object: ${objMatch[0].substring(0, 60)}`);
      }
    }
    // Match message: '请...' validation messages
    const msgRe = /message\s*:\s*['"]([^'"]*[\u4e00-\u9fff][^'"]*)['"]/ ;
    const msgMatch = line.match(msgRe);
    if (msgMatch && !line.includes('t(')) {
      hardcodedCjkCount++;
      if (hardcodedCjkCount <= 30) {
        warn('2e:hardcoded-cjk', `${relPath}:${i + 1} hardcoded CJK message: ${msgMatch[0].substring(0, 60)}`);
      }
    }
    // Match message.success/error('中文')
    const uiMsgRe = /message\.(?:success|error|warning|info)\(\s*['"]([^'"]*[\u4e00-\u9fff][^'"]*)['"]/ ;
    const uiMsgMatch = line.match(uiMsgRe);
    if (uiMsgMatch) {
      hardcodedCjkCount++;
      if (hardcodedCjkCount <= 30) {
        warn('2e:hardcoded-cjk', `${relPath}:${i + 1} hardcoded CJK UI message: ${uiMsgMatch[0].substring(0, 60)}`);
      }
    }
  }
}

if (hardcodedCjkCount > 30) {
  warn('2e:hardcoded-cjk', `... and ${hardcodedCjkCount - 30} more hardcoded CJK instances`);
}
if (hardcodedCjkCount > 0) {
  warn('2e:hardcoded-cjk', `Total: ${hardcodedCjkCount} hardcoded CJK strings found. Use fl(), pt(), t() hooks instead.`);
}

// ─── 2f: Field translation key completeness ─────────────────────────────────

const flCallRe = /fl\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*\)/g;
let missingFieldKeys = 0;
const enFields = en.fields ?? {};
const zhFields = zh.fields ?? {};

for (const file of allFrontendFiles) {
  const content = readFileSync(file, 'utf-8');
  const relPath = relative(ROOT, file);
  let fm: RegExpExecArray | null;
  flCallRe.lastIndex = 0;

  while ((fm = flCallRe.exec(content)) !== null) {
    const table = fm[1]!;
    const column = fm[2]!;
    // Check if key exists in table-specific or common
    const enHasKey = enFields[table]?.[column] || enFields.common?.[column];
    const zhHasKey = zhFields[table]?.[column] || zhFields.common?.[column];

    if (!enHasKey) {
      missingFieldKeys++;
      if (missingFieldKeys <= 10) {
        warn('2f:field-key', `${relPath}: fl('${table}', '${column}') — missing in en.json fields`);
      }
    }
    if (!zhHasKey) {
      missingFieldKeys++;
      if (missingFieldKeys <= 10) {
        warn('2f:field-key', `${relPath}: fl('${table}', '${column}') — missing in zh-CN.json fields`);
      }
    }
  }
}

if (missingFieldKeys > 10) {
  warn('2f:field-key', `... and ${missingFieldKeys - 10} more missing field translation keys`);
}

// ─── Report ─────────────────────────────────────────────────────────────────

const errors = issues.filter(i => i.level === 'error');
const warns = issues.filter(i => i.level === 'warn');

if (errors.length > 0) {
  console.error(`\n❌ i18n validation found ${errors.length} errors:\n`);
  for (const e of errors) console.error(`  ❌ [${e.check}] ${e.message}`);
}
if (warns.length > 0) {
  console.warn(`\n⚠️  ${warns.length} warnings:\n`);
  for (const w of warns) console.warn(`  ⚠️  [${w.check}] ${w.message}`);
}

if (errors.length === 0) {
  console.log(`\n✅ i18n validation passed — ${Object.keys(en).length} en keys, ${Object.keys(zh).length} zh keys, ${backendStatuses.size} status values, ${allFrontendFiles.length} files scanned, ${hardcodedCjkCount} CJK warnings\n`);
} else {
  console.error(`\nFix the ${errors.length} error(s) above before deploying.\n`);
  process.exit(1);
}
