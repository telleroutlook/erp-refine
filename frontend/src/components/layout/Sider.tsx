import React from 'react';
import { ThemedSiderV2 } from '@refinedev/antd';
import { theme } from 'antd';

export const Sider: React.FC = () => {
  const { token } = theme.useToken();

  return (
    <ThemedSiderV2
      Title={({ collapsed }) => (
        <div
          style={{
            padding: collapsed ? '8px' : '8px 16px',
            fontWeight: 700,
            fontSize: 16,
            color: token.colorPrimary,
          }}
        >
          {collapsed ? 'ERP' : 'ERP Refine'}
        </div>
      )}
    />
  );
};
