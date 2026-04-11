import React, { useState } from 'react';
import { useOne } from '@refinedev/core';
import { Spin, Result, message } from 'antd';
import { DynamicFormRenderer } from '../../components/dynamic-form/DynamicFormRenderer';

interface DynamicFormPageProps {
  schemaId: string;
}

export const DynamicFormPage: React.FC<DynamicFormPageProps> = ({ schemaId }) => {
  const [submitting, setSubmitting] = useState(false);

  const { data, isLoading, isError } = useOne({
    resource: 'schema',
    id: schemaId,
  });

  if (isLoading) return <Spin size="large" style={{ display: 'block', margin: '40px auto' }} />;
  if (isError) return <Result status="error" title="加载表单失败" />;

  const schema = data?.data;

  if (schema?.status !== 'active') {
    return <Result status="warning" title="此表单尚未激活" subTitle="请联系管理员激活此表单" />;
  }

  const handleSubmit = async (formData: Record<string, unknown>) => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('/api/dynamic-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ schemaId, data: formData }),
      });

      if (!res.ok) throw new Error('提交失败');
      message.success('提交成功');
    } catch (err) {
      message.error(err instanceof Error ? err.message : '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '24px auto' }}>
      <h2>{schema.name}</h2>
      {schema.description && <p style={{ color: '#666' }}>{schema.description}</p>}
      <DynamicFormRenderer
        jsonSchema={schema.json_schema}
        uiSchema={schema.ui_schema}
        onSubmit={handleSubmit}
        loading={submitting}
      />
    </div>
  );
};
