# ERP Refine 3.0 — AI 驱动的自适应 ERP 平台

> **项目代号**: erp-refine
> **启动日期**: 2026-04-12
> **核心目标**: 实现「界面随需而变（UI on Demand）」，通过三专职 Agent 协作 + Schema-Driven 动态渲染 + 受控执行闭环，构建可自适应演进的企业级 ERP 平台。

---

## 1. 项目定位与核心理念

### 1.1 从 ai-native-erp 继承的经验

本项目是 [ai-native-erp](https://github.com/) 的全面重构。前项目在 Cloudflare Workers + Supabase + Vue 3 技术栈上积累了以下核心经验：

| 经验领域 | 具体内容 | 本项目继承方式 |
|---|---|---|
| **D0-D5 决策分级** | AI 行为按风险分级：D0 纯查询、D1 建议、D2 需确认、D3 需审批、D4 受控自动、D5 禁止 | 完整保留，作为 Policy Engine 基础 |
| **Policy Engine** | 集中式规则引擎，条件→动作映射，默认安全（未注册写操作=deny） | 保留并增强，新增风险评分维度 |
| **RLS 多租户** | PostgreSQL Row-Level Security 实现租户隔离，`get_user_org_id()` 函数 | 完整保留，所有表强制 RLS |
| **软删除** | `deleted_at TIMESTAMPTZ` 列，业务表全覆盖 | 保留，统一到所有业务实体 |
| **审计链** | `agent_decisions` + `business_events` 不可变记录 | 保留并增强为 Log Chain |
| **Tool Runtime** | 超时降级、重试、KV 缓存、语义缓存、指标采集 | 保留，增加链路追踪 |
| **Agent 脚手架** | `executeAgent()` 统一生命周期：断路器→执行→审计→指标 | 保留，适配三 Agent 架构 |
| **Supabase Schema** | 65 张表覆盖 P2P/O2C/库存/财务/生产/质量/AI 治理 | 全面重写，修复已知问题 |

### 1.2 与前项目的核心差异

| 维度 | ai-native-erp (旧) | erp-refine (新) |
|---|---|---|
| **前端** | Vue 3 + Element Plus（手工 CRUD 页面） | Refine + Ant Design（Schema-Driven 动态渲染） |
| **AI 架构** | 单 Orchestrator + 领域 Agent | 三专职 Agent（Intent / Schema Architect / Execution） |
| **UI 生成** | 简单 Generative UI 工具 | 完整 Schema Registry + RJSF 动态渲染引擎 |
| **Schema 治理** | 无版本管理 | 三态生命周期（草稿/活跃/归档） |
| **安全** | RLS + Policy Engine | 同上 + 逐步增强风险评分 |
| **部署** | 单体 Worker | 单体 Worker（Phase 1），可演进为微服务 |

### 1.3 架构哲学

```
意图层（Intent）  ──→  仲裁层（Arbitration）  ──→  执行层（Execution）
  用户自然语言            AI + 规则引擎               受控渲染 + 受控存储
  理解但不执行            提案但不直接写入             确权后才激活
```

**核心原则**：AI 是「受约束的提案者」，不是决策者。每个 AI 提案都由人确认、系统验证、架构保障可回滚。

---

## 2. 技术架构

### 2.1 技术栈总览

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Refine)                      │
│  React 18 + Refine v4 + Ant Design v5 + @rjsf/antd     │
│  核心页面: Refine Resource    动态页面: RJSF 渲染引擎     │
│  i18n: react-i18next          状态: Refine hooks         │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTPS
┌───────────────────────┴─────────────────────────────────┐
│               BFF Layer (Cloudflare Worker)               │
│  Hono v4 + Vercel AI SDK + Three Agents                  │
│                                                           │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │  Intent   │  │   Schema     │  │    Execution     │   │
│  │  Agent    │→ │   Architect  │→ │    Agent         │   │
│  │          │  │   Agent      │  │                  │   │
│  └──────────┘  └──────────────┘  └──────────────────┘   │
│                                                           │
│  Policy Engine │ Schema Registry │ Tool Runtime           │
│  HITL 拦截器   │ 风险评分引擎      │ 审计链                 │
└───────────────────────┬─────────────────────────────────┘
                        │ Supabase SDK
