import React from 'react';
import { useForm, Create } from '@refinedev/antd';
import { useList } from '@refinedev/core';
import { Form, DatePicker, Select, InputNumber, Row, Col, Input } from 'antd';

export const WorkOrderProductionCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'work-order-productions' });
  const { data: workOrdersData } = useList({ resource: 'work-orders', pagination: { pageSize: 500 } });
  const workOrderOptions = (workOrdersData?.data ?? []).map((w: any) => ({ label: `${w.work_order_number} - ${w.product?.name ?? ''}`, value: w.id }));

  return (
    <Create saveButtonProps={saveButtonProps} title="新建生产报工">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="生产工单" name="work_order_id" rules={[{ required: true, message: '请选择工单' }]}>
              <Select options={workOrderOptions} showSearch optionFilterProp="label" placeholder="选择工单" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="报工日期" name="production_date" rules={[{ required: true }]} getValueFromEvent={(d) => d?.format('YYYY-MM-DD')}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="生产数量" name="quantity" rules={[{ required: true }]}>
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="合格数量" name="qualified_quantity" rules={[{ required: true }]}>
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="不良数量" name="defective_quantity" initialValue={0}>
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="备注" name="notes">
              <Input.TextArea rows={3} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Create>
  );
};
