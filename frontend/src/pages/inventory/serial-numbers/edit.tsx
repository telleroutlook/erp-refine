import React from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { useList } from '@refinedev/core';
import { Form, Input, Select, Row, Col } from 'antd';
import { SERIAL_STATUS_OPTIONS, translateOptions } from '../../../constants/options';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const SerialNumberEdit: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'serial-numbers' });
  const { data: warehousesData } = useList({ resource: 'warehouses', pagination: { pageSize: 500 } });
  const warehouseOptions = (warehousesData?.data ?? []).map((w: any) => ({ label: `${w.code} - ${w.name}`, value: w.id }));
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();

  return (
    <Edit saveButtonProps={saveButtonProps} title={pt('serial_numbers', 'edit')}>
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('serial_numbers', 'serial_number')} name="serial_number">
              <Input disabled />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={t('common.status')} name="status">
              <Select options={translateOptions(SERIAL_STATUS_OPTIONS, t)} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('serial_numbers', 'warehouse_id')} name="warehouse_id">
              <Select options={warehouseOptions} showSearch optionFilterProp="label" allowClear />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Edit>
  );
};