┌───────────────────────┴─────────────────────────────────┐
│              Data Layer (Supabase PostgreSQL)              │
│  Core Tables │ JSONB Dynamic Vault │ Schema Registry DB   │
│  RLS Policies │ Triggers & Functions │ RPC                │
└─────────────────────────────────────────────────────────┘

辅助服务:
  Cloudflare KV     → 缓存（工具结果、会话、配置）
  Cloudflare R2     → 文件存储（附件、文档模板）
  Cloudflare Queues → 异步事件总线
  Cloudflare DO     → 有状态会话（聊天、限流）
  Vectorize         → 向量检索（语义缓存、Few-shot）
```

### 2.2 后端：Cloudflare Workers + Hono

| 技术 | 版本 | 用途 |
|---|---|---|
| Cloudflare Workers | ES Modules | 边缘计算运行时 |
| Hono | v4.x | HTTP 路由、中间件 |
| Vercel AI SDK | v6.x | LLM 工具调用、流式响应 |
| Supabase JS | v2.x | PostgreSQL 客户端 |
| Zod | v3.x | Schema 验证 |
| Jose | v5.x | JWT 操作 |

### 2.3 前端：Refine + Ant Design + RJSF

| 技术 | 版本 | 用途 |
|---|---|---|
| React | 18.x | UI 框架 |
| Refine | v4.x | CRUD 框架（DataProvider、Auth、Resource） |
| Ant Design | v5.x | UI 组件库 |
| @rjsf/antd | latest | JSON Schema → Ant Design 表单 |
| React Router | v6.x | 路由 |
| react-i18next | latest | 国际化 |
| Vite | v5.x | 构建工具 |
| ECharts | v5.x | 数据可视化 |

**混合渲染策略**：
- **核心 ERP 页面**（采购/销售/库存/财务）：用 Refine 的 `useTable`、`useForm`、`useShow` 预定义页面，类型安全、性能稳定
- **AI 动态生成页面**：用 `@rjsf/antd` 将 JSON Schema 渲染为 Ant Design 表单，支持 AI 实时生成/修改

### 2.4 AI Agent 架构：三专职代理

#### Intent Agent（意图代理）
- **职责**：理解用户自然语言 → 结构化需求规格书（Requirement Spec）
- **完全不触碰** UI 渲染或业务数据
- **工具集**：`parse_user_intent`、`clarify_ambiguity`、`preview_requirement_spec`
- **模型**：Claude Sonnet（复杂意图）/ Claude Haiku（简单意图）

#### Schema Architect Agent（架构代理）
- **职责**：接收规格书 → 在组件白名单内生成 UI Schema Diff
- **输出 Diff 形式**：描述相对现有系统「增加/修改/删除了什么」
- **工具集**：`generate_ui_schema_diff`、`map_data_structure`、`preview_component_snapshot`
- **向量增强**：Vectorize Few-shot 检索历史成功 Schema

#### Execution Agent（执行代理）
- **职责**：通过 BFF 验证 + 人工确权后才激活，调用业务接口
- **无权**生成 UI 或修改 Schema
- **工具集**：继承现有 ERP 领域工具 + `execute_with_confirmation`、`undo_last_action`
- **D0-D5 分级**：所有工具按决策等级分类，Policy Engine 逐一评估

### 2.5 BFF 层治理能力

| 能力 | Phase 1 | Phase 2 | Phase 3 |
|---|---|---|---|
| **Schema Registry** | 三态生命周期（草稿/活跃/归档） | 版本回滚、迁移映射声明 | 自动物理化建议 |
| **风险评分** | 基础规则（敏感字段检测） | 字段组合推断风险 | 权限矩阵冲突检测 |
| **HITL 拦截器** | D2 确认 / D3 审批 | 分级前置路由 | 智能审批路由 |
| **审计链** | 不可变 agent_decisions | 链式签名 | 完整信任链验证 |

---

## 3. 数据库架构（全面重设计）

### 3.1 设计原则

1. **命名一致性**：`snake_case`，关联字段 `{entity}_id`，数量字段 `qty_*`，日期字段 `*_date`
2. **全表 RLS**：所有 `public` 表启用 RLS，通过 `get_user_org_id()` 隔离
3. **全业务表软删除**：`deleted_at TIMESTAMPTZ DEFAULT NULL`
4. **外键完整性**：所有关联必须有 FK，多态关联用 lookup 表或 CHECK 约束
5. **CHECK 约束**：金额 ≥ 0、日期范围、状态枚举、数量非负
6. **索引策略**：所有 FK 字段、status 字段、date 字段建索引
7. **Generated 列**：可计算字段用 GENERATED ALWAYS AS
8. **审计字段**：所有表含 `created_at`、`updated_at`、`created_by`

### 3.2 表清单（按模块分组）

#### 基础设施（Infrastructure）
| 表名 | 说明 | 软删除 |
|---|---|---|
| `organizations` | 多租户组织 | No |
| `departments` | 部门（树形） | Yes |
| `employees` | 员工（关联 auth.users） | Yes |
| `currencies` | 货币（全局） | No |
| `uoms` | 计量单位（全局，层级转换） | No |
| `exchange_rates` | 汇率（按组织） | No |
| `number_sequences` | 单据号序列生成器 | No |
| `approval_rules` | 多级审批规则 | Yes |
| `approval_records` | 审批执行记录 | No |

#### 主数据（Master Data）
| 表名 | 说明 | 软删除 |
|---|---|---|
| `product_categories` | 产品分类（树形） | Yes |
| `products` | 产品/物料 | Yes |
| `tax_codes` | 税码（VAT/GST 等） | Yes |
| `customers` | 客户 | Yes |
| `customer_addresses` | 客户地址（多地址） | Yes |
| `customer_bank_accounts` | 客户银行账户 | Yes |
| `suppliers` | 供应商 | Yes |
| `supplier_sites` | 供应商站点 | Yes |
| `supplier_bank_accounts` | 供应商银行账户 | Yes |
| `warehouses` | 仓库 | Yes |
| `storage_locations` | 库位 | Yes |
| `carriers` | 承运商 | Yes |
| `price_lists` | 价格表 | Yes |
| `price_list_lines` | 价格表行 | Yes |

#### 库存管理（Inventory）
| 表名 | 说明 | 软删除 |
|---|---|---|
| `stock_records` | 库存余额（UNIQUE: org+仓库+产品） | No |
| `stock_transactions` | 库存事务（不可变） | No |
| `inventory_lots` | 批次 | Yes |
| `serial_numbers` | 序列号 | Yes |
| `inventory_reservations` | 库存预留 | No |
| `inventory_counts` | 盘点单 | Yes |
| `inventory_count_lines` | 盘点行 | No |

#### 采购（Procurement - P2P）
| 表名 | 说明 | 软删除 |
|---|---|---|
| `purchase_requisitions` | 采购申请 | Yes |
| `purchase_requisition_lines` | 采购申请行 | Yes |
| `rfq_headers` | 询价单 | Yes |
| `rfq_lines` | 询价行 | Yes |
| `supplier_quotations` | 供应商报价 | Yes |
| `supplier_quotation_lines` | 报价行 | Yes |
| `purchase_orders` | 采购订单 | Yes |
| `purchase_order_items` | 采购订单行 | Yes |
| `purchase_receipts` | 采购收货 | Yes |
| `purchase_receipt_items` | 收货行 | Yes |
| `supplier_invoices` | 供应商发票 | Yes |
| `supplier_invoice_items` | 发票行 | Yes |
| `three_way_match_results` | 三方匹配结果 | No |
| `payment_requests` | 付款申请 | Yes |

#### 销售（Sales - O2C）
| 表名 | 说明 | 软删除 |
|---|---|---|
| `sales_orders` | 销售订单 | Yes |
| `sales_order_items` | 订单行 | Yes |
| `sales_shipments` | 发货单 | Yes |
| `sales_shipment_items` | 发货行 | Yes |
| `sales_invoices` | 销售发票 | Yes |
| `sales_invoice_items` | 发票行 | Yes |
| `sales_returns` | 销售退货 | Yes |
| `sales_return_items` | 退货行 | Yes |
| `customer_receipts` | 客户收款 | Yes |

#### 财务（Finance）
| 表名 | 说明 | 软删除 |
|---|---|---|
| `cost_centers` | 成本中心 | Yes |
| `account_subjects` | 会计科目（树形） | Yes |
| `vouchers` | 凭证 | Yes |
| `voucher_entries` | 凭证分录 | No |
| `budgets` | 预算（按年度/部门/科目） | Yes |
| `budget_lines` | 预算明细行 | No |
| `payment_records` | 收付款记录 | No |

#### 生产（Manufacturing）
| 表名 | 说明 | 软删除 |
|---|---|---|
| `bom_headers` | BOM 表头 | Yes |
| `bom_items` | BOM 行 | Yes |
| `work_orders` | 工单 | Yes |
| `work_order_materials` | 工单用料 | No |
| `work_order_productions` | 工单产出/报工 | No |

#### 质量（Quality）
| 表名 | 说明 | 软删除 |
|---|---|---|
| `quality_standards` | 质量标准模板 | Yes |
| `quality_standard_items` | 标准检验项 | Yes |
| `quality_inspections` | 检验单 | Yes |
| `quality_inspection_items` | 检验项结果 | No |
| `defect_codes` | 缺陷代码 | Yes |

#### 合同（Contracts）
| 表名 | 说明 | 软删除 |
|---|---|---|
| `contracts` | 合同 | Yes |
| `contract_items` | 合同行 | Yes |

#### 资产（Assets）
| 表名 | 说明 | 软删除 |
|---|---|---|
| `fixed_assets` | 固定资产 | Yes |
| `asset_depreciations` | 折旧记录 | No |
| `asset_maintenance_records` | 维护记录 | No |

#### AI 治理（AI Governance）
| 表名 | 说明 | 软删除 |
|---|---|---|
| `agent_sessions` | Agent 会话 | No |
| `agent_decisions` | Agent 决策记录（不可变） | No |
| `business_events` | 业务事件（不可变） | No |
| `tool_call_metrics` | 工具调用指标 | No |
| `token_usage` | Token 消耗 | No |

#### Schema 治理（Schema Governance）
| 表名 | 说明 | 软删除 |
|---|---|---|
| `schema_registry` | UI Schema 版本注册 | No |
| `schema_versions` | Schema 版本历史 | No |
| `component_whitelist` | 组件白名单 | Yes |
| `semantic_metadata` | 语义元数据（LLM 上下文） | No |

#### 系统（System）
| 表名 | 说明 | 软删除 |
|---|---|---|
| `tool_registry` | 工具注册表 | No |
| `workflows` | 工作流实例 | No |
| `workflow_executions` | 工作流执行步骤 | No |
| `document_attachments` | 文档附件 | Yes |
| `notifications` | 系统通知 | No |

### 3.3 关键改进（vs ai-native-erp）

1. **新增表**：`tax_codes`、`carriers`、`cost_centers`、`budgets`/`budget_lines`、`approval_rules`、`number_sequences`、`rfq_headers`/`rfq_lines`、`supplier_quotations`、`serial_numbers`、`quality_standards`、`defect_codes`、`fixed_assets`、`customer_bank_accounts`、`schema_registry`、`notifications`
2. **全面索引**：所有 FK 列、status 列、date 列建索引
3. **CHECK 约束**：金额 ≥ 0、日期范围合法、状态枚举
4. **多级审批**：`approval_rules` + `approval_records` 替代简单的 `approved_by`
5. **单据编号**：`number_sequences` 统一管理，不再各表自行生成
6. **完整采购流程**：PR → RFQ → 报价 → PO → 收货 → 发票 → 付款
7. **统一命名**：彻底消除 `po_no`/`order_number` 混乱

---

## 4. 前端架构

### 4.1 目录结构

```
frontend/
├── src/
│   ├── App.tsx                      # 根组件
│   ├── main.tsx                     # 入口
│   ├── refine-config.ts             # Refine DataProvider + Auth
│   ├── i18n/                        # 国际化
│   │   ├── i18n.ts
│   │   ├── zh-CN.json
│   │   └── en.json
│   ├── providers/
│   │   ├── data-provider.ts         # Supabase REST → Refine DataProvider
│   │   ├── auth-provider.ts         # Supabase Auth → Refine AuthProvider
│   │   ├── access-control.ts        # RBAC 权限
│   │   └── i18n-provider.ts         # i18n 适配
│   ├── resources/                   # Refine Resource 定义
│   │   ├── procurement.tsx
│   │   ├── sales.tsx
│   │   ├── inventory.tsx
│   │   ├── finance.tsx
│   │   ├── master-data.tsx
│   │   └── dynamic.tsx              # AI 动态资源加载
│   ├── pages/                       # 页面组件
│   │   ├── procurement/
│   │   │   ├── purchase-orders/
│   │   │   │   ├── list.tsx         # useTable
│   │   │   │   ├── create.tsx       # useForm
│   │   │   │   ├── edit.tsx
│   │   │   │   └── show.tsx         # useShow
│   │   │   ├── purchase-receipts/
│   │   │   └── ...
│   │   ├── sales/
│   │   ├── inventory/
│   │   ├── finance/
│   │   ├── quality/
│   │   ├── manufacturing/
│   │   └── dynamic/
│   │       └── DynamicFormPage.tsx   # RJSF 渲染器
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx
│   │   │   ├── Sider.tsx
│   │   │   └── Header.tsx
│   │   ├── ai/
│   │   │   ├── ChatPanel.tsx        # AI 聊天面板
│   │   │   ├── ActionCard.tsx       # AI 决策卡片
│   │   │   ├── SchemaPreview.tsx    # Schema 预览
│   │   │   └── ConfirmDialog.tsx    # D2 确认对话框
│   │   ├── shared/
│   │   │   ├── StatusTag.tsx
│   │   │   ├── AmountDisplay.tsx
│   │   │   ├── DocumentFlow.tsx
│   │   │   └── ApprovalTrail.tsx
│   │   └── dynamic-form/
│   │       ├── DynamicFormRenderer.tsx  # RJSF 包装器
│   │       ├── custom-widgets/          # 自定义 RJSF Widget
│   │       └── schema-validator.ts      # Schema 校验
│   ├── hooks/
│   │   ├── useAiChat.ts
│   │   ├── useDynamicResource.ts
│   │   └── useApproval.ts
│   ├── utils/
│   └── types/
├── public/
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

