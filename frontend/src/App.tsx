import React, { useState, useEffect, lazy } from 'react';
import { Refine, Authenticated } from '@refinedev/core';
import { ErrorComponent } from '@refinedev/antd';
import { BrowserRouter, Route, Routes, Outlet, Navigate } from 'react-router-dom';
import routerBindings, { UnsavedChangesNotifier } from '@refinedev/react-router-v6';
import { ConfigProvider, App as AntApp } from 'antd';
import type { Locale } from 'antd/es/locale';
import enUS from 'antd/locale/en_US';
import zhCN from 'antd/locale/zh_CN';
import '@refinedev/antd/dist/reset.css';
import './styles/tokens.css';
import './styles/responsive.css';
import './i18n/i18n';
import i18n from './i18n/i18n';

import { dataProvider } from './providers/data-provider';
import { authProvider } from './providers/auth-provider';
import { i18nProvider } from './providers/i18n-provider';
import { AppLayout } from './components/layout/AppLayout';
import { NavigationProgress } from './components/layout/NavigationProgress';
import { erpTheme } from './theme';
import { LoginPage } from './pages/auth/LoginPage';

// ── Procurement ──
const PurchaseOrderList = lazy(() => import('./pages/procurement/purchase-orders/list').then((m) => ({ default: m.PurchaseOrderList })));
const PurchaseOrderShow = lazy(() => import('./pages/procurement/purchase-orders/show').then((m) => ({ default: m.PurchaseOrderShow })));
const PurchaseOrderCreate = lazy(() => import('./pages/procurement/purchase-orders/create').then((m) => ({ default: m.PurchaseOrderCreate })));
const PurchaseOrderEdit = lazy(() => import('./pages/procurement/purchase-orders/edit').then((m) => ({ default: m.PurchaseOrderEdit })));
const SupplierList = lazy(() => import('./pages/procurement/suppliers/list').then((m) => ({ default: m.SupplierList })));
const SupplierShow = lazy(() => import('./pages/procurement/suppliers/show').then((m) => ({ default: m.SupplierShow })));
const SupplierCreate = lazy(() => import('./pages/procurement/suppliers/create').then((m) => ({ default: m.SupplierCreate })));
const SupplierEdit = lazy(() => import('./pages/procurement/suppliers/edit').then((m) => ({ default: m.SupplierEdit })));
const PurchaseReceiptList = lazy(() => import('./pages/procurement/purchase-receipts/list').then((m) => ({ default: m.PurchaseReceiptList })));
const PurchaseReceiptShow = lazy(() => import('./pages/procurement/purchase-receipts/show').then((m) => ({ default: m.PurchaseReceiptShow })));
const PurchaseReceiptCreate = lazy(() => import('./pages/procurement/purchase-receipts/create').then((m) => ({ default: m.PurchaseReceiptCreate })));
const PurchaseReceiptEdit = lazy(() => import('./pages/procurement/purchase-receipts/edit').then((m) => ({ default: m.PurchaseReceiptEdit })));
const PurchaseRequisitionList = lazy(() => import('./pages/procurement/purchase-requisitions/list').then((m) => ({ default: m.PurchaseRequisitionList })));
const PurchaseRequisitionShow = lazy(() => import('./pages/procurement/purchase-requisitions/show').then((m) => ({ default: m.PurchaseRequisitionShow })));
const PurchaseRequisitionCreate = lazy(() => import('./pages/procurement/purchase-requisitions/create').then((m) => ({ default: m.PurchaseRequisitionCreate })));
const PurchaseRequisitionEdit = lazy(() => import('./pages/procurement/purchase-requisitions/edit').then((m) => ({ default: m.PurchaseRequisitionEdit })));
const RfqHeaderList = lazy(() => import('./pages/procurement/rfq-headers/list').then((m) => ({ default: m.RfqHeaderList })));
const RfqHeaderShow = lazy(() => import('./pages/procurement/rfq-headers/show').then((m) => ({ default: m.RfqHeaderShow })));
const RfqHeaderCreate = lazy(() => import('./pages/procurement/rfq-headers/create').then((m) => ({ default: m.RfqHeaderCreate })));
const RfqHeaderEdit = lazy(() => import('./pages/procurement/rfq-headers/edit').then((m) => ({ default: m.RfqHeaderEdit })));
const SupplierQuotationList = lazy(() => import('./pages/procurement/supplier-quotations/list').then((m) => ({ default: m.SupplierQuotationList })));
const SupplierQuotationShow = lazy(() => import('./pages/procurement/supplier-quotations/show').then((m) => ({ default: m.SupplierQuotationShow })));
const SupplierQuotationCreate = lazy(() => import('./pages/procurement/supplier-quotations/create').then((m) => ({ default: m.SupplierQuotationCreate })));
const SupplierQuotationEdit = lazy(() => import('./pages/procurement/supplier-quotations/edit').then((m) => ({ default: m.SupplierQuotationEdit })));
const ProfileChangeRequestList = lazy(() => import('./pages/procurement/profile-change-requests/list').then((m) => ({ default: m.ProfileChangeRequestList })));
const ProfileChangeRequestShow = lazy(() => import('./pages/procurement/profile-change-requests/show').then((m) => ({ default: m.ProfileChangeRequestShow })));
const ProfileChangeRequestCreate = lazy(() => import('./pages/procurement/profile-change-requests/create').then((m) => ({ default: m.ProfileChangeRequestCreate })));
const ProfileChangeRequestEdit = lazy(() => import('./pages/procurement/profile-change-requests/edit').then((m) => ({ default: m.ProfileChangeRequestEdit })));
const AdvanceShipmentNoticeList = lazy(() => import('./pages/procurement/advance-shipment-notices/list').then((m) => ({ default: m.AdvanceShipmentNoticeList })));
const AdvanceShipmentNoticeShow = lazy(() => import('./pages/procurement/advance-shipment-notices/show').then((m) => ({ default: m.AdvanceShipmentNoticeShow })));
const AdvanceShipmentNoticeCreate = lazy(() => import('./pages/procurement/advance-shipment-notices/create').then((m) => ({ default: m.AdvanceShipmentNoticeCreate })));
const AdvanceShipmentNoticeEdit = lazy(() => import('./pages/procurement/advance-shipment-notices/edit').then((m) => ({ default: m.AdvanceShipmentNoticeEdit })));
const ReconciliationStatementList = lazy(() => import('./pages/procurement/reconciliation-statements/list').then((m) => ({ default: m.ReconciliationStatementList })));
const ReconciliationStatementShow = lazy(() => import('./pages/procurement/reconciliation-statements/show').then((m) => ({ default: m.ReconciliationStatementShow })));
const ReconciliationStatementCreate = lazy(() => import('./pages/procurement/reconciliation-statements/create').then((m) => ({ default: m.ReconciliationStatementCreate })));
const ReconciliationStatementEdit = lazy(() => import('./pages/procurement/reconciliation-statements/edit').then((m) => ({ default: m.ReconciliationStatementEdit })));
const ThreeWayMatchList = lazy(() => import('./pages/procurement/three-way-match/list').then((m) => ({ default: m.ThreeWayMatchList })));
const ThreeWayMatchShow = lazy(() => import('./pages/procurement/three-way-match/show').then((m) => ({ default: m.ThreeWayMatchShow })));

