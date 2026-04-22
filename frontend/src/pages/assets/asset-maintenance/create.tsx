import React from 'react';
import { useForm, Create } from '@refinedev/antd';
import { useList } from '@refinedev/core';
import { Form, Input, DatePicker, Select, InputNumber, Row, Col } from 'antd';
import { FULL_WIDTH } from '../../../constants/styles';

export const AssetMaintenanceCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'asset-maintenance' });
  const { data: assetsData } = useList({ resource: 'fixed-assets', pagination: { pageSize: 500 } });
  const assetOptions = (assetsData?.data ?? []).map((a: any) => ({ label: `${a.asset_number} - ${a.asset_name}`, value: a.id }));

  return (
    <Create saveButtonProps={saveButtonProps} title="新建资产维保">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="资产" name="asset_id" rules={[{ required: true, message: '请选择资产' }]}>
              <Select options={assetOptions} showSearch optionFilterProp="label" placeholder="选择资产" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="维保类型" name="maintenance_type">
              <Select
                options={[
                  { value: 'preventive', label: '预防性维护' },
                  { value: 'corrective', label: '纠正性维护' },
                  { value: 'inspection', label: '检查' },
                ]}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label="执行日期"
              name="performed_at"
              rules={[{ required: true, message: '请选择执行日期' }]}
              getValueFromEvent={(d) => d?.format('YYYY-MM-DD')}
            >
              <DatePicker style={FULL_WIDTH} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="执行人" name="performed_by">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="费用" name="cost">
              <InputNumber style={FULL_WIDTH} min={0} precision={2} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label="下次到期"
              name="next_due_at"
              getValueFromEvent={(d) => d?.format('YYYY-MM-DD')}
            >
              <DatePicker style={FULL_WIDTH} />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="描述" name="description">
              <Input.TextArea rows={3} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Create>
  );
};
