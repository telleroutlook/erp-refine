import React, { useState, useEffect } from 'react';
import { loadable } from './utils/loadable';
import { Refine, Authenticated } from '@refinedev/core';
import { ErrorComponent } from '@refinedev/antd';
import { BrowserRouter, Route, Routes, Outlet, Navigate } from 'react-router-dom';
import routerBindings, { UnsavedChangesNotifier } from '@refinedev/react-router-v6';
import { ConfigProvider, App as AntApp } from 'antd';
import type { Locale } from 'antd/es/locale';
import enUS from 'antd/locale/en_US';
import zhCN from 'antd/locale/zh_CN';
import '@refinedev/antd/dist/reset.css';
import '@xyflow/react/dist/style.css';
import './styles/tokens.css';
import './styles/responsive.css';
import i18n from './i18n/i18n';

import { dataProvider } from './providers/data-provider';
import { authProvider } from './providers/auth-provider';
import { i18nProvider } from './providers/i18n-provider';
import { AppLayout } from './components/layout/AppLayout';
import { NavigationProgress } from './components/layout/NavigationProgress';
import { erpTheme } from './theme';
import { LoginPage } from './pages/auth/LoginPage';
import { WelcomePage } from './pages/Welcome';

// ── Procurement ──
const PurchaseOrderList = loadable(() => import('./pages/procurement/purchase-orders/list'));
const PurchaseOrderShow = loadable(() => import('./pages/procurement/purchase-orders/show').then((m) => ({ default: m.PurchaseOrderShow })));
const PurchaseOrderCreate = loadable(() => import('./pages/procurement/purchase-orders/create').then((m) => ({ default: m.PurchaseOrderCreate })));
const PurchaseOrderEdit = loadable(() => import('./pages/procurement/purchase-orders/edit').then((m) => ({ default: m.PurchaseOrderEdit })));
const SupplierList = loadable(() => import('./pages/procurement/suppliers/list').then((m) => ({ default: m.SupplierList })));
const SupplierShow = loadable(() => import('./pages/procurement/suppliers/show').then((m) => ({ default: m.SupplierShow })));
const SupplierCreate = loadable(() => import('./pages/procurement/suppliers/create').then((m) => ({ default: m.SupplierCreate })));
const SupplierEdit = loadable(() => import('./pages/procurement/suppliers/edit').then((m) => ({ default: m.SupplierEdit })));
const PurchaseReceiptList = loadable(() => import('./pages/procurement/purchase-receipts/list').then((m) => ({ default: m.PurchaseReceiptList })));
const PurchaseReceiptShow = loadable(() => import('./pages/procurement/purchase-receipts/show').then((m) => ({ default: m.PurchaseReceiptShow })));
const PurchaseReceiptCreate = loadable(() => import('./pages/procurement/purchase-receipts/create').then((m) => ({ default: m.PurchaseReceiptCreate })));
const PurchaseReceiptEdit = loadable(() => import('./pages/procurement/purchase-receipts/edit').then((m) => ({ default: m.PurchaseReceiptEdit })));
const PurchaseRequisitionList = loadable(() => import('./pages/procurement/purchase-requisitions/list').then((m) => ({ default: m.PurchaseRequisitionList })));
const PurchaseRequisitionShow = loadable(() => import('./pages/procurement/purchase-requisitions/show').then((m) => ({ default: m.PurchaseRequisitionShow })));
const PurchaseRequisitionCreate = loadable(() => import('./pages/procurement/purchase-requisitions/create').then((m) => ({ default: m.PurchaseRequisitionCreate })));
const PurchaseRequisitionEdit = loadable(() => import('./pages/procurement/purchase-requisitions/edit').then((m) => ({ default: m.PurchaseRequisitionEdit })));
const RfqHeaderList = loadable(() => import('./pages/procurement/rfq-headers/list').then((m) => ({ default: m.RfqHeaderList })));
const RfqHeaderShow = loadable(() => import('./pages/procurement/rfq-headers/show').then((m) => ({ default: m.RfqHeaderShow })));
const RfqHeaderCreate = loadable(() => import('./pages/procurement/rfq-headers/create').then((m) => ({ default: m.RfqHeaderCreate })));
const RfqHeaderEdit = loadable(() => import('./pages/procurement/rfq-headers/edit').then((m) => ({ default: m.RfqHeaderEdit })));
const SupplierQuotationList = loadable(() => import('./pages/procurement/supplier-quotations/list').then((m) => ({ default: m.SupplierQuotationList })));
const SupplierQuotationShow = loadable(() => import('./pages/procurement/supplier-quotations/show').then((m) => ({ default: m.SupplierQuotationShow })));
const SupplierQuotationCreate = loadable(() => import('./pages/procurement/supplier-quotations/create').then((m) => ({ default: m.SupplierQuotationCreate })));
const SupplierQuotationEdit = loadable(() => import('./pages/procurement/supplier-quotations/edit').then((m) => ({ default: m.SupplierQuotationEdit })));
const ProfileChangeRequestList = loadable(() => import('./pages/procurement/profile-change-requests/list').then((m) => ({ default: m.ProfileChangeRequestList })));
const ProfileChangeRequestShow = loadable(() => import('./pages/procurement/profile-change-requests/show').then((m) => ({ default: m.ProfileChangeRequestShow })));
const ProfileChangeRequestCreate = loadable(() => import('./pages/procurement/profile-change-requests/create').then((m) => ({ default: m.ProfileChangeRequestCreate })));
const ProfileChangeRequestEdit = loadable(() => import('./pages/procurement/profile-change-requests/edit').then((m) => ({ default: m.ProfileChangeRequestEdit })));
const AdvanceShipmentNoticeList = loadable(() => import('./pages/procurement/advance-shipment-notices/list').then((m) => ({ default: m.AdvanceShipmentNoticeList })));
const AdvanceShipmentNoticeShow = loadable(() => import('./pages/procurement/advance-shipment-notices/show').then((m) => ({ default: m.AdvanceShipmentNoticeShow })));
const AdvanceShipmentNoticeCreate = loadable(() => import('./pages/procurement/advance-shipment-notices/create').then((m) => ({ default: m.AdvanceShipmentNoticeCreate })));
const AdvanceShipmentNoticeEdit = loadable(() => import('./pages/procurement/advance-shipment-notices/edit').then((m) => ({ default: m.AdvanceShipmentNoticeEdit })));
const ReconciliationStatementList = loadable(() => import('./pages/procurement/reconciliation-statements/list').then((m) => ({ default: m.ReconciliationStatementList })));
const ReconciliationStatementShow = loadable(() => import('./pages/procurement/reconciliation-statements/show').then((m) => ({ default: m.ReconciliationStatementShow })));
const ReconciliationStatementCreate = loadable(() => import('./pages/procurement/reconciliation-statements/create').then((m) => ({ default: m.ReconciliationStatementCreate })));
const ReconciliationStatementEdit = loadable(() => import('./pages/procurement/reconciliation-statements/edit').then((m) => ({ default: m.ReconciliationStatementEdit })));
const ThreeWayMatchList = loadable(() => import('./pages/procurement/three-way-match/list').then((m) => ({ default: m.ThreeWayMatchList })));
const ThreeWayMatchShow = loadable(() => import('./pages/procurement/three-way-match/show').then((m) => ({ default: m.ThreeWayMatchShow })));

// ── Sales ──
const SalesOrderList = loadable(() => import('./pages/sales/sales-orders/list').then((m) => ({ default: m.SalesOrderList })));
const SalesOrderShow = loadable(() => import('./pages/sales/sales-orders/show').then((m) => ({ default: m.SalesOrderShow })));
const SalesOrderCreate = loadable(() => import('./pages/sales/sales-orders/create').then((m) => ({ default: m.SalesOrderCreate })));
const SalesOrderEdit = loadable(() => import('./pages/sales/sales-orders/edit').then((m) => ({ default: m.SalesOrderEdit })));
const CustomerList = loadable(() => import('./pages/sales/customers/list').then((m) => ({ default: m.CustomerList })));
const CustomerShow = loadable(() => import('./pages/sales/customers/show').then((m) => ({ default: m.CustomerShow })));
const CustomerCreate = loadable(() => import('./pages/sales/customers/create').then((m) => ({ default: m.CustomerCreate })));
const CustomerEdit = loadable(() => import('./pages/sales/customers/edit').then((m) => ({ default: m.CustomerEdit })));
const SalesShipmentList = loadable(() => import('./pages/sales/sales-shipments/list').then((m) => ({ default: m.SalesShipmentList })));
const SalesShipmentShow = loadable(() => import('./pages/sales/sales-shipments/show').then((m) => ({ default: m.SalesShipmentShow })));
const SalesShipmentCreate = loadable(() => import('./pages/sales/sales-shipments/create').then((m) => ({ default: m.SalesShipmentCreate })));
const SalesShipmentEdit = loadable(() => import('./pages/sales/sales-shipments/edit').then((m) => ({ default: m.SalesShipmentEdit })));
const SalesReturnList = loadable(() => import('./pages/sales/sales-returns/list').then((m) => ({ default: m.SalesReturnList })));
const SalesReturnShow = loadable(() => import('./pages/sales/sales-returns/show').then((m) => ({ default: m.SalesReturnShow })));
const SalesReturnCreate = loadable(() => import('./pages/sales/sales-returns/create').then((m) => ({ default: m.SalesReturnCreate })));
const SalesReturnEdit = loadable(() => import('./pages/sales/sales-returns/edit').then((m) => ({ default: m.SalesReturnEdit })));
const CustomerReceiptList = loadable(() => import('./pages/sales/customer-receipts/list').then((m) => ({ default: m.CustomerReceiptList })));
const CustomerReceiptShow = loadable(() => import('./pages/sales/customer-receipts/show').then((m) => ({ default: m.CustomerReceiptShow })));
const CustomerReceiptCreate = loadable(() => import('./pages/sales/customer-receipts/create').then((m) => ({ default: m.CustomerReceiptCreate })));
const CustomerReceiptEdit = loadable(() => import('./pages/sales/customer-receipts/edit').then((m) => ({ default: m.CustomerReceiptEdit })));

