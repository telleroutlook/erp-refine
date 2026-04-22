import React from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { Form, Input, DatePicker, Select, InputNumber, Row, Col, Table, Divider } from 'antd';
import { FULL_WIDTH, dateFormItemProps } from '../../../constants/styles';
import { PO_STATUS_OPTIONS, CURRENCY_OPTIONS } from '../../../constants/options';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';

export const PurchaseOrderEdit: React.FC = () => {
  const { formProps, saveButtonProps, queryResult } = useForm({ resource: 'purchase-orders' });
  const record = queryResult?.data?.data as any;

  return (
    <Edit saveButtonProps={saveButtonProps} title="编辑采购订单">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="订单号" name="order_number">
              <Input disabled />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="状态" name="status">
              <Select options={PO_STATUS_OPTIONS} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label="订单日期"
              name="order_date"
              {...dateFormItemProps}
            >
              <DatePicker style={FULL_WIDTH} disabled />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label="预计到货日期"
              name="expected_date"
              {...dateFormItemProps}
            >
              <DatePicker style={FULL_WIDTH} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="货币" name="currency">
              <Select options={CURRENCY_OPTIONS} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="付款条件（天）" name="payment_terms">
              <InputNumber style={FULL_WIDTH} min={0} />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="备注" name="notes">
              <Input.TextArea rows={3} />
            </Form.Item>
          </Col>
        </Row>
      </Form>

      {record?.items && record.items.length > 0 && (
        <>
          <Divider>订单行</Divider>
          <Table
            dataSource={record.items}
            rowKey="id"
            size="small"
            pagination={false}
            columns={[
              { dataIndex: 'line_number', title: '行号', width: 60 },
              { dataIndex: ['product', 'name'], title: '产品' },
              { dataIndex: ['product', 'code'], title: '产品编号', width: 120 },
              { dataIndex: 'quantity', title: '数量', width: 80, align: 'right' },
              { dataIndex: 'unit_price', title: '单价', width: 100, align: 'right', render: (v: number | string | null | undefined) => <AmountDisplay value={v} currency={record?.currency} /> },
              { dataIndex: 'amount', title: '行合计', width: 120, align: 'right', render: (v: number | string | null | undefined) => <AmountDisplay value={v} currency={record?.currency} /> },
            ]}
          />
        </>
      )}
    </Edit>
  );
};
