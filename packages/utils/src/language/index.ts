// Types
export * from './types';

// Core functions
export { resolveLocale, parseAcceptLanguage } from './resolver';
export { TranslationBridge } from './translator';
export { 
  ensureServiceTranslation, 
  ensureAllServiceTranslations,
  getTranslatedService,
  getTranslatedServices 
} from './service-translation';

// Re-export commonly used types
export type { 
  SupportedLocale, 
  ResolveLocaleOptions,
  ClientLanguageContext,
  SalonLanguageContext,
  StaffLanguageContext,
  TranslationCacheEntry
} from './types';