// ── Inventory ──
const StockRecordList = loadable(() => import('./pages/inventory/index').then((m) => ({ default: m.StockRecordList })));
const WarehouseList = loadable(() => import('./pages/inventory/warehouses/list').then((m) => ({ default: m.WarehouseList })));
const WarehouseShow = loadable(() => import('./pages/inventory/warehouses/show').then((m) => ({ default: m.WarehouseShow })));
const WarehouseCreate = loadable(() => import('./pages/inventory/warehouses/create').then((m) => ({ default: m.WarehouseCreate })));
const WarehouseEdit = loadable(() => import('./pages/inventory/warehouses/edit').then((m) => ({ default: m.WarehouseEdit })));
const InventoryCountList = loadable(() => import('./pages/inventory/inventory-counts/list').then((m) => ({ default: m.InventoryCountList })));
const InventoryCountShow = loadable(() => import('./pages/inventory/inventory-counts/show').then((m) => ({ default: m.InventoryCountShow })));
const InventoryCountCreate = loadable(() => import('./pages/inventory/inventory-counts/create').then((m) => ({ default: m.InventoryCountCreate })));
const InventoryCountEdit = loadable(() => import('./pages/inventory/inventory-counts/edit').then((m) => ({ default: m.InventoryCountEdit })));
const InventoryLotList = loadable(() => import('./pages/inventory/inventory-lots/list').then((m) => ({ default: m.InventoryLotList })));
const InventoryLotShow = loadable(() => import('./pages/inventory/inventory-lots/show').then((m) => ({ default: m.InventoryLotShow })));
const InventoryLotCreate = loadable(() => import('./pages/inventory/inventory-lots/create').then((m) => ({ default: m.InventoryLotCreate })));
const InventoryLotEdit = loadable(() => import('./pages/inventory/inventory-lots/edit').then((m) => ({ default: m.InventoryLotEdit })));
const SerialNumberList = loadable(() => import('./pages/inventory/serial-numbers/list').then((m) => ({ default: m.SerialNumberList })));
const SerialNumberShow = loadable(() => import('./pages/inventory/serial-numbers/show').then((m) => ({ default: m.SerialNumberShow })));
const SerialNumberCreate = loadable(() => import('./pages/inventory/serial-numbers/create').then((m) => ({ default: m.SerialNumberCreate })));
const SerialNumberEdit = loadable(() => import('./pages/inventory/serial-numbers/edit').then((m) => ({ default: m.SerialNumberEdit })));
const StockTransactionList = loadable(() => import('./pages/inventory/stock-transactions/list').then((m) => ({ default: m.StockTransactionList })));
const StockTransactionShow = loadable(() => import('./pages/inventory/stock-transactions/show').then((m) => ({ default: m.StockTransactionShow })));
const InventoryReservationList = loadable(() => import('./pages/inventory/inventory-reservations/list').then((m) => ({ default: m.InventoryReservationList })));
const InventoryReservationShow = loadable(() => import('./pages/inventory/inventory-reservations/show').then((m) => ({ default: m.InventoryReservationShow })));
const InventoryReservationCreate = loadable(() => import('./pages/inventory/inventory-reservations/create').then((m) => ({ default: m.InventoryReservationCreate })));
const InventoryReservationEdit = loadable(() => import('./pages/inventory/inventory-reservations/edit').then((m) => ({ default: m.InventoryReservationEdit })));

// ── Manufacturing ──
const BomHeaderList = loadable(() => import('./pages/manufacturing/bom-headers/list').then((m) => ({ default: m.BomHeaderList })));
const BomHeaderShow = loadable(() => import('./pages/manufacturing/bom-headers/show').then((m) => ({ default: m.BomHeaderShow })));
const BomHeaderCreate = loadable(() => import('./pages/manufacturing/bom-headers/create').then((m) => ({ default: m.BomHeaderCreate })));
const BomHeaderEdit = loadable(() => import('./pages/manufacturing/bom-headers/edit').then((m) => ({ default: m.BomHeaderEdit })));
const WorkOrderList = loadable(() => import('./pages/manufacturing/work-orders/list').then((m) => ({ default: m.WorkOrderList })));
const WorkOrderShow = loadable(() => import('./pages/manufacturing/work-orders/show').then((m) => ({ default: m.WorkOrderShow })));
const WorkOrderCreate = loadable(() => import('./pages/manufacturing/work-orders/create').then((m) => ({ default: m.WorkOrderCreate })));
const WorkOrderEdit = loadable(() => import('./pages/manufacturing/work-orders/edit').then((m) => ({ default: m.WorkOrderEdit })));
const WorkOrderProductionList = loadable(() => import('./pages/manufacturing/work-order-productions/list').then((m) => ({ default: m.WorkOrderProductionList })));
const WorkOrderProductionShow = loadable(() => import('./pages/manufacturing/work-order-productions/show').then((m) => ({ default: m.WorkOrderProductionShow })));
const WorkOrderProductionCreate = loadable(() => import('./pages/manufacturing/work-order-productions/create').then((m) => ({ default: m.WorkOrderProductionCreate })));

// ── Quality ──
const DefectCodeList = loadable(() => import('./pages/quality/defect-codes/list').then((m) => ({ default: m.DefectCodeList })));
const DefectCodeShow = loadable(() => import('./pages/quality/defect-codes/show').then((m) => ({ default: m.DefectCodeShow })));
const DefectCodeCreate = loadable(() => import('./pages/quality/defect-codes/create').then((m) => ({ default: m.DefectCodeCreate })));
const DefectCodeEdit = loadable(() => import('./pages/quality/defect-codes/edit').then((m) => ({ default: m.DefectCodeEdit })));
const QualityStandardList = loadable(() => import('./pages/quality/quality-standards/list').then((m) => ({ default: m.QualityStandardList })));
const QualityStandardShow = loadable(() => import('./pages/quality/quality-standards/show').then((m) => ({ default: m.QualityStandardShow })));
const QualityStandardCreate = loadable(() => import('./pages/quality/quality-standards/create').then((m) => ({ default: m.QualityStandardCreate })));
const QualityStandardEdit = loadable(() => import('./pages/quality/quality-standards/edit').then((m) => ({ default: m.QualityStandardEdit })));
const QualityInspectionList = loadable(() => import('./pages/quality/quality-inspections/list').then((m) => ({ default: m.QualityInspectionList })));
const QualityInspectionShow = loadable(() => import('./pages/quality/quality-inspections/show').then((m) => ({ default: m.QualityInspectionShow })));
const QualityInspectionCreate = loadable(() => import('./pages/quality/quality-inspections/create').then((m) => ({ default: m.QualityInspectionCreate })));
const QualityInspectionEdit = loadable(() => import('./pages/quality/quality-inspections/edit').then((m) => ({ default: m.QualityInspectionEdit })));

// ── Finance ──
const PaymentRequestList = loadable(() => import('./pages/finance/payment-requests/list').then((m) => ({ default: m.PaymentRequestList })));
const PaymentRequestShow = loadable(() => import('./pages/finance/payment-requests/show').then((m) => ({ default: m.PaymentRequestShow })));
const PaymentRequestCreate = loadable(() => import('./pages/finance/payment-requests/create').then((m) => ({ default: m.PaymentRequestCreate })));
const PaymentRequestEdit = loadable(() => import('./pages/finance/payment-requests/edit').then((m) => ({ default: m.PaymentRequestEdit })));
const SalesInvoiceList = loadable(() => import('./pages/finance/sales-invoices/list').then((m) => ({ default: m.SalesInvoiceList })));
const SalesInvoiceShow = loadable(() => import('./pages/finance/sales-invoices/show').then((m) => ({ default: m.SalesInvoiceShow })));
const SalesInvoiceCreate = loadable(() => import('./pages/finance/sales-invoices/create').then((m) => ({ default: m.SalesInvoiceCreate })));
const SalesInvoiceEdit = loadable(() => import('./pages/finance/sales-invoices/edit').then((m) => ({ default: m.SalesInvoiceEdit })));
const SupplierInvoiceList = loadable(() => import('./pages/finance/supplier-invoices/list').then((m) => ({ default: m.SupplierInvoiceList })));
const SupplierInvoiceShow = loadable(() => import('./pages/finance/supplier-invoices/show').then((m) => ({ default: m.SupplierInvoiceShow })));
const SupplierInvoiceCreate = loadable(() => import('./pages/finance/supplier-invoices/create').then((m) => ({ default: m.SupplierInvoiceCreate })));
const SupplierInvoiceEdit = loadable(() => import('./pages/finance/supplier-invoices/edit').then((m) => ({ default: m.SupplierInvoiceEdit })));
const AccountSubjectList = loadable(() => import('./pages/finance/account-subjects/list').then((m) => ({ default: m.AccountSubjectList })));
const AccountSubjectShow = loadable(() => import('./pages/finance/account-subjects/show').then((m) => ({ default: m.AccountSubjectShow })));
const AccountSubjectCreate = loadable(() => import('./pages/finance/account-subjects/create').then((m) => ({ default: m.AccountSubjectCreate })));
const AccountSubjectEdit = loadable(() => import('./pages/finance/account-subjects/edit').then((m) => ({ default: m.AccountSubjectEdit })));
const CostCenterList = loadable(() => import('./pages/finance/cost-centers/list').then((m) => ({ default: m.CostCenterList })));
const CostCenterShow = loadable(() => import('./pages/finance/cost-centers/show').then((m) => ({ default: m.CostCenterShow })));
const CostCenterCreate = loadable(() => import('./pages/finance/cost-centers/create').then((m) => ({ default: m.CostCenterCreate })));
const CostCenterEdit = loadable(() => import('./pages/finance/cost-centers/edit').then((m) => ({ default: m.CostCenterEdit })));
const VoucherList = loadable(() => import('./pages/finance/vouchers/list').then((m) => ({ default: m.VoucherList })));
const VoucherShow = loadable(() => import('./pages/finance/vouchers/show').then((m) => ({ default: m.VoucherShow })));
const VoucherCreate = loadable(() => import('./pages/finance/vouchers/create').then((m) => ({ default: m.VoucherCreate })));
const VoucherEdit = loadable(() => import('./pages/finance/vouchers/edit').then((m) => ({ default: m.VoucherEdit })));
const BudgetList = loadable(() => import('./pages/finance/budgets/list').then((m) => ({ default: m.BudgetList })));
const BudgetShow = loadable(() => import('./pages/finance/budgets/show').then((m) => ({ default: m.BudgetShow })));
const BudgetCreate = loadable(() => import('./pages/finance/budgets/create').then((m) => ({ default: m.BudgetCreate })));
const BudgetEdit = loadable(() => import('./pages/finance/budgets/edit').then((m) => ({ default: m.BudgetEdit })));
const PaymentRecordList = loadable(() => import('./pages/finance/payment-records/list').then((m) => ({ default: m.PaymentRecordList })));
const PaymentRecordShow = loadable(() => import('./pages/finance/payment-records/show').then((m) => ({ default: m.PaymentRecordShow })));

