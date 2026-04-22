import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useCreate, useUpdate, useDelete, useInvalidate } from '@refinedev/core';
import { Table, Divider, Button, Input, InputNumber, Select, Popconfirm, Space, DatePicker, message } from 'antd';
import { PlusOutlined, DeleteOutlined, SaveOutlined } from '@ant-design/icons';
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
}

interface EditableItemTableProps {
  resource: string;
  parentResource: string;
  parentId: string | undefined;
  parentFk: string;
  items: any[];
  columns: ColumnConfig[];
  title: string;
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
}) => {
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
      if (isDirtyRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  useEffect(() => {
    if (!isDirty) return;
    const orig = window.history.pushState;
    const handleNav = () => {
      if (isDirtyRef.current && !window.confirm('有未保存的修改，确定要离开吗？')) {
        return true;
      }
      return false;
    };
    window.history.pushState = function (...args) {
      if (handleNav()) return;
      return orig.apply(this, args);
    };
    return () => { window.history.pushState = orig; };
  }, [isDirty]);

  const flatKey = (di: string | string[]) => (Array.isArray(di) ? di.join('.') : di);

  const getNestedValue = (obj: any, path: string | string[]): any => {
    const keys = Array.isArray(path) ? path : [path];
    return keys.reduce((o, k) => o?.[k], obj);
  };

  const fieldName = (di: string | string[]) =>
    Array.isArray(di) ? di[di.length - 1] : di;

  const updateCell = (recordId: string, col: ColumnConfig, value: any) => {
    const key = flatKey(col.dataIndex);
    setEdits((prev) => ({
      ...prev,
      [recordId]: { ...prev[recordId], [key]: value },
    }));
  };

  const updateNewRowCell = (tempId: string, col: ColumnConfig, value: any) => {
    const key = flatKey(col.dataIndex);
    setNewRows((prev) =>
      prev.map((r) => r.tempId === tempId ? { ...r, values: { ...r.values, [key]: value } } : r)
    );
  };

  const addRow = () => {
    setNewRows((prev) => [...prev, { tempId: nextTempId(), values: {} }]);
  };

  const removeNewRow = (tempId: string) => {
    setNewRows((prev) => prev.filter((r) => r.tempId !== tempId));
  };

  const markDeleted = (id: string) => {
    setDeletedIds((prev) => new Set(prev).add(id));
    setEdits((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
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
          const key = flatKey(col.dataIndex);
          if (key in changes) {
            values[fieldName(col.dataIndex)] = changes[key];
          }
        });
        if (Object.keys(values).length > 0) {
          promises.push(updateAsync({ resource, id, values }));
        }
      }

      for (const row of newRows) {
        const values: Record<string, any> = { [parentFk]: parentId };
        columns.forEach((col) => {
          if (col.editable) {
            const key = flatKey(col.dataIndex);
            if (row.values[key] !== undefined) {
              values[fieldName(col.dataIndex)] = row.values[key];
            }
          }
        });
        promises.push(createAsync({ resource, values }));
      }

      await Promise.all(promises);

      setEdits({});
      setNewRows([]);
      setDeletedIds(new Set());
      refresh();
      message.success('保存成功');
    } catch {
      message.error('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const renderInput = (col: ColumnConfig, currentVal: any, onChange: (v: any) => void) => {
    switch (col.inputType) {
      case 'number':
        return <InputNumber value={currentVal} onChange={onChange} size="small" style={{ width: '100%' }} />;
      case 'select':
        return (
          <Select value={currentVal} onChange={onChange} options={col.selectOptions} size="small" style={{ width: '100%' }} showSearch optionFilterProp="label" allowClear />
        );
      case 'date':
        return (
          <DatePicker value={currentVal ? dayjs(currentVal) : null} onChange={(d) => onChange(d ? d.format('YYYY-MM-DD') : null)} size="small" style={{ width: '100%' }} />
        );
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

        if (!col.editable) {
          if (isNewRow) return null;
          return col.render ? col.render(value, record) : value;
        }

        if (isNewRow) {
          const row = newRows.find((r) => r.tempId === record.id);
          const key = flatKey(col.dataIndex);
          const currentVal = row?.values[key];
          return renderInput(col, currentVal, (v) => updateNewRowCell(record.id, col, v));
        }

        const key = flatKey(col.dataIndex);
        const hasEdit = edits[record.id] && key in edits[record.id];
        const currentVal = hasEdit ? edits[record.id][key] : getNestedValue(record, col.dataIndex);
        return renderInput(col, currentVal, (v) => updateCell(record.id, col, v));
      },
    })),
    {
      title: '操作',
      width: 60,
      fixed: 'right' as const,
      render: (_: any, record: any) => {
        const isNewRow = String(record.id).startsWith('__new_');
        if (isNewRow) {
          return (
            <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => removeNewRow(record.id)} />
          );
        }
        return (
          <Popconfirm title="确定删除?" onConfirm={() => markDeleted(record.id)} okText="确定" cancelText="取消">
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        );
      },
    },
  ];

  const dataSource = [
    ...existingData,
    ...newRows.map((r) => ({ id: r.tempId })),
  ];

  if (!parentId) return null;

  return (
    <>
      <Divider>
        <Space>
          {title}
          {isDirty && (
            <Button type="primary" size="small" icon={<SaveOutlined />} onClick={saveAll} loading={saving}>
              保存明细
            </Button>
          )}
        </Space>
      </Divider>
      <Table
        dataSource={dataSource}
        rowKey="id"
        size="small"
        pagination={false}
        columns={tableColumns}
        scroll={{ x: 'max-content' }}
        footer={() => (
          <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={addRow} block>
            添加行
          </Button>
        )}
      />
    </>
  );
};
