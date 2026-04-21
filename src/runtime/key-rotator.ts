// src/runtime/key-rotator.ts
// API Key rotation with 429/rate-limit tracking
// Supports up to 3 keys; tracks exhaustion per key and rotates automatically

import { createLogger } from '../utils/logger';

const logger = createLogger('info', { module: 'key-rotator' });

interface KeyState {
  exhaustedAt: number | null;
  requests: number;
}

// In-memory per-isolate key state (resets on worker restart, acceptable for rate-limiting)
const keyStates = new Map<string, KeyState>();

function getState(key: string): KeyState {
  if (!keyStates.has(key)) {
    keyStates.set(key, { exhaustedAt: null, requests: 0 });
  }
  return keyStates.get(key)!;
}

const EXHAUSTED_TTL_MS = 60_000; // cool-down before retrying an exhausted key

/** Check if an HTTP error indicates rate limiting */
export function isRateLimitError(error: unknown): boolean {
  const msg = String(error).toLowerCase();
  const status = (error as { status?: number })?.status;
  if (status === 429) return true;
  return /rate.?limit|quota.*exceed|too many request/i.test(msg);
}

/** Mark a key as rate-limited */
export function markKeyExhausted(key: string): void {
  const state = getState(key);
  state.exhaustedAt = Date.now();
  logger.warn('key.exhausted', { keySuffix: key.slice(-4) });
}

/** Get next available key from a list, skipping exhausted ones */
export function pickAvailableKey(keys: string[]): string {
  const now = Date.now();

  // Shuffle for load distribution using cryptographically secure randomness
  const arr = [...keys];
  for (let i = arr.length - 1; i > 0; i--) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    const j = buf[0]! % (i + 1);
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  const shuffled = arr;

  for (const key of shuffled) {
    const state = getState(key);
    if (state.exhaustedAt === null) return key;
    // Cool-down period passed — try again
    if (now - state.exhaustedAt > EXHAUSTED_TTL_MS) {
      state.exhaustedAt = null;
      return key;
    }
  }

  // All keys exhausted — return the one that went down earliest (closest to recovery)
  const sorted = keys.slice().sort((a, b) => {
    const aState = getState(a);
    const bState = getState(b);
    return (aState.exhaustedAt ?? 0) - (bState.exhaustedAt ?? 0);
  });

  logger.warn('key.all-exhausted', { count: keys.length });
  return sorted[0] ?? keys[0]!;
}

/** Execute a function with automatic key rotation on 429 */
export async function withKeyRotation<T>(
  keys: string[],
  fn: (key: string) => Promise<T>
): Promise<T> {
  const key = pickAvailableKey(keys);
  try {
    const result = await fn(key);
    return result;
  } catch (err) {
    if (isRateLimitError(err)) {
      markKeyExhausted(key);
      const remaining = keys.filter((k) => k !== key);
      if (remaining.length > 0) {
        const nextKey = pickAvailableKey(remaining);
        return fn(nextKey);
      }
    }
    throw err;
  }
}

/** Get ordered list of API keys from env (primary + optional fallbacks) */
export function getApiKeys(env: { AI_API_KEY: string; AI_API_KEY_2?: string; AI_API_KEY_3?: string }): string[] {
  return [env.AI_API_KEY, env.AI_API_KEY_2, env.AI_API_KEY_3].filter((k): k is string => !!k);
}
