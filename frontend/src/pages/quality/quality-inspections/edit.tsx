import React from 'react';
import { useForm, Edit } from '@refinedev/antd';
import { Form, Input, DatePicker, Select, InputNumber, Row, Col } from 'antd';
import { FULL_WIDTH, dateFormItemProps } from '../../../constants/styles';
import { INSPECTION_STATUS_OPTIONS, INSPECTION_RESULT_OPTIONS } from '../../../constants/options';
import { EditableItemTable, type ColumnConfig } from '../../../components/shared/EditableItemTable';

export const QualityInspectionEdit: React.FC = () => {
  const { formProps, saveButtonProps, queryResult } = useForm({ resource: 'quality-inspections' });
  const record = queryResult?.data?.data as any;

  const itemColumns: ColumnConfig[] = [
    { dataIndex: 'check_item', title: '检验项目', editable: true },
    { dataIndex: 'check_standard', title: '检验标准', editable: true },
    { dataIndex: 'check_result', title: '检验结果', editable: true },
    { dataIndex: 'measured_value', title: '测量值', width: 120, editable: true },
    { dataIndex: 'notes', title: '备注', editable: true },
  ];

  return (
    <Edit saveButtonProps={saveButtonProps} title="编辑质量检验">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="检验单号" name="inspection_number"><Input disabled /></Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="状态" name="status"><Select options={INSPECTION_STATUS_OPTIONS} /></Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="检验日期" name="inspection_date" {...dateFormItemProps}><DatePicker style={FULL_WIDTH} disabled /></Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="检验结果" name="result"><Select options={INSPECTION_RESULT_OPTIONS} placeholder="选择检验结果" allowClear /></Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="合格数量" name="qualified_quantity"><InputNumber style={FULL_WIDTH} min={0} /></Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="不合格数量" name="defective_quantity"><InputNumber style={FULL_WIDTH} min={0} /></Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="备注" name="notes"><Input.TextArea rows={3} /></Form.Item>
          </Col>
        </Row>
      </Form>

      <EditableItemTable resource="quality-inspection-items" parentResource="quality-inspections" parentId={record?.id} parentFk="quality_inspection_id" items={record?.items ?? []} columns={itemColumns} title="检验明细" />
    </Edit>
  );
};
