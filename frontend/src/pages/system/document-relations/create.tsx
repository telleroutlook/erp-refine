import React from 'react';
import { useForm, Create } from '@refinedev/antd';
import { Form, Input, Row, Col } from 'antd';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const DocumentRelationCreate: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();
  const { formProps, saveButtonProps } = useForm({ resource: 'document-relations' });

  return (
    <Create saveButtonProps={saveButtonProps} title={pt('document_relations', 'create')}>
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('document_relations', 'from_object_type')} name="from_object_type" rules={[{ required: true, message: t('validation.required', { field: fl('document_relations', 'from_object_type') }) }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('document_relations', 'from_object_id')} name="from_object_id" rules={[{ required: true, message: t('validation.required', { field: fl('document_relations', 'from_object_id') }) }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('document_relations', 'to_object_type')} name="to_object_type" rules={[{ required: true, message: t('validation.required', { field: fl('document_relations', 'to_object_type') }) }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('document_relations', 'to_object_id')} name="to_object_id" rules={[{ required: true, message: t('validation.required', { field: fl('document_relations', 'to_object_id') }) }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('document_relations', 'relation_type')} name="relation_type" initialValue="reference">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('document_relations', 'label')} name="label">
              <Input />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Create>
  );
};
