import React from 'react';

interface AmountDisplayProps {
  value: number | string | null | undefined;
  currency?: string;
}

const formatterCache = new Map<string, Intl.NumberFormat>();
function getFormatter(currency: string): Intl.NumberFormat {
  let fmt = formatterCache.get(currency);
  if (!fmt) {
    fmt = new Intl.NumberFormat('zh-CN', { style: 'currency', currency, minimumFractionDigits: 2 });
    formatterCache.set(currency, fmt);
  }
  return fmt;
}

export const AmountDisplay: React.FC<AmountDisplayProps> = React.memo(({ value, currency = 'USD' }) => {
  const num = Number(value);
  if (isNaN(num)) return <span>—</span>;

  const formatted = getFormatter(currency).format(num);
  return <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatted}</span>;
});
