import React from 'react';
import { BarsOutlined, AppstoreOutlined, RobotOutlined } from '@ant-design/icons';
import { useTranslate } from '@refinedev/core';
import type { MobilePanel } from '../../hooks/useMobileLayout';

interface MobileTabBarProps {
  activePanel: MobilePanel;
  onSwitch: (panel: MobilePanel) => void;
}

const tabs: { key: MobilePanel; icon: React.ReactNode; labelKey: string }[] = [
  { key: 'nav', icon: <BarsOutlined />, labelKey: 'layout.menu' },
  { key: 'content', icon: <AppstoreOutlined />, labelKey: 'layout.content' },
  { key: 'ai', icon: <RobotOutlined />, labelKey: 'layout.aiAssistant' },
];

export const MobileTabBar: React.FC<MobileTabBarProps> = ({ activePanel, onSwitch }) => {
  const translate = useTranslate();

  return (
    <div className="erp-mobile-tab-bar">
      {tabs.map((tab) => (
        <div
          key={tab.key}
          className={`erp-mobile-tab-bar__item${activePanel === tab.key ? ' erp-mobile-tab-bar__item--active' : ''}`}
          onClick={() => onSwitch(tab.key)}
        >
          {tab.icon}
          <span>{translate(tab.labelKey, tab.labelKey.split('.')[1])}</span>
        </div>
      ))}
    </div>
  );
};
