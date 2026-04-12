import React from 'react';
import { Tag } from 'antd';

interface ActiveStatusTagProps {
  value?: boolean | null;
}

export const ActiveStatusTag: React.FC<ActiveStatusTagProps> = ({ value }) => (
  <Tag color={value !== false ? 'green' : 'default'}>
    {value !== false ? '启用' : '停用'}
  </Tag>
);
