import React from 'react';
import { ThemedSiderV2 } from '@refinedev/antd';

export const Sider: React.FC = () => {
  return <ThemedSiderV2 Title={({ collapsed }) => (
    <div style={{ padding: collapsed ? '8px' : '8px 16px', fontWeight: 700, fontSize: 16, color: '#1677ff' }}>
      {collapsed ? 'ERP' : 'ERP Refine'}
    </div>
  )} />;
};
