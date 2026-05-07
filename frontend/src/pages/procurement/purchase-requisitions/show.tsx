import React, { useState } from 'react';
import { useShow, useNavigation, useCustomMutation, useInvalidate } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions, Table, Divider, Button, Space, Modal, Select, Card, Tag, message, Alert } from 'antd';
import { ShoppingCartOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { StatusTag } from '../../../components/shared/StatusTag';
import { DocumentFlowPanel } from '../../../components/shared/DocumentFlowPanel';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';
import { useFieldLabel, usePageTitle } from '../../../hooks';
import { API_URL } from '../../../constants/api';

interface ContractOption {
  contract_id: string;
  contract_number: string;
  supplier_id: string;
  supplier_name?: string;
  unit_price: number;
  remaining_quantity: number;
  currency: string;
}

interface PreviewLine {
  requisition_line_id: string;
  product_id: string;
  product: any;
  quantity: number;
  suggested_supplier_id: string | null;
  assigned_supplier_id: string | null;
  assigned_contract: ContractOption | null;
  needs_selection: boolean;
  available_contracts: ContractOption[];
}

interface POPreview {
  supplier_id: string;
  contract_id: string | null;
  contract_number: string | null;
  currency: string;
  source_requisition_id: string;
  items: Array<{
    product_id: string;
    product: any;
    quantity: number;
    unit_price: number;
    contract_unit_price: number | null;
    requisition_line_id: string;
    tax_rate: number;
  }>;
}

export const PurchaseRequisitionShow: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();
  const { push } = useNavigation();
  const { queryResult } = useShow({ resource: 'purchase-requisitions' });
  const { mutate: doCreate, isLoading: creating } = useCustomMutation();
  const invalidate = useInvalidate();
  const record = queryResult.data?.data as any;

  const [loading, setLoading] = useState(false);
  const [selectionModal, setSelectionModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState(false);
  const [selectionLines, setSelectionLines] = useState<PreviewLine[]>([]);
  const [supplierSelections, setSupplierSelections] = useState<Record<string, { supplier_id: string; contract?: ContractOption }>>({});
  const [poPreview, setPOPreview] = useState<POPreview[]>([]);
  const [sourceRef, setSourceRef] = useState<any>(null);

  const canCreatePO = record?.status === 'approved';

  const handleCreatePO = async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${API_URL}/purchase-orders/create-from/purchase-requisition/${record.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token') ?? ''}`,
        },
      });
      const json = await resp.json();
      const data = json.data;

      if (data.status === 'needs_supplier_selection') {
        setSelectionLines(data.lines);
        setSourceRef(data.source);
        // Pre-populate selections for lines that already have an assigned supplier
        const initial: Record<string, { supplier_id: string; contract?: ContractOption }> = {};
        for (const line of data.lines) {
          if (line.assigned_supplier_id) {
            initial[line.requisition_line_id] = {
              supplier_id: line.assigned_supplier_id,
              contract: line.assigned_contract ?? undefined,
            };
          }
        }
        setSupplierSelections(initial);
        setSelectionModal(true);
      } else if (data.status === 'ready') {
        setPOPreview(data.purchase_orders);
        setSourceRef(data.source);
        setConfirmModal(true);
      }
    } catch (err: any) {
      message.error(err.message ?? 'Failed to load contract matching data');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectionConfirm = () => {
    // Validate all lines have a selection
    const unresolved = selectionLines.filter(
      (l) => l.needs_selection && !supplierSelections[l.requisition_line_id]
    );
    if (unresolved.length > 0) {
      message.warning(t('messages.selectSupplierForAllLines', 'Please select a supplier for all lines'));
      return;
    }

    // Build grouped PO preview from selections
    const groupMap = new Map<string, POPreview>();
    for (const line of selectionLines) {
      const sel = supplierSelections[line.requisition_line_id];
      const supplierId = sel?.supplier_id ?? line.assigned_supplier_id!;
      const contract = sel?.contract ?? line.assigned_contract;

      if (!groupMap.has(supplierId)) {
        groupMap.set(supplierId, {
          supplier_id: supplierId,
          contract_id: contract?.contract_id ?? null,
          contract_number: contract?.contract_number ?? null,
          currency: contract?.currency ?? 'CNY',
          source_requisition_id: sourceRef.id,
          items: [],
        });
      }
      groupMap.get(supplierId)!.items.push({
        product_id: line.product_id,
        product: line.product,
        quantity: line.quantity,
        unit_price: contract?.unit_price ?? 0,
        contract_unit_price: contract?.unit_price ?? null,
        requisition_line_id: line.requisition_line_id,
        tax_rate: 0,
      });
    }

    setPOPreview(Array.from(groupMap.values()));
    setSelectionModal(false);
    setConfirmModal(true);
  };

  const handleBatchCreate = () => {
    doCreate({
      url: `${API_URL}/purchase-orders/create-from-requisition`,
      method: 'post',
      values: {
        source_requisition_id: sourceRef.id,
        purchase_orders: poPreview.map((po) => ({
          supplier_id: po.supplier_id,
          contract_id: po.contract_id,
          currency: po.currency,
          items: po.items.map((it) => ({
            product_id: it.product_id,
            quantity: it.quantity,
            unit_price: it.unit_price,
            tax_rate: it.tax_rate,
            contract_unit_price: it.contract_unit_price,
            requisition_line_id: it.requisition_line_id,
          })),
        })),
      },
    }, {
      onSuccess: (resp: any) => {
        const created = resp?.data?.data?.created_purchase_orders ?? [];
        message.success(t('messages.posCreated', {
          count: created.length,
          defaultValue: `${created.length} Purchase Order(s) created successfully`,
        }));
        setConfirmModal(false);
        invalidate({ resource: 'purchase-requisitions', invalidates: ['detail', 'list'] });
        invalidate({ resource: 'purchase-orders', invalidates: ['list'] });
        if (created.length === 1) {
          push(`/procurement/purchase-orders/show/${created[0].id}`);
        }
      },
    });
  };

  const headerButtons = canCreatePO ? (
    <Space>
      <Button
        type="primary"
        icon={<ShoppingCartOutlined />}
        loading={loading}
        onClick={handleCreatePO}
      >
        {t('buttons.createPurchaseOrder', 'Create Purchase Order')}
      </Button>
    </Space>
  ) : undefined;

  return (
    <Show
      title={`${pt('purchase_requisitions', 'show')} ${record?.requisition_number ?? ''}`}
      isLoading={queryResult.isLoading}
      headerButtons={headerButtons}
    >
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label={fl('purchase_requisitions', 'requisition_number')}>{record?.requisition_number}</Descriptions.Item>
        <Descriptions.Item label={t('common.status')}>
          <StatusTag status={record?.status} />
        </Descriptions.Item>
        <Descriptions.Item label={fl('purchase_requisitions', 'department_id')}>{record?.department?.name}</Descriptions.Item>
        <Descriptions.Item label={fl('purchase_requisitions', 'request_date')}>
          <DateField value={record?.request_date} format="YYYY-MM-DD" />
        </Descriptions.Item>
        <Descriptions.Item label={fl('purchase_requisitions', 'required_date')}>
          {record?.required_date ? <DateField value={record.required_date} format="YYYY-MM-DD" /> : '-'}
        </Descriptions.Item>
        <Descriptions.Item label={t('common.total')}>
          <AmountDisplay value={record?.total_amount} />
        </Descriptions.Item>
        {record?.notes && <Descriptions.Item label={t('common.notes')} span={2}>{record.notes}</Descriptions.Item>}
      </Descriptions>

      {record?.lines && record.lines.length > 0 && (
        <>
          <Divider>{t('sections.requisitionLines')}</Divider>
          <Table
            dataSource={record.lines}
            rowKey="id"
            size="small"
            pagination={false}
            columns={[
              { dataIndex: 'line_number', title: fl('purchase_requisition_lines', 'line_number'), width: 60 },
              { dataIndex: ['product', 'name'], title: fl('purchase_requisition_lines', 'product_id') },
              { dataIndex: ['product', 'code'], title: fl('products', 'code'), width: 120 },
              { dataIndex: 'quantity', title: fl('purchase_requisition_lines', 'quantity'), width: 80, align: 'right' as const },
              { dataIndex: 'unit_price', title: fl('purchase_requisition_lines', 'unit_price'), width: 100, align: 'right' as const, render: (v: number | string | null | undefined) => <AmountDisplay value={v} /> },
              { dataIndex: 'amount', title: fl('purchase_requisition_lines', 'amount'), width: 120, align: 'right' as const, render: (v: number | string | null | undefined) => <AmountDisplay value={v} /> },
              { dataIndex: ['suggested_supplier', 'name'], title: fl('purchase_requisition_lines', 'suggested_supplier_id'), width: 140 },
              { dataIndex: 'notes', title: t('common.notes') },
            ]}
          />
        </>
      )}
      <DocumentFlowPanel objectType="purchase_requisition" objectId={record?.id} />

      {/* Supplier Selection Modal — shown when multiple contracts exist */}
      <Modal
        title={t('procurement.selectSupplier', 'Select Supplier for Each Line')}
        open={selectionModal}
        onCancel={() => setSelectionModal(false)}
        onOk={handleSelectionConfirm}
        width={800}
      >
        <Alert
          type="info"
          showIcon
          message={t('procurement.multipleContractsInfo', 'Some products have multiple active contracts. Please select a supplier/contract for each line.')}
          style={{ marginBottom: 16 }}
        />
        <Table
          dataSource={selectionLines}
          rowKey="requisition_line_id"
          size="small"
          pagination={false}
          columns={[
            { title: t('common.product'), dataIndex: ['product', 'name'], width: 160 },
            { title: t('common.quantity'), dataIndex: 'quantity', width: 80, align: 'right' as const },
            {
              title: t('common.supplier'),
              key: 'supplier',
              width: 300,
              render: (_: any, line: PreviewLine) => {
                if (!line.needs_selection && line.assigned_contract) {
                  return (
                    <Tag color="green">
                      {line.assigned_contract.contract_number} — ¥{line.assigned_contract.unit_price}
                    </Tag>
                  );
                }
                if (line.available_contracts.length > 0) {
                  return (
                    <Select
                      style={{ width: '100%' }}
                      placeholder={t('procurement.selectContract', 'Select contract...')}
                      value={supplierSelections[line.requisition_line_id]?.contract?.contract_id}
                      onChange={(contractId: string) => {
                        const ct = line.available_contracts.find((c) => c.contract_id === contractId);
                        if (ct) {
                          setSupplierSelections((prev) => ({
                            ...prev,
                            [line.requisition_line_id]: { supplier_id: ct.supplier_id, contract: ct },
                          }));
                        }
                      }}
                      options={line.available_contracts.map((ct) => ({
                        value: ct.contract_id,
                        label: `${ct.contract_number} — ${ct.supplier_name ?? ct.supplier_id} — ¥${ct.unit_price} (${t('common.remaining')}: ${ct.remaining_quantity})`,
                      }))}
                    />
                  );
                }
                return <Tag color="orange">{t('procurement.noContract', 'No contract — uses suggested supplier')}</Tag>;
              },
            },
          ]}
        />
      </Modal>

      {/* Confirm PO Creation Modal — shows grouped POs */}
      <Modal
        title={t('procurement.confirmCreatePOs', 'Confirm Purchase Order Creation')}
        open={confirmModal}
        onCancel={() => setConfirmModal(false)}
        onOk={handleBatchCreate}
        confirmLoading={creating}
        width={800}
      >
        <Alert
          type="info"
          showIcon
          message={t('procurement.groupedPOInfo', {
            count: poPreview.length,
            defaultValue: `${poPreview.length} Purchase Order(s) will be created, grouped by supplier.`,
          })}
          style={{ marginBottom: 16 }}
        />
        {poPreview.map((po, idx) => (
          <Card
            key={po.supplier_id}
            size="small"
            title={`PO #${idx + 1} — ${t('common.supplier')}: ${po.supplier_id.slice(0, 8)}...`}
            extra={po.contract_number ? <Tag color="blue">{po.contract_number}</Tag> : null}
            style={{ marginBottom: 12 }}
          >
            <Table
              dataSource={po.items}
              rowKey="requisition_line_id"
              size="small"
              pagination={false}
              columns={[
                { title: t('common.product'), dataIndex: ['product', 'name'], width: 160 },
                { title: t('common.quantity'), dataIndex: 'quantity', width: 80, align: 'right' as const },
                { title: t('common.unitPrice'), dataIndex: 'unit_price', width: 100, align: 'right' as const, render: (v: number) => <AmountDisplay value={v} currency={po.currency} /> },
                {
                  title: t('common.contractPrice'),
                  dataIndex: 'contract_unit_price',
                  width: 100,
                  align: 'right' as const,
                  render: (v: number | null) => v != null ? <AmountDisplay value={v} currency={po.currency} /> : '-',
                },
              ]}
            />
          </Card>
        ))}
      </Modal>
    </Show>
  );
};
