import React from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { Form, Input, DatePicker, Select, Row, Col } from 'antd';
import { FULL_WIDTH, dateFormItemProps } from '../../../constants/styles';
import { RETURN_STATUS_OPTIONS } from '../../../constants/options';

export const SalesReturnEdit: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'sales-returns' });

  return (
    <Edit saveButtonProps={saveButtonProps} title="编辑销售退货单">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="退货单号" name="return_number">
              <Input disabled />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="状态" name="status">
              <Select options={RETURN_STATUS_OPTIONS} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label="退货日期"
              name="return_date"
              {...dateFormItemProps}
            >
              <DatePicker style={FULL_WIDTH} disabled />
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
