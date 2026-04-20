import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Refine, Authenticated } from '@refinedev/core';
import { RefineThemes, ErrorComponent } from '@refinedev/antd';
import { BrowserRouter, Route, Routes, Outlet, Navigate } from 'react-router-dom';
import routerBindings, { UnsavedChangesNotifier } from '@refinedev/react-router-v6';
import { ConfigProvider, App as AntApp, Spin } from 'antd';
import type { Locale } from 'antd/es/locale';
import enUS from 'antd/locale/en_US';
import zhCN from 'antd/locale/zh_CN';
import '@refinedev/antd/dist/reset.css';
import './i18n/i18n';
import i18n from './i18n/i18n';

import { dataProvider } from './providers/data-provider';
import { authProvider } from './providers/auth-provider';
import { i18nProvider } from './providers/i18n-provider';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/auth/LoginPage';

// Procurement — lazy loaded
const PurchaseOrderList = lazy(() =>
  import('./pages/procurement/purchase-orders/list').then((m) => ({ default: m.PurchaseOrderList }))
);
const PurchaseOrderShow = lazy(() =>
  import('./pages/procurement/purchase-orders/show').then((m) => ({ default: m.PurchaseOrderShow }))
);
const PurchaseOrderCreate = lazy(() =>
  import('./pages/procurement/purchase-orders/create').then((m) => ({ default: m.PurchaseOrderCreate }))
);
const PurchaseOrderEdit = lazy(() =>
  import('./pages/procurement/purchase-orders/edit').then((m) => ({ default: m.PurchaseOrderEdit }))
);
const SupplierList = lazy(() =>
  import('./pages/procurement/suppliers/list').then((m) => ({ default: m.SupplierList }))
);
const SupplierShow = lazy(() =>
  import('./pages/procurement/suppliers/show').then((m) => ({ default: m.SupplierShow }))
);
const SupplierCreate = lazy(() =>
  import('./pages/procurement/suppliers/create').then((m) => ({ default: m.SupplierCreate }))
);
const SupplierEdit = lazy(() =>
  import('./pages/procurement/suppliers/edit').then((m) => ({ default: m.SupplierEdit }))
);
const PurchaseReceiptList = lazy(() =>
  import('./pages/procurement/purchase-receipts/list').then((m) => ({ default: m.PurchaseReceiptList }))
);
const PurchaseReceiptShow = lazy(() =>
  import('./pages/procurement/purchase-receipts/show').then((m) => ({ default: m.PurchaseReceiptShow }))
);
const PurchaseReceiptEdit = lazy(() =>
  import('./pages/procurement/purchase-receipts/edit').then((m) => ({ default: m.PurchaseReceiptEdit }))
);

// Sales — lazy loaded
const SalesOrderList = lazy(() =>
  import('./pages/sales/sales-orders/list').then((m) => ({ default: m.SalesOrderList }))
);
const SalesOrderShow = lazy(() =>
  import('./pages/sales/sales-orders/show').then((m) => ({ default: m.SalesOrderShow }))
);
const SalesOrderEdit = lazy(() =>
  import('./pages/sales/sales-orders/edit').then((m) => ({ default: m.SalesOrderEdit }))
);
const CustomerList = lazy(() =>
  import('./pages/sales/customers/list').then((m) => ({ default: m.CustomerList }))
);
const CustomerShow = lazy(() =>
  import('./pages/sales/customers/show').then((m) => ({ default: m.CustomerShow }))
);
const CustomerCreate = lazy(() =>
  import('./pages/sales/customers/create').then((m) => ({ default: m.CustomerCreate }))
);
const CustomerEdit = lazy(() =>
  import('./pages/sales/customers/edit').then((m) => ({ default: m.CustomerEdit }))
);
const SalesShipmentList = lazy(() =>
  import('./pages/sales/sales-shipments/list').then((m) => ({ default: m.SalesShipmentList }))
);
const SalesShipmentShow = lazy(() =>
  import('./pages/sales/sales-shipments/show').then((m) => ({ default: m.SalesShipmentShow }))
);
const SalesShipmentEdit = lazy(() =>
  import('./pages/sales/sales-shipments/edit').then((m) => ({ default: m.SalesShipmentEdit }))
);
const SalesReturnList = lazy(() =>
  import('./pages/sales/sales-returns/list').then((m) => ({ default: m.SalesReturnList }))
);
const SalesReturnShow = lazy(() =>
  import('./pages/sales/sales-returns/show').then((m) => ({ default: m.SalesReturnShow }))
);
const SalesReturnEdit = lazy(() =>
  import('./pages/sales/sales-returns/edit').then((m) => ({ default: m.SalesReturnEdit }))
);