### 4.2 Refine 核心页面模式

```typescript
// 示例：采购订单列表页
import { useTable, List } from "@refinedev/antd";
import { Table, Tag } from "antd";

export const PurchaseOrderList: React.FC = () => {
  const { tableProps } = useTable({
    resource: "purchase_orders",
    filters: { permanent: [{ field: "deleted_at", operator: "null" }] },
    sorters: { initial: [{ field: "created_at", order: "desc" }] },
  });

  return (
    <List>
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="order_number" title="订单号" />
        <Table.Column dataIndex="supplier" title="供应商"
          render={(_, record) => record.supplier?.name} />
        <Table.Column dataIndex="status" title="状态"
          render={(status) => <StatusTag status={status} />} />
        <Table.Column dataIndex="total_amount" title="金额"
          render={(v, r) => <AmountDisplay value={v} currency={r.currency} />} />
      </Table>
    </List>
  );
};
```

### 4.3 RJSF 动态渲染模式

```typescript
// AI 生成的 Schema → 动态表单
import Form from "@rjsf/antd";
import validator from "@rjsf/validator-ajv8";

export const DynamicFormPage: React.FC<{ schemaId: string }> = ({ schemaId }) => {
  const { data: schema } = useOne({ resource: "schema_registry", id: schemaId });

  if (!schema?.data) return <Spin />;

  // 验证 Schema 状态：仅 active 可渲染
  if (schema.data.status !== "active") {
    return <Result status="warning" title="此表单尚未激活" />;
  }

  return (
    <Form
      schema={schema.data.json_schema}
      uiSchema={schema.data.ui_schema}
      validator={validator}
      onSubmit={handleSubmit}
    />
  );
};
```

