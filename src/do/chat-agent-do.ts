// src/do/chat-agent-do.ts
// Chat Agent Durable Object — maintains per-session conversation state with auto-summarization

import type { Env } from '../types/env';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const MAX_MESSAGES = 50;
const SUMMARY_THRESHOLD = 30; // trigger summarization queue job when exceeding this

export class ERPChatAgent {
  private readonly state: DurableObjectState;
  private readonly env: Env;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.endsWith('/history') && request.method === 'GET') {
      const messages = await this.state.storage.get<Message[]>('messages') ?? [];
      const summary = await this.state.storage.get<string>('summary') ?? null;
      return Response.json({ messages, summary });
    }

    // Returns last N messages (for context injection into LLM prompts)
    if (url.pathname.endsWith('/history/recent') && request.method === 'GET') {
      const n = Number(url.searchParams.get('n') ?? '10');
      const messages = await this.state.storage.get<Message[]>('messages') ?? [];
      const summary = await this.state.storage.get<string>('summary') ?? null;
      return Response.json({ messages: messages.slice(-n), summary });
    }

    if (url.pathname.endsWith('/message') && request.method === 'POST') {
      const { role, content } = await request.json<Message>();
      const messages = await this.state.storage.get<Message[]>('messages') ?? [];
      messages.push({ role, content, timestamp: new Date().toISOString() });

      if (messages.length > MAX_MESSAGES) messages.splice(0, messages.length - MAX_MESSAGES);

      await this.state.storage.put('messages', messages);

      // Trigger async summarization when history is long enough
      const shouldSummarize = messages.length >= SUMMARY_THRESHOLD
        && !await this.state.storage.get<boolean>('summarizing');

      if (shouldSummarize) {
        const sessionId = url.pathname.split('/')[1] ?? 'unknown';
        this.state.waitUntil(this.triggerSummarization(sessionId, messages));
      }

      return Response.json({ success: true, count: messages.length });
    }

    // Store a generated summary (called by queue consumer after async summarization)
    if (url.pathname.endsWith('/summary') && request.method === 'POST') {
      const { summary } = await request.json<{ summary: string }>();
      await this.state.storage.put('summary', summary);
      await this.state.storage.delete('summarizing');
      return Response.json({ success: true });
    }

    if (url.pathname.endsWith('/clear') && request.method === 'POST') {
      await this.state.storage.delete('messages');
      await this.state.storage.delete('summary');
      await this.state.storage.delete('summarizing');
      return Response.json({ success: true });
    }

    return new Response('Not found', { status: 404 });
  }

  private async triggerSummarization(sessionId: string, messages: Message[]): Promise<void> {
    try {
      await this.state.storage.put('summarizing', true);
      await this.env.EVENT_BUS.send({
        type: 'summarize_session',
        sessionId,
        messageCount: messages.length,
        // Pass last 30 messages for summarization (avoid huge payloads)
        recentMessages: messages.slice(-30),
      } as never);
    } catch {
      await this.state.storage.delete('summarizing');
    }
  }
}
