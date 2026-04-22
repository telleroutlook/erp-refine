import React from 'react';
import { useForm, Create } from '@refinedev/antd';
import { useList } from '@refinedev/core';
import { Form, Input, DatePicker, Select, Row, Col } from 'antd';
import { REQUISITION_STATUS_OPTIONS } from '../../../constants/options';
import { FULL_WIDTH } from '../../../constants/styles';

const STATUS_OPTIONS = REQUISITION_STATUS_OPTIONS.slice(0, 2);

export const PurchaseRequisitionCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({ resource: 'purchase-requisitions' });
  const { data: departmentsData } = useList({ resource: 'departments', pagination: { pageSize: 500 } });
  const departmentOptions = (departmentsData?.data ?? []).map((d: any) => ({ label: d.name, value: d.id }));

  return (
    <Create saveButtonProps={saveButtonProps} title="新建采购申请">
      <Form {...formProps} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="部门" name="department_id">
              <Select options={departmentOptions} showSearch optionFilterProp="label" placeholder="选择部门" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item label="状态" name="status" initialValue="draft">
              <Select options={STATUS_OPTIONS} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label="申请日期"
              name="request_date"
              rules={[{ required: true, message: '请选择申请日期' }]}
              getValueFromEvent={(d) => d?.format('YYYY-MM-DD')}
            >
              <DatePicker style={FULL_WIDTH} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item
              label="需求日期"
              name="required_date"
              getValueFromEvent={(d) => d?.format('YYYY-MM-DD')}
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
    </Create>
  );
};
