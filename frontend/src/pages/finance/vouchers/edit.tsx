import React from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { Form, Input, DatePicker, Select, Row, Col } from 'antd';
import dayjs from 'dayjs';
import { VOUCHER_STATUS_OPTIONS } from '../../../constants/options';

export const VoucherEdit: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'vouchers' });

  return (
    <Edit saveButtonProps={saveButtonProps} title="编辑会计凭证">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="凭证号" name="voucher_number">
              <Input disabled />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="状态" name="status">
              <Select options={VOUCHER_STATUS_OPTIONS} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="凭证日期"
              name="voucher_date"
              getValueProps={(v) => ({ value: v ? dayjs(v) : undefined })}
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
    </Edit>
  );
};
