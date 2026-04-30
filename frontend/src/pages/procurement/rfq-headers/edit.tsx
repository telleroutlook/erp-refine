import React, { useState } from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { Form, Input, DatePicker, Select, Row, Col } from 'antd';
import { FULL_WIDTH, dateFormItemProps } from '../../../constants/styles';
import { RFQ_STATUS_OPTIONS, translateOptions } from '../../../constants/options';
import { EditableItemTable, type ColumnConfig, type ItemsPayload } from '../../../components/shared/EditableItemTable';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle, useProductSearch } from '../../../hooks';

export const RfqHeaderEdit: React.FC = () => {
  const { formProps, saveButtonProps, queryResult, onFinish } = useForm({ resource: 'rfq-headers' });
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();
  const record = queryResult?.data?.data as any;
  const { selectProps: productSelectProps, productsMap } = useProductSearch();

  const [itemsPayload, setItemsPayload] = useState<ItemsPayload>({ upsert: [], delete: [] });
  const handleFinish = async (values: any) => onFinish({ ...values, items: itemsPayload });

  const lineColumns: ColumnConfig[] = [
    { dataIndex: 'line_number', title: fl('rfq_lines', 'line_number'), width: 60 },
    { dataIndex: 'product_id', title: fl('rfq_lines', 'product_id'), editable: true, inputType: 'select', selectOptions: productSelectProps.options as any, render: (_: any, r: any) => r?.product?.name },
    { dataIndex: 'qty_requested', title: fl('rfq_lines', 'qty_requested'), width: 100, align: 'right', editable: true, inputType: 'number' },
    { dataIndex: 'unit_of_measure', title: fl('rfq_lines', 'unit_of_measure'), width: 80, editable: true },
    { dataIndex: 'description', title: fl('rfq_lines', 'description'), editable: true },
  ];

  return (
    <Edit saveButtonProps={saveButtonProps} title={pt('rfq_headers', 'edit')}>
      <Form {...formProps} layout="vertical" onFinish={handleFinish}>
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}><Form.Item label={fl('rfq_headers', 'rfq_number')} name="rfq_number"><Input disabled /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label={t('common.status')} name="status"><Select options={translateOptions(RFQ_STATUS_OPTIONS, t)} /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label={fl('rfq_headers', 'due_date')} name="due_date" {...dateFormItemProps}><DatePicker style={FULL_WIDTH} /></Form.Item></Col>
          <Col span={24}><Form.Item label={t('common.notes')} name="notes"><Input.TextArea rows={3} /></Form.Item></Col>
        </Row>
      </Form>
      <EditableItemTable items={record?.lines ?? []} columns={lineColumns} title={t('sections.rfqLines')} onChange={setItemsPayload} productsMap={productsMap} />
    </Edit>
  );
};
