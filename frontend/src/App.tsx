import React, { useState, useEffect } from 'react';
import { Refine, Authenticated } from '@refinedev/core';
import { RefineThemes, ErrorComponent } from '@refinedev/antd';
import { BrowserRouter, Route, Routes, Outlet, Navigate } from 'react-router-dom';
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
  AppstoreOutlined,
  RobotOutlined,
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
            resources={[
              { name: 'procurement' },
              {
                name: 'purchase-orders',
                list: '/procurement/purchase-orders',
                show: '/procurement/purchase-orders/:id',
                edit: '/procurement/purchase-orders/:id/edit',
                create: '/procurement/purchase-orders/create',
                meta: {
                  parent: 'procurement',
                  icon: <ShoppingCartOutlined />,
                },
              },
              {
                name: 'suppliers',
                list: '/procurement/suppliers',
                meta: { parent: 'procurement' },
              },
              { name: 'sales' },
              {
                name: 'sales-orders',
                list: '/sales/sales-orders',
                show: '/sales/sales-orders/:id',
                meta: {
                  parent: 'sales',
                  icon: <ShopOutlined />,
                },
              },
              {
                name: 'customers',
                list: '/sales/customers',
                meta: { parent: 'sales' },
              },
              { name: 'inventory' },
              {
                name: 'stock-records',
                list: '/inventory/stock-records',
                meta: {
                  parent: 'inventory',
                  icon: <InboxOutlined />,
                },
              },
              { name: 'masterData' },
              {
                name: 'products',
                list: '/master-data/products',
                meta: { parent: 'masterData', icon: <AppstoreOutlined /> },
              },
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
