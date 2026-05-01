// frontend/src/components/ai/DraftCard.tsx
// Compact card rendered inline in AI chat showing a draft document summary

import React from 'react';
import { Card, Tag, Typography, Space, theme } from 'antd';
import {
  FileAddOutlined,
  EditOutlined,
  SwapOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { DraftCardData } from '../../hooks/useDraft';

const { Text } = Typography;

const ACTION_ICONS: Record<string, React.ReactNode> = {
  create: <FileAddOutlined />,
  update: <EditOutlined />,
  status_change: <SwapOutlined />,
};

const ACTION_COLORS: Record<string, string> = {
  create: 'green',
  update: 'blue',
  status_change: 'orange',
};

interface DraftCardProps {
  data: DraftCardData;
  onClick: () => void;
}

export const DraftCard: React.FC<DraftCardProps> = ({ data, onClick }) => {
  const { token } = theme.useToken();
  const { t } = useTranslation();
  const { summary, action_type } = data;

  return (
    <Card
      size="small"
      hoverable
      onClick={onClick}
      style={{
        marginTop: 8,
        borderRadius: 8,
        border: `1px solid ${token.colorBorderSecondary}`,
        cursor: 'pointer',
        background: token.colorBgElevated,
      }}
      styles={{ body: { padding: '10px 12px' } }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <Tag
              icon={ACTION_ICONS[action_type]}
              color={ACTION_COLORS[action_type]}
              style={{ margin: 0, fontSize: 11 }}
            >
              {t(`ai.draft.${action_type}`)}
            </Tag>
            <Text strong style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {summary.title}
            </Text>
          </div>

          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
            {summary.subtitle}
          </Text>

          <Space size={12} style={{ fontSize: 11 }}>
            {summary.amount != null && (
              <Text style={{ fontSize: 12, fontWeight: 500 }}>
                {summary.currency ?? '¥'} {summary.amount.toLocaleString()}
              </Text>
            )}
            {summary.items_count != null && (
              <Text type="secondary" style={{ fontSize: 11 }}>
                {t('ai.draft.cardItems', { count: summary.items_count })}
              </Text>
            )}
            {summary.key_fields.slice(0, 2).map((f) => (
              <Text key={f.label} type="secondary" style={{ fontSize: 11 }}>
                {f.label}: {f.value}
              </Text>
            ))}
          </Space>
        </div>

        <RightOutlined style={{ color: token.colorTextQuaternary, fontSize: 12, flexShrink: 0, marginLeft: 8 }} />
      </div>
    </Card>
  );
};
