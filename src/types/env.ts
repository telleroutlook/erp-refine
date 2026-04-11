// src/types/env.ts
// Cloudflare Workers Env interface — all bindings declared here

export interface Env {
  // Supabase
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;

  // AI / LLM
  AI_API_KEY: string;
  AI_MODEL_PRIMARY: string;   // e.g., 'claude-sonnet-4-6'
  AI_MODEL_FAST: string;      // e.g., 'claude-haiku-4-5-20251001'

  // Auth
  JWT_SECRET: string;

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
