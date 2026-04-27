import React from 'react';
import { Spin } from 'antd';

export const PageSpinner: React.FC = () => (
  <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />
);