// ── Sales ──
const SalesOrderList = lazy(() => import('./pages/sales/sales-orders/list').then((m) => ({ default: m.SalesOrderList })));
const SalesOrderShow = lazy(() => import('./pages/sales/sales-orders/show').then((m) => ({ default: m.SalesOrderShow })));
const SalesOrderCreate = lazy(() => import('./pages/sales/sales-orders/create').then((m) => ({ default: m.SalesOrderCreate })));
const SalesOrderEdit = lazy(() => import('./pages/sales/sales-orders/edit').then((m) => ({ default: m.SalesOrderEdit })));
const CustomerList = lazy(() => import('./pages/sales/customers/list').then((m) => ({ default: m.CustomerList })));
const CustomerShow = lazy(() => import('./pages/sales/customers/show').then((m) => ({ default: m.CustomerShow })));
const CustomerCreate = lazy(() => import('./pages/sales/customers/create').then((m) => ({ default: m.CustomerCreate })));
const CustomerEdit = lazy(() => import('./pages/sales/customers/edit').then((m) => ({ default: m.CustomerEdit })));
const SalesShipmentList = lazy(() => import('./pages/sales/sales-shipments/list').then((m) => ({ default: m.SalesShipmentList })));
const SalesShipmentShow = lazy(() => import('./pages/sales/sales-shipments/show').then((m) => ({ default: m.SalesShipmentShow })));
const SalesShipmentCreate = lazy(() => import('./pages/sales/sales-shipments/create').then((m) => ({ default: m.SalesShipmentCreate })));
const SalesShipmentEdit = lazy(() => import('./pages/sales/sales-shipments/edit').then((m) => ({ default: m.SalesShipmentEdit })));
const SalesReturnList = lazy(() => import('./pages/sales/sales-returns/list').then((m) => ({ default: m.SalesReturnList })));
const SalesReturnShow = lazy(() => import('./pages/sales/sales-returns/show').then((m) => ({ default: m.SalesReturnShow })));
const SalesReturnCreate = lazy(() => import('./pages/sales/sales-returns/create').then((m) => ({ default: m.SalesReturnCreate })));
const SalesReturnEdit = lazy(() => import('./pages/sales/sales-returns/edit').then((m) => ({ default: m.SalesReturnEdit })));
const CustomerReceiptList = lazy(() => import('./pages/sales/customer-receipts/list').then((m) => ({ default: m.CustomerReceiptList })));
const CustomerReceiptShow = lazy(() => import('./pages/sales/customer-receipts/show').then((m) => ({ default: m.CustomerReceiptShow })));
const CustomerReceiptCreate = lazy(() => import('./pages/sales/customer-receipts/create').then((m) => ({ default: m.CustomerReceiptCreate })));
const CustomerReceiptEdit = lazy(() => import('./pages/sales/customer-receipts/edit').then((m) => ({ default: m.CustomerReceiptEdit })));