// ── Fixed Assets ──
const FixedAssetList = loadable(() => import('./pages/assets/fixed-assets/list').then((m) => ({ default: m.FixedAssetList })));
const FixedAssetShow = loadable(() => import('./pages/assets/fixed-assets/show').then((m) => ({ default: m.FixedAssetShow })));
const FixedAssetCreate = loadable(() => import('./pages/assets/fixed-assets/create').then((m) => ({ default: m.FixedAssetCreate })));
const FixedAssetEdit = loadable(() => import('./pages/assets/fixed-assets/edit').then((m) => ({ default: m.FixedAssetEdit })));
const AssetDepreciationList = loadable(() => import('./pages/assets/asset-depreciations/list').then((m) => ({ default: m.AssetDepreciationList })));
const AssetDepreciationShow = loadable(() => import('./pages/assets/asset-depreciations/show').then((m) => ({ default: m.AssetDepreciationShow })));
const AssetMaintenanceList = loadable(() => import('./pages/assets/asset-maintenance/list').then((m) => ({ default: m.AssetMaintenanceList })));
const AssetMaintenanceShow = loadable(() => import('./pages/assets/asset-maintenance/show').then((m) => ({ default: m.AssetMaintenanceShow })));
const AssetMaintenanceCreate = loadable(() => import('./pages/assets/asset-maintenance/create').then((m) => ({ default: m.AssetMaintenanceCreate })));

// ── Contracts ──
const ContractList = loadable(() => import('./pages/contracts/contracts/list').then((m) => ({ default: m.ContractList })));
const ContractShow = loadable(() => import('./pages/contracts/contracts/show').then((m) => ({ default: m.ContractShow })));
const ContractCreate = loadable(() => import('./pages/contracts/contracts/create').then((m) => ({ default: m.ContractCreate })));
const ContractEdit = loadable(() => import('./pages/contracts/contracts/edit').then((m) => ({ default: m.ContractEdit })));

// ── HR ──
const DepartmentList = loadable(() => import('./pages/hr/departments/list').then((m) => ({ default: m.DepartmentList })));
const DepartmentShow = loadable(() => import('./pages/hr/departments/show').then((m) => ({ default: m.DepartmentShow })));
const DepartmentCreate = loadable(() => import('./pages/hr/departments/create').then((m) => ({ default: m.DepartmentCreate })));
const DepartmentEdit = loadable(() => import('./pages/hr/departments/edit').then((m) => ({ default: m.DepartmentEdit })));
const EmployeeList = loadable(() => import('./pages/hr/employees/list').then((m) => ({ default: m.EmployeeList })));
const EmployeeShow = loadable(() => import('./pages/hr/employees/show').then((m) => ({ default: m.EmployeeShow })));
const EmployeeCreate = loadable(() => import('./pages/hr/employees/create').then((m) => ({ default: m.EmployeeCreate })));
const EmployeeEdit = loadable(() => import('./pages/hr/employees/edit').then((m) => ({ default: m.EmployeeEdit })));
const ExchangeRateList = loadable(() => import('./pages/hr/exchange-rates/list').then((m) => ({ default: m.ExchangeRateList })));
const ExchangeRateShow = loadable(() => import('./pages/hr/exchange-rates/show').then((m) => ({ default: m.ExchangeRateShow })));
const ExchangeRateCreate = loadable(() => import('./pages/hr/exchange-rates/create').then((m) => ({ default: m.ExchangeRateCreate })));
const ExchangeRateEdit = loadable(() => import('./pages/hr/exchange-rates/edit').then((m) => ({ default: m.ExchangeRateEdit })));

// ── Master Data ──
const ProductList = loadable(() => import('./pages/master-data/products/list').then((m) => ({ default: m.ProductList })));
const ProductShow = loadable(() => import('./pages/master-data/products/show').then((m) => ({ default: m.ProductShow })));
const ProductCreate = loadable(() => import('./pages/master-data/products/create').then((m) => ({ default: m.ProductCreate })));
const ProductEdit = loadable(() => import('./pages/master-data/products/edit').then((m) => ({ default: m.ProductEdit })));
const CarrierList = loadable(() => import('./pages/master-data/carriers/list').then((m) => ({ default: m.CarrierList })));
const CarrierShow = loadable(() => import('./pages/master-data/carriers/show').then((m) => ({ default: m.CarrierShow })));
const CarrierCreate = loadable(() => import('./pages/master-data/carriers/create').then((m) => ({ default: m.CarrierCreate })));
const CarrierEdit = loadable(() => import('./pages/master-data/carriers/edit').then((m) => ({ default: m.CarrierEdit })));
const ProductCategoryList = loadable(() => import('./pages/master-data/product-categories/list').then((m) => ({ default: m.ProductCategoryList })));
const ProductCategoryShow = loadable(() => import('./pages/master-data/product-categories/show').then((m) => ({ default: m.ProductCategoryShow })));
const ProductCategoryCreate = loadable(() => import('./pages/master-data/product-categories/create').then((m) => ({ default: m.ProductCategoryCreate })));
const ProductCategoryEdit = loadable(() => import('./pages/master-data/product-categories/edit').then((m) => ({ default: m.ProductCategoryEdit })));
const StorageLocationList = loadable(() => import('./pages/master-data/storage-locations/list').then((m) => ({ default: m.StorageLocationList })));
const StorageLocationShow = loadable(() => import('./pages/master-data/storage-locations/show').then((m) => ({ default: m.StorageLocationShow })));
const StorageLocationCreate = loadable(() => import('./pages/master-data/storage-locations/create').then((m) => ({ default: m.StorageLocationCreate })));
const StorageLocationEdit = loadable(() => import('./pages/master-data/storage-locations/edit').then((m) => ({ default: m.StorageLocationEdit })));
const PriceListList = loadable(() => import('./pages/master-data/price-lists/list').then((m) => ({ default: m.PriceListList })));
const PriceListShow = loadable(() => import('./pages/master-data/price-lists/show').then((m) => ({ default: m.PriceListShow })));
const PriceListCreate = loadable(() => import('./pages/master-data/price-lists/create').then((m) => ({ default: m.PriceListCreate })));
const PriceListEdit = loadable(() => import('./pages/master-data/price-lists/edit').then((m) => ({ default: m.PriceListEdit })));
const CurrencyList = loadable(() => import('./pages/master-data/currencies/list').then((m) => ({ default: m.CurrencyList })));
const CurrencyShow = loadable(() => import('./pages/master-data/currencies/show').then((m) => ({ default: m.CurrencyShow })));
const UomList = loadable(() => import('./pages/master-data/uoms/list').then((m) => ({ default: m.UomList })));
const UomShow = loadable(() => import('./pages/master-data/uoms/show').then((m) => ({ default: m.UomShow })));
const OrganizationCurrencyList = loadable(() => import('./pages/master-data/organization-currencies/list').then((m) => ({ default: m.OrganizationCurrencyList })));
const OrganizationCurrencyShow = loadable(() => import('./pages/master-data/organization-currencies/show').then((m) => ({ default: m.OrganizationCurrencyShow })));
const OrganizationCurrencyCreate = loadable(() => import('./pages/master-data/organization-currencies/create').then((m) => ({ default: m.OrganizationCurrencyCreate })));
const OrganizationUomList = loadable(() => import('./pages/master-data/organization-uoms/list').then((m) => ({ default: m.OrganizationUomList })));
const OrganizationUomShow = loadable(() => import('./pages/master-data/organization-uoms/show').then((m) => ({ default: m.OrganizationUomShow })));
const OrganizationUomCreate = loadable(() => import('./pages/master-data/organization-uoms/create').then((m) => ({ default: m.OrganizationUomCreate })));
const ProductCostHistoryList = loadable(() => import('./pages/master-data/product-cost-history/list').then((m) => ({ default: m.ProductCostHistoryList })));
const ProductCostHistoryShow = loadable(() => import('./pages/master-data/product-cost-history/show').then((m) => ({ default: m.ProductCostHistoryShow })));

