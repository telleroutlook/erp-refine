# API ↔ Frontend Consistency Audit Prompt

> A general-purpose prompt for Claude Code (or any AI coding assistant) to detect mismatches between backend API, database schema, and frontend rendering in a full-stack web application.

---

## Prompt

```
You are auditing a full-stack web application for consistency bugs — places where
the backend API, database schema, and frontend UI disagree with each other. These
bugs are insidious: the code compiles, type-checks pass, but the feature silently
returns empty data or 500 errors at runtime.

Perform a systematic audit across the following 6 dimensions. For each, report
every concrete mismatch you find as a table row: file:line | issue | fix.

---

### 1. Column Name Mismatch (API SELECT vs actual DB)

The #1 source of "no data" bugs. API queries reference column names that don't
exist in the real database table.

**Check:**
- Every explicit `.select('col1, col2, ...')` or `SELECT col1, col2` in backend
  route handlers and ORM queries
- Compare each column name against the actual database schema (migration files,
  information_schema, or ORM model definitions)
- Pay special attention to common rename patterns:
  - `qty` vs `quantity`, `qty_on_hand` vs `quantity`
  - `*_no` vs `*_number` (e.g. `po_no` vs `order_number`)
  - `*_id` naming inconsistencies
  - `description` vs `notes` vs `remarks`
  - `is_active` vs `status`
  - snake_case vs camelCase mismatches

**Also check:**
- CrudConfig / resource config objects that define `listSelect` or `detailSelect`
- GraphQL resolver field mappings
- Any query builder or raw SQL strings

---

### 2. Sort Field Existence

A query can succeed but fail when sorted by a column that doesn't exist on the
table — or that exists but wasn't included in an explicit select.

**Check:**
- What default sort field does the frontend framework send? (e.g. Refine defaults
  to `created_at`, some ORMs default to `id`)
- What default sort field does the backend apply if none is provided?
- Does every table actually have the column being sorted on?
- When using explicit column selects (not `*`), is the sort column included?
  Some ORMs/APIs (e.g. Supabase PostgREST) require the sort column to be in the
  select list.
- Check every page/component that renders a data table — if it doesn't specify
  a custom sort, it uses the default. Verify the default works for that table.

---

### 3. Frontend Field ↔ API Response Shape

The frontend renders specific field paths from the API response. If the API
returns a different shape, the UI shows blank cells.

**Check:**
- Every `dataIndex`, field binding, or template interpolation in frontend
  table/list/form components
- Nested object access patterns (e.g. `record.warehouse.name`) — does the API
  actually join/include that relation?
- Computed or virtual fields referenced in the frontend — does the API return
  them, or are they only in the DB?
- camelCase vs snake_case — does the API serialize one way while the frontend
  expects another? Is there a transformation layer?
- Array vs object — does the API return an array of related items where the
  frontend expects an object (or vice versa)?

---

### 4. Missing Filters (Soft Delete, Tenant Isolation, Auth Scope)

Queries that forget required WHERE clauses return wrong or forbidden data.

**Check:**
- Tables with `deleted_at` / `is_deleted` — does every query on these tables
  filter for non-deleted records?
- Multi-tenant tables with `organization_id` / `tenant_id` — does every query
  filter by the current user's tenant?
- Row-level security (RLS) — if the DB relies on RLS, are the correct auth
  context values being passed? If not using RLS, are manual filters present?
- Are there queries that use `.single()` without adequate filters, which could
  match a deleted or wrong-tenant record?

---

### 5. Pagination & Count Consistency

The total count and page data must agree, or the UI shows wrong page numbers
or missing records.

**Check:**
- Does the count query apply the same filters as the data query? (deleted_at,
  org_id, search filters)
- When using `{ count: 'exact' }` or `COUNT(*)`, is it on the same filtered set?
- Does the API return `total` / `count` in the expected field name? Does the
  frontend read from the right key?
- Off-by-one in range/offset calculations — `.range(0, 9)` returns 10 rows in
  Supabase, not 9.
- Empty states — does the API return `{ data: [], total: 0 }` or just `[]`?
  Does the frontend handle both?

---

### 6. Relation Join Failures (Silent Nulls)

When the API joins related tables but the FK relationship is broken or the
join syntax is wrong, the related data comes back null without an error.

**Check:**
- Every `.select('relation:table(fields)')` or JOIN — does the foreign key
  actually exist between those tables?
- Are relation names in the select matching the actual FK constraint names or
  table names?
- Inner join vs left join — will a missing related record cause the entire
  parent row to disappear?
- Are there circular or ambiguous foreign keys where the ORM/API can't
  determine which FK to use? (e.g. a table with two FKs to the same table)
- For CrudConfig/factory patterns, do the relation selects match the actual
  schema for each sub-resource?

---

## Output Format

For each issue found, produce a row:

| # | Category | File:Line | Table/Resource | Issue | Suggested Fix |
|---|----------|-----------|----------------|-------|---------------|

At the end, provide a summary count: X issues found across Y files.
Group by severity:
- **CRITICAL**: API returns 500 or empty data (user-visible breakage)
- **HIGH**: Wrong data shown, missing filters (security or correctness)
- **MEDIUM**: Pagination off, minor field mismatches (degraded UX)
- **LOW**: Unnecessary columns selected, style inconsistencies
```

---

## Usage

1. Paste the prompt above into your AI coding assistant
2. Optionally prefix with: `Audit the codebase at <path>. Backend routes are in <dir>, frontend pages in <dir>, migrations in <dir>.`
3. For large codebases, scope by domain: `Focus on the inventory and procurement modules.`
