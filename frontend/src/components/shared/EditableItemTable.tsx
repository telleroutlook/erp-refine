import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useCreate, useUpdate, useDelete, useInvalidate } from '@refinedev/core';
import { Table, Divider, Button, Input, InputNumber, Select, Popconfirm, Space, DatePicker, message } from 'antd';
import { PlusOutlined, DeleteOutlined, SaveOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';

export interface ColumnConfig {
  dataIndex: string | string[];
  title: string;
  width?: number;
  align?: 'left' | 'right' | 'center';
  editable?: boolean;
  inputType?: 'text' | 'number' | 'select' | 'date';
  selectOptions?: { label: string; value: any }[];
  render?: (value: any, record: any) => React.ReactNode;
  /** For computed display columns: derive value from current row state */
  computed?: (rowState: Record<string, any>, originalRecord: any) => any;
}

export interface ProductInfo {
  id: string;
  code: string;
  name: string;
  uom?: string;
  cost_price?: number;
  sale_price?: number;
}

interface EditableItemTableProps {
  resource: string;
  parentResource: string;
  parentId: string | undefined;
  parentFk: string;
  items: any[];
  columns: ColumnConfig[];
  title: string;
  /** Map of product_id → ProductInfo for auto-fill on product change */
  productsMap?: Map<string, ProductInfo>;
  /** Which price field to auto-fill when product changes */
  priceField?: 'cost_price' | 'sale_price';
}

let _tempSeq = 0;
const nextTempId = () => `__new_${++_tempSeq}`;

export const EditableItemTable: React.FC<EditableItemTableProps> = ({
  resource,
  parentResource,
  parentId,
  parentFk,
  items,
  columns,
  title,
  productsMap,
  priceField,
}) => {
  const { t } = useTranslation();
  const [edits, setEdits] = useState<Record<string, Record<string, any>>>({});
  const [newRows, setNewRows] = useState<{ tempId: string; values: Record<string, any> }[]>([]);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const { mutateAsync: createAsync } = useCreate();
  const { mutateAsync: updateAsync } = useUpdate();
  const { mutateAsync: deleteAsync } = useDelete();
  const invalidate = useInvalidate();

  const isDirty = Object.keys(edits).length > 0 || newRows.length > 0 || deletedIds.size > 0;
  const isDirtyRef = useRef(isDirty);
  isDirtyRef.current = isDirty;

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirtyRef.current) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  useEffect(() => {
    if (!isDirty) return;
    const orig = window.history.pushState;
    window.history.pushState = function (...args) {
      if (isDirtyRef.current && !window.confirm(t('messages.unsavedChanges'))) return;
      return orig.apply(this, args);
    };
    return () => { window.history.pushState = orig; };
  }, [isDirty]);

  const flatKey = (di: string | string[]) => (Array.isArray(di) ? di.join('.') : di);
  const getNestedValue = (obj: any, path: string | string[]): any => {
    const keys = Array.isArray(path) ? path : [path];
    return keys.reduce((o, k) => o?.[k], obj);
  };
  const fieldName = (di: string | string[]) => Array.isArray(di) ? di[di.length - 1] : di;

  /** Get the effective value of a field for a row, considering edits */
  const getRowState = (recordId: string, record: any): Record<string, any> => {
    const state: Record<string, any> = {};
    columns.forEach((col) => {
      const key = flatKey(col.dataIndex);
      const editVal = edits[recordId]?.[key];
      state[key] = editVal !== undefined ? editVal : getNestedValue(record, col.dataIndex);
    });
    return state;
  };

  const getNewRowState = (tempId: string): Record<string, any> => {
    const row = newRows.find((r) => r.tempId === tempId);
    return row?.values ?? {};
  };

  /** Apply side-effects when product_id changes */
  const applyProductSideEffects = (productId: string | undefined): Record<string, any> => {
    if (!productId || !productsMap) return {};
    const product = productsMap.get(productId);
    if (!product) return {};
    const sideEffects: Record<string, any> = {
      'product.name': product.name,
      'product.code': product.code,
      'product.uom': product.uom,
    };
    if (priceField && product[priceField] != null) {
      sideEffects['unit_price'] = product[priceField];
    }
    return sideEffects;
  };

  const updateCell = (recordId: string, col: ColumnConfig, value: any) => {
    const key = flatKey(col.dataIndex);
    setEdits((prev) => {
      const rowEdits = { ...prev[recordId], [key]: value };
      if (key === 'product_id') {
        Object.assign(rowEdits, applyProductSideEffects(value));
      }
      return { ...prev, [recordId]: rowEdits };
    });
  };

  const updateNewRowCell = (tempId: string, col: ColumnConfig, value: any) => {
    const key = flatKey(col.dataIndex);
    setNewRows((prev) =>
      prev.map((r) => {
        if (r.tempId !== tempId) return r;
        const newVals = { ...r.values, [key]: value };
        if (key === 'product_id') {
          Object.assign(newVals, applyProductSideEffects(value));
        }
        return { ...r, values: newVals };
      })
    );
  };

  const addRow = () => setNewRows((prev) => [...prev, { tempId: nextTempId(), values: {} }]);
  const removeNewRow = (tempId: string) => setNewRows((prev) => prev.filter((r) => r.tempId !== tempId));

  const markDeleted = (id: string) => {
    setDeletedIds((prev) => new Set(prev).add(id));
    setEdits((prev) => { const next = { ...prev }; delete next[id]; return next; });
  };

  const refresh = useCallback(() => {
    invalidate({ resource: parentResource, invalidates: ['detail'], id: parentId });
  }, [invalidate, parentResource, parentId]);

  const saveAll = async () => {
    if (!parentId) return;
    setSaving(true);
    try {
      const promises: Promise<any>[] = [];

      for (const id of deletedIds) {
        promises.push(deleteAsync({ resource, id }));
      }

      for (const [id, changes] of Object.entries(edits)) {
        if (deletedIds.has(id)) continue;
        const values: Record<string, any> = {};
        columns.forEach((col) => {
          if (!col.editable) return;
          const key = flatKey(col.dataIndex);
          if (key in changes) values[fieldName(col.dataIndex)] = changes[key];
        });
        if (Object.keys(values).length > 0) {
          promises.push(updateAsync({ resource, id, values }));
        }
      }

      for (const row of newRows) {
        const values: Record<string, any> = { [parentFk]: parentId };
        columns.forEach((col) => {
          if (!col.editable) return;
          const key = flatKey(col.dataIndex);
          if (row.values[key] !== undefined) values[fieldName(col.dataIndex)] = row.values[key];
        });
        promises.push(createAsync({ resource, values }));
      }

      await Promise.all(promises);
      setEdits({});
      setNewRows([]);
      setDeletedIds(new Set());
      refresh();
      message.success(t('messages.saveSuccess'));
    } catch {
      message.error(t('messages.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const renderInput = (col: ColumnConfig, currentVal: any, onChange: (v: any) => void) => {
    switch (col.inputType) {
      case 'number':
        return <InputNumber value={currentVal} onChange={onChange} size="small" style={{ width: '100%' }} />;
      case 'select':
        return <Select value={currentVal} onChange={onChange} options={col.selectOptions} size="small" style={{ width: '100%' }} showSearch optionFilterProp="label" allowClear />;
      case 'date':
        return <DatePicker value={currentVal ? dayjs(currentVal) : null} onChange={(d) => onChange(d ? d.format('YYYY-MM-DD') : null)} size="small" style={{ width: '100%' }} />;
      default:
        return <Input value={currentVal} onChange={(e) => onChange(e.target.value)} size="small" />;
    }
  };

  const existingData = (items ?? []).filter((item: any) => !deletedIds.has(item.id));

  const tableColumns = [
    ...columns.map((col) => ({
      dataIndex: col.dataIndex,
      title: col.title,
      width: col.width,
      align: col.align as any,
      render: (value: any, record: any) => {
        const isNewRow = String(record.id).startsWith('__new_');

        if (col.computed) {
          const rowState = isNewRow ? getNewRowState(record.id) : getRowState(record.id, record);
          const computedVal = col.computed(rowState, record);
          return col.render ? col.render(computedVal, record) : computedVal;
        }

        if (!col.editable) {
          if (isNewRow) {
            const rowState = getNewRowState(record.id);
            const key = flatKey(col.dataIndex);
            const overrideVal = rowState[key];
            if (overrideVal !== undefined) return col.render ? col.render(overrideVal, record) : overrideVal;
            return null;
          }
          const editOverride = edits[record.id]?.[flatKey(col.dataIndex)];
          if (editOverride !== undefined) return col.render ? col.render(editOverride, record) : editOverride;
          return col.render ? col.render(value, record) : value;
        }

        if (isNewRow) {
          const row = newRows.find((r) => r.tempId === record.id);
          const key = flatKey(col.dataIndex);
          return renderInput(col, row?.values[key], (v) => updateNewRowCell(record.id, col, v));
        }

        const key = flatKey(col.dataIndex);
        const hasEdit = edits[record.id] && key in edits[record.id];
        const currentVal = hasEdit ? edits[record.id][key] : getNestedValue(record, col.dataIndex);
        return renderInput(col, currentVal, (v) => updateCell(record.id, col, v));
      },
    })),
    {
      title: t('common.actions'),
      width: 60,
      fixed: 'right' as const,
      render: (_: any, record: any) => {
        if (String(record.id).startsWith('__new_')) {
          return <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => removeNewRow(record.id)} />;
        }
        return (
          <Popconfirm title={t('messages.deleteConfirm')} onConfirm={() => markDeleted(record.id)} okText={t('common.confirm')} cancelText={t('common.cancel')}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        );
      },
    },
  ];

  const dataSource = [...existingData, ...newRows.map((r) => ({ id: r.tempId }))];

  if (!parentId) return null;

  return (
    <>
      <Divider>
        <Space>
          {title}
          {isDirty && (
            <Button type="primary" size="small" icon={<SaveOutlined />} onClick={saveAll} loading={saving}>
              {t('buttons.save')}
            </Button>
          )}
        </Space>
      </Divider>
      <Table dataSource={dataSource} rowKey="id" size="small" pagination={false} columns={tableColumns} scroll={{ x: 'max-content' }}
        footer={() => (
          <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={addRow} block>{t('common.create')}</Button>
        )}
      />
    </>
  );
};
