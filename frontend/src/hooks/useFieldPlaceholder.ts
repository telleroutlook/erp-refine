import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useFieldLabel } from './useFieldLabel';

export function useFieldPlaceholder(table: string) {
  const { t, i18n } = useTranslation();
  const fl = useFieldLabel();

  const select = useCallback(
    (column: string): string =>
      t('placeholders.select', { field: fl(table, column) }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, fl, table, i18n.language],
  );

  const input = useCallback(
    (column: string): string =>
      t('placeholders.input', { field: fl(table, column) }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, fl, table, i18n.language],
  );

  return { select, input };
}
