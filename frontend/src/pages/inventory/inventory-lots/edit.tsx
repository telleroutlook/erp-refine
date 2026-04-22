import React from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { Form, Input, DatePicker, Select, InputNumber, Row, Col } from 'antd';
import { FULL_WIDTH, dateFormItemProps } from '../../../constants/styles';
import { LOT_STATUS_OPTIONS } from '../../../constants/options';

export const InventoryLotEdit: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'inventory-lots' });

  return (
    <Edit saveButtonProps={saveButtonProps} title="编辑批次">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="批次号" name="lot_number">
              <Input disabled />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="状态" name="status">
              <Select options={LOT_STATUS_OPTIONS} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="数量" name="quantity">
              <InputNumber style={FULL_WIDTH} min={0} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label="生产日期"
              name="manufacture_date"
              {...dateFormItemProps}
            >
              <DatePicker style={FULL_WIDTH} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label="到期日期"
              name="expiry_date"
              {...dateFormItemProps}
            >
              <DatePicker style={FULL_WIDTH} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Edit>
  );
};