// Inventory — lazy loaded
const StockRecordList = lazy(() =>
  import('./pages/inventory/index').then((m) => ({ default: m.StockRecordList }))
);
const WarehouseList = lazy(() =>
  import('./pages/inventory/warehouses/list').then((m) => ({ default: m.WarehouseList }))
);
const WarehouseShow = lazy(() =>
  import('./pages/inventory/warehouses/show').then((m) => ({ default: m.WarehouseShow }))
);
const WarehouseCreate = lazy(() =>
  import('./pages/inventory/warehouses/create').then((m) => ({ default: m.WarehouseCreate }))
);
const WarehouseEdit = lazy(() =>
  import('./pages/inventory/warehouses/edit').then((m) => ({ default: m.WarehouseEdit }))
);

// Finance — lazy loaded
const PaymentRequestList = lazy(() =>
  import('./pages/finance/payment-requests/list').then((m) => ({ default: m.PaymentRequestList }))
);
const PaymentRequestShow = lazy(() =>
  import('./pages/finance/payment-requests/show').then((m) => ({ default: m.PaymentRequestShow }))
);
const PaymentRequestEdit = lazy(() =>
  import('./pages/finance/payment-requests/edit').then((m) => ({ default: m.PaymentRequestEdit }))
);
const SalesInvoiceList = lazy(() =>
  import('./pages/finance/sales-invoices/list').then((m) => ({ default: m.SalesInvoiceList }))
);
const SalesInvoiceShow = lazy(() =>
  import('./pages/finance/sales-invoices/show').then((m) => ({ default: m.SalesInvoiceShow }))
);
const SalesInvoiceEdit = lazy(() =>
  import('./pages/finance/sales-invoices/edit').then((m) => ({ default: m.SalesInvoiceEdit }))
);
const SupplierInvoiceList = lazy(() =>
  import('./pages/finance/supplier-invoices/list').then((m) => ({ default: m.SupplierInvoiceList }))
);
const SupplierInvoiceShow = lazy(() =>
  import('./pages/finance/supplier-invoices/show').then((m) => ({ default: m.SupplierInvoiceShow }))
);
const SupplierInvoiceEdit = lazy(() =>
  import('./pages/finance/supplier-invoices/edit').then((m) => ({ default: m.SupplierInvoiceEdit }))
);

// Master Data — lazy loaded
const ProductList = lazy(() =>
  import('./pages/master-data/products/list').then((m) => ({ default: m.ProductList }))
);
const ProductShow = lazy(() =>
  import('./pages/master-data/products/show').then((m) => ({ default: m.ProductShow }))
);
const ProductCreate = lazy(() =>
  import('./pages/master-data/products/create').then((m) => ({ default: m.ProductCreate }))
);
const ProductEdit = lazy(() =>
  import('./pages/master-data/products/edit').then((m) => ({ default: m.ProductEdit }))
);
const CarrierList = lazy(() =>
  import('./pages/master-data/carriers/list').then((m) => ({ default: m.CarrierList }))
);
const CarrierShow = lazy(() =>
  import('./pages/master-data/carriers/show').then((m) => ({ default: m.CarrierShow }))
);
const CarrierCreate = lazy(() =>
  import('./pages/master-data/carriers/create').then((m) => ({ default: m.CarrierCreate }))
);
const CarrierEdit = lazy(() =>
  import('./pages/master-data/carriers/edit').then((m) => ({ default: m.CarrierEdit }))
);

