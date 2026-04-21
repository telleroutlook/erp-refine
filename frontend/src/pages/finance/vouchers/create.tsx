import React from 'react';
import { useForm, Create } from '@refinedev/antd';
import { Form, Input, DatePicker, Select, Row, Col } from 'antd';

export const VoucherCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'vouchers' });

  return (
    <Create saveButtonProps={saveButtonProps} title="新建会计凭证">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="凭证日期"
              name="voucher_date"
              rules={[{ required: true, message: '请选择凭证日期' }]}
              getValueFromEvent={(d) => d?.format('YYYY-MM-DD')}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="凭证类型" name="voucher_type">
              <Select
                options={[
                  { value: 'general', label: '记账' },
                  { value: 'receipt', label: '收款' },
                  { value: 'payment', label: '付款' },
                  { value: 'transfer', label: '转账' },
                ]}
              />
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
