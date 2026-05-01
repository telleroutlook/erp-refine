#!/usr/bin/env npx tsx
// scripts/validate-schema.ts
// Validates all column references in the codebase against the canonical
// schema generated from information_schema (src/schema/columns.ts).
//
// Checks:
//   1. .select() strings in src/routes/*.ts and src/tools/*.ts
//   2. CrudConfig listSelect/detailSelect/createReturnSelect/headerReturnSelect/itemsReturnSelect
//   3. Frontend dataIndex in frontend/src/pages/**/*.tsx
//   4. Frontend type interfaces in frontend/src/types/index.ts
//   5. Filter methods: .eq/.neq/.is/.gte/.lte/.gt/.lt/.ilike/.in column names
//   6. .order() column names
//   7. .or() embedded column names (PostgREST syntax)
//   8. .update({...}) and .insert({...}) object key column names
//   9. Spurious deleted_at filters on tables without that column
//
// Run: npx tsx scripts/validate-schema.ts (or: npm run schema:validate)

import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';

const ROOT = resolve(new URL('.', import.meta.url).pathname, '..');
const COLUMNS_PATH = resolve(ROOT, 'src/schema/columns.ts');

interface Violation {
  file: string;
  line: number;
  table: string;
  column: string;
  context: string;
}

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

// ─── Parse Supabase select string ───────────────────────────────────────────

function parseSelectColumns(selectStr: string): string[] {
  const columns: string[] = [];
  let depth = 0;
  let current = '';
  for (const ch of selectStr) {
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    else if (ch === ',' && depth === 0) {
      columns.push(current.trim());
      current = '';
      continue;
    }
    current += ch;
  }
  if (current.trim()) columns.push(current.trim());

  return columns
    .map(c => c.trim())
    .filter(c => !c.includes('(') && !c.includes(':'))
    .filter(c => /^[a-z_]+$/.test(c));
}

// ─── Extract selects from TypeScript files ──────────────────────────────────

interface SelectRef {
  file: string;
  line: number;
  table: string;
  columns: string[];
  context: string;
}

function extractBackendSelects(dirs: string[]): SelectRef[] {
  const refs: SelectRef[] = [];

  for (const dir of dirs) {
    let files: string[];
    try {
      files = readdirSync(dir).filter(f => f.endsWith('.ts'));
    } catch { continue; }

    for (const file of files) {
      const fullPath = join(dir, file);
      const content = readFileSync(fullPath, 'utf-8');
      const lines = content.split('\n');
      const relPath = relative(ROOT, fullPath);

      let currentTable: string | null = null;
      let currentItemsTable: string | null = null;
      const headerTableRe = /headerTable:\s*'(\w+)'/;
      const itemsTableRe = /itemsTable:\s*'(\w+)'/;
      const crudTableRe = /(?:^|\s)table:\s*'(\w+)'/;
      const childTableRe = /childTable:\s*'(\w+)'/;
      const selectFieldRe = /(listSelect|detailSelect|createReturnSelect|childListSelect|childDetailSelect|childReturnSelect|headerReturnSelect|itemsReturnSelect):\s*'([^']+)'/;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]!;
        const htMatch = line.match(headerTableRe);
        if (htMatch) { currentTable = htMatch[1]!; }
        const itMatch = line.match(itemsTableRe);
        if (itMatch) { currentItemsTable = itMatch[1]!; }
        const ctMatch = line.match(crudTableRe);
        if (ctMatch && !line.includes('headerTable') && !line.includes('childTable') && !line.includes('parentTable')) {
          currentTable = ctMatch[1]!;
          currentItemsTable = null;
        }
        const chMatch = line.match(childTableRe);
        if (chMatch) { currentTable = chMatch[1]!; }

        const selectMatch = line.match(selectFieldRe);
        if (selectMatch && currentTable) {
          const selectStr = selectMatch[2]!;
          if (selectStr === '*') continue;
          const cols = parseSelectColumns(selectStr);
          const fieldName = selectMatch[1]!;
          const isItemsField = fieldName.includes('items') || fieldName.includes('Items');
          const tbl = (isItemsField && currentItemsTable) ? currentItemsTable : currentTable;
          refs.push({ file: relPath, line: i + 1, table: tbl, columns: cols, context: fieldName });
        }
      }

      // Inline .from('table').select('columns')
      const inlineRe = /\.from\(\s*['"](\w+)['"]\s*\)((?:(?!\.from\()[\s\S])*?)\.select\(\s*\n?\s*['"`]([^'"`]+)['"`]/g;
      let inlineMatch: RegExpExecArray | null;
      while ((inlineMatch = inlineRe.exec(content)) !== null) {
        const table = inlineMatch[1]!;
        const selectStr = inlineMatch[3]!;
        if (selectStr === '*' || selectStr.startsWith('*,') || selectStr.startsWith('*, ')) continue;
        const lineNum = content.substring(0, inlineMatch.index).split('\n').length;
        const cols = parseSelectColumns(selectStr);
        refs.push({ file: relPath, line: lineNum, table, columns: cols, context: 'inline-select' });
      }
    }
  }

  return refs;
}

