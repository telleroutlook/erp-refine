import React from 'react';
import { useShow } from '@refinedev/core';
import { Show } from '@refinedev/antd';
import { Descriptions } from 'antd';
import { useTranslation } from 'react-i18next';
import { useFieldLabel } from '../../../hooks';
import { ActiveStatusTag } from '../../../components/shared/ActiveStatusTag';

export const DefectCodeShow: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { queryResult } = useShow({ resource: 'defect-codes' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={`${t('defect-codes.defect-codes')} ${record?.code ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label={fl('defect_codes', 'code')}>{record?.code}</Descriptions.Item>
        <Descriptions.Item label={fl('defect_codes', 'name')}>{record?.name}</Descriptions.Item>
        <Descriptions.Item label={fl('defect_codes', 'category')}>{record?.category}</Descriptions.Item>
        <Descriptions.Item label={fl('defect_codes', 'severity')}>{record?.severity}</Descriptions.Item>
        <Descriptions.Item label={fl('defect_codes', 'description')} span={2}>{record?.description}</Descriptions.Item>
        <Descriptions.Item label={t('common.status')}>
          <ActiveStatusTag value={record?.is_active} />
        </Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
