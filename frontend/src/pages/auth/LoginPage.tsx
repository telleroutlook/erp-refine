import React, { useState } from 'react';
import { useLogin, useIsAuthenticated } from '@refinedev/core';
import { Navigate } from 'react-router-dom';
import { Form, Input, Button, Divider, Typography, Tag, Grid } from 'antd';
import { UserOutlined, LockOutlined, SafetyOutlined, RobotOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Title, Text } = Typography;

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

const CHIP_COLORS: Record<string, { bg: string; color: string }> = {
  red:    { bg: '#FEE2E2', color: '#991B1B' },
  orange: { bg: '#FEF3C7', color: '#92400E' },
  blue:   { bg: '#DBEAFE', color: '#1E40AF' },
  purple: { bg: '#F3E8FF', color: '#6B21A8' },
  gold:   { bg: '#FEF3C7', color: '#92400E' },
  cyan:   { bg: '#CFFAFE', color: '#155E75' },
};

export const LoginPage: React.FC = () => {
  const { mutate: login, isLoading } = useLogin<{ email: string; password: string }>();
  const { data: authData } = useIsAuthenticated();
  const [form] = Form.useForm();
  const [loadingUser, setLoadingUser] = useState<string | null>(null);
  const { i18n } = useTranslation();
  const lang = i18n.language.startsWith('zh') ? 'zh' : 'en';
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;

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

  const formPanel = (
    <div style={{
      flex: isMobile ? 1 : '0 0 55%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: isMobile ? '32px 20px' : '48px 56px',
      maxWidth: isMobile ? undefined : 600,
      overflow: 'auto',
      background: '#FFFFFF',
    }}>
      {/* Language switcher */}
      <div style={{ position: 'absolute', top: 16, right: isMobile ? 16 : undefined, left: isMobile ? undefined : 16, zIndex: 1 }}>
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

      {/* Brand header — hidden on mobile where a separate header renders above */}
      {!isMobile && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <SafetyOutlined style={{ color: '#FFFFFF', fontSize: 16 }} />
            </div>
            <Title level={3} style={{ margin: 0, fontWeight: 700, color: '#0F172A' }}>
              ERP Refine
            </Title>
          </div>
          <Text style={{ fontSize: 13, color: '#64748B' }}>
            {t('Enterprise Resource Planning Portal', '企业资源计划管理门户')}
          </Text>
        </div>
      )}

      {/* Sign In heading */}
      <Title level={2} style={{ margin: '0 0 4px', fontWeight: 700, color: '#0F172A' }}>
        {t('Sign In', '登录')}
      </Title>
      <Text style={{ color: '#64748B', fontSize: 14, display: 'block', marginBottom: 24 }}>
        {t('Enter your credentials to access the ERP dashboard.', '输入您的凭证以访问 ERP 仪表板。')}
      </Text>

      {/* Login form */}
      <Form form={form} onFinish={handleFormLogin} size="large" layout="vertical">
        <Form.Item
          name="email"
          label={<span style={{ fontWeight: 500, color: '#0F172A' }}>{t('Email Address', '邮箱地址')}</span>}
          style={{ marginBottom: 16 }}
          rules={[{ required: true, type: 'email', message: t('Valid email required', '请输入有效邮箱') }]}
        >
          <Input
            prefix={<UserOutlined style={{ color: '#94A3B8' }} />}
            placeholder={t('your@email.com', '您的邮箱')}
            style={{ borderColor: '#E2E8F0' }}
          />
        </Form.Item>
        <Form.Item
          name="password"
          label={<span style={{ fontWeight: 500, color: '#0F172A' }}>{t('Password', '密码')}</span>}
          style={{ marginBottom: 20 }}
          rules={[{ required: true, message: t('Password required', '请输入密码') }]}
        >
          <Input.Password
            prefix={<LockOutlined style={{ color: '#94A3B8' }} />}
            placeholder="••••••••"
            style={{ borderColor: '#E2E8F0' }}
          />
        </Form.Item>
        <Form.Item style={{ marginBottom: 0 }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={isLoading && !loadingUser}
            block
            style={{ height: 48, fontWeight: 600, fontSize: 15 }}
          >
            {t('Enter Dashboard', '进入仪表板')} <ArrowRightOutlined />
          </Button>
        </Form.Item>
      </Form>

      {/* Quick login demo accounts */}
      {DEMO_PASSWORD && (
        <>
          <Divider style={{ margin: '20px 0 12px', fontSize: 12, color: '#94A3B8' }}>
            {t('SELECT ACCESS PORTAL', '选择访问入口')}
          </Divider>

          {orgGroups.map((org) => {
            const orgUsers = QUICK_USERS.filter((u) => u.org === org);
            const orgName = ORG_I18N[org]?.[lang] ?? org;
            return (
              <div key={org} style={{ marginBottom: 12 }}>
                <Text style={{
                  fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5,
                  fontWeight: 600, color: '#94A3B8',
                }}>
                  {orgName}
                </Text>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                  gap: 8,
                  marginTop: 6,
                }}>
                  {orgUsers.map((user) => {
                    const roleLabel = ROLE_I18N[user.role]?.[lang] ?? user.role;
                    const chip = CHIP_COLORS[user.roleColor] ?? CHIP_COLORS.blue;
                    return (
                      <Button
                        key={user.email}
                        size="middle"
                        loading={loadingUser === user.email}
                        disabled={!!loadingUser && loadingUser !== user.email}
                        onClick={() => handleQuickLogin(user)}
                        style={{
                          height: 'auto',
                          padding: '8px 12px',
                          borderRadius: 8,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          border: '1px solid #E2E8F0',
                          justifyContent: 'center',
                          flexDirection: 'column',
                        }}
                      >
                        <div style={{
                          width: 28, height: 28, borderRadius: 8,
                          background: chip.bg,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          marginBottom: 2,
                        }}>
                          <UserOutlined style={{ color: chip.color, fontSize: 13 }} />
                        </div>
                        <Text style={{ fontSize: 12, color: '#0F172A', fontWeight: 500 }}>{roleLabel}</Text>
                      </Button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* Footer */}
      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <Text style={{ fontSize: 11, color: '#CBD5E1' }}>
          ERP Refine v2.0 · {new Date().getFullYear()}
        </Text>
      </div>
    </div>
  );

  const decorativePanel = (
    <div style={{
      flex: '0 0 45%',
      background: '#F8FAFC',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '48px 40px',
      gap: 24,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Decorative circle */}
      <div style={{
        width: 180, height: 180, borderRadius: '50%',
        background: '#F1F5F9',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '1px solid #E2E8F0',
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: 16,
          background: '#0F172A',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <RobotOutlined style={{ color: '#FFFFFF', fontSize: 28 }} />
        </div>
      </div>

      {/* AI Feature card */}
      <div style={{ textAlign: 'center', maxWidth: 280 }}>
        <Tag style={{
          textTransform: 'uppercase', fontSize: 10, fontWeight: 600,
          letterSpacing: '0.5px', border: 'none', borderRadius: 4,
          background: '#DCFCE7', color: '#166534', marginBottom: 8,
        }}>
          {t('AI-POWERED', 'AI 驱动')}
        </Tag>
        <Title level={4} style={{ margin: '0 0 8px', fontWeight: 700, color: '#0F172A' }}>
          {t('Enterprise Intelligence', '企业智能')}
        </Title>
        <Text style={{ color: '#64748B', fontSize: 13, lineHeight: 1.6 }}>
          {t(
            'ERP Refine streamlines business operations using AI-powered analytics and real-time data synchronization.',
            'ERP Refine 利用 AI 驱动的分析和实时数据同步简化企业运营。'
          )}
        </Text>
      </div>

      {/* Secured badge */}
      <div style={{
        background: '#0F172A', borderRadius: 12, padding: '16px 24px',
        display: 'flex', alignItems: 'center', gap: 12, width: '100%', maxWidth: 280,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <SafetyOutlined style={{ color: '#FFFFFF', fontSize: 16 }} />
        </div>
        <div>
          <Text style={{ color: '#FFFFFF', fontWeight: 600, fontSize: 13, display: 'block' }}>
            {t('Secured Access', '安全访问')}
          </Text>
          <Text style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 11 }}>
            {t('Multi-tenant RLS protection', '多租户 RLS 保护')}
          </Text>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        background: '#F8FAFC',
      }}>
        {/* Mobile brand header */}
        <div style={{
          textAlign: 'center',
          padding: '40px 20px 16px',
          background: '#FFFFFF',
        }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <SafetyOutlined style={{ color: '#FFFFFF', fontSize: 14 }} />
            </div>
            <Title level={4} style={{ margin: 0, fontWeight: 700, color: '#0F172A' }}>
              ERP Refine
            </Title>
          </div>
          <Text style={{ display: 'block', fontSize: 12, color: '#64748B' }}>
            {t('Enterprise Resource Planning Portal', '企业资源计划管理门户')}
          </Text>
        </div>
        {formPanel}
      </div>
    );
  }

  return (
    <div style={{
      height: '100dvh',
      display: 'flex',
      overflow: 'hidden',
      background: '#FFFFFF',
    }}>
      {formPanel}
      {decorativePanel}
    </div>
  );
};
