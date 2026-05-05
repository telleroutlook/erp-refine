import React from 'react';
import { Tag } from 'antd';
import { useTranslation } from 'react-i18next';

export interface ChipStyle {
  bg: string;
  color: string;
}

export const CHIP_GRAY: ChipStyle    = { bg: 'var(--status-gray-bg)', color: 'var(--status-gray-text)' };
export const CHIP_BLUE: ChipStyle    = { bg: 'var(--status-blue-bg)', color: 'var(--status-blue-text)' };
export const CHIP_GREEN: ChipStyle   = { bg: 'var(--status-green-bg)', color: 'var(--status-green-text)' };
export const CHIP_YELLOW: ChipStyle  = { bg: 'var(--status-yellow-bg)', color: 'var(--status-yellow-text)' };
export const CHIP_RED: ChipStyle     = { bg: 'var(--status-red-bg)', color: 'var(--status-red-text)' };
export const CHIP_CYAN: ChipStyle    = { bg: 'var(--status-cyan-bg)', color: 'var(--status-cyan-text)' };
export const CHIP_PURPLE: ChipStyle  = { bg: 'var(--status-purple-bg)', color: 'var(--status-purple-text)' };

const STATUS_STYLES: Record<string, ChipStyle> = {
  draft: CHIP_GRAY,
  inactive: CHIP_GRAY,
  archived: CHIP_GRAY,
  closed: CHIP_GRAY,
  expired: CHIP_GRAY,
  scrapped: CHIP_GRAY,
  disposed: CHIP_GRAY,
  discontinued: CHIP_GRAY,
  void: CHIP_GRAY,
  idle: CHIP_GRAY,
  voided: CHIP_GRAY,
  skipped: CHIP_GRAY,

  submitted: CHIP_BLUE,
  in_progress: CHIP_BLUE,
  processing: CHIP_BLUE,
  confirmed: CHIP_BLUE,
  ordered: CHIP_BLUE,
  issued: CHIP_BLUE,
  released: CHIP_BLUE,
  shipping: CHIP_BLUE,
  partially_received: CHIP_BLUE,
  partially_shipped: CHIP_BLUE,
  in_transit: CHIP_BLUE,
  in_stock: CHIP_BLUE,
  open: CHIP_BLUE,
  selected: CHIP_BLUE,

  approved: CHIP_GREEN,
  active: CHIP_GREEN,
  completed: CHIP_GREEN,
  passed: CHIP_GREEN,
  accepted: CHIP_GREEN,
  available: CHIP_GREEN,
  received: CHIP_GREEN,
  paid: CHIP_GREEN,
  delivered: CHIP_GREEN,
  posted: CHIP_GREEN,
  fulfilled: CHIP_GREEN,
  reconciled: CHIP_GREEN,
  verified: CHIP_GREEN,
  valid: CHIP_GREEN,

  pending: CHIP_YELLOW,
  quarantine: CHIP_YELLOW,
  recalled: CHIP_YELLOW,
  partially_paid: CHIP_YELLOW,
  invoiced: CHIP_YELLOW,
  pending_approval: CHIP_YELLOW,
  overdue: CHIP_YELLOW,
  expiring: CHIP_YELLOW,
  partial: CHIP_YELLOW,
  disputed: CHIP_YELLOW,
  evaluated: CHIP_YELLOW,

  cancelled: CHIP_RED,
  rejected: CHIP_RED,
  failed: CHIP_RED,
  terminated: CHIP_RED,
  aborted: CHIP_RED,
  blocked: CHIP_RED,
  suspended: CHIP_RED,

  shipped: CHIP_CYAN,
  returned: CHIP_CYAN,
  converted: CHIP_CYAN,
  consumed: CHIP_CYAN,
  under_maintenance: CHIP_CYAN,

  conditional: CHIP_PURPLE,
  sold: CHIP_PURPLE,
};

const chipBase: React.CSSProperties = {
  textTransform: 'uppercase',
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: '0.5px',
  border: 'none',
  borderRadius: 4,
  lineHeight: '20px',
  padding: '1px 8px',
};

interface StatusTagProps {
  status: string;
  label?: string;
}

export const StatusTag: React.FC<StatusTagProps> = ({ status, label }) => {
  const { t } = useTranslation();
  if (!status && !label) return null;
  const style = STATUS_STYLES[status?.toLowerCase()] ?? CHIP_GRAY;

  return (
    <Tag
      style={{
        ...chipBase,
        background: style.bg,
        color: style.color,
      }}
    >
      {label ?? t(`status.${status}`, { defaultValue: status })}
    </Tag>
  );
};
