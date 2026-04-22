import type { ThemeConfig } from 'antd';

export const erpTheme: ThemeConfig = {
  token: {
    colorPrimary: '#1677FF',
    colorInfo: '#1677FF',
    colorSuccess: '#16a34a',
    colorWarning: '#d97706',
    colorError: '#dc2626',

    colorBgLayout: '#f5f7fa',
    colorBgContainer: '#ffffff',
    colorBgElevated: '#ffffff',

    colorText: '#1f2937',
    colorTextSecondary: '#6b7280',
    colorTextTertiary: '#9ca3af',
    colorTextQuaternary: '#d1d5db',

    colorBorder: '#d1d5db',
    colorBorderSecondary: '#e5e7eb',
    colorSplit: '#e5e7eb',

    borderRadius: 6,
    borderRadiusLG: 8,
    borderRadiusSM: 4,
    borderRadiusXS: 2,

    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    boxShadowSecondary: '0 4px 12px rgba(0, 0, 0, 0.08)',

    fontSize: 14,
    fontSizeHeading1: 28,
    fontSizeHeading2: 22,
    fontSizeHeading3: 18,
    fontSizeHeading4: 16,
    fontSizeHeading5: 14,

    controlHeight: 34,
    controlHeightLG: 40,
    controlHeightSM: 28,

    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Noto Color Emoji"',

    motionEaseInOut: 'cubic-bezier(0.22, 1, 0.36, 1)',
  },
  components: {
    Layout: {
      headerBg: '#ffffff',
      headerHeight: 56,
      bodyBg: '#f5f7fa',
      siderBg: '#ffffff',
      triggerBg: '#f0f0f0',
    },
    Menu: {
      itemSelectedBg: '#e6f4ff',
      itemSelectedColor: '#0050b3',
      itemHoverBg: '#f0f5ff',
      fontWeightStrong: 600,
      itemBorderRadius: 6,
      itemHeight: 40,
      iconMarginInlineEnd: 10,
      subMenuItemBg: 'transparent',
    },
    Table: {
      headerBg: '#fafbfc',
      headerColor: '#6b7280',
      rowHoverBg: '#f0f7ff',
      headerBorderRadius: 8,
      cellPaddingBlock: 12,
    },
    Card: {
      borderRadiusLG: 10,
      paddingLG: 20,
    },
    Button: {
      borderRadius: 6,
      fontWeight: 500,
    },
    Input: {
      borderRadius: 6,
    },
    Select: {
      borderRadius: 6,
    },
    DatePicker: {
      borderRadius: 6,
    },
    Descriptions: {
      labelBg: '#f9fafb',
    },
    Divider: {
      colorSplit: '#d1d5db',
    },
    Tag: {
      borderRadiusSM: 4,
    },
  },
};
