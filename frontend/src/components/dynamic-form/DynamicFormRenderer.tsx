import React from 'react';
import Form from '@rjsf/antd';
import validator from '@rjsf/validator-ajv8';
import { Spin, Result, Alert } from 'antd';
import type { RJSFSchema, UiSchema } from '@rjsf/utils';

interface DynamicFormRendererProps {
  jsonSchema: RJSFSchema;
  uiSchema?: UiSchema;
  formData?: Record<string, unknown>;
  onSubmit: (data: Record<string, unknown>) => void | Promise<void>;
  loading?: boolean;
  disabled?: boolean;
}

export const DynamicFormRenderer: React.FC<DynamicFormRendererProps> = ({
  jsonSchema,
  uiSchema,
  formData,
  onSubmit,
  loading = false,
  disabled = false,
}) => {
  if (!jsonSchema) return <Spin />;

  return (
    <Form
      schema={jsonSchema}
      uiSchema={uiSchema}
      formData={formData}
      validator={validator}
      disabled={disabled || loading}
      onSubmit={({ formData: data }) => onSubmit(data)}
    />
  );
};
