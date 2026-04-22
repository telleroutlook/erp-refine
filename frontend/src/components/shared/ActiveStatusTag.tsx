import React from 'react';
import { Tag } from 'antd';
import { useTranslation } from 'react-i18next';

interface ActiveStatusTagProps {
  value?: boolean | null;
}

export const ActiveStatusTag: React.FC<ActiveStatusTagProps> = ({ value }) => {
  const { t } = useTranslation();
  return (
    <Tag color={value !== false ? 'green' : 'default'}>
      {value !== false ? t('status.active') : t('status.inactive')}
    </Tag>
  );
};
