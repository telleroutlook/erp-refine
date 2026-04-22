import React from 'react';
import { useForm, Create } from '@refinedev/antd';
import { Form, Input, Select, InputNumber, Row, Col } from 'antd';
import { FULL_WIDTH } from '../../../constants/styles';
import { useTranslation } from 'react-i18next';

export const ApprovalRuleCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'approval-rules' });
  const { t } = useTranslation();

  return (
    <Create saveButtonProps={saveButtonProps} title="新建审批规则">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="规则名称" name="rule_name" rules={[{ required: true, message: '请输入规则名称' }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="单据类型" name="document_type" rules={[{ required: true, message: '请输入单据类型' }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="最低金额" name="min_amount">
              <InputNumber style={FULL_WIDTH} min={0} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="最高金额" name="max_amount">
              <InputNumber style={FULL_WIDTH} min={0} />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="审批角色" name="required_roles">
              <Select mode="tags" placeholder="输入角色后按回车添加" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="顺序" name="sequence_order" initialValue={1} rules={[{ required: true, message: '请输入顺序' }]}>
              <InputNumber style={FULL_WIDTH} min={1} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={t('common.status')} name="is_active" initialValue={true}>
              <Select
                options={[
                  { label: '启用', value: true },
                  { label: '停用', value: false },
                ]}
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Create>
  );
};
