import React, { useCallback } from 'react';
import { useSelect } from '@refinedev/antd';
import { Form, Input, Select, DatePicker, Button, Row, Col, Card, Space } from 'antd';
import { SearchOutlined, FilterOutlined, ClearOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { CrudFilter } from '@refinedev/core';
import dayjs from 'dayjs';

export interface FilterFieldConfig {
  type: 'search' | 'status' | 'select' | 'dateRange' | 'entity' | 'itemProduct';
  field: string;
  label: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  resource?: string;
  optionLabel?: string;
  optionValue?: string;
  span?: number;
}

export interface ListFiltersProps {
  config: FilterFieldConfig[];
  setFilters: (filters: CrudFilter[], behavior?: 'merge' | 'replace') => void;
}

function EntitySelect({ cfg }: { cfg: FilterFieldConfig }) {
  const labelField = cfg.optionLabel ?? 'name';
  const valueField = cfg.optionValue ?? 'id';
  const { selectProps } = useSelect({
    resource: cfg.resource!,
    optionLabel: (item) => (item as Record<string, unknown>)[labelField] as string,
    optionValue: (item) => (item as Record<string, unknown>)[valueField] as string,
  });
  return (
    <Select
      {...selectProps}
      allowClear
      showSearch
      placeholder={cfg.placeholder ?? cfg.label}
      style={{ width: '100%' }}
    />
  );
}

function ItemProductSelect({ cfg }: { cfg: FilterFieldConfig }) {
  const { selectProps } = useSelect({
    resource: 'products',
    optionLabel: (item) => (item as Record<string, unknown>)['name'] as string,
    optionValue: (item) => (item as Record<string, unknown>)['id'] as string,
  });
  return (
    <Select
      {...selectProps}
      allowClear
      showSearch
      placeholder={cfg.placeholder}
      style={{ width: '100%' }}
    />
  );
}

export const ListFilters: React.FC<ListFiltersProps> = ({ config, setFilters }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();

  const handleFilter = useCallback((values: Record<string, unknown>) => {
    const filters: CrudFilter[] = [];

    for (const cfg of config) {
      const val = values[cfg.field];
      if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) continue;

      switch (cfg.type) {
        case 'search':
          filters.push({ field: cfg.field, operator: 'contains', value: val });
          break;
        case 'status':
          if (Array.isArray(val)) {
            filters.push({ field: cfg.field, operator: 'in', value: val });
          } else {
            filters.push({ field: cfg.field, operator: 'eq', value: val });
          }
          break;
        case 'select':
          filters.push({ field: cfg.field, operator: 'eq', value: val });
          break;
        case 'dateRange': {
          const range = val as [dayjs.Dayjs, dayjs.Dayjs];
          if (range[0]) filters.push({ field: cfg.field, operator: 'gte', value: range[0].format('YYYY-MM-DD') });
          if (range[1]) filters.push({ field: cfg.field, operator: 'lte', value: range[1].format('YYYY-MM-DD') });
          break;
        }
        case 'entity':
          filters.push({ field: cfg.field, operator: 'eq', value: val });
          break;
        case 'itemProduct':
          filters.push({ field: cfg.field, operator: 'eq', value: val });
          break;
      }
    }

    setFilters(filters, 'replace');
  }, [config, setFilters]);

  const handleReset = useCallback(() => {
    form.resetFields();
    setFilters([], 'replace');
  }, [form, setFilters]);

  const renderField = (cfg: FilterFieldConfig) => {
    switch (cfg.type) {
      case 'search':
        return <Input prefix={<SearchOutlined />} placeholder={cfg.placeholder ?? t('filters.searchPlaceholder')} allowClear />;
      case 'status':
        return (
          <Select
            mode="multiple"
            allowClear
            placeholder={cfg.placeholder ?? t('filters.allStatus')}
            options={cfg.options}
            maxTagCount="responsive"
            style={{ width: '100%' }}
          />
        );
      case 'select':
        return (
          <Select
            allowClear
            placeholder={cfg.placeholder ?? t('filters.all')}
            options={cfg.options}
            style={{ width: '100%' }}
          />
        );
      case 'dateRange':
        return <DatePicker.RangePicker style={{ width: '100%' }} />;
      case 'entity':
        return <EntitySelect cfg={cfg} />;
      case 'itemProduct':
        return <ItemProductSelect cfg={cfg} />;
      default:
        return null;
    }
  };

  return (
    <Card size="small" style={{ marginBottom: 16 }}>
      <Form form={form} layout="vertical" onFinish={handleFilter}>
        <Row gutter={[16, 0]}>
          {config.map((cfg) => (
            <Col key={cfg.field} xs={24} sm={12} md={cfg.span ?? 6}>
              <Form.Item name={cfg.field} label={cfg.label} style={{ marginBottom: 12 }}>
                {renderField(cfg)}
              </Form.Item>
            </Col>
          ))}
          <Col xs={24} sm={12} md={6} style={{ display: 'flex', alignItems: 'end', marginBottom: 12 }}>
            <Space>
              <Button type="primary" htmlType="submit" icon={<FilterOutlined />}>
                {t('filters.filter')}
              </Button>
              <Button onClick={handleReset} icon={<ClearOutlined />}>
                {t('filters.reset')}
              </Button>
            </Space>
          </Col>
        </Row>
      </Form>
    </Card>
  );
};
