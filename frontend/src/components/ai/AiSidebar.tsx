import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button, Input, Spin, Tag, Tooltip, Typography, theme } from 'antd';
import {
  SendOutlined,
  RobotOutlined,
  ClearOutlined,
  LoadingOutlined,
  CheckCircleOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { MarkdownMessage } from './MarkdownMessage';

const { Text } = Typography;

interface ToolEvent {
  callId: string;
  name: string;
  status: 'running' | 'done';
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  toolEvents?: ToolEvent[];
}

const TOOL_LABELS: Record<string, string> = {
  get_sales_summary: '销售分析',
  get_procurement_summary: '采购分析',
  get_inventory_valuation: '库存估值',
  list_purchase_orders: '查询采购单',
  list_sales_orders: '查询销售单',
  list_products: '查询产品',
  list_customers: '查询客户',
  list_suppliers: '查询供应商',
  get_stock_levels: '库存查询',
  list_payment_requests: '付款申请',
  list_sales_invoices: '销售发票',
  list_supplier_invoices: '供应商发票',
};

function toolLabel(name: string) {
  return TOOL_LABELS[name] ?? name.replace(/_/g, ' ');
}

export const AiSidebar: React.FC = () => {
  const { token } = theme.useToken();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [activeTools, setActiveTools] = useState<ToolEvent[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const sessionId = useRef(crypto.randomUUID());

  const scrollRafRef = useRef(0);
  useEffect(() => {
    cancelAnimationFrame(scrollRafRef.current);
    scrollRafRef.current = requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  }, [messages, streamingText, activeTools]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || streaming) return;
    setInput('');
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'user', content: text, timestamp: new Date() }]);
    setStreaming(true);
    setStreamingText('');
    setActiveTools([]);

    const accessToken = localStorage.getItem('access_token');
    const controller = new AbortController();
    abortRef.current = controller;

    let accText = '';
    const toolEventsForMsg: ToolEvent[] = [];

    try {
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ message: text, sessionId: sessionId.current }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? '';

        for (const part of parts) {
          if (!part.trim()) continue;

          let eventType = 'message';
          let dataLine = '';

          for (const line of part.split('\n')) {
            if (line.startsWith('event:')) {
              eventType = line.slice(6).trim();
            } else if (line.startsWith('data:')) {
              dataLine = line.slice(5).trim();
            }
          }

          if (!dataLine) continue;

          let payload: Record<string, unknown>;
          try { payload = JSON.parse(dataLine); } catch { continue; }

          if (eventType === 'message' && payload.type === 'text') {
            accText += payload.delta as string;
            setStreamingText(accText);
          } else if (eventType === 'tool') {
            if (payload.type === 'tool_start') {
              const ev: ToolEvent = { callId: payload.callId as string, name: payload.name as string, status: 'running' };
              toolEventsForMsg.push(ev);
              setActiveTools([...toolEventsForMsg]);
            } else if (payload.type === 'tool_end') {
              const idx = toolEventsForMsg.findIndex((t) => t.callId === payload.callId);
              if (idx !== -1) toolEventsForMsg[idx] = { ...toolEventsForMsg[idx], status: 'done' };
              setActiveTools([...toolEventsForMsg]);
            }
          } else if (eventType === 'done' || eventType === 'error') {
            break;
          }
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: accText || '（无响应）',
          timestamp: new Date(),
          toolEvents: toolEventsForMsg.length > 0 ? [...toolEventsForMsg] : undefined,
        },
      ]);
    } catch (err: unknown) {
      if ((err as Error).name !== 'AbortError') {
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: 'assistant', content: '网络错误，请重试。', timestamp: new Date() },
        ]);
      }
    } finally {
      setStreaming(false);
      setStreamingText('');
      setActiveTools([]);
      abortRef.current = null;
    }
  }, [streaming]);

  const clear = useCallback(() => {
    stop();
    setMessages([]);
    setStreamingText('');
    setActiveTools([]);
    sessionId.current = crypto.randomUUID();
  }, [stop]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: token.colorBgContainer }}>
      {/* Header */}
      <div style={{
        padding: '10px 12px',
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        background: 'var(--ai-gradient)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <RobotOutlined style={{ color: '#fff', fontSize: 16 }} />
          <Text strong style={{ color: '#fff', fontSize: 14 }}>AI 助手</Text>
        </div>
        <Tooltip title="清空对话">
          <Button
            type="text"
            size="small"
            icon={<ClearOutlined style={{ color: '#ffffff' }} />}
            onClick={clear}
          />
        </Tooltip>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px 12px 4px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}>
        {messages.length === 0 && !streaming && (
          <div style={{ textAlign: 'center', paddingTop: 48 }}>
            <RobotOutlined style={{ fontSize: 32, color: token.colorTextQuaternary, marginBottom: 12 }} />
            <div style={{ color: token.colorTextSecondary, fontSize: 13 }}>您好！请告诉我您需要什么帮助。</div>
            <div style={{ color: token.colorTextSecondary, fontSize: 12, marginTop: 4 }}>
              例如：销售分析、查看采购订单、库存情况...
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id}>
            {msg.role === 'assistant' && msg.toolEvents && msg.toolEvents.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 4, paddingLeft: 4 }}>
                {msg.toolEvents.map((t) => (
                  <Tag
                    key={t.callId}
                    icon={<CheckCircleOutlined />}
                    color="success"
                    style={{ fontSize: 11 }}
                  >
                    {toolLabel(t.name)}
                  </Tag>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '90%',
                padding: '8px 12px',
                borderRadius: msg.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                background: msg.role === 'user' ? 'var(--ai-primary)' : 'var(--ai-bg-bubble)',
                color: msg.role === 'user' ? '#fff' : token.colorText,
                fontSize: 13,
                lineHeight: 1.6,
                border: msg.role === 'assistant' ? '1px solid var(--ai-border-bubble)' : 'none',
                wordBreak: 'break-word',
              }}>
                {msg.role === 'assistant' ? (
                  <MarkdownMessage content={msg.content} />
                ) : (
                  <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Streaming state */}
        {streaming && (
          <div>
            {activeTools.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 4, paddingLeft: 4 }}>
                {activeTools.map((t) => (
                  <Tag
                    key={t.callId}
                    icon={t.status === 'running' ? <LoadingOutlined /> : <CheckCircleOutlined />}
                    color={t.status === 'running' ? 'processing' : 'success'}
                    style={{ fontSize: 11 }}
                  >
                    {toolLabel(t.name)}
                  </Tag>
                ))}
              </div>
            )}

            {streamingText ? (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                  maxWidth: '90%',
                  padding: '8px 12px',
                  borderRadius: '12px 12px 12px 4px',
                  background: 'var(--ai-bg-bubble)',
                  border: '1px solid var(--ai-border-bubble)',
                  fontSize: 13,
                  lineHeight: 1.6,
                }}>
                  <MarkdownMessage content={streamingText} />
                  <span style={{ display: 'inline-block', width: 6, height: 14, background: 'var(--ai-primary)', borderRadius: 1, marginLeft: 2, verticalAlign: 'middle', animation: 'blink 1s step-end infinite' }} />
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ padding: '8px 12px', background: 'var(--ai-bg-bubble)', borderRadius: '12px 12px 12px 4px', border: '1px solid var(--ai-border-bubble)' }}>
                  <Spin size="small" indicator={<LoadingOutlined />} />
                  <span style={{ marginLeft: 8, fontSize: 12, color: token.colorTextSecondary }}>
                    {activeTools.some((t) => t.status === 'running') ? '执行中...' : '思考中...'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '10px 12px',
        borderTop: `1px solid ${token.colorBorderSecondary}`,
        display: 'flex',
        gap: 8,
        flexShrink: 0,
        background: 'var(--ai-input-bg)',
      }}>
        <Input.TextArea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage(input);
            }
          }}
          placeholder="输入问题，Enter 发送，Shift+Enter 换行..."
          disabled={streaming}
          autoSize={{ minRows: 1, maxRows: 4 }}
          style={{ fontSize: 13, resize: 'none' }}
        />
        {streaming ? (
          <Button
            type="default"
            danger
            icon={<ThunderboltOutlined />}
            onClick={stop}
            style={{ flexShrink: 0 }}
          />
        ) : (
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={() => sendMessage(input)}
            disabled={!input.trim()}
            style={{ flexShrink: 0, background: 'var(--ai-primary)', borderColor: 'var(--ai-primary)' }}
          />
        )}
      </div>
    </div>
  );
};
