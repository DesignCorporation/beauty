export interface BeautyConfig {
  apiUrl: string;
  version: string;
  features: string[];
}

export const DEFAULT_CONFIG: BeautyConfig = {
  apiUrl: 'https://api.beauty.designcorp.eu',
  version: '1.0.0',
  features: ['multi-tenant', 'booking', 'crm', 'analytics']
};

export function createBeautyConfig(overrides?: Partial<BeautyConfig>): BeautyConfig {
  return { ...DEFAULT_CONFIG, ...overrides };
}

export function formatCurrency(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount);
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export const SUPPORTED_LOCALES = ['pl', 'ru', 'uk', 'en'] as const;
export type SupportedLocale = typeof SUPPORTED_LOCALES[number];

export function isValidLocale(locale: string): locale is SupportedLocale {
  return SUPPORTED_LOCALES.includes(locale as SupportedLocale);
}