// src/do/rate-limiter-do.ts
// Rate limiter Durable Object — token bucket algorithm (O(1) storage)

const DEFAULT_LIMIT = 100;
const DEFAULT_PERIOD = 60;

interface BucketState {
  tokens: number;
  lastRefill: number;
}

export class RateLimiterDO {
  private readonly state: DurableObjectState;
  private bucket: BucketState = { tokens: DEFAULT_LIMIT, lastRefill: Date.now() };

  constructor(state: DurableObjectState) {
    this.state = state;
    this.state.blockConcurrencyWhile(async () => {
      const stored = await this.state.storage.get<BucketState>('bucket');
      if (stored) this.bucket = stored;
    });
  }

  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const url = new URL(request.url);
    const maxTokens = Math.min(Math.max(
      parseInt(url.searchParams.get('limit') ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT, 1), 1000);
    const periodSec = Math.min(Math.max(
      parseInt(url.searchParams.get('period') ?? String(DEFAULT_PERIOD), 10) || DEFAULT_PERIOD, 1), 3600);

    const now = Date.now();
    const periodMs = periodSec * 1000;
    const elapsed = now - this.bucket.lastRefill;
    const refillRate = maxTokens / periodMs;

    this.bucket.tokens = Math.min(maxTokens, this.bucket.tokens + elapsed * refillRate);
    this.bucket.lastRefill = now;

    if (this.bucket.tokens < 1) {
      await this.state.storage.put('bucket', this.bucket);
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    this.bucket.tokens -= 1;
    await this.state.storage.put('bucket', this.bucket);

    return new Response(JSON.stringify({ remaining: Math.floor(this.bucket.tokens) }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
