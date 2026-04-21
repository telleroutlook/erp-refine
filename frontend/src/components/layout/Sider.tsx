import React, { useState, useEffect, useMemo, useContext } from 'react';
import { Layout, Menu, Grid, Drawer, Button, theme, ConfigProvider } from 'antd';
import {
  LogoutOutlined,
  BarsOutlined,
  LeftOutlined,
  RightOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import {
  useTranslate,
  useLogout,
  type ITreeMenu,
  useIsExistAuthentication,
  useMenu,
  useRefineContext,
  useLink,
  useActiveAuthProvider,
  pickNotDeprecated,
  useWarnAboutChange,
} from '@refinedev/core';
import { useThemedLayoutContext } from '@refinedev/antd';

export const Sider: React.FC = () => {
  const { token } = theme.useToken();
  const direction = useContext(ConfigProvider.ConfigContext)?.direction;

  const {
    siderCollapsed,
    setSiderCollapsed,
    mobileSiderOpen,
    setMobileSiderOpen,
  } = useThemedLayoutContext();

  const { menuItems, selectedKey, defaultOpenKeys } = useMenu();
  const translate = useTranslate();
  const Link = useLink();
  const isExistAuthentication = useIsExistAuthentication();
  const authProvider = useActiveAuthProvider();
  const { mutate: mutateLogout } = useLogout({
    v3LegacyAuthProviderCompatible: Boolean(authProvider?.isLegacy),
  });
  const { hasDashboard } = useRefineContext();
  const { warnWhen, setWarnWhen } = useWarnAboutChange();
  const breakpoint = Grid.useBreakpoint();
  const isMobile = typeof breakpoint.lg === 'undefined' ? false : !breakpoint.lg;

  const rootKeys = useMemo(
    () => menuItems.filter((item) => item.children.length > 0).map((item) => item.key),
    [menuItems],
  );

  const [openKeys, setOpenKeys] = useState<string[]>(() => {
    if (defaultOpenKeys.length > 0) return [defaultOpenKeys[defaultOpenKeys.length - 1]];
    return [];
  });

  useEffect(() => {
    if (siderCollapsed) {
      setOpenKeys([]);
      return;
    }
    const parentKey = menuItems.find((item) =>
      item.children.some((child) => child.key === selectedKey),
    )?.key;
    if (parentKey) {
      setOpenKeys([parentKey]);
    }
  }, [selectedKey, siderCollapsed]);

  const onOpenChange = (keys: string[]) => {
    const latestOpenKey = keys.find((key) => !openKeys.includes(key));
    if (latestOpenKey && rootKeys.includes(latestOpenKey)) {
      setOpenKeys([latestOpenKey]);
    } else {
      setOpenKeys(keys);
    }
  };

  const handleLogout = () => {
    if (warnWhen) {
      const confirm = window.confirm(
        translate(
          'warnWhenUnsavedChanges',
          'Are you sure you want to leave? You have unsaved changes.',
        ),
      );
      if (confirm) {
        setWarnWhen(false);
        mutateLogout();
      }
    } else {
      mutateLogout();
    }
  };

  const renderTreeView = (tree: ITreeMenu[], activeKey?: string) => {
    return tree.map((item: ITreeMenu) => {
      const { icon, label, route, key, name, children, parentName, meta, options } = item;

      if (children.length > 0) {
        return (
          <Menu.SubMenu key={key} icon={icon ?? <UnorderedListOutlined />} title={label}>
            {renderTreeView(children, activeKey)}
          </Menu.SubMenu>
        );
      }

      const isSelected = key === activeKey;
      const isRoute = !(
        pickNotDeprecated(meta?.parent, options?.parent, parentName) !== undefined &&
        children.length === 0
      );

      return (
        <Menu.Item key={key} icon={icon ?? (isRoute && <UnorderedListOutlined />)}>
          <Link to={route ?? ''}>{label}</Link>
          {!siderCollapsed && isSelected && <div className="ant-menu-tree-arrow" />}
        </Menu.Item>
      );
    });
  };

  const renderMenu = () => (
    <div className="erp-sider-menu-scroll" style={{ overflow: 'auto', height: 'calc(100% - 56px)' }}>
      <Menu
        className="erp-accordion-menu"
        mode="inline"
        selectedKeys={selectedKey ? [selectedKey] : []}
        openKeys={siderCollapsed ? [] : openKeys}
        onOpenChange={onOpenChange}
        onClick={() => setMobileSiderOpen(false)}
        style={{ paddingTop: 4, border: 'none' }}
      >
        {hasDashboard && (
          <Menu.Item key="dashboard" icon={<UnorderedListOutlined />}>
            <Link to="/">{translate('dashboard.title', 'Dashboard')}</Link>
          </Menu.Item>
        )}
        {renderTreeView(menuItems, selectedKey)}
        {isExistAuthentication && (
          <Menu.Item key="logout" onClick={handleLogout} icon={<LogoutOutlined />}>
            {translate('buttons.logout', 'Logout')}
          </Menu.Item>
        )}
      </Menu>
    </div>
  );

  const titleStyle: React.CSSProperties = {
    height: 56,
    display: 'flex',
    alignItems: 'center',
    justifyContent: siderCollapsed ? 'center' : 'flex-start',
    padding: siderCollapsed ? '0' : '0 16px',
    fontWeight: 700,
    fontSize: 16,
    color: token.colorPrimary,
    borderBottom: `1px solid ${token.colorBorderSecondary}`,
    flexShrink: 0,
  };

  const renderClosingIcons = () => {
    const iconProps = { style: { color: token.colorPrimary } };
    const OpenIcon = direction === 'rtl' ? RightOutlined : LeftOutlined;
    const CollapsedIcon = direction === 'rtl' ? LeftOutlined : RightOutlined;
    const IconComponent = siderCollapsed ? CollapsedIcon : OpenIcon;
    return <IconComponent {...iconProps} />;
  };

  if (isMobile) {
    return (
      <>
        <Drawer
          open={mobileSiderOpen}
          onClose={() => setMobileSiderOpen(false)}
          placement={direction === 'rtl' ? 'right' : 'left'}
          closable={false}
          width={240}
          bodyStyle={{ padding: 0 }}
          maskClosable
        >
          <Layout>
            <Layout.Sider
              style={{
                height: '100vh',
                backgroundColor: token.colorBgContainer,
                borderRight: `1px solid ${token.colorBorderSecondary}`,
              }}
              width={240}
            >
              <div style={titleStyle}>ERP Refine</div>
              {renderMenu()}
            </Layout.Sider>
          </Layout>
        </Drawer>
        <Button
          size="large"
          onClick={() => setMobileSiderOpen(true)}
          icon={<BarsOutlined />}
          style={{
            position: 'fixed',
            top: 12,
            left: 12,
            zIndex: 999,
            borderRadius: token.borderRadius,
          }}
        />
      </>
    );
  }

  return (
    <Layout.Sider
      style={{
        backgroundColor: token.colorBgContainer,
        borderRight: `1px solid ${token.colorBorderSecondary}`,
      }}
      collapsible
      collapsed={siderCollapsed}
      onCollapse={(collapsed, type) => {
        if (type === 'clickTrigger') setSiderCollapsed(collapsed);
      }}
      collapsedWidth={80}
      breakpoint="lg"
      trigger={
        <Button
          type="text"
          style={{
            borderRadius: 0,
            height: '100%',
            width: '100%',
            backgroundColor: token.colorBgElevated,
          }}
        >
          {renderClosingIcons()}
        </Button>
      }
    >
      <div style={titleStyle}>{siderCollapsed ? 'ERP' : 'ERP Refine'}</div>
      {renderMenu()}
    </Layout.Sider>
  );
};
