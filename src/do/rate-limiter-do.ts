// src/do/rate-limiter-do.ts
// Rate limiter Durable Object — sliding window counter

const DEFAULT_LIMIT = 100;
const DEFAULT_PERIOD = 60;

export class RateLimiterDO {
  private readonly state: DurableObjectState;
  private requests: number[] = [];
  private initialized = false;

  constructor(state: DurableObjectState) {
    this.state = state;
    this.state.blockConcurrencyWhile(async () => {
      this.requests = await this.state.storage.get<number[]>('requests') ?? [];
      this.initialized = true;
    });
  }

  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const url = new URL(request.url);
    const safeLimit = Math.min(Math.max(parseInt(url.searchParams.get('limit') ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT, 1), 1000);
    const safePeriod = Math.min(Math.max(parseInt(url.searchParams.get('period') ?? String(DEFAULT_PERIOD), 10) || DEFAULT_PERIOD, 1), 3600);
    const now = Date.now();
    const windowMs = safePeriod * 1000;

    this.requests = this.requests.filter((t) => now - t < windowMs);

    if (this.requests.length >= safeLimit) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    this.requests.push(now);
    await this.state.storage.put('requests', this.requests);

    return new Response(JSON.stringify({ remaining: safeLimit - this.requests.length }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
