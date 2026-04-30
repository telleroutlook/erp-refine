import React, { lazy, Suspense } from 'react';
import { Collapse, Skeleton, Alert, Typography } from 'antd';
import { ApartmentOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useDocumentChain } from '../../hooks/useDocumentChain';

const DocumentFlowGraph = lazy(() =>
  import('./DocumentFlowGraph').then((m) => ({ default: m.DocumentFlowGraph }))
);

const TYPE_PATH: Record<string, string> = {
  purchase_requisition: '/procurement/purchase-requisitions',
  purchase_order: '/procurement/purchase-orders',
  purchase_receipt: '/procurement/purchase-receipts',
  sales_order: '/sales/sales-orders',
  sales_shipment: '/sales/sales-shipments',
  sales_return: '/sales/sales-returns',
  supplier_invoice: '/finance/supplier-invoices',
  sales_invoice: '/finance/sales-invoices',
  payment_request: '/finance/payment-requests',
  payment_record: '/finance/payment-records',
  customer_receipt: '/sales/customer-receipts',
  voucher: '/finance/vouchers',
  quality_inspection: '/quality/quality-inspections',
  work_order: '/manufacturing/work-orders',
  budget: '/finance/budgets',
  contract: '/contracts/contracts',
  fixed_asset: '/assets/fixed-assets',
};

interface Props {
  objectType: string;
  objectId: string | undefined;
  defaultOpen?: boolean;
}

export const DocumentFlowPanel: React.FC<Props> = ({ objectType, objectId, defaultOpen = false }) => {
  const navigate = useNavigate();
  const { chain, isLoading, error } = useDocumentChain(objectId ? objectType : null, objectId ?? null);

  const handleNodeClick = (type: string, id: string) => {
    const prefix = TYPE_PATH[type];
    if (prefix) navigate(`${prefix}/${id}`);
  };

  const hasData = chain && (chain.nodes.length > 1 || chain.edges.length > 0);

  let content: React.ReactNode;
  if (isLoading) {
    content = <Skeleton active paragraph={{ rows: 2 }} style={{ padding: '8px 0' }} />;
  } else if (error) {
    content = <Alert type="warning" message="无法加载凭证流转图" description={error} showIcon style={{ margin: '8px 0' }} />;
  } else if (!hasData) {
    content = (
      <Typography.Text type="secondary" style={{ display: 'block', padding: '16px 0', textAlign: 'center' }}>
        暂无关联单据
      </Typography.Text>
    );
  } else {
    content = (
      <Suspense fallback={<Skeleton active paragraph={{ rows: 2 }} style={{ padding: '8px 0' }} />}>
        <DocumentFlowGraph chain={chain} onNodeClick={handleNodeClick} />
      </Suspense>
    );
  }

  return (
    <Collapse
      defaultActiveKey={defaultOpen ? ['flow'] : []}
      style={{ marginBottom: 16 }}
      items={[
        {
          key: 'flow',
          label: (
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500 }}>
              <ApartmentOutlined />
              凭证流转
            </span>
          ),
          children: content,
        },
      ]}
    />
  );
};
