import React from 'react';
import { Layout, Space, Button, Tooltip, theme } from 'antd';
import { useTranslation } from 'react-i18next';
import { useGetIdentity } from '@refinedev/core';
import { GlobalOutlined } from '@ant-design/icons';

const { Header: AntHeader } = Layout;

export const Header: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { data: user } = useGetIdentity<{ name: string; email: string }>();
  const { token } = theme.useToken();

  const toggleLang = () => {
    i18n.changeLanguage(i18n.language === 'zh-CN' ? 'en' : 'zh-CN');
  };

  return (
    <AntHeader
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: '0 24px',
        background: token.colorBgContainer,
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
        height: 'var(--header-height)',
      }}
    >
      <Space>
        <Tooltip title={i18n.language === 'zh-CN' ? 'Switch to English' : '切换到中文'}>
          <Button icon={<GlobalOutlined />} type="text" onClick={toggleLang}>
            {i18n.language === 'zh-CN' ? 'EN' : '中'}
          </Button>
        </Tooltip>
        {user?.name && (
          <span style={{ color: token.colorTextSecondary, fontSize: 14 }}>{user.name}</span>
        )}
      </Space>
    </AntHeader>
  );
};
