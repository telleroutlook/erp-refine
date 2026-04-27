import React from 'react';
import { Tag } from 'antd';
import { useTranslation } from 'react-i18next';

interface ChipStyle {
  bg: string;
  color: string;
}

const GRAY: ChipStyle    = { bg: '#F1F5F9', color: '#64748B' };
const BLUE: ChipStyle    = { bg: '#DBEAFE', color: '#1E40AF' };
const GREEN: ChipStyle   = { bg: '#DCFCE7', color: '#166534' };
const YELLOW: ChipStyle  = { bg: '#FEF3C7', color: '#92400E' };
const RED: ChipStyle     = { bg: '#FEE2E2', color: '#991B1B' };
const CYAN: ChipStyle    = { bg: '#CFFAFE', color: '#155E75' };
const PURPLE: ChipStyle  = { bg: '#F3E8FF', color: '#6B21A8' };

const STATUS_STYLES: Record<string, ChipStyle> = {
  draft: GRAY,
  inactive: GRAY,
  archived: GRAY,
  closed: GRAY,
  expired: GRAY,
  scrapped: GRAY,
  disposed: GRAY,
  discontinued: GRAY,
  void: GRAY,
  idle: GRAY,
  voided: GRAY,
  skipped: GRAY,

  submitted: BLUE,
  in_progress: BLUE,
  processing: BLUE,
  confirmed: BLUE,
  ordered: BLUE,
  issued: BLUE,
  released: BLUE,
  shipping: BLUE,
  partially_received: BLUE,
  partially_shipped: BLUE,
  in_transit: BLUE,
  in_stock: BLUE,
  open: BLUE,
  selected: BLUE,

  approved: GREEN,
  active: GREEN,
  completed: GREEN,
  passed: GREEN,
  accepted: GREEN,
  available: GREEN,
  received: GREEN,
  paid: GREEN,
  delivered: GREEN,
  posted: GREEN,
  fulfilled: GREEN,
  reconciled: GREEN,
  verified: GREEN,
  valid: GREEN,

  pending: YELLOW,
  quarantine: YELLOW,
  recalled: YELLOW,
  partially_paid: YELLOW,
  invoiced: YELLOW,
  pending_approval: YELLOW,
  overdue: YELLOW,
  expiring: YELLOW,
  partial: YELLOW,
  disputed: YELLOW,
  evaluated: YELLOW,

  cancelled: RED,
  rejected: RED,
  failed: RED,
  terminated: RED,
  aborted: RED,
  blocked: RED,
  suspended: RED,

  shipped: CYAN,
  returned: CYAN,
  converted: CYAN,
  consumed: CYAN,
  under_maintenance: CYAN,

  conditional: PURPLE,
  sold: PURPLE,
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
  const style = STATUS_STYLES[status?.toLowerCase()] ?? GRAY;

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
