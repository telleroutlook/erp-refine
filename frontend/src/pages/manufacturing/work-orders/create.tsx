import React from 'react';
import { useForm, Create } from '@refinedev/antd';
import { useList } from '@refinedev/core';
import { Form, Input, DatePicker, Select, InputNumber, Row, Col } from 'antd';
import { WORK_ORDER_STATUS_OPTIONS } from '../../../constants/options';

const STATUS_OPTIONS = WORK_ORDER_STATUS_OPTIONS.slice(0, 2);

export const WorkOrderCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'work-orders' });
  const { data: productsData } = useList({ resource: 'products', pagination: { pageSize: 500 } });
  const { data: bomsData } = useList({ resource: 'bom-headers', pagination: { pageSize: 500 } });
  const { data: warehousesData } = useList({ resource: 'warehouses', pagination: { pageSize: 500 } });
  const productOptions = (productsData?.data ?? []).map((p: any) => ({ label: `${p.code} - ${p.name}`, value: p.id }));
  const bomOptions = (bomsData?.data ?? []).map((b: any) => ({ label: b.bom_number, value: b.id }));
  const warehouseOptions = (warehousesData?.data ?? []).map((w: any) => ({ label: w.name, value: w.id }));

  return (
    <Create saveButtonProps={saveButtonProps} title="新建生产工单">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="产品" name="product_id" rules={[{ required: true, message: '请选择产品' }]}>
              <Select options={productOptions} showSearch optionFilterProp="label" placeholder="选择产品" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="物料清单" name="bom_header_id">
              <Select options={bomOptions} showSearch optionFilterProp="label" placeholder="选择BOM" allowClear />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="计划数量" name="planned_quantity" rules={[{ required: true, message: '请输入计划数量' }]}>
              <InputNumber style={{ width: '100%' }} min={1} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="状态" name="status" initialValue="draft">
              <Select options={STATUS_OPTIONS} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="开始日期" name="start_date" getValueFromEvent={(d) => d?.format('YYYY-MM-DD')}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="计划完成日期" name="planned_completion_date" getValueFromEvent={(d) => d?.format('YYYY-MM-DD')}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="仓库" name="warehouse_id">
              <Select options={warehouseOptions} showSearch optionFilterProp="label" placeholder="选择仓库" allowClear />
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
