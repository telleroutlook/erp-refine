import React from 'react';
import { useTranslation } from 'react-i18next';

interface AmountDisplayProps {
  value: number | string | null | undefined;
  currency?: string;
}

const formatterCache = new Map<string, Intl.NumberFormat>();
function getFormatter(currency: string, locale: string): Intl.NumberFormat | null {
  const key = `${locale}:${currency}`;
  let fmt = formatterCache.get(key);
  if (!fmt) {
    try {
      fmt = new Intl.NumberFormat(locale, { style: 'currency', currency, minimumFractionDigits: 2 });
      formatterCache.set(key, fmt);
    } catch {
      return null;
    }
  }
  return fmt;
}

export const AmountDisplay: React.FC<AmountDisplayProps> = React.memo(({ value, currency = 'USD' }) => {
  const { i18n } = useTranslation();
  const num = Number(value);
  if (isNaN(num)) return <span>—</span>;

  const locale = i18n.language === 'zh-CN' ? 'zh-CN' : 'en-US';
  const fmt = getFormatter(currency, locale);
  if (!fmt) return <span>{num.toFixed(2)}</span>;
  const formatted = fmt.format(num);
  return <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatted}</span>;
});
