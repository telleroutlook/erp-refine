import React from 'react';
import { useForm, Edit, DateField } from '@refinedev/antd';
import { Form, Input, DatePicker, Select, Switch, Row, Col, Table, Divider } from 'antd';
import { FULL_WIDTH, dateFormItemProps } from '../../../constants/styles';
import { CURRENCY_OPTIONS, PRICE_LIST_STATUS_OPTIONS } from '../../../constants/options';
import { AmountDisplay } from '../../../components/shared/AmountDisplay';

export const PriceListEdit: React.FC = () => {
  const { formProps, saveButtonProps, queryResult } = useForm({ resource: 'price-lists' });
  const record = queryResult?.data?.data as any;

  return (
    <Edit saveButtonProps={saveButtonProps} title="编辑价格表">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="编号" name="code">
              <Input disabled />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="名称" name="name">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="货币" name="currency">
              <Select options={CURRENCY_OPTIONS} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label="生效日期"
              name="effective_from"
              {...dateFormItemProps}
            >
              <DatePicker style={FULL_WIDTH} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label="到期日期"
              name="effective_to"
              {...dateFormItemProps}
            >
              <DatePicker style={FULL_WIDTH} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="默认" name="is_default" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="状态" name="status">
              <Select options={PRICE_LIST_STATUS_OPTIONS} />
            </Form.Item>
          </Col>
        </Row>
      </Form>

      {record?.lines && record.lines.length > 0 && (
        <>
          <Divider>价格明细</Divider>
          <Table
            dataSource={record.lines}
            rowKey="id"
            size="small"
            pagination={false}
            columns={[
              { dataIndex: ['product', 'name'], title: '产品' },
              { dataIndex: 'unit_price', title: '单价', width: 120, align: 'right' as const, render: (v: number | string | null | undefined) => <AmountDisplay value={v} currency={record?.currency} /> },
              { dataIndex: 'min_quantity', title: '最小数量', width: 100, align: 'right' as const },
              { dataIndex: 'discount_rate', title: '折扣率', width: 100 },
              { dataIndex: 'effective_from', title: '生效日期', width: 120, render: (v: string) => v ? <DateField value={v} format="YYYY-MM-DD" /> : '-' },
              { dataIndex: 'effective_to', title: '到期日期', width: 120, render: (v: string) => v ? <DateField value={v} format="YYYY-MM-DD" /> : '-' },
            ]}
          />
        </>
      )}
    </Edit>
  );
};
