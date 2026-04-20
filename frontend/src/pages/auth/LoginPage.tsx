import React, { useState } from 'react';
import { useLogin, useIsAuthenticated } from '@refinedev/core';
import { Navigate } from 'react-router-dom';
import { Card, Form, Input, Button, Divider, Typography, Space, Tag, Row, Col, Select } from 'antd';
import { UserOutlined, LockOutlined, ThunderboltOutlined, GlobalOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Title, Text } = Typography;

interface QuickUser {
  email: string;
  password: string;
  org: string;
  orgLabel: string;
  role: string;
  roleLabel: string;
  roleColor: string;
}

const DEMO_PASSWORD = import.meta.env.VITE_DEMO_PASSWORD ?? '';

const QUICK_USERS: QuickUser[] = [
  // Org 1: 默认组织 / Default Org
  { email: 'admin@erp.demo',      password: DEMO_PASSWORD, org: 'DEFAULT', orgLabel: 'Default Org',  role: 'admin',              roleLabel: 'Admin',              roleColor: 'red' },
  { email: 'manager@erp.demo',    password: DEMO_PASSWORD, org: 'DEFAULT', orgLabel: 'Default Org',  role: 'manager',            roleLabel: 'Manager',            roleColor: 'orange' },
  { email: 'sales@erp.demo',      password: DEMO_PASSWORD, org: 'DEFAULT', orgLabel: 'Default Org',  role: 'sales_manager',      roleLabel: 'Sales Mgr',          roleColor: 'blue' },
  { email: 'purchasing@erp.demo', password: DEMO_PASSWORD, org: 'DEFAULT', orgLabel: 'Default Org',  role: 'procurement_manager', roleLabel: 'Procurement Mgr',   roleColor: 'purple' },
  { email: 'finance@erp.demo',    password: DEMO_PASSWORD, org: 'DEFAULT', orgLabel: 'Default Org',  role: 'finance_manager',    roleLabel: 'Finance Mgr',        roleColor: 'gold' },
  { email: 'warehouse@erp.demo',  password: DEMO_PASSWORD, org: 'DEFAULT', orgLabel: 'Default Org',  role: 'inventory_manager',  roleLabel: 'Inventory Mgr',      roleColor: 'cyan' },
  // Org 2: Tech Innovation Inc
  { email: 'admin@tech.demo',     password: DEMO_PASSWORD, org: 'TECH',    orgLabel: 'Tech Innovation', role: 'admin',            roleLabel: 'Admin',              roleColor: 'red' },
  { email: 'finance@tech.demo',   password: DEMO_PASSWORD, org: 'TECH',    orgLabel: 'Tech Innovation', role: 'finance_manager',  roleLabel: 'Finance Mgr',        roleColor: 'gold' },
  { email: 'sales@tech.demo',     password: DEMO_PASSWORD, org: 'TECH',    orgLabel: 'Tech Innovation', role: 'sales_manager',    roleLabel: 'Sales Mgr',          roleColor: 'blue' },
];

const ROLE_I18N: Record<string, { en: string; zh: string }> = {
  admin:               { en: 'Admin',          zh: '系统管理员' },
  manager:             { en: 'Manager',         zh: '部门经理' },
  sales_manager:       { en: 'Sales Mgr',       zh: '销售经理' },
  procurement_manager: { en: 'Procurement Mgr', zh: '采购经理' },
  finance_manager:     { en: 'Finance Mgr',     zh: '财务经理' },
  inventory_manager:   { en: 'Inventory Mgr',   zh: '库存经理' },
};

const ORG_I18N: Record<string, { en: string; zh: string }> = {
  DEFAULT: { en: 'Default Org',       zh: '默认组织' },
  TECH:    { en: 'Tech Innovation',   zh: '科技创新公司' },
};

