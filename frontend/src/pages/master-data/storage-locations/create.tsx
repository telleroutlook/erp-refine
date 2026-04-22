import React from 'react';
import { useForm, Create } from '@refinedev/antd';
import { useList } from '@refinedev/core';
import { Form, Input, Select, Switch, Row, Col } from 'antd';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const StorageLocationCreate: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();
  const { formProps, saveButtonProps } = useForm({ resource: 'storage-locations' });
  const { data: warehouseData } = useList({ resource: 'warehouses', pagination: { pageSize: 500 } });
  const warehouseOptions = (warehouseData?.data ?? []).map((w: any) => ({ label: `${w.code} - ${w.name}`, value: w.id }));

  return (
    <Create saveButtonProps={saveButtonProps} title={pt('storage_locations', 'create')}>
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('storage_locations', 'code')} name="code" rules={[{ required: true, message: t('validation.required', { field: fl('storage_locations', 'code') }) }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('storage_locations', 'name')} name="name" rules={[{ required: true, message: t('validation.required', { field: fl('storage_locations', 'name') }) }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('storage_locations', 'warehouse_id')} name="warehouse_id" rules={[{ required: true, message: t('validation.requiredSelect', { field: fl('storage_locations', 'warehouse_id') }) }]}>
              <Select options={warehouseOptions} showSearch optionFilterProp="label"  />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('storage_locations', 'zone')} name="zone">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('storage_locations', 'is_active')} name="is_active" valuePropName="checked" initialValue={true}>
              <Switch />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Create>
  );
};
