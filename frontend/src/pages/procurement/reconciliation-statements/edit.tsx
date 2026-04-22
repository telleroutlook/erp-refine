import React from 'react';
import { useForm, Edit, useSelect } from '@refinedev/antd';
import { Form, Input, DatePicker, Select, Row, Col } from 'antd';
import { useTranslation } from 'react-i18next';
import { FULL_WIDTH, dateFormItemProps } from '../../../constants/styles';
import { RECONCILIATION_STATUS_OPTIONS, CURRENCY_OPTIONS } from '../../../constants/options';

export const ReconciliationStatementEdit: React.FC = () => {
  const { t } = useTranslation();
  const { formProps, saveButtonProps } = useForm({ resource: 'reconciliation-statements' });
  const { selectProps: supplierProps } = useSelect({ resource: 'suppliers', optionLabel: 'name', optionValue: 'id' });

  return (
    <Edit saveButtonProps={saveButtonProps} title="编辑对账单">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="对账单号" name="statement_no">
              <Input disabled />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="状态" name="status">
              <Select options={RECONCILIATION_STATUS_OPTIONS} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="供应商" name="supplier_id">
              <Select {...supplierProps} showSearch />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="货币" name="currency">
              <Select options={CURRENCY_OPTIONS} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="期间开始" name="period_start" {...dateFormItemProps}>
              <DatePicker style={FULL_WIDTH} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="期间结束" name="period_end" {...dateFormItemProps}>
              <DatePicker style={FULL_WIDTH} />
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
