import React from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { useList } from '@refinedev/core';
import { Form, Input, Select, Switch, Row, Col } from 'antd';

export const ProductCategoryEdit: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'product-categories' });
  const { data: catData } = useList({ resource: 'product-categories', pagination: { pageSize: 500 } });
  const catOptions = (catData?.data ?? []).map((c: any) => ({ label: `${c.code} - ${c.name}`, value: c.id }));

  return (
    <Edit saveButtonProps={saveButtonProps} title="编辑产品分类">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="编号" name="code">
              <Input disabled />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="名称" name="name">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="上级分类" name="parent_id">
              <Select options={catOptions} showSearch optionFilterProp="label" allowClear placeholder="选择上级分类" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="启用" name="is_active" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Edit>
  );
};
