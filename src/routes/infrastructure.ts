// src/routes/infrastructure.ts
// Infrastructure REST API — Departments, Employees, Exchange Rates

import { Hono } from 'hono';
import type { Env } from '../types/env';
import { authMiddleware } from '../middleware/auth';
import { buildCrudRoutes, type CrudConfig } from '../utils/crud-factory';

const infrastructure = new Hono<{ Bindings: Env }>();
infrastructure.use('*', authMiddleware());

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
  softDelete: true,
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
  softDelete: true,
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

export default infrastructure;
