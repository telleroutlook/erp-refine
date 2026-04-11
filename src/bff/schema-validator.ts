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

  // Warn on dangerous field names
  const dangerousPatterns = ['organization_id', 'deleted_at', 'created_by', '__proto__', 'constructor'];
  if (properties) {
    for (const pattern of dangerousPatterns) {
      if (pattern in properties) {
        warnings.push(`Field '${pattern}' is a system field and may be rejected`);
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}
