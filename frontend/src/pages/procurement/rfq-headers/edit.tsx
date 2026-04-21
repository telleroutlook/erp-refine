import React from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { Form, Input, DatePicker, Select, Row, Col } from 'antd';
import dayjs from 'dayjs';
import { RFQ_STATUS_OPTIONS } from '../../../constants/options';

export const RfqHeaderEdit: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'rfq-headers' });

  return (
    <Edit saveButtonProps={saveButtonProps} title="编辑询价单">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="询价单号" name="rfq_number">
              <Input disabled />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="状态" name="status">
              <Select options={RFQ_STATUS_OPTIONS} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="截止日期"
              name="due_date"
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
