import React, { useState } from 'react';
import { useLogin, useIsAuthenticated } from '@refinedev/core';
import { Navigate } from 'react-router-dom';
import { Card, Form, Input, Button, Divider, Typography, Tag, Grid, theme } from 'antd';
import { UserOutlined, LockOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Title, Text } = Typography;

/*
 * INTENTIONAL DESIGN — NOT A SECURITY VULNERABILITY
 *
 * Demo account quick-login buttons are shown in ALL environments by design.
 * This is a demo/showcase application for portfolio and evaluation purposes.
 * Quick-login allows evaluators to instantly explore different ERP roles
 * without needing to know credentials. The demo password is loaded from
 * VITE_DEMO_PASSWORD env var, not hardcoded in source.
 *
 * For real production use, remove this section entirely.
 */

interface QuickUser {
  email: string;
  password: string;
  org: string;
  role: string;
  roleColor: string;
}

const DEMO_PASSWORD = import.meta.env.VITE_DEMO_PASSWORD ?? '';

const QUICK_USERS: QuickUser[] = [
  { email: 'admin@erp.demo',      password: DEMO_PASSWORD, org: 'DEFAULT', role: 'admin',               roleColor: 'red' },
  { email: 'manager@erp.demo',    password: DEMO_PASSWORD, org: 'DEFAULT', role: 'manager',             roleColor: 'orange' },
  { email: 'sales@erp.demo',      password: DEMO_PASSWORD, org: 'DEFAULT', role: 'sales_manager',       roleColor: 'blue' },
  { email: 'purchasing@erp.demo', password: DEMO_PASSWORD, org: 'DEFAULT', role: 'procurement_manager', roleColor: 'purple' },
  { email: 'finance@erp.demo',    password: DEMO_PASSWORD, org: 'DEFAULT', role: 'finance_manager',     roleColor: 'gold' },
  { email: 'warehouse@erp.demo',  password: DEMO_PASSWORD, org: 'DEFAULT', role: 'inventory_manager',   roleColor: 'cyan' },
  { email: 'admin@tech.demo',     password: DEMO_PASSWORD, org: 'TECH',    role: 'admin',               roleColor: 'red' },
  { email: 'finance@tech.demo',   password: DEMO_PASSWORD, org: 'TECH',    role: 'finance_manager',     roleColor: 'gold' },
  { email: 'sales@tech.demo',     password: DEMO_PASSWORD, org: 'TECH',    role: 'sales_manager',       roleColor: 'blue' },
];

const ROLE_I18N: Record<string, { en: string; zh: string }> = {
  admin:               { en: 'Admin',          zh: '管理员' },
  manager:             { en: 'Manager',        zh: '经理' },
  sales_manager:       { en: 'Sales',          zh: '销售' },
  procurement_manager: { en: 'Procurement',    zh: '采购' },
  finance_manager:     { en: 'Finance',        zh: '财务' },
  inventory_manager:   { en: 'Inventory',      zh: '库存' },
};

const ORG_I18N: Record<string, { en: string; zh: string }> = {
  DEFAULT: { en: 'Default Org',     zh: '默认组织' },
  TECH:    { en: 'Tech Innovation', zh: '科技创新' },
};

