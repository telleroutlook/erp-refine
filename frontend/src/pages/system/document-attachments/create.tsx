import React from 'react';
import { useForm, Create } from '@refinedev/antd';
import { Form, Input, InputNumber, Row, Col } from 'antd';
import { FULL_WIDTH } from '../../../constants/styles';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const DocumentAttachmentCreate: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();
  const { formProps, saveButtonProps } = useForm({ resource: 'document-attachments' });

  return (
    <Create saveButtonProps={saveButtonProps} title={pt('document_attachments', 'create')}>
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('document_attachments', 'file_name')} name="file_name" rules={[{ required: true, message: t('validation.required', { field: fl('document_attachments', 'file_name') }) }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('document_attachments', 'relation_type')} name="entity_type" rules={[{ required: true, message: t('validation.required', { field: fl('document_attachments', 'relation_type') }) }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('document_attachments', 'entity_id')} name="entity_id" rules={[{ required: true, message: t('validation.required', { field: fl('document_attachments', 'entity_id') }) }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('document_attachments', 'file_path')} name="file_path" rules={[{ required: true, message: t('validation.required', { field: fl('document_attachments', 'file_path') }) }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('document_attachments', 'mime_type')} name="mime_type">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('document_attachments', 'file_size')} name="file_size">
              <InputNumber style={FULL_WIDTH} min={0} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Create>
  );
};
