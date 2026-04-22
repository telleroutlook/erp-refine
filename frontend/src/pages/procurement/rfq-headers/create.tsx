import React from 'react';
import { useForm, Create } from '@refinedev/antd';
import { Form, Input, DatePicker, Select, Row, Col } from 'antd';
import { RFQ_STATUS_OPTIONS, translateOptions } from '../../../constants/options';
import { FULL_WIDTH } from '../../../constants/styles';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const RfqHeaderCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'rfq-headers' });
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();
  const statusOpts = translateOptions(RFQ_STATUS_OPTIONS.slice(0, 2), t);

  return (
    <Create saveButtonProps={saveButtonProps} title={pt('rfq_headers', 'create')}>
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label={fl('rfq_headers', 'due_date')}
              name="due_date"
              rules={[{ required: true, message: '请选择截止日期' }]}
              getValueFromEvent={(d) => d?.format('YYYY-MM-DD')}
            >
              <DatePicker style={FULL_WIDTH} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={t('common.status')} name="status" initialValue="draft">
              <Select options={statusOpts} />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label={t('common.notes')} name="notes">
              <Input.TextArea rows={3} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Create>
  );
};
