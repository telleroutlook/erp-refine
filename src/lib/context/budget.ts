// src/lib/context/budget.ts
// Token budget management: Chinese-aware estimation, complexity-based allocation, progressive compaction

import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import type { Env } from '../../types/env';

// ─── Token estimation ────────────────────────────────────────────────────────

const CJK_RANGES = [
  [0x4e00, 0x9fff],   // CJK Unified Ideographs
  [0x3400, 0x4dbf],   // CJK Extension A
  [0x20000, 0x2a6df], // CJK Extension B
  [0xf900, 0xfaff],   // CJK Compatibility Ideographs
  [0x2e80, 0x2eff],   // CJK Radicals Supplement
  [0x3000, 0x303f],   // CJK Symbols and Punctuation
];

function isCJK(cp: number): boolean {
  return CJK_RANGES.some((range) => {
    const lo = range[0] ?? 0;
    const hi = range[1] ?? 0;
    return cp >= lo && cp <= hi;
  });
}

export function estimateTokens(text: string): number {
  if (!text) return 0;
  let tokens = 0;
  for (const ch of text) {
    const cp = ch.codePointAt(0) ?? 0;
    if (isCJK(cp)) {
      tokens += 0.6;
    } else if (cp < 128) {
      tokens += 0.25;
    } else {
      tokens += 0.5;
    }
  }
  return Math.ceil(tokens);
}

// ─── Complexity classification ───────────────────────────────────────────────

export type QueryComplexity = 'simple' | 'moderate' | 'complex';

export function classifyComplexity(query: string, hasHistory: boolean): QueryComplexity {
  const len = query.length;

  if (len < 15 || /^(你好|hi|hello|hey|嗨|在吗|谢谢|好的|ok)/i.test(query)) {
    return 'simple';
  }

  if (
    /总结|汇总|分析|报告|对比|趋势|预测|summary|analyze|report|compare|forecast/i.test(query)
    || len > 150
  ) {
    return 'complex';
  }

  if (hasHistory && len < 40) return 'simple';

  return 'moderate';
}

// ─── Budget profiles ─────────────────────────────────────────────────────────

// Total context window (conservative for GLM/Gemini compatibility)
const CONTEXT_WINDOW = 32_000;
const OUTPUT_RESERVE = 4_096;

const BUDGET_PROFILES: Record<QueryComplexity, Record<string, number>> = {
  simple: {
    system_prompt: 1_500,
    history_summary: 800,
    recent_messages: 6_000,
    tool_descriptions: 1_500,
  },
  moderate: {
    system_prompt: 2_000,
    history_summary: 1_000,
    recent_messages: 12_000,
    tool_descriptions: 2_000,
  },
  complex: {
    system_prompt: 2_500,
    history_summary: 1_500,
    recent_messages: 18_000,
    tool_descriptions: 2_500,
  },
};

export interface BudgetAllocation {
  totalBudget: number;
  outputReserve: number;
  usableBudget: number;
  layers: Map<string, number>;
  pressure: 'low' | 'medium' | 'high';
}

export function allocateBudget(
  complexity: QueryComplexity,
  presentLayers: string[]
): BudgetAllocation {
  const profile = BUDGET_PROFILES[complexity];
  const present = new Set(presentLayers);
  const usableBudget = CONTEXT_WINDOW - OUTPUT_RESERVE;

  // Redistribute absent layers' budget proportionally to present layers
  let absentTotal = 0;
  let presentTotal = 0;
  for (const [id, amount] of Object.entries(profile)) {
    if (present.has(id)) presentTotal += amount;
    else absentTotal += amount;
  }

  const layers = new Map<string, number>();
  for (const id of presentLayers) {
    const base = profile[id] ?? 0;
    const bonus = presentTotal > 0 ? Math.floor((absentTotal * base) / presentTotal) : 0;
    layers.set(id, Math.min(base + bonus, usableBudget));
  }

  return {
    totalBudget: CONTEXT_WINDOW,
    outputReserve: OUTPUT_RESERVE,
    usableBudget,
    layers,
    pressure: 'low',
  };
}

// ─── Context layers ───────────────────────────────────────────────────────────

export interface ContextLayer {
  id: string;
  content: string;
  actualTokens: number;
  compressible: boolean;
  truncatable: boolean;
}

function recalcPressure(budget: BudgetAllocation, layers: ContextLayer[]): void {
  const totalUsed = layers.reduce((sum, l) => sum + l.actualTokens, 0);
  const ratio = totalUsed / budget.usableBudget;
  if (ratio > 0.95) budget.pressure = 'high';
  else if (ratio > 0.8) budget.pressure = 'medium';
  else budget.pressure = 'low';
}

