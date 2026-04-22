import React from 'react';
import { useForm, Create } from '@refinedev/antd';
import { Form, Input, DatePicker, Select, Row, Col } from 'antd';
import { VOUCHER_TYPE_OPTIONS, translateOptions } from '../../../constants/options';
import { FULL_WIDTH } from '../../../constants/styles';
import { useTranslation } from 'react-i18next';

export const VoucherCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'vouchers' });
  const { t } = useTranslation();

  return (
    <Create saveButtonProps={saveButtonProps} title="新建会计凭证">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label="凭证日期"
              name="voucher_date"
              rules={[{ required: true, message: '请选择凭证日期' }]}
              getValueFromEvent={(d) => d?.format('YYYY-MM-DD')}
            >
              <DatePicker style={FULL_WIDTH} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="凭证类型" name="voucher_type">
              <Select options={translateOptions(VOUCHER_TYPE_OPTIONS, t, 'enums.voucherType')} />
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
