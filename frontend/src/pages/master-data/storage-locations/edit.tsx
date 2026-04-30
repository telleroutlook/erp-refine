import React from 'react';
import { useForm, Edit, useSelect } from '@refinedev/antd';
import { Form, Input, Select, Switch, Row, Col } from 'antd';
import { useFieldLabel, usePageTitle } from '../../../hooks';
import { useTranslation } from 'react-i18next';

export const StorageLocationEdit: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();
  const { formProps, saveButtonProps } = useForm({ resource: 'storage-locations' });
  const { selectProps: warehouseSelectProps } = useSelect({ resource: 'warehouses', optionLabel: (r: any) => `${r.code} - ${r.name}` });

  return (
    <Edit saveButtonProps={saveButtonProps} title={pt('storage_locations', 'edit')}>
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('storage_locations', 'code')} name="code">
              <Input disabled />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('storage_locations', 'name')} name="name">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('storage_locations', 'warehouse_id')} name="warehouse_id">
              <Select {...warehouseSelectProps} showSearch  />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('storage_locations', 'zone')} name="zone">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('storage_locations', 'is_active')} name="is_active" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Edit>
  );
};
