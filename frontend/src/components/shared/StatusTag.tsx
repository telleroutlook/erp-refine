import React from 'react';
import { Tag } from 'antd';
import { useTranslation } from 'react-i18next';

const STATUS_COLORS: Record<string, string> = {
  draft: 'default',
  submitted: 'processing',
  approved: 'success',
  active: 'success',
  inactive: 'default',
  archived: 'default',
  cancelled: 'error',
  closed: 'default',
  received: 'cyan',
  invoiced: 'blue',
  posted: 'green',
  void: 'volcano',
  pending: 'orange',
  in_progress: 'processing',
  completed: 'success',
  partially_received: 'geekblue',
  partially_shipped: 'geekblue',
  confirmed: 'blue',
  failed: 'red',
  passed: 'green',
  released: 'blue',
  ordered: 'geekblue',
  issued: 'blue',
  accepted: 'green',
  rejected: 'red',
  expired: 'default',
  conditional: 'purple',
  idle: 'orange',
  scrapped: 'default',
  disposed: 'default',
  terminated: 'volcano',
  quarantine: 'warning',
  available: 'success',
  sold: 'purple',
  partially_paid: 'geekblue',
  paid: 'green',
  shipped: 'cyan',
  delivered: 'success',
  recalled: 'warning',
  discontinued: 'default',
  shipping: 'processing',
};

interface StatusTagProps {
  status: string;
  label?: string;
}

export const StatusTag: React.FC<StatusTagProps> = ({ status, label }) => {
  const { t } = useTranslation();
  const color = STATUS_COLORS[status?.toLowerCase()] ?? 'default';
  return <Tag color={color}>{label ?? t(`status.${status}`, { defaultValue: status })}</Tag>;
};
