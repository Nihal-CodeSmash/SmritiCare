// =============================================
// SMRITI CARE — i18n Helper
// =============================================

import en from './en';
import hi from './hi';
import asLang from './as';
import mniLang from './mni';
import lusLang from './lus';
import njzLang from './njz';
import type { Language } from '@/types';

const translations: Record<Language, typeof en> = { 
  en, 
  hi,
  as: asLang,
  mni: mniLang,
  lus: lusLang,
  njz: njzLang
};

export function getTranslations(lang: Language) {
  return translations[lang] ?? translations.en;
}

export { en, hi };
export type { Language };