// System — lazy loaded
const NotificationList = lazy(() =>
  import('./pages/system/notifications/list').then((m) => ({ default: m.NotificationList }))
);
const NotificationShow = lazy(() =>
  import('./pages/system/notifications/show').then((m) => ({ default: m.NotificationShow }))
);

// AI
const ChatPanel = lazy(() =>
  import('./components/ai/ChatPanel').then((m) => ({ default: m.ChatPanel }))
);

// Icons
import {
  ShoppingCartOutlined,
  ShopOutlined,
  InboxOutlined,
  AppstoreOutlined,
  RobotOutlined,
  TeamOutlined,
  UserOutlined,
  CarOutlined,
  RollbackOutlined,
  FileTextOutlined,
  DollarOutlined,
  BankOutlined,
  HomeOutlined,
  FileDoneOutlined,
  BellOutlined,
} from '@ant-design/icons';

const PAGE_SPINNER = (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
    <Spin size="large" />
  </div>
);

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
      <ConfigProvider theme={RefineThemes.Blue} locale={antdLocale}>
        <AntApp>
          <Refine
            dataProvider={dataProvider}
            authProvider={authProvider}
            i18nProvider={i18nProvider}
            routerProvider={routerBindings}
            resources={[
              // Procurement
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
              // Sales
              { name: 'sales' },
              {
                name: 'sales-orders',
                list: '/sales/sales-orders',
                show: '/sales/sales-orders/:id',
                edit: '/sales/sales-orders/:id/edit',
                meta: { parent: 'sales', icon: <ShopOutlined /> },
              },
              {
                name: 'sales-shipments',
                list: '/sales/sales-shipments',
                show: '/sales/sales-shipments/:id',
                edit: '/sales/sales-shipments/:id/edit',
                meta: { parent: 'sales', icon: <CarOutlined /> },
              },
              {
                name: 'sales-returns',
                list: '/sales/sales-returns',
                show: '/sales/sales-returns/:id',
                edit: '/sales/sales-returns/:id/edit',
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
              // Inventory
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
              // Finance
              { name: 'finance' },
              {
                name: 'payment-requests',
                list: '/finance/payment-requests',
                show: '/finance/payment-requests/:id',
                edit: '/finance/payment-requests/:id/edit',
                meta: { parent: 'finance', icon: <DollarOutlined /> },
              },
              {
                name: 'sales-invoices',
                list: '/finance/sales-invoices',
                show: '/finance/sales-invoices/:id',
                edit: '/finance/sales-invoices/:id/edit',
                meta: { parent: 'finance', icon: <FileTextOutlined /> },
              },
              {
                name: 'supplier-invoices',
                list: '/finance/supplier-invoices',
                show: '/finance/supplier-invoices/:id',
                edit: '/finance/supplier-invoices/:id/edit',
                meta: { parent: 'finance', icon: <BankOutlined /> },
              },
              // Master Data
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
              // System
              { name: 'system' },
              {
                name: 'notifications',
                list: '/system/notifications',
                show: '/system/notifications/:id',
                meta: { parent: 'system', icon: <BellOutlined /> },
              },
              // AI
              {
                name: 'ai-chat',
                list: '/ai/chat',
                meta: { icon: <RobotOutlined /> },
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
                      <Outlet />
                    </AppLayout>
                  </Authenticated>
                }
              >
                <Route index element={<Navigate to="/procurement/purchase-orders" replace />} />

                <Suspense fallback={PAGE_SPINNER}>
                  {/* Procurement */}
                  <Route path="/procurement/purchase-orders" element={<PurchaseOrderList />} />
                  <Route path="/procurement/purchase-orders/create" element={<PurchaseOrderCreate />} />
                  <Route path="/procurement/purchase-orders/:id" element={<PurchaseOrderShow />} />
                  <Route path="/procurement/purchase-orders/:id/edit" element={<PurchaseOrderEdit />} />
                  <Route path="/procurement/purchase-receipts" element={<PurchaseReceiptList />} />
                  <Route path="/procurement/purchase-receipts/:id" element={<PurchaseReceiptShow />} />
                  <Route path="/procurement/purchase-receipts/:id/edit" element={<PurchaseReceiptEdit />} />
                  <Route path="/procurement/suppliers" element={<SupplierList />} />
                  <Route path="/procurement/suppliers/create" element={<SupplierCreate />} />
                  <Route path="/procurement/suppliers/:id" element={<SupplierShow />} />
                  <Route path="/procurement/suppliers/:id/edit" element={<SupplierEdit />} />

                  {/* Sales */}
                  <Route path="/sales/sales-orders" element={<SalesOrderList />} />
                  <Route path="/sales/sales-orders/:id" element={<SalesOrderShow />} />
                  <Route path="/sales/sales-orders/:id/edit" element={<SalesOrderEdit />} />
                  <Route path="/sales/sales-shipments" element={<SalesShipmentList />} />
                  <Route path="/sales/sales-shipments/:id" element={<SalesShipmentShow />} />
                  <Route path="/sales/sales-shipments/:id/edit" element={<SalesShipmentEdit />} />
                  <Route path="/sales/sales-returns" element={<SalesReturnList />} />
                  <Route path="/sales/sales-returns/:id" element={<SalesReturnShow />} />
                  <Route path="/sales/sales-returns/:id/edit" element={<SalesReturnEdit />} />
                  <Route path="/sales/customers" element={<CustomerList />} />
                  <Route path="/sales/customers/create" element={<CustomerCreate />} />
                  <Route path="/sales/customers/:id" element={<CustomerShow />} />
                  <Route path="/sales/customers/:id/edit" element={<CustomerEdit />} />

                  {/* Inventory */}
                  <Route path="/inventory/stock-records" element={<StockRecordList />} />
                  <Route path="/inventory/warehouses" element={<WarehouseList />} />
                  <Route path="/inventory/warehouses/create" element={<WarehouseCreate />} />
                  <Route path="/inventory/warehouses/:id" element={<WarehouseShow />} />
                  <Route path="/inventory/warehouses/:id/edit" element={<WarehouseEdit />} />

                  {/* Finance */}
                  <Route path="/finance/payment-requests" element={<PaymentRequestList />} />
                  <Route path="/finance/payment-requests/:id" element={<PaymentRequestShow />} />
                  <Route path="/finance/payment-requests/:id/edit" element={<PaymentRequestEdit />} />
                  <Route path="/finance/sales-invoices" element={<SalesInvoiceList />} />
                  <Route path="/finance/sales-invoices/:id" element={<SalesInvoiceShow />} />
                  <Route path="/finance/sales-invoices/:id/edit" element={<SalesInvoiceEdit />} />
                  <Route path="/finance/supplier-invoices" element={<SupplierInvoiceList />} />
                  <Route path="/finance/supplier-invoices/:id" element={<SupplierInvoiceShow />} />
                  <Route path="/finance/supplier-invoices/:id/edit" element={<SupplierInvoiceEdit />} />

                  {/* Master Data */}
                  <Route path="/master-data/products" element={<ProductList />} />
                  <Route path="/master-data/products/create" element={<ProductCreate />} />
                  <Route path="/master-data/products/:id" element={<ProductShow />} />
                  <Route path="/master-data/products/:id/edit" element={<ProductEdit />} />
                  <Route path="/master-data/carriers" element={<CarrierList />} />
                  <Route path="/master-data/carriers/create" element={<CarrierCreate />} />
                  <Route path="/master-data/carriers/:id" element={<CarrierShow />} />
                  <Route path="/master-data/carriers/:id/edit" element={<CarrierEdit />} />

                  {/* System */}
                  <Route path="/system/notifications" element={<NotificationList />} />
                  <Route path="/system/notifications/:id" element={<NotificationShow />} />

                  {/* AI */}
                  <Route
                    path="/ai/chat"
                    element={
                      <div style={{ padding: 24 }}>
                        <ChatPanel />
                      </div>
                    }
                  />
                </Suspense>

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
