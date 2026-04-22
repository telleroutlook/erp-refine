import React from 'react';
import { useForm, Create, useSelect } from '@refinedev/antd';
import { Form, Input, DatePicker, Select, Row, Col } from 'antd';
import { useTranslation } from 'react-i18next';
import { FULL_WIDTH } from '../../../constants/styles';
import { RECONCILIATION_STATUS_OPTIONS, CURRENCY_OPTIONS } from '../../../constants/options';

export const ReconciliationStatementCreate: React.FC = () => {
  const { t } = useTranslation();
  const { formProps, saveButtonProps } = useForm({ resource: 'reconciliation-statements' });
  const { selectProps: supplierProps } = useSelect({ resource: 'suppliers', optionLabel: 'name', optionValue: 'id' });

  return (
    <Create saveButtonProps={saveButtonProps} title="新建对账单">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="供应商" name="supplier_id" rules={[{ required: true, message: '请选择供应商' }]}>
              <Select {...supplierProps} showSearch placeholder="选择供应商" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="货币" name="currency" initialValue="CNY">
              <Select options={CURRENCY_OPTIONS} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="期间开始" name="period_start" rules={[{ required: true, message: '请选择期间开始日期' }]} getValueFromEvent={(d) => d?.format('YYYY-MM-DD')}>
              <DatePicker style={FULL_WIDTH} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="期间结束" name="period_end" rules={[{ required: true, message: '请选择期间结束日期' }]} getValueFromEvent={(d) => d?.format('YYYY-MM-DD')}>
              <DatePicker style={FULL_WIDTH} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="状态" name="status" initialValue="draft">
              <Select options={RECONCILIATION_STATUS_OPTIONS} />
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
