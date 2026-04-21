#!/usr/bin/env node
// scripts/validate-schema.js
// Extracts column names from route files' select strings and validates against migration-defined schemas.
// Run: node scripts/validate-schema.js
// For live DB validation, set SUPABASE_URL and SUPABASE_SERVICE_KEY env vars.

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const routesDir = join(process.cwd(), 'src/routes');
const migrationsDir = join(process.cwd(), 'supabase/migrations');

// Parse all migration files to build a map of table → Set<column>
function parseMigrationSchemas() {
  const files = readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
  const tableColumns = new Map();

  for (const file of files) {
    const sql = readFileSync(join(migrationsDir, file), 'utf-8');

    // Match CREATE TABLE statements
    const createRe = /CREATE TABLE(?:\s+IF NOT EXISTS)?\s+(?:public\.)?(\w+)\s*\(([\s\S]*?)\);/gi;
    let m;
    while ((m = createRe.exec(sql)) !== null) {
      const table = m[1];
      const body = m[2];
      // Only set if not already created (mimics IF NOT EXISTS behavior)
      if (!tableColumns.has(table)) {
        const cols = new Set();
        for (const line of body.split('\n')) {
          const colMatch = line.trim().match(/^(\w+)\s+(UUID|TEXT|INTEGER|NUMERIC|BOOLEAN|DATE|TIMESTAMPTZ?|JSONB?|BIGINT|SMALLINT)/i);
          if (colMatch) cols.add(colMatch[1]);
        }
        tableColumns.set(table, cols);
      }
    }

    // Match ALTER TABLE ADD COLUMN
    const alterAddRe = /ALTER TABLE(?:\s+IF EXISTS)?\s+(?:public\.)?(\w+)\s+ADD\s+(?:COLUMN\s+)?(?:IF NOT EXISTS\s+)?(\w+)/gi;
    while ((m = alterAddRe.exec(sql)) !== null) {
      const table = m[1];
      const col = m[2];
      if (tableColumns.has(table)) {
        tableColumns.get(table).add(col);
      }
    }

    // Match ALTER TABLE RENAME COLUMN
    const alterRenameRe = /ALTER TABLE(?:\s+IF EXISTS)?\s+(?:public\.)?(\w+)\s+RENAME\s+COLUMN\s+(\w+)\s+TO\s+(\w+)/gi;
    while ((m = alterRenameRe.exec(sql)) !== null) {
      const table = m[1];
      const oldCol = m[2];
      const newCol = m[3];
      if (tableColumns.has(table)) {
        tableColumns.get(table).delete(oldCol);
        tableColumns.get(table).add(newCol);
      }
    }
  }

  return tableColumns;
}

// Extract select strings from route files
function extractSelects() {
  const files = readdirSync(routesDir).filter(f => f.endsWith('.ts'));
  const selects = []; // { file, table, columns: string[], line }

  for (const file of files) {
    const content = readFileSync(join(routesDir, file), 'utf-8');
    const lines = content.split('\n');

    // Match CrudConfig table and listSelect/detailSelect/createReturnSelect
    const configRe = /table:\s*'(\w+)'/;
    const selectRe = /(listSelect|detailSelect|createReturnSelect):\s*'([^']+)'/;

    // Match inline .from('table').select('columns')
    const inlineRe = /\.from\('(\w+)'\)\s*\n?\s*\.select\(\s*\n?\s*'([^']+)'/g;

    // CrudConfig pattern
    let currentTable = null;
    for (let i = 0; i < lines.length; i++) {
      const tableMatch = lines[i].match(configRe);
      if (tableMatch) currentTable = tableMatch[1];

      const selectMatch = lines[i].match(selectRe);
      if (selectMatch && currentTable) {
        const selectStr = selectMatch[2];
        if (selectStr === '*') continue;
        const columns = parseSelectColumns(selectStr);
        selects.push({ file, table: currentTable, columns, line: i + 1, type: selectMatch[1] });
      }
    }

    // Inline .from().select() pattern
    let inlineMatch;
    while ((inlineMatch = inlineRe.exec(content)) !== null) {
      const table = inlineMatch[1];
      const selectStr = inlineMatch[2];
      if (selectStr === '*' || selectStr.includes('*,')) continue;
      const lineNum = content.substring(0, inlineMatch.index).split('\n').length;
      const columns = parseSelectColumns(selectStr);
      selects.push({ file, table, columns, line: lineNum, type: 'inline' });
    }
  }

  return selects;
}

// Parse a Supabase select string into column names, stripping join syntax
function parseSelectColumns(selectStr) {
  const columns = [];
  // Split by comma, but respect parentheses (joins)
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

  // Extract plain column names (not joins)
  return columns
    .map(c => c.trim())
    .filter(c => !c.includes('(') && !c.includes(':'))
    .filter(c => c.match(/^[a-z_]+$/)); // plain column names only
}

// Main
const tableColumns = parseMigrationSchemas();
const selects = extractSelects();
const violations = [];

for (const { file, table, columns, line, type } of selects) {
  const dbCols = tableColumns.get(table);
  if (!dbCols) continue; // skip unknown tables

  for (const col of columns) {
    if (!dbCols.has(col)) {
      violations.push(`${file}:${line} [${type}] — table '${table}' has no column '${col}' (found in select)`);
    }
  }
}

if (violations.length > 0) {
  console.error(`\n❌ Schema validation found ${violations.length} column mismatches:\n`);
  violations.forEach(v => console.error(`  ${v}`));
  console.error('\nTip: Run against live DB with SUPABASE_URL + SUPABASE_SERVICE_KEY env vars for authoritative validation.');
  console.error('Migration files may not match production — see 024_reconcile_migration_drift.sql.\n');
  process.exit(1);
} else {
  console.log(`\n✅ Schema validation passed — checked ${selects.length} select statements across ${new Set(selects.map(s => s.file)).size} route files\n`);
}
