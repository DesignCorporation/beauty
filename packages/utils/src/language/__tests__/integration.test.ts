import { resolveLocale } from '../resolver';
import { TranslationBridge } from '../translator';
import { ensureServiceTranslation, getTranslatedServices } from '../service-translation';
import type { ResolveLocaleOptions } from '../types';

// Mock fs для TranslationBridge
jest.mock('fs', () => ({
  readFileSync: jest.fn().mockReturnValue(`
strzyżenie:
  en: haircut
  uk: стрижка
  ru: стрижка

manicure:
  en: manicure
  uk: манікюр
  ru: маникюр

koloryzacja:
  en: hair coloring
  uk: фарбування волосся
  ru: окрашивание волос

brwi:
  en: eyebrows
  uk: брови
  ru: брови

masaż:
  en: massage
  uk: масаж
  ru: массаж
  `)
}));

// Mock Prisma client
const mockPrisma = {
  serviceTranslation: {
    findUnique: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn()
  }
};

describe('Language System Integration Tests', () => {
  
  test('should resolve locale and translate service name', async () => {
    // Resolve locale для клиента
    const options: ResolveLocaleOptions = {
      client: { preferredLocale: 'ru' },
      salon: {
        primaryLocale: 'pl',
        supportedLocales: ['pl', 'ru', 'en'],
        autoTranslateEnabled: true
      }
    };
    
    const locale = resolveLocale(options);
    expect(locale).toBe('ru');
    
    // Перевод названия услуги
    const bridge = new TranslationBridge();
    const translatedName = await bridge.translateText('strzyżenie', 'pl', locale);
    expect(translatedName).toBe('стрижка');
  });

  test('should handle beauty salon workflow', async () => {
    // Симуляция реального сценария салона красоты
    const salonContext = {
      primaryLocale: 'pl' as const,
      supportedLocales: ['pl', 'ru', 'uk', 'en'] as const,
      autoTranslateEnabled: true
    };

    const clientContext = {
      preferredLocale: 'uk' as const,
      alternateLocales: ['ru', 'en'] as const
    };

    const staffContext = {
      spokenLocales: ['pl', 'ru'] as const
    };

    // 1. Определяем язык
    const resolvedLocale = resolveLocale({
      client: clientContext,
      salon: salonContext,
      staff: staffContext
    });

    expect(resolvedLocale).toBe('uk'); // client preferred

    // 2. Переводим услуги
    const bridge = new TranslationBridge();
    const services = ['manicure', 'strzyżenie', 'masaż'];
    
    const translations = await Promise.all(
      services.map(service => bridge.translateText(service, 'pl', resolvedLocale))
    );

    expect(translations).toEqual(['манікюр', 'стрижка', 'масаж']);
  });

  test('should create service translation when missing', async () => {
    // Mock что перевода нет
    mockPrisma.serviceTranslation.findUnique.mockResolvedValue(null);
    
    // Mock создание нового перевода
    const newTranslation = {
      id: 'trans_123',
      serviceId: 'service_123',
      salonId: 'salon_123',
      locale: 'ru',
      name: 'стрижка',
      description: null,
      source: 'AUTO',
      approved: false
    };
    mockPrisma.serviceTranslation.create.mockResolvedValue(newTranslation);

    const service = {
      id: 'service_123',
      salonId: 'salon_123',
      baseName: 'strzyżenie',
      baseDescription: undefined
    };

    const salon = {
      autoTranslateEnabled: true,
      supportedLocales: ['pl', 'ru', 'en'] as const,
      primaryLocale: 'pl' as const
    };

    const bridge = new TranslationBridge();
    
    const result = await ensureServiceTranslation(
      service,
      'ru',
      salon,
      bridge,
      mockPrisma
    );

    expect(result).toEqual(newTranslation);
    expect(mockPrisma.serviceTranslation.create).toHaveBeenCalledWith({
      data: {
        serviceId: 'service_123',
        salonId: 'salon_123',
        locale: 'ru',
        name: 'стрижка',
        description: null,
        source: 'AUTO',
        approved: false
      }
    });
  });

  test('should not create translation when auto-translate disabled', async () => {
    const service = {
      id: 'service_123',
      salonId: 'salon_123',
      baseName: 'strzyżenie',
      baseDescription: undefined
    };

    const salon = {
      autoTranslateEnabled: false, // выключено
      supportedLocales: ['pl', 'ru'] as const
    };

    const bridge = new TranslationBridge();
    
    const result = await ensureServiceTranslation(
      service,
      'ru',
      salon,
      bridge,
      mockPrisma
    );

    expect(result).toBeNull();
    expect(mockPrisma.serviceTranslation.create).not.toHaveBeenCalled();
  });

  test('should not create translation for unsupported locale', async () => {
    const service = {
      id: 'service_123',
      salonId: 'salon_123',
      baseName: 'strzyżenie'
    };

    const salon = {
      autoTranslateEnabled: true,
      supportedLocales: ['pl', 'en'] as const // ru не поддерживается
    };

    const bridge = new TranslationBridge();
    
    const result = await ensureServiceTranslation(
      service,
      'ru', // не поддерживается
      salon,
      bridge,
      mockPrisma
    );

    expect(result).toBeNull();
    expect(mockPrisma.serviceTranslation.create).not.toHaveBeenCalled();
  });

  test('should handle batch service translation efficiently', async () => {
    const services = [
      { id: 'svc1', salonId: 'salon1', baseName: 'strzyżenie', code: 'haircut' },
      { id: 'svc2', salonId: 'salon1', baseName: 'manicure', code: 'manicure' },
      { id: 'svc3', salonId: 'salon1', baseName: 'masaż', code: 'massage' }
    ];

    // Mock что переводов нет
    mockPrisma.serviceTranslation.findMany.mockResolvedValue([]);

    const salon = {
      autoTranslateEnabled: true,
      supportedLocales: ['pl', 'ru'] as const,
      primaryLocale: 'pl' as const
    };

    const bridge = new TranslationBridge();

    const translated = await getTranslatedServices(
      services,
      'ru',
      salon,
      bridge,
      mockPrisma
    );

    expect(translated).toHaveLength(3);
    expect(translated[0].name).toBe('стрижка');
    expect(translated[1].name).toBe('маникюр');
    expect(translated[2].name).toBe('массаж');
    
    // Должен быть только один вызов findMany для оптимизации
    expect(mockPrisma.serviceTranslation.findMany).toHaveBeenCalledTimes(1);
  });

  test('should prioritize existing translations over auto-creation', async () => {
    const services = [
      { id: 'svc1', salonId: 'salon1', baseName: 'strzyżenie', code: 'haircut' }
    ];

    // Mock существующий перевод
    const existingTranslation = {
      serviceId: 'svc1',
      locale: 'ru',
      name: 'Стрижка волос', // отличается от glossary
      description: 'Профессиональная стрижка',
      source: 'MANUAL',
      approved: true
    };
    
    mockPrisma.serviceTranslation.findMany.mockResolvedValue([existingTranslation]);

    const salon = {
      autoTranslateEnabled: true,
      supportedLocales: ['pl', 'ru'] as const,
      primaryLocale: 'pl' as const
    };

    const bridge = new TranslationBridge();

    const translated = await getTranslatedServices(
      services,
      'ru',
      salon,
      bridge,
      mockPrisma
    );

    expect(translated[0].name).toBe('Стрижка волос'); // из БД, не из glossary
    expect(translated[0].translationSource).toBe('MANUAL');
    expect(translated[0].translationApproved).toBe(true);
  });

  test('should handle complex salon workflow with multiple locales', async () => {
    // Полный workflow: определение языка + перевод услуг + fallback
    const multilingualSalon = {
      primaryLocale: 'pl' as const,
      supportedLocales: ['pl', 'ru', 'uk', 'en'] as const,
      autoTranslateEnabled: true
    };

    // Клиент предпочитает украинский
    const ukrainianClient = {
      preferredLocale: 'uk' as const,
      alternateLocales: ['ru', 'en'] as const
    };

    // Полиглот мастер
    const polyglotStaff = {
      spokenLocales: ['pl', 'ru', 'uk', 'en'] as const
    };

    // 1. Определение языка
    const locale = resolveLocale({
      client: ukrainianClient,
      salon: multilingualSalon,
      staff: polyglotStaff
    });

    expect(locale).toBe('uk');

    // 2. Переводы основных beauty услуг
    const bridge = new TranslationBridge();
    const beautyServices = [
      'strzyżenie',   // стрижка
      'manicure',     // манікюр
      'koloryzacja',  // фарбування волосся
      'brwi'          // брови
    ];

    const ukrainianTranslations = await Promise.all(
      beautyServices.map(service => bridge.translateText(service, 'pl', locale))
    );

    expect(ukrainianTranslations).toEqual([
      'стрижка',
      'манікюр', 
      'фарбування волосся',
      'брови'
    ]);

    // 3. Fallback к русскому если украинского нет
    const fallbackLocale = resolveLocale({
      client: { 
        preferredLocale: 'uk',
        alternateLocales: ['ru'] 
      },
      salon: {
        ...multilingualSalon,
        supportedLocales: ['pl', 'ru', 'en'] // нет украинского
      }
    });

    expect(fallbackLocale).toBe('ru'); // fallback к alternate
  });

});

// Очистка моков после каждого теста
afterEach(() => {
  jest.clearAllMocks();
});