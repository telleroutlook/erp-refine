#!/usr/bin/env node
// scripts/check-registry.js
// Validates tool registry: all registered tools have policy coverage

import { readFileSync } from 'fs';
import { join } from 'path';

const registryFile = readFileSync(join(process.cwd(), 'src/tools/tool-registry.ts'), 'utf-8');
const procRules = readFileSync(join(process.cwd(), 'src/policy/rules/procurement-rules.ts'), 'utf-8');
const salesRules = readFileSync(join(process.cwd(), 'src/policy/rules/sales-rules.ts'), 'utf-8');
const financeRules = readFileSync(join(process.cwd(), 'src/policy/rules/finance-rules.ts'), 'utf-8');
const mfgRules = readFileSync(join(process.cwd(), 'src/policy/rules/manufacturing-rules.ts'), 'utf-8');
const qualityRules = readFileSync(join(process.cwd(), 'src/policy/rules/quality-rules.ts'), 'utf-8');
const allRules = procRules + salesRules + financeRules + mfgRules + qualityRules;

// Extract tool names from registry meta
const toolMetaRegex = /\{ name: '([^']+)', domain: '([^']+)', level: (\d)/g;
const tools = [];
let match;
while ((match = toolMetaRegex.exec(registryFile)) !== null) {
  tools.push({ name: match[1], domain: match[2], level: parseInt(match[3], 10) });
}

let errors = 0;
let warnings = 0;

for (const tool of tools) {
  if (tool.level >= 2) {
    // D2+ tools must have explicit policy rule
    const hasRule = allRules.includes(tool.name) || allRules.includes(tool.name.replace(/_/g, '-'));
    if (!hasRule) {
      console.warn(`⚠️  D${tool.level} tool '${tool.name}' (${tool.domain}) has no explicit policy rule`);
      errors++;
    }
  }
}

console.log(`\n✅ Registry check complete: ${tools.length} tools found`);
if (warnings > 0) console.log(`⚠️  ${warnings} warnings`);
if (errors > 0) {
  console.error(`❌ ${errors} errors`);
  process.exit(1);
}