// ── Inventory ──
const StockRecordList = lazy(() => import('./pages/inventory/index').then((m) => ({ default: m.StockRecordList })));
const WarehouseList = lazy(() => import('./pages/inventory/warehouses/list').then((m) => ({ default: m.WarehouseList })));
const WarehouseShow = lazy(() => import('./pages/inventory/warehouses/show').then((m) => ({ default: m.WarehouseShow })));
const WarehouseCreate = lazy(() => import('./pages/inventory/warehouses/create').then((m) => ({ default: m.WarehouseCreate })));
const WarehouseEdit = lazy(() => import('./pages/inventory/warehouses/edit').then((m) => ({ default: m.WarehouseEdit })));
const InventoryCountList = lazy(() => import('./pages/inventory/inventory-counts/list').then((m) => ({ default: m.InventoryCountList })));
const InventoryCountShow = lazy(() => import('./pages/inventory/inventory-counts/show').then((m) => ({ default: m.InventoryCountShow })));
const InventoryCountCreate = lazy(() => import('./pages/inventory/inventory-counts/create').then((m) => ({ default: m.InventoryCountCreate })));
const InventoryCountEdit = lazy(() => import('./pages/inventory/inventory-counts/edit').then((m) => ({ default: m.InventoryCountEdit })));
const InventoryLotList = lazy(() => import('./pages/inventory/inventory-lots/list').then((m) => ({ default: m.InventoryLotList })));
const InventoryLotShow = lazy(() => import('./pages/inventory/inventory-lots/show').then((m) => ({ default: m.InventoryLotShow })));
const InventoryLotCreate = lazy(() => import('./pages/inventory/inventory-lots/create').then((m) => ({ default: m.InventoryLotCreate })));
const InventoryLotEdit = lazy(() => import('./pages/inventory/inventory-lots/edit').then((m) => ({ default: m.InventoryLotEdit })));
const SerialNumberList = lazy(() => import('./pages/inventory/serial-numbers/list').then((m) => ({ default: m.SerialNumberList })));
const SerialNumberShow = lazy(() => import('./pages/inventory/serial-numbers/show').then((m) => ({ default: m.SerialNumberShow })));
const SerialNumberCreate = lazy(() => import('./pages/inventory/serial-numbers/create').then((m) => ({ default: m.SerialNumberCreate })));
const SerialNumberEdit = lazy(() => import('./pages/inventory/serial-numbers/edit').then((m) => ({ default: m.SerialNumberEdit })));
const StockTransactionList = lazy(() => import('./pages/inventory/stock-transactions/list').then((m) => ({ default: m.StockTransactionList })));
const StockTransactionShow = lazy(() => import('./pages/inventory/stock-transactions/show').then((m) => ({ default: m.StockTransactionShow })));
const InventoryReservationList = lazy(() => import('./pages/inventory/inventory-reservations/list').then((m) => ({ default: m.InventoryReservationList })));
const InventoryReservationShow = lazy(() => import('./pages/inventory/inventory-reservations/show').then((m) => ({ default: m.InventoryReservationShow })));
const InventoryReservationCreate = lazy(() => import('./pages/inventory/inventory-reservations/create').then((m) => ({ default: m.InventoryReservationCreate })));
const InventoryReservationEdit = lazy(() => import('./pages/inventory/inventory-reservations/edit').then((m) => ({ default: m.InventoryReservationEdit })));

