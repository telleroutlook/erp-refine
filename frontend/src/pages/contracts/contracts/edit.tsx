import React from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { Form, Input, DatePicker, Select, InputNumber, Row, Col } from 'antd';
import dayjs from 'dayjs';
import { CONTRACT_STATUS_OPTIONS, CONTRACT_TYPE_OPTIONS, CURRENCY_OPTIONS } from '../../../constants/options';

export const ContractEdit: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'contracts' });

  return (
    <Edit saveButtonProps={saveButtonProps} title="编辑合同">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="合同号" name="contract_number">
              <Input disabled />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="合同类型" name="contract_type">
              <Select options={CONTRACT_TYPE_OPTIONS} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="状态" name="status">
              <Select options={CONTRACT_STATUS_OPTIONS} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="对方类型" name="party_type">
              <Select
                options={[
                  { value: 'customer', label: '客户' },
                  { value: 'supplier', label: '供应商' },
                ]}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="开始日期"
              name="start_date"
              getValueProps={(v) => ({ value: v ? dayjs(v) : undefined })}
              getValueFromEvent={(d) => d?.format('YYYY-MM-DD')}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="结束日期"
              name="end_date"
              getValueProps={(v) => ({ value: v ? dayjs(v) : undefined })}
              getValueFromEvent={(d) => d?.format('YYYY-MM-DD')}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="货币" name="currency">
              <Select options={CURRENCY_OPTIONS} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="税率" name="tax_rate">
              <InputNumber style={{ width: '100%' }} min={0} max={100} precision={2} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="付款条件（天）" name="payment_terms">
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="描述" name="description">
              <Input.TextArea rows={3} />
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
