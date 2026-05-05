import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button, Input, Spin, Tag, Tooltip, Typography, theme } from 'antd';
import {
  SendOutlined,
  RobotOutlined,
  ClearOutlined,
  CloseOutlined,
  LoadingOutlined,
  CheckCircleOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useLogout } from '@refinedev/core';
import { MarkdownMessage } from './MarkdownMessage';
import { DraftCard } from './DraftCard';
import { DraftPreviewDrawer } from './DraftPreviewDrawer';
import type { DraftCardData } from '../../hooks/useDraft';
import { getAccessToken } from '../../providers/token';

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
  draftCards?: DraftCardData[];
}

function toolLabel(name: string, t: (key: string, opts?: Record<string, unknown>) => string) {
  return t(`tools.${name}`, { defaultValue: name.replace(/_/g, ' ') });
}

interface AiSidebarProps {
  onClose?: () => void;
}

export const AiSidebar: React.FC<AiSidebarProps> = ({ onClose }) => {
  const MAX_VISIBLE_MESSAGES = 50;

  const { token } = theme.useToken();
  const { t } = useTranslation();
  const { mutate: logout } = useLogout();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [activeTools, setActiveTools] = useState<ToolEvent[]>([]);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const sessionId = useRef(crypto.randomUUID());
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const userScrolledUpRef = useRef(false);

  const scrollRafRef = useRef(0);
  useEffect(() => {
    if (userScrolledUpRef.current) return;
    cancelAnimationFrame(scrollRafRef.current);
    scrollRafRef.current = requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
    return () => cancelAnimationFrame(scrollRafRef.current);
  }, [messages, streamingText, activeTools]);

  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  const handleScroll = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    userScrolledUpRef.current = distanceFromBottom > 60;
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || streaming) return;
    userScrolledUpRef.current = false;
    setInput('');
    setMessages((prev) => {
      const next = [...prev, { id: crypto.randomUUID(), role: 'user' as const, content: text, timestamp: new Date() }];
      return next.length > MAX_VISIBLE_MESSAGES ? next.slice(-MAX_VISIBLE_MESSAGES) : next;
    });
    setStreaming(true);
    setStreamingText('');
    setActiveTools([]);

    const accessToken = getAccessToken();
    const controller = new AbortController();
    abortRef.current = controller;

    let accText = '';
    const toolEventsForMsg: ToolEvent[] = [];
    const draftCardsForMsg: DraftCardData[] = [];

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

      if (res.status === 401) {
        setStreaming(false);
        logout();
        return;
      }
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let streamEnded = false;

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
              const idx = toolEventsForMsg.findIndex((te) => te.callId === payload.callId);
              if (idx !== -1) toolEventsForMsg[idx] = { ...toolEventsForMsg[idx], status: 'done' };
              setActiveTools([...toolEventsForMsg]);
            }
          } else if (eventType === 'draft' && payload.type === 'draft_card') {
            draftCardsForMsg.push(payload as unknown as DraftCardData);
          } else if (eventType === 'done' || eventType === 'error') {
            streamEnded = true;
            break;
          }
        }
        if (streamEnded) break;
      }

      setMessages((prev) => {
        const next = [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant' as const,
            content: accText || `(${t('ai.networkError')})`,
            timestamp: new Date(),
            toolEvents: toolEventsForMsg.length > 0 ? [...toolEventsForMsg] : undefined,
            draftCards: draftCardsForMsg.length > 0 ? [...draftCardsForMsg] : undefined,
          },
        ];
        return next.length > MAX_VISIBLE_MESSAGES ? next.slice(-MAX_VISIBLE_MESSAGES) : next;
      });
    } catch (err: unknown) {
      if ((err as Error).name !== 'AbortError') {
        setMessages((prev) => {
          const next = [
            ...prev,
            { id: crypto.randomUUID(), role: 'assistant' as const, content: t('ai.networkError'), timestamp: new Date() },
          ];
          return next.length > MAX_VISIBLE_MESSAGES ? next.slice(-MAX_VISIBLE_MESSAGES) : next;
        });
      }
    } finally {
      setStreaming(false);
      setStreamingText('');
      setActiveTools([]);
      abortRef.current = null;
    }
  }, [streaming, t, logout]);

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
        padding: '12px',
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        background: 'var(--ai-gradient)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {onClose && (
            <Button
              type="text"
              size="small"
              icon={<CloseOutlined style={{ color: 'var(--sider-text-active)' }} />}
              onClick={onClose}
            />
          )}
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--ai-icon-bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <RobotOutlined style={{ color: 'var(--sider-text-active)', fontSize: 15 }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3, minWidth: 0 }}>
            <Text strong style={{ color: 'var(--sider-text-active)', fontSize: 14 }}>{t('ai.assistant')}</Text>
            <Text style={{ color: 'var(--ai-subtitle-color)', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Enterprise Intelligence</Text>
          </div>
        </div>
        <Tooltip title={t('ai.clearChat')}>
          <Button
            type="text"
            size="small"
            icon={<ClearOutlined style={{ color: 'var(--sider-text-active)' }} />}
            onClick={clear}
          />
        </Tooltip>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px 12px 4px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}>
        {messages.length === 0 && !streaming && (
          <div style={{ textAlign: 'center', paddingTop: 48 }}>
            <RobotOutlined style={{ fontSize: 32, color: token.colorTextQuaternary, marginBottom: 12 }} />
            <div style={{ color: token.colorTextSecondary, fontSize: 13 }}>{t('ai.greeting')}</div>
            <div style={{ color: token.colorTextSecondary, fontSize: 12, marginTop: 4 }}>
              {t('ai.examples')}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id}>
            {msg.role === 'assistant' && msg.toolEvents && msg.toolEvents.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 4, paddingLeft: 4 }}>
                {msg.toolEvents.map((te) => (
                  <Tag
                    key={te.callId}
                    icon={<CheckCircleOutlined />}
                    color="success"
                    style={{ fontSize: 11 }}
                  >
                    {toolLabel(te.name, t)}
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
                color: msg.role === 'user' ? 'var(--sider-text-active)' : token.colorText,
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
            {msg.draftCards && msg.draftCards.length > 0 && (
              <div style={{ paddingLeft: 4, maxWidth: '90%' }}>
                {msg.draftCards.map((card) => (
                  <DraftCard key={card.draft_id} data={card} onClick={() => setActiveDraftId(card.draft_id)} />
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Streaming state */}
        {streaming && (
          <div>
            {activeTools.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 4, paddingLeft: 4 }}>
                {activeTools.map((te) => (
                  <Tag
                    key={te.callId}
                    icon={te.status === 'running' ? <LoadingOutlined /> : <CheckCircleOutlined />}
                    color={te.status === 'running' ? 'processing' : 'success'}
                    style={{ fontSize: 11 }}
                  >
                    {toolLabel(te.name, t)}
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
                    {activeTools.some((te) => te.status === 'running') ? t('ai.executing') : t('ai.thinking')}
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
        padding: '12px',
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
          placeholder={t('ai.placeholder')}
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

      {/* Draft Preview Drawer */}
      <DraftPreviewDrawer
        draftId={activeDraftId}
        open={!!activeDraftId}
        onClose={() => setActiveDraftId(null)}
      />
    </div>
  );
};
