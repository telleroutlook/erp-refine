#!/usr/bin/env npx tsx
// scripts/validate-frontend-api.ts
// Validates frontend ↔ backend API consistency:
//   1a. Resource names ↔ API route paths
//   1b. Frontend dataIndex ↔ backend listSelect/detailSelect columns
//   1c. Frontend Form.Item names ↔ DB table columns
//   1d. Page file completeness (list/show/edit/create files exist)
//   1e. Lazy import paths resolve to real files
//
// Run: npx tsx scripts/validate-frontend-api.ts

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';

const ROOT = resolve(new URL('.', import.meta.url).pathname, '..');
const FRONTEND = join(ROOT, 'frontend/src');
const ROUTES_DIR = join(ROOT, 'src/routes');
const APP_TSX = join(FRONTEND, 'App.tsx');
const COLUMNS_PATH = join(ROOT, 'src/schema/columns.ts');

interface Issue {
  level: 'error' | 'warn' | 'info';
  check: string;
  message: string;
}

const issues: Issue[] = [];
function error(check: string, msg: string) { issues.push({ level: 'error', check, message: msg }); }
function warn(check: string, msg: string) { issues.push({ level: 'warn', check, message: msg }); }
function info(check: string, msg: string) { issues.push({ level: 'info', check, message: msg }); }

// ─── Load canonical schema ──────────────────────────────────────────────────

function loadTableColumns(): Map<string, Set<string>> {
  const src = readFileSync(COLUMNS_PATH, 'utf-8');
  const map = new Map<string, Set<string>>();
  const re = /^export const (\w+) = \[([^\]]+)\] as const;$/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) {
    const table = m[1]!;
    const cols = m[2]!.split(',').map(c => c.trim().replace(/'/g, ''));
    map.set(table, new Set(cols));
  }
  return map;
}

// ─── 1a. Extract resources from App.tsx ─────────────────────────────────────

interface ResourceDef {
  name: string;
  hasActions: { list: boolean; show: boolean; edit: boolean; create: boolean };
  parent?: string;
}

function extractResources(): ResourceDef[] {
  const content = readFileSync(APP_TSX, 'utf-8');
  const resources: ResourceDef[] = [];

  // Match resource blocks: { name: 'xxx', list: '...', show: '...', ... }
  const blockRe = /\{\s*name:\s*'([^']+)'([\s\S]*?)\}/g;
  let m: RegExpExecArray | null;
  while ((m = blockRe.exec(content)) !== null) {
    const name = m[1]!;
    const body = m[2]!;
    const hasList = body.includes('list:');
    const hasShow = body.includes('show:');
    const hasEdit = body.includes('edit:');
    const hasCreate = body.includes('create:');
    const parentMatch = body.match(/parent:\s*'([^']+)'/);

    if (!hasList && !hasShow && !hasEdit && !hasCreate) {
      // Parent-only resource (no CRUD actions)
      continue;
    }

    resources.push({
      name,
      hasActions: { list: hasList, show: hasShow, edit: hasEdit, create: hasCreate },
      parent: parentMatch?.[1],
    });
  }
  return resources;
}

// ─── 1a. Extract API route paths from backend ───────────────────────────────

interface RouteDef {
  path: string;        // e.g. '/purchase-orders'
  table: string;       // e.g. 'purchase_orders'
  file: string;
  mountPrefix: string; // '/api' or '/api/admin'
  listSelect?: string;
  detailSelect?: string;
}

