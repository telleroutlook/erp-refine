import React from 'react';
import { useShow } from '@refinedev/core';
import { Show, DateField } from '@refinedev/antd';
import { Descriptions } from 'antd';
import { useTranslation } from 'react-i18next';
import { useFieldLabel } from '../../../hooks';

export const NumberSequenceShow: React.FC = () => {
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const { queryResult } = useShow({ resource: 'number-sequences' });
  const record = queryResult.data?.data as any;

  return (
    <Show title={`${t('menu.numberSequences')} ${record?.sequence_name ?? ''}`} isLoading={queryResult.isLoading}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }}>
        <Descriptions.Item label={fl('number_sequences', 'sequence_name')}>{record?.sequence_name}</Descriptions.Item>
        <Descriptions.Item label={fl('number_sequences', 'prefix')}>{record?.prefix}</Descriptions.Item>
        <Descriptions.Item label={fl('number_sequences', 'current_value')}>{record?.current_value}</Descriptions.Item>
        <Descriptions.Item label={fl('number_sequences', 'padding')}>{record?.padding}</Descriptions.Item>
        <Descriptions.Item label={fl('number_sequences', 'increment_by')}>{record?.increment_by}</Descriptions.Item>
        <Descriptions.Item label={fl('number_sequences', 'created_at')}><DateField value={record?.created_at} format="YYYY-MM-DD HH:mm" /></Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
