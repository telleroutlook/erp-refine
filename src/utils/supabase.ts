// src/utils/supabase.ts
// Supabase client factory for Cloudflare Workers

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Env } from '../types/env';

/** Anon client — respects RLS, use for user-facing operations */
export function createSupabaseClient(env: Env): SupabaseClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Service role client — bypasses RLS, use ONLY for admin/background tasks */
export function createServiceClient(env: Env): SupabaseClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Create an authenticated Supabase client with a JWT */
export function createAuthenticatedClient(env: Env, jwt: string): SupabaseClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
}
