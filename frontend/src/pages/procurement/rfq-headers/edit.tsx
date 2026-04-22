import React, { useMemo } from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { useList } from '@refinedev/core';
import { Form, Input, DatePicker, Select, Row, Col } from 'antd';
import { FULL_WIDTH, dateFormItemProps } from '../../../constants/styles';
import { RFQ_STATUS_OPTIONS, translateOptions } from '../../../constants/options';
import { EditableItemTable, type ColumnConfig, type ProductInfo } from '../../../components/shared/EditableItemTable';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const RfqHeaderEdit: React.FC = () => {
  const { formProps, saveButtonProps, queryResult } = useForm({ resource: 'rfq-headers' });
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();
  const record = queryResult?.data?.data as any;
  const { data: productsData } = useList({ resource: 'products', pagination: { pageSize: 500 } });
  const productOptions = (productsData?.data ?? []).map((p: any) => ({ label: `${p.code} - ${p.name}`, value: p.id }));
  const productsMap = useMemo(() => { const m = new Map<string, ProductInfo>(); (productsData?.data ?? []).forEach((p: any) => m.set(p.id, p)); return m; }, [productsData]);

  const lineColumns: ColumnConfig[] = [
    { dataIndex: 'line_number', title: fl('rfq_lines', 'line_number'), width: 60 },
    { dataIndex: 'product_id', title: fl('rfq_lines', 'product_id'), editable: true, inputType: 'select', selectOptions: productOptions, render: (_: any, r: any) => r?.product?.name },
    { dataIndex: 'qty_requested', title: fl('rfq_lines', 'qty_requested'), width: 100, align: 'right', editable: true, inputType: 'number' },
    { dataIndex: 'unit_of_measure', title: fl('rfq_lines', 'unit_of_measure'), width: 80, editable: true },
    { dataIndex: 'description', title: fl('rfq_lines', 'description'), editable: true },
  ];

  return (
    <Edit saveButtonProps={saveButtonProps} title={pt('rfq_headers', 'edit')}>
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}><Form.Item label={fl('rfq_headers', 'rfq_number')} name="rfq_number"><Input disabled /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label={t('common.status')} name="status"><Select options={translateOptions(RFQ_STATUS_OPTIONS, t)} /></Form.Item></Col>
          <Col xs={24} sm={24} md={12}><Form.Item label={fl('rfq_headers', 'due_date')} name="due_date" {...dateFormItemProps}><DatePicker style={FULL_WIDTH} /></Form.Item></Col>
          <Col span={24}><Form.Item label={t('common.notes')} name="notes"><Input.TextArea rows={3} /></Form.Item></Col>
        </Row>
      </Form>
      <EditableItemTable resource="rfq-lines" parentResource="rfq-headers" parentId={record?.id} parentFk="rfq_header_id" items={record?.lines ?? []} columns={lineColumns} title={t('sections.rfqLines')} productsMap={productsMap} />
    </Edit>
  );
};
