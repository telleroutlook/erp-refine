import React, { useState, useEffect } from 'react';
import { Refine, Authenticated } from '@refinedev/core';
import { RefineThemes, ErrorComponent } from '@refinedev/antd';
import { BrowserRouter, Route, Routes, Outlet, Navigate } from 'react-router-dom';
import routerBindings, { UnsavedChangesNotifier } from '@refinedev/react-router-v6';
import { ConfigProvider, App as AntApp } from 'antd';
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

// Procurement
import { PurchaseOrderList } from './pages/procurement/purchase-orders/list';
import { PurchaseOrderShow } from './pages/procurement/purchase-orders/show';
import { PurchaseOrderCreate } from './pages/procurement/purchase-orders/create';
import { PurchaseOrderEdit } from './pages/procurement/purchase-orders/edit';
import { SupplierList } from './pages/procurement/suppliers/list';
import { SupplierShow } from './pages/procurement/suppliers/show';
import { SupplierCreate } from './pages/procurement/suppliers/create';
import { SupplierEdit } from './pages/procurement/suppliers/edit';
import { PurchaseReceiptList } from './pages/procurement/purchase-receipts/list';
import { PurchaseReceiptShow } from './pages/procurement/purchase-receipts/show';
import { PurchaseReceiptEdit } from './pages/procurement/purchase-receipts/edit';

// Sales
import { SalesOrderList } from './pages/sales/sales-orders/list';
import { SalesOrderShow } from './pages/sales/sales-orders/show';
import { SalesOrderEdit } from './pages/sales/sales-orders/edit';
import { CustomerList } from './pages/sales/customers/list';
import { CustomerShow } from './pages/sales/customers/show';
import { CustomerCreate } from './pages/sales/customers/create';
import { CustomerEdit } from './pages/sales/customers/edit';
import { SalesShipmentList } from './pages/sales/sales-shipments/list';
import { SalesShipmentShow } from './pages/sales/sales-shipments/show';
import { SalesShipmentEdit } from './pages/sales/sales-shipments/edit';
import { SalesReturnList } from './pages/sales/sales-returns/list';
import { SalesReturnShow } from './pages/sales/sales-returns/show';
import { SalesReturnEdit } from './pages/sales/sales-returns/edit';

// Inventory
import { StockRecordList } from './pages/inventory/index';
import { WarehouseList } from './pages/inventory/warehouses/list';
import { WarehouseShow } from './pages/inventory/warehouses/show';
import { WarehouseCreate } from './pages/inventory/warehouses/create';
import { WarehouseEdit } from './pages/inventory/warehouses/edit';

// Finance
import { PaymentRequestList } from './pages/finance/payment-requests/list';
import { PaymentRequestShow } from './pages/finance/payment-requests/show';
import { PaymentRequestEdit } from './pages/finance/payment-requests/edit';
import { SalesInvoiceList } from './pages/finance/sales-invoices/list';
import { SalesInvoiceShow } from './pages/finance/sales-invoices/show';
import { SalesInvoiceEdit } from './pages/finance/sales-invoices/edit';
import { SupplierInvoiceList } from './pages/finance/supplier-invoices/list';
import { SupplierInvoiceShow } from './pages/finance/supplier-invoices/show';
import { SupplierInvoiceEdit } from './pages/finance/supplier-invoices/edit';

// Master Data
import { ProductList } from './pages/master-data/products/list';
import { ProductShow } from './pages/master-data/products/show';
import { ProductCreate } from './pages/master-data/products/create';
import { ProductEdit } from './pages/master-data/products/edit';

// AI
import { ChatPanel } from './components/ai/ChatPanel';

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

                {/* AI */}
                <Route
                  path="/ai/chat"
                  element={
                    <div style={{ padding: 24 }}>
                      <ChatPanel />
                    </div>
                  }
                />

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
