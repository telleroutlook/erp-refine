import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useFieldLabel } from './useFieldLabel';

interface ValidationRule {
  required: boolean;
  message: string;
}

export function useValidationRules(table: string) {
  const { t, i18n } = useTranslation();
  const fl = useFieldLabel();

  const required = useCallback(
    (column: string, isSelect = false): ValidationRule => {
      const field = fl(table, column);
      const key = isSelect ? 'validation.requiredSelect' : 'validation.required';
      return { required: true, message: t(key, { field }) };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, fl, table, i18n.language],
  );

  const email = useCallback(
    (): { type: 'email'; message: string } => ({
      type: 'email',
      message: t('validation.email'),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, i18n.language],
  );

  return { required, email };
}
