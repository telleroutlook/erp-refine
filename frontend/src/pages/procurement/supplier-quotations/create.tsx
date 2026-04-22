import React from 'react';
import { useForm, Create } from '@refinedev/antd';
import { useList } from '@refinedev/core';
import { Form, Input, DatePicker, Select, Row, Col } from 'antd';
import { QUOTATION_STATUS_OPTIONS, CURRENCY_OPTIONS } from '../../../constants/options';
import { FULL_WIDTH } from '../../../constants/styles';

const STATUS_OPTIONS = QUOTATION_STATUS_OPTIONS.slice(0, 2);

export const SupplierQuotationCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'supplier-quotations' });
  const { data: suppliersData } = useList({ resource: 'suppliers', pagination: { pageSize: 500 } });
  const supplierOptions = (suppliersData?.data ?? []).map((s: any) => ({ label: `${s.code} - ${s.name}`, value: s.id }));

  return (
    <Create saveButtonProps={saveButtonProps} title="新建供应商报价">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="供应商" name="supplier_id" rules={[{ required: true, message: '请选择供应商' }]}>
              <Select options={supplierOptions} showSearch optionFilterProp="label" placeholder="选择供应商" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="状态" name="status" initialValue="draft">
              <Select options={STATUS_OPTIONS} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="询价单ID" name="rfq_id">
              <Input placeholder="关联询价单（可选）" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="货币" name="currency" initialValue="CNY">
              <Select options={CURRENCY_OPTIONS} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label="有效期"
              name="validity_date"
              getValueFromEvent={(d) => d?.format('YYYY-MM-DD')}
            >
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
    </Create>
  );
};