---

## 5. 后端架构

### 5.1 目录结构

```
src/
├── index.ts                         # Worker 入口
├── types/
│   └── env.ts                       # Env interface（所有 Bindings）
├── agents/
│   ├── base-agent.ts                # Agent 脚手架（executeAgent）
│   ├── intent-agent.ts              # 意图解析
│   ├── schema-architect-agent.ts    # Schema 生成
│   └── execution-agent.ts           # 业务执行
├── bff/
│   ├── schema-registry.ts           # Schema 注册与版本管理
│   ├── risk-scorer.ts               # 风险评分引擎
│   ├── hitl-interceptor.ts          # 人机协同拦截器
│   └── schema-validator.ts          # Schema 合法性验证
├── tools/
│   ├── tool-registry.ts             # 工具注册中心
│   ├── intent-tools.ts              # Intent Agent 工具集
│   ├── schema-tools.ts              # Schema Architect 工具集
│   ├── inventory-tools.ts           # 库存工具
│   ├── procurement-tools.ts         # 采购工具
│   ├── sales-tools.ts               # 销售工具
│   ├── finance-tools.ts             # 财务工具
│   ├── quality-tools.ts             # 质量工具
│   ├── manufacturing-tools.ts       # 生产工具
│   ├── reporting-tools.ts           # 报表工具
│   ├── master-data-tools.ts         # 主数据工具
│   └── lookup-tools.ts              # 查找工具
├── policy/
│   ├── policy-engine.ts             # 策略引擎
│   ├── risk-levels.ts               # D0-D5 定义
│   └── rules/                       # 按领域分规则文件
│       ├── procurement-rules.ts
│       ├── sales-rules.ts
│       └── finance-rules.ts
├── runtime/
│   ├── tool-runtime.ts              # 工具执行运行时
│   ├── circuit-breaker.ts           # 断路器
│   └── cache.ts                     # KV + 语义缓存
├── orchestrator/
│   ├── orchestrator.ts              # 三 Agent 协调器
│   └── intent-router.ts             # 意图→Agent 路由
├── routes/
│   ├── auth.ts                      # 认证路由
│   ├── chat.ts                      # 聊天路由
│   ├── schema.ts                    # Schema 管理路由
│   ├── procurement.ts               # 采购 REST API
│   ├── sales.ts                     # 销售 REST API
│   ├── inventory.ts                 # 库存 REST API
│   ├── finance.ts                   # 财务 REST API
│   └── master-data.ts               # 主数据 REST API
├── middleware/
│   ├── auth.ts                      # JWT 认证
│   ├── cors.ts                      # CORS
│   ├── request-id.ts                # 请求追踪
│   ├── rate-limit.ts                # 限流
│   └── error-handler.ts             # 错误处理
├── queues/
│   └── event-consumer.ts            # 事件总线消费者
├── do/
│   ├── chat-agent-do.ts             # 聊天 DO
│   └── rate-limiter-do.ts           # 限流 DO
└── utils/
    ├── database.ts                  # DB 封装
    ├── supabase.ts                  # Supabase 客户端
    └── logger.ts                    # 日志
```

