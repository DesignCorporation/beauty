import type { 
  SupportedLocale, 
  ResolveLocaleOptions, 
  ClientLanguageContext,
  SalonLanguageContext,
  StaffLanguageContext 
} from './types';
import { SUPPORTED_LOCALES } from './types';

/**
 * Language Resolver - определяет оптимальный язык для клиента
 * Приоритеты: client.preferred → client.alternate ∩ salon.supported → staff.spoken ∩ supported → salon.publicDefault || salon.primary
 */
export function resolveLocale(options: ResolveLocaleOptions): SupportedLocale {
  const { client, salon, staff, browserLocales, fallback = 'en' } = options;

  // 1. Client preferred locale (если поддерживается салоном)
  if (client?.preferredLocale && salon.supportedLocales.includes(client.preferredLocale)) {
    return client.preferredLocale;
  }

  // 2. Client alternate locales ∩ salon supported
  if (client?.alternateLocales?.length) {
    const intersection = client.alternateLocales.filter(locale => 
      salon.supportedLocales.includes(locale)
    );
    if (intersection.length > 0) {
      return intersection[0];
    }
  }

  // 3. Browser locales ∩ salon supported
  if (browserLocales?.length) {
    for (const browserLocale of browserLocales) {
      const normalizedLocale = normalizeBrowserLocale(browserLocale);
      if (normalizedLocale && salon.supportedLocales.includes(normalizedLocale)) {
        return normalizedLocale;
      }
    }
  }

  // 4. Staff spoken locales ∩ salon supported (если есть выбранный мастер)
  if (staff?.spokenLocales?.length) {
    const staffSalonIntersection = staff.spokenLocales.filter(locale =>
      salon.supportedLocales.includes(locale)
    );
    if (staffSalonIntersection.length > 0) {
      return staffSalonIntersection[0];
    }
  }

  // 5. Salon public default locale
  if (salon.publicDefaultLocale && salon.supportedLocales.includes(salon.publicDefaultLocale)) {
    return salon.publicDefaultLocale;
  }

  // 6. Salon primary locale
  if (salon.supportedLocales.includes(salon.primaryLocale)) {
    return salon.primaryLocale;
  }

  // 7. Fallback
  return salon.supportedLocales.includes(fallback) ? fallback : salon.supportedLocales[0];
}

/**
 * Нормализует browser locale (en-US, pl-PL) к нашим SupportedLocale
 */
function normalizeBrowserLocale(browserLocale: string): SupportedLocale | null {
  const normalized = browserLocale.toLowerCase().split('-')[0];
  
  const localeMap: Record<string, SupportedLocale> = {
    'pl': 'pl',
    'en': 'en', 
    'uk': 'uk',
    'ua': 'uk', // Украинский может быть ua
    'ru': 'ru'
  };

  const result = localeMap[normalized];
  return result && SUPPORTED_LOCALES.includes(result) ? result : null;
}

/**
 * Парсит Accept-Language заголовок
 */
export function parseAcceptLanguage(acceptLanguage?: string): string[] {
  if (!acceptLanguage) return [];
  
  return acceptLanguage
    .split(',')
    .map(lang => {
      const [locale, q] = lang.trim().split(';q=');
      return { locale: locale.trim(), quality: q ? parseFloat(q) : 1.0 };
    })
    .sort((a, b) => b.quality - a.quality)
    .map(item => item.locale);
}