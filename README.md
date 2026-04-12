# ERP-Refine

AI-driven adaptive ERP platform — Cloudflare Workers + Hono + Supabase + React Refine

**Production**: https://erp.3we.org

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Cloudflare Workers |
| API | Hono v4 + OpenAPI |
| Database | Supabase PostgreSQL (RLS multi-tenant) |
| Frontend | React 18 + Refine v4 + Ant Design v5 |
| AI | Vercel AI SDK v6 + 3-Agent Architecture |
| Storage | KV (cache), R2 (files), Queues (events) |

## Quick Start

```bash
# Install
npm install
cd frontend && npm install && cd ..

# Dev
wrangler dev --local        # Backend: http://localhost:8787
cd frontend && npm run dev  # Frontend: http://localhost:5173

# Deploy
cd frontend && npm run build && cd ..
npx wrangler deploy
```

## API

333+ endpoints across all ERP modules. Self-documenting:

| Endpoint | Description |
|---|---|
| `GET /api` | Resource index |
| `GET /api/docs` | Swagger UI |
| `GET /health` | Health check |

All endpoints require `Authorization: Bearer <jwt>`. Multi-tenant via `organization_id` in JWT.

### Error Format (RFC 9457)

```json
{
  "type": "VALIDATION_ERROR",
  "status": 422,
  "title": "Validation Error",
  "detail": "Field 'order_date' is required",
  "request_id": "abc-123",
  "hint": "Check the errors array for field-level details.",
  "errors": [{ "field": "order_date", "message": "Required", "code": "invalid_type" }]
}
```

### Modules

| Module | Endpoints | Key Features |
|---|---|---|
| Master Data | ~50 | Products, categories, tax codes, warehouses, carriers, currencies, UOMs, price lists |
| Partners | ~30 | Customers + addresses + bank accounts, Suppliers + sites + bank accounts |
| Procurement | ~55 | PO (atomic), requisitions, RFQ, receipts → **stock entry**, invoices, 3-way match, payments |
| Sales | ~45 | SO (atomic), shipments → **stock deduction**, invoices, returns → **stock return**, receipts |
| Inventory | ~30 | Stock records, transactions (audit), lots, serial numbers, reservations, cycle counts |
| Finance | ~35 | Chart of accounts, cost centers, vouchers (debit=credit), budgets, payment records |
| Manufacturing | ~25 | BOM, work orders, material issue → **stock out**, completion → **stock in** |
| Quality | ~15 | Standards, inspections, defect codes |
| Contracts | ~5 | Contracts with line items |
| Assets | ~15 | Fixed assets, depreciation, maintenance |
| Admin | ~20 | Approval rules, notifications, **data import** |

## Data Import

Admin-only endpoints for bulk data loading and customer onboarding.

```bash
# List supported entities and import order
curl /api/admin/import -H "Authorization: Bearer <admin-jwt>"

# Import single entity
curl -X POST /api/admin/import/products \
  -H "Authorization: Bearer <admin-jwt>" \
  -d '{ "records": [...], "options": { "upsert": true, "dry_run": false } }'

# Import multiple entities (auto-ordered by dependencies)
curl -X POST /api/admin/import-batch \
  -H "Authorization: Bearer <admin-jwt>" \
  -d '{ "data": { "departments": [...], "products": [...] } }'
```

### Seed Demo Data

```bash
npx tsx scripts/seed-data.ts --api-url http://localhost:8787 --token <admin-jwt>
# Add --dry-run to validate without inserting
```

Generates: 8 departments, 10 employees, 20 products, 15 customers, 10 suppliers, 3 warehouses, 6 months of PO/SO history.

### Customer Onboarding

1. Copy `templates/import/starter-data.json`
2. Fill in customer's data
3. `POST /api/admin/import-batch` to load

See `templates/import/template-guide.json` for all entity schemas.

## Project Structure

```
src/
├── index.ts              # Worker entry + route mounting
├── routes/               # 17 Hono route files (333+ endpoints)
├── utils/
│   ├── crud-factory.ts   # Generic CRUD generator
│   ├── atomic-helpers.ts # Header + items atomic insert
│   ├── stock-helpers.ts  # Concurrent-safe stock operations
│   ├── import-engine.ts  # Batch import with dependency graph
│   ├── api-error.ts      # RFC 9457 structured errors
│   └── ...
├── middleware/            # Auth, CORS, rate limit, error handler
├── agents/               # Intent, Schema Architect, Execution
├── tools/                # AI SDK tools per domain
├── policy/               # Decision level rules (D0-D5)
└── types/

frontend/src/
├── providers/            # Refine DataProvider + AuthProvider
├── pages/                # Page components
├── components/           # Shared + AI chat + dynamic forms
└── i18n/                 # zh/en translations

supabase/migrations/      # 15 SQL migrations (schema authority)
scripts/                  # seed-data.ts, check-registry.js
templates/import/         # Customer onboarding templates
```

## Database

15 migrations, 50+ tables with RLS. Key conventions:

- All tables: `organization_id` (multi-tenant), `deleted_at` (soft delete)
- Document numbers: `get_next_sequence(org_id, entity_name)` RPC
- Stock: `adjust_stock(org, warehouse, product, qty_delta)` RPC with row-level locking
- Triggers: `fn_calc_po_totals`, `fn_calc_so_totals` auto-compute order totals

## Scripts

```bash
npm run test          # Vitest
npm run test:sql      # SQL validation
npm run check:registry # Tool registry + policy coverage
npm run schema:validate # Field mapping check
```
