// src/routes/infrastructure.ts
// Infrastructure REST API — Organizations, Departments, Employees, Exchange Rates

import { Hono } from 'hono';
import type { Env } from '../types/env';
import { authMiddleware, writeMethodGuard } from '../middleware/auth';
import { buildCrudRoutes, type CrudConfig } from '../utils/crud-factory';

const infrastructure = new Hono<{ Bindings: Env }>();
infrastructure.use('*', authMiddleware());
infrastructure.use('*', writeMethodGuard());

// ---------------------------------------------------------------------------
// Organizations — tenant root entity, read for all, write for admin only
// ---------------------------------------------------------------------------
const organizationsConfig: CrudConfig = {
  table: 'organizations',
  path: '/organizations',
  resourceName: 'Organization',
  listSelect: 'id, name, code, email, phone, plan, status, tax_number, created_at',
  detailSelect: '*',
  createReturnSelect: 'id, name, status',
  defaultSort: 'name',
  softDelete: false,
  orgScoped: false,
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
  detailSelect: '*, manager:employees!fk_departments_manager(id, name)',
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
  listSelect: 'id, from_currency, to_currency, rate, effective_date',
  detailSelect: '*',
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
  detailSelect: '*',
  createReturnSelect: 'id, sequence_name, prefix',
  defaultSort: 'sequence_name',
  softDelete: false,
  orgScoped: true,
};

const numberSequencesRouter = buildCrudRoutes(numberSequencesConfig);
infrastructure.route('', numberSequencesRouter);

export default infrastructure;
