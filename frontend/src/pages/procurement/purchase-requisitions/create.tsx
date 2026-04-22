import React from 'react';
import { useForm, Create } from '@refinedev/antd';
import { useList } from '@refinedev/core';
import { Form, Input, DatePicker, Select, Row, Col } from 'antd';
import { REQUISITION_STATUS_OPTIONS, translateOptions } from '../../../constants/options';
import { FULL_WIDTH } from '../../../constants/styles';
import { useTranslation } from 'react-i18next';
import { useFieldLabel, usePageTitle } from '../../../hooks';

export const PurchaseRequisitionCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'purchase-requisitions' });
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const pt = usePageTitle();
  const statusOpts = translateOptions(REQUISITION_STATUS_OPTIONS.slice(0, 2), t);
  const { data: departmentsData } = useList({ resource: 'departments', pagination: { pageSize: 500 } });
  const departmentOptions = (departmentsData?.data ?? []).map((d: any) => ({ label: d.name, value: d.id }));

  return (
    <Create saveButtonProps={saveButtonProps} title={pt('purchase_requisitions', 'create')}>
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={fl('purchase_requisitions', 'department_id')} name="department_id">
              <Select options={departmentOptions} showSearch optionFilterProp="label" placeholder="选择部门" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label={t('common.status')} name="status" initialValue="draft">
              <Select options={statusOpts} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label={fl('purchase_requisitions', 'request_date')}
              name="request_date"
              rules={[{ required: true, message: '请选择申请日期' }]}
              getValueFromEvent={(d) => d?.format('YYYY-MM-DD')}
            >
              <DatePicker style={FULL_WIDTH} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label={fl('purchase_requisitions', 'required_date')}
              name="required_date"
              getValueFromEvent={(d) => d?.format('YYYY-MM-DD')}
            >
              <DatePicker style={FULL_WIDTH} />
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
