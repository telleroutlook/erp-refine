import React, { useState, useRef, useEffect } from 'react';
import { Input, Button, Card, Space, Typography, Spin, theme } from 'antd';
import { SendOutlined, RobotOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';

const { Text } = Typography;

const MD_COMPONENTS = {
  p: ({ children }: any) => <p style={{ margin: '4px 0' }}>{children}</p>,
  h3: ({ children }: any) => <h3 style={{ margin: '8px 0 4px', fontSize: 14 }}>{children}</h3>,
  h4: ({ children }: any) => <h4 style={{ margin: '6px 0 2px', fontSize: 13 }}>{children}</h4>,
  ul: ({ children }: any) => <ul style={{ margin: '4px 0', paddingLeft: 20 }}>{children}</ul>,
  li: ({ children }: any) => <li style={{ margin: '2px 0' }}>{children}</li>,
  strong: ({ children }: any) => <strong>{children}</strong>,
  code: ({ children }: any) => (
    <code style={{ background: 'var(--md-code-inline-bg)', padding: '1px 4px', borderRadius: 3, fontSize: 12 }}>
      {children}
    </code>
  ),
};

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  requiresConfirmation?: boolean;
  originalUserMessage?: string;
}

interface ChatPanelProps {
  sessionId?: string;
}

function extractContent(response: Record<string, unknown>): string {
  if (response.error) return `错误: ${response.error}`;

  if (response.requiresConfirmation) {
    return (response.confirmationPrompt as string) ?? '需要确认此操作，请点击"确认执行"按钮继续。';
  }

  if (response.schemaOutput) {
    const s = response.schemaOutput as Record<string, unknown>;
    return `已生成表单: **${s.schemaName}**\n\n${s.description ?? ''}`;
  }

  if (response.executionResult) {
    const er = response.executionResult as Record<string, unknown>;
    if (!er.success) return `执行失败: ${er.error ?? '未知错误'}`;
    const result = er.result as Record<string, unknown> | undefined;
    if (result?.text && typeof result.text === 'string' && result.text.trim()) {
      return result.text.trim();
    }
      if (result) return JSON.stringify(result, null, 2);
  }

  if (response.pipeline === 'clarification') {
    return (response.confirmationPrompt as string) ?? '请提供更多信息以便我理解您的需求。';
  }

  return JSON.stringify(response, null, 2);
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ sessionId: initialSessionId }) => {
  const { token } = theme.useToken();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sid] = useState(initialSessionId ?? crypto.randomUUID());
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string, confirmed = false) => {
    if (!text.trim()) return;

    if (!confirmed) {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'user', content: text, timestamp: new Date() },
      ]);
      setInput('');
    }
    setLoading(true);

    try {
      const accessToken = localStorage.getItem('access_token');
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ message: text, sessionId: sid, confirmed }),
      });

      const data = await res.json();
      const response = data.data as Record<string, unknown>;
      const content = extractContent(response);

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content,
          timestamp: new Date(),
          requiresConfirmation: !!response.requiresConfirmation,
          originalUserMessage: text,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: '发生网络错误，请重试',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      title={<Space><RobotOutlined /> AI 助手</Space>}
      styles={{ body: { padding: '12px', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 200px)' } }}
    >
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 8 }}>
        {messages.length === 0 && (
          <Text type="secondary" style={{ textAlign: 'center', paddingTop: 32 }}>
            您好！我是 ERP AI 助手。请告诉我您需要什么帮助。<br />
            <small>例如：查看采购订单、销售分析、库存情况...</small>
          </Text>
        )}
        {messages.map((msg) => (
          <div key={msg.id} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div
              style={{
                maxWidth: '85%',
                padding: '8px 12px',
                borderRadius: 8,
                background: msg.role === 'user' ? token.colorPrimary : 'var(--ai-bg-bubble)',
                color: msg.role === 'user' ? '#fff' : token.colorText,
                fontSize: 13,
                lineHeight: 1.6,
              }}
            >
              {msg.role === 'assistant' ? (
                <div style={{ overflowX: 'auto' }}>
                  <ReactMarkdown components={MD_COMPONENTS}>
                    {msg.content}
                  </ReactMarkdown>
                  {msg.requiresConfirmation && (
                    <Button
                      size="small"
                      type="primary"
                      style={{ marginTop: 8 }}
                      onClick={() => sendMessage(msg.originalUserMessage ?? '', true)}
                    >
                      确认执行
                    </Button>
                  )}
                </div>
              ) : (
                <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ padding: '8px 12px', background: 'var(--ai-bg-bubble)', borderRadius: 8 }}>
              <Spin size="small" /> <span style={{ marginLeft: 8, fontSize: 13 }}>思考中...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onPressEnter={() => sendMessage(input)}
          placeholder="输入您的问题或指令，例如：销售分析、查看采购订单..."
          disabled={loading}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
        />
      </div>
    </Card>
  );
};
