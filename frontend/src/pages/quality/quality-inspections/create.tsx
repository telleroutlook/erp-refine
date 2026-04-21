import React from 'react';
import { useForm, Create } from '@refinedev/antd';
import { useList } from '@refinedev/core';
import { Form, Input, DatePicker, Select, InputNumber, Row, Col } from 'antd';
import { INSPECTION_STATUS_OPTIONS } from '../../../constants/options';

export const QualityInspectionCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'quality-inspections' });
  const { data: productsData } = useList({ resource: 'products', pagination: { pageSize: 500 } });
  const { data: employeesData } = useList({ resource: 'employees', pagination: { pageSize: 500 } });

  const productOptions = (productsData?.data ?? []).map((p: any) => ({ label: `${p.code} - ${p.name}`, value: p.id }));
  const employeeOptions = (employeesData?.data ?? []).map((e: any) => ({ label: `${e.employee_code} - ${e.name}`, value: e.id }));

  return (
    <Create saveButtonProps={saveButtonProps} title="新建质量检验">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="产品" name="product_id" rules={[{ required: true, message: '请选择产品' }]}>
              <Select options={productOptions} showSearch optionFilterProp="label" placeholder="选择产品" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="检验日期"
              name="inspection_date"
              rules={[{ required: true, message: '请选择检验日期' }]}
              getValueFromEvent={(d) => d?.format('YYYY-MM-DD')}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="检验员" name="inspector_id">
              <Select options={employeeOptions} showSearch optionFilterProp="label" placeholder="选择检验员" allowClear />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="状态" name="status" initialValue="draft">
              <Select options={INSPECTION_STATUS_OPTIONS} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="来源类型" name="reference_type">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="来源单号" name="reference_id">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="总数量" name="total_quantity">
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
