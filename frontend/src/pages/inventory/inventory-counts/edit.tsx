import React, { useState } from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { Form, Input, DatePicker, Select, Row, Col } from 'antd';
import { FULL_WIDTH, dateFormItemProps } from '../../../constants/styles';
import { COUNT_STATUS_OPTIONS, translateOptions } from '../../../constants/options';
import { EditableItemTable, type ColumnConfig, type ItemsPayload } from '../../../components/shared/EditableItemTable';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle, useProductSearch } from '../../../hooks';

export const InventoryCountEdit: React.FC = () => {
  const { formProps, saveButtonProps, queryResult, onFinish } = useForm({ resource: 'inventory-counts' });
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();
  const record = queryResult?.data?.data as any;
  const { selectProps: productSelectProps, productsMap } = useProductSearch();

  const lineColumns: ColumnConfig[] = [
    { dataIndex: 'product_id', title: fl('inventory_count_lines', 'product_id'), editable: true, inputType: 'select', selectOptions: productSelectProps.options as any, render: (_: any, r: any) => r?.product?.name },
    { dataIndex: 'system_quantity', title: fl('inventory_count_lines', 'system_quantity'), width: 100, align: 'right' },
    { dataIndex: 'counted_quantity', title: fl('inventory_count_lines', 'counted_quantity'), width: 100, align: 'right', editable: true, inputType: 'number' },
    { dataIndex: 'variance_quantity', title: fl('inventory_count_lines', 'variance_quantity'), width: 100, align: 'right',
      computed: (row) => { const s = Number(row['system_quantity']) || 0; const counted = row['counted_quantity']; if (counted === null || counted === undefined || counted === '') return null; return (Number(counted) - s).toFixed(2); } },
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
