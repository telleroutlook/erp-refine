import React from 'react';
import { useForm, Create } from '@refinedev/antd';
import { useList } from '@refinedev/core';
import { Form, Input, DatePicker, Select, InputNumber, Row, Col } from 'antd';
import { INSPECTION_STATUS_OPTIONS, translateOptions } from '../../../constants/options';
import { FULL_WIDTH } from '../../../constants/styles';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const QualityInspectionCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'quality-inspections' });
  const { data: productsData } = useList({ resource: 'products', pagination: { pageSize: 500 } });
  const { data: employeesData } = useList({ resource: 'employees', pagination: { pageSize: 500 } });
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();

  const productOptions = (productsData?.data ?? []).map((p: any) => ({ label: `${p.code} - ${p.name}`, value: p.id }));
  const employeeOptions = (employeesData?.data ?? []).map((e: any) => ({ label: `${e.employee_code} - ${e.name}`, value: e.id }));

  return (
    <Create saveButtonProps={saveButtonProps} title={pt('quality_inspections', 'create')}>
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('quality_inspections', 'product_id')} name="product_id" rules={[{ required: true }]}>
              <Select options={productOptions} showSearch optionFilterProp="label" />
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
              <Select options={employeeOptions} showSearch optionFilterProp="label" allowClear />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={t('common.status')} name="status" initialValue="draft">
              <Select options={translateOptions(INSPECTION_STATUS_OPTIONS, t)} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('quality_inspections', 'reference_type')} name="reference_type">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('quality_inspections', 'reference_id')} name="reference_id">
              <Input />
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
