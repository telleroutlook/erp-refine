import React, { useState } from 'react';
import { useShow, useCustomMutation, useInvalidate } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions, Table, Divider, Button, Modal, Form, Select, InputNumber, Space, message } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';
import { StatusTag } from '../../../components/shared/StatusTag';
import { DocumentFlowPanel } from '../../../components/shared/DocumentFlowPanel';
import { INSPECTION_RESULT_OPTIONS, translateOptions } from '../../../constants/options';
import { API_URL } from '../../../constants/api';

export const QualityInspectionShow: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();
  const { queryResult } = useShow({ resource: 'quality-inspections' });
  const { mutate: doComplete, isLoading: completing } = useCustomMutation();
  const invalidate = useInvalidate();
  const record = queryResult.data?.data as any;

  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const canComplete = record?.status === 'draft' || record?.status === 'in_progress';

  const handleComplete = () => {
    form.validateFields().then((values) => {
      doComplete({
        url: `${API_URL}/quality-inspections/${record.id}/complete`,
        method: 'post',
        values,
      }, {
        onSuccess: () => {
          message.success(t('messages.inspectionCompleted', 'Inspection completed.'));
          setModalOpen(false);
          invalidate({ resource: 'quality-inspections', invalidates: ['detail', 'list'] });
        },
      });
    });
  };

  const headerButtons = canComplete ? (
    <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => {
      form.setFieldsValue({
        result: record?.result !== 'pending' ? record?.result : undefined,
        qualified_quantity: record?.qualified_quantity ?? 0,
        defective_quantity: record?.defective_quantity ?? 0,
      });
      setModalOpen(true);
    }}>
      {t('buttons.completeInspection', 'Complete Inspection')}
    </Button>
  ) : undefined;

  return (
    <Show title={`${pt('quality_inspections', 'show')} ${record?.inspection_number ?? ''}`} isLoading={queryResult.isLoading} headerButtons={headerButtons}>
      <DocumentFlowPanel objectType="quality_inspection" objectId={record?.id} />
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label={fl('quality_inspections', 'inspection_number')}>{record?.inspection_number}</Descriptions.Item>
        <Descriptions.Item label={t('common.status')}>
          <StatusTag status={record?.status} />
        </Descriptions.Item>
        <Descriptions.Item label={fl('quality_inspections', 'product_id')}>{record?.product?.name ?? '-'}</Descriptions.Item>
        <Descriptions.Item label={fl('quality_inspections', 'inspection_date')}>
          <DateField value={record?.inspection_date} format="YYYY-MM-DD" />
        </Descriptions.Item>
        <Descriptions.Item label={fl('quality_inspections', 'inspector_id')}>{record?.inspector?.name ?? '-'}</Descriptions.Item>
        <Descriptions.Item label={fl('quality_inspections', 'reference_type')}>{record?.reference_type ? String(t(`enums.referenceType.${record.reference_type}`, record.reference_type)) : '-'}</Descriptions.Item>
        <Descriptions.Item label={fl('quality_inspections', 'total_quantity')}>{record?.total_quantity}</Descriptions.Item>
        <Descriptions.Item label={fl('quality_inspections', 'qualified_quantity')}>{record?.qualified_quantity}</Descriptions.Item>
        <Descriptions.Item label={fl('quality_inspections', 'defective_quantity')}>{record?.defective_quantity}</Descriptions.Item>
        <Descriptions.Item label={fl('quality_inspections', 'result')}>
          {record?.result ? <StatusTag status={record.result} /> : '-'}
        </Descriptions.Item>
        {record?.notes && (
          <Descriptions.Item label={t('common.notes')} span={2}>{record.notes}</Descriptions.Item>
        )}
      </Descriptions>

      {record?.items && record.items.length > 0 && (
        <>
          <Divider>{t('sections.inspectionItems')}</Divider>
          <Table
            dataSource={record.items}
            rowKey="id"
            size="small"
            pagination={false}
            columns={[
              { dataIndex: 'check_item', title: fl('quality_inspection_items', 'check_item') },
              { dataIndex: 'check_standard', title: fl('quality_inspection_items', 'check_standard') },
              { dataIndex: 'check_result', title: fl('quality_inspection_items', 'check_result'), render: (v: string) => v ? <StatusTag status={v} /> : '-' },
              { dataIndex: 'measured_value', title: fl('quality_inspection_items', 'measured_value'), width: 120 },
              { dataIndex: 'notes', title: t('common.notes') },
            ]}
          />
        </>
      )}

      <Modal
        title={t('buttons.completeInspection', 'Complete Inspection')}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleComplete}
        confirmLoading={completing}
      >
        <Form form={form} layout="vertical">
          <Form.Item label={fl('quality_inspections', 'result')} name="result" rules={[{ required: true, message: t('validation.requiredField') }]}>
            <Select options={translateOptions(INSPECTION_RESULT_OPTIONS, t)} placeholder={t('placeholder.select_inspection_result')} />
          </Form.Item>
          <Space size="large">
            <Form.Item label={fl('quality_inspections', 'qualified_quantity')} name="qualified_quantity" rules={[{ required: true }]}>
              <InputNumber min={0} precision={4} style={{ width: 160 }} />
            </Form.Item>
            <Form.Item label={fl('quality_inspections', 'defective_quantity')} name="defective_quantity" rules={[{ required: true }]}>
              <InputNumber min={0} precision={4} style={{ width: 160 }} />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </Show>
  );
};
