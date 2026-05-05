// src/routes/infrastructure.ts
// Infrastructure REST API — Organizations, Departments, Employees, Exchange Rates

import { Hono } from 'hono';
import type { Env } from '../types/env';
import { authMiddleware, writeMethodGuard, requireRole } from '../middleware/auth';
import { buildCrudRoutes, type CrudConfig } from '../utils/crud-factory';
import { getDbAndUser } from '../utils/query-helpers';
import { organizations, exchange_rates, number_sequences } from '../schema/columns';
import { ApiError } from '../utils/api-error';
import { ErrorCode } from '../types/errors';

const infrastructure = new Hono<{ Bindings: Env }>();
infrastructure.use('*', authMiddleware());
infrastructure.use('*', writeMethodGuard());

// Admin-only write guard for sensitive resources
const adminWriteGuard = requireRole('admin');
infrastructure.post('/organizations', adminWriteGuard);
infrastructure.put('/organizations/:id', adminWriteGuard);
infrastructure.delete('/organizations/:id', adminWriteGuard);
infrastructure.post('/number-sequences', adminWriteGuard);
infrastructure.put('/number-sequences/:id', adminWriteGuard);
infrastructure.delete('/number-sequences/:id', adminWriteGuard);

// ---------------------------------------------------------------------------
// Organizations — tenant root entity, read for all, write for admin only
// ---------------------------------------------------------------------------
// Organizations — restrict reads to own org only
infrastructure.get('/organizations', async (c) => {
  const { db, user } = getDbAndUser(c);
  const { data, error } = await db
    .from('organizations')
    .select('id, name, code, email, phone, plan, status, tax_number, created_at')
    .eq('id', user.organizationId);
  if (error) throw new ApiError({ code: ErrorCode.DATABASE_ERROR, detail: error.message, requestId: c.get('requestId') });
  return c.json({ data, total: data?.length ?? 0 });
});

infrastructure.get('/organizations/:id', async (c) => {
  const { db, user } = getDbAndUser(c);
  const id = c.req.param('id');
  if (id !== user.organizationId) {
    return c.json({ error: 'Not found' }, 404);
  }
  const { data, error } = await db
    .from('organizations')
    .select('id, name, code, email, phone, address, plan, status, tax_number, settings, created_at, updated_at')
    .eq('id', id)
    .single();
  if (error) throw new ApiError({ code: ErrorCode.DATABASE_ERROR, detail: error.message, requestId: c.get('requestId') });
  return c.json({ data });
});

const organizationsConfig: CrudConfig = {
  table: 'organizations',
  path: '/organizations',
  resourceName: 'Organization',
  listSelect: 'id, name, code, email, phone, plan, status, tax_number, created_at',
  detailSelect: organizations.join(', '),
  createReturnSelect: 'id, name, status',
  defaultSort: 'name',
  softDelete: false,
  orgScoped: false,
  // GET handlers are defined above with explicit org-scoping.
  // Disable all write operations on the factory to prevent unscoped POST/PUT/DELETE.
  disableCreate: true,
  disableUpdate: true,
  disableDelete: true,
};

const organizationsRouter = buildCrudRoutes(organizationsConfig);
infrastructure.route('', organizationsRouter);

// ---------------------------------------------------------------------------
// Departments — tree structure with parent_id and level
// ---------------------------------------------------------------------------
const departmentsConfig: CrudConfig = {
  table: 'departments',
  path: '/departments',
  resourceName: 'Department',
  listSelect: 'id, name, code, parent_id, manager_id, status',
  detailSelect: '*, parent:departments!parent_id(id,code,name), manager:employees!fk_departments_manager(id, name)',
  createReturnSelect: 'id, name, code',
  defaultSort: 'name',
  softDelete: false,
  orgScoped: true,
};

const departmentsRouter = buildCrudRoutes(departmentsConfig);
infrastructure.route('', departmentsRouter);

// ---------------------------------------------------------------------------
// Employees
// ---------------------------------------------------------------------------
const employeesConfig: CrudConfig = {
  table: 'employees',
  path: '/employees',
  resourceName: 'Employee',
  listSelect:
    'id, name, email, phone, position, status, employee_number, department:departments!department_id(id, name)',
  detailSelect: '*, department:departments!department_id(id, name, code)',
  createReturnSelect: 'id, name, employee_number',
  defaultSort: 'name',
  softDelete: false,
  orgScoped: true,
  audit: true,
};

const employeesRouter = buildCrudRoutes(employeesConfig);
infrastructure.route('', employeesRouter);

// ---------------------------------------------------------------------------
// Exchange Rates — no soft delete
// ---------------------------------------------------------------------------
const exchangeRatesConfig: CrudConfig = {
  table: 'exchange_rates',
  path: '/exchange-rates',
  resourceName: 'ExchangeRate',
  listSelect: 'id, from_currency, to_currency, rate, rate_type, effective_date, expiry_date',
  detailSelect: exchange_rates.join(', '),
  createReturnSelect: 'id, from_currency, to_currency, rate, effective_date',
  defaultSort: 'effective_date',
  softDelete: false,
  orgScoped: true,
};

const exchangeRatesRouter = buildCrudRoutes(exchangeRatesConfig);
infrastructure.route('', exchangeRatesRouter);

// ---------------------------------------------------------------------------
// Number Sequences — manage auto-numbering patterns per entity type
// ---------------------------------------------------------------------------
const numberSequencesConfig: CrudConfig = {
  table: 'number_sequences',
  path: '/number-sequences',
  resourceName: 'NumberSequence',
  listSelect: 'id, sequence_name, prefix, current_value, padding, increment_by, created_at',
  detailSelect: number_sequences.join(', '),
  createReturnSelect: 'id, sequence_name, prefix',
  defaultSort: 'sequence_name',
  softDelete: false,
  orgScoped: true,
};

const numberSequencesRouter = buildCrudRoutes(numberSequencesConfig);
infrastructure.route('', numberSequencesRouter);

export default infrastructure;
