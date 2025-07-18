// packages/utils/src/language/types.ts
export type SupportedLocale = 'pl' | 'en' | 'uk' | 'ru';

export const SUPPORTED_LOCALES: readonly SupportedLocale[] = ['pl', 'en', 'uk', 'ru'] as const;

export interface ClientLanguageContext {
  preferredLocale?: SupportedLocale;
  alternateLocales?: SupportedLocale[];
}

export interface SalonLanguageContext {
  primaryLocale: SupportedLocale;
  supportedLocales: SupportedLocale[];
  publicDefaultLocale?: SupportedLocale;
  autoTranslateEnabled: boolean;
}

export interface StaffLanguageContext {
  spokenLocales?: SupportedLocale[];
}

export interface ResolveLocaleOptions {
  client?: ClientLanguageContext;
  salon: SalonLanguageContext;
  staff?: StaffLanguageContext;
  browserLocales?: string[];
  fallback?: SupportedLocale;
}

export interface TranslationCacheEntry {
  text: string;
  from: SupportedLocale;
  to: SupportedLocale;
  source: 'cache' | 'glossary' | 'llm';
  createdAt: Date;
}