### 5.2 三 Agent 协作流程

```
用户输入: "帮我创建一个供应商评分卡表单"

Step 1 - Intent Agent:
  parse_user_intent(message) → {
    intent: "create_custom_form",
    domain: "procurement",
    entity: "supplier_scorecard",
    fields_hint: ["supplier_name", "delivery_score", "quality_score", "price_score"],
    confidence: 0.92
  }

Step 2 - Schema Architect Agent:
  generate_ui_schema_diff(requirement_spec) → {
    schema_diff: {
      add_fields: [
        { name: "supplier_id", type: "string", widget: "supplier-select", required: true },
        { name: "delivery_score", type: "number", widget: "rate", min: 1, max: 5 },
        { name: "quality_score", type: "number", widget: "rate", min: 1, max: 5 },
        { name: "price_score", type: "number", widget: "rate", min: 1, max: 5 },
        { name: "overall_score", type: "number", widget: "readonly", generated: "avg(delivery,quality,price)" },
        { name: "comments", type: "string", widget: "textarea" }
      ],
      storage: "jsonb_dynamic_vault",
      risk_level: "low"
    },
    status: "draft"
  }

Step 3 - BFF 验证:
  risk_scorer.evaluate(schema_diff) → { score: 15, level: "low", auto_approve: true }
  schema_registry.save(schema_diff, status: "draft")

Step 4 - 用户确认:
  前端展示 Schema 预览 → 用户点击「激活」
  schema_registry.activate(schema_id, status: "active")

Step 5 - Execution Agent (当用户填写表单时):
  execute_with_confirmation(form_data) → 写入 JSONB Dynamic Vault
```

