import React from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { Form, Input, DatePicker, Select, Row, Col } from 'antd';
import dayjs from 'dayjs';
import { RECEIPT_STATUS_OPTIONS } from '../../../constants/options';

export const PurchaseReceiptEdit: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'purchase-receipts' });

  return (
    <Edit saveButtonProps={saveButtonProps} title="编辑采购收货单">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="收货单号" name="receipt_number">
              <Input disabled />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="状态" name="status">
              <Select options={RECEIPT_STATUS_OPTIONS} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="收货日期"
              name="received_date"
              getValueProps={(v) => ({ value: v ? dayjs(v) : undefined })}
              getValueFromEvent={(d) => d?.format('YYYY-MM-DD')}
            >
              <DatePicker style={{ width: '100%' }} />
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
