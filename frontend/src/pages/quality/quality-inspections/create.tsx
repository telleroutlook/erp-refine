import React from 'react';
import { useForm, Create, useSelect } from '@refinedev/antd';
import { useList } from '@refinedev/core';
import { Form, Input, DatePicker, Select, InputNumber, Row, Col } from 'antd';
import { INSPECTION_STATUS_OPTIONS, INSPECTION_REFERENCE_TYPE_OPTIONS, translateOptions } from '../../../constants/options';
import { FULL_WIDTH } from '../../../constants/styles';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const QualityInspectionCreate: React.FC = () => {
  const { formProps, saveButtonProps, form } = useForm({ resource: 'quality-inspections' });
  const { selectProps: productSelectProps } = useSelect({
    resource: 'products',
    optionLabel: (r: any) => `${r.code} - ${r.name}`,
  });
  const { selectProps: employeeSelectProps } = useSelect({
    resource: 'employees',
    optionLabel: (r: any) => `${r.employee_number ?? r.code} - ${r.name}`,
  });
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();

  const referenceType = Form.useWatch('reference_type', form);

  const referenceResource = referenceType === 'purchase_receipt' ? 'purchase-receipts'
    : referenceType === 'work_order' ? 'work-orders'
    : referenceType === 'sales_return' ? 'sales-returns'
    : undefined;

  const { data: refDocsData } = useList({
    resource: referenceResource ?? '',
    pagination: { pageSize: 200 },
    queryOptions: { enabled: !!referenceResource },
  });

  const refDocOptions = (refDocsData?.data ?? []).map((d: any) => ({
    label: d.receipt_number ?? d.work_order_number ?? d.return_number ?? d.id,
    value: d.id,
  }));

  return (
    <Create saveButtonProps={saveButtonProps} title={pt('quality_inspections', 'create')}>
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('quality_inspections', 'product_id')} name="product_id" rules={[{ required: true }]}>
              <Select {...productSelectProps} showSearch />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label={fl('quality_inspections', 'inspection_date')}
              name="inspection_date"
              rules={[{ required: true }]}
              getValueFromEvent={(d) => d?.format('YYYY-MM-DD')}
            >
              <DatePicker style={FULL_WIDTH} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('quality_inspections', 'inspector_id')} name="inspector_id">
              <Select {...employeeSelectProps} showSearch allowClear />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={t('common.status')} name="status" initialValue="draft">
              <Select options={translateOptions(INSPECTION_STATUS_OPTIONS, t)} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('quality_inspections', 'reference_type')} name="reference_type">
              <Select
                options={translateOptions(INSPECTION_REFERENCE_TYPE_OPTIONS, t, 'enums.referenceType')}
                allowClear
                onChange={() => form.setFieldValue('reference_id', undefined)}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('quality_inspections', 'reference_id')} name="reference_id">
              {referenceResource ? (
                <Select options={refDocOptions} showSearch optionFilterProp="label" allowClear />
              ) : (
                <Input disabled={!referenceType} />
              )}
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('quality_inspections', 'total_quantity')} name="total_quantity">
              <InputNumber style={FULL_WIDTH} min={0} />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label={t('common.notes')} name="notes">
              <Input.TextArea rows={3} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Create>
  );
};
