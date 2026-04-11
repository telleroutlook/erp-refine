import React from 'react';
import { Tag } from 'antd';

const STATUS_COLORS: Record<string, string> = {
  draft: 'default',
  submitted: 'processing',
  approved: 'success',
  active: 'success',
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
  partially_received: 'gold',
  partially_shipped: 'gold',
  confirmed: 'blue',
  failed: 'red',
  passed: 'green',
};

interface StatusTagProps {
  status: string;
  label?: string;
}

export const StatusTag: React.FC<StatusTagProps> = ({ status, label }) => {
  const color = STATUS_COLORS[status?.toLowerCase()] ?? 'default';
  return <Tag color={color}>{label ?? status}</Tag>;
};