function extractRouteDefs(): RouteDef[] {
  const routes: RouteDef[] = [];

  // Determine mount prefix for each route file from index.ts
  const indexContent = readFileSync(join(ROOT, 'src/index.ts'), 'utf-8');
  const mountMap = new Map<string, string>(); // filename → prefix
  const routeImportRe = /import\s+(\w+)\s+from\s+'\.\/routes\/([^']+)'/g;
  const nameToFile = new Map<string, string>();
  let im: RegExpExecArray | null;
  while ((im = routeImportRe.exec(indexContent)) !== null) {
    nameToFile.set(im[1]!, im[2]!);
  }
  const mountRe = /app\.route\('([^']+)',\s*(\w+)\)/g;
  while ((im = mountRe.exec(indexContent)) !== null) {
    const prefix = im[1]!;
    const varName = im[2]!;
    const file = nameToFile.get(varName);
    if (file) mountMap.set(file, prefix);
  }

  let files: string[];
  try { files = readdirSync(ROUTES_DIR).filter(f => f.endsWith('.ts')); } catch { return routes; }

  for (const file of files) {
    const fullPath = join(ROUTES_DIR, file);
    const content = readFileSync(fullPath, 'utf-8');
    const baseName = file.replace('.ts', '');
    const mountPrefix = mountMap.get(baseName) ?? '/api';
    const relPath = relative(ROOT, fullPath);

    // Strategy: find every object literal that has both `table:` and `path:` keys
    // This catches CrudConfig variables AND inline buildCrudRoutes({...}) calls
    const lines = content.split('\n');
    let braceDepth = 0;
    let blockStart = -1;
    let blockContent = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      for (const ch of line) {
        if (ch === '{') {
          if (braceDepth === 0) { blockStart = i; blockContent = ''; }
          braceDepth++;
        }
        if (braceDepth > 0) blockContent += ch;
        if (ch === '}') {
          braceDepth--;
          if (braceDepth === 0 && blockContent.includes("table:") && blockContent.includes("path:")) {
            const pathMatch = blockContent.match(/path:\s*'([^']+)'/);
            const tableMatch = blockContent.match(/(?:^|[\s,])table:\s*'([^']+)'/);
            const listSelectMatch = blockContent.match(/listSelect:\s*\n?\s*'([^']+)'/);
            const detailSelectMatch = blockContent.match(/detailSelect:\s*\n?\s*'([^']+)'/);
            if (pathMatch && tableMatch) {
              routes.push({
                path: pathMatch[1]!,
                table: tableMatch[1]!,
                file: relPath,
                mountPrefix,
                listSelect: listSelectMatch?.[1],
                detailSelect: detailSelectMatch?.[1],
              });
            }
            blockContent = '';
          }
        }
      }
      if (braceDepth > 0) blockContent += '\n';
    }

    // Also catch custom GET endpoints for resources without CrudConfig
    // Match: .get('/resource-name', ...) where path is a simple top-level path
    const customRe = /\.get\(\s*'(\/[a-z][a-z-]*)'\s*,/g;
    let cm: RegExpExecArray | null;
    while ((cm = customRe.exec(content)) !== null) {
      const customPath = cm[1]!;
      const existing = routes.find(r => r.path === customPath);
      if (!existing) {
        // Try to find the table from a nearby .from('table') call
        const lineNum = content.substring(0, cm.index).split('\n').length;
        const nearby = lines.slice(lineNum, lineNum + 10).join('\n');
        const fromMatch = nearby.match(/\.from\(\s*'(\w+)'/);
        routes.push({
          path: customPath,
          table: fromMatch?.[1] ?? '',
          file: relPath,
          mountPrefix,
        });
      }
    }
  }

  return routes;
}

// ─── Parent resource name → page directory mapping ──────────────────────────

const PARENT_DIR_MAP: Record<string, string> = {
  fixedAssets: 'assets',
  contractMgmt: 'contracts',
  masterData: 'master-data',
};

// ─── Check 1a: Resource ↔ Route matching ────────────────────────────────────

