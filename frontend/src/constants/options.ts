export const CURRENCY_OPTIONS = [
  { value: 'CNY', label: 'CNY' },
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
];

export const PO_STATUS_OPTIONS = [
  { value: 'draft', label: '草稿' },
  { value: 'submitted', label: '已提交' },
  { value: 'approved', label: '已审批' },
  { value: 'in_transit', label: '在途' },
  { value: 'partially_received', label: '部分收货' },
  { value: 'received', label: '已收货' },
  { value: 'invoiced', label: '已开票' },
  { value: 'closed', label: '已关闭' },
  { value: 'cancelled', label: '已取消' },
];

export const SO_STATUS_OPTIONS = [
  { value: 'draft', label: '草稿' },
  { value: 'submitted', label: '已提交' },
  { value: 'confirmed', label: '已确认' },
  { value: 'approved', label: '已审批' },
  { value: 'rejected', label: '已拒绝' },
  { value: 'shipping', label: '发货中' },
  { value: 'shipped', label: '已发货' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
];

export const SHIPMENT_STATUS_OPTIONS = [
  { value: 'draft', label: '草稿' },
  { value: 'confirmed', label: '已确认' },
  { value: 'shipped', label: '已发货' },
  { value: 'delivered', label: '已送达' },
  { value: 'cancelled', label: '已取消' },
];

export const RETURN_STATUS_OPTIONS = [
  { value: 'draft', label: '草稿' },
  { value: 'approved', label: '已审批' },
  { value: 'received', label: '已收货' },
  { value: 'rejected', label: '已拒绝' },
  { value: 'cancelled', label: '已取消' },
];

export const INVOICE_STATUS_OPTIONS = [
  { value: 'draft', label: '草稿' },
  { value: 'received', label: '已收到' },
  { value: 'verified', label: '已核验' },
  { value: 'approved', label: '已审批' },
  { value: 'paid', label: '已付款' },
  { value: 'disputed', label: '有争议' },
  { value: 'cancelled', label: '已取消' },
];

export const PAYMENT_REQUEST_STATUS_OPTIONS = [
  { value: 'draft', label: '草稿' },
  { value: 'submitted', label: '已提交' },
  { value: 'approved', label: '已审批' },
  { value: 'paid', label: '已付款' },
  { value: 'cancelled', label: '已取消' },
];

export const RECEIPT_STATUS_OPTIONS = [
  { value: 'draft', label: '草稿' },
  { value: 'confirmed', label: '已确认' },
  { value: 'cancelled', label: '已取消' },
];

export const WORK_ORDER_STATUS_OPTIONS = [
  { value: 'draft', label: '草稿' },
  { value: 'released', label: '已下达' },
  { value: 'in_progress', label: '进行中' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
];

export const INSPECTION_STATUS_OPTIONS = [
  { value: 'draft', label: '草稿' },
  { value: 'in_progress', label: '检验中' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
];

export const INSPECTION_RESULT_OPTIONS = [
  { value: 'pass', label: '合格' },
  { value: 'fail', label: '不合格' },
  { value: 'conditional', label: '有条件放行' },
];

export const DEFECT_SEVERITY_OPTIONS = [
  { value: 'critical', label: '严重' },
  { value: 'major', label: '主要' },
  { value: 'minor', label: '次要' },
];

export const REQUISITION_STATUS_OPTIONS = [
  { value: 'draft', label: '草稿' },
  { value: 'submitted', label: '已提交' },
  { value: 'approved', label: '已审批' },
  { value: 'rejected', label: '已拒绝' },
  { value: 'cancelled', label: '已取消' },
  { value: 'converted', label: '已转换' },
];

export const RFQ_STATUS_OPTIONS = [
  { value: 'draft', label: '草稿' },
  { value: 'issued', label: '已发出' },
  { value: 'closed', label: '已关闭' },
  { value: 'cancelled', label: '已取消' },
];

export const QUOTATION_STATUS_OPTIONS = [
  { value: 'received', label: '已收到' },
  { value: 'evaluated', label: '已评估' },
  { value: 'selected', label: '已选定' },
  { value: 'rejected', label: '已拒绝' },
];

export const VOUCHER_STATUS_OPTIONS = [
  { value: 'draft', label: '草稿' },
  { value: 'posted', label: '已过账' },
];

export const BUDGET_STATUS_OPTIONS = [
  { value: 'draft', label: '草稿' },
  { value: 'approved', label: '已审批' },
  { value: 'active', label: '生效中' },
  { value: 'closed', label: '已关闭' },
];

export const PAYMENT_RECORD_STATUS_OPTIONS = [
  { value: 'draft', label: '草稿' },
  { value: 'confirmed', label: '已确认' },
  { value: 'cancelled', label: '已取消' },
];

export const ASSET_STATUS_OPTIONS = [
  { value: 'active', label: '在用' },
  { value: 'disposed', label: '已处置' },
  { value: 'under_maintenance', label: '维修中' },
];

export const CONTRACT_STATUS_OPTIONS = [
  { value: 'draft', label: '草稿' },
  { value: 'active', label: '生效中' },
  { value: 'expired', label: '已到期' },
  { value: 'terminated', label: '已终止' },
];

export const CONTRACT_TYPE_OPTIONS = [
  { value: 'sales', label: '销售合同' },
  { value: 'procurement', label: '采购合同' },
  { value: 'service', label: '服务合同' },
  { value: 'framework', label: '框架合同' },
];

export const EMPLOYEE_STATUS_OPTIONS = [
  { value: 'active', label: '在职' },
  { value: 'inactive', label: '离职' },
];

export const DEPARTMENT_STATUS_OPTIONS = [
  { value: 'active', label: '启用' },
  { value: 'inactive', label: '停用' },
];

export const COUNT_STATUS_OPTIONS = [
  { value: 'draft', label: '草稿' },
  { value: 'in_progress', label: '盘点中' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
];

export const LOT_STATUS_OPTIONS = [
  { value: 'available', label: '可用' },
  { value: 'quarantine', label: '隔离' },
  { value: 'expired', label: '已过期' },
  { value: 'consumed', label: '已消耗' },
];

export const SERIAL_STATUS_OPTIONS = [
  { value: 'in_stock', label: '在库' },
  { value: 'sold', label: '已售' },
  { value: 'scrapped', label: '已报废' },
  { value: 'returned', label: '已退回' },
];

export const PRICE_LIST_STATUS_OPTIONS = [
  { value: 'draft', label: '草稿' },
  { value: 'active', label: '生效' },
  { value: 'inactive', label: '停用' },
];

export const CUSTOMER_RECEIPT_STATUS_OPTIONS = [
  { value: 'draft', label: '草稿' },
  { value: 'confirmed', label: '已确认' },
  { value: 'cancelled', label: '已取消' },
];

export const RESERVATION_STATUS_OPTIONS = [
  { value: 'active', label: '生效' },
  { value: 'released', label: '已释放' },
  { value: 'expired', label: '已过期' },
  { value: 'cancelled', label: '已取消' },
];

export const VOUCHER_TYPE_OPTIONS = [
  { value: 'general', label: '记账' },
  { value: 'receipt', label: '收款' },
  { value: 'payment', label: '付款' },
  { value: 'transfer', label: '转账' },
];

export const PRODUCT_STATUS_OPTIONS = [
  { value: 'active', label: '在产' },
  { value: 'inactive', label: '停产' },
  { value: 'discontinued', label: '淘汰' },
];

export const ASN_STATUS_OPTIONS = [
  { value: 'draft', label: '草稿' },
  { value: 'in_transit', label: '在途' },
  { value: 'received', label: '已收货' },
  { value: 'cancelled', label: '已取消' },
];

export const RECONCILIATION_STATUS_OPTIONS = [
  { value: 'draft', label: '草稿' },
  { value: 'confirmed', label: '已确认' },
  { value: 'disputed', label: '有争议' },
  { value: 'closed', label: '已关闭' },
];

export const TRANSACTION_TYPE_OPTIONS = [
  { value: 'in', label: '入库' },
  { value: 'out', label: '出库' },
  { value: 'transfer', label: '调拨' },
  { value: 'adjust', label: '调整' },
];

export const IMPORT_STATUS_OPTIONS = [
  { value: 'pending', label: '待处理' },
  { value: 'in_progress', label: '进行中' },
  { value: 'completed', label: '已完成' },
  { value: 'failed', label: '失败' },
];

export const AGENT_SESSION_STATUS_OPTIONS = [
  { value: 'active', label: '活跃' },
  { value: 'completed', label: '已完成' },
  { value: 'failed', label: '失败' },
];

export const WORKFLOW_STATUS_OPTIONS = [
  { value: 'pending', label: '待处理' },
  { value: 'in_progress', label: '进行中' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
  { value: 'failed', label: '失败' },
];

export const APPROVAL_RECORD_STATUS_OPTIONS = [
  { value: 'pending', label: '待审批' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已拒绝' },
  { value: 'recalled', label: '已撤回' },
];

export const NOTIFICATION_TYPE_COLORS: Record<string, string> = {
  info: 'blue',
  warning: 'orange',
  action_required: 'red',
  approval: 'purple',
  system: 'default',
};

export const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  info: '通知',
  warning: '警告',
  action_required: '待处理',
  approval: '待审批',
  system: '系统',
};