export const LoginPage: React.FC = () => {
  const { mutate: login, isLoading } = useLogin<{ email: string; password: string }>();
  const { data: authData } = useIsAuthenticated();
  const [form] = Form.useForm();
  const [loadingUser, setLoadingUser] = useState<string | null>(null);
  const { i18n } = useTranslation();
  const lang = i18n.language.startsWith('zh') ? 'zh' : 'en';

  if (authData?.authenticated) return <Navigate to="/" replace />;

  const t = (en: string, zh: string) => (lang === 'zh' ? zh : en);

  const handleQuickLogin = (user: QuickUser) => {
    setLoadingUser(user.email);
    login(
      { email: user.email, password: user.password },
      { onSettled: () => setLoadingUser(null) }
    );
  };

  const handleFormLogin = (values: { email: string; password: string }) => {
    login(values);
  };

  const orgGroups = Array.from(new Set(QUICK_USERS.map((u) => u.org)));

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '24px',
      }}
    >
      {/* Language switcher */}
      <div style={{ position: 'fixed', top: 16, right: 16 }}>
        <Select
          value={i18n.language}
          size="small"
          style={{ width: 100 }}
          suffixIcon={<GlobalOutlined />}
          onChange={(val) => i18n.changeLanguage(val)}
          options={[
            { value: 'en', label: 'English' },
            { value: 'zh-CN', label: '中文' },
          ]}
        />
      </div>

      <div style={{ width: '100%', maxWidth: 900 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2} style={{ color: '#fff', margin: 0 }}>
            ERP Refine
          </Title>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
            {t('Multi-tenant ERP system — test environment', '多租户ERP系统 — 测试环境')}
          </Text>
        </div>

        <Row gutter={24}>
          {/* Quick login panel */}
          <Col xs={24} md={14}>
            <Card
              title={
                <Space>
                  <ThunderboltOutlined style={{ color: '#faad14' }} />
                  <span>{t('Quick Login', '快捷登录')}</span>
                </Space>
              }
              style={{ borderRadius: 12 }}
              bodyStyle={{ paddingTop: 12 }}
            >
              {orgGroups.map((org) => {
                const orgUsers = QUICK_USERS.filter((u) => u.org === org);
                const orgName = ORG_I18N[org]?.[lang] ?? org;
                return (
                  <div key={org} style={{ marginBottom: 16 }}>
                    <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>
                      {orgName}
                    </Text>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                      {orgUsers.map((user) => {
                        const roleLabel = ROLE_I18N[user.role]?.[lang] ?? user.roleLabel;
                        return (
                          <Button
                            key={user.email}
                            size="small"
                            loading={loadingUser === user.email}
                            disabled={!!loadingUser && loadingUser !== user.email}
                            onClick={() => handleQuickLogin(user)}
                            style={{ height: 'auto', padding: '4px 10px', borderRadius: 6 }}
                          >
                            <Space size={4} direction="vertical" style={{ lineHeight: 1.2 }}>
                              <Tag color={user.roleColor} style={{ margin: 0, fontSize: 11 }}>
                                {roleLabel}
                              </Tag>
                              <Text style={{ fontSize: 10, color: '#888' }}>{user.email}</Text>
                            </Space>
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              <Divider style={{ margin: '8px 0 4px' }} />
              <Text type="secondary" style={{ fontSize: 11 }}>
                {t('All demo accounts use password: ', '所有演示账号密码：')}
                <Text code style={{ fontSize: 11 }}>Admin2026!</Text>
              </Text>
            </Card>
          </Col>

          {/* Manual login form */}
          <Col xs={24} md={10}>
            <Card
              title={
                <Space>
                  <UserOutlined />
                  <span>{t('Sign In', '账号登录')}</span>
                </Space>
              }
              style={{ borderRadius: 12 }}
            >
              <Form form={form} layout="vertical" onFinish={handleFormLogin} size="middle">
                <Form.Item
                  name="email"
                  label={t('Email', '邮箱')}
                  rules={[{ required: true, type: 'email', message: t('Please enter a valid email', '请输入有效邮箱') }]}
                >
                  <Input prefix={<UserOutlined />} placeholder="user@example.com" />
                </Form.Item>
                <Form.Item
                  name="password"
                  label={t('Password', '密码')}
                  rules={[{ required: true, message: t('Please enter your password', '请输入密码') }]}
                >
                  <Input.Password prefix={<LockOutlined />} placeholder="••••••••" />
                </Form.Item>
                <Form.Item style={{ marginBottom: 0 }}>
                  <Button type="primary" htmlType="submit" loading={isLoading && !loadingUser} block>
                    {t('Sign In', '登录')}
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};
