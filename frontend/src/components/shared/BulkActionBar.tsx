import React from 'react';
import { Space, Button, Typography, Dropdown } from 'antd';
import { CloseOutlined, DownOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

export interface BulkAction {
  key: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
}

interface BulkActionBarProps {
  selectedCount: number;
  actions: BulkAction[];
  onClear: () => void;
  /** When provided, renders the first action as a Dropdown button with these items */
  dropdownActions?: BulkAction[];
}

export const BulkActionBar: React.FC<BulkActionBarProps> = ({ selectedCount, actions, onClear, dropdownActions }) => {
  const { t } = useTranslation();

  if (selectedCount === 0) return null;

  return (
    <div
      style={{
        padding: '8px 16px',
        marginBottom: 8,
        background: '#e6f4ff',
        border: '1px solid #91caff',
        borderRadius: 6,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <Typography.Text style={{ color: '#1677ff', fontWeight: 500, whiteSpace: 'nowrap' }}>
        {t('buttons.selectedCount', { count: selectedCount })}
      </Typography.Text>
      <Space wrap>
        {dropdownActions ? (
          <Dropdown
            menu={{
              items: dropdownActions.map((a) => ({
                key: a.key,
                label: a.label,
                icon: a.icon,
                onClick: a.onClick,
              })),
            }}
          >
            <Button size="small" type="primary">
              {t('buttons.createFromSource')} <DownOutlined style={{ fontSize: 10 }} />
            </Button>
          </Dropdown>
        ) : (
          actions.map((action) => (
            <Button key={action.key} size="small" type="primary" icon={action.icon} onClick={action.onClick}>
              {action.label}
            </Button>
          ))
        )}
      </Space>
      <Button
        size="small"
        type="text"
        icon={<CloseOutlined />}
        onClick={onClear}
        style={{ marginLeft: 'auto', color: '#8c8c8c' }}
      >
        {t('buttons.clearSelection')}
      </Button>
    </div>
  );
};