// ── Manufacturing ──
const BomHeaderList = lazy(() => import('./pages/manufacturing/bom-headers/list').then((m) => ({ default: m.BomHeaderList })));
const BomHeaderShow = lazy(() => import('./pages/manufacturing/bom-headers/show').then((m) => ({ default: m.BomHeaderShow })));
const BomHeaderCreate = lazy(() => import('./pages/manufacturing/bom-headers/create').then((m) => ({ default: m.BomHeaderCreate })));
const BomHeaderEdit = lazy(() => import('./pages/manufacturing/bom-headers/edit').then((m) => ({ default: m.BomHeaderEdit })));
const WorkOrderList = lazy(() => import('./pages/manufacturing/work-orders/list').then((m) => ({ default: m.WorkOrderList })));
const WorkOrderShow = lazy(() => import('./pages/manufacturing/work-orders/show').then((m) => ({ default: m.WorkOrderShow })));
const WorkOrderCreate = lazy(() => import('./pages/manufacturing/work-orders/create').then((m) => ({ default: m.WorkOrderCreate })));
const WorkOrderEdit = lazy(() => import('./pages/manufacturing/work-orders/edit').then((m) => ({ default: m.WorkOrderEdit })));
const WorkOrderProductionList = lazy(() => import('./pages/manufacturing/work-order-productions/list').then((m) => ({ default: m.WorkOrderProductionList })));
const WorkOrderProductionShow = lazy(() => import('./pages/manufacturing/work-order-productions/show').then((m) => ({ default: m.WorkOrderProductionShow })));
const WorkOrderProductionCreate = lazy(() => import('./pages/manufacturing/work-order-productions/create').then((m) => ({ default: m.WorkOrderProductionCreate })));

// ── Quality ──
const DefectCodeList = lazy(() => import('./pages/quality/defect-codes/list').then((m) => ({ default: m.DefectCodeList })));
const DefectCodeShow = lazy(() => import('./pages/quality/defect-codes/show').then((m) => ({ default: m.DefectCodeShow })));
const DefectCodeCreate = lazy(() => import('./pages/quality/defect-codes/create').then((m) => ({ default: m.DefectCodeCreate })));
const DefectCodeEdit = lazy(() => import('./pages/quality/defect-codes/edit').then((m) => ({ default: m.DefectCodeEdit })));
const QualityStandardList = lazy(() => import('./pages/quality/quality-standards/list').then((m) => ({ default: m.QualityStandardList })));
const QualityStandardShow = lazy(() => import('./pages/quality/quality-standards/show').then((m) => ({ default: m.QualityStandardShow })));
const QualityStandardCreate = lazy(() => import('./pages/quality/quality-standards/create').then((m) => ({ default: m.QualityStandardCreate })));
const QualityStandardEdit = lazy(() => import('./pages/quality/quality-standards/edit').then((m) => ({ default: m.QualityStandardEdit })));
const QualityInspectionList = lazy(() => import('./pages/quality/quality-inspections/list').then((m) => ({ default: m.QualityInspectionList })));
const QualityInspectionShow = lazy(() => import('./pages/quality/quality-inspections/show').then((m) => ({ default: m.QualityInspectionShow })));
const QualityInspectionCreate = lazy(() => import('./pages/quality/quality-inspections/create').then((m) => ({ default: m.QualityInspectionCreate })));
const QualityInspectionEdit = lazy(() => import('./pages/quality/quality-inspections/edit').then((m) => ({ default: m.QualityInspectionEdit })));

