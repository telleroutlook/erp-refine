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
