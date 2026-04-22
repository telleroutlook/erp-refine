import React from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { useList } from '@refinedev/core';
import { Form, Input, Select, Switch, Row, Col } from 'antd';

export const AccountSubjectEdit: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'account-subjects' });
  const { data: accountsData } = useList({ resource: 'account-subjects', pagination: { pageSize: 500 } });
  const parentOptions = (accountsData?.data ?? []).map((a: any) => ({ label: `${a.code} - ${a.name}`, value: a.id }));

  return (
    <Edit saveButtonProps={saveButtonProps} title="编辑会计科目">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="科目编码" name="code">
              <Input disabled />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="科目名称" name="name">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="类别" name="category">
              <Select
                options={[
                  { value: 'asset', label: '资产' },
                  { value: 'liability', label: '负债' },
                  { value: 'equity', label: '权益' },
                  { value: 'revenue', label: '收入' },
                  { value: 'expense', label: '费用' },
                ]}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="余额方向" name="balance_direction">
              <Select
                options={[
                  { value: 'debit', label: '借' },
                  { value: 'credit', label: '贷' },
                ]}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="上级科目" name="parent_id">
              <Select options={parentOptions} showSearch optionFilterProp="label" placeholder="选择上级科目" allowClear />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="末级科目" name="is_leaf" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="状态" name="status">
              <Select
                options={[
                  { value: 'active', label: '启用' },
                  { value: 'inactive', label: '停用' },
                ]}
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Edit>
  );
};
