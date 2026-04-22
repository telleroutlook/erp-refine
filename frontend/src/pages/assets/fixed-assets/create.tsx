import React from 'react';
import { useForm, Create } from '@refinedev/antd';
import { Form, Input, DatePicker, Select, InputNumber, Row, Col } from 'antd';
import { FULL_WIDTH } from '../../../constants/styles';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const FixedAssetCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'fixed-assets' });
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();

  return (
    <Create saveButtonProps={saveButtonProps} title={pt('fixed_assets', 'create')}>
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('fixed_assets', 'asset_name')} name="asset_name" rules={[{ required: true, message: t('validation.required', { field: fl('fixed_assets', 'asset_name') }) }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('fixed_assets', 'category')} name="category">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label={fl('fixed_assets', 'acquisition_date')}
              name="acquisition_date"
              rules={[{ required: true, message: t('validation.requiredSelect', { field: fl('fixed_assets', 'acquisition_date') }) }]}
              getValueFromEvent={(d) => d?.format('YYYY-MM-DD')}
            >
              <DatePicker style={FULL_WIDTH} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label={fl('fixed_assets', 'acquisition_cost')}
              name="acquisition_cost"
              rules={[{ required: true, message: t('validation.required', { field: fl('fixed_assets', 'acquisition_cost') }) }]}
            >
              <InputNumber style={FULL_WIDTH} min={0} precision={2} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('fixed_assets', 'depreciation_method')} name="depreciation_method">
              <Select
                options={[
                  { value: 'straight_line', label: t('enums.depreciationMethod.straight_line') },
                  { value: 'declining_balance', label: t('enums.depreciationMethod.declining_balance') },
                ]}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('fixed_assets', 'useful_life_months')} name="useful_life_months">
              <InputNumber style={FULL_WIDTH} min={1} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('fixed_assets', 'salvage_value')} name="salvage_value">
              <InputNumber style={FULL_WIDTH} min={0} precision={2} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('fixed_assets', 'department')} name="department">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('fixed_assets', 'location')} name="location">
              <Input />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label={t('common.notes')} name="notes">
              <Input.TextArea rows={3} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Create>
  );
};
