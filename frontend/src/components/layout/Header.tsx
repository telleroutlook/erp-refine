import React from 'react';
import { Layout, Space, Button, Tooltip, Grid, theme } from 'antd';
import { useTranslation } from 'react-i18next';
import { useGetIdentity, useMenu, useLink } from '@refinedev/core';
import { GlobalOutlined, BarsOutlined } from '@ant-design/icons';
import { useThemedLayoutContext } from '@refinedev/antd';

const { Header: AntHeader } = Layout;

export const Header: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { data: user } = useGetIdentity<{ name: string; email: string }>();
  const { token } = theme.useToken();
  const breakpoint = Grid.useBreakpoint();
  const isMobile = typeof breakpoint.lg === 'undefined' ? false : !breakpoint.lg;
  const { setMobileSiderOpen } = useThemedLayoutContext();
  const { menuItems, selectedKey } = useMenu();
  const Link = useLink();

  const toggleLang = () => {
    i18n.changeLanguage(i18n.language === 'zh-CN' ? 'en' : 'zh-CN');
  };

  const breadcrumbs: { label: string; href?: string }[] = [];
  if (!isMobile) {
    for (const parent of menuItems) {
      const child = parent.children.find((c) => c.key === selectedKey);
      if (child) {
        breadcrumbs.push({ label: parent.label as string });
        breadcrumbs.push({ label: child.label as string, href: child.route });
        break;
      }
    }
    if (breadcrumbs.length === 0) {
      const topLevel = menuItems.find((m) => m.key === selectedKey);
      if (topLevel) {
        breadcrumbs.push({ label: topLevel.label as string });
      }
    }
  }

  return (
    <AntHeader
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isMobile ? '0 12px' : '0 24px',
        background: token.colorBgContainer,
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
        height: 'var(--header-height)',
        boxShadow: 'var(--header-shadow)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Left side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
        {isMobile && (
          <Button
            type="text"
            icon={<BarsOutlined style={{ fontSize: 18 }} />}
            onClick={() => setMobileSiderOpen(true)}
            style={{ flexShrink: 0 }}
          />
        )}
        {!isMobile && breadcrumbs.length > 0 && (
          <nav className="erp-breadcrumbs" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, overflow: 'hidden' }}>
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <React.Fragment key={idx}>
                  {idx > 0 && <span style={{ color: token.colorTextQuaternary, margin: '0 2px' }}>/</span>}
                  {isLast || !crumb.href ? (
                    <span style={{
                      color: isLast ? token.colorText : token.colorTextSecondary,
                      fontWeight: isLast ? 500 : 400,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {crumb.label}
                    </span>
                  ) : (
                    <Link to={crumb.href} style={{
                      color: token.colorTextSecondary,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {crumb.label}
                    </Link>
                  )}
                </React.Fragment>
              );
            })}
          </nav>
        )}
      </div>

      {/* Right side */}
      <Space size={isMobile ? 4 : 8} style={{ flexShrink: 0 }}>
        <Tooltip title={i18n.language === 'zh-CN' ? 'Switch to English' : '切换到中文'}>
          <Button icon={<GlobalOutlined />} type="text" onClick={toggleLang} size={isMobile ? 'small' : 'middle'}>
            {isMobile ? '' : (i18n.language === 'zh-CN' ? 'EN' : '中')}
          </Button>
        </Tooltip>
        {!isMobile && user?.name && (
          <span style={{ color: token.colorTextSecondary, fontSize: 14 }}>{user.name}</span>
        )}
      </Space>
    </AntHeader>
  );
};
