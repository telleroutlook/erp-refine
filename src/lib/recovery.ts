// src/lib/recovery.ts
// Multi-tier error recovery chain for AI agent calls
// Strategies: token-overflow → model-fallback → tool-failure → content-refusal → final-fallback

import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import type { Env } from '../types/env';
import { createLogger } from '../utils/logger';

const logger = createLogger('info', { module: 'recovery' });

// ─── Error detection ──────────────────────────────────────────────────────────

const REFUSAL_PATTERNS = [
  '敏感', 'sensitive', '无法回答', '无法提供', '不适合讨论',
  '内容安全', 'content_filter', '违反', 'violation', 'policy',
  '审核', 'moderation', '不当内容', 'inappropriate',
];

export function isTokenOverflow(error: unknown): boolean {
  const msg = String(error).toLowerCase();
  return /context.*length|too.*long|max.*token|token.*limit|prompt.*too/i.test(msg);
}

export function isApiServerError(error: unknown): boolean {
  const msg = String(error);
  const status = extractHttpStatus(error);
  if (status && status >= 500) return true;
  if (error instanceof DOMException && error.name === 'AbortError') return true;
  return /timeout|ECONNRESET|ETIMEDOUT|network.*error|fetch.*failed/i.test(msg);
}

export function isContentRefusal(error: unknown): boolean {
  const msg = String(error).toLowerCase();
  if (msg.includes('content refusal detected')) return true;
  return REFUSAL_PATTERNS.some((p) => msg.includes(p));
}

export function isEmptyOrRefusal(text: string): boolean {
  if (!text?.trim()) return true;
  const lower = text.trim().toLowerCase();
  if (lower.length > 200) return false;
  return REFUSAL_PATTERNS.some((p) => lower.includes(p));
}

function extractHttpStatus(error: unknown): number | undefined {
  if (typeof error === 'object' && error !== null) {
    const e = error as Record<string, unknown>;
    if (typeof e.status === 'number') return e.status;
    if (typeof e.statusCode === 'number') return e.statusCode;
  }
  const match = /HTTP (\d{3})/.exec(String(error));
  return match?.[1] ? parseInt(match[1], 10) : undefined;
}

// ─── Recovery context ─────────────────────────────────────────────────────────

export interface RecoveryParams {
  systemPrompt: string;
  prompt: string;
  maxTokens: number;
  temperature: number;
  primaryModel: string;
  fallbackModel: string;
}

export interface RecoveryResult {
  text: string;
  modelUsed: string;
  recoverySteps: string[];
}

// ─── Recovery chain ───────────────────────────────────────────────────────────

export async function executeWithRecovery(
  fn: (params: RecoveryParams) => Promise<string>,
  params: RecoveryParams,
  env: Env,
  maxAttempts = 3
): Promise<RecoveryResult> {
  let current = { ...params };
  const recoverySteps: string[] = [];
  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const text = await fn(current);

      if (isEmptyOrRefusal(text)) {
        throw new Error('content refusal detected');
      }

      return { text, modelUsed: current.primaryModel, recoverySteps };
    } catch (err) {
      lastError = err;
      logger.warn('recovery.attempt', { attempt, error: String(err).slice(0, 200) });

      // Strategy 1: token overflow — compress system prompt
      if (isTokenOverflow(err) && attempt === 0) {
        recoverySteps.push('token-overflow');
        current = {
          ...current,
          systemPrompt: current.systemPrompt.slice(0, Math.floor(current.systemPrompt.length * 0.5)),
          maxTokens: Math.min(current.maxTokens, 1500),
        };
        continue;
      }

      // Strategy 2: content refusal — switch to fallback model
      if (isContentRefusal(err) && attempt <= 1) {
        recoverySteps.push('content-refusal-model-switch');
        current = { ...current, primaryModel: current.fallbackModel };
        continue;
      }

      // Strategy 3: API/server error — switch to fallback model
      if (isApiServerError(err) && attempt <= 1) {
        recoverySteps.push('api-error-model-fallback');
        current = { ...current, primaryModel: current.fallbackModel };
        continue;
      }

      // Strategy 4: any other error on last attempt — try minimal prompt
      if (attempt === maxAttempts - 2) {
        recoverySteps.push('minimal-prompt');
        current = {
          ...current,
          primaryModel: current.fallbackModel,
          systemPrompt: 'You are a helpful ERP assistant. Answer concisely.',
          maxTokens: 800,
        };
        continue;
      }

      // No strategy matched — continue retrying up to maxAttempts
      if (attempt < maxAttempts - 1) {
        recoverySteps.push(`retry-attempt-${attempt}`);
        continue;
      }
      break;
    }
  }

  // Final fallback: lightweight direct generation
  try {
    recoverySteps.push('final-fallback');
    const glm = createOpenAI({ apiKey: env.AI_API_KEY, baseURL: env.AI_BASE_URL });
    const { text } = await generateText({
      model: glm.chat(env.AI_MODEL_NO_TOOLS ?? 'GLM-4.5-Air'),
      system: 'You are a helpful ERP assistant.',
      prompt: current.prompt.slice(0, 500),
      maxOutputTokens: 500,
      temperature: 0.3,
    });

    if (!isEmptyOrRefusal(text)) {
      return { text, modelUsed: env.AI_MODEL_NO_TOOLS ?? 'GLM-4.5-Air', recoverySteps };
    }
  } catch {
    recoverySteps.push('final-fallback-failed');
  }

  logger.error('recovery.exhausted', {
    steps: recoverySteps,
    lastError: String(lastError).slice(0, 300),
  });

  return {
    text: '抱歉，我暂时无法处理您的请求，请稍后再试或联系系统管理员。',
    modelUsed: 'fallback',
    recoverySteps,
  };
}
