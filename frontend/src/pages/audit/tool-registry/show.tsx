import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions, Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import { useFieldLabel } from '../../../hooks';

export const ToolRegistryShow: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { queryResult } = useShow({ resource: 'tool-registry' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={t('menu.toolRegistry')} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label={fl('tool_registry', 'tool_name')}>{record?.tool_name}</Descriptions.Item>
        <Descriptions.Item label={fl('tool_registry', 'domain')}>{record?.domain}</Descriptions.Item>
        <Descriptions.Item label={fl('tool_registry', 'risk_level')}><Tag>{record?.risk_level}</Tag></Descriptions.Item>
        <Descriptions.Item label={fl('tool_registry', 'active')}>{record?.active ? t('enums.yesNo.yes') : t('enums.yesNo.no')}</Descriptions.Item>
        <Descriptions.Item label={fl('tool_registry', 'audit_required')}>{record?.audit_required ? t('enums.yesNo.yes') : t('enums.yesNo.no')}</Descriptions.Item>
        <Descriptions.Item label={fl('tool_registry', 'version')}>{record?.version}</Descriptions.Item>
        <Descriptions.Item label={fl('tool_registry', 'description')} span={2}>{record?.description}</Descriptions.Item>
        <Descriptions.Item label={fl('tool_registry', 'input_schema')} span={2}>
          <pre style={{ fontSize: 12, maxHeight: 200, overflow: 'auto' }}>
            {record?.input_schema ? JSON.stringify(record.input_schema, null, 2) : '—'}
          </pre>
        </Descriptions.Item>
        <Descriptions.Item label={fl('tool_registry', 'output_schema')} span={2}>
          <pre style={{ fontSize: 12, maxHeight: 200, overflow: 'auto' }}>
            {record?.output_schema ? JSON.stringify(record.output_schema, null, 2) : '—'}
          </pre>
        </Descriptions.Item>
        <Descriptions.Item label={fl('tool_registry', 'requires_permission')} span={2}>
          <pre style={{ fontSize: 12 }}>
            {record?.requires_permission ? JSON.stringify(record.requires_permission, null, 2) : '—'}
          </pre>
        </Descriptions.Item>
        <Descriptions.Item label={fl('tool_registry', 'created_at')}><DateField value={record?.created_at} format="YYYY-MM-DD HH:mm:ss" /></Descriptions.Item>
        <Descriptions.Item label={fl('tool_registry', 'updated_at')}><DateField value={record?.updated_at} format="YYYY-MM-DD HH:mm:ss" /></Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
