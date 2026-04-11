// src/providers/i18n-provider.ts
// Refine i18nProvider adapter for react-i18next

import type { I18nProvider } from '@refinedev/core';
import i18n from '../i18n/i18n';

export const i18nProvider: I18nProvider = {
  translate: (key: string, params?: Record<string, unknown>) => {
    return i18n.t(key, params as any) as string;
  },
  getLocale: () => i18n.language,
  changeLocale: async (lang: string) => {
    await i18n.changeLanguage(lang);
  },
};