// ─── Check 5-8: Filter, order, or, update, insert column validation ────────

// Columns that are universal metadata or used as pseudo-columns
const UNIVERSAL_COLUMNS = new Set(['id', 'organization_id', 'created_at', 'updated_at', 'deleted_at']);

interface FilterRef {
  file: string;
  line: number;
  table: string;
  column: string;
  context: string;
}

function extractFilterRefs(dirs: string[], tableColumns: Map<string, Set<string>>): { violations: FilterRef[]; checkedCount: number } {
  const violations: FilterRef[] = [];
  let checkedCount = 0;

  // Single-arg filter methods: .eq('col', val), .neq, .is, .gte, .gt, .lte, .lt, .ilike, .in
  const filterMethodRe = /\.(eq|neq|is|gte?|lte?|ilike|in)\(\s*['"]([a-z_]+)['"]\s*,/g;
  // .order('col') or .order('col', { ... })
  const orderRe = /\.order\(\s*['"]([a-z_]+)['"]/g;
  // .or('col1.op.val,col2.op.val') — extract column names before the first dot in each segment
  const orCallRe = /\.or\(\s*['"`]([^'"`]+)['"`]\s*\)/g;

  for (const dir of dirs) {
    let files: string[];
    try {
      files = readdirSync(dir).filter(f => f.endsWith('.ts'));
    } catch { continue; }

    for (const file of files) {
      const fullPath = join(dir, file);
      const content = readFileSync(fullPath, 'utf-8');
      const lines = content.split('\n');
      const relPath = relative(ROOT, fullPath);

      // Build a line→table context map by tracking .from('table') calls
      // When we see .from('table'), that table is active until the next .from() or end of statement chain
      const lineTableMap = buildLineTableMap(lines);

      // Check filter methods
      let match: RegExpExecArray | null;

      filterMethodRe.lastIndex = 0;
      while ((match = filterMethodRe.exec(content)) !== null) {
        const method = match[1]!;
        const col = match[2]!;
        const lineNum = content.substring(0, match.index).split('\n').length;
        const table = lineTableMap.get(lineNum);
        if (table && tableColumns.has(table)) {
          checkedCount++;
          if (!UNIVERSAL_COLUMNS.has(col)) {
            const dbCols = tableColumns.get(table)!;
            if (!dbCols.has(col)) {
              violations.push({ file: relPath, line: lineNum, table, column: col, context: `filter:.${method}()` });
            }
          }
        }
      }

      // Check .order()
      orderRe.lastIndex = 0;
      while ((match = orderRe.exec(content)) !== null) {
        const col = match[1]!;
        const lineNum = content.substring(0, match.index).split('\n').length;
        const table = lineTableMap.get(lineNum);
        if (table && tableColumns.has(table)) {
          checkedCount++;
          if (!UNIVERSAL_COLUMNS.has(col)) {
            const dbCols = tableColumns.get(table)!;
            if (!dbCols.has(col)) {
              violations.push({ file: relPath, line: lineNum, table, column: col, context: 'filter:.order()' });
            }
          }
        }
      }

      // Check .or() embedded columns
      orCallRe.lastIndex = 0;
      while ((match = orCallRe.exec(content)) !== null) {
        const orStr = match[1]!;
        const lineNum = content.substring(0, match.index).split('\n').length;
        const table = lineTableMap.get(lineNum);
        if (!table || !tableColumns.has(table)) continue;
        const dbCols = tableColumns.get(table)!;

        const segments = orStr.split(',');
        for (const seg of segments) {
          const dotIdx = seg.trim().indexOf('.');
          if (dotIdx <= 0) continue;
          const col = seg.trim().substring(0, dotIdx);
          checkedCount++;
          if (/^[a-z_]+$/.test(col) && !UNIVERSAL_COLUMNS.has(col) && !dbCols.has(col)) {
            violations.push({ file: relPath, line: lineNum, table, column: col, context: 'filter:.or()' });
          }
        }
      }

      // Check .update({...}) and .insert({...}) object keys (top-level only)
      const mutationCallRe = /\.(update|insert)\(\s*\{/g;
      mutationCallRe.lastIndex = 0;
      while ((match = mutationCallRe.exec(content)) !== null) {
        const method = match[1]!;
        const startIdx = match.index + match[0].length;
        const lineNum = content.substring(0, match.index).split('\n').length;
        const table = lineTableMap.get(lineNum);
        if (!table || !tableColumns.has(table)) continue;
        const dbCols = tableColumns.get(table)!;

        const topLevelKeys = extractTopLevelKeys(content, startIdx);
        for (const col of topLevelKeys) {
          checkedCount++;
          if (!UNIVERSAL_COLUMNS.has(col) && !dbCols.has(col)) {
            violations.push({ file: relPath, line: lineNum, table, column: col, context: `mutation:.${method}()` });
          }
        }
      }
    }
  }

  return { violations, checkedCount };
}

/**
 * Extract top-level object keys from content starting right after an opening brace.
 * Skips nested objects/arrays so keys inside { payload: { error_message: ... } }
 * won't be mistaken for top-level columns.
 */
function extractTopLevelKeys(content: string, startIdx: number): string[] {
  const keys: string[] = [];
  let depth = 1; // we're already inside the opening {
  let i = startIdx;
  let atTopLevel = true;

  while (i < content.length && depth > 0) {
    const ch = content[i]!;
    if (ch === '{' || ch === '[') { depth++; atTopLevel = false; }
    else if (ch === '}' || ch === ']') {
      depth--;
      if (depth === 1) atTopLevel = true;
    }
    else if (ch === ',' && depth === 1) { atTopLevel = true; }
    else if (atTopLevel && depth === 1 && /[a-z_]/i.test(ch)) {
      const slice = content.substring(i);
      const keyMatch = slice.match(/^([a-z_]+)\s*:/);
      if (keyMatch) {
        keys.push(keyMatch[1]!);
        i += keyMatch[0].length;
        atTopLevel = false;
        continue;
      }
    }
    i++;
  }
  return keys;
}

/**
 * Build a map from line number → table name, tracking .from('table') calls.
 * The table context propagates forward until a new .from() appears or
 * we hit a line that's clearly a new statement (const/let/var/function/return/}/;).
 */
function buildLineTableMap(lines: string[]): Map<number, string> {
  const map = new Map<number, string>();
  const fromRe = /\.from\(\s*['"](\w+)['"]\s*\)/;
  let currentTable: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const fromMatch = line.match(fromRe);
    if (fromMatch) {
      currentTable = fromMatch[1]!;
    }

    // Reset context on obvious statement boundaries (but not mid-chain)
    if (currentTable && /^\s*(const |let |var |function |return |async |export |\/\/)/.test(line) && !line.includes('.from(')) {
      // Only reset if this line doesn't continue a chain (no leading dot)
      const trimmed = line.trim();
      if (!trimmed.startsWith('.') && !trimmed.startsWith('//') && !fromMatch) {
        currentTable = null;
      }
    }

    if (currentTable) {
      map.set(i + 1, currentTable); // 1-indexed
    }
  }

  return map;
}

// ─── Extract frontend dataIndex references ──────────────────────────────────

interface DataIndexRef {
  file: string;
  line: number;
  column: string;
}

function walkDir(dir: string, ext: string): string[] {
  const result: string[] = [];
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      result.push(...walkDir(full, ext));
    } else if (entry.name.endsWith(ext)) {
      result.push(full);
    }
  }
  return result;
}

function extractDataIndexRefs(pagesDir: string): DataIndexRef[] {
  const refs: DataIndexRef[] = [];
  let files: string[];
  try {
    files = walkDir(pagesDir, '.tsx');
  } catch { return refs; }

  for (const file of files) {
    const content = readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    const relPath = relative(ROOT, file);

    for (let i = 0; i < lines.length; i++) {
      const strMatch = lines[i]!.match(/dataIndex:\s*['"](\w+)['"]/);
      if (strMatch) {
        refs.push({ file: relPath, line: i + 1, column: strMatch[1]! });
      }
    }
  }

  return refs;
}

// ─── Extract frontend type interfaces ───────────────────────────────────────

interface TypeFieldRef {
  file: string;
  line: number;
  interfaceName: string;
  field: string;
}

function extractFrontendTypes(typesFile: string): TypeFieldRef[] {
  const refs: TypeFieldRef[] = [];
  let content: string;
  try {
    content = readFileSync(typesFile, 'utf-8');
  } catch { return refs; }

  const lines = content.split('\n');
  let currentInterface: string | null = null;
  const relPath = relative(ROOT, typesFile);

  for (let i = 0; i < lines.length; i++) {
    const ifMatch = lines[i]!.match(/export interface (\w+)/);
    if (ifMatch) {
      currentInterface = ifMatch[1]!;
      continue;
    }
    if (lines[i]!.trim() === '}') {
      currentInterface = null;
      continue;
    }
    if (currentInterface) {
      const fieldMatch = lines[i]!.match(/^\s+(\w+)\??:\s/);
      if (fieldMatch) {
        refs.push({ file: relPath, line: i + 1, interfaceName: currentInterface, field: fieldMatch[1]! });
      }
    }
  }

  return refs;
}

// ─── Known table-to-interface mapping ───────────────────────────────────────

const INTERFACE_TABLE_MAP: Record<string, string> = {
  PurchaseOrder: 'purchase_orders',
  PurchaseOrderItem: 'purchase_order_items',
  SalesOrder: 'sales_orders',
  StockRecord: 'stock_records',
};

// Fields that are computed or come from joins, not direct DB columns
const IGNORE_FIELDS = new Set(['items', 'product', 'supplier', 'customer', 'warehouse', 'qty_available']);

// ─── Main ───────────────────────────────────────────────────────────────────

const tableColumns = loadTableColumns();
const violations: Violation[] = [];

// Check 1-2: Backend select strings (CrudConfig + inline .from().select())
const backendDirs = [
  join(ROOT, 'src/routes'),
  join(ROOT, 'src/tools'),
  join(ROOT, 'src/utils'),
  join(ROOT, 'src/bff'),
  join(ROOT, 'src/agents'),
];
const selects = extractBackendSelects(backendDirs);

for (const { file, line, table, columns, context } of selects) {
  const dbCols = tableColumns.get(table);
  if (!dbCols) continue;
  for (const col of columns) {
    if (!dbCols.has(col)) {
      violations.push({ file, line, table, column: col, context: `select:${context}` });
    }
  }
}

// Check 3: Frontend dataIndex
const dataIndexRefs = extractDataIndexRefs(join(ROOT, 'frontend/src/pages'));

const allColumns = new Set<string>();
for (const cols of tableColumns.values()) {
  for (const c of cols) allColumns.add(c);
}
const REFINE_FIELDS = new Set(['actions', 'key', 'index']);

for (const { file, line, column } of dataIndexRefs) {
  if (IGNORE_FIELDS.has(column) || REFINE_FIELDS.has(column)) continue;
  if (!allColumns.has(column)) {
    violations.push({ file, line, table: '(any)', column, context: 'dataIndex' });
  }
}

// Check 4: Frontend types
const typeRefs = extractFrontendTypes(join(ROOT, 'frontend/src/types/index.ts'));

for (const { file, line, interfaceName, field } of typeRefs) {
  if (IGNORE_FIELDS.has(field)) continue;
  const table = INTERFACE_TABLE_MAP[interfaceName];
  if (!table) continue;
  const dbCols = tableColumns.get(table);
  if (!dbCols) continue;
  if (!dbCols.has(field)) {
    violations.push({ file, line, table, column: field, context: `type:${interfaceName}` });
  }
}

// Check 5-8: Filter, order, or(), update, insert column names
const { violations: filterViolations, checkedCount: filterCheckedCount } = extractFilterRefs(backendDirs, tableColumns);
for (const { file, line, table, column, context } of filterViolations) {
  violations.push({ file, line, table, column, context });
}

// Check 9: Spurious deleted_at filters on tables that have no deleted_at column
const tablesWithDeletedAt = new Set<string>();
for (const [tbl, cols] of tableColumns) {
  if (cols.has('deleted_at')) tablesWithDeletedAt.add(tbl);
}

for (const dir of backendDirs) {
  let files: string[];
  try { files = readdirSync(dir).filter((f: string) => f.endsWith('.ts')); }
  catch { continue; }
  for (const file of files) {
    const fullPath = join(dir, file);
    const content = readFileSync(fullPath, 'utf-8');
    const lines = content.split('\n');
    const relPath = relative(ROOT, fullPath);
    let currentTable: string | null = null;
    for (let i = 0; i < lines.length; i++) {
      const fromMatch = lines[i]!.match(/\.from\(\s*['"](\w+)['"]\s*\)/);
      if (fromMatch) currentTable = fromMatch[1]!;
      else if (lines[i]!.match(/\.from\(\s*\w+\s*\)/)) currentTable = null;
      if ((lines[i]!.includes(".is('deleted_at'") || lines[i]!.includes('.is("deleted_at"')) && currentTable) {
        if (tableColumns.has(currentTable) && !tablesWithDeletedAt.has(currentTable)) {
          violations.push({ file: relPath, line: i + 1, table: currentTable, column: 'deleted_at', context: 'spurious-filter' });
        }
      }
    }
  }
}

// ─── Report ─────────────────────────────────────────────────────────────────

if (violations.length > 0) {
  console.error(`\n❌ Schema validation found ${violations.length} column mismatches:\n`);
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  table '${v.table}' has no column '${v.column}'  [${v.context}]`);
  }
  console.error(`\nFix these references or run 'npm run schema:sync' to regenerate types from the live DB.\n`);
  process.exit(1);
} else {
  const selectFileCount = new Set(selects.map(s => s.file)).size;
  console.log(`\n✅ Schema validation passed — checked ${selects.length} selects, ${filterCheckedCount} filters/orders/mutations across ${selectFileCount} backend files, ${dataIndexRefs.length} dataIndex refs, ${typeRefs.length} type fields\n`);
}
