import React from 'react';
import { useForm, Create } from '@refinedev/antd';
import { Form, Input, DatePicker, Select, Row, Col } from 'antd';
import { RFQ_STATUS_OPTIONS } from '../../../constants/options';

const STATUS_OPTIONS = RFQ_STATUS_OPTIONS.slice(0, 2);

export const RfqHeaderCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'rfq-headers' });

  return (
    <Create saveButtonProps={saveButtonProps} title="新建询价单">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="截止日期"
              name="due_date"
              rules={[{ required: true, message: '请选择截止日期' }]}
              getValueFromEvent={(d) => d?.format('YYYY-MM-DD')}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="状态" name="status" initialValue="draft">
              <Select options={STATUS_OPTIONS} />
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
