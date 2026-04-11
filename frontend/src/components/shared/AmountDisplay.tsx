import React from 'react';

interface AmountDisplayProps {
  value: number | string | null | undefined;
  currency?: string;
}

export const AmountDisplay: React.FC<AmountDisplayProps> = ({ value, currency = 'USD' }) => {
  const num = Number(value);
  if (isNaN(num)) return <span>—</span>;

  const formatted = new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(num);

  return <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatted}</span>;
};
