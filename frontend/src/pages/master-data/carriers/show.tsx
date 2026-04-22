import React from 'react';
import { useShow } from '@refinedev/core';
import { Show } from '@refinedev/antd';
import { Descriptions } from 'antd';
import { ActiveStatusTag } from '../../../components/shared/ActiveStatusTag';
import { useTranslation } from 'react-i18next';
import { useFieldLabel } from '../../../hooks';

export const CarrierShow: React.FC = () => {
  const { queryResult } = useShow({ resource: 'carriers' });
  const { t } = useTranslation();
  const fl = useFieldLabel();
  const record = queryResult?.data?.data as any;

  const carrierTypeLabels: Record<string, string> = {
    express: t('enums.carrierType.express'), freight: t('enums.carrierType.freight'), ltl: t('enums.carrierType.ltl'), ftl: t('enums.carrierType.ftl'), ocean: t('enums.carrierType.ocean'), air: t('enums.carrierType.air'),
  };

  return (
    <Show title={t('menu.carriers')}>
      <Descriptions bordered column={{ xs: 1, sm: 1, md: 2 }} size="small">
        <Descriptions.Item label={fl('carriers', 'code')}>{record?.code}</Descriptions.Item>
        <Descriptions.Item label={fl('carriers', 'name')}>{record?.name}</Descriptions.Item>
        <Descriptions.Item label={fl('carriers', 'type')}>{carrierTypeLabels[record?.carrier_type] ?? record?.carrier_type}</Descriptions.Item>
        <Descriptions.Item label={t('common.status')}>
          <ActiveStatusTag value={record?.is_active} />
        </Descriptions.Item>
        <Descriptions.Item label={fl('carriers', 'contact')}>{record?.contact}</Descriptions.Item>
        <Descriptions.Item label={fl('carriers', 'phone')}>{record?.phone}</Descriptions.Item>
        <Descriptions.Item label={fl('carriers', 'tracking_url_template')} span={2}>{record?.tracking_url_template || '-'}</Descriptions.Item>
      </Descriptions>
    </Show>
  );
};
