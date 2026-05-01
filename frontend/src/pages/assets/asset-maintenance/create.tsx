import React from 'react';
import { useForm, Create, useSelect } from '@refinedev/antd';
import { Form, Input, DatePicker, Select, InputNumber, Row, Col } from 'antd';
import { FULL_WIDTH } from '../../../constants/styles';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const AssetMaintenanceCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'asset-maintenance' });
  const { selectProps: assetSelectProps } = useSelect({
    resource: 'fixed-assets',
    optionLabel: (r: any) => `${r.asset_number} - ${r.asset_name}`,
  });
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();

  return (
    <Create saveButtonProps={saveButtonProps} title={pt('asset_maintenance', 'create')}>
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('asset_maintenance_records', 'asset_id')} name="asset_id" rules={[{ required: true, message: t('validation.requiredSelect', { field: fl('asset_maintenance_records', 'asset_id') }) }]}>
              <Select {...assetSelectProps} showSearch />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('asset_maintenance_records', 'maintenance_type')} name="maintenance_type">
              <Select
                options={[
                  { value: 'routine', label: t('enums.maintenanceType.routine') },
                  { value: 'repair', label: t('enums.maintenanceType.repair') },
                  { value: 'overhaul', label: t('enums.maintenanceType.overhaul') },
                ]}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label={fl('asset_maintenance_records', 'performed_at')}
              name="performed_at"
              rules={[{ required: true, message: t('validation.requiredSelect', { field: fl('asset_maintenance_records', 'performed_at') }) }]}
              getValueFromEvent={(d) => d?.format('YYYY-MM-DD')}
            >
              <DatePicker style={FULL_WIDTH} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('asset_maintenance_records', 'performed_by')} name="performed_by">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('asset_maintenance_records', 'cost')} name="cost">
              <InputNumber style={FULL_WIDTH} min={0} precision={2} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label={fl('asset_maintenance_records', 'next_due_at')}
              name="next_due_at"
              getValueFromEvent={(d) => d?.format('YYYY-MM-DD')}
            >
              <DatePicker style={FULL_WIDTH} />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label={fl('asset_maintenance_records', 'description')} name="description">
              <Input.TextArea rows={3} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Create>
  );
};
