#!/usr/bin/env node
// scripts/validate-schema.js
// Validates CLAUDE.md column name quick reference against migration files

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const claudeMd = readFileSync(join(process.cwd(), 'CLAUDE.md'), 'utf-8');
const migrationsDir = join(process.cwd(), 'supabase/migrations');
const migrations = readdirSync(migrationsDir)
  .filter((f) => f.endsWith('.sql'))
  .map((f) => readFileSync(join(migrationsDir, f), 'utf-8'))
  .join('\n');

// Extract column mappings from CLAUDE.md
const rowRegex = /\| `([^`]+)` \| `([^`]+)` \|/g;
let match;
const violations = [];

while ((match = rowRegex.exec(claudeMd)) !== null) {
  const [, table, correctCol] = match;
  if (!table || !correctCol) continue;
  if (table === '表' || correctCol === '正确列名') continue; // Skip header

  // Check correct column exists in migrations
  const colExists = migrations.includes(correctCol);
  if (!colExists) {
    violations.push(`Table '${table}': correct column '${correctCol}' not found in migrations`);
  }
}

if (violations.length > 0) {
  console.error('Schema validation failures:');
  violations.forEach((v) => console.error(' -', v));
  process.exit(1);
} else {
  console.log('✅ Schema column name validation passed');
}
