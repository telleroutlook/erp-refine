import React from 'react';
import { useForm, Create } from '@refinedev/antd';
import { useList } from '@refinedev/core';
import { Form, Input, Select, Switch, Row, Col } from 'antd';

export const ProductCategoryCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'product-categories' });
  const { data: catData } = useList({ resource: 'product-categories', pagination: { pageSize: 500 } });
  const catOptions = (catData?.data ?? []).map((c: any) => ({ label: `${c.code} - ${c.name}`, value: c.id }));

  return (
    <Create saveButtonProps={saveButtonProps} title="新建产品分类">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="编号" name="code" rules={[{ required: true, message: '请输入编号' }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="名称" name="name" rules={[{ required: true, message: '请输入名称' }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="上级分类" name="parent_id">
              <Select options={catOptions} showSearch optionFilterProp="label" allowClear placeholder="选择上级分类" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="启用" name="is_active" valuePropName="checked" initialValue={true}>
              <Switch />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Create>
  );
};
