import React from 'react';
import { useForm, Create } from '@refinedev/antd';
import { Form, Input, DatePicker, Select, InputNumber, Row, Col } from 'antd';
import { FULL_WIDTH } from '../../../constants/styles';

export const FixedAssetCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'fixed-assets' });

  return (
    <Create saveButtonProps={saveButtonProps} title="新建固定资产">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="资产名称" name="asset_name" rules={[{ required: true, message: '请输入资产名称' }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="分类" name="category">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label="购入日期"
              name="acquisition_date"
              rules={[{ required: true, message: '请选择购入日期' }]}
              getValueFromEvent={(d) => d?.format('YYYY-MM-DD')}
            >
              <DatePicker style={FULL_WIDTH} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label="购入成本"
              name="acquisition_cost"
              rules={[{ required: true, message: '请输入购入成本' }]}
            >
              <InputNumber style={FULL_WIDTH} min={0} precision={2} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="折旧方法" name="depreciation_method">
              <Select
                options={[
                  { value: 'straight_line', label: '直线法' },
                  { value: 'declining_balance', label: '递减余额法' },
                ]}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="使用寿命（月）" name="useful_life_months">
              <InputNumber style={FULL_WIDTH} min={1} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="残值" name="salvage_value">
              <InputNumber style={FULL_WIDTH} min={0} precision={2} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="部门" name="department">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="位置" name="location">
              <Input />
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
