import React from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { Form, Input, DatePicker, Select, Row, Col, Table, Divider } from 'antd';
import { FULL_WIDTH, dateFormItemProps } from '../../../constants/styles';
import { RECEIPT_STATUS_OPTIONS } from '../../../constants/options';

export const PurchaseReceiptEdit: React.FC = () => {
  const { formProps, saveButtonProps, queryResult } = useForm({ resource: 'purchase-receipts' });
  const record = queryResult?.data?.data as any;

  return (
    <Edit saveButtonProps={saveButtonProps} title="编辑采购收货单">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="收货单号" name="receipt_number">
              <Input disabled />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="状态" name="status">
              <Select options={RECEIPT_STATUS_OPTIONS} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label="收货日期"
              name="receipt_date"
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

      {record?.items?.length > 0 && (
        <>
          <Divider>收货行</Divider>
          <Table
            dataSource={record.items}
            rowKey="id"
            size="small"
            pagination={false}
            columns={[
              { dataIndex: ['product', 'name'], title: '产品' },
              { dataIndex: ['product', 'code'], title: '产品编号', width: 120 },
              { dataIndex: 'quantity', title: '收货数量', width: 100, align: 'right' },
              { dataIndex: ['product', 'uom'], title: '单位', width: 80 },
            ]}
          />
        </>
      )}
    </Edit>
  );
};