### 5.3 REST API 设计（供 Refine DataProvider 使用）

Refine 默认使用 REST DataProvider，API 需符合以下约定：

```
GET    /api/{resource}              → getList    (支持 _sort, _order, _start, _end, filters)
GET    /api/{resource}/:id          → getOne
POST   /api/{resource}              → create
PUT    /api/{resource}/:id          → update
DELETE /api/{resource}/:id          → deleteOne  (软删除)
GET    /api/{resource}/:id/show     → getOne (with relations)
```

所有响应统一格式：
```json
{
  "data": [...],
  "total": 100,
  "page": 1,
  "pageSize": 20
}
```

---

## 6. Schema 治理

### 6.1 三态生命周期

```
草稿态（Draft）
  │ Schema Architect Agent 生成
  │ 存入 schema_registry, status = 'draft'
  │ 数据存于 JSONB Dynamic Vault 的沙箱分区
  │ 自动 TTL: 72 小时
  ↓ 用户审核确认 / 管理员审批
活跃态（Active）
  │ 数据写入 JSONB Dynamic Vault 正式分区
  │ 前端可渲染
  │ 记录使用频率（为将来物理化做准备）
  ↓ 业务废弃申请 + 依赖关系扫描通过
归档态（Archived）
  │ 只读，不可写入
  │ 保留数据用于合规查询
  │ 前端不再展示（除管理员视图）
```

