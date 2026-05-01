import React, { useState } from 'react';
import { useOne } from '@refinedev/core';
import { Spin, Result, message, theme } from 'antd';
import { DynamicFormRenderer } from '../../components/dynamic-form/DynamicFormRenderer';
import { useTranslation } from 'react-i18next';
import { getAccessToken } from '../../providers/token';

interface DynamicFormPageProps {
  schemaId: string;
}

export const DynamicFormPage: React.FC<DynamicFormPageProps> = ({ schemaId }) => {
  const { token } = theme.useToken();
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);

  const { data, isLoading, isError } = useOne({
    resource: 'schema',
    id: schemaId,
  });

  if (isLoading) return <Spin size="large" style={{ display: 'block', margin: '40px auto' }} />;
  if (isError) return <Result status="error" title={t('dynamicForm.loadFailed')} />;

  const schema = data?.data;

  if (schema?.status !== 'active') {
    return <Result status="warning" title={t('dynamicForm.notActive')} subTitle={t('dynamicForm.contactAdmin')} />;
  }

  const handleSubmit = async (formData: Record<string, unknown>) => {
    setSubmitting(true);
    try {
      const accessToken = getAccessToken();
      const res = await fetch('/api/dynamic-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ schemaId, data: formData }),
      });

      if (!res.ok) throw new Error(t('dynamicForm.submitFailed'));
      message.success(t('dynamicForm.submitSuccess'));
    } catch (err) {
      message.error(err instanceof Error ? err.message : t('dynamicForm.submitFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '24px auto' }}>
      <h2>{schema.name}</h2>
      {schema.description && <p style={{ color: token.colorTextSecondary }}>{schema.description}</p>}
      <DynamicFormRenderer
        jsonSchema={schema.json_schema}
        uiSchema={schema.ui_schema}
        onSubmit={handleSubmit}
        loading={submitting}
      />
    </div>
  );
};