// ── System ──
const NotificationList = loadable(() => import('./pages/system/notifications/list').then((m) => ({ default: m.NotificationList })));
const NotificationShow = loadable(() => import('./pages/system/notifications/show').then((m) => ({ default: m.NotificationShow })));
const DocumentAttachmentList = loadable(() => import('./pages/system/document-attachments/list').then((m) => ({ default: m.DocumentAttachmentList })));
const DocumentAttachmentShow = loadable(() => import('./pages/system/document-attachments/show').then((m) => ({ default: m.DocumentAttachmentShow })));
const DocumentAttachmentCreate = loadable(() => import('./pages/system/document-attachments/create').then((m) => ({ default: m.DocumentAttachmentCreate })));
const DocumentAttachmentEdit = loadable(() => import('./pages/system/document-attachments/edit').then((m) => ({ default: m.DocumentAttachmentEdit })));
const DocumentRelationList = loadable(() => import('./pages/system/document-relations/list').then((m) => ({ default: m.DocumentRelationList })));
const DocumentRelationShow = loadable(() => import('./pages/system/document-relations/show').then((m) => ({ default: m.DocumentRelationShow })));
const DocumentRelationCreate = loadable(() => import('./pages/system/document-relations/create').then((m) => ({ default: m.DocumentRelationCreate })));
const DocumentRelationEdit = loadable(() => import('./pages/system/document-relations/edit').then((m) => ({ default: m.DocumentRelationEdit })));
const WorkflowList = loadable(() => import('./pages/system/workflows/list').then((m) => ({ default: m.WorkflowList })));
const WorkflowShow = loadable(() => import('./pages/system/workflows/show').then((m) => ({ default: m.WorkflowShow })));
const ApprovalRuleList = loadable(() => import('./pages/system/approval-rules/list').then((m) => ({ default: m.ApprovalRuleList })));
const ApprovalRuleShow = loadable(() => import('./pages/system/approval-rules/show').then((m) => ({ default: m.ApprovalRuleShow })));
const ApprovalRuleCreate = loadable(() => import('./pages/system/approval-rules/create').then((m) => ({ default: m.ApprovalRuleCreate })));
const ApprovalRuleEdit = loadable(() => import('./pages/system/approval-rules/edit').then((m) => ({ default: m.ApprovalRuleEdit })));
const ApprovalRecordList = loadable(() => import('./pages/system/approval-records/list').then((m) => ({ default: m.ApprovalRecordList })));
const ApprovalRecordShow = loadable(() => import('./pages/system/approval-records/show').then((m) => ({ default: m.ApprovalRecordShow })));
const RoleList = loadable(() => import('./pages/system/roles/list').then((m) => ({ default: m.RoleList })));
const RoleShow = loadable(() => import('./pages/system/roles/show').then((m) => ({ default: m.RoleShow })));
const RoleCreate = loadable(() => import('./pages/system/roles/create').then((m) => ({ default: m.RoleCreate })));
const RoleEdit = loadable(() => import('./pages/system/roles/edit').then((m) => ({ default: m.RoleEdit })));
const UserRoleList = loadable(() => import('./pages/system/user-roles/list').then((m) => ({ default: m.UserRoleList })));
const UserRoleShow = loadable(() => import('./pages/system/user-roles/show').then((m) => ({ default: m.UserRoleShow })));
const UserRoleCreate = loadable(() => import('./pages/system/user-roles/create').then((m) => ({ default: m.UserRoleCreate })));
const UserRoleEdit = loadable(() => import('./pages/system/user-roles/edit').then((m) => ({ default: m.UserRoleEdit })));
const NumberSequenceList = loadable(() => import('./pages/system/number-sequences/list').then((m) => ({ default: m.NumberSequenceList })));
const NumberSequenceShow = loadable(() => import('./pages/system/number-sequences/show').then((m) => ({ default: m.NumberSequenceShow })));
const NumberSequenceEdit = loadable(() => import('./pages/system/number-sequences/edit').then((m) => ({ default: m.NumberSequenceEdit })));
const OrganizationList = loadable(() => import('./pages/system/organizations/list').then((m) => ({ default: m.OrganizationList })));
const OrganizationShow = loadable(() => import('./pages/system/organizations/show').then((m) => ({ default: m.OrganizationShow })));
const OrganizationCreate = loadable(() => import('./pages/system/organizations/create').then((m) => ({ default: m.OrganizationCreate })));
const OrganizationEdit = loadable(() => import('./pages/system/organizations/edit').then((m) => ({ default: m.OrganizationEdit })));
const PortalUserList = loadable(() => import('./pages/system/portal-users/list').then((m) => ({ default: m.PortalUserList })));
const PortalUserShow = loadable(() => import('./pages/system/portal-users/show').then((m) => ({ default: m.PortalUserShow })));

// ── Audit ──
const TokenUsageList = loadable(() => import('./pages/audit/token-usage/list').then((m) => ({ default: m.TokenUsageList })));
const TokenUsageShow = loadable(() => import('./pages/audit/token-usage/show').then((m) => ({ default: m.TokenUsageShow })));
const ToolCallMetricList = loadable(() => import('./pages/audit/tool-call-metrics/list').then((m) => ({ default: m.ToolCallMetricList })));
const ToolCallMetricShow = loadable(() => import('./pages/audit/tool-call-metrics/show').then((m) => ({ default: m.ToolCallMetricShow })));
const AgentSessionList = loadable(() => import('./pages/audit/agent-sessions/list').then((m) => ({ default: m.AgentSessionList })));
const AgentSessionShow = loadable(() => import('./pages/audit/agent-sessions/show').then((m) => ({ default: m.AgentSessionShow })));
const AgentDecisionList = loadable(() => import('./pages/audit/agent-decisions/list').then((m) => ({ default: m.AgentDecisionList })));
const AgentDecisionShow = loadable(() => import('./pages/audit/agent-decisions/show').then((m) => ({ default: m.AgentDecisionShow })));
const BusinessEventList = loadable(() => import('./pages/audit/business-events/list').then((m) => ({ default: m.BusinessEventList })));
const BusinessEventShow = loadable(() => import('./pages/audit/business-events/show').then((m) => ({ default: m.BusinessEventShow })));
const AuthEventList = loadable(() => import('./pages/audit/auth-events/list').then((m) => ({ default: m.AuthEventList })));
const AuthEventShow = loadable(() => import('./pages/audit/auth-events/show').then((m) => ({ default: m.AuthEventShow })));
const ImportLogList = loadable(() => import('./pages/audit/import-logs/list').then((m) => ({ default: m.ImportLogList })));
const ImportLogShow = loadable(() => import('./pages/audit/import-logs/show').then((m) => ({ default: m.ImportLogShow })));
const FailedLoginAttemptList = loadable(() => import('./pages/audit/failed-login-attempts/list').then((m) => ({ default: m.FailedLoginAttemptList })));
const FailedLoginAttemptShow = loadable(() => import('./pages/audit/failed-login-attempts/show').then((m) => ({ default: m.FailedLoginAttemptShow })));

// Icons
import {
  ShoppingCartOutlined, ShopOutlined, InboxOutlined, AppstoreOutlined,
  TeamOutlined, UserOutlined, CarOutlined, RollbackOutlined,
  FileTextOutlined, DollarOutlined, BankOutlined, HomeOutlined,
  FileDoneOutlined, BellOutlined,
  FileSearchOutlined, SendOutlined, ProfileOutlined,
  WalletOutlined,
  CalculatorOutlined, ContainerOutlined, BarcodeOutlined, SwapOutlined,
  ToolOutlined, SettingOutlined, BarChartOutlined,
  UnorderedListOutlined, CheckSquareOutlined, ExperimentOutlined,
  FundOutlined, PieChartOutlined, AuditOutlined, AccountBookOutlined, MoneyCollectOutlined,
  GoldOutlined, ScheduleOutlined,
  FileProtectOutlined,
  SolutionOutlined, IdcardOutlined,
  TagsOutlined, EnvironmentOutlined, DatabaseOutlined, DollarCircleOutlined, ColumnWidthOutlined,
  LockOutlined, SafetyOutlined, LinkOutlined, PaperClipOutlined, NodeIndexOutlined, PartitionOutlined, FormOutlined,
  TruckOutlined, ReconciliationOutlined, CrownOutlined, KeyOutlined, OrderedListOutlined,
  DashboardOutlined, ThunderboltOutlined, RobotOutlined, AlertOutlined, LoginOutlined, ImportOutlined,
  StopOutlined, UserSwitchOutlined, HistoryOutlined,
} from '@ant-design/icons';

const antdLocaleMap: Record<string, Locale> = { en: enUS, 'zh-CN': zhCN };

