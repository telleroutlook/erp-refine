import React from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { Form, Input, DatePicker, Select, Row, Col, Table, Divider } from 'antd';
import { FULL_WIDTH, dateFormItemProps } from '../../../constants/styles';
import { CURRENCY_OPTIONS } from '../../../constants/options';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';

export const SalesInvoiceEdit: React.FC = () => {
  const { formProps, saveButtonProps, queryResult } = useForm({ resource: 'sales-invoices' });
  const record = queryResult?.data?.data as any;

  return (
    <Edit saveButtonProps={saveButtonProps} title="编辑销售发票">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="发票号" name="invoice_number">
              <Input disabled />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label="到期日"
              name="due_date"
              {...dateFormItemProps}
            >
              <DatePicker style={FULL_WIDTH} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="货币" name="currency">
              <Select options={CURRENCY_OPTIONS} disabled />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="备注" name="notes">
              <Input.TextArea rows={3} />
            </Form.Item>
          </Col>
        </Row>
      </Form>

      {record?.items?.length > 0 && (
        <>
          <Divider>发票行</Divider>
          <Table
            dataSource={record.items}
            rowKey="id"
            size="small"
            pagination={false}
            columns={[
              { dataIndex: ['product', 'name'], title: '产品' },
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