// ── Finance ──
const PaymentRequestList = lazy(() => import('./pages/finance/payment-requests/list').then((m) => ({ default: m.PaymentRequestList })));
const PaymentRequestShow = lazy(() => import('./pages/finance/payment-requests/show').then((m) => ({ default: m.PaymentRequestShow })));
const PaymentRequestCreate = lazy(() => import('./pages/finance/payment-requests/create').then((m) => ({ default: m.PaymentRequestCreate })));
const PaymentRequestEdit = lazy(() => import('./pages/finance/payment-requests/edit').then((m) => ({ default: m.PaymentRequestEdit })));
const SalesInvoiceList = lazy(() => import('./pages/finance/sales-invoices/list').then((m) => ({ default: m.SalesInvoiceList })));
const SalesInvoiceShow = lazy(() => import('./pages/finance/sales-invoices/show').then((m) => ({ default: m.SalesInvoiceShow })));
const SalesInvoiceCreate = lazy(() => import('./pages/finance/sales-invoices/create').then((m) => ({ default: m.SalesInvoiceCreate })));
const SalesInvoiceEdit = lazy(() => import('./pages/finance/sales-invoices/edit').then((m) => ({ default: m.SalesInvoiceEdit })));
const SupplierInvoiceList = lazy(() => import('./pages/finance/supplier-invoices/list').then((m) => ({ default: m.SupplierInvoiceList })));
const SupplierInvoiceShow = lazy(() => import('./pages/finance/supplier-invoices/show').then((m) => ({ default: m.SupplierInvoiceShow })));
const SupplierInvoiceCreate = lazy(() => import('./pages/finance/supplier-invoices/create').then((m) => ({ default: m.SupplierInvoiceCreate })));
const SupplierInvoiceEdit = lazy(() => import('./pages/finance/supplier-invoices/edit').then((m) => ({ default: m.SupplierInvoiceEdit })));
const AccountSubjectList = lazy(() => import('./pages/finance/account-subjects/list').then((m) => ({ default: m.AccountSubjectList })));
const AccountSubjectShow = lazy(() => import('./pages/finance/account-subjects/show').then((m) => ({ default: m.AccountSubjectShow })));
const AccountSubjectCreate = lazy(() => import('./pages/finance/account-subjects/create').then((m) => ({ default: m.AccountSubjectCreate })));
const AccountSubjectEdit = lazy(() => import('./pages/finance/account-subjects/edit').then((m) => ({ default: m.AccountSubjectEdit })));
const CostCenterList = lazy(() => import('./pages/finance/cost-centers/list').then((m) => ({ default: m.CostCenterList })));
const CostCenterShow = lazy(() => import('./pages/finance/cost-centers/show').then((m) => ({ default: m.CostCenterShow })));
const CostCenterCreate = lazy(() => import('./pages/finance/cost-centers/create').then((m) => ({ default: m.CostCenterCreate })));
const CostCenterEdit = lazy(() => import('./pages/finance/cost-centers/edit').then((m) => ({ default: m.CostCenterEdit })));
const VoucherList = lazy(() => import('./pages/finance/vouchers/list').then((m) => ({ default: m.VoucherList })));
const VoucherShow = lazy(() => import('./pages/finance/vouchers/show').then((m) => ({ default: m.VoucherShow })));
const VoucherCreate = lazy(() => import('./pages/finance/vouchers/create').then((m) => ({ default: m.VoucherCreate })));
const VoucherEdit = lazy(() => import('./pages/finance/vouchers/edit').then((m) => ({ default: m.VoucherEdit })));
const BudgetList = lazy(() => import('./pages/finance/budgets/list').then((m) => ({ default: m.BudgetList })));
const BudgetShow = lazy(() => import('./pages/finance/budgets/show').then((m) => ({ default: m.BudgetShow })));
const BudgetCreate = lazy(() => import('./pages/finance/budgets/create').then((m) => ({ default: m.BudgetCreate })));
const BudgetEdit = lazy(() => import('./pages/finance/budgets/edit').then((m) => ({ default: m.BudgetEdit })));
const PaymentRecordList = lazy(() => import('./pages/finance/payment-records/list').then((m) => ({ default: m.PaymentRecordList })));
const PaymentRecordShow = lazy(() => import('./pages/finance/payment-records/show').then((m) => ({ default: m.PaymentRecordShow })));

// ── Fixed Assets ──
const FixedAssetList = lazy(() => import('./pages/assets/fixed-assets/list').then((m) => ({ default: m.FixedAssetList })));
const FixedAssetShow = lazy(() => import('./pages/assets/fixed-assets/show').then((m) => ({ default: m.FixedAssetShow })));
const FixedAssetCreate = lazy(() => import('./pages/assets/fixed-assets/create').then((m) => ({ default: m.FixedAssetCreate })));
const FixedAssetEdit = lazy(() => import('./pages/assets/fixed-assets/edit').then((m) => ({ default: m.FixedAssetEdit })));
const AssetDepreciationList = lazy(() => import('./pages/assets/asset-depreciations/list').then((m) => ({ default: m.AssetDepreciationList })));
const AssetDepreciationShow = lazy(() => import('./pages/assets/asset-depreciations/show').then((m) => ({ default: m.AssetDepreciationShow })));
const AssetMaintenanceList = lazy(() => import('./pages/assets/asset-maintenance/list').then((m) => ({ default: m.AssetMaintenanceList })));
const AssetMaintenanceShow = lazy(() => import('./pages/assets/asset-maintenance/show').then((m) => ({ default: m.AssetMaintenanceShow })));
const AssetMaintenanceCreate = lazy(() => import('./pages/assets/asset-maintenance/create').then((m) => ({ default: m.AssetMaintenanceCreate })));