const App: React.FC = () => {
  const [antdLocale, setAntdLocale] = useState<Locale>(
    antdLocaleMap[i18n.language] ?? enUS
  );

  useEffect(() => {
    const handler = (lang: string) => setAntdLocale(antdLocaleMap[lang] ?? enUS);
    i18n.on('languageChanged', handler);
    return () => i18n.off('languageChanged', handler);
  }, []);

  return (
    <BrowserRouter>
      <ConfigProvider theme={erpTheme} locale={antdLocale}>
        <AntApp>
          <Refine
            dataProvider={dataProvider}
            authProvider={authProvider}
            i18nProvider={i18nProvider}
            routerProvider={routerBindings}
            resources={[
              // ── Procurement ──
              { name: 'procurement' },
              {
                name: 'purchase-orders',
                list: '/procurement/purchase-orders',
                show: '/procurement/purchase-orders/:id',
                edit: '/procurement/purchase-orders/:id/edit',
                create: '/procurement/purchase-orders/create',
                meta: { parent: 'procurement', icon: <ShoppingCartOutlined /> },
              },
              {
                name: 'purchase-receipts',
                list: '/procurement/purchase-receipts',
                show: '/procurement/purchase-receipts/:id',
                edit: '/procurement/purchase-receipts/:id/edit',
                create: '/procurement/purchase-receipts/create',
                meta: { parent: 'procurement', icon: <FileDoneOutlined /> },
              },
              {
                name: 'suppliers',
                list: '/procurement/suppliers',
                show: '/procurement/suppliers/:id',
                edit: '/procurement/suppliers/:id/edit',
                create: '/procurement/suppliers/create',
                meta: { parent: 'procurement', icon: <TeamOutlined /> },
              },
              {
                name: 'purchase-requisitions',
                list: '/procurement/purchase-requisitions',
                show: '/procurement/purchase-requisitions/:id',
                edit: '/procurement/purchase-requisitions/:id/edit',
                create: '/procurement/purchase-requisitions/create',
                meta: { parent: 'procurement', icon: <FileSearchOutlined /> },
              },
              {
                name: 'rfq-headers',
                list: '/procurement/rfq-headers',
                show: '/procurement/rfq-headers/:id',
                edit: '/procurement/rfq-headers/:id/edit',
                create: '/procurement/rfq-headers/create',
                meta: { parent: 'procurement', icon: <SendOutlined /> },
              },
              {
                name: 'supplier-quotations',
                list: '/procurement/supplier-quotations',
                show: '/procurement/supplier-quotations/:id',
                edit: '/procurement/supplier-quotations/:id/edit',
                create: '/procurement/supplier-quotations/create',
                meta: { parent: 'procurement', icon: <ProfileOutlined /> },
              },
              {
                name: 'profile-change-requests',
                list: '/procurement/profile-change-requests',
                show: '/procurement/profile-change-requests/:id',
                edit: '/procurement/profile-change-requests/:id/edit',
                create: '/procurement/profile-change-requests/create',
                meta: { parent: 'procurement', icon: <FormOutlined /> },
              },
              {
                name: 'advance-shipment-notices',
                list: '/procurement/advance-shipment-notices',
                show: '/procurement/advance-shipment-notices/:id',
                edit: '/procurement/advance-shipment-notices/:id/edit',
                create: '/procurement/advance-shipment-notices/create',
                meta: { parent: 'procurement', icon: <TruckOutlined /> },
              },
              {
                name: 'reconciliation-statements',
                list: '/procurement/reconciliation-statements',
                show: '/procurement/reconciliation-statements/:id',
                edit: '/procurement/reconciliation-statements/:id/edit',
                create: '/procurement/reconciliation-statements/create',
                meta: { parent: 'procurement', icon: <ReconciliationOutlined /> },
              },
              {
                name: 'three-way-match',
                list: '/procurement/three-way-match',
                show: '/procurement/three-way-match/:id',
                meta: { parent: 'procurement', icon: <ReconciliationOutlined /> },
              },
              // ── Sales ──
              { name: 'sales' },
              {
                name: 'sales-orders',
                list: '/sales/sales-orders',
                show: '/sales/sales-orders/:id',
                edit: '/sales/sales-orders/:id/edit',
                create: '/sales/sales-orders/create',
                meta: { parent: 'sales', icon: <ShopOutlined /> },
              },
              {
                name: 'sales-shipments',
                list: '/sales/sales-shipments',
                show: '/sales/sales-shipments/:id',
                edit: '/sales/sales-shipments/:id/edit',
                create: '/sales/sales-shipments/create',
                meta: { parent: 'sales', icon: <CarOutlined /> },
              },
              {
                name: 'sales-returns',
                list: '/sales/sales-returns',
                show: '/sales/sales-returns/:id',
                edit: '/sales/sales-returns/:id/edit',
                create: '/sales/sales-returns/create',
                meta: { parent: 'sales', icon: <RollbackOutlined /> },
              },
              {
                name: 'customers',
                list: '/sales/customers',
                show: '/sales/customers/:id',
                edit: '/sales/customers/:id/edit',
                create: '/sales/customers/create',
                meta: { parent: 'sales', icon: <UserOutlined /> },
              },
              {
                name: 'customer-receipts',
                list: '/sales/customer-receipts',
                show: '/sales/customer-receipts/:id',
                edit: '/sales/customer-receipts/:id/edit',
                create: '/sales/customer-receipts/create',
                meta: { parent: 'sales', icon: <WalletOutlined /> },
              },
              // ── Inventory ──
              { name: 'inventory' },
              {
                name: 'stock-records',
                list: '/inventory/stock-records',
                meta: { parent: 'inventory', icon: <InboxOutlined /> },
              },
              {
                name: 'warehouses',
                list: '/inventory/warehouses',
                show: '/inventory/warehouses/:id',
                edit: '/inventory/warehouses/:id/edit',
                create: '/inventory/warehouses/create',
                meta: { parent: 'inventory', icon: <HomeOutlined /> },
              },
              {
                name: 'inventory-counts',
                list: '/inventory/inventory-counts',
                show: '/inventory/inventory-counts/:id',
                edit: '/inventory/inventory-counts/:id/edit',
                create: '/inventory/inventory-counts/create',
                meta: { parent: 'inventory', icon: <CalculatorOutlined /> },
              },
              {
                name: 'inventory-lots',
                list: '/inventory/inventory-lots',
                show: '/inventory/inventory-lots/:id',
                edit: '/inventory/inventory-lots/:id/edit',
                create: '/inventory/inventory-lots/create',
                meta: { parent: 'inventory', icon: <ContainerOutlined /> },
              },
              {
                name: 'serial-numbers',
                list: '/inventory/serial-numbers',
                show: '/inventory/serial-numbers/:id',
                edit: '/inventory/serial-numbers/:id/edit',
                create: '/inventory/serial-numbers/create',
                meta: { parent: 'inventory', icon: <BarcodeOutlined /> },
              },
              {
                name: 'stock-transactions',
                list: '/inventory/stock-transactions',
                show: '/inventory/stock-transactions/:id',
                meta: { parent: 'inventory', icon: <SwapOutlined /> },
              },
              {
                name: 'inventory-reservations',
                list: '/inventory/inventory-reservations',
                show: '/inventory/inventory-reservations/:id',
                edit: '/inventory/inventory-reservations/:id/edit',
                create: '/inventory/inventory-reservations/create',
                meta: { parent: 'inventory', icon: <LockOutlined /> },
              },
              // ── Manufacturing ──
              { name: 'manufacturing' },
              {
                name: 'bom-headers',
                list: '/manufacturing/bom-headers',
                show: '/manufacturing/bom-headers/:id',
                edit: '/manufacturing/bom-headers/:id/edit',
                create: '/manufacturing/bom-headers/create',
                meta: { parent: 'manufacturing', icon: <ToolOutlined /> },
              },
              {
                name: 'work-orders',
                list: '/manufacturing/work-orders',
                show: '/manufacturing/work-orders/:id',
                edit: '/manufacturing/work-orders/:id/edit',
                create: '/manufacturing/work-orders/create',
                meta: { parent: 'manufacturing', icon: <SettingOutlined /> },
              },
              {
                name: 'work-order-productions',
                list: '/manufacturing/work-order-productions',
                show: '/manufacturing/work-order-productions/:id',
                create: '/manufacturing/work-order-productions/create',
                meta: { parent: 'manufacturing', icon: <BarChartOutlined /> },
              },
              // ── Quality ──
              { name: 'quality' },
              {
                name: 'defect-codes',
                list: '/quality/defect-codes',
                show: '/quality/defect-codes/:id',
                edit: '/quality/defect-codes/:id/edit',
                create: '/quality/defect-codes/create',
                meta: { parent: 'quality', icon: <UnorderedListOutlined /> },
              },
              {
                name: 'quality-standards',
                list: '/quality/quality-standards',
                show: '/quality/quality-standards/:id',
                edit: '/quality/quality-standards/:id/edit',
                create: '/quality/quality-standards/create',
                meta: { parent: 'quality', icon: <CheckSquareOutlined /> },
              },
              {
                name: 'quality-inspections',
                list: '/quality/quality-inspections',
                show: '/quality/quality-inspections/:id',
                edit: '/quality/quality-inspections/:id/edit',
                create: '/quality/quality-inspections/create',
                meta: { parent: 'quality', icon: <ExperimentOutlined /> },
              },
              // ── Finance ──
              { name: 'finance' },
              {
                name: 'payment-requests',
                list: '/finance/payment-requests',
                show: '/finance/payment-requests/:id',
                edit: '/finance/payment-requests/:id/edit',
                create: '/finance/payment-requests/create',
                meta: { parent: 'finance', icon: <DollarOutlined /> },
              },
              {
                name: 'sales-invoices',
                list: '/finance/sales-invoices',
                show: '/finance/sales-invoices/:id',
                edit: '/finance/sales-invoices/:id/edit',
                create: '/finance/sales-invoices/create',
                meta: { parent: 'finance', icon: <FileTextOutlined /> },
              },
              {
                name: 'supplier-invoices',
                list: '/finance/supplier-invoices',
                show: '/finance/supplier-invoices/:id',
                edit: '/finance/supplier-invoices/:id/edit',
                create: '/finance/supplier-invoices/create',
                meta: { parent: 'finance', icon: <BankOutlined /> },
              },
              {
                name: 'account-subjects',
                list: '/finance/account-subjects',
                show: '/finance/account-subjects/:id',
                edit: '/finance/account-subjects/:id/edit',
                create: '/finance/account-subjects/create',
                meta: { parent: 'finance', icon: <FundOutlined /> },
              },
              {
                name: 'cost-centers',
                list: '/finance/cost-centers',
                show: '/finance/cost-centers/:id',
                edit: '/finance/cost-centers/:id/edit',
                create: '/finance/cost-centers/create',
                meta: { parent: 'finance', icon: <PieChartOutlined /> },
              },
              {
                name: 'vouchers',
                list: '/finance/vouchers',
                show: '/finance/vouchers/:id',
                edit: '/finance/vouchers/:id/edit',
                create: '/finance/vouchers/create',
                meta: { parent: 'finance', icon: <AuditOutlined /> },
              },
              {
                name: 'budgets',
                list: '/finance/budgets',
                show: '/finance/budgets/:id',
                edit: '/finance/budgets/:id/edit',
                create: '/finance/budgets/create',
                meta: { parent: 'finance', icon: <AccountBookOutlined /> },
              },
              {
                name: 'payment-records',
                list: '/finance/payment-records',
                show: '/finance/payment-records/:id',
                meta: { parent: 'finance', icon: <MoneyCollectOutlined /> },
              },
              // ── Fixed Assets ──
              { name: 'fixedAssets' },
              {
                name: 'fixed-assets',
                list: '/assets/fixed-assets',
                show: '/assets/fixed-assets/:id',
                edit: '/assets/fixed-assets/:id/edit',
                create: '/assets/fixed-assets/create',
                meta: { parent: 'fixedAssets', icon: <GoldOutlined /> },
              },
              {
                name: 'asset-depreciations',
                list: '/assets/asset-depreciations',
                show: '/assets/asset-depreciations/:id',
                meta: { parent: 'fixedAssets', icon: <ScheduleOutlined /> },
              },
              {
                name: 'asset-maintenance',
                list: '/assets/asset-maintenance',
                show: '/assets/asset-maintenance/:id',
                create: '/assets/asset-maintenance/create',
                meta: { parent: 'fixedAssets', icon: <SettingOutlined /> },
              },
              // ── Contracts ──
              { name: 'contractMgmt' },
              {
                name: 'contracts',
                list: '/contracts/contracts',
                show: '/contracts/contracts/:id',
                edit: '/contracts/contracts/:id/edit',
                create: '/contracts/contracts/create',
                meta: { parent: 'contractMgmt', icon: <FileProtectOutlined /> },
              },
              // ── HR ──
              { name: 'hr' },
              {
                name: 'departments',
                list: '/hr/departments',
                show: '/hr/departments/:id',
                edit: '/hr/departments/:id/edit',
                create: '/hr/departments/create',
                meta: { parent: 'hr', icon: <SolutionOutlined /> },
              },
              {
                name: 'employees',
                list: '/hr/employees',
                show: '/hr/employees/:id',
                edit: '/hr/employees/:id/edit',
                create: '/hr/employees/create',
                meta: { parent: 'hr', icon: <IdcardOutlined /> },
              },
              {
                name: 'exchange-rates',
                list: '/hr/exchange-rates',
                show: '/hr/exchange-rates/:id',
                edit: '/hr/exchange-rates/:id/edit',
                create: '/hr/exchange-rates/create',
                meta: { parent: 'hr', icon: <SwapOutlined /> },
              },
              // ── Master Data ──
              { name: 'masterData' },
              {
                name: 'products',
                list: '/master-data/products',
                show: '/master-data/products/:id',
                edit: '/master-data/products/:id/edit',
                create: '/master-data/products/create',
                meta: { parent: 'masterData', icon: <AppstoreOutlined /> },
              },
              {
                name: 'carriers',
                list: '/master-data/carriers',
                show: '/master-data/carriers/:id',
                edit: '/master-data/carriers/:id/edit',
                create: '/master-data/carriers/create',
                meta: { parent: 'masterData', icon: <CarOutlined /> },
              },
              {
                name: 'product-categories',
                list: '/master-data/product-categories',
                show: '/master-data/product-categories/:id',
                edit: '/master-data/product-categories/:id/edit',
                create: '/master-data/product-categories/create',
                meta: { parent: 'masterData', icon: <TagsOutlined /> },
              },
              {
                name: 'storage-locations',
                list: '/master-data/storage-locations',
                show: '/master-data/storage-locations/:id',
                edit: '/master-data/storage-locations/:id/edit',
                create: '/master-data/storage-locations/create',
                meta: { parent: 'masterData', icon: <EnvironmentOutlined /> },
              },
              {
                name: 'price-lists',
                list: '/master-data/price-lists',
                show: '/master-data/price-lists/:id',
                edit: '/master-data/price-lists/:id/edit',
                create: '/master-data/price-lists/create',
                meta: { parent: 'masterData', icon: <DatabaseOutlined /> },
              },
              {
                name: 'currencies',
                list: '/master-data/currencies',
                show: '/master-data/currencies/:id',
                meta: { parent: 'masterData', icon: <DollarCircleOutlined /> },
              },
              {
                name: 'uoms',
                list: '/master-data/uoms',
                show: '/master-data/uoms/:id',
                meta: { parent: 'masterData', icon: <ColumnWidthOutlined /> },
              },
              {
                name: 'organization-currencies',
                list: '/master-data/organization-currencies',
                show: '/master-data/organization-currencies/:id',
                create: '/master-data/organization-currencies/create',
                meta: { parent: 'masterData', icon: <DollarCircleOutlined /> },
              },
              {
                name: 'organization-uoms',
                list: '/master-data/organization-uoms',
                show: '/master-data/organization-uoms/:id',
                create: '/master-data/organization-uoms/create',
                meta: { parent: 'masterData', icon: <ColumnWidthOutlined /> },
              },
              {
                name: 'product-cost-history',
                list: '/master-data/product-cost-history',
                show: '/master-data/product-cost-history/:id',
                meta: { parent: 'masterData', icon: <HistoryOutlined /> },
              },
              // ── System ──
              { name: 'system' },
              {
                name: 'notifications',
                list: '/system/notifications',
                show: '/system/notifications/:id',
                meta: { parent: 'system', icon: <BellOutlined /> },
              },
              {
                name: 'document-attachments',
                list: '/system/document-attachments',
                show: '/system/document-attachments/:id',
                edit: '/system/document-attachments/:id/edit',
                create: '/system/document-attachments/create',
                meta: { parent: 'system', icon: <PaperClipOutlined /> },
              },
              {
                name: 'document-relations',
                list: '/system/document-relations',
                show: '/system/document-relations/:id',
                edit: '/system/document-relations/:id/edit',
                create: '/system/document-relations/create',
                meta: { parent: 'system', icon: <LinkOutlined /> },
              },
              {
                name: 'workflows',
                list: '/system/workflows',
                show: '/system/workflows/:id',
                meta: { parent: 'system', icon: <PartitionOutlined /> },
              },
              {
                name: 'approval-rules',
                list: '/system/approval-rules',
                show: '/system/approval-rules/:id',
                edit: '/system/approval-rules/:id/edit',
                create: '/system/approval-rules/create',
                meta: { parent: 'system', icon: <SafetyOutlined /> },
              },
              {
                name: 'approval-records',
                list: '/system/approval-records',
                show: '/system/approval-records/:id',
                meta: { parent: 'system', icon: <NodeIndexOutlined /> },
              },
              {
                name: 'roles',
                list: '/system/roles',
                show: '/system/roles/:id',
                edit: '/system/roles/:id/edit',
                create: '/system/roles/create',
                meta: { parent: 'system', icon: <CrownOutlined /> },
              },
              {
                name: 'user-roles',
                list: '/system/user-roles',
                show: '/system/user-roles/:id',
                edit: '/system/user-roles/:id/edit',
                create: '/system/user-roles/create',
                meta: { parent: 'system', icon: <KeyOutlined /> },
              },
              {
                name: 'number-sequences',
                list: '/system/number-sequences',
                show: '/system/number-sequences/:id',
                edit: '/system/number-sequences/:id/edit',
                meta: { parent: 'system', icon: <OrderedListOutlined /> },
              },
              {
                name: 'organizations',
                list: '/system/organizations',
                show: '/system/organizations/:id',
                edit: '/system/organizations/:id/edit',
                create: '/system/organizations/create',
                meta: { parent: 'system', icon: <BankOutlined /> },
              },
              {
                name: 'portal-users',
                list: '/system/portal-users',
                show: '/system/portal-users/:id',
                meta: { parent: 'system', icon: <UserSwitchOutlined /> },
              },
              // ── Audit ──
              { name: 'audit' },
              {
                name: 'token-usage',
                list: '/audit/token-usage',
                show: '/audit/token-usage/:id',
                meta: { parent: 'audit', icon: <DashboardOutlined /> },
              },
              {
                name: 'tool-call-metrics',
                list: '/audit/tool-call-metrics',
                show: '/audit/tool-call-metrics/:id',
                meta: { parent: 'audit', icon: <ThunderboltOutlined /> },
              },
              {
                name: 'agent-sessions',
                list: '/audit/agent-sessions',
                show: '/audit/agent-sessions/:id',
                meta: { parent: 'audit', icon: <RobotOutlined /> },
              },
              {
                name: 'agent-decisions',
                list: '/audit/agent-decisions',
                show: '/audit/agent-decisions/:id',
                meta: { parent: 'audit', icon: <RobotOutlined /> },
              },
              {
                name: 'business-events',
                list: '/audit/business-events',
                show: '/audit/business-events/:id',
                meta: { parent: 'audit', icon: <AlertOutlined /> },
              },
              {
                name: 'auth-events',
                list: '/audit/auth-events',
                show: '/audit/auth-events/:id',
                meta: { parent: 'audit', icon: <LoginOutlined /> },
              },
              {
                name: 'import-logs',
                list: '/audit/import-logs',
                show: '/audit/import-logs/:id',
                meta: { parent: 'audit', icon: <ImportOutlined /> },
              },
              {
                name: 'failed-login-attempts',
                list: '/audit/failed-login-attempts',
                show: '/audit/failed-login-attempts/:id',
                meta: { parent: 'audit', icon: <StopOutlined /> },
              },
            ]}
            options={{ syncWithLocation: true, warnWhenUnsavedChanges: true }}
          >
            <Routes>
              <Route path="/login" element={<LoginPage />} />

              <Route
                element={
                  <Authenticated key="protected" fallback={<Navigate to="/login" replace />}>
                    <AppLayout>
                      <NavigationProgress>
                        <Outlet />
                      </NavigationProgress>
                    </AppLayout>
                  </Authenticated>
                }
              >
                <Route index element={<WelcomePage />} />

                  {/* Procurement */}
                  <Route path="/procurement/purchase-orders" element={<PurchaseOrderList />} />
                  <Route path="/procurement/purchase-orders/create" element={<PurchaseOrderCreate />} />
                  <Route path="/procurement/purchase-orders/:id" element={<PurchaseOrderShow />} />
                  <Route path="/procurement/purchase-orders/:id/edit" element={<PurchaseOrderEdit />} />
                  <Route path="/procurement/purchase-receipts" element={<PurchaseReceiptList />} />
                  <Route path="/procurement/purchase-receipts/create" element={<PurchaseReceiptCreate />} />
                  <Route path="/procurement/purchase-receipts/:id" element={<PurchaseReceiptShow />} />
                  <Route path="/procurement/purchase-receipts/:id/edit" element={<PurchaseReceiptEdit />} />
                  <Route path="/procurement/suppliers" element={<SupplierList />} />
                  <Route path="/procurement/suppliers/create" element={<SupplierCreate />} />
                  <Route path="/procurement/suppliers/:id" element={<SupplierShow />} />
                  <Route path="/procurement/suppliers/:id/edit" element={<SupplierEdit />} />
                  <Route path="/procurement/purchase-requisitions" element={<PurchaseRequisitionList />} />
                  <Route path="/procurement/purchase-requisitions/create" element={<PurchaseRequisitionCreate />} />
                  <Route path="/procurement/purchase-requisitions/:id" element={<PurchaseRequisitionShow />} />
                  <Route path="/procurement/purchase-requisitions/:id/edit" element={<PurchaseRequisitionEdit />} />
                  <Route path="/procurement/rfq-headers" element={<RfqHeaderList />} />
                  <Route path="/procurement/rfq-headers/create" element={<RfqHeaderCreate />} />
                  <Route path="/procurement/rfq-headers/:id" element={<RfqHeaderShow />} />
                  <Route path="/procurement/rfq-headers/:id/edit" element={<RfqHeaderEdit />} />
                  <Route path="/procurement/supplier-quotations" element={<SupplierQuotationList />} />
                  <Route path="/procurement/supplier-quotations/create" element={<SupplierQuotationCreate />} />
                  <Route path="/procurement/supplier-quotations/:id" element={<SupplierQuotationShow />} />
                  <Route path="/procurement/supplier-quotations/:id/edit" element={<SupplierQuotationEdit />} />
                  <Route path="/procurement/profile-change-requests" element={<ProfileChangeRequestList />} />
                  <Route path="/procurement/profile-change-requests/create" element={<ProfileChangeRequestCreate />} />
                  <Route path="/procurement/profile-change-requests/:id" element={<ProfileChangeRequestShow />} />
                  <Route path="/procurement/profile-change-requests/:id/edit" element={<ProfileChangeRequestEdit />} />
                  <Route path="/procurement/advance-shipment-notices" element={<AdvanceShipmentNoticeList />} />
                  <Route path="/procurement/advance-shipment-notices/create" element={<AdvanceShipmentNoticeCreate />} />
                  <Route path="/procurement/advance-shipment-notices/:id" element={<AdvanceShipmentNoticeShow />} />
                  <Route path="/procurement/advance-shipment-notices/:id/edit" element={<AdvanceShipmentNoticeEdit />} />
                  <Route path="/procurement/reconciliation-statements" element={<ReconciliationStatementList />} />
                  <Route path="/procurement/reconciliation-statements/create" element={<ReconciliationStatementCreate />} />
                  <Route path="/procurement/reconciliation-statements/:id" element={<ReconciliationStatementShow />} />
                  <Route path="/procurement/reconciliation-statements/:id/edit" element={<ReconciliationStatementEdit />} />
                  <Route path="/procurement/three-way-match" element={<ThreeWayMatchList />} />
                  <Route path="/procurement/three-way-match/:id" element={<ThreeWayMatchShow />} />

                  {/* Sales */}
                  <Route path="/sales/sales-orders" element={<SalesOrderList />} />
                  <Route path="/sales/sales-orders/create" element={<SalesOrderCreate />} />
                  <Route path="/sales/sales-orders/:id" element={<SalesOrderShow />} />
                  <Route path="/sales/sales-orders/:id/edit" element={<SalesOrderEdit />} />
                  <Route path="/sales/sales-shipments" element={<SalesShipmentList />} />
                  <Route path="/sales/sales-shipments/create" element={<SalesShipmentCreate />} />
                  <Route path="/sales/sales-shipments/:id" element={<SalesShipmentShow />} />
                  <Route path="/sales/sales-shipments/:id/edit" element={<SalesShipmentEdit />} />
                  <Route path="/sales/sales-returns" element={<SalesReturnList />} />
                  <Route path="/sales/sales-returns/create" element={<SalesReturnCreate />} />
                  <Route path="/sales/sales-returns/:id" element={<SalesReturnShow />} />
                  <Route path="/sales/sales-returns/:id/edit" element={<SalesReturnEdit />} />
                  <Route path="/sales/customers" element={<CustomerList />} />
                  <Route path="/sales/customers/create" element={<CustomerCreate />} />
                  <Route path="/sales/customers/:id" element={<CustomerShow />} />
                  <Route path="/sales/customers/:id/edit" element={<CustomerEdit />} />
                  <Route path="/sales/customer-receipts" element={<CustomerReceiptList />} />
                  <Route path="/sales/customer-receipts/create" element={<CustomerReceiptCreate />} />
                  <Route path="/sales/customer-receipts/:id" element={<CustomerReceiptShow />} />
                  <Route path="/sales/customer-receipts/:id/edit" element={<CustomerReceiptEdit />} />

                  {/* Inventory */}
                  <Route path="/inventory/stock-records" element={<StockRecordList />} />
                  <Route path="/inventory/warehouses" element={<WarehouseList />} />
                  <Route path="/inventory/warehouses/create" element={<WarehouseCreate />} />
                  <Route path="/inventory/warehouses/:id" element={<WarehouseShow />} />
                  <Route path="/inventory/warehouses/:id/edit" element={<WarehouseEdit />} />
                  <Route path="/inventory/inventory-counts" element={<InventoryCountList />} />
                  <Route path="/inventory/inventory-counts/create" element={<InventoryCountCreate />} />
                  <Route path="/inventory/inventory-counts/:id" element={<InventoryCountShow />} />
                  <Route path="/inventory/inventory-counts/:id/edit" element={<InventoryCountEdit />} />
                  <Route path="/inventory/inventory-lots" element={<InventoryLotList />} />
                  <Route path="/inventory/inventory-lots/create" element={<InventoryLotCreate />} />
                  <Route path="/inventory/inventory-lots/:id" element={<InventoryLotShow />} />
                  <Route path="/inventory/inventory-lots/:id/edit" element={<InventoryLotEdit />} />
                  <Route path="/inventory/serial-numbers" element={<SerialNumberList />} />
                  <Route path="/inventory/serial-numbers/create" element={<SerialNumberCreate />} />
                  <Route path="/inventory/serial-numbers/:id" element={<SerialNumberShow />} />
                  <Route path="/inventory/serial-numbers/:id/edit" element={<SerialNumberEdit />} />
                  <Route path="/inventory/stock-transactions" element={<StockTransactionList />} />
                  <Route path="/inventory/stock-transactions/:id" element={<StockTransactionShow />} />
                  <Route path="/inventory/inventory-reservations" element={<InventoryReservationList />} />
                  <Route path="/inventory/inventory-reservations/create" element={<InventoryReservationCreate />} />
                  <Route path="/inventory/inventory-reservations/:id" element={<InventoryReservationShow />} />
                  <Route path="/inventory/inventory-reservations/:id/edit" element={<InventoryReservationEdit />} />

                  {/* Manufacturing */}
                  <Route path="/manufacturing/bom-headers" element={<BomHeaderList />} />
                  <Route path="/manufacturing/bom-headers/create" element={<BomHeaderCreate />} />
                  <Route path="/manufacturing/bom-headers/:id" element={<BomHeaderShow />} />
                  <Route path="/manufacturing/bom-headers/:id/edit" element={<BomHeaderEdit />} />
                  <Route path="/manufacturing/work-orders" element={<WorkOrderList />} />
                  <Route path="/manufacturing/work-orders/create" element={<WorkOrderCreate />} />
                  <Route path="/manufacturing/work-orders/:id" element={<WorkOrderShow />} />
                  <Route path="/manufacturing/work-orders/:id/edit" element={<WorkOrderEdit />} />
                  <Route path="/manufacturing/work-order-productions" element={<WorkOrderProductionList />} />
                  <Route path="/manufacturing/work-order-productions/create" element={<WorkOrderProductionCreate />} />
                  <Route path="/manufacturing/work-order-productions/:id" element={<WorkOrderProductionShow />} />

                  {/* Quality */}
                  <Route path="/quality/defect-codes" element={<DefectCodeList />} />
                  <Route path="/quality/defect-codes/create" element={<DefectCodeCreate />} />
                  <Route path="/quality/defect-codes/:id" element={<DefectCodeShow />} />
                  <Route path="/quality/defect-codes/:id/edit" element={<DefectCodeEdit />} />
                  <Route path="/quality/quality-standards" element={<QualityStandardList />} />
                  <Route path="/quality/quality-standards/create" element={<QualityStandardCreate />} />
                  <Route path="/quality/quality-standards/:id" element={<QualityStandardShow />} />
                  <Route path="/quality/quality-standards/:id/edit" element={<QualityStandardEdit />} />
                  <Route path="/quality/quality-inspections" element={<QualityInspectionList />} />
                  <Route path="/quality/quality-inspections/create" element={<QualityInspectionCreate />} />
                  <Route path="/quality/quality-inspections/:id" element={<QualityInspectionShow />} />
                  <Route path="/quality/quality-inspections/:id/edit" element={<QualityInspectionEdit />} />

                  {/* Finance */}
                  <Route path="/finance/payment-requests" element={<PaymentRequestList />} />
                  <Route path="/finance/payment-requests/create" element={<PaymentRequestCreate />} />
                  <Route path="/finance/payment-requests/:id" element={<PaymentRequestShow />} />
                  <Route path="/finance/payment-requests/:id/edit" element={<PaymentRequestEdit />} />
                  <Route path="/finance/sales-invoices" element={<SalesInvoiceList />} />
                  <Route path="/finance/sales-invoices/create" element={<SalesInvoiceCreate />} />
                  <Route path="/finance/sales-invoices/:id" element={<SalesInvoiceShow />} />
                  <Route path="/finance/sales-invoices/:id/edit" element={<SalesInvoiceEdit />} />
                  <Route path="/finance/supplier-invoices" element={<SupplierInvoiceList />} />
                  <Route path="/finance/supplier-invoices/create" element={<SupplierInvoiceCreate />} />
                  <Route path="/finance/supplier-invoices/:id" element={<SupplierInvoiceShow />} />
                  <Route path="/finance/supplier-invoices/:id/edit" element={<SupplierInvoiceEdit />} />
                  <Route path="/finance/account-subjects" element={<AccountSubjectList />} />
                  <Route path="/finance/account-subjects/create" element={<AccountSubjectCreate />} />
                  <Route path="/finance/account-subjects/:id" element={<AccountSubjectShow />} />
                  <Route path="/finance/account-subjects/:id/edit" element={<AccountSubjectEdit />} />
                  <Route path="/finance/cost-centers" element={<CostCenterList />} />
                  <Route path="/finance/cost-centers/create" element={<CostCenterCreate />} />
                  <Route path="/finance/cost-centers/:id" element={<CostCenterShow />} />
                  <Route path="/finance/cost-centers/:id/edit" element={<CostCenterEdit />} />
                  <Route path="/finance/vouchers" element={<VoucherList />} />
                  <Route path="/finance/vouchers/create" element={<VoucherCreate />} />
                  <Route path="/finance/vouchers/:id" element={<VoucherShow />} />
                  <Route path="/finance/vouchers/:id/edit" element={<VoucherEdit />} />
                  <Route path="/finance/budgets" element={<BudgetList />} />
                  <Route path="/finance/budgets/create" element={<BudgetCreate />} />
                  <Route path="/finance/budgets/:id" element={<BudgetShow />} />
                  <Route path="/finance/budgets/:id/edit" element={<BudgetEdit />} />
                  <Route path="/finance/payment-records" element={<PaymentRecordList />} />
                  <Route path="/finance/payment-records/:id" element={<PaymentRecordShow />} />

                  {/* Fixed Assets */}
                  <Route path="/assets/fixed-assets" element={<FixedAssetList />} />
                  <Route path="/assets/fixed-assets/create" element={<FixedAssetCreate />} />
                  <Route path="/assets/fixed-assets/:id" element={<FixedAssetShow />} />
                  <Route path="/assets/fixed-assets/:id/edit" element={<FixedAssetEdit />} />
                  <Route path="/assets/asset-depreciations" element={<AssetDepreciationList />} />
                  <Route path="/assets/asset-depreciations/:id" element={<AssetDepreciationShow />} />
                  <Route path="/assets/asset-maintenance" element={<AssetMaintenanceList />} />
                  <Route path="/assets/asset-maintenance/create" element={<AssetMaintenanceCreate />} />
                  <Route path="/assets/asset-maintenance/:id" element={<AssetMaintenanceShow />} />

                  {/* Contracts */}
                  <Route path="/contracts/contracts" element={<ContractList />} />
                  <Route path="/contracts/contracts/create" element={<ContractCreate />} />
                  <Route path="/contracts/contracts/:id" element={<ContractShow />} />
                  <Route path="/contracts/contracts/:id/edit" element={<ContractEdit />} />

                  {/* HR */}
                  <Route path="/hr/departments" element={<DepartmentList />} />
                  <Route path="/hr/departments/create" element={<DepartmentCreate />} />
                  <Route path="/hr/departments/:id" element={<DepartmentShow />} />
                  <Route path="/hr/departments/:id/edit" element={<DepartmentEdit />} />
                  <Route path="/hr/employees" element={<EmployeeList />} />
                  <Route path="/hr/employees/create" element={<EmployeeCreate />} />
                  <Route path="/hr/employees/:id" element={<EmployeeShow />} />
                  <Route path="/hr/employees/:id/edit" element={<EmployeeEdit />} />
                  <Route path="/hr/exchange-rates" element={<ExchangeRateList />} />
                  <Route path="/hr/exchange-rates/create" element={<ExchangeRateCreate />} />
                  <Route path="/hr/exchange-rates/:id" element={<ExchangeRateShow />} />
                  <Route path="/hr/exchange-rates/:id/edit" element={<ExchangeRateEdit />} />

                  {/* Master Data */}
                  <Route path="/master-data/products" element={<ProductList />} />
                  <Route path="/master-data/products/create" element={<ProductCreate />} />
                  <Route path="/master-data/products/:id" element={<ProductShow />} />
                  <Route path="/master-data/products/:id/edit" element={<ProductEdit />} />
                  <Route path="/master-data/carriers" element={<CarrierList />} />
                  <Route path="/master-data/carriers/create" element={<CarrierCreate />} />
                  <Route path="/master-data/carriers/:id" element={<CarrierShow />} />
                  <Route path="/master-data/carriers/:id/edit" element={<CarrierEdit />} />
                  <Route path="/master-data/product-categories" element={<ProductCategoryList />} />
                  <Route path="/master-data/product-categories/create" element={<ProductCategoryCreate />} />
                  <Route path="/master-data/product-categories/:id" element={<ProductCategoryShow />} />
                  <Route path="/master-data/product-categories/:id/edit" element={<ProductCategoryEdit />} />
                  <Route path="/master-data/storage-locations" element={<StorageLocationList />} />
                  <Route path="/master-data/storage-locations/create" element={<StorageLocationCreate />} />
                  <Route path="/master-data/storage-locations/:id" element={<StorageLocationShow />} />
                  <Route path="/master-data/storage-locations/:id/edit" element={<StorageLocationEdit />} />
                  <Route path="/master-data/price-lists" element={<PriceListList />} />
                  <Route path="/master-data/price-lists/create" element={<PriceListCreate />} />
                  <Route path="/master-data/price-lists/:id" element={<PriceListShow />} />
                  <Route path="/master-data/price-lists/:id/edit" element={<PriceListEdit />} />
                  <Route path="/master-data/currencies" element={<CurrencyList />} />
                  <Route path="/master-data/currencies/:id" element={<CurrencyShow />} />
                  <Route path="/master-data/uoms" element={<UomList />} />
                  <Route path="/master-data/uoms/:id" element={<UomShow />} />
                  <Route path="/master-data/organization-currencies" element={<OrganizationCurrencyList />} />
                  <Route path="/master-data/organization-currencies/create" element={<OrganizationCurrencyCreate />} />
                  <Route path="/master-data/organization-currencies/:id" element={<OrganizationCurrencyShow />} />
                  <Route path="/master-data/organization-uoms" element={<OrganizationUomList />} />
                  <Route path="/master-data/organization-uoms/create" element={<OrganizationUomCreate />} />
                  <Route path="/master-data/organization-uoms/:id" element={<OrganizationUomShow />} />
                  <Route path="/master-data/product-cost-history" element={<ProductCostHistoryList />} />
                  <Route path="/master-data/product-cost-history/:id" element={<ProductCostHistoryShow />} />

                  {/* System */}
                  <Route path="/system/notifications" element={<NotificationList />} />
                  <Route path="/system/notifications/:id" element={<NotificationShow />} />
                  <Route path="/system/document-attachments" element={<DocumentAttachmentList />} />
                  <Route path="/system/document-attachments/create" element={<DocumentAttachmentCreate />} />
                  <Route path="/system/document-attachments/:id" element={<DocumentAttachmentShow />} />
                  <Route path="/system/document-attachments/:id/edit" element={<DocumentAttachmentEdit />} />
                  <Route path="/system/document-relations" element={<DocumentRelationList />} />
                  <Route path="/system/document-relations/create" element={<DocumentRelationCreate />} />
                  <Route path="/system/document-relations/:id" element={<DocumentRelationShow />} />
                  <Route path="/system/document-relations/:id/edit" element={<DocumentRelationEdit />} />
                  <Route path="/system/workflows" element={<WorkflowList />} />
                  <Route path="/system/workflows/:id" element={<WorkflowShow />} />
                  <Route path="/system/approval-rules" element={<ApprovalRuleList />} />
                  <Route path="/system/approval-rules/create" element={<ApprovalRuleCreate />} />
                  <Route path="/system/approval-rules/:id" element={<ApprovalRuleShow />} />
                  <Route path="/system/approval-rules/:id/edit" element={<ApprovalRuleEdit />} />
                  <Route path="/system/approval-records" element={<ApprovalRecordList />} />
                  <Route path="/system/approval-records/:id" element={<ApprovalRecordShow />} />
                  <Route path="/system/roles" element={<RoleList />} />
                  <Route path="/system/roles/create" element={<RoleCreate />} />
                  <Route path="/system/roles/:id" element={<RoleShow />} />
                  <Route path="/system/roles/:id/edit" element={<RoleEdit />} />
                  <Route path="/system/user-roles" element={<UserRoleList />} />
                  <Route path="/system/user-roles/create" element={<UserRoleCreate />} />
                  <Route path="/system/user-roles/:id" element={<UserRoleShow />} />
                  <Route path="/system/user-roles/:id/edit" element={<UserRoleEdit />} />
                  <Route path="/system/number-sequences" element={<NumberSequenceList />} />
                  <Route path="/system/number-sequences/:id" element={<NumberSequenceShow />} />
                  <Route path="/system/number-sequences/:id/edit" element={<NumberSequenceEdit />} />
                  <Route path="/system/organizations" element={<OrganizationList />} />
                  <Route path="/system/organizations/create" element={<OrganizationCreate />} />
                  <Route path="/system/organizations/:id" element={<OrganizationShow />} />
                  <Route path="/system/organizations/:id/edit" element={<OrganizationEdit />} />
                  <Route path="/system/portal-users" element={<PortalUserList />} />
                  <Route path="/system/portal-users/:id" element={<PortalUserShow />} />

                  {/* Audit */}
                  <Route path="/audit/token-usage" element={<TokenUsageList />} />
                  <Route path="/audit/token-usage/:id" element={<TokenUsageShow />} />
                  <Route path="/audit/tool-call-metrics" element={<ToolCallMetricList />} />
                  <Route path="/audit/tool-call-metrics/:id" element={<ToolCallMetricShow />} />
                  <Route path="/audit/agent-sessions" element={<AgentSessionList />} />
                  <Route path="/audit/agent-sessions/:id" element={<AgentSessionShow />} />
                  <Route path="/audit/agent-decisions" element={<AgentDecisionList />} />
                  <Route path="/audit/agent-decisions/:id" element={<AgentDecisionShow />} />
                  <Route path="/audit/business-events" element={<BusinessEventList />} />
                  <Route path="/audit/business-events/:id" element={<BusinessEventShow />} />
                  <Route path="/audit/auth-events" element={<AuthEventList />} />
                  <Route path="/audit/auth-events/:id" element={<AuthEventShow />} />
                  <Route path="/audit/import-logs" element={<ImportLogList />} />
                  <Route path="/audit/import-logs/:id" element={<ImportLogShow />} />
                  <Route path="/audit/failed-login-attempts" element={<FailedLoginAttemptList />} />
                  <Route path="/audit/failed-login-attempts/:id" element={<FailedLoginAttemptShow />} />

                {/* Catch-all */}
                <Route path="*" element={<ErrorComponent />} />
              </Route>
            </Routes>
            <UnsavedChangesNotifier />
          </Refine>
        </AntApp>
      </ConfigProvider>
    </BrowserRouter>
  );
};

export default App;
