// frontend/src/components/ai/DraftDiffView.tsx
// Displays before/after differences for update-type drafts

import React from 'react';
import { Descriptions, Tag, Table, Typography, theme } from 'antd';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

export interface FieldDiff {
  path: string;
  label: string;
  before: unknown;
  after: unknown;
  type: 'changed' | 'added' | 'removed';
}

interface DraftDiffViewProps {
  original: Record<string, unknown>;
  draft: Record<string, unknown>;
}

const SKIP_KEYS = new Set([
  'id', 'organization_id', 'created_at', 'updated_at', 'deleted_at',
  'created_by', 'submitted_by', 'approved_by', 'rejected_by',
]);

function formatValue(val: unknown): string {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'number') return val.toLocaleString();
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  return String(val);
}

export function computeDiff(original: Record<string, unknown>, draft: Record<string, unknown>): FieldDiff[] {
  const diffs: FieldDiff[] = [];
  const origHeader = (original.header ?? original) as Record<string, unknown>;
  const draftHeader = (draft.header ?? draft) as Record<string, unknown>;

  const allKeys = new Set([...Object.keys(origHeader), ...Object.keys(draftHeader)]);
  for (const key of allKeys) {
    if (SKIP_KEYS.has(key)) continue;
    if (key === 'items') continue;
    const before = origHeader[key];
    const after = draftHeader[key];
    if (JSON.stringify(before) !== JSON.stringify(after)) {
      if (before === undefined) {
        diffs.push({ path: key, label: key, before: null, after, type: 'added' });
      } else if (after === undefined) {
        diffs.push({ path: key, label: key, before, after: null, type: 'removed' });
      } else {
        diffs.push({ path: key, label: key, before, after, type: 'changed' });
      }
    }
  }

  return diffs;
}

export const DraftDiffView: React.FC<DraftDiffViewProps> = ({ original, draft }) => {
  const { token } = theme.useToken();
  const { t } = useTranslation();
  const diffs = computeDiff(original, draft);

  if (diffs.length === 0) {
    return <Text type="secondary">{t('ai.draft.noChanges')}</Text>;
  }

  const columns = [
    {
      title: t('ai.draft.diffTitle'),
      dataIndex: 'label',
      key: 'label',
      width: 140,
      render: (label: string, record: FieldDiff) => (
        <Text style={{ fontSize: 13 }}>
          {label}
          {record.type === 'added' && <Tag color="green" style={{ marginLeft: 4, fontSize: 10 }}>NEW</Tag>}
          {record.type === 'removed' && <Tag color="red" style={{ marginLeft: 4, fontSize: 10 }}>DEL</Tag>}
        </Text>
      ),
    },
    {
      title: t('ai.draft.beforeValue'),
      dataIndex: 'before',
      key: 'before',
      render: (val: unknown) => (
        <Text
          delete={val !== null && val !== undefined}
          type="secondary"
          style={{ fontSize: 12 }}
        >
          {formatValue(val)}
        </Text>
      ),
    },
    {
      title: t('ai.draft.afterValue'),
      dataIndex: 'after',
      key: 'after',
      render: (val: unknown, record: FieldDiff) => (
        <Text
          style={{
            fontSize: 12,
            color: record.type === 'removed' ? token.colorTextDisabled : token.colorSuccess,
            fontWeight: record.type !== 'removed' ? 500 : undefined,
          }}
        >
          {formatValue(val)}
        </Text>
      ),
    },
  ];

  return (
    <div style={{ marginBottom: 16 }}>
      <Descriptions
        title={t('ai.draft.diffTitle')}
        size="small"
        column={1}
        style={{ marginBottom: 8 }}
      >
        <Descriptions.Item label={t('ai.draft.itemsChanged', { count: diffs.length })}>
          {diffs.filter((d) => d.type === 'changed').length} {t('ai.draft.update')}
          {diffs.filter((d) => d.type === 'added').length > 0 && `, ${diffs.filter((d) => d.type === 'added').length} ${t('ai.draft.create')}`}
        </Descriptions.Item>
      </Descriptions>
      <Table
        dataSource={diffs}
        columns={columns}
        rowKey="path"
        size="small"
        pagination={false}
        bordered
      />
    </div>
  );
};
