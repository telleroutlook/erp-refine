// src/types/env.ts
// Cloudflare Workers Env interface — all bindings declared here

export interface Env {
  // Supabase
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;

  // AI / LLM
  AI_API_KEY: string;
  AI_BASE_URL: string;        // e.g., 'https://open.bigmodel.cn/api/coding/paas/v4'
  AI_MODEL_PRIMARY: string;   // e.g., 'GLM-4.5-Air'
  AI_MODEL_FAST: string;      // e.g., 'GLM-4.5-Air'

  // Auth (JWT_SECRET is optional when using ES256/JWKS)
  JWT_SECRET?: string;

  // Config
  ENVIRONMENT: string;
  LOG_LEVEL: string;
  ALLOWED_ORIGINS: string;
  RATE_LIMIT_REQUESTS: string;
  RATE_LIMIT_PERIOD: string;

  // Cloudflare Bindings
  ASSETS: Fetcher;
  CACHE: KVNamespace;
  SESSIONS: KVNamespace;
  STORAGE: R2Bucket;
  EVENT_BUS: Queue;
  CHAT_DO: DurableObjectNamespace;
  RATE_LIMITER_DO: DurableObjectNamespace;
}
