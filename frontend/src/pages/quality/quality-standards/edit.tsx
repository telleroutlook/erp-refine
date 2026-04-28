import React, { useState } from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { Form, Input, Switch, Row, Col } from 'antd';
import { EditableItemTable, type ColumnConfig, type ItemsPayload } from '../../../components/shared/EditableItemTable';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const QualityStandardEdit: React.FC = () => {
  const { formProps, saveButtonProps, queryResult, onFinish } = useForm({ resource: 'quality-standards' });
  const record = queryResult?.data?.data as any;
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();

  const itemColumns: ColumnConfig[] = [
    { dataIndex: 'item_name', title: fl('quality_standard_items', 'item_name'), editable: true },
    { dataIndex: 'check_method', title: fl('quality_standard_items', 'check_method'), editable: true },
    { dataIndex: 'acceptance_criteria', title: fl('quality_standard_items', 'acceptance_criteria'), editable: true },
    { dataIndex: 'is_mandatory', title: fl('quality_standard_items', 'is_mandatory'), width: 100, editable: true, inputType: 'select', selectOptions: [{ label: t('common.yes'), value: true }, { label: t('common.no'), value: false }], render: (v: any) => v ? t('common.yes') : t('common.no') },
    { dataIndex: 'sequence_order', title: fl('quality_standard_items', 'sequence_order'), width: 80, align: 'right', editable: true, inputType: 'number' },
  ];

  const [itemsPayload, setItemsPayload] = useState<ItemsPayload>({ upsert: [], delete: [] });
  const handleFinish = async (values: any) => onFinish({ ...values, items: itemsPayload });

  return (
    <Edit saveButtonProps={saveButtonProps} title={pt('quality_standards', 'edit')}>
      <Form {...formProps} layout="vertical" onFinish={handleFinish}>
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('quality_standards', 'standard_code')} name="standard_code"><Input disabled /></Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('quality_standards', 'standard_name')} name="standard_name" rules={[{ required: true }]}><Input /></Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label={fl('quality_standards', 'description')} name="description"><Input.TextArea rows={3} /></Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('quality_standards', 'is_active')} name="is_active" valuePropName="checked"><Switch /></Form.Item>
          </Col>
        </Row>
      </Form>

      <EditableItemTable items={record?.items ?? []} columns={itemColumns} title={t('sections.inspectionItems')} onChange={setItemsPayload} />
    </Edit>
  );
};
