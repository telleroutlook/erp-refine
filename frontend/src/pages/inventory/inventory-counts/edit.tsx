import React from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { Form, Input, DatePicker, Select, Row, Col } from 'antd';
import { FULL_WIDTH, dateFormItemProps } from '../../../constants/styles';
import { COUNT_STATUS_OPTIONS } from '../../../constants/options';

export const InventoryCountEdit: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'inventory-counts' });

  return (
    <Edit saveButtonProps={saveButtonProps} title="编辑库存盘点">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="盘点单号" name="count_number">
              <Input disabled />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="状态" name="status">
              <Select options={COUNT_STATUS_OPTIONS} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label="盘点日期"
              name="count_date"
              {...dateFormItemProps}
            >
              <DatePicker style={FULL_WIDTH} />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="备注" name="notes">
              <Input.TextArea rows={3} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Edit>
  );
};
