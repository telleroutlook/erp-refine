#!/usr/bin/env npx tsx
// scripts/validate-status.ts
// Validates status enum consistency across the full stack:
//   3a. DB CHECK constraints ↔ backend status assignments
//   3b. DB CHECK constraints ↔ frontend status color/tag mappings
//   3c. DB CHECK constraints ↔ i18n status translations
//
// Source of truth: src/schema/check-constraints.ts (generated from live DB)
// Run: npx tsx scripts/validate-status.ts

import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';

const ROOT = resolve(new URL('.', import.meta.url).pathname, '..');
const FRONTEND = join(ROOT, 'frontend/src');
const EN_PATH = join(FRONTEND, 'i18n/en.json');

interface Issue {
  level: 'error' | 'warn';
  check: string;
  message: string;
}

const issues: Issue[] = [];
function error(check: string, msg: string) { issues.push({ level: 'error', check, message: msg }); }
function warn(check: string, msg: string) { issues.push({ level: 'warn', check, message: msg }); }

// ─── Load CHECK constraints from generated snapshot ─────────────────────────

async function loadConstraints() {
  const mod = await import(resolve(ROOT, 'src/schema/check-constraints.ts'));
  return {
    constraints: mod.CHECK_CONSTRAINTS as Array<{ table: string; column: string; values: string[] }>,
    lookup: mod.CONSTRAINT_LOOKUP as Map<string, Map<string, Set<string>>>,
  };
}

const { constraints, lookup: constraintLookup } = await loadConstraints();

// ─── Extract status assignments from backend code ───────────────────────────

interface StatusAssignment {
  table: string;
  value: string;
  file: string;
  line: number;
}

function extractBackendStatuses(): StatusAssignment[] {
  const assignments: StatusAssignment[] = [];
  const backendDirs = [join(ROOT, 'src/routes'), join(ROOT, 'src/tools')];

  for (const dir of backendDirs) {
    let files: string[];
    try { files = readdirSync(dir).filter(f => f.endsWith('.ts')); } catch { continue; }

    for (const file of files) {
      const fullPath = join(dir, file);
      const content = readFileSync(fullPath, 'utf-8');
      const lines = content.split('\n');
      const relPath = relative(ROOT, fullPath);

      // Track current table from .from('table')
      let currentTable: string | null = null;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]!;
        const fromMatch = line.match(/\.from\(\s*['"](\w+)['"]\s*\)/);
        if (fromMatch) currentTable = fromMatch[1]!;

        // Reset on new statement
        if (/^\s*(const |let |var |function |return |async |export )/.test(line) && !line.includes('.from(') && !line.trim().startsWith('.')) {
          if (!fromMatch) currentTable = null;
        }

        // Match: status: 'value' in .update() or .insert() context
        const statusMatch = line.match(/status:\s*['"]([a-z_]+)['"]/);
        if (statusMatch && currentTable) {
          assignments.push({
            table: currentTable,
            value: statusMatch[1]!,
            file: relPath,
            line: i + 1,
          });
        }
      }
    }
  }
  return assignments;
}

// ─── 3a: DB CHECK ↔ Backend status assignments ─────────────────────────────

const backendStatuses = extractBackendStatuses();

for (const sa of backendStatuses) {
  const tableConstraints = constraintLookup.get(sa.table);
  if (!tableConstraints) continue;
  const allowedValues = tableConstraints.get('status');
  if (!allowedValues) continue;
  if (!allowedValues.has(sa.value)) {
    error('3a:check↔backend',
      `${sa.file}:${sa.line} sets status='${sa.value}' on table '${sa.table}', but CHECK allows: [${[...allowedValues].join(', ')}]`);
  }
}

// ─── 3b: DB CHECK ↔ Frontend status rendering ──────────────────────────────

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

// Collect all status values rendered in frontend
const frontendStatusValues = new Set<string>();
const pageFiles = walkDir(join(FRONTEND, 'pages'), '.tsx');

for (const file of pageFiles) {
  const content = readFileSync(file, 'utf-8');
  // Match status string literals used in comparisons or mappings
  const statusPatterns = [
    /status\s*===?\s*['"]([a-z_]+)['"]/g,
    /['"]([a-z_]+)['"]\s*:\s*\{?\s*(?:color|label|text|icon)/g,
    /case\s+['"]([a-z_]+)['"]/g,
  ];
  for (const re of statusPatterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(content)) !== null) {
      frontendStatusValues.add(m[1]!);
    }
  }
}

// Check: all DB status values should be handled in frontend
const allDbStatusValues = new Set<string>();
for (const c of constraints) {
  if (c.column === 'status') {
    for (const v of c.values) allDbStatusValues.add(v);
  }
}
for (const status of allDbStatusValues) {
  if (!frontendStatusValues.has(status) && !['idle'].includes(status)) {
    warn('3b:check↔frontend',
      `DB status '${status}' has no frontend rendering (no color/tag mapping found)`);
  }
}

// ─── 3c: DB CHECK ↔ i18n status translations ───────────────────────────────

const enData = JSON.parse(readFileSync(EN_PATH, 'utf-8'));
const i18nStatuses = new Set(Object.keys(enData.status ?? {}));

for (const status of allDbStatusValues) {
  if (!i18nStatuses.has(status)) {
    warn('3c:check↔i18n', `DB status '${status}' has no translation in i18n status object`);
  }
}

// Reverse: i18n statuses not in any DB CHECK (orphans)
for (const status of i18nStatuses) {
  if (!allDbStatusValues.has(status)) {
    // Only info-level, some statuses are UI-only or from views
  }
}

// ─── Summary ────────────────────────────────────────────────────────────────

const statusConstraintCount = constraints.filter(c => c.column === 'status').length;
const errors = issues.filter(i => i.level === 'error');
const warns = issues.filter(i => i.level === 'warn');

if (errors.length > 0) {
  console.error(`\n❌ Status validation found ${errors.length} errors:\n`);
  for (const e of errors) console.error(`  ❌ [${e.check}] ${e.message}`);
}
if (warns.length > 0) {
  console.warn(`\n⚠️  ${warns.length} warnings:\n`);
  for (const w of warns) console.warn(`  ⚠️  [${w.check}] ${w.message}`);
}

if (errors.length === 0) {
  console.log(`\n✅ Status validation passed — ${statusConstraintCount} CHECK constraints, ${backendStatuses.length} backend assignments, ${allDbStatusValues.size} unique DB statuses, ${i18nStatuses.size} i18n statuses\n`);
} else {
  console.error(`\nFix the ${errors.length} error(s) above before deploying.\n`);
  process.exit(1);
}
