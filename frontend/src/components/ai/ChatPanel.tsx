import React, { useState, useRef, useEffect } from 'react';
import { Input, Button, Card, Space, Typography, Spin, Alert } from 'antd';
import { SendOutlined, RobotOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  requiresConfirmation?: boolean;
  confirmationPrompt?: string;
}

interface ChatPanelProps {
  sessionId?: string;
  onConfirm?: (sessionId: string, originalMessage: string) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ sessionId: initialSessionId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sid, setSid] = useState(initialSessionId ?? crypto.randomUUID());
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string, confirmed = false) => {
    if (!text.trim()) return;

    const userMsg: Message = { role: 'user', content: text, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: text, sessionId: sid, confirmed }),
      });

      const data = await res.json();
      const response = data.data;

      let content = '';
      if (response.error) {
        content = `错误: ${response.error}`;
      } else if (response.requiresConfirmation) {
        content = response.confirmationPrompt ?? '需要确认此操作';
      } else if (response.executionResult) {
        content = typeof response.executionResult === 'string'
          ? response.executionResult
          : JSON.stringify(response.executionResult, null, 2);
      } else if (response.schemaOutput) {
        content = `已生成表单: ${response.schemaOutput.schemaName}`;
      } else {
        content = JSON.stringify(response, null, 2);
      }

      const assistantMsg: Message = {
        role: 'assistant',
        content,
        timestamp: new Date(),
        requiresConfirmation: response.requiresConfirmation,
        confirmationPrompt: response.confirmationPrompt,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: '发生错误，请重试',
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      title={<Space><RobotOutlined /> AI 助手</Space>}
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      bodyStyle={{ flex: 1, overflow: 'auto', padding: '12px' }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 200, maxHeight: 500, overflowY: 'auto' }}>
        {messages.length === 0 && (
          <Text type="secondary" style={{ textAlign: 'center', paddingTop: 32 }}>
            您好！我是 ERP AI 助手。请告诉我您需要什么帮助。
          </Text>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div
              style={{
                maxWidth: '80%',
                padding: '8px 12px',
                borderRadius: 8,
                background: msg.role === 'user' ? '#1677ff' : '#f5f5f5',
                color: msg.role === 'user' ? '#fff' : '#000',
                whiteSpace: 'pre-wrap',
                fontSize: 13,
              }}
            >
              {msg.content}
              {msg.requiresConfirmation && (
                <div style={{ marginTop: 8 }}>
                  <Button size="small" type="primary" onClick={() => sendMessage(messages.find(m => m.role === 'user')?.content ?? '', true)}>
                    确认执行
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ padding: '8px 12px', background: '#f5f5f5', borderRadius: 8 }}>
              <Spin size="small" /> 思考中...
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
          placeholder="输入您的问题或指令..."
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
