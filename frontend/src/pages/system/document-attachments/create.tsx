import React from 'react';
import { useForm, Create } from '@refinedev/antd';
import { Form, Input, InputNumber, Row, Col } from 'antd';

export const DocumentAttachmentCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'document-attachments' });

  return (
    <Create saveButtonProps={saveButtonProps} title="新建文档附件">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="文件名" name="file_name" rules={[{ required: true, message: '请输入文件名' }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="关联类型" name="entity_type" rules={[{ required: true, message: '请输入关联类型' }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="关联ID" name="entity_id" rules={[{ required: true, message: '请输入关联ID' }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="文件路径" name="file_path" rules={[{ required: true, message: '请输入文件路径' }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="MIME类型" name="mime_type">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="文件大小(字节)" name="file_size">
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Create>
  );
};
