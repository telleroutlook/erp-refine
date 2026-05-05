import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Table, Divider, Button, Input, InputNumber, Select, Popconfirm, DatePicker } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
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

export interface ItemsPayload {
  upsert: Record<string, any>[];
  delete: string[];
}

export interface PriceResolveFn {
  (productId: string, quantity?: number): Promise<{ unit_price: number; discount_rate?: number; source?: string } | null>;
}

interface EditableItemTableProps {
  items: any[];
  columns: ColumnConfig[];
  title: string;
  productsMap?: Map<string, ProductInfo>;
  priceField?: 'cost_price' | 'sale_price';
  onResolvePrice?: PriceResolveFn;
  onChange: (payload: ItemsPayload) => void;
}

export const EditableItemTable: React.FC<EditableItemTableProps> = ({
  items,
  columns,
  title,
  productsMap,
  priceField,
  onResolvePrice,
  onChange,
}) => {
  const { t } = useTranslation();
  const tempSeqRef = useRef(0);
  const nextTempId = useCallback(() => `__new_${++tempSeqRef.current}`, []);
  const isMountedRef = useRef(true);
  const [edits, setEdits] = useState<Record<string, Record<string, any>>>({});
  const [newRows, setNewRows] = useState<{ tempId: string; values: Record<string, any> }[]>([]);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [changeSeq, setChangeSeq] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevItemsRef = useRef(items);

  useEffect(() => {
    if (prevItemsRef.current !== items) {
      prevItemsRef.current = items;
      setEdits({});
      setNewRows([]);
      setDeletedIds(new Set());
      setChangeSeq(0);
      tempSeqRef.current = 0;
    }
  }, [items]);

  const isDirty = Object.keys(edits).length > 0 || newRows.length > 0 || deletedIds.size > 0;
  const isDirtyRef = useRef(isDirty);
  isDirtyRef.current = isDirty;

  // Keep refs for values read inside the changeSeq effect to avoid stale closures
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const columnsRef = useRef(columns);
  columnsRef.current = columns;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const editsRef = useRef(edits);
  editsRef.current = edits;
  const newRowsRef = useRef(newRows);
  newRowsRef.current = newRows;
  const deletedIdsRef = useRef(deletedIds);
  deletedIdsRef.current = deletedIds;

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirtyRef.current) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', handler);
    return () => {
      isMountedRef.current = false;
      window.removeEventListener('beforeunload', handler);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const flatKey = (di: string | string[]) => (Array.isArray(di) ? di.join('.') : di);
  const getNestedValue = (obj: any, path: string | string[]): any => {
    const keys = Array.isArray(path) ? path : [path];
    return keys.reduce((o, k) => o?.[k], obj);
  };
  const fieldName = (di: string | string[]) => Array.isArray(di) ? di[di.length - 1] : di;

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

  const applyProductSideEffects = (productId: string | undefined): Record<string, any> => {
    if (!productId || !productsMap) return {};
    const product = productsMap.get(productId);
    if (!product) return {};
    const sideEffects: Record<string, any> = {
      'product.name': product.name,
      'product.code': product.code,
      'product.uom': product.uom,
    };
    if (!onResolvePrice && priceField && product[priceField] != null) {
      sideEffects['unit_price'] = product[priceField];
    }
    return sideEffects;
  };

  const triggerPriceResolve = (rowId: string, productId: string, isNew: boolean) => {
    if (!onResolvePrice) return;
    onResolvePrice(productId).then((result) => {
      if (!result || !isMountedRef.current) return;
      if (isNew) {
        setNewRows((prev) =>
          prev.map((r) => r.tempId === rowId
            ? { ...r, values: { ...r.values, unit_price: result.unit_price, ...(result.discount_rate != null ? { discount_rate: result.discount_rate } : {}) } }
            : r
          )
        );
      } else {
        setEdits((prev) => ({
          ...prev,
          [rowId]: { ...prev[rowId], unit_price: result.unit_price, ...(result.discount_rate != null ? { discount_rate: result.discount_rate } : {}) },
        }));
      }
      notifyChange();
    });
  };

  // Emit payload to parent after state settles — use refs to avoid stale closures
  useEffect(() => {
    if (changeSeq === 0) return;
    const currentItems = itemsRef.current;
    const currentColumns = columnsRef.current;
    const currentEdits = editsRef.current;
    const currentNewRows = newRowsRef.current;
    const currentDeletedIds = deletedIdsRef.current;
    const upsert: Record<string, any>[] = [];

    for (const [id, changes] of Object.entries(currentEdits)) {
      if (currentDeletedIds.has(id)) continue;
      const original = (currentItems ?? []).find((item: any) => item.id === id);
      const values: Record<string, any> = { id };
      currentColumns.forEach((col) => {
        if (!col.editable) return;
        const key = flatKey(col.dataIndex);
        if (key in changes) {
          values[fieldName(col.dataIndex)] = changes[key];
        } else if (original) {
          values[fieldName(col.dataIndex)] = getNestedValue(original, col.dataIndex);
        }
      });
      if (Object.keys(values).length > 1) upsert.push(values);
    }

    for (const item of (currentItems ?? [])) {
      if (currentDeletedIds.has(item.id)) continue;
      if (currentEdits[item.id]) continue;
      const values: Record<string, any> = { id: item.id };
      currentColumns.forEach((col) => {
        if (!col.editable) return;
        const key = flatKey(col.dataIndex);
        values[fieldName(col.dataIndex)] = getNestedValue(item, col.dataIndex);
      });
      upsert.push(values);
    }

    for (const row of currentNewRows) {
      const values: Record<string, any> = {};
      currentColumns.forEach((col) => {
        if (!col.editable) return;
        const key = flatKey(col.dataIndex);
        if (row.values[key] !== undefined) values[fieldName(col.dataIndex)] = row.values[key];
      });
      upsert.push(values);
    }

    onChangeRef.current({ upsert, delete: Array.from(currentDeletedIds) });
  }, [changeSeq]);

  const notifyChange = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setChangeSeq((s) => s + 1), 150);
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
    if (key === 'product_id' && value) {
      triggerPriceResolve(recordId, value, false);
    }
    notifyChange();
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
    if (key === 'product_id' && value) {
      triggerPriceResolve(tempId, value, true);
    }
    notifyChange();
  };

  const addRow = () => {
    setNewRows((prev) => [...prev, { tempId: nextTempId(), values: {} }]);
    notifyChange();
  };

  const removeNewRow = (tempId: string) => {
    setNewRows((prev) => prev.filter((r) => r.tempId !== tempId));
    notifyChange();
  };

  const markDeleted = (id: string) => {
    setDeletedIds((prev) => new Set(prev).add(id));
    setEdits((prev) => { const next = { ...prev }; delete next[id]; return next; });
    notifyChange();
  };

  const renderInput = (col: ColumnConfig, currentVal: any, onValueChange: (v: any) => void) => {
    switch (col.inputType) {
      case 'number':
        return <InputNumber value={currentVal} onChange={onValueChange} size="small" style={{ width: '100%' }} />;
      case 'select':
        return <Select value={currentVal} onChange={onValueChange} options={col.selectOptions} size="small" style={{ width: '100%' }} showSearch optionFilterProp="label" allowClear />;
      case 'date':
        return <DatePicker value={currentVal ? dayjs(currentVal) : null} onChange={(d) => onValueChange(d ? d.format('YYYY-MM-DD') : null)} size="small" style={{ width: '100%' }} />;
      default:
        return <Input value={currentVal} onChange={(e) => onValueChange(e.target.value)} size="small" />;
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

  return (
    <>
      <Divider>{title}</Divider>
      <Table dataSource={dataSource} rowKey="id" size="small" pagination={false} columns={tableColumns} scroll={{ x: 'max-content' }}
        footer={() => (
          <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={addRow} block>{t('common.create')}</Button>
        )}
      />
    </>
  );
};
