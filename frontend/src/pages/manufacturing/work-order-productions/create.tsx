import React from 'react';
import { useForm, Create } from '@refinedev/antd';
import { useList } from '@refinedev/core';
import { Form, DatePicker, Select, InputNumber, Row, Col, Input } from 'antd';
import { FULL_WIDTH } from '../../../constants/styles';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const WorkOrderProductionCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'work-order-productions' });
  const { data: workOrdersData } = useList({ resource: 'work-orders', pagination: { pageSize: 500 } });
  const workOrderOptions = (workOrdersData?.data ?? []).map((w: any) => ({ label: `${w.work_order_number} - ${w.product?.name ?? ''}`, value: w.id }));
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();

  return (
    <Create saveButtonProps={saveButtonProps} title={pt('work_order_productions', 'create')}>
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('work_order_productions', 'work_order_id')} name="work_order_id" rules={[{ required: true }]}>
              <Select options={workOrderOptions} showSearch optionFilterProp="label" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('work_order_productions', 'production_date')} name="production_date" rules={[{ required: true }]} getValueFromEvent={(d) => d?.format('YYYY-MM-DD')}>
              <DatePicker style={FULL_WIDTH} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label={fl('work_order_productions', 'quantity')} name="quantity" rules={[{ required: true }]}>
              <InputNumber style={FULL_WIDTH} min={0} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label={fl('work_order_productions', 'qualified_quantity')} name="qualified_quantity" rules={[{ required: true }]}>
              <InputNumber style={FULL_WIDTH} min={0} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label={fl('work_order_productions', 'defective_quantity')} name="defective_quantity" initialValue={0}>
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
