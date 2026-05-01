// frontend/src/components/ai/DraftPreviewDrawer.tsx
// Full-screen drawer for reviewing, editing, and committing AI-generated drafts

import React, { useEffect, useState } from 'react';
import { Drawer, Button, Space, Spin, Tag, Typography, Descriptions, Alert, Popconfirm, Tooltip, Form, Input, InputNumber, DatePicker, Select, Table, theme } from 'antd';
import {
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
  FileAddOutlined,
  EditOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useDraft } from '../../hooks/useDraft';
import { DraftDiffView } from './DraftDiffView';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Text, Title } = Typography;

const ACTION_ICONS: Record<string, React.ReactNode> = {
  create: <FileAddOutlined />,
  update: <EditOutlined />,
  status_change: <SwapOutlined />,
};

interface DraftPreviewDrawerProps {
  draftId: string | null;
  open: boolean;
  onClose: () => void;
  onCommitted?: (resourceType: string, recordId: string | null) => void;
}

export const DraftPreviewDrawer: React.FC<DraftPreviewDrawerProps> = ({ draftId, open, onClose, onCommitted }) => {
  const { token } = theme.useToken();
  const { t } = useTranslation();
  const { draft, isLoading, fetchDraft, commit, discard, renew } = useDraft(draftId);
  const [form] = Form.useForm();
  const [committing, setCommitting] = useState(false);

  useEffect(() => {
    if (open && draftId) {
      fetchDraft(draftId);
    }
  }, [open, draftId, fetchDraft]);

  useEffect(() => {
    if (draft?.content) {
      const formData = draft.content.header ?? draft.content;
      form.setFieldsValue(formData);
    }
  }, [draft, form]);

  const handleCommit = async () => {
    setCommitting(true);
    try {
      const values = form.getFieldsValue();
      const content = draft?.content.header ? { header: values, items: draft.content.items } : values;
      const result = await commit(content);
      if (result) {
        onCommitted?.(result.resourceType, result.recordId);
        onClose();
      }
    } finally {
      setCommitting(false);
    }
  };

  const handleDiscard = async () => {
    await discard();
    onClose();
  };

  const isExpired = draft ? new Date(draft.expires_at) < new Date() : false;
  const isPending = draft?.status === 'pending';

  const renderFormFields = () => {
    if (!draft) return null;
    const data = (draft.content.header ?? draft.content) as Record<string, unknown>;
    const fields = Object.entries(data).filter(([key]) =>
      !['id', 'organization_id', 'created_at', 'updated_at', 'deleted_at', 'created_by', 'status', 'order_number'].includes(key)
    );

    return fields.map(([key, value]) => {
      const label = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

      if (typeof value === 'number') {
        return (
          <Form.Item key={key} name={key} label={label}>
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
        );
      }
      if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
        return (
          <Form.Item key={key} name={key} label={label}>
            <Input />
          </Form.Item>
        );
      }
      return (
        <Form.Item key={key} name={key} label={label}>
          <Input />
        </Form.Item>
      );
    });
  };

  const renderItems = () => {
    if (!draft?.content.items || !Array.isArray(draft.content.items)) return null;
    const items = draft.content.items as Record<string, unknown>[];
    if (items.length === 0) return null;

    const sampleItem = items[0];
    const columns = Object.keys(sampleItem)
      .filter((key) => !['id', 'organization_id', 'created_at', 'updated_at', 'deleted_at'].includes(key))
      .map((key) => ({
        title: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        dataIndex: key,
        key,
        ellipsis: true,
        render: (val: unknown) => {
          if (val === null || val === undefined) return '—';
          if (typeof val === 'number') return val.toLocaleString();
          return String(val);
        },
      }));

    return (
      <div style={{ marginTop: 16 }}>
        <Text strong style={{ display: 'block', marginBottom: 8 }}>
          {t('ai.draft.cardItems', { count: items.length })}
        </Text>
        <Table
          dataSource={items.map((item, idx) => ({ ...item, _key: idx }))}
          columns={columns}
          rowKey="_key"
          size="small"
          pagination={false}
          scroll={{ x: 'max-content' }}
          bordered
        />
      </div>
    );
  };

  return (
    <Drawer
      title={
        <Space>
          {draft && ACTION_ICONS[draft.action_type]}
          <span>{draft?.summary.title ?? t('ai.draft.title')}</span>
          {draft && (
            <Tag color={isPending ? 'processing' : draft.status === 'committed' ? 'success' : 'default'}>
              {t(`ai.draft.${draft.status}`)}
            </Tag>
          )}
        </Space>
      }
      open={open}
      onClose={onClose}
      width="70%"
      destroyOnClose
      footer={
        isPending && !isExpired ? (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Space>
              <Popconfirm title={t('ai.draft.discardConfirm')} onConfirm={handleDiscard}>
                <Button danger icon={<DeleteOutlined />}>{t('ai.draft.discard')}</Button>
              </Popconfirm>
              <Tooltip title={draft && draft.renewed_count >= 3 ? t('ai.draft.maxRenewals') : undefined}>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={renew}
                  disabled={!draft || draft.renewed_count >= 3}
                >
                  {t('ai.draft.renew')}
                </Button>
              </Tooltip>
            </Space>
            <Popconfirm title={t('ai.draft.commitConfirm')} onConfirm={handleCommit}>
              <Button type="primary" icon={<CheckOutlined />} loading={committing}>
                {t('ai.draft.commit')}
              </Button>
            </Popconfirm>
          </div>
        ) : null
      }
    >
      {isLoading && !draft ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <Spin size="large" />
          <div style={{ marginTop: 12, color: token.colorTextSecondary }}>{t('ai.draft.loadingDraft')}</div>
        </div>
      ) : draft ? (
        <div>
          {/* Expiry notice */}
          {isExpired && (
            <Alert type="warning" message={t('ai.draft.expired_notice')} showIcon style={{ marginBottom: 16 }} />
          )}
          {!isExpired && isPending && (
            <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <ClockCircleOutlined style={{ color: token.colorTextSecondary }} />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {t('ai.draft.expiresIn', { time: dayjs(draft.expires_at).fromNow(true) })}
              </Text>
            </div>
          )}

          {/* Summary */}
          <Descriptions size="small" bordered column={2} style={{ marginBottom: 16 }}>
            <Descriptions.Item label={t('ai.draft.cardAmount')}>
              {draft.summary.amount != null ? `${draft.summary.currency ?? '¥'} ${draft.summary.amount.toLocaleString()}` : '—'}
            </Descriptions.Item>
            <Descriptions.Item label={t('ai.draft.cardItems', { count: draft.summary.items_count ?? 0 })}>
              {draft.summary.items_count ?? 0}
            </Descriptions.Item>
            {draft.summary.key_fields.map((f) => (
              <Descriptions.Item key={f.label} label={f.label}>{f.value}</Descriptions.Item>
            ))}
          </Descriptions>

          {/* Diff view for updates */}
          {draft.action_type === 'update' && draft.original_content && (
            <DraftDiffView original={draft.original_content} draft={draft.content} />
          )}

          {/* Editable form */}
          <Title level={5} style={{ marginTop: 16, marginBottom: 12 }}>
            {draft.action_type === 'update' ? t('ai.draft.edit') : t('ai.draft.title')}
          </Title>
          <Form form={form} layout="vertical" disabled={!isPending || isExpired}>
            {renderFormFields()}
          </Form>

          {/* Items table */}
          {renderItems()}
        </div>
      ) : null}
    </Drawer>
  );
};
