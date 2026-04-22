import React from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { Form, Input, Select, Row, Col } from 'antd';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const WarehouseEdit: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'warehouses' });
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();

  return (
    <Edit saveButtonProps={saveButtonProps} title={pt('warehouses', 'edit')}>
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('warehouses', 'code')} name="code" rules={[{ required: true }]}>
              <Input />
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
            <Form.Item label={fl('warehouses', 'type')} name="type">
              <Select options={[
                { label: t('enums.warehouseType.raw_material'), value: 'raw_material' },
                { label: t('enums.warehouseType.finished_goods'), value: 'finished_goods' },
                { label: t('enums.warehouseType.wip'), value: 'wip' },
                { label: t('enums.warehouseType.returns'), value: 'returns' },
              ]} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={t('common.status')} name="status">
              <Select options={[
                { label: t('status.active'), value: 'active' },
                { label: t('status.inactive'), value: 'inactive' },
              ]} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Edit>
  );
};
