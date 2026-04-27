// src/do/rate-limiter-do.ts
// Rate limiter Durable Object — sliding window counter

export class RateLimiterDO {
  private readonly state: DurableObjectState;
  private requests: number[] = [];

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const { limit, period } = await request.json<{ limit: number; period: number }>();
    const safeLimit = Math.min(Math.max(Number(limit) || 60, 1), 1000);
    const safePeriod = Math.min(Math.max(Number(period) || 60, 1), 3600);
    const now = Date.now();
    const windowMs = safePeriod * 1000;

    // Load stored requests
    const stored = await this.state.storage.get<number[]>('requests') ?? [];
    // Evict old entries
    this.requests = stored.filter((t) => now - t < windowMs);

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
