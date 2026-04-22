import React from 'react';
import { useForm, Edit, DateField } from '@refinedev/antd';
import { useList } from '@refinedev/core';
import { Form, Input, DatePicker, Select, InputNumber, Row, Col, Table, Divider } from 'antd';
import { FULL_WIDTH, dateFormItemProps } from '../../../constants/styles';
import { WORK_ORDER_STATUS_OPTIONS } from '../../../constants/options';
import { StatusTag } from '../../../components/shared/StatusTag';

export const WorkOrderEdit: React.FC = () => {
  const { formProps, saveButtonProps, queryResult } = useForm({ resource: 'work-orders' });
  const record = queryResult?.data?.data as any;
  const { data: warehousesData } = useList({ resource: 'warehouses', pagination: { pageSize: 500 } });
  const warehouseOptions = (warehousesData?.data ?? []).map((w: any) => ({ label: w.name, value: w.id }));

  return (
    <Edit saveButtonProps={saveButtonProps} title="编辑生产工单">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="工单号" name="work_order_number">
              <Input disabled />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="状态" name="status">
              <Select options={WORK_ORDER_STATUS_OPTIONS} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="计划数量" name="planned_quantity">
              <InputNumber style={FULL_WIDTH} min={1} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="仓库" name="warehouse_id">
              <Select options={warehouseOptions} showSearch optionFilterProp="label" allowClear />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="开始日期" name="start_date" {...dateFormItemProps}>
              <DatePicker style={FULL_WIDTH} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="计划完成日期" name="planned_completion_date" {...dateFormItemProps}>
              <DatePicker style={FULL_WIDTH} />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="备注" name="notes">
              <Input.TextArea rows={3} />
            </Form.Item>
          </Col>
        </Row>
      </Form>

      {record?.materials && record.materials.length > 0 && (
        <>
          <Divider>物料需求</Divider>
          <Table dataSource={record.materials} rowKey="id" size="small" pagination={false} columns={[
            { dataIndex: ['product', 'name'], title: '物料' },
            { dataIndex: 'required_quantity', title: '需求数量', width: 100, align: 'right' as const },
            { dataIndex: 'issued_quantity', title: '已领数量', width: 100, align: 'right' as const },
            { dataIndex: 'status', title: '状态', width: 100, render: (v: string) => <StatusTag status={v} /> },
            { dataIndex: 'notes', title: '备注' },
          ]} />
        </>
      )}

      {record?.productions && record.productions.length > 0 && (
        <>
          <Divider>生产报工</Divider>
          <Table dataSource={record.productions} rowKey="id" size="small" pagination={false} columns={[
            { dataIndex: 'production_date', title: '报工日期', width: 120, render: (v: string) => v ? <DateField value={v} format="YYYY-MM-DD" /> : '-' },
            { dataIndex: 'quantity', title: '生产数量', width: 100, align: 'right' as const },
            { dataIndex: 'qualified_quantity', title: '合格数量', width: 100, align: 'right' as const },
            { dataIndex: 'defective_quantity', title: '不良数量', width: 100, align: 'right' as const },
            { dataIndex: 'notes', title: '备注' },
          ]} />
        </>
      )}
    </Edit>
  );
};
