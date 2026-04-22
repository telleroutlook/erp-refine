import type { CSSProperties } from 'react';
import dayjs from 'dayjs';

export const FULL_WIDTH: CSSProperties = { width: '100%' };

export const dateFormItemProps = {
  getValueProps: (v: string | undefined) => ({ value: v ? dayjs(v) : undefined }),
  getValueFromEvent: (d: dayjs.Dayjs | null) => d?.format('YYYY-MM-DD'),
};