// ── Contracts ──
const ContractList = lazy(() => import('./pages/contracts/contracts/list').then((m) => ({ default: m.ContractList })));
const ContractShow = lazy(() => import('./pages/contracts/contracts/show').then((m) => ({ default: m.ContractShow })));
const ContractCreate = lazy(() => import('./pages/contracts/contracts/create').then((m) => ({ default: m.ContractCreate })));
const ContractEdit = lazy(() => import('./pages/contracts/contracts/edit').then((m) => ({ default: m.ContractEdit })));

// ── HR ──
const DepartmentList = lazy(() => import('./pages/hr/departments/list').then((m) => ({ default: m.DepartmentList })));
const DepartmentShow = lazy(() => import('./pages/hr/departments/show').then((m) => ({ default: m.DepartmentShow })));
const DepartmentCreate = lazy(() => import('./pages/hr/departments/create').then((m) => ({ default: m.DepartmentCreate })));
const DepartmentEdit = lazy(() => import('./pages/hr/departments/edit').then((m) => ({ default: m.DepartmentEdit })));
const EmployeeList = lazy(() => import('./pages/hr/employees/list').then((m) => ({ default: m.EmployeeList })));
const EmployeeShow = lazy(() => import('./pages/hr/employees/show').then((m) => ({ default: m.EmployeeShow })));
const EmployeeCreate = lazy(() => import('./pages/hr/employees/create').then((m) => ({ default: m.EmployeeCreate })));
const EmployeeEdit = lazy(() => import('./pages/hr/employees/edit').then((m) => ({ default: m.EmployeeEdit })));
const ExchangeRateList = lazy(() => import('./pages/hr/exchange-rates/list').then((m) => ({ default: m.ExchangeRateList })));
const ExchangeRateShow = lazy(() => import('./pages/hr/exchange-rates/show').then((m) => ({ default: m.ExchangeRateShow })));
const ExchangeRateCreate = lazy(() => import('./pages/hr/exchange-rates/create').then((m) => ({ default: m.ExchangeRateCreate })));
const ExchangeRateEdit = lazy(() => import('./pages/hr/exchange-rates/edit').then((m) => ({ default: m.ExchangeRateEdit })));

// ── Master Data ──
const ProductList = lazy(() => import('./pages/master-data/products/list').then((m) => ({ default: m.ProductList })));
const ProductShow = lazy(() => import('./pages/master-data/products/show').then((m) => ({ default: m.ProductShow })));
const ProductCreate = lazy(() => import('./pages/master-data/products/create').then((m) => ({ default: m.ProductCreate })));
const ProductEdit = lazy(() => import('./pages/master-data/products/edit').then((m) => ({ default: m.ProductEdit })));
const CarrierList = lazy(() => import('./pages/master-data/carriers/list').then((m) => ({ default: m.CarrierList })));
const CarrierShow = lazy(() => import('./pages/master-data/carriers/show').then((m) => ({ default: m.CarrierShow })));
const CarrierCreate = lazy(() => import('./pages/master-data/carriers/create').then((m) => ({ default: m.CarrierCreate })));
const CarrierEdit = lazy(() => import('./pages/master-data/carriers/edit').then((m) => ({ default: m.CarrierEdit })));
const ProductCategoryList = lazy(() => import('./pages/master-data/product-categories/list').then((m) => ({ default: m.ProductCategoryList })));
const ProductCategoryShow = lazy(() => import('./pages/master-data/product-categories/show').then((m) => ({ default: m.ProductCategoryShow })));
const ProductCategoryCreate = lazy(() => import('./pages/master-data/product-categories/create').then((m) => ({ default: m.ProductCategoryCreate })));
const ProductCategoryEdit = lazy(() => import('./pages/master-data/product-categories/edit').then((m) => ({ default: m.ProductCategoryEdit })));
const StorageLocationList = lazy(() => import('./pages/master-data/storage-locations/list').then((m) => ({ default: m.StorageLocationList })));
const StorageLocationShow = lazy(() => import('./pages/master-data/storage-locations/show').then((m) => ({ default: m.StorageLocationShow })));
const StorageLocationCreate = lazy(() => import('./pages/master-data/storage-locations/create').then((m) => ({ default: m.StorageLocationCreate })));
const StorageLocationEdit = lazy(() => import('./pages/master-data/storage-locations/edit').then((m) => ({ default: m.StorageLocationEdit })));
const PriceListList = lazy(() => import('./pages/master-data/price-lists/list').then((m) => ({ default: m.PriceListList })));
const PriceListShow = lazy(() => import('./pages/master-data/price-lists/show').then((m) => ({ default: m.PriceListShow })));
const PriceListCreate = lazy(() => import('./pages/master-data/price-lists/create').then((m) => ({ default: m.PriceListCreate })));
const PriceListEdit = lazy(() => import('./pages/master-data/price-lists/edit').then((m) => ({ default: m.PriceListEdit })));
const CurrencyList = lazy(() => import('./pages/master-data/currencies/list').then((m) => ({ default: m.CurrencyList })));
const CurrencyShow = lazy(() => import('./pages/master-data/currencies/show').then((m) => ({ default: m.CurrencyShow })));
const UomList = lazy(() => import('./pages/master-data/uoms/list').then((m) => ({ default: m.UomList })));
const UomShow = lazy(() => import('./pages/master-data/uoms/show').then((m) => ({ default: m.UomShow })));
const OrganizationCurrencyList = lazy(() => import('./pages/master-data/organization-currencies/list').then((m) => ({ default: m.OrganizationCurrencyList })));
const OrganizationCurrencyShow = lazy(() => import('./pages/master-data/organization-currencies/show').then((m) => ({ default: m.OrganizationCurrencyShow })));
const OrganizationCurrencyCreate = lazy(() => import('./pages/master-data/organization-currencies/create').then((m) => ({ default: m.OrganizationCurrencyCreate })));
const OrganizationUomList = lazy(() => import('./pages/master-data/organization-uoms/list').then((m) => ({ default: m.OrganizationUomList })));
const OrganizationUomShow = lazy(() => import('./pages/master-data/organization-uoms/show').then((m) => ({ default: m.OrganizationUomShow })));
const OrganizationUomCreate = lazy(() => import('./pages/master-data/organization-uoms/create').then((m) => ({ default: m.OrganizationUomCreate })));
const ProductCostHistoryList = lazy(() => import('./pages/master-data/product-cost-history/list').then((m) => ({ default: m.ProductCostHistoryList })));
const ProductCostHistoryShow = lazy(() => import('./pages/master-data/product-cost-history/show').then((m) => ({ default: m.ProductCostHistoryShow })));