### 6.2 Schema Registry 表结构

```sql
CREATE TABLE schema_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  json_schema JSONB NOT NULL,     -- JSON Schema (RJSF 兼容)
  ui_schema JSONB,                -- RJSF UI Schema
  data_mapping JSONB,             -- 存储映射配置
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  version INTEGER NOT NULL DEFAULT 1,
  risk_score INTEGER DEFAULT 0,
  created_by UUID REFERENCES employees(id),
  activated_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,         -- 草稿态 TTL
  trace_id TEXT,                  -- 关联 Agent 决策 ID
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (organization_id, slug, version)
);
```

---

## 7. 安全模型

### 7.1 继承并增强

| 层次 | 机制 | 来源 |
|---|---|---|
| **数据库** | RLS + `get_user_org_id()` | 继承 |
| **API** | JWT 认证 + RBAC 中间件 | 继承 |
| **AI** | D0-D5 决策分级 | 继承 |
| **策略** | Policy Engine 集中规则 | 继承 |
| **审计** | agent_decisions + business_events | 继承 |
| **NEW: 风险评分** | Schema 敏感字段检测 | Phase 1 基础版 |
| **NEW: HITL 分级** | 按风险评分路由审批 | Phase 2 |
| **NEW: 链式签名** | Schema 信任链 | Phase 3 |

### 7.2 角色定义

| 角色 | 权限范围 |
|---|---|
| `admin` | 全部读写 + 系统配置 |
| `manager` | 全部读 + 所辖部门写 + 审批 |
| `procurement_manager` | 采购读写 + 库存读 |
| `sales_manager` | 销售读写 + 库存读 |
| `finance_manager` | 财务读写 + 全部只读 |
| `inventory_manager` | 库存读写 |
| `quality_manager` | 质量读写 + 采购/生产只读 |
| `production_manager` | 生产读写 + 库存读写 |
| `viewer` | 全部只读 |

---

## 8. 国际化策略

### 8.1 技术方案

- **框架**：`react-i18next` + Refine i18nProvider
- **初始语言**：`zh-CN`（中文简体）、`en`（英文）
- **翻译文件**：`frontend/src/i18n/{locale}.json`
- **命名空间**：按模块分（`common`、`procurement`、`sales`、`inventory`、`finance`）

### 8.2 翻译范围

- 所有 UI 标签、按钮、菜单
- 状态枚举值
- 错误消息
- 数据库 `semantic_metadata` 的 `display_name` 按语言存储
- AI 聊天界面（AI 回复语言随用户设置切换）

---

## 9. 演进路线

### Phase 1: 核心 ERP + 受控 AI（3-4 个月）

**目标**：完成核心 ERP CRUD + Intent Agent + Execution Agent 基础集成

| 里程碑 | 内容 | 交付物 |
|---|---|---|
| M1 (4周) | 项目脚手架 + DB Schema + Auth | 可登录的空壳应用 |
| M2 (4周) | 主数据 + 采购全流程 | 采购 P2P 可跑通 |
| M3 (4周) | 销售 + 库存 + 财务基础 | O2C + 库存管理可用 |
| M4 (4周) | Intent Agent + Execution Agent + AI 聊天 | AI 可理解意图并执行查询/操作 |

**Phase 1 闸门**：
- [ ] 核心 ERP 功能可用（P2P、O2C、库存、财务）
- [ ] AI 意图解析准确率 > 80%
- [ ] D0-D2 工具覆盖率 > 70%
- [ ] 完整多语言支持（中/英）

### Phase 2: Schema-Driven UI + 三 Agent 完整体（3-4 个月）

**目标**：Schema Architect Agent 上线 + RJSF 动态渲染 + Schema Registry

