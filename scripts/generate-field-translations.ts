#!/usr/bin/env npx tsx
/**
 * generate-field-translations.ts
 *
 * Extracts hardcoded Chinese labels from TSX files, maps them to DB columns,
 * and generates the `fields.*`, `titles.*`, `validation.*`, `messages.*`,
 * `sections.*`, `placeholders.*` namespaces for en.json and zh-CN.json.
 *
 * Usage: npx tsx scripts/generate-field-translations.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FRONTEND_SRC = path.resolve(__dirname, '../frontend/src');
const PAGES_DIR = path.join(FRONTEND_SRC, 'pages');

// ─── Chinese → English mapping for common field labels ──────────────────────
const ZH_TO_EN: Record<string, string> = {
  // Generic fields (fields.common)
  '编号': 'Code',
  '名称': 'Name',
  '状态': 'Status',
  '描述': 'Description',
  '备注': 'Notes',
  '电话': 'Phone',
  '邮箱': 'Email',
  '货币': 'Currency',
  '数量': 'Quantity',
  '单价': 'Unit Price',
  '金额': 'Amount',
  '行合计': 'Line Total',
  '合计金额': 'Total Amount',
  '总金额': 'Total Amount',
  '税率': 'Tax Rate',
  '税额': 'Tax Amount',
  '总数量': 'Total Quantity',
  '总行数': 'Total Rows',
  '付款条件（天）': 'Payment Terms (Days)',
  '付款条件': 'Payment Terms',
  '付款方式': 'Payment Method',
  '付款类型': 'Payment Type',
  '付款日期': 'Payment Date',
  '付款编号': 'Payment Number',
  '启用': 'Active',
  '停用': 'Inactive',
  '暂停': 'Suspended',
  '创建时间': 'Created At',
  '更新时间': 'Updated At',
  '创建人': 'Created By',
  '创建日期': 'Created Date',
  '类型': 'Type',
  '分类': 'Category',
  '类别': 'Category',
  '标签': 'Tags',
  '联系人': 'Contact',
  '位置': 'Location',
  '负责人': 'Manager',
  '部门': 'Department',
  '操作': 'Actions',
  '行号': 'Line #',
  '版本': 'Version',
  '序列号': 'Serial No.',
  '批次号': 'Lot No.',
  '有效期': 'Expiry Date',
  '生效日期': 'Effective Date',
  '到期日期': 'Expiry Date',
  '到期日': 'Due Date',
  '到期时间': 'Expiry Time',
  '开始日期': 'Start Date',
  '结束日期': 'End Date',
  '开始时间': 'Start Time',
  '结束时间': 'End Time',
  '截止日期': 'Due Date',
  '关联类型': 'Reference Type',
  '关联ID': 'Reference ID',
  '关联单号': 'Reference No.',
  '来源类型': 'Source Type',
  '来源ID': 'Source ID',
  '来源单号': 'Source No.',
  '来源系统': 'Source System',
  '来源': 'Source',
  '用户ID': 'User ID',
  '编码': 'Code',
  '代码': 'Code',
  '日期': 'Date',
  '时间': 'Time',
  '是': 'Yes',
  '否': 'No',
  '上级分类': 'Parent Category',
  '上级部门': 'Parent Department',
  '上级中心': 'Parent Center',
  '上级科目': 'Parent Account',
  '默认': 'Default',
  '元数据': 'Metadata',
  '已处理': 'Processed',
  '已过账': 'Posted',
  '单位': 'Unit',
  '层级': 'Level',
  '级别': 'Level',
  '顺序': 'Sequence',

  // Product fields
  '产品': 'Product',
  '产品名称': 'Product Name',
  '产品编号': 'Product Code',
  '物料清单': 'BOM',

  // Warehouse fields
  '仓库': 'Warehouse',
  '仓库名称': 'Warehouse Name',
  '仓库编号': 'Warehouse Code',
  '仓库类型': 'Warehouse Type',
  '区域': 'Zone',

  // Supplier fields
  '供应商': 'Supplier',
  '供应商ID': 'Supplier',
  '供应商名称': 'Supplier Name',
  '供应商编号': 'Supplier Code',

  // Customer fields
  '客户': 'Customer',
  '客户名称': 'Customer Name',
  '客户编号': 'Customer Code',

  // Order/document fields
  '订单号': 'Order No.',
  '订单日期': 'Order Date',
  '采购订单': 'Purchase Order',
  '采购订单号': 'PO Number',
  '销售订单号': 'SO Number',
  '退货单号': 'Return No.',
  '退货日期': 'Return Date',
  '收货单号': 'Receipt No.',
  '收货日期': 'Receipt Date',
  '发货单号': 'Shipment No.',
  '发货日期': 'Shipment Date',
  '发票号': 'Invoice No.',
  '发票日期': 'Invoice Date',
  '收款单号': 'Receipt No.',
  '收款日期': 'Receipt Date',
  '收款方式': 'Payment Method',
  'ASN编号': 'ASN No.',
  '询价单号': 'RFQ No.',
  '询价单ID': 'RFQ',
  '报价单号': 'Quotation No.',
  '对账单号': 'Statement No.',
  '盘点单号': 'Count No.',
  '盘点日期': 'Count Date',
  '检验单号': 'Inspection No.',
  '检验日期': 'Inspection Date',
  '检验员': 'Inspector',
  '检验结果': 'Inspection Result',
  '合格数量': 'Qualified Qty',
  '合格数': 'Qualified Qty',
  '不合格数量': 'Defective Qty',
  '不合格数': 'Defective Qty',
  '不良数量': 'Defective Qty',
  '申请单号': 'Requisition No.',
  '申请日期': 'Requisition Date',
  '申请类型': 'Request Type',
  '变更申请编号': 'Change Request No.',
  '合同号': 'Contract No.',
  '合同类型': 'Contract Type',
  '合同金额': 'Contract Amount',
  '工单号': 'Work Order No.',
  '凭证号': 'Voucher No.',
  '凭证日期': 'Voucher Date',
  '凭证类型': 'Voucher Type',

  // Employee/HR fields
  '姓名': 'Full Name',
  '工号': 'Employee No.',
  '职位': 'Position',
  '入职日期': 'Hire Date',

  // Finance fields
  '借方合计': 'Total Debit',
  '贷方合计': 'Total Credit',
  '余额方向': 'Balance Direction',
  '科目编码': 'Account Code',
  '科目名称': 'Account Name',
  '末级科目': 'Is Leaf',
  '预算名称': 'Budget Name',
  '预算类型': 'Budget Type',
  '年度': 'Fiscal Year',
  '月份': 'Month',
  '期间开始': 'Period Start',
  '期间结束': 'Period End',
  '费用': 'Cost',
  '费用估算': 'Cost Estimate',

  // Asset fields
  '资产': 'Asset',
  '资产ID': 'Asset',
  '资产名称': 'Asset Name',
  '资产编号': 'Asset No.',
  '购入成本': 'Acquisition Cost',
  '购入日期': 'Acquisition Date',
  '使用寿命（月）': 'Useful Life (Months)',
  '折旧方法': 'Depreciation Method',
  '残值': 'Salvage Value',
  '累计折旧': 'Accumulated Depreciation',
  '折旧金额': 'Depreciation Amount',
  '折旧后净值': 'Net Book Value',
  '账面净值': 'Book Value',
  '维保类型': 'Maintenance Type',
  '下次到期': 'Next Due',

  // Manufacturing fields
  'BOM编号': 'BOM No.',
  '基准数量': 'Base Quantity',
  '生产工单': 'Work Order',
  '生产数量': 'Production Qty',
  '生产日期': 'Production Date',
  '计划数量': 'Planned Qty',
  '完成数量': 'Completed Qty',
  '完成时间': 'Completed At',
  '计划完成日期': 'Planned Completion',
  '计划完成': 'Planned Completion',
  '实际完成日期': 'Actual Completion',
  '报工日期': 'Report Date',
  '需求日期': 'Required Date',
  '预计到货日期': 'Expected Date',
  '预计到货日': 'Expected Date',

  // Quality fields
  '标准代码': 'Standard Code',
  '标准名称': 'Standard Name',
  '严重程度': 'Severity',

  // Exchange rate fields
  '汇率': 'Rate',
  '源币种': 'Source Currency',
  '目标币种': 'Target Currency',
  '换算系数': 'Conversion Factor',
  '小数位': 'Decimal Places',
  '符号': 'Symbol',
  '币种代码': 'Currency Code',
  '币种名称': 'Currency Name',

  // System/audit fields
  '角色': 'Role',
  '角色名称': 'Role Name',
  '系统角色': 'System Role',
  '规则名称': 'Rule Name',
  '规则ID': 'Rule ID',
  '审批人': 'Approver',
  '审批层级': 'Approval Level',
  '审批意见': 'Comments',
  '审批时间': 'Approved At',
  '审批状态': 'Approval Status',
  '审批角色': 'Approval Role',
  '单据类型': 'Document Type',
  '单据ID': 'Document ID',
  '文件名': 'File Name',
  '文件路径': 'File Path',
  '文件大小': 'File Size',
  '文件大小(字节)': 'File Size (Bytes)',
  'MIME类型': 'MIME Type',
  '上传人': 'Uploaded By',
  '实体ID': 'Entity ID',
  '实体类型': 'Entity Type',
  '对方ID': 'Party ID',
  '对方类型': 'Party Type',
  '对象ID': 'Object ID',
  '对象类型': 'Object Type',
  '目标ID': 'Target ID',
  '目标类型': 'Target Type',
  '资源类型': 'Resource Type',
  '通知': 'Notifications',
  '可付款': 'OK to Pay',
  '已付金额': 'Paid Amount',
  '采购价': 'Purchase Price',
  '销售价': 'Sale Price',

  // Carrier fields
  '快递单追踪URL模板': 'Tracking URL Template',
  '追踪URL模板': 'Tracking URL Template',

  // AI/session fields
  '会话ID': 'Session ID',
  '会话类型': 'Session Type',
  '消息数': 'Message Count',
  '决策': 'Decision',
  '风险等级': 'Risk Level',
  '置信度': 'Confidence',
  '推理摘要': 'Reasoning Summary',
  '执行状态': 'Execution Status',
  '工具名称': 'Tool Name',
  '模型': 'Model',
  '输入Token': 'Input Tokens',
  '输出Token': 'Output Tokens',
  '总Token': 'Total Tokens',
  '耗时(ms)': 'Duration (ms)',
  '缓存命中': 'Cache Hit',
  '缓存': 'Cache',
  '成功': 'Success',
  '成功数': 'Success Count',
  '失败数': 'Failure Count',
  '错误信息': 'Error Message',
  '错误详情': 'Error Details',
  '输入哈希': 'Input Hash',
  'IP地址': 'IP Address',
  '事件类型': 'Event Type',
  '发生时间': 'Occurred At',
  '负载数据': 'Payload',

  // Workflow fields
  '工作流类型': 'Workflow Type',
  '当前步骤': 'Current Step',

  // Number sequence fields
  '序列名称': 'Sequence Name',
  '当前值': 'Current Value',
  '前缀': 'Prefix',
  '步长': 'Increment',
  '补零位数': 'Padding',

  // Import log fields
  '导入人': 'Imported By',

  // Inventory fields
  '预留数量': 'Reserved Qty',
  '在手数量': 'On-hand Qty',
  '可用数量': 'Available Qty',

  // Misc
  '引用ID': 'Reference ID',
  '引用类型': 'Reference Type',
  '执行人': 'Executed By',
  '执行日期': 'Execution Date',
  '发出人': 'Issued By',
  '发出时间': 'Issued At',
  '发起人': 'Initiated By',
  '分配人': 'Assigned By',
  '分配时间': 'Assigned At',
  '变体': 'Variant',
  '变更前数据': 'Before Data',
  '变更后数据': 'After Data',
  '最低金额': 'Min Amount',
  '最高金额': 'Max Amount',
};

// ─── Page titles ZH → EN ────────────────────────────────────────────────────
const TITLE_ZH_TO_EN: Record<string, string> = {
  '新建': 'Create',
  '编辑': 'Edit',
  '查看': 'View',
};

// ─── Section headers ────────────────────────────────────────────────────────
const SECTION_ZH_TO_EN: Record<string, [string, string]> = {
  '订单行': ['orderLines', 'Order Lines'],
  '发票行': ['invoiceLines', 'Invoice Lines'],
  '发货行': ['shipmentLines', 'Shipment Lines'],
  '退货行': ['returnLines', 'Return Lines'],
  '物料需求': ['materialRequirements', 'Material Requirements'],
  '生产报工': ['productionReports', 'Production Reports'],
  '检验项目': ['inspectionItems', 'Inspection Items'],
  'BOM物料': ['bomItems', 'BOM Items'],
  '凭证分录': ['voucherEntries', 'Voucher Entries'],
  '预算明细': ['budgetLines', 'Budget Lines'],
  '合同明细': ['contractLines', 'Contract Lines'],
  '价格明细': ['priceDetails', 'Price Details'],
  '盘点明细': ['countDetails', 'Count Details'],
  '报价明细': ['quotationLines', 'Quotation Lines'],
  '申请明细': ['requisitionLines', 'Requisition Lines'],
  '询价明细': ['rfqLines', 'RFQ Lines'],
  '对账明细': ['reconciliationLines', 'Reconciliation Lines'],
  'ASN明细': ['asnLines', 'ASN Lines'],
  '收货明细': ['receiptLines', 'Receipt Lines'],
  '收款明细': ['receiptDetails', 'Receipt Details'],
};

// ─── Table name derivation from file path ───────────────────────────────────
// e.g. pages/sales/sales-orders/edit.tsx → sales_orders
function deriveTableFromPath(filePath: string): string | null {
  const rel = path.relative(PAGES_DIR, filePath);
  const parts = rel.split(path.sep);
  // e.g. ['sales', 'sales-orders', 'edit.tsx'] → 'sales-orders' → 'sales_orders'
  if (parts.length >= 2) {
    return parts[parts.length - 2].replace(/-/g, '_');
  }
  return null;
}

// ─── Extract Chinese strings from TSX files ─────────────────────────────────
interface Extraction {
  file: string;
  table: string | null;
  labels: Map<string, string>; // column → Chinese label (from title/label attrs)
  titles: string[]; // page-level titles like "新建采购订单"
  sections: string[]; // divider/section titles
  validations: string[]; // validation messages like "请输入名称"
  selectOptions: string[]; // inline option labels
  messages: string[]; // UI messages like "保存成功"
  placeholders: string[]; // placeholder text
}

function extractFromFile(filePath: string): Extraction {
  const content = fs.readFileSync(filePath, 'utf-8');
  const table = deriveTableFromPath(filePath);

  const labels = new Map<string, string>();
  const titles: string[] = [];
  const sections: string[] = [];
  const validations: string[] = [];
  const selectOptions: string[] = [];
  const messages: string[] = [];
  const placeholders: string[] = [];

  // Table.Column title="中文" with dataIndex
  const colRegex = /dataIndex[=:]\s*(?:{?\[?['"]([^'"]+)['"]|['"]([^'"]+)['"])[^}]*?title[=:]\s*['"]([^'"]+[一-龥][^'"]*)['"]/g;
  let m;
  while ((m = colRegex.exec(content)) !== null) {
    const col = m[1] || m[2];
    const zh = m[3];
    if (col && /[一-龥]/.test(zh)) labels.set(col.replace(/\./g, '__'), zh);
  }

  // Also reversed: title then dataIndex
  const colRegex2 = /title[=:]\s*['"]([^'"]+[一-龥][^'"]*)['"][^}]*?dataIndex[=:]\s*(?:{?\[?['"]([^'"]+)['"]|['"]([^'"]+)['"])/g;
  while ((m = colRegex2.exec(content)) !== null) {
    const zh = m[1];
    const col = m[2] || m[3];
    if (col && /[一-龥]/.test(zh)) labels.set(col.replace(/\./g, '__'), zh);
  }

  // Form.Item label="中文" name="column"
  const formRegex = /label\s*=\s*['"]([^'"]+[一-龥][^'"]*)['"]\s+name\s*=\s*['"]([^'"]+)['"]/g;
  while ((m = formRegex.exec(content)) !== null) {
    labels.set(m[2], m[1]);
  }

  // Also reversed: name then label
  const formRegex2 = /name\s*=\s*['"]([^'"]+)['"]\s+label\s*=\s*['"]([^'"]+[一-龥][^'"]*)['"]/ ;
  const formRegex2g = new RegExp(formRegex2.source, 'g');
  while ((m = formRegex2g.exec(content)) !== null) {
    labels.set(m[1], m[2]);
  }

  // Descriptions.Item label="中文"  (show pages)
  const descRegex = /Descriptions\.Item\s+label\s*=\s*['"]([^'"]+[一-龥][^'"]*)['"]/g;
  while ((m = descRegex.exec(content)) !== null) {
    // Can't easily derive column from Descriptions.Item, add as generic label
    const zh = m[1];
    if (!Array.from(labels.values()).includes(zh)) {
      labels.set(`_desc_${zh}`, zh);
    }
  }

  // Page titles: <Edit title="编辑X"> <Create title="新建X"> <Show title="X详情"> <List title="X">
  const titleRegex = /<(?:Edit|Create|Show|List)\s[^>]*?title\s*=\s*['"]([^'"]+[一-龥][^'"]*)['"]/g;
  while ((m = titleRegex.exec(content)) !== null) {
    titles.push(m[1]);
  }

  // EditableItemTable title="X"
  const eitRegex = /EditableItemTable[^>]*?title\s*=\s*['"]([^'"]+[一-龥][^'"]*)['"]/g;
  while ((m = eitRegex.exec(content)) !== null) {
    sections.push(m[1]);
  }

  // Divider children
  const divRegex = /<Divider[^>]*>([^<]+[一-龥][^<]*)<\/Divider>/g;
  while ((m = divRegex.exec(content)) !== null) {
    sections.push(m[1].trim());
  }

  // Validation messages: message: '请输入/选择...'
  const valRegex = /message:\s*['"]([^'"]*请[输选][^'"]*)['"]/g;
  while ((m = valRegex.exec(content)) !== null) {
    validations.push(m[1]);
  }

  // Required message: message: '必填'
  const reqRegex = /message:\s*['"](必填[^'"]*)['"]/g;
  while ((m = reqRegex.exec(content)) !== null) {
    validations.push(m[1]);
  }

  // Inline select option labels: label: '中文'
  const optRegex = /label:\s*['"]([^'"]+[一-龥][^'"]*)['"]\s*,\s*value:\s*['"]([^'"]+)['"]/g;
  while ((m = optRegex.exec(content)) !== null) {
    selectOptions.push(`${m[1]}|${m[2]}`);
  }

  // message.success/error/warning('中文')
  const msgRegex = /message\.(?:success|error|warning|info)\(\s*['"]([^'"]+[一-龥][^'"]*)['"]\s*\)/g;
  while ((m = msgRegex.exec(content)) !== null) {
    messages.push(m[1]);
  }

  // window.confirm('中文')
  const confirmRegex = /confirm\(\s*['"]([^'"]+[一-龥][^'"]*)['"]\s*\)/g;
  while ((m = confirmRegex.exec(content)) !== null) {
    messages.push(m[1]);
  }

  // Popconfirm title="中文"
  const popRegex = /Popconfirm[^>]*?title\s*=\s*['"]([^'"]+[一-龥][^'"]*)['"]/g;
  while ((m = popRegex.exec(content)) !== null) {
    messages.push(m[1]);
  }

  // placeholder="中文"
  const phRegex = /placeholder\s*=\s*['"]([^'"]+[一-龥][^'"]*)['"]/g;
  while ((m = phRegex.exec(content)) !== null) {
    placeholders.push(m[1]);
  }

  return { file: filePath, table, labels, titles, sections, validations, selectOptions, messages, placeholders };
}

// ─── Walk directory for TSX files ───────────────────────────────────────────
function walkTsx(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...walkTsx(full));
    else if (entry.name.endsWith('.tsx')) results.push(full);
  }
  return results;
}

// ─── Main ───────────────────────────────────────────────────────────────────
function main() {
  const allFiles = walkTsx(FRONTEND_SRC);
  console.log(`Scanning ${allFiles.length} TSX files...\n`);

  const extractions = allFiles.map(extractFromFile);

  // Build fields dictionary: table → column → { zh, en }
  const fieldsCommon: Record<string, { zh: string; en: string }> = {};
  const fieldsTable: Record<string, Record<string, { zh: string; en: string }>> = {};
  const allSections: Record<string, string> = {}; // key → en
  const allSectionsZh: Record<string, string> = {}; // key → zh
  const allMessages = new Set<string>();
  const unmappedZh = new Set<string>();

  // Collect all labels by (table, column)
  const tableLabelMap: Record<string, Record<string, Set<string>>> = {}; // column → table → zh labels
  for (const ext of extractions) {
    for (const [col, zh] of ext.labels) {
      if (col.startsWith('_desc_')) continue;
      const table = ext.table || '_unknown';
      if (!tableLabelMap[col]) tableLabelMap[col] = {};
      if (!tableLabelMap[col][table]) tableLabelMap[col][table] = new Set();
      tableLabelMap[col][table].add(zh);
    }

    // Sections
    for (const s of ext.sections) {
      if (SECTION_ZH_TO_EN[s]) {
        const [key, en] = SECTION_ZH_TO_EN[s];
        allSections[key] = en;
        allSectionsZh[key] = s;
      } else {
        unmappedZh.add(`[section] ${s}`);
      }
    }

    // Messages
    for (const msg of ext.messages) allMessages.add(msg);
  }

  // Determine common vs table-specific
  for (const [col, tables] of Object.entries(tableLabelMap)) {
    const allZh = new Set<string>();
    for (const t of Object.values(tables)) {
      for (const zh of t) allZh.add(zh);
    }

    if (allZh.size === 1) {
      // Same label everywhere → goes to fields.common
      const zh = [...allZh][0];
      const en = ZH_TO_EN[zh];
      if (en) {
        fieldsCommon[col] = { zh, en };
      } else {
        unmappedZh.add(`[common] ${col} = "${zh}"`);
      }
    } else {
      // Different labels per table → table-specific
      for (const [table, zhSet] of Object.entries(tables)) {
        for (const zh of zhSet) {
          const en = ZH_TO_EN[zh];
          if (en) {
            if (!fieldsTable[table]) fieldsTable[table] = {};
            fieldsTable[table][col] = { zh, en };
          } else {
            unmappedZh.add(`[${table}] ${col} = "${zh}"`);
          }
        }
      }
    }
  }

  // Build titles
  const titlesEn: Record<string, Record<string, string>> = {};
  const titlesZh: Record<string, Record<string, string>> = {};

  for (const ext of extractions) {
    if (!ext.table) continue;
    for (const title of ext.titles) {
      let action: string | null = null;
      if (title.startsWith('新建')) action = 'create';
      else if (title.startsWith('编辑')) action = 'edit';

      if (action) {
        if (!titlesZh[ext.table]) titlesZh[ext.table] = {};
        titlesZh[ext.table][action] = title;

        if (!titlesEn[ext.table]) titlesEn[ext.table] = {};
        // Try to build from the ZH → EN mapping
        const noun = title.replace(/^(新建|编辑)/, '');
        const enNoun = ZH_TO_EN[noun] || noun;
        const enAction = action === 'create' ? 'Create' : 'Edit';
        titlesEn[ext.table][action] = `${enAction} ${enNoun}`;
      }
    }
  }

  // Output results
  console.log('=== FIELDS.COMMON ===');
  const sortedCommon = Object.entries(fieldsCommon).sort((a, b) => a[0].localeCompare(b[0]));
  for (const [col, { zh, en }] of sortedCommon) {
    console.log(`  ${col}: "${en}" / "${zh}"`);
  }
  console.log(`\n  Total common fields: ${sortedCommon.length}\n`);

  console.log('=== FIELDS.{TABLE} (overrides) ===');
  for (const [table, cols] of Object.entries(fieldsTable).sort((a, b) => a[0].localeCompare(b[0]))) {
    console.log(`  ${table}:`);
    for (const [col, { zh, en }] of Object.entries(cols).sort((a, b) => a[0].localeCompare(b[0]))) {
      console.log(`    ${col}: "${en}" / "${zh}"`);
    }
  }

  console.log('\n=== TITLES ===');
  for (const [table, actions] of Object.entries(titlesEn).sort((a, b) => a[0].localeCompare(b[0]))) {
    for (const [action, en] of Object.entries(actions)) {
      console.log(`  titles.${table}.${action}: "${en}" / "${titlesZh[table][action]}"`);
    }
  }

  console.log('\n=== SECTIONS ===');
  for (const [key, en] of Object.entries(allSections).sort((a, b) => a[0].localeCompare(b[0]))) {
    console.log(`  sections.${key}: "${en}" / "${allSectionsZh[key]}"`);
  }

  console.log('\n=== MESSAGES ===');
  for (const msg of [...allMessages].sort()) {
    console.log(`  "${msg}"`);
  }

  if (unmappedZh.size > 0) {
    console.log('\n=== UNMAPPED (need manual English translation) ===');
    for (const s of [...unmappedZh].sort()) {
      console.log(`  ${s}`);
    }
  }

  // Generate JSON fragments
  const enFields: Record<string, any> = { common: {} };
  const zhFields: Record<string, any> = { common: {} };

  for (const [col, { zh, en }] of sortedCommon) {
    enFields.common[col] = en;
    zhFields.common[col] = zh;
  }
  for (const [table, cols] of Object.entries(fieldsTable).sort((a, b) => a[0].localeCompare(b[0]))) {
    enFields[table] = {};
    zhFields[table] = {};
    for (const [col, { zh, en }] of Object.entries(cols).sort((a, b) => a[0].localeCompare(b[0]))) {
      enFields[table][col] = en;
      zhFields[table][col] = zh;
    }
  }

  const outDir = path.resolve(__dirname, '../frontend/src/i18n');

  // Write field fragments for manual merge
  const enFragment = {
    fields: enFields,
    titles: titlesEn,
    sections: allSections,
    validation: {
      required: '{{field}} is required',
      requiredSelect: 'Please select {{field}}',
      email: 'Please enter a valid email',
    },
    messages: {
      saveSuccess: 'Saved successfully',
      saveFailed: 'Save failed, please retry',
      deleteConfirm: 'Are you sure you want to delete?',
      unsavedChanges: 'You have unsaved changes. Are you sure you want to leave?',
      submitSuccess: 'Submitted successfully',
    },
    placeholders: {
      select: 'Select {{field}}',
      input: 'Enter {{field}}',
      example: 'e.g., {{example}}',
    },
  };

  const zhFragment = {
    fields: zhFields,
    titles: titlesZh,
    sections: allSectionsZh,
    validation: {
      required: '请输入{{field}}',
      requiredSelect: '请选择{{field}}',
      email: '请输入有效邮箱',
    },
    messages: {
      saveSuccess: '保存成功',
      saveFailed: '保存失败，请重试',
      deleteConfirm: '确定删除?',
      unsavedChanges: '有未保存的修改，确定要离开吗？',
      submitSuccess: '提交成功',
    },
    placeholders: {
      select: '选择{{field}}',
      input: '输入{{field}}',
      example: '如：{{example}}',
    },
  };

  fs.writeFileSync(path.join(outDir, '_fields_en_fragment.json'), JSON.stringify(enFragment, null, 2));
  fs.writeFileSync(path.join(outDir, '_fields_zh_fragment.json'), JSON.stringify(zhFragment, null, 2));

  console.log(`\nWrote fragments to:`);
  console.log(`  ${path.join(outDir, '_fields_en_fragment.json')}`);
  console.log(`  ${path.join(outDir, '_fields_zh_fragment.json')}`);
  console.log(`\nMerge these into en.json and zh-CN.json to complete the Data Element dictionary.`);
}

main();
