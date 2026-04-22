import React from 'react';
import { useForm, useSelect, Create } from '@refinedev/antd';
import { Form, Input, DatePicker, Select, InputNumber, Row, Col } from 'antd';
import { WORK_ORDER_STATUS_OPTIONS, translateOptions } from '../../../constants/options';
import { FULL_WIDTH } from '../../../constants/styles';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const WorkOrderCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'work-orders' });
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();
  const statusOpts = translateOptions(WORK_ORDER_STATUS_OPTIONS.slice(0, 2), t);
  const { selectProps: productSelectProps } = useSelect({ resource: 'products', optionLabel: 'name', optionValue: 'id' });
  const { selectProps: bomSelectProps } = useSelect({ resource: 'bom-headers', optionLabel: 'bom_number', optionValue: 'id' });
  const { selectProps: warehouseSelectProps } = useSelect({ resource: 'warehouses', optionLabel: 'name', optionValue: 'id' });

  return (
    <Create saveButtonProps={saveButtonProps} title={pt('work_orders', 'create')}>
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('work_orders', 'product_id')} name="product_id" rules={[{ required: true }]}>
              <Select {...productSelectProps} showSearch />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('work_orders', 'bom_header_id')} name="bom_header_id">
              <Select {...bomSelectProps} showSearch allowClear />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('work_orders', 'planned_quantity')} name="planned_quantity" rules={[{ required: true }]}>
              <InputNumber style={FULL_WIDTH} min={1} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={t('common.status')} name="status" initialValue="draft">
              <Select options={statusOpts} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('work_orders', 'start_date')} name="start_date" getValueFromEvent={(d) => d?.format('YYYY-MM-DD')}>
              <DatePicker style={FULL_WIDTH} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('work_orders', 'planned_completion_date')} name="planned_completion_date" getValueFromEvent={(d) => d?.format('YYYY-MM-DD')}>
              <DatePicker style={FULL_WIDTH} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('work_orders', 'warehouse_id')} name="warehouse_id">
              <Select {...warehouseSelectProps} showSearch allowClear />
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
