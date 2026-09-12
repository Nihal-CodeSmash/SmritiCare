// =============================================
// SMRITI CARE — i18n Helper
// =============================================

import en from './en';
import hi from './hi';
import type { Language } from '@/types';

const translations = { en, hi } as const;

export function getTranslations(lang: Language) {
  return translations[lang] ?? translations.en;
}

export { en, hi };
export type { Language };
