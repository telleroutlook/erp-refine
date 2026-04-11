import React from 'react';
import { ThemedLayoutV2 } from '@refinedev/antd';
import { Sider } from './Sider';
import { Header } from './Header';

export const AppLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <ThemedLayoutV2
      Header={Header}
      Sider={Sider}
    >
      {children}
    </ThemedLayoutV2>
  );
};
