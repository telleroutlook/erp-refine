// src/do/chat-agent-do.ts
// Chat Agent Durable Object — maintains per-session conversation state

import type { Env } from '../types/env';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

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
      return Response.json({ messages });
    }

    if (url.pathname.endsWith('/message') && request.method === 'POST') {
      const { role, content } = await request.json<Message>();
      const messages = await this.state.storage.get<Message[]>('messages') ?? [];
      messages.push({ role, content, timestamp: new Date().toISOString() });

      // Keep last 50 messages
      if (messages.length > 50) messages.splice(0, messages.length - 50);

      await this.state.storage.put('messages', messages);
      return Response.json({ success: true, count: messages.length });
    }

    if (url.pathname.endsWith('/clear') && request.method === 'POST') {
      await this.state.storage.delete('messages');
      return Response.json({ success: true });
    }

    return new Response('Not found', { status: 404 });
  }
}
