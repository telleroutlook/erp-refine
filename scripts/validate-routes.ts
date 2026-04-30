#!/usr/bin/env npx tsx
// scripts/validate-routes.ts
// Validates backend route consistency against DB schema:
//   4a. CrudConfig orgScoped ↔ columns.ts (organization_id existence)
//   4b. atomicCreateWithItems explicit fields ↔ columns.ts
//   4c. Status value assignments ↔ CHECK constraints (enhanced)
//   4d. created_by FK target ↔ route code (auth.users vs employees)
//   4e. Number sequence usage ↔ known sequences
//
// Run: npx tsx scripts/validate-routes.ts

import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';

const ROOT = resolve(new URL('.', import.meta.url).pathname, '..');
const ROUTES_DIR = join(ROOT, 'src/routes');

interface Issue {
  level: 'error' | 'warn';
  check: string;
  file: string;
  line: number;
  message: string;
}

const issues: Issue[] = [];
function error(check: string, file: string, line: number, msg: string) { issues.push({ level: 'error', check, file, line, message: msg }); }
function warn(check: string, file: string, line: number, msg: string) { issues.push({ level: 'warn', check, file, line, message: msg }); }

// ─── Load canonical schema ──────────────────────────────────────────────────

function loadTableColumns(): Map<string, Set<string>> {
  const src = readFileSync(join(ROOT, 'src/schema/columns.ts'), 'utf-8');
  const map = new Map<string, Set<string>>();
  const re = /^export const (\w+) = \[([^\]]+)\] as const;$/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) {
    map.set(m[1]!, new Set(m[2]!.split(',').map(c => c.trim().replace(/'/g, ''))));
  }
  return map;
}

const tableColumns = loadTableColumns();

// ─── Load CHECK constraints ─────────────────────────────────────────────────

async function loadConstraints() {
  const mod = await import(resolve(ROOT, 'src/schema/check-constraints.ts'));
  return mod.CONSTRAINT_LOOKUP as Map<string, Map<string, Set<string>>>;
}

const constraintLookup = await loadConstraints();

// ─── Load FK relationships for created_by ───────────────────────────────────

function loadCreatedByFKTargets(): Map<string, string> {
  const src = readFileSync(join(ROOT, 'src/types/database.ts'), 'utf-8');
  const map = new Map<string, string>();
  const fkRe = /foreignKeyName: "(\w+)_created_by_fkey"\s*\n\s*columns: \["created_by"\]\s*\n\s*isOneToOne: \w+\s*\n\s*referencedRelation: "(\w+)"/g;
  let m: RegExpExecArray | null;
  while ((m = fkRe.exec(src)) !== null) {
    const tableName = m[1]!.replace(/_created_by$/, '');
    map.set(m[1]!, m[2]!);
  }
  // Parse more carefully: extract table from FK name pattern "tablename_created_by_fkey"
  fkRe.lastIndex = 0;
  while ((m = fkRe.exec(src)) !== null) {
    const fkName = m[1]!; // e.g., "purchase_requisitions"
    const target = m[2]!;  // e.g., "employees"
    map.set(fkName, target);
  }
  return map;
}

const createdByFKTargets = loadCreatedByFKTargets();

// ─── Helpers ────────────────────────────────────────────────────────────────

function readRouteFiles(): Array<{ path: string; relPath: string; content: string; lines: string[] }> {
  const result: Array<{ path: string; relPath: string; content: string; lines: string[] }> = [];
  let files: string[];
  try { files = readdirSync(ROUTES_DIR).filter(f => f.endsWith('.ts')); } catch { return result; }
  for (const f of files) {
    const fullPath = join(ROUTES_DIR, f);
    const content = readFileSync(fullPath, 'utf-8');
    result.push({ path: fullPath, relPath: relative(ROOT, fullPath), content, lines: content.split('\n') });
  }
  return result;
}

const routeFiles = readRouteFiles();

// ═══════════════════════════════════════════════════════════════════════════
// 4a: CrudConfig orgScoped ↔ columns.ts
// ═══════════════════════════════════════════════════════════════════════════

let check4aCount = 0;

for (const { relPath, content, lines } of routeFiles) {
  // Match CrudConfig blocks: table: 'xxx' ... orgScoped: true/false
  const crudConfigRe = /(?:const \w+(?:Config)?[^=]*=\s*\{[^}]*?table:\s*'(\w+)'[^}]*?orgScoped:\s*(true|false)[^}]*?\})/gs;
  let m: RegExpExecArray | null;
  while ((m = crudConfigRe.exec(content)) !== null) {
    const table = m[1]!;
    const orgScoped = m[2] === 'true';
    const lineNum = content.substring(0, m.index).split('\n').length;
    check4aCount++;

    if (orgScoped && tableColumns.has(table) && !tableColumns.get(table)!.has('organization_id')) {
      error('4a', relPath, lineNum, `CrudConfig table '${table}' has orgScoped:true but no 'organization_id' column`);
    }
    if (!orgScoped && tableColumns.has(table) && tableColumns.get(table)!.has('organization_id')) {
      warn('4a', relPath, lineNum, `CrudConfig table '${table}' has orgScoped:false but table HAS 'organization_id' — verify intent`);
    }
  }

  // Also check buildNestedCrudRoutes childTable + createExtras
  const nestedRe = /buildNestedCrudRoutes\(\{[^}]*?childTable:\s*'(\w+)'[^}]*?\}/gs;
  while ((m = nestedRe.exec(content)) !== null) {
    const childTable = m[1]!;
    const block = m[0];
    const lineNum = content.substring(0, m.index).split('\n').length;
    check4aCount++;

    const hasCreateExtrasOrgId = block.includes('organization_id');
    if (hasCreateExtrasOrgId && tableColumns.has(childTable) && !tableColumns.get(childTable)!.has('organization_id')) {
      error('4a', relPath, lineNum, `Nested CRUD child '${childTable}' injects organization_id in createExtras but column doesn't exist`);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 4b: atomicCreateWithItems explicit payload fields ↔ columns.ts
// ═══════════════════════════════════════════════════════════════════════════

let check4bCount = 0;

// Fields that are always valid (auto-managed or universal)
const SYSTEM_FIELDS = new Set(['id', 'organization_id', 'created_at', 'updated_at', 'deleted_at', 'created_by']);

for (const { relPath, content, lines } of routeFiles) {
  // Find atomicCreateWithItems calls
  const atomicRe = /atomicCreateWithItems\(\s*\n?\s*db,\s*\n?\s*\{/g;
  let m: RegExpExecArray | null;

  while ((m = atomicRe.exec(content)) !== null) {
    const callStart = m.index;
    const lineNum = content.substring(0, callStart).split('\n').length;

    // Extract headerTable and itemsTable from the config block
    const configBlock = extractBalancedBlock(content, callStart + m[0].length - 1);
    const headerTableMatch = configBlock.match(/headerTable:\s*'(\w+)'/);
    const itemsTableMatch = configBlock.match(/itemsTable:\s*'(\w+)'/);
    if (!headerTableMatch) continue;

    const headerTable = headerTableMatch[1]!;
    const itemsTable = itemsTableMatch?.[1];

    // Find the header: { ...headerFields, key: val, key: val } block
    const headerBlockRe = /header:\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/;
    // Search in the area after the config block
    const afterConfig = content.substring(callStart, callStart + 1500);
    const headerMatch = afterConfig.match(headerBlockRe);
    if (headerMatch) {
      const headerContent = headerMatch[1]!;
      // Extract explicit key: value pairs (skip ...spread)
      const keyRe = /(?:^|,)\s*([a-z_]+)\s*:/gm;
      let km: RegExpExecArray | null;
      while ((km = keyRe.exec(headerContent)) !== null) {
        const field = km[1]!;
        check4bCount++;
        if (SYSTEM_FIELDS.has(field)) continue;
        if (tableColumns.has(headerTable) && !tableColumns.get(headerTable)!.has(field)) {
          error('4b', relPath, lineNum, `atomicCreateWithItems header field '${field}' not in table '${headerTable}'`);
        }
      }
    }

    // Check itemsReturnSelect columns exist in items table
    if (itemsTable) {
      const returnSelectMatch = configBlock.match(/itemsReturnSelect:\s*'([^']+)'/);
      if (returnSelectMatch && returnSelectMatch[1] !== '*') {
        const cols = returnSelectMatch[1]!.split(',').map(c => c.trim()).filter(c => /^[a-z_]+$/.test(c));
        for (const col of cols) {
          check4bCount++;
          if (tableColumns.has(itemsTable) && !tableColumns.get(itemsTable)!.has(col)) {
            error('4b', relPath, lineNum, `itemsReturnSelect column '${col}' not in table '${itemsTable}'`);
          }
        }
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 4c: Status value assignments ↔ CHECK constraints
// ═══════════════════════════════════════════════════════════════════════════

let check4cCount = 0;

for (const { relPath, content, lines } of routeFiles) {
  // Track current table context from .from('table') or headerTable: 'table'
  let currentTable: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;

    // Track table context
    const fromMatch = line.match(/\.from\(\s*['"](\w+)['"]\s*\)/);
    if (fromMatch) currentTable = fromMatch[1]!;
    const headerMatch = line.match(/headerTable:\s*'(\w+)'/);
    if (headerMatch) currentTable = headerMatch[1]!;

    // Match status: 'value' patterns
    const statusMatch = line.match(/status:\s*['"]([a-z_]+)['"]/);
    if (statusMatch && currentTable) {
      const value = statusMatch[1]!;
      check4cCount++;

      const tableConstraints = constraintLookup.get(currentTable);
      if (tableConstraints) {
        const statusValues = tableConstraints.get('status');
        if (statusValues && !statusValues.has(value)) {
          error('4c', relPath, i + 1,
            `status '${value}' not in CHECK constraint for '${currentTable}'. Allowed: [${[...statusValues].join(', ')}]`);
        }
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 4d: created_by FK target validation
// ═══════════════════════════════════════════════════════════════════════════

let check4dCount = 0;

// Tables where created_by FK → employees.id (NOT auth.users)
const tablesWithEmployeeFK = new Set<string>();
for (const [fkPrefix, target] of createdByFKTargets) {
  if (target === 'employees') tablesWithEmployeeFK.add(fkPrefix);
}

for (const { relPath, content, lines } of routeFiles) {
  let currentTable: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const fromMatch = line.match(/\.from\(\s*['"](\w+)['"]\s*\)/);
    if (fromMatch) currentTable = fromMatch[1]!;
    const headerMatch = line.match(/headerTable:\s*'(\w+)'/);
    if (headerMatch) currentTable = headerMatch[1]!;

    // Match created_by: user.userId (auth user UUID, not employee)
    if (line.match(/created_by:\s*user\.userId/) && currentTable) {
      check4dCount++;
      if (tablesWithEmployeeFK.has(currentTable)) {
        error('4d', relPath, i + 1,
          `'${currentTable}.created_by' FK → employees.id, but code assigns user.userId (auth UUID). Use resolveEmployeeId().`);
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 4e: Number sequence usage ↔ known sequences
// ═══════════════════════════════════════════════════════════════════════════

let check4eCount = 0;

// Known sequences from number_sequences table (maintained manually)
const KNOWN_SEQUENCES = new Set([
  'purchase_order', 'sales_order', 'purchase_receipt', 'sales_shipment',
  'supplier_invoice', 'sales_invoice', 'purchase_requisition', 'rfq',
  'supplier_quotation', 'payment_request', 'payment_record', 'customer_receipt', 'voucher',
  'work_order', 'bom_header', 'quality_inspection', 'contract',
  'sales_return', 'budget', 'inventory_count', 'advance_shipment_notice',
  'reconciliation_statement', 'quality_standard', 'profile_change_request',
]);

for (const { relPath, content, lines } of routeFiles) {
  const seqRe = /get_next_sequence['"]\s*,\s*\{[^}]*p_sequence_name:\s*['"](\w+)['"]/g;
  let m: RegExpExecArray | null;
  while ((m = seqRe.exec(content)) !== null) {
    const seqName = m[1]!;
    const lineNum = content.substring(0, m.index).split('\n').length;
    check4eCount++;
    if (!KNOWN_SEQUENCES.has(seqName)) {
      error('4e', relPath, lineNum,
        `Sequence '${seqName}' used in get_next_sequence but not in known sequences list. Add it to number_sequences table.`);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Report
// ═══════════════════════════════════════════════════════════════════════════

const errors = issues.filter(i => i.level === 'error');
const warnings = issues.filter(i => i.level === 'warn');

if (errors.length > 0) {
  console.error(`\n❌ Route validation found ${errors.length} errors:\n`);
  for (const e of errors) {
    console.error(`  ${e.file}:${e.line}  [${e.check}] ${e.message}`);
  }
  if (warnings.length > 0) {
    console.warn(`\n⚠️  ${warnings.length} warnings:\n`);
    for (const w of warnings) {
      console.warn(`  ${w.file}:${w.line}  [${w.check}] ${w.message}`);
    }
  }
  console.error(`\nChecked: ${check4aCount} CrudConfig, ${check4bCount} atomic fields, ${check4cCount} status values, ${check4dCount} created_by refs, ${check4eCount} sequences\n`);
  process.exit(1);
} else {
  if (warnings.length > 0) {
    console.warn(`\n⚠️  ${warnings.length} warnings (non-blocking):\n`);
    for (const w of warnings) {
      console.warn(`  ${w.file}:${w.line}  [${w.check}] ${w.message}`);
    }
  }
  console.log(`\n✅ Route validation passed — checked ${check4aCount} CrudConfig, ${check4bCount} atomic fields, ${check4cCount} status values, ${check4dCount} created_by refs, ${check4eCount} sequences\n`);
}

// ─── Utility ────────────────────────────────────────────────────────────────

function extractBalancedBlock(src: string, openIdx: number): string {
  let depth = 0;
  let i = openIdx;
  while (i < src.length) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (depth === 0) return src.substring(openIdx, i + 1); }
    i++;
  }
  return src.substring(openIdx, Math.min(openIdx + 500, src.length));
}
