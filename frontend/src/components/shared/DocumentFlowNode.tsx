import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useTranslation } from 'react-i18next';
import {
  FileTextOutlined,
  ShoppingCartOutlined,
  InboxOutlined,
  DollarOutlined,
  AuditOutlined,
  CarOutlined,
  RollbackOutlined,
  FileSearchOutlined,
  AccountBookOutlined,
  ToolOutlined,
  BankOutlined,
  SafetyOutlined,
  PieChartOutlined,
} from '@ant-design/icons';
import { StatusTag } from './StatusTag';

const TYPE_ICONS: Record<string, React.ReactNode> = {
  purchase_requisition: <FileSearchOutlined />,
  purchase_order: <ShoppingCartOutlined />,
  purchase_receipt: <InboxOutlined />,
  sales_order: <ShoppingCartOutlined style={{ color: '#059669' }} />,
  sales_shipment: <CarOutlined />,
  sales_return: <RollbackOutlined />,
  supplier_invoice: <FileTextOutlined />,
  sales_invoice: <FileTextOutlined style={{ color: '#059669' }} />,
  payment_request: <DollarOutlined />,
  payment_record: <DollarOutlined style={{ color: '#059669' }} />,
  customer_receipt: <AccountBookOutlined />,
  voucher: <AuditOutlined />,
  quality_inspection: <SafetyOutlined />,
  work_order: <ToolOutlined />,
  budget: <PieChartOutlined />,
  contract: <BankOutlined />,
  fixed_asset: <BankOutlined />,
};

export type DocumentFlowNodeData = {
  objectType: string;
  objectId: string;
  label: string;
  date: string | null;
  amount: number | null;
  status: string | null;
  isFocal: boolean;
  isDimmed: boolean;
  onClick: (objectType: string, objectId: string) => void;
};

function DocumentFlowNodeInner({ data }: NodeProps) {
  const { t, i18n } = useTranslation();
  const d = data as unknown as DocumentFlowNodeData;
  const icon = TYPE_ICONS[d.objectType] ?? <FileTextOutlined />;
  const typeLabel = t(`documentTypes.${d.objectType}`, { defaultValue: d.objectType.replace(/_/g, ' ') });

  const borderColor = d.isFocal ? 'var(--color-sage)' : '#94A3B8';
  const boxShadow = d.isFocal
    ? '0 0 0 2px var(--color-sage), 0 2px 8px rgba(5,150,105,0.15)'
    : '0 1px 4px rgba(0,0,0,0.06)';
  const opacity = d.isDimmed ? 0.35 : 1;

  const formattedAmount =
    d.amount != null
      ? new Intl.NumberFormat(i18n.language, { style: 'decimal', maximumFractionDigits: 2 }).format(d.amount)
      : null;

  return (
    <>
      <Handle type="target" position={Position.Left} style={{ visibility: 'hidden' }} />
      <div
        role="button"
        tabIndex={0}
        onClick={() => d.onClick(d.objectType, d.objectId)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') d.onClick(d.objectType, d.objectId);
        }}
        style={{
          width: 200,
          minHeight: 90,
          background: 'var(--color-surface)',
          border: `2px solid ${borderColor}`,
          borderRadius: 8,
          boxShadow,
          opacity,
          padding: '8px 12px',
          cursor: 'pointer',
          transition: 'opacity 0.2s, box-shadow 0.15s',
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            color: 'var(--color-slate)',
            fontSize: 10,
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {icon}
          <span>{typeLabel}</span>
        </div>
        <div
          style={{
            fontWeight: 600,
            fontSize: 13,
            color: 'var(--color-navy)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {d.label}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 11,
            color: 'var(--color-slate)',
          }}
        >
          <span>{d.date ? d.date.slice(0, 10) : ''}</span>
          {formattedAmount != null && (
            <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>{formattedAmount}</span>
          )}
        </div>
        {d.status && (
          <div style={{ marginTop: 1 }}>
            <StatusTag status={d.status} />
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Right} style={{ visibility: 'hidden' }} />
    </>
  );
}

export const DocumentFlowNode = memo(DocumentFlowNodeInner);
