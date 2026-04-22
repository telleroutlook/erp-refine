import React from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { Form, Input, DatePicker, Select, Row, Col, Table, Divider } from 'antd';
import { FULL_WIDTH, dateFormItemProps } from '../../../constants/styles';
import { COUNT_STATUS_OPTIONS } from '../../../constants/options';

export const InventoryCountEdit: React.FC = () => {
  const { formProps, saveButtonProps, queryResult } = useForm({ resource: 'inventory-counts' });
  const record = queryResult?.data?.data as any;

  return (
    <Edit saveButtonProps={saveButtonProps} title="编辑库存盘点">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="盘点单号" name="count_number">
              <Input disabled />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="状态" name="status">
              <Select options={COUNT_STATUS_OPTIONS} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label="盘点日期"
              name="count_date"
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
          <Divider>盘点明细</Divider>
          <Table
            dataSource={record.lines}
            rowKey="id"
            size="small"
            pagination={false}
            columns={[
              { dataIndex: ['product', 'name'], title: '产品' },
              { dataIndex: 'system_quantity', title: '系统数量', width: 100, align: 'right' as const },
              { dataIndex: 'counted_quantity', title: '盘点数量', width: 100, align: 'right' as const },
              { dataIndex: 'variance_quantity', title: '差异数量', width: 100, align: 'right' as const },
              { dataIndex: 'notes', title: '备注' },
            ]}
          />
        </>
      )}
    </Edit>
  );
};
