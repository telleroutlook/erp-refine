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
//
// Run: npx tsx scripts/validate-schema.ts (or: npm run schema:validate)

import { readFileSync, readdirSync, statSync } from 'node:fs';
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

interface ParsedColumn {
  name: string;
  table?: string; // join target table (for relation:table(cols) syntax)
  nested?: ParsedColumn[];
}

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

      // Track tables from config objects
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
      // Key constraint: between .from() and .select() there must be NO other .from() call.
      // This prevents the regex from jumping across separate query chains.
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
      // Match dataIndex: 'column_name' or dataIndex: "column_name"
      const strMatch = lines[i]!.match(/dataIndex:\s*['"](\w+)['"]/);
      if (strMatch) {
        refs.push({ file: relPath, line: i + 1, column: strMatch[1]! });
      }
      // Match dataIndex={['relation', 'field']} — skip, these are nested relations
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

// Check 1: Backend select strings
const backendDirs = [
  join(ROOT, 'src/routes'),
  join(ROOT, 'src/tools'),
  join(ROOT, 'src/utils'),
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

// Check 2: Frontend dataIndex
const dataIndexRefs = extractDataIndexRefs(join(ROOT, 'frontend/src/pages'));

// Build set of all known columns across all tables
const allColumns = new Set<string>();
for (const cols of tableColumns.values()) {
  for (const c of cols) allColumns.add(c);
}
// Also add common Refine/computed fields
const REFINE_FIELDS = new Set(['actions', 'key', 'index']);

for (const { file, line, column } of dataIndexRefs) {
  if (IGNORE_FIELDS.has(column) || REFINE_FIELDS.has(column)) continue;
  if (!allColumns.has(column)) {
    violations.push({ file, line, table: '(any)', column, context: 'dataIndex' });
  }
}

// Check 3: Frontend types
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

// ─── Report ─────────────────────────────────────────────────────────────────

if (violations.length > 0) {
  console.error(`\n❌ Schema validation found ${violations.length} column mismatches:\n`);
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  table '${v.table}' has no column '${v.column}'  [${v.context}]`);
  }
  console.error(`\nFix these references or run 'npm run schema:sync' to regenerate types from the live DB.\n`);
  process.exit(1);
} else {
  const fileCount = new Set(selects.map(s => s.file)).size;
  console.log(`\n✅ Schema validation passed — checked ${selects.length} selects in ${fileCount} backend files, ${dataIndexRefs.length} dataIndex refs, ${typeRefs.length} type fields\n`);
}
