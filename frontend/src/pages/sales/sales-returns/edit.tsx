import React from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { Form, Input, DatePicker, Select, Row, Col, Table, Divider } from 'antd';
import { FULL_WIDTH, dateFormItemProps } from '../../../constants/styles';
import { RETURN_STATUS_OPTIONS } from '../../../constants/options';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';

export const SalesReturnEdit: React.FC = () => {
  const { formProps, saveButtonProps, queryResult } = useForm({ resource: 'sales-returns' });
  const record = queryResult?.data?.data as any;

  return (
    <Edit saveButtonProps={saveButtonProps} title="编辑销售退货单">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="退货单号" name="return_number">
              <Input disabled />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="状态" name="status">
              <Select options={RETURN_STATUS_OPTIONS} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label="退货日期"
              name="return_date"
              {...dateFormItemProps}
            >
              <DatePicker style={FULL_WIDTH} disabled />
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
          <Divider>退货行</Divider>
          <Table
            dataSource={record.items}
            rowKey="id"
            size="small"
            pagination={false}
            columns={[
              { dataIndex: ['product', 'name'], title: '产品' },
              { dataIndex: ['product', 'code'], title: '产品编号', width: 120 },
              { dataIndex: 'quantity', title: '退货数量', width: 100, align: 'right' },
              { dataIndex: 'unit_price', title: '单价', width: 100, align: 'right', render: (v: number) => <AmountDisplay value={v} currency={record?.sales_order?.currency} /> },
              { dataIndex: 'amount', title: '行合计', width: 120, align: 'right', render: (v: number) => <AmountDisplay value={v} currency={record?.sales_order?.currency} /> },
            ]}
          />
        </>
      )}
    </Edit>
  );
};