| 里程碑 | 内容 | 交付物 |
|---|---|---|
| M5 (4周) | Schema Architect Agent + Schema Registry | AI 可生成 UI Schema |
| M6 (4周) | RJSF 动态渲染 + JSONB 动态仓库 | 动态表单可使用 |
| M7 (4周) | 风险评分 + HITL 分级审批 | 治理体系完整 |
| M8 (4周) | 生产 + 质量 + 合同 + 资产模块 | 扩展模块上线 |

**Phase 2 闸门**：
- [ ] AI 生成表单一次性审批通过率 > 70%
- [ ] 生成表单字段准确率 > 85%
- [ ] Schema 三态生命周期运转正常
- [ ] 风险评分引擎覆盖 100% 动态 Schema

### Phase 3: 自适应演进（6 个月+）

**目标**：系统自我优化 + MRP + 高级分析

| 能力 | 说明 |
|---|---|
| AI 主动建议 | 基于运营数据主动推荐流程优化（只读分析，不自动执行） |
| JSONB → 物理表 | 高频使用的动态表单自动建议物理化 |
| MRP | 需求预测 + 物料计划 + 生产排程 |
| 链式签名 | 完整 Schema 信任链验证 |
| AI 决策热图 | 识别 AI 系统性理解偏差，优化 Prompt |

---

## 10. 开发规范

### 10.1 Git 规范
- 分支：`main`（生产）、`develop`（开发）、`feature/*`、`fix/*`
- 提交：Conventional Commits（`feat:`、`fix:`、`chore:`、`docs:`）
- PR：必须通过 CI + Code Review

### 10.2 代码规范
- **语言**：TypeScript（strict mode）
- **后端**：Hono 路由 + Zod 验证 + 明确的 Env interface
- **前端**：React 函数组件 + Hooks + Refine patterns
- **测试**：Vitest（单元）+ Playwright（E2E）
- **Lint**：ESLint + Prettier

### 10.3 数据库规范
- 迁移文件：`supabase/migrations/NNN_description.sql`
- 查询：显式列名（禁止 `SELECT *`）
- 软删除：查询必须加 `WHERE deleted_at IS NULL`
- 多租户：查询必须含 `organization_id` 过滤

---

## 附录 A: 对比原方案的修正与取舍

| 原方案建议 | 本项目决定 | 原因 |
|---|---|---|
| 四态生命周期（草稿/试运行/稳定/归档） | 三态（草稿/活跃/归档） | 试运行和稳定的区分增加复杂度，Phase 1 不需要 |
| 完整 Zero Trust（链式签名、日志链、NLP 交叉验证） | RLS + Policy Engine + 逐步增强 | 实现成本极高，从已验证有效的方案出发逐步迭代 |
| BFF + Agent 微服务分离 | 单体 Worker | 降低 Phase 1 复杂度，Worker 间通信开销大 |
| 向量检索硬过滤（Module + Role） | Phase 2 实现 | Phase 1 先跑通基础流程 |
| 影子部署（Shadow Deployment） | Phase 3 | 优先级低，CI/CD 先跑通 |
| 不可篡改审计日志（Log Chain） | Phase 3 | agent_decisions 已经是 append-only |

## 附录 B: 从 ai-native-erp 迁移的具体资产

| 资产 | 文件/模块 | 迁移方式 |
|---|---|---|
| Policy Engine | `src/policy/policy-engine.ts` | 重构后移植 |
| Tool Runtime | `src/runtime/tool-runtime.ts` | 直接移植 |
| Agent 脚手架 | `src/agents/base-agent.ts` | 适配三 Agent 后移植 |
| 库存工具 | `src/tools/ai-sdk/inventory-ai-tools.ts` | SQL 重写后移植 |
| 采购工具 | `src/tools/ai-sdk/procurement-ai-tools.ts` | SQL 重写后移植 |
| 销售工具 | `src/tools/ai-sdk/sales-ai-tools.ts` | SQL 重写后移植 |
| 财务工具 | `src/tools/ai-sdk/finance-ai-tools.ts` | SQL 重写后移植 |
| DB 封装 | `src/utils/database.ts` | 直接移植 |
| Supabase RLS 模式 | `supabase/migrations/013_*.sql` | 重写但保持模式 |
| 前端设计 Token | `frontend/src/styles/design-tokens.css` | 转换为 Ant Design theme |
