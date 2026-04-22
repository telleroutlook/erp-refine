import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

function humanize(column: string): string {
  return column
    .replace(/_id$/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function useFieldLabel() {
  const { t, i18n } = useTranslation();

  return useCallback(
    (table: string, column: string): string => {
      const specific = t(`fields.${table}.${column}`, { defaultValue: '' });
      if (specific) return specific;

      const common = t(`fields.common.${column}`, { defaultValue: '' });
      if (common) return common;

      return humanize(column);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, i18n.language],
  );
}