// Stage 1: cap individual messages to 800 tokens each
function budgetCap(layers: ContextLayer[]): number {
  const CAP = 800;
  let freed = 0;
  for (const layer of layers) {
    if (layer.id !== 'recent_messages' || !layer.truncatable) continue;

    const lines = layer.content.split('\n');
    const capped: string[] = [];
    for (const line of lines) {
      const lineTokens = estimateTokens(line);
      if (lineTokens > CAP) {
        const truncated = line.slice(0, CAP * 4); // rough char-to-token ratio
        freed += lineTokens - estimateTokens(truncated);
        capped.push(truncated + '…');
      } else {
        capped.push(line);
      }
    }
    layer.content = capped.join('\n');
    layer.actualTokens = estimateTokens(layer.content);
  }
  return freed;
}

// Stage 2: remove oldest messages (keep at least 5)
function snipOldest(layers: ContextLayer[]): number {
  const layer = layers.find((l) => l.id === 'recent_messages' && l.truncatable);
  if (!layer) return 0;

  const lines = layer.content.split('\n').filter(Boolean);
  if (lines.length <= 5) return 0;

  const toRemove = Math.max(1, Math.floor(lines.length * 0.2));
  const before = layer.actualTokens;
  layer.content = lines.slice(toRemove).join('\n');
  layer.actualTokens = estimateTokens(layer.content);
  return before - layer.actualTokens;
}

// Stage 3: LLM compress compressible layers
async function llmCompress(layers: ContextLayer[], env: Env): Promise<number> {
  const glm = createOpenAI({ apiKey: env.AI_API_KEY, baseURL: env.AI_BASE_URL });

  const candidates = layers.filter((l) => l.compressible && l.actualTokens >= 500);
  if (candidates.length === 0) return 0;

  const results = await Promise.all(
    candidates.map(async (layer) => {
      try {
        const input = layer.content.slice(0, 3_000 * 3);
        const { text } = await generateText({
          model: glm.chat(env.AI_MODEL_NO_TOOLS ?? 'GLM-4.5-Air'),
          system: '请将以下内容压缩为简洁的中文摘要，保留关键业务信息，不超过200字。',
          prompt: input,
          maxOutputTokens: 300,
          temperature: 0,
        });
        const before = layer.actualTokens;
        layer.content = text;
        layer.actualTokens = estimateTokens(text);
        return before - layer.actualTokens;
      } catch {
        return 0;
      }
    })
  );

  return results.reduce((sum, freed) => sum + freed, 0);
}

export interface CompactionResult {
  tokensFreed: number;
  stagesApplied: string[];
  finalPressure: 'low' | 'medium' | 'high';
}

export async function runCompaction(
  layers: ContextLayer[],
  budget: BudgetAllocation,
  env: Env
): Promise<CompactionResult> {
  recalcPressure(budget, layers);
  if (budget.pressure === 'low') return { tokensFreed: 0, stagesApplied: [], finalPressure: 'low' };

  const stagesApplied: string[] = [];
  let totalFreed = 0;

  type Stage = { name: string; run: () => Promise<number> | number };
  const stages: Stage[] = [
    { name: 'budgetCap', run: () => budgetCap(layers) },
    { name: 'snipOldest', run: () => snipOldest(layers) },
    { name: 'llmCompress', run: () => llmCompress(layers, env) },
  ];

  for (const stage of stages) {
    recalcPressure(budget, layers);
    if ((budget.pressure as string) === 'low') break;

    const freed = await stage.run();
    if (freed > 0) {
      totalFreed += freed;
      stagesApplied.push(stage.name);
    }
  }

  recalcPressure(budget, layers);
  return { tokensFreed: totalFreed, stagesApplied, finalPressure: budget.pressure };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Truncate text to a token budget, returning truncated text and actual token count */
export function truncateToTokenBudget(text: string, maxTokens: number): { text: string; tokens: number } {
  const tokens = estimateTokens(text);
  if (tokens <= maxTokens) return { text, tokens };

  // Binary search approximate char count
  let lo = 0;
  let hi = text.length;
  while (hi - lo > 10) {
    const mid = Math.floor((lo + hi) / 2);
    if (estimateTokens(text.slice(0, mid)) <= maxTokens) lo = mid;
    else hi = mid;
  }
  const truncated = text.slice(0, lo) + '…';
  return { text: truncated, tokens: estimateTokens(truncated) };
}
