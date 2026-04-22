import React from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { useList } from '@refinedev/core';
import { Form, Input, Select, Row, Col } from 'antd';
import { SERIAL_STATUS_OPTIONS } from '../../../constants/options';

export const SerialNumberEdit: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'serial-numbers' });
  const { data: warehousesData } = useList({ resource: 'warehouses', pagination: { pageSize: 500 } });
  const warehouseOptions = (warehousesData?.data ?? []).map((w: any) => ({ label: `${w.code} - ${w.name}`, value: w.id }));

  return (
    <Edit saveButtonProps={saveButtonProps} title="编辑序列号">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="序列号" name="serial_number">
              <Input disabled />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="状态" name="status">
              <Select options={SERIAL_STATUS_OPTIONS} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="仓库" name="warehouse_id">
              <Select options={warehouseOptions} showSearch optionFilterProp="label" allowClear />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Edit>
  );
};
