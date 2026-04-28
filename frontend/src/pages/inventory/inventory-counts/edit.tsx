import React, { useMemo, useState } from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { useList } from '@refinedev/core';
import { Form, Input, DatePicker, Select, Row, Col } from 'antd';
import { FULL_WIDTH, dateFormItemProps } from '../../../constants/styles';
import { COUNT_STATUS_OPTIONS, translateOptions } from '../../../constants/options';
import { EditableItemTable, type ColumnConfig, type ProductInfo, type ItemsPayload } from '../../../components/shared/EditableItemTable';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const InventoryCountEdit: React.FC = () => {
  const { formProps, saveButtonProps, queryResult, onFinish } = useForm({ resource: 'inventory-counts' });
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();
  const record = queryResult?.data?.data as any;
  const { data: productsData } = useList({ resource: 'products', pagination: { pageSize: 500 } });
  const productOptions = (productsData?.data ?? []).map((p: any) => ({ label: `${p.code} - ${p.name}`, value: p.id }));
  const productsMap = useMemo(() => { const m = new Map<string, ProductInfo>(); (productsData?.data ?? []).forEach((p: any) => m.set(p.id, p)); return m; }, [productsData]);

  const lineColumns: ColumnConfig[] = [
    { dataIndex: 'product_id', title: fl('inventory_count_lines', 'product_id'), editable: true, inputType: 'select', selectOptions: productOptions, render: (_: any, r: any) => r?.product?.name },
    { dataIndex: 'system_quantity', title: fl('inventory_count_lines', 'system_quantity'), width: 100, align: 'right' },
    { dataIndex: 'counted_quantity', title: fl('inventory_count_lines', 'counted_quantity'), width: 100, align: 'right', editable: true, inputType: 'number' },
    { dataIndex: 'variance_quantity', title: fl('inventory_count_lines', 'variance_quantity'), width: 100, align: 'right',
      computed: (row) => { const s = Number(row['system_quantity']) || 0; const c = Number(row['counted_quantity']) || 0; return c ? (c - s).toFixed(2) : null; } },
    { dataIndex: 'notes', title: t('common.notes'), editable: true },
  ];

  const [itemsPayload, setItemsPayload] = useState<ItemsPayload>({ upsert: [], delete: [] });
  const handleFinish = async (values: any) => onFinish({ ...values, items: itemsPayload });

  return (
    <Edit saveButtonProps={saveButtonProps} title={pt('inventory_counts', 'edit')}>
      <Form {...formProps} layout="vertical" onFinish={handleFinish}>
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}><Form.Item label={fl('inventory_counts', 'count_number')} name="count_number"><Input disabled /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label={t('common.status')} name="status"><Select options={translateOptions(COUNT_STATUS_OPTIONS, t)} /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label={fl('inventory_counts', 'count_date')} name="count_date" {...dateFormItemProps}><DatePicker style={FULL_WIDTH} /></Form.Item></Col>
          <Col span={24}><Form.Item label={t('common.notes')} name="notes"><Input.TextArea rows={3} /></Form.Item></Col>
        </Row>
      </Form>
      <EditableItemTable items={record?.lines ?? []} columns={lineColumns} title={t('sections.countDetails')} productsMap={productsMap} onChange={setItemsPayload} />
    </Edit>
  );
};
