import React from 'react';
import { Tag } from 'antd';
import { useTranslation } from 'react-i18next';

interface ActiveStatusTagProps {
  value?: boolean | null;
}

export const ActiveStatusTag: React.FC<ActiveStatusTagProps> = ({ value }) => {
  const { t } = useTranslation();
  if (value === null || value === undefined) {
    return <Tag>{t('status.unknown')}</Tag>;
  }
  return (
    <Tag color={value ? 'green' : 'default'}>
      {value ? t('status.active') : t('status.inactive')}
    </Tag>
  );
};
