import type { SupportedLocale } from './types';
import type { TranslationBridge } from './translator';

interface Service {
  id: string;
  salonId: string;
  baseName: string;
  baseDescription?: string;
}

interface ServiceTranslation {
  id: string;
  serviceId: string;
  salonId: string;
  locale: SupportedLocale;
  name: string;
  description?: string;
  source: 'AUTO' | 'MANUAL' | 'LLM';
  approved: boolean;
}

interface Salon {
  autoTranslateEnabled: boolean;
  supportedLocales: SupportedLocale[];
  primaryLocale?: SupportedLocale;
}

/**
 * Обеспечивает наличие перевода услуги на нужный язык
 */
export async function ensureServiceTranslation(
  service: Service,
  locale: SupportedLocale,
  salon: Salon,
  translationBridge: TranslationBridge,
  prisma: any // TODO: типизировать Prisma client
): Promise<ServiceTranslation | null> {
  
  // Проверяем существующий перевод
  const existing = await prisma.serviceTranslation.findUnique({
    where: {
      serviceId_locale: {
        serviceId: service.id,
        locale
      }
    }
  });

  if (existing) {
    return existing;
  }

  // Если автоперевод выключен, не создаём
  if (!salon.autoTranslateEnabled) {
    console.log(`Auto-translation disabled for salon ${service.salonId}, skipping translation for ${locale}`);
    return null;
  }

  // Если язык не поддерживается салоном, не создаём
  if (!salon.supportedLocales.includes(locale)) {
    console.log(`Locale ${locale} not supported by salon ${service.salonId}`);
    return null;
  }

  // Если это базовый язык салона, не создаём перевод
  const primaryLocale = salon.primaryLocale || 'pl';
  if (locale === primaryLocale) {
    console.log(`Locale ${locale} is primary for salon ${service.salonId}, no translation needed`);
    return null;
  }

  // Создаём автоперевод
  try {
    console.log(`Creating auto-translation for service ${service.id} to ${locale}`);

    const translatedName = await translationBridge.translateText(
      service.baseName, 
      primaryLocale,
      locale
    );

    const translatedDescription = service.baseDescription 
      ? await translationBridge.translateText(service.baseDescription, primaryLocale, locale)
      : null;

    const newTranslation = await prisma.serviceTranslation.create({
      data: {
        serviceId: service.id,
        salonId: service.salonId,
        locale,
        name: translatedName,
        description: translatedDescription,
        source: 'AUTO',
        approved: false
      }
    });

    console.log(`Created translation for service ${service.id}: ${service.baseName} -> ${translatedName} (${locale})`);
    return newTranslation;
  } catch (error) {
    console.error('Failed to create service translation:', error);
    return null;
  }
}

/**
 * Массовое создание переводов для всех услуг салона
 */
export async function ensureAllServiceTranslations(
  salonId: string,
  locale: SupportedLocale,
  salon: Salon,
  translationBridge: TranslationBridge,
  prisma: any
): Promise<{ created: number; skipped: number; errors: number }> {
  
  const stats = { created: 0, skipped: 0, errors: 0 };

  try {
    // Получаем все активные услуги салона
    const services = await prisma.service.findMany({
      where: {
        salonId,
        active: true
      }
    });

    console.log(`Processing ${services.length} services for translation to ${locale}`);

    // Создаём переводы для каждой услуги
    for (const service of services) {
      try {
        const translation = await ensureServiceTranslation(
          service,
          locale,
          salon,
          translationBridge,
          prisma
        );

        if (translation) {
          stats.created++;
        } else {
          stats.skipped++;
        }
      } catch (error) {
        console.error(`Failed to translate service ${service.id}:`, error);
        stats.errors++;
      }
    }

    console.log(`Translation batch complete for ${locale}: created=${stats.created}, skipped=${stats.skipped}, errors=${stats.errors}`);
    return stats;

  } catch (error) {
    console.error('Failed to load services for translation:', error);
    throw error;
  }
}

/**
 * Получает переведенную услугу с fallback к базовому названию
 */
export async function getTranslatedService(
  service: Service,
  locale: SupportedLocale,
  salon: Salon,
  translationBridge: TranslationBridge,
  prisma: any
) {
  // Пытаемся получить существующий перевод
  let translation = await prisma.serviceTranslation.findUnique({
    where: {
      serviceId_locale: {
        serviceId: service.id,
        locale
      }
    }
  });

  // Если перевода нет, создаём автоматически
  if (!translation) {
    translation = await ensureServiceTranslation(
      service,
      locale,
      salon,
      translationBridge,
      prisma
    );
  }

  // Возвращаем переведенную версию или fallback
  return {
    id: service.id,
    salonId: service.salonId,
    code: (service as any).code,
    name: translation?.name || service.baseName,
    description: translation?.description || service.baseDescription,
    locale: translation?.locale || salon.primaryLocale || 'pl',
    translationSource: translation?.source || 'none',
    translationApproved: translation?.approved || false
  };
}

/**
 * Загружает переводы для списка услуг оптимизированным способом
 */
export async function getTranslatedServices(
  services: Service[],
  locale: SupportedLocale,
  salon: Salon,
  translationBridge: TranslationBridge,
  prisma: any
) {
  if (services.length === 0) return [];

  // Получаем все существующие переводы одним запросом
  const serviceIds = services.map(s => s.id);
  const existingTranslations = await prisma.serviceTranslation.findMany({
    where: {
      serviceId: { in: serviceIds },
      locale
    }
  });

  // Создаём Map для быстрого поиска
  const translationMap = new Map(
    existingTranslations.map(t => [t.serviceId, t])
  );

  // Обрабатываем каждую услугу
  const results = await Promise.all(
    services.map(async (service) => {
      const existingTranslation = translationMap.get(service.id);
      
      if (existingTranslation) {
        // Используем существующий перевод
        return {
          id: service.id,
          salonId: service.salonId,
          code: (service as any).code,
          name: existingTranslation.name,
          description: existingTranslation.description,
          locale: existingTranslation.locale,
          translationSource: existingTranslation.source,
          translationApproved: existingTranslation.approved
        };
      } else {
        // Создаём новый перевод
        const translation = await ensureServiceTranslation(
          service,
          locale,
          salon,
          translationBridge,
          prisma
        );

        return {
          id: service.id,
          salonId: service.salonId,
          code: (service as any).code,
          name: translation?.name || service.baseName,
          description: translation?.description || service.baseDescription,
          locale: translation?.locale || salon.primaryLocale || 'pl',
          translationSource: translation?.source || 'none',
          translationApproved: translation?.approved || false
        };
      }
    })
  );

  return results;
}