// ── System ──
const NotificationList = lazy(() => import('./pages/system/notifications/list').then((m) => ({ default: m.NotificationList })));
const NotificationShow = lazy(() => import('./pages/system/notifications/show').then((m) => ({ default: m.NotificationShow })));
const DocumentAttachmentList = lazy(() => import('./pages/system/document-attachments/list').then((m) => ({ default: m.DocumentAttachmentList })));
const DocumentAttachmentShow = lazy(() => import('./pages/system/document-attachments/show').then((m) => ({ default: m.DocumentAttachmentShow })));
const DocumentAttachmentCreate = lazy(() => import('./pages/system/document-attachments/create').then((m) => ({ default: m.DocumentAttachmentCreate })));
const DocumentAttachmentEdit = lazy(() => import('./pages/system/document-attachments/edit').then((m) => ({ default: m.DocumentAttachmentEdit })));
const DocumentRelationList = lazy(() => import('./pages/system/document-relations/list').then((m) => ({ default: m.DocumentRelationList })));
const DocumentRelationShow = lazy(() => import('./pages/system/document-relations/show').then((m) => ({ default: m.DocumentRelationShow })));
const DocumentRelationCreate = lazy(() => import('./pages/system/document-relations/create').then((m) => ({ default: m.DocumentRelationCreate })));
const DocumentRelationEdit = lazy(() => import('./pages/system/document-relations/edit').then((m) => ({ default: m.DocumentRelationEdit })));
const WorkflowList = lazy(() => import('./pages/system/workflows/list').then((m) => ({ default: m.WorkflowList })));
const WorkflowShow = lazy(() => import('./pages/system/workflows/show').then((m) => ({ default: m.WorkflowShow })));
const ApprovalRuleList = lazy(() => import('./pages/system/approval-rules/list').then((m) => ({ default: m.ApprovalRuleList })));
const ApprovalRuleShow = lazy(() => import('./pages/system/approval-rules/show').then((m) => ({ default: m.ApprovalRuleShow })));
const ApprovalRuleCreate = lazy(() => import('./pages/system/approval-rules/create').then((m) => ({ default: m.ApprovalRuleCreate })));
const ApprovalRuleEdit = lazy(() => import('./pages/system/approval-rules/edit').then((m) => ({ default: m.ApprovalRuleEdit })));
const ApprovalRecordList = lazy(() => import('./pages/system/approval-records/list').then((m) => ({ default: m.ApprovalRecordList })));
const ApprovalRecordShow = lazy(() => import('./pages/system/approval-records/show').then((m) => ({ default: m.ApprovalRecordShow })));
const RoleList = lazy(() => import('./pages/system/roles/list').then((m) => ({ default: m.RoleList })));
const RoleShow = lazy(() => import('./pages/system/roles/show').then((m) => ({ default: m.RoleShow })));
const RoleCreate = lazy(() => import('./pages/system/roles/create').then((m) => ({ default: m.RoleCreate })));
const RoleEdit = lazy(() => import('./pages/system/roles/edit').then((m) => ({ default: m.RoleEdit })));
const UserRoleList = lazy(() => import('./pages/system/user-roles/list').then((m) => ({ default: m.UserRoleList })));
const UserRoleShow = lazy(() => import('./pages/system/user-roles/show').then((m) => ({ default: m.UserRoleShow })));
const UserRoleCreate = lazy(() => import('./pages/system/user-roles/create').then((m) => ({ default: m.UserRoleCreate })));
const UserRoleEdit = lazy(() => import('./pages/system/user-roles/edit').then((m) => ({ default: m.UserRoleEdit })));
const NumberSequenceList = lazy(() => import('./pages/system/number-sequences/list').then((m) => ({ default: m.NumberSequenceList })));
const NumberSequenceShow = lazy(() => import('./pages/system/number-sequences/show').then((m) => ({ default: m.NumberSequenceShow })));
const NumberSequenceEdit = lazy(() => import('./pages/system/number-sequences/edit').then((m) => ({ default: m.NumberSequenceEdit })));
const OrganizationList = lazy(() => import('./pages/system/organizations/list').then((m) => ({ default: m.OrganizationList })));
const OrganizationShow = lazy(() => import('./pages/system/organizations/show').then((m) => ({ default: m.OrganizationShow })));
const OrganizationCreate = lazy(() => import('./pages/system/organizations/create').then((m) => ({ default: m.OrganizationCreate })));
const OrganizationEdit = lazy(() => import('./pages/system/organizations/edit').then((m) => ({ default: m.OrganizationEdit })));
const PortalUserList = lazy(() => import('./pages/system/portal-users/list').then((m) => ({ default: m.PortalUserList })));
const PortalUserShow = lazy(() => import('./pages/system/portal-users/show').then((m) => ({ default: m.PortalUserShow })));

