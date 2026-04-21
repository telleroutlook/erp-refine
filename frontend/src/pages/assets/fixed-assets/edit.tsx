import React from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { Form, Input, DatePicker, Select, InputNumber, Row, Col } from 'antd';
import dayjs from 'dayjs';
import { ASSET_STATUS_OPTIONS } from '../../../constants/options';

export const FixedAssetEdit: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'fixed-assets' });

  return (
    <Edit saveButtonProps={saveButtonProps} title="编辑固定资产">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="资产编号" name="asset_number">
              <Input disabled />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="资产名称" name="asset_name">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="分类" name="category">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="状态" name="status">
              <Select options={ASSET_STATUS_OPTIONS} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="购入日期"
              name="acquisition_date"
              getValueProps={(v) => ({ value: v ? dayjs(v) : undefined })}
              getValueFromEvent={(d) => d?.format('YYYY-MM-DD')}
            >
              <DatePicker style={{ width: '100%' }} disabled />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="折旧方法" name="depreciation_method">
              <Select
                options={[
                  { value: 'straight_line', label: '直线法' },
                  { value: 'declining_balance', label: '递减余额法' },
                ]}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="使用寿命（月）" name="useful_life_months">
              <InputNumber style={{ width: '100%' }} min={1} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="残值" name="salvage_value">
              <InputNumber style={{ width: '100%' }} min={0} precision={2} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="部门" name="department">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="位置" name="location">
              <Input />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="备注" name="notes">
              <Input.TextArea rows={3} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Edit>
  );
};
