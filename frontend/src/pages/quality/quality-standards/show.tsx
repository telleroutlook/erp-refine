import React from 'react';
import { useShow } from '@refinedev/core';
import { Show } from '@refinedev/antd';
import { Descriptions, Table, Divider, Tag } from 'antd';
import { useTranslation } from 'react-i18next';

export const QualityStandardShow: React.FC = () => {
  const { t } = useTranslation();
  const { queryResult } = useShow({ resource: 'quality-standards' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={`质量标准 ${record?.standard_code ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={2}>
        <Descriptions.Item label="标准代码">{record?.standard_code}</Descriptions.Item>
        <Descriptions.Item label="标准名称">{record?.standard_name}</Descriptions.Item>
        <Descriptions.Item label="描述" span={2}>{record?.description}</Descriptions.Item>
        <Descriptions.Item label="状态">
          <Tag color={record?.is_active ? 'green' : 'default'}>
            {record?.is_active ? '启用' : '停用'}
          </Tag>
        </Descriptions.Item>
      </Descriptions>

      {record?.items && record.items.length > 0 && (
        <>
          <Divider>检验项目</Divider>
          <Table
            dataSource={record.items}
            rowKey="id"
            size="small"
            pagination={false}
            columns={[
              { dataIndex: 'item_name', title: '检验项目' },
              { dataIndex: 'check_method', title: '检验方法' },
              { dataIndex: 'acceptance_criteria', title: '验收标准' },
              {
                dataIndex: 'is_mandatory',
                title: '是否必检',
                width: 100,
                render: (v: boolean) => <Tag color={v ? 'blue' : 'default'}>{v ? '是' : '否'}</Tag>,
              },
              { dataIndex: 'sequence_order', title: '顺序', width: 80, align: 'right' as const },
            ]}
          />
        </>
      )}
    </Show>
  );
};