// ── Audit ──
const TokenUsageList = lazy(() => import('./pages/audit/token-usage/list').then((m) => ({ default: m.TokenUsageList })));
const TokenUsageShow = lazy(() => import('./pages/audit/token-usage/show').then((m) => ({ default: m.TokenUsageShow })));
const ToolCallMetricList = lazy(() => import('./pages/audit/tool-call-metrics/list').then((m) => ({ default: m.ToolCallMetricList })));
const ToolCallMetricShow = lazy(() => import('./pages/audit/tool-call-metrics/show').then((m) => ({ default: m.ToolCallMetricShow })));
const AgentSessionList = lazy(() => import('./pages/audit/agent-sessions/list').then((m) => ({ default: m.AgentSessionList })));
const AgentSessionShow = lazy(() => import('./pages/audit/agent-sessions/show').then((m) => ({ default: m.AgentSessionShow })));
const AgentDecisionList = lazy(() => import('./pages/audit/agent-decisions/list').then((m) => ({ default: m.AgentDecisionList })));
const AgentDecisionShow = lazy(() => import('./pages/audit/agent-decisions/show').then((m) => ({ default: m.AgentDecisionShow })));
const BusinessEventList = lazy(() => import('./pages/audit/business-events/list').then((m) => ({ default: m.BusinessEventList })));
const BusinessEventShow = lazy(() => import('./pages/audit/business-events/show').then((m) => ({ default: m.BusinessEventShow })));
const AuthEventList = lazy(() => import('./pages/audit/auth-events/list').then((m) => ({ default: m.AuthEventList })));
const AuthEventShow = lazy(() => import('./pages/audit/auth-events/show').then((m) => ({ default: m.AuthEventShow })));
const ImportLogList = lazy(() => import('./pages/audit/import-logs/list').then((m) => ({ default: m.ImportLogList })));
const ImportLogShow = lazy(() => import('./pages/audit/import-logs/show').then((m) => ({ default: m.ImportLogShow })));
const FailedLoginAttemptList = lazy(() => import('./pages/audit/failed-login-attempts/list').then((m) => ({ default: m.FailedLoginAttemptList })));
const FailedLoginAttemptShow = lazy(() => import('./pages/audit/failed-login-attempts/show').then((m) => ({ default: m.FailedLoginAttemptShow })));

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
                <Route index element={<Navigate to="/procurement/purchase-orders" replace />} />

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
