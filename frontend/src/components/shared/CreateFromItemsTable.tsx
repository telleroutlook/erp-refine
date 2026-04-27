import React from 'react';
import { Table, InputNumber, Alert, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import type { CreateFromData } from '../../hooks/useCreateFrom';

const { Text } = Typography;

interface CreateFromItemsTableProps {
  items: CreateFromData['items'];
  source: CreateFromData['source'];
  onChange: (items: CreateFromData['items']) => void;
}

export const CreateFromItemsTable: React.FC<CreateFromItemsTableProps> = ({
  items,
  source,
  onChange,
}) => {
  const { t } = useTranslation();

  const handleQuantityChange = (index: number, value: number | null) => {
    const updated = [...items];
    updated[index] = { ...updated[index], quantity: value ?? 0 };
    onChange(updated);
  };

  const columns = [
    {
      title: '#',
      width: 50,
      render: (_: unknown, __: unknown, idx: number) => idx + 1,
    },
    {
      title: t('fields.product', 'Product'),
      dataIndex: '_product',
      width: 200,
      render: (p: any) => p ? `${p.code} - ${p.name}` : '-',
    },
    {
      title: t('fields.open_quantity', 'Open Qty'),
      dataIndex: '_open_quantity',
      width: 120,
      align: 'right' as const,
      render: (v: number) => <Text type="secondary">{v}</Text>,
    },
    {
      title: t('fields.quantity', 'Quantity'),
      dataIndex: 'quantity',
      width: 120,
      align: 'right' as const,
      render: (val: number, _record: any, idx: number) => (
        <InputNumber
          value={val}
          min={0.0001}
          max={items[idx]._open_quantity}
          precision={4}
          style={{ width: '100%' }}
          onChange={(v) => handleQuantityChange(idx, v)}
        />
      ),
    },
    {
      title: t('fields.unit_price', 'Unit Price'),
      dataIndex: 'unit_price',
      width: 120,
      align: 'right' as const,
      render: (v: number) => v?.toFixed(2) ?? '-',
    },
    {
      title: t('fields.amount', 'Amount'),
      width: 120,
      align: 'right' as const,
      render: (_: unknown, record: any) => {
        const amt = (record.quantity ?? 0) * (record.unit_price ?? 0);
        return amt.toFixed(2);
      },
    },
  ];

  const sourceTypeLabel = source.type.replace(/_/g, ' ');

  return (
    <>
      <Alert
        type="info"
        showIcon
        message={t('messages.createFromInfo', {
          sourceType: sourceTypeLabel,
          sourceNumber: source.number,
          defaultValue: `Pre-filled from ${sourceTypeLabel} ${source.number}`,
        })}
        style={{ marginBottom: 16 }}
      />
      <Table
        dataSource={items}
        columns={columns}
        rowKey="_source_item_id"
        pagination={false}
        size="small"
        bordered
        summary={() => {
          const total = items.reduce(
            (sum, item) => sum + (item.quantity as number ?? 0) * (item.unit_price as number ?? 0),
            0
          );
          return (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={5} align="right">
                <Text strong>{t('fields.total', 'Total')}</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={1} align="right">
                <Text strong>{total.toFixed(2)}</Text>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          );
        }}
      />
    </>
  );
};
