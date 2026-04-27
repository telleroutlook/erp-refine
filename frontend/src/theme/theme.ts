import type { ThemeConfig } from 'antd';

export const erpTheme: ThemeConfig = {
  token: {
    colorPrimary: '#0F172A',
    colorPrimaryHover: '#1E293B',
    colorPrimaryActive: '#020617',
    colorInfo: '#0EA5E9',
    colorSuccess: '#22C55E',
    colorWarning: '#EAB308',
    colorError: '#EF4444',

    colorBgLayout: '#F8FAFC',
    colorBgContainer: '#FFFFFF',
    colorBgElevated: '#FFFFFF',

    colorText: '#0F172A',
    colorTextSecondary: '#64748B',
    colorTextTertiary: '#94A3B8',
    colorTextQuaternary: '#CBD5E1',

    colorBorder: '#E2E8F0',
    colorBorderSecondary: '#E2E8F0',
    colorSplit: '#E2E8F0',

    borderRadius: 8,
    borderRadiusLG: 12,
    borderRadiusSM: 4,
    borderRadiusXS: 4,

    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04), 0 1px 2px rgba(15, 23, 42, 0.06)',
    boxShadowSecondary: '0 4px 16px rgba(15, 23, 42, 0.08), 0 2px 6px rgba(15, 23, 42, 0.04)',

    fontSize: 14,
    fontSizeHeading1: 30,
    fontSizeHeading2: 24,
    fontSizeHeading3: 20,
    fontSizeHeading4: 16,
    fontSizeHeading5: 14,

    controlHeight: 42,
    controlHeightLG: 48,
    controlHeightSM: 36,

    fontFamily:
      'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans SC", sans-serif',

    motionEaseInOut: 'cubic-bezier(0.22, 1, 0.36, 1)',
  },
  components: {
    Layout: {
      headerBg: '#FFFFFF',
      headerHeight: 56,
      bodyBg: '#F8FAFC',
      siderBg: '#131B2E',
      triggerBg: '#1E293B',
    },
    Menu: {
      itemSelectedBg: 'rgba(5, 150, 105, 0.12)',
      itemSelectedColor: '#FFFFFF',
      itemHoverBg: 'rgba(255, 255, 255, 0.06)',
      itemHoverColor: '#FFFFFF',
      itemColor: 'rgba(255, 255, 255, 0.7)',
      subMenuItemBg: 'transparent',
      fontWeightStrong: 600,
      itemBorderRadius: 8,
      itemHeight: 44,
      iconMarginInlineEnd: 12,
      darkItemBg: '#131B2E',
      darkItemColor: 'rgba(255, 255, 255, 0.7)',
      darkItemHoverBg: 'rgba(255, 255, 255, 0.06)',
      darkItemHoverColor: '#FFFFFF',
      darkItemSelectedBg: 'rgba(5, 150, 105, 0.15)',
      darkItemSelectedColor: '#FFFFFF',
      darkSubMenuItemBg: 'transparent',
      darkPopupBg: '#1E293B',
    },
    Table: {
      headerBg: '#F8FAFC',
      headerColor: '#64748B',
      rowHoverBg: 'rgba(15, 23, 42, 0.03)',
      headerBorderRadius: 8,
      cellPaddingBlock: 14,
    },
    Card: {
      borderRadiusLG: 8,
      paddingLG: 24,
    },
    Button: {
      borderRadius: 8,
      fontWeight: 500,
      defaultBorderColor: '#E2E8F0',
      defaultColor: '#0F172A',
    },
    Input: {
      borderRadius: 8,
      activeBorderColor: '#0F172A',
      hoverBorderColor: '#94A3B8',
      activeShadow: '0 0 0 2px rgba(15, 23, 42, 0.08)',
    },
    Select: {
      borderRadius: 8,
    },
    DatePicker: {
      borderRadius: 8,
    },
    Descriptions: {
      labelBg: '#F8FAFC',
    },
    Divider: {
      colorSplit: '#E2E8F0',
    },
    Tag: {
      borderRadiusSM: 4,
    },
    Tabs: {
      inkBarColor: '#0F172A',
      itemSelectedColor: '#0F172A',
      itemHoverColor: '#334155',
    },
  },
};
