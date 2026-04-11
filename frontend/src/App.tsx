import React from 'react';
import { Refine, Authenticated } from '@refinedev/core';
import { RefineThemes, ThemedLayoutV2, AuthPage, ErrorComponent } from '@refinedev/antd';
import { BrowserRouter, Route, Routes, Outlet, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import '@refinedev/antd/dist/reset.css';
import './i18n/i18n';

import { dataProvider } from './providers/data-provider';
import { authProvider } from './providers/auth-provider';
import { i18nProvider } from './providers/i18n-provider';
import { AppLayout } from './components/layout/AppLayout';

// Pages
import { PurchaseOrderList } from './pages/procurement/purchase-orders/list';
import { PurchaseOrderShow } from './pages/procurement/purchase-orders/show';
import { SalesOrderList } from './pages/sales/sales-orders/list';
import { StockRecordList } from './pages/inventory/index';
import { ChatPanel } from './components/ai/ChatPanel';

// Icons
import {
  ShoppingCartOutlined,
  ShopOutlined,
  InboxOutlined,
  AccountBookOutlined,
  AppstoreOutlined,
  RobotOutlined,
  FormOutlined,
} from '@ant-design/icons';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ConfigProvider theme={RefineThemes.Blue} locale={zhCN}>
        <AntApp>
          <Refine
            dataProvider={dataProvider}
            authProvider={authProvider}
            i18nProvider={i18nProvider}
            resources={[
              {
                name: 'purchase-orders',
                list: '/procurement/purchase-orders',
                show: '/procurement/purchase-orders/:id',
                edit: '/procurement/purchase-orders/:id/edit',
                create: '/procurement/purchase-orders/create',
                meta: {
                  label: '采购订单',
                  parent: 'procurement',
                  icon: <ShoppingCartOutlined />,
                },
              },
              {
                name: 'suppliers',
                list: '/procurement/suppliers',
                meta: { label: '供应商', parent: 'procurement' },
              },
              {
                name: 'sales-orders',
                list: '/sales/sales-orders',
                show: '/sales/sales-orders/:id',
                meta: {
                  label: '销售订单',
                  parent: 'sales',
                  icon: <ShopOutlined />,
                },
              },
              {
                name: 'customers',
                list: '/sales/customers',
                meta: { label: '客户', parent: 'sales' },
              },
              {
                name: 'stock-records',
                list: '/inventory/stock-records',
                meta: {
                  label: '库存余额',
                  parent: 'inventory',
                  icon: <InboxOutlined />,
                },
              },
              {
                name: 'products',
                list: '/master-data/products',
                meta: { label: '产品', parent: 'masterData', icon: <AppstoreOutlined /> },
              },
              {
                name: 'ai-chat',
                list: '/ai/chat',
                meta: { label: 'AI 助手', icon: <RobotOutlined /> },
              },
            ]}
            options={{ syncWithLocation: true, warnWhenUnsavedChanges: true }}
          >
            <Routes>
              <Route
                element={
                  <Authenticated key="auth-pages" fallback={<Outlet />}>
                    <Navigate to="/" replace />
                  </Authenticated>
                }
              >
                <Route path="/login" element={<AuthPage type="login" />} />
              </Route>

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
                <Route path="/procurement/purchase-orders/:id" element={<PurchaseOrderShow />} />

                {/* Sales */}
                <Route path="/sales/sales-orders" element={<SalesOrderList />} />

                {/* Inventory */}
                <Route path="/inventory/stock-records" element={<StockRecordList />} />

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
          </Refine>
        </AntApp>
      </ConfigProvider>
    </BrowserRouter>
  );
};

export default App;
