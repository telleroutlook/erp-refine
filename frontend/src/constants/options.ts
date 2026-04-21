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
  { value: 'approved', label: '已审批' },
  { value: 'partially_shipped', label: '部分发货' },
  { value: 'shipped', label: '已发货' },
  { value: 'invoiced', label: '已开票' },
  { value: 'closed', label: '已关闭' },
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
  { value: 'submitted', label: '已提交' },
  { value: 'approved', label: '已审批' },
  { value: 'received', label: '已收货' },
  { value: 'closed', label: '已关闭' },
  { value: 'cancelled', label: '已取消' },
];

export const INVOICE_STATUS_OPTIONS = [
  { value: 'draft', label: '草稿' },
  { value: 'submitted', label: '已提交' },
  { value: 'approved', label: '已审批' },
  { value: 'partially_paid', label: '部分付款' },
  { value: 'paid', label: '已付款' },
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
  { value: 'passed', label: '合格' },
  { value: 'failed', label: '不合格' },
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
  { value: 'ordered', label: '已下单' },
  { value: 'cancelled', label: '已取消' },
];

export const RFQ_STATUS_OPTIONS = [
  { value: 'draft', label: '草稿' },
  { value: 'issued', label: '已发出' },
  { value: 'closed', label: '已关闭' },
  { value: 'cancelled', label: '已取消' },
];

export const QUOTATION_STATUS_OPTIONS = [
  { value: 'draft', label: '草稿' },
  { value: 'submitted', label: '已提交' },
  { value: 'accepted', label: '已接受' },
  { value: 'rejected', label: '已拒绝' },
  { value: 'expired', label: '已过期' },
];

export const VOUCHER_STATUS_OPTIONS = [
  { value: 'draft', label: '草稿' },
  { value: 'posted', label: '已过账' },
];

export const BUDGET_STATUS_OPTIONS = [
  { value: 'draft', label: '草稿' },
  { value: 'submitted', label: '已提交' },
  { value: 'approved', label: '已审批' },
  { value: 'closed', label: '已关闭' },
];

export const PAYMENT_RECORD_STATUS_OPTIONS = [
  { value: 'draft', label: '草稿' },
  { value: 'confirmed', label: '已确认' },
  { value: 'cancelled', label: '已取消' },
];

export const ASSET_STATUS_OPTIONS = [
  { value: 'active', label: '在用' },
  { value: 'idle', label: '闲置' },
  { value: 'scrapped', label: '已报废' },
  { value: 'disposed', label: '已处置' },
];

export const CONTRACT_STATUS_OPTIONS = [
  { value: 'draft', label: '草稿' },
  { value: 'active', label: '生效中' },
  { value: 'expired', label: '已到期' },
  { value: 'terminated', label: '已终止' },
];

export const CONTRACT_TYPE_OPTIONS = [
  { value: 'purchase', label: '采购合同' },
  { value: 'sales', label: '销售合同' },
  { value: 'service', label: '服务合同' },
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
];

export const SERIAL_STATUS_OPTIONS = [
  { value: 'available', label: '可用' },
  { value: 'sold', label: '已售' },
  { value: 'scrapped', label: '已报废' },
];

export const PRICE_LIST_STATUS_OPTIONS = [
  { value: 'draft', label: '草稿' },
  { value: 'active', label: '生效' },
  { value: 'expired', label: '已过期' },
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
