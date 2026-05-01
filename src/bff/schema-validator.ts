// src/bff/schema-validator.ts
// Validates a generated UI Schema against component whitelist and JSON Schema spec

const ALLOWED_WIDGETS = new Set([
  'text', 'number', 'date', 'datetime', 'select', 'multiselect',
  'textarea', 'rate', 'checkbox', 'radio', 'file-upload',
  'currency', 'percentage', 'email', 'phone', 'url', 'color',
  'slider', 'switch', 'autocomplete', 'readonly',
  // Supabase foreign key selectors (custom widgets)
  'supplier-select', 'customer-select', 'product-select',
  'employee-select', 'warehouse-select', 'department-select',
]);

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateSchema(jsonSchema: Record<string, unknown>, uiSchema?: Record<string, unknown>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // JSON Schema must have type: object
  if (jsonSchema['type'] !== 'object') {
    errors.push('Root schema must have type: object');
  }

  const properties = jsonSchema['properties'] as Record<string, unknown> | undefined;
  if (!properties || Object.keys(properties).length === 0) {
    errors.push('Schema must define at least one property');
  }

  // Validate field types
  if (properties) {
    for (const [fieldName, fieldDef] of Object.entries(properties)) {
      const def = fieldDef as Record<string, unknown>;
      const allowedTypes = ['string', 'number', 'integer', 'boolean', 'array', 'object', 'null'];
      if (def['type'] && !allowedTypes.includes(def['type'] as string)) {
        errors.push(`Field '${fieldName}' has invalid type: ${def['type']}`);
      }
    }
  }

  // Validate UI schema widgets if present
  if (uiSchema && properties) {
    for (const [fieldName, uiDef] of Object.entries(uiSchema)) {
      if (fieldName.startsWith('ui:')) continue;
      const def = uiDef as Record<string, unknown>;
      const widget = def['ui:widget'] as string | undefined;
      if (widget && !ALLOWED_WIDGETS.has(widget)) {
        errors.push(`Field '${fieldName}' uses disallowed widget: '${widget}'. Allowed: ${[...ALLOWED_WIDGETS].join(', ')}`);
      }
    }
  }

  // Reject system/protected field names that must never appear in AI-generated schemas
  const systemFields = ['organization_id', 'deleted_at', 'created_by', '__proto__', 'constructor', 'prototype'];
  if (properties) {
    validatePropertiesRecursive(properties, systemFields, errors, '');
  }
  // Also check allOf/anyOf/oneOf at root level
  for (const keyword of ['allOf', 'anyOf', 'oneOf'] as const) {
    const arr = jsonSchema[keyword] as Array<Record<string, unknown>> | undefined;
    if (Array.isArray(arr)) {
      for (const sub of arr) {
        if (sub['properties']) {
          validatePropertiesRecursive(sub['properties'] as Record<string, unknown>, systemFields, errors, '');
        }
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

function validatePropertiesRecursive(
  properties: Record<string, unknown>,
  systemFields: string[],
  errors: string[],
  path: string
): void {
  for (const field of systemFields) {
    if (field in properties) {
      const fullPath = path ? `${path}.${field}` : field;
      errors.push(`Field '${fullPath}' is a protected system field and must not appear in generated schemas`);
    }
  }
  for (const [fieldName, fieldDef] of Object.entries(properties)) {
    const def = fieldDef as Record<string, unknown> | undefined;
    if (def && typeof def === 'object') {
      if (def['properties']) {
        const nested = def['properties'] as Record<string, unknown>;
        validatePropertiesRecursive(nested, systemFields, errors, path ? `${path}.${fieldName}` : fieldName);
      }
      for (const keyword of ['allOf', 'anyOf', 'oneOf'] as const) {
        const arr = def[keyword] as Array<Record<string, unknown>> | undefined;
        if (Array.isArray(arr)) {
          for (const sub of arr) {
            if (sub['properties']) {
              validatePropertiesRecursive(sub['properties'] as Record<string, unknown>, systemFields, errors, path ? `${path}.${fieldName}` : fieldName);
            }
          }
        }
      }
      if (def['items'] && typeof def['items'] === 'object') {
        const items = def['items'] as Record<string, unknown>;
        if (items['properties']) {
          validatePropertiesRecursive(items['properties'] as Record<string, unknown>, systemFields, errors, path ? `${path}.${fieldName}[]` : `${fieldName}[]`);
        }
      }
    }
  }
}
