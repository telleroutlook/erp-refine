import React from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { Form, Input, DatePicker, Select, Row, Col, Table, Divider } from 'antd';
import { FULL_WIDTH, dateFormItemProps } from '../../../constants/styles';
import { REQUISITION_STATUS_OPTIONS } from '../../../constants/options';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';

export const PurchaseRequisitionEdit: React.FC = () => {
  const { formProps, saveButtonProps, queryResult } = useForm({ resource: 'purchase-requisitions' });
  const record = queryResult?.data?.data as any;

  return (
    <Edit saveButtonProps={saveButtonProps} title="编辑采购申请">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="申请单号" name="requisition_number">
              <Input disabled />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="状态" name="status">
              <Select options={REQUISITION_STATUS_OPTIONS} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label="申请日期"
              name="request_date"
              {...dateFormItemProps}
            >
              <DatePicker style={FULL_WIDTH} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label="需求日期"
              name="required_date"
              {...dateFormItemProps}
            >
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

      {record?.lines && record.lines.length > 0 && (
        <>
          <Divider>申请行</Divider>
          <Table
            dataSource={record.lines}
            rowKey="id"
            size="small"
            pagination={false}
            columns={[
              { dataIndex: 'line_number', title: '行号', width: 60 },
              { dataIndex: ['product', 'name'], title: '产品' },
              { dataIndex: ['product', 'code'], title: '产品编号', width: 120 },
              { dataIndex: 'quantity', title: '数量', width: 80, align: 'right' as const },
              { dataIndex: 'unit_price', title: '单价', width: 100, align: 'right' as const, render: (v: number | string | null | undefined) => <AmountDisplay value={v} /> },
              { dataIndex: 'amount', title: '行合计', width: 120, align: 'right' as const, render: (v: number | string | null | undefined) => <AmountDisplay value={v} /> },
              { dataIndex: ['suggested_supplier', 'name'], title: '建议供应商', width: 140 },
              { dataIndex: 'notes', title: '备注' },
            ]}
          />
        </>
      )}
    </Edit>
  );
};