export const LoginPage: React.FC = () => {
  const { mutate: login, isLoading } = useLogin<{ email: string; password: string }>();
  const { data: authData } = useIsAuthenticated();
  const [form] = Form.useForm();
  const [loadingUser, setLoadingUser] = useState<string | null>(null);
  const { i18n } = useTranslation();
  const lang = i18n.language.startsWith('zh') ? 'zh' : 'en';
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.sm;
  const { token } = theme.useToken();

  if (authData?.authenticated) return <Navigate to="/" replace />;

  const t = (en: string, zh: string) => (lang === 'zh' ? zh : en);

  const handleQuickLogin = (user: QuickUser) => {
    setLoadingUser(user.email);
    login(
      { email: user.email, password: user.password },
      { onSettled: () => setLoadingUser(null) },
    );
  };

  const handleFormLogin = (values: { email: string; password: string }) => {
    login(values);
  };

  const orgGroups = Array.from(new Set(QUICK_USERS.map((u) => u.org)));

  return (
    <div
      style={{
        height: '100dvh',
        display: 'flex',
        alignItems: isMobile ? 'flex-end' : 'center',
        justifyContent: 'center',
        background: 'var(--login-gradient)',
        overflow: 'hidden',
        position: 'relative',
        padding: isMobile ? 0 : 16,
      }}
    >
      {/* Decorative blobs */}
      <div
        style={{
          position: 'absolute',
          top: -80,
          right: -80,
          width: 320,
          height: 320,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)',
          filter: 'blur(80px)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: -60,
          left: -60,
          width: 260,
          height: 260,
          borderRadius: '50%',
          background: 'rgba(102,126,234,0.25)',
          filter: 'blur(80px)',
          pointerEvents: 'none',
        }}
      />

      <Card
        style={{
          maxWidth: isMobile ? undefined : 460,
          width: '100%',
          borderRadius: isMobile ? '20px 20px 0 0' : 16,
          border: 'none',
          boxShadow: 'var(--login-card-shadow)',
          position: 'relative',
        }}
        styles={{ body: { padding: isMobile ? '20px 20px 24px' : '24px 28px 20px' } }}
      >
        {/* Language switcher */}
        <div style={{ position: 'absolute', top: 16, right: isMobile ? 16 : 20, zIndex: 1 }}>
          <Button.Group size="small">
            <Button
              type={lang === 'en' ? 'primary' : 'default'}
              onClick={() => i18n.changeLanguage('en')}
              style={{ fontSize: 12, padding: '0 8px' }}
            >
              EN
            </Button>
            <Button
              type={lang === 'zh' ? 'primary' : 'default'}
              onClick={() => i18n.changeLanguage('zh-CN')}
              style={{ fontSize: 12, padding: '0 8px' }}
            >
              中
            </Button>
          </Button.Group>
        </div>

        {/* Brand header */}
        <div style={{ textAlign: 'center', marginBottom: 4 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: 12,
              background: 'var(--ai-gradient)',
              marginBottom: 8,
              boxShadow: 'var(--login-icon-glow)',
            }}
          >
            <ThunderboltOutlined style={{ color: '#fff', fontSize: 18 }} />
          </div>
          <Title level={4} style={{ margin: 0, fontWeight: 600 }}>
            ERP Refine
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            {t('Multi-tenant ERP Demo', '多租户 ERP 演示系统')}
          </Text>
        </div>

        {/* INTENTIONAL: Demo buttons shown in all environments — see file header */}
        <Divider style={{ margin: '12px 0 8px', fontSize: 12 }}>
          <ThunderboltOutlined style={{ color: token.colorWarning, marginRight: 4 }} />
          {t('Demo Accounts', '演示账号')}
        </Divider>

        {orgGroups.map((org) => {
          const orgUsers = QUICK_USERS.filter((u) => u.org === org);
          const orgName = ORG_I18N[org]?.[lang] ?? org;
          return (
            <div key={org} style={{ marginBottom: 10 }}>
              <Text
                type="secondary"
                style={{
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  fontWeight: 500,
                }}
              >
                {orgName}
              </Text>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 6,
                  marginTop: 6,
                }}
              >
                {orgUsers.map((user) => {
                  const roleLabel = ROLE_I18N[user.role]?.[lang] ?? user.role;
                  const emailPrefix = user.email.split('@')[0];
                  return (
                    <Button
                      key={user.email}
                      size="small"
                      loading={loadingUser === user.email}
                      disabled={!!loadingUser && loadingUser !== user.email}
                      onClick={() => handleQuickLogin(user)}
                      style={{
                        height: 'auto',
                        padding: '5px 10px',
                        borderRadius: 8,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        border: `1px solid ${token.colorBorderSecondary}`,
                        flexBasis: isMobile ? 'calc(50% - 3px)' : undefined,
                        justifyContent: 'flex-start',
                      }}
                    >
                      <Tag
                        color={user.roleColor}
                        style={{ margin: 0, fontSize: 11, lineHeight: '18px', borderRadius: 4 }}
                      >
                        {roleLabel}
                      </Tag>
                      <Text style={{ fontSize: 11, color: token.colorTextSecondary }}>{emailPrefix}</Text>
                    </Button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Manual login form */}
        <Divider style={{ margin: '8px 0', fontSize: 12 }}>
          {t('Or sign in manually', '或手动登录')}
        </Divider>

        <Form form={form} onFinish={handleFormLogin} size="middle">
          <Form.Item
            name="email"
            style={{ marginBottom: 8 }}
            rules={[
              {
                required: true,
                type: 'email',
                message: t('Valid email required', '请输入有效邮箱'),
              },
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder={t('Email', '邮箱')} />
          </Form.Item>
          <Form.Item
            name="password"
            style={{ marginBottom: 12 }}
            rules={[
              {
                required: true,
                message: t('Password required', '请输入密码'),
              },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder={t('Password', '密码')} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" loading={isLoading && !loadingUser} block>
              {t('Sign In', '登录')}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};
