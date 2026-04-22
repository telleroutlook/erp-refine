import React from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { Form, Input, Select, Row, Col } from 'antd';
import { useTranslation } from 'react-i18next';

export const WarehouseEdit: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'warehouses' });
  const { t } = useTranslation();

  return (
    <Edit saveButtonProps={saveButtonProps} title="编辑仓库">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="仓库编号" name="code" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="仓库名称" name="name" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="位置" name="location">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="类型" name="type">
              <Select options={[
                { label: '原材料仓', value: 'raw_material' },
                { label: '成品仓', value: 'finished_goods' },
                { label: '半成品仓', value: 'wip' },
                { label: '退货仓', value: 'returns' },
              ]} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={t('common.status')} name="status">
              <Select options={[
                { label: '启用', value: 'active' },
                { label: '停用', value: 'inactive' },
              ]} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Edit>
  );
};
