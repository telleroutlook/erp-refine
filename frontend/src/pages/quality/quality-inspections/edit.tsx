import React from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { Form, Input, DatePicker, Select, InputNumber, Row, Col } from 'antd';
import { FULL_WIDTH, dateFormItemProps } from '../../../constants/styles';
import { INSPECTION_STATUS_OPTIONS, INSPECTION_RESULT_OPTIONS, translateOptions } from '../../../constants/options';
import { EditableItemTable, type ColumnConfig } from '../../../components/shared/EditableItemTable';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const QualityInspectionEdit: React.FC = () => {
  const { formProps, saveButtonProps, queryResult } = useForm({ resource: 'quality-inspections' });
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();
  const record = queryResult?.data?.data as any;

  const itemColumns: ColumnConfig[] = [
    { dataIndex: 'check_item', title: t('qualityInspection.checkItem'), editable: true },
    { dataIndex: 'check_standard', title: t('qualityInspection.checkStandard'), editable: true },
    { dataIndex: 'check_result', title: t('qualityInspection.checkResult'), editable: true },
    { dataIndex: 'measured_value', title: t('qualityInspection.measuredValue'), width: 120, editable: true },
    { dataIndex: 'notes', title: t('common.notes'), editable: true },
  ];

  return (
    <Edit saveButtonProps={saveButtonProps} title={pt('quality_inspections', 'edit')}>
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('quality_inspections', 'inspection_number')} name="inspection_number"><Input disabled /></Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={t('common.status')} name="status"><Select options={translateOptions(INSPECTION_STATUS_OPTIONS, t)} /></Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('quality_inspections', 'inspection_date')} name="inspection_date" {...dateFormItemProps}><DatePicker style={FULL_WIDTH} disabled /></Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('quality_inspections', 'result')} name="result"><Select options={translateOptions(INSPECTION_RESULT_OPTIONS, t)} placeholder={t('placeholder.select_inspection_result')} allowClear /></Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('quality_inspections', 'qualified_quantity')} name="qualified_quantity"><InputNumber style={FULL_WIDTH} min={0} /></Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('quality_inspections', 'defective_quantity')} name="defective_quantity"><InputNumber style={FULL_WIDTH} min={0} /></Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label={t('common.notes')} name="notes"><Input.TextArea rows={3} /></Form.Item>
          </Col>
        </Row>
      </Form>

      <EditableItemTable resource="quality-inspection-items" parentResource="quality-inspections" parentId={record?.id} parentFk="quality_inspection_id" items={record?.items ?? []} columns={itemColumns} title={t('qualityInspection.inspectionDetails')} />
    </Edit>
  );
};
