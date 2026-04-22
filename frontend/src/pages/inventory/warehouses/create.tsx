import React from 'react';
import { useForm, Create } from '@refinedev/antd';
import { Form, Input, Select, Row, Col } from 'antd';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const WarehouseCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'warehouses' });
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();

  return (
    <Create saveButtonProps={saveButtonProps} title={pt('warehouses', 'create')}>
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('warehouses', 'code')} name="code" rules={[{ required: true }]}>
              <Input placeholder="WH-001" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('warehouses', 'name')} name="name" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('warehouses', 'location')} name="location">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('warehouses', 'type')} name="type" initialValue="standard">
              <Select options={[
                { label: t('enums.warehouseType.standard'), value: 'standard' },
                { label: t('enums.warehouseType.cold_storage'), value: 'cold_storage' },
                { label: t('enums.warehouseType.hazardous'), value: 'hazardous' },
                { label: t('enums.warehouseType.bonded'), value: 'bonded' },
                { label: t('enums.warehouseType.virtual'), value: 'virtual' },
              ]} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={t('common.status')} name="status" initialValue="active">
              <Select options={[
                { label: t('status.active'), value: 'active' },
                { label: t('status.inactive'), value: 'inactive' },
              ]} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Create>
  );
};
