import React from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { useList } from '@refinedev/core';
import { Form, Input, DatePicker, Select, InputNumber, Row, Col, Switch, Table, Divider } from 'antd';
import { FULL_WIDTH, dateFormItemProps } from '../../../constants/styles';

export const BomHeaderEdit: React.FC = () => {
  const { formProps, saveButtonProps, queryResult } = useForm({ resource: 'bom-headers' });
  const record = queryResult?.data?.data as any;
  const { data: productsData } = useList({ resource: 'products', pagination: { pageSize: 500 } });
  const productOptions = (productsData?.data ?? []).map((p: any) => ({ label: `${p.code} - ${p.name}`, value: p.id }));

  return (
    <Edit saveButtonProps={saveButtonProps} title="编辑物料清单">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="BOM编号" name="bom_number">
              <Input disabled />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="产品" name="product_id" rules={[{ required: true }]}>
              <Select options={productOptions} showSearch optionFilterProp="label" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="基准数量" name="quantity" rules={[{ required: true }]}>
              <InputNumber style={FULL_WIDTH} min={0.01} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="版本" name="version">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="生效日期" name="effective_date" {...dateFormItemProps}>
              <DatePicker style={FULL_WIDTH} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="启用" name="is_active" valuePropName="checked">
              <Switch />
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
          <Divider>BOM明细</Divider>
          <Table dataSource={record.items} rowKey="id" size="small" pagination={false} columns={[
            { dataIndex: 'sequence', title: '序号', width: 60 },
            { dataIndex: ['product', 'name'], title: '物料' },
            { dataIndex: ['product', 'code'], title: '物料编号', width: 120 },
            { dataIndex: 'quantity', title: '用量', width: 80, align: 'right' as const },
            { dataIndex: 'unit', title: '单位', width: 80 },
            { dataIndex: 'scrap_rate', title: '损耗率(%)', width: 100, align: 'right' as const, render: (v: number) => v ? `${v}%` : '-' },
            { dataIndex: 'notes', title: '备注' },
          ]} />
        </>
      )}
    </Edit>
  );
};
