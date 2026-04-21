import React from 'react';
import { useForm, Create } from '@refinedev/antd';
import { useList } from '@refinedev/core';
import { Form, Input, Select, Switch, Row, Col } from 'antd';

export const AccountSubjectCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'account-subjects' });
  const { data: accountsData } = useList({ resource: 'account-subjects', pagination: { pageSize: 500 } });
  const parentOptions = (accountsData?.data ?? []).map((a: any) => ({ label: `${a.code} - ${a.name}`, value: a.id }));

  return (
    <Create saveButtonProps={saveButtonProps} title="新建会计科目">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="科目编码" name="code" rules={[{ required: true, message: '请输入科目编码' }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="科目名称" name="name" rules={[{ required: true, message: '请输入科目名称' }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
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
          <Col span={12}>
            <Form.Item label="余额方向" name="balance_direction">
              <Select
                options={[
                  { value: 'debit', label: '借' },
                  { value: 'credit', label: '贷' },
                ]}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="上级科目" name="parent_id">
              <Select options={parentOptions} showSearch optionFilterProp="label" placeholder="选择上级科目" allowClear />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="末级科目" name="is_leaf" valuePropName="checked" initialValue={true}>
              <Switch />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Create>
  );
};
