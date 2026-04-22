import React, { useState } from 'react';
import { useCreate, useUpdate, useDelete, useInvalidate } from '@refinedev/core';
import { Table, Divider, Button, Input, InputNumber, Select, Popconfirm, Form, Space, DatePicker } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
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

const TEMP_ID = '__new__';

export const EditableItemTable: React.FC<EditableItemTableProps> = ({
  resource,
  parentResource,
  parentId,
  parentFk,
  items,
  columns,
  title,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, any>>({});
  const [adding, setAdding] = useState(false);
  const [newValues, setNewValues] = useState<Record<string, any>>({});

  const { mutate: create, isLoading: creating } = useCreate();
  const { mutate: update, isLoading: updating } = useUpdate();
  const { mutate: doDelete } = useDelete();
  const invalidate = useInvalidate();

  const refresh = () => {
    invalidate({ resource: parentResource, invalidates: ['detail'], id: parentId });
  };

  const flatKey = (di: string | string[]) => (Array.isArray(di) ? di.join('.') : di);

  const getNestedValue = (obj: any, path: string | string[]): any => {
    const keys = Array.isArray(path) ? path : [path];
    return keys.reduce((o, k) => o?.[k], obj);
  };

  const startEdit = (record: any) => {
    const vals: Record<string, any> = {};
    columns.forEach((col) => {
      if (col.editable) {
        const key = flatKey(col.dataIndex);
        vals[key] = getNestedValue(record, col.dataIndex);
      }
    });
    setEditValues(vals);
    setEditingId(record.id);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({});
  };

  const saveEdit = () => {
    if (!editingId) return;
    const values: Record<string, any> = {};
    columns.forEach((col) => {
      if (col.editable) {
        const key = flatKey(col.dataIndex);
        values[Array.isArray(col.dataIndex) ? col.dataIndex[col.dataIndex.length - 1] : col.dataIndex] = editValues[key];
      }
    });
    update(
      { resource, id: editingId, values },
      {
        onSuccess: () => {
          setEditingId(null);
          setEditValues({});
          refresh();
        },
      }
    );
  };

  const startAdd = () => {
    setNewValues({});
    setAdding(true);
  };

  const cancelAdd = () => {
    setAdding(false);
    setNewValues({});
  };

  const saveAdd = () => {
    if (!parentId) return;
    const values: Record<string, any> = { [parentFk]: parentId };
    columns.forEach((col) => {
      if (col.editable) {
        const key = flatKey(col.dataIndex);
        const fieldName = Array.isArray(col.dataIndex) ? col.dataIndex[col.dataIndex.length - 1] : col.dataIndex;
        if (newValues[key] !== undefined) values[fieldName] = newValues[key];
      }
    });
    create(
      { resource, values },
      {
        onSuccess: () => {
          setAdding(false);
          setNewValues({});
          refresh();
        },
      }
    );
  };

  const handleDelete = (id: string) => {
    doDelete(
      { resource, id },
      { onSuccess: refresh }
    );
  };

  const renderCell = (col: ColumnConfig, value: any, record: any, isEditing: boolean, vals: Record<string, any>, setVals: (v: Record<string, any>) => void) => {
    const key = flatKey(col.dataIndex);

    if (!isEditing || !col.editable) {
      return col.render ? col.render(value, record) : value;
    }

    const currentVal = vals[key];
    const onChange = (v: any) => setVals({ ...vals, [key]: v });

    switch (col.inputType) {
      case 'number':
        return <InputNumber value={currentVal} onChange={onChange} size="small" style={{ width: '100%' }} />;
      case 'select':
        return (
          <Select
            value={currentVal}
            onChange={onChange}
            options={col.selectOptions}
            size="small"
            style={{ width: '100%' }}
            showSearch
            optionFilterProp="label"
            allowClear
          />
        );
      case 'date':
        return (
          <DatePicker
            value={currentVal ? dayjs(currentVal) : null}
            onChange={(d) => onChange(d ? d.format('YYYY-MM-DD') : null)}
            size="small"
            style={{ width: '100%' }}
          />
        );
      default:
        return <Input value={currentVal} onChange={(e) => onChange(e.target.value)} size="small" />;
    }
  };

  const tableColumns = [
    ...columns.map((col) => ({
      dataIndex: col.dataIndex,
      title: col.title,
      width: col.width,
      align: col.align as any,
      render: (value: any, record: any) => {
        const isEditing = record.id === editingId || (record.id === TEMP_ID && adding);
        const vals = record.id === TEMP_ID ? newValues : editValues;
        const setVals = record.id === TEMP_ID ? setNewValues : setEditValues;
        return renderCell(col, value, record, isEditing, vals, setVals);
      },
    })),
    {
      title: '操作',
      width: 100,
      fixed: 'right' as const,
      render: (_: any, record: any) => {
        if (record.id === TEMP_ID) {
          return (
            <Space size={4}>
              <Button type="link" size="small" icon={<SaveOutlined />} onClick={saveAdd} loading={creating} />
              <Button type="link" size="small" icon={<CloseOutlined />} onClick={cancelAdd} />
            </Space>
          );
        }
        if (editingId === record.id) {
          return (
            <Space size={4}>
              <Button type="link" size="small" icon={<SaveOutlined />} onClick={saveEdit} loading={updating} />
              <Button type="link" size="small" icon={<CloseOutlined />} onClick={cancelEdit} />
            </Space>
          );
        }
        return (
          <Space size={4}>
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => startEdit(record)}
              disabled={!!editingId || adding}
            />
            <Popconfirm title="确定删除?" onConfirm={() => handleDelete(record.id)} okText="确定" cancelText="取消">
              <Button type="link" size="small" danger icon={<DeleteOutlined />} disabled={!!editingId || adding} />
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  const dataSource = [...(items ?? [])];
  if (adding) {
    dataSource.push({ id: TEMP_ID });
  }

  if (!parentId) return null;

  return (
    <>
      <Divider>{title}</Divider>
      <Table
        dataSource={dataSource}
        rowKey="id"
        size="small"
        pagination={false}
        columns={tableColumns}
        scroll={{ x: 'max-content' }}
        footer={() => (
          <Button
            type="dashed"
            size="small"
            icon={<PlusOutlined />}
            onClick={startAdd}
            disabled={!!editingId || adding}
            block
          >
            添加行
          </Button>
        )}
      />
    </>
  );
};
