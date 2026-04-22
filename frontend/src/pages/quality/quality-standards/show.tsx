import React from 'react';
import { useShow } from '@refinedev/core';
import { Show } from '@refinedev/antd';
import { Descriptions, Table, Divider, Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import { ActiveStatusTag } from '../../../components/shared/ActiveStatusTag';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const QualityStandardShow: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();
  const { queryResult } = useShow({ resource: 'quality-standards' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={pt('quality_standards', 'show', { name: record?.standard_code ?? '' })} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label={fl('quality_standards', 'standard_code')}>{record?.standard_code}</Descriptions.Item>
        <Descriptions.Item label={fl('quality_standards', 'standard_name')}>{record?.standard_name}</Descriptions.Item>
        <Descriptions.Item label={fl('quality_standards', 'description')} span={2}>{record?.description}</Descriptions.Item>
        <Descriptions.Item label={t('common.status')}>
          <ActiveStatusTag value={record?.is_active} />
        </Descriptions.Item>
      </Descriptions>

      {record?.items && record.items.length > 0 && (
        <>
          <Divider>{t('sections.inspectionItems')}</Divider>
          <Table
            dataSource={record.items}
            rowKey="id"
            size="small"
            pagination={false}
            columns={[
              { dataIndex: 'item_name', title: fl('quality_standard_items', 'item_name') },
              { dataIndex: 'check_method', title: fl('quality_standard_items', 'check_method') },
              { dataIndex: 'acceptance_criteria', title: fl('quality_standard_items', 'acceptance_criteria') },
              {
                dataIndex: 'is_mandatory',
                title: fl('quality_standard_items', 'is_mandatory'),
                width: 100,
                render: (v: boolean) => <Tag color={v ? 'blue' : 'default'}>{v ? t('common.yes') : t('common.no')}</Tag>,
              },
              { dataIndex: 'sequence_order', title: fl('quality_standard_items', 'sequence_order'), width: 80, align: 'right' as const },
            ]}
          />
        </>
      )}
    </Show>
  );
};