function check1a(resources: ResourceDef[], routes: RouteDef[]) {
  const routePaths = new Set(routes.map(r => r.path.replace(/^\//, '')));

  for (const res of resources) {
    if (!routePaths.has(res.name)) {
      error('1a:resource↔route', `Frontend resource '${res.name}' has no matching backend route path '/${res.name}'`);
    }
  }

  // Reverse: routes without frontend resources (info only)
  // Child/line-item routes are embedded in parent document pages — they don't need standalone frontend pages
  const CHILD_ROUTES = new Set([
    'approval-rule-steps', 'role-permissions', 'contract-items',
    'budget-lines', 'voucher-entries', 'inventory-count-lines',
    'bom-items', 'work-order-materials', 'price-list-lines',
    'purchase-receipt-items', 'supplier-invoice-items', 'asn-lines',
    'reconciliation-lines', 'purchase-order-items', 'purchase-requisition-lines',
    'rfq-lines', 'supplier-quotation-lines', 'quality-standard-items',
    'quality-inspection-items', 'sales-invoice-items', 'sales-return-items',
    'sales-order-items', 'sales-shipment-items', 'shipment-tracking-events',
    'message-feedback', 'workflow-steps', 'dynamic-form-data',
  ]);
  const resourceNames = new Set(resources.map(r => r.name));
  for (const route of routes) {
    const name = route.path.replace(/^\//, '');
    if (CHILD_ROUTES.has(name)) continue;
    if (name && !resourceNames.has(name) && route.table && !route.file.includes('admin-audit') && !route.file.includes('auth') && !route.file.includes('chat') && !route.file.includes('schema') && !route.file.includes('storage')) {
      info('1a:route-only', `Backend route '${route.path}' (${route.file}) has no frontend resource page`);
    }
  }
}

// ─── Check 1b: dataIndex ↔ listSelect ───────────────────────────────────────

function parseSelectColumns(selectStr: string): Set<string> {
  const columns = new Set<string>();
  let depth = 0;
  let current = '';
  for (const ch of selectStr) {
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    else if (ch === ',' && depth === 0) {
      const col = current.trim();
      if (col) columns.add(col);
      current = '';
      continue;
    }
    current += ch;
  }
  if (current.trim()) columns.add(current.trim());

  const result = new Set<string>();
  for (const c of columns) {
    const trimmed = c.trim();
    if (trimmed === '*') {
      // Wildcard — can't validate individual columns
      return new Set(['*']);
    }
    // Handle relation alias: 'alias:table(col1,col2)' → add 'alias'
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx > 0 && !trimmed.includes('(')) {
      result.add(trimmed);
    } else if (colonIdx > 0) {
      result.add(trimmed.substring(0, colonIdx));
    } else if (/^[a-z_]+$/.test(trimmed)) {
      result.add(trimmed);
    }
  }
  return result;
}

function check1b(resources: ResourceDef[], routes: RouteDef[]) {
  const routeByPath = new Map<string, RouteDef>();
  for (const r of routes) {
    routeByPath.set(r.path.replace(/^\//, ''), r);
  }

  for (const res of resources) {
    if (!res.hasActions.list) continue;
    const route = routeByPath.get(res.name);
    if (!route?.listSelect) continue;
    if (route.listSelect === '*') continue;

    const apiColumns = parseSelectColumns(route.listSelect);
    if (apiColumns.has('*')) continue;

    // Find the list page
    const parentDir = res.parent ? (PARENT_DIR_MAP[res.parent] ?? res.parent) : '';
    const possiblePaths = [
      join(FRONTEND, 'pages', parentDir, res.name, 'list.tsx'),
      join(FRONTEND, 'pages', parentDir, 'index.tsx'),
    ];

    for (const pagePath of possiblePaths) {
      if (!existsSync(pagePath)) continue;
      const content = readFileSync(pagePath, 'utf-8');

      // Extract simple dataIndex="column" and dataIndex={'column'}
      const diRe = /dataIndex[=:]\s*(?:['"]([a-z_]+)['"]|\{?\s*['"]([a-z_]+)['"])/g;
      let dm: RegExpExecArray | null;
      while ((dm = diRe.exec(content)) !== null) {
        const col = (dm[1] ?? dm[2])!;
        if (['actions', 'key', 'index'].includes(col)) continue;
        if (!apiColumns.has(col)) {
          warn('1b:dataIndex↔listSelect',
            `${relative(ROOT, pagePath)}: dataIndex='${col}' not in listSelect of route '/${res.name}' → column will be empty`);
        }
      }
      break; // only check first found
    }
  }
}

// ─── Check 1c: Form.Item name ↔ DB columns ─────────────────────────────────

function check1c(resources: ResourceDef[], routes: RouteDef[], tableColumns: Map<string, Set<string>>) {
  const routeByPath = new Map<string, RouteDef>();
  for (const r of routes) {
    routeByPath.set(r.path.replace(/^\//, ''), r);
  }

  const IGNORE_FORM_FIELDS = new Set(['items', 'lines', 'entries', 'addresses', 'contacts', 'certificates', 'sites', 'bank_accounts', 'permissions']);

  for (const res of resources) {
    const route = routeByPath.get(res.name);
    if (!route?.table) continue;
    const dbCols = tableColumns.get(route.table);
    if (!dbCols) continue;

    const parentDir = res.parent ? (PARENT_DIR_MAP[res.parent] ?? res.parent) : '';
    for (const action of ['create', 'edit'] as const) {
      if (!res.hasActions[action]) continue;
      const pagePath = join(FRONTEND, 'pages', parentDir, res.name, `${action}.tsx`);
      if (!existsSync(pagePath)) continue;
      const content = readFileSync(pagePath, 'utf-8');

      // Extract Form.Item name="xxx" or name={'xxx'}
      const nameRe = /Form\.Item[^>]*name\s*=\s*(?:['"]([a-z_]+)['"]|\{?\s*['"]([a-z_]+)['"])/g;
      let nm: RegExpExecArray | null;
      while ((nm = nameRe.exec(content)) !== null) {
        const field = (nm[1] ?? nm[2])!;
        if (IGNORE_FORM_FIELDS.has(field)) continue;
        if (!dbCols.has(field)) {
          warn('1c:form↔db',
            `${relative(ROOT, pagePath)}: Form.Item name='${field}' not in table '${route.table}' columns`);
        }
      }
    }
  }
}

// ─── Check 1d: Page file completeness ───────────────────────────────────────

function check1d(resources: ResourceDef[]) {
  const PAGES_DIR = join(FRONTEND, 'pages');

  for (const res of resources) {
    const parentDir = res.parent ? (PARENT_DIR_MAP[res.parent] ?? res.parent) : '';
    const resDir = join(PAGES_DIR, parentDir, res.name);

    // Special case: inventory stock-records uses parent index.tsx
    const actionFileMap: Record<string, string[]> = {
      list: [join(resDir, 'list.tsx'), join(PAGES_DIR, parentDir, 'index.tsx')],
      show: [join(resDir, 'show.tsx')],
      edit: [join(resDir, 'edit.tsx')],
      create: [join(resDir, 'create.tsx')],
    };

    for (const [action, hasIt] of Object.entries(res.hasActions)) {
      if (!hasIt) continue;
      const candidates = actionFileMap[action] ?? [];
      const found = candidates.some(p => existsSync(p));
      if (!found) {
        error('1d:page-completeness',
          `Resource '${res.name}' has ${action} action but no page file at ${relative(ROOT, candidates[0]!)}`);
      }
    }
  }
}

// ─── Check 1e: Lazy import path validation ──────────────────────────────────

function check1e() {
  const content = readFileSync(APP_TSX, 'utf-8');

  // Match: React.lazy(() => import('path')), lazy(() => import('path')), or loadable(() => import('path'))
  const lazyRe = /(?:lazy|loadable)\(\s*\(\)\s*=>\s*import\(\s*'([^']+)'\s*\)/g;
  let m: RegExpExecArray | null;
  while ((m = lazyRe.exec(content)) !== null) {
    const importPath = m[1]!;
    // Resolve relative to App.tsx directory
    const resolved = resolve(join(FRONTEND), importPath);
    const candidates = [
      resolved + '.tsx',
      resolved + '.ts',
      resolved + '/index.tsx',
      resolved + '/index.ts',
    ];
    if (!candidates.some(p => existsSync(p))) {
      error('1e:lazy-import',
        `App.tsx: lazy import '${importPath}' resolves to non-existent file`);
    }
  }
}

// ─── Main ───────────────────────────────────────────────────────────────────

const tableColumns = loadTableColumns();
const resources = extractResources();
const routes = extractRouteDefs();

check1a(resources, routes);
check1b(resources, routes);
check1c(resources, routes, tableColumns);
check1d(resources);
check1e();

// ─── Report ─────────────────────────────────────────────────────────────────

const errors = issues.filter(i => i.level === 'error');
const warns = issues.filter(i => i.level === 'warn');
const infos = issues.filter(i => i.level === 'info');

if (errors.length > 0) {
  console.error(`\n❌ Frontend-API validation found ${errors.length} errors:\n`);
  for (const e of errors) {
    console.error(`  ❌ [${e.check}] ${e.message}`);
  }
}
if (warns.length > 0) {
  console.warn(`\n⚠️  ${warns.length} warnings:\n`);
  for (const w of warns) {
    console.warn(`  ⚠️  [${w.check}] ${w.message}`);
  }
}
if (infos.length > 0) {
  console.log(`\n📋 ${infos.length} info:\n`);
  for (const i of infos) {
    console.log(`  📋 [${i.check}] ${i.message}`);
  }
}

if (errors.length === 0) {
  console.log(`\n✅ Frontend-API validation passed — ${resources.length} resources, ${routes.length} routes checked\n`);
} else {
  console.error(`\nFix the ${errors.length} error(s) above before deploying.\n`);
  process.exit(1);
}
