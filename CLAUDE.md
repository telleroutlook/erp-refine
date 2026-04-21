# ERP Refine 开发规范

## Schema 规则

- SQL 列名以 **`information_schema`（实际数据库）** 为**唯一权威参考**
- 迁移文件 `supabase/migrations/` 可能与实际 DB 不一致（见 `018_reconcile_schema.sql` 文档）
- 修改列名或添加字段时，先用 `SELECT column_name FROM information_schema.columns WHERE table_name = '...'` 验证
- 新增 SQL 查询后必须运行 `npm run test:sql` 验证
- 每次修改 DB schema 时，在 `supabase/migrations/` 下创建新迁移文件
- 运行 `npm run schema:validate` 检查字段映射一致性

### 迁移文件规范

- Supabase 迁移：在 `supabase/migrations/` 目录下
- 文件名格式: `NNN_description.sql`（NNN 为 3 位数字前缀）

## 技术栈

- **后端**: Cloudflare Workers + Hono v4 + Vercel AI SDK v6
- **前端**: React 18 + Refine v4 + Ant Design v5 + @rjsf/antd
- **数据库**: Supabase PostgreSQL（RLS 多租户）
- **存储**: Cloudflare KV (缓存) + R2 (文件) + Queues (事件)
- **AI**: Claude Sonnet/Haiku（三专职 Agent 架构）
- **测试**: Vitest + Playwright

## 三 Agent 架构

- **Intent Agent**: 理解用户意图 → 结构化需求规格书。不触碰 UI 或业务数据。
- **Schema Architect Agent**: 接收规格书 → 在组件白名单内生成 UI Schema Diff。
- **Execution Agent**: 通过 BFF 验证 + 人工确权后才激活，调用业务接口。继承 D0-D5 分级。

## 决策分级 (D0-D5)

- D0: 纯查询/解释（自动通过）
- D1: 生成建议/草稿（自动通过）
- D2: 草稿执行需用户确认（require_confirmation）
- D3: 需正式审批（require_approval）
- D4: 受控自动执行（Phase 2+）
- D5: 禁止 AI 执行

## 列名速查（易混淆字段）

**重要**: 以 `information_schema` 查询结果为唯一权威。迁移文件可能与实际 DB 不一致（见 `018_reconcile_schema.sql`）。
查询前用 `SELECT column_name FROM information_schema.columns WHERE table_name = '...'` 验证实际列名。

## 软删除规范

所有业务单据和主数据表均有 `deleted_at TIMESTAMPTZ DEFAULT NULL`。查询时必须加 `WHERE deleted_at IS NULL`。

## 工具开发流程

1. 在 `src/tools/<domain>-tools.ts` 编写工具
2. 在 `src/tools/tool-registry.ts` 注册
3. D2+ 工具在 `src/policy/` 添加规则
4. 运行 `npm run check:registry` 验证注册和 policy 覆盖
5. 运行 `npm run test:sql` 验证 SQL
6. 运行 `npx vitest run` 跑全量测试

## Policy Engine 规范

- **默认行为**：未注册的 D0/D1（查询类）action → allow；包含写入关键词的 action → deny
- 关键词匹配：`workflow`、`batch`、`approve`、`close`、`submit` → 默认 deny
- 所有 D2 操作必须实现 `confirmed` 参数两步确认流程
- 新增 D2+ 工具必须在 policy 注册对应规则

## 项目结构

```
src/
├── index.ts              # Worker 入口
├── types/env.ts          # Env interface
├── agents/               # 三专职 Agent
├── bff/                  # BFF 治理层（Schema Registry、风险评分）
├── tools/                # AI SDK 工具（LLM 可调用）
├── policy/               # Policy Engine
├── runtime/              # 工具运行时（超时、重试、缓存）
├── orchestrator/         # Agent 协调器
├── routes/               # Hono REST 路由
├── middleware/            # 中间件
├── queues/               # 事件消费者
├── do/                   # Durable Objects
└── utils/                # 工具函数

frontend/
├── src/
│   ├── providers/        # Refine DataProvider/AuthProvider
│   ├── resources/        # Refine Resource 定义
│   ├── pages/            # 页面组件
│   ├── components/       # 共享组件
│   ├── hooks/            # 自定义 Hooks
│   └── i18n/             # 国际化
└── ...

supabase/migrations/      # SQL 迁移文件（唯一 schema 权威）
```

## Git 规范

- Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`
- 分支：`main`（生产）、`develop`、`feature/*`、`fix/*`
- 不提交：`wrangler.toml` 中的 secrets、`.dev.vars`

## 前端规范

- React 函数组件 + Hooks（禁用 Class 组件）
- Refine useTable/useForm/useShow 管理 CRUD
- 核心 ERP 页面：Refine 预定义；AI 动态页面：RJSF 渲染
- Ant Design v5 主题定制
- 中英文完整多语言支持（react-i18next）

## 后端规范

- 所有 API 路由返回统一格式：`{ data, total?, page?, pageSize? }`
- 查询必须显式列名（禁止 SELECT *）
- 多租户查询必须含 `organization_id` 过滤
- 所有 DB 写操作通过 `executeWithAudit()` 记录审计

## 网络代理

当遇到网络超时时使用 HTTP 代理：
```bash
git -c http.proxy=http://192.168.1.3:7890 -c https.proxy=http://192.168.1.3:7890 push
npm --proxy http://192.168.1.3:7890 --https-proxy http://192.168.1.3:7890 install
```

## 既有设计说明（非安全隐患）

### 快捷登录按钮 & 演示密码

- `frontend/.env.production` 中的 `VITE_DEMO_PASSWORD` 和登录页快捷按钮是**刻意设计**，不是安全漏洞
- 本项目是演示/作品集系统，快捷登录让评估者可以一键体验不同 ERP 角色，无需手动输入凭据
- 密码通过 Vite 环境变量注入，生产环境也保留此功能
- **禁止**将快捷登录按钮限制为仅开发环境（`import.meta.env.DEV`），也不要将 `.env.production` 加入 `.gitignore`
