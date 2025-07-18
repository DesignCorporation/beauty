import { resolveLocale, parseAcceptLanguage } from '../resolver';
import type { SupportedLocale, ResolveLocaleOptions } from '../types';

describe('Language Resolver Tests (L01-L10)', () => {
  
  // L01: Client preferred locale поддерживается салоном
  test('L01: Client preferred locale is supported by salon', () => {
    const options: ResolveLocaleOptions = {
      client: { preferredLocale: 'ru' },
      salon: {
        primaryLocale: 'pl',
        supportedLocales: ['pl', 'ru', 'en'],
        autoTranslateEnabled: true
      }
    };
    
    expect(resolveLocale(options)).toBe('ru');
  });

  // L02: Client preferred locale НЕ поддерживается салоном, fallback к alternate
  test('L02: Client preferred not supported, fallback to alternate', () => {
    const options: ResolveLocaleOptions = {
      client: { 
        preferredLocale: 'uk',  // не поддерживается
        alternateLocales: ['ru', 'en']  // ru поддерживается
      },
      salon: {
        primaryLocale: 'pl',
        supportedLocales: ['pl', 'ru', 'en'],
        autoTranslateEnabled: true
      }
    };
    
    expect(resolveLocale(options)).toBe('ru');
  });

  // L03: Ни preferred, ни alternate не подходят, используем browser locales
  test('L03: Browser locales when client preferences not supported', () => {
    const options: ResolveLocaleOptions = {
      client: { 
        preferredLocale: 'uk',
        alternateLocales: ['uk']
      },
      salon: {
        primaryLocale: 'pl',
        supportedLocales: ['pl', 'en'],
        autoTranslateEnabled: true
      },
      browserLocales: ['en-US', 'pl-PL']
    };
    
    expect(resolveLocale(options)).toBe('en');
  });

  // L04: Staff spoken locales влияют на выбор при отсутствии клиентских предпочтений
  test('L04: Staff spoken locales when no client preferences', () => {
    const options: ResolveLocaleOptions = {
      salon: {
        primaryLocale: 'pl',
        supportedLocales: ['pl', 'ru', 'en'],
        autoTranslateEnabled: true
      },
      staff: {
        spokenLocales: ['en', 'ru']
      }
    };
    
    expect(resolveLocale(options)).toBe('en');
  });

  // L05: Public default locale используется когда нет других совпадений
  test('L05: Public default locale fallback', () => {
    const options: ResolveLocaleOptions = {
      client: { preferredLocale: 'uk' }, // не поддерживается
      salon: {
        primaryLocale: 'pl',
        supportedLocales: ['pl', 'en'],
        publicDefaultLocale: 'en',
        autoTranslateEnabled: true
      }
    };
    
    expect(resolveLocale(options)).toBe('en');
  });

  // L06: Primary locale финальный fallback
  test('L06: Primary locale as final fallback', () => {
    const options: ResolveLocaleOptions = {
      client: { preferredLocale: 'uk' },
      salon: {
        primaryLocale: 'pl',
        supportedLocales: ['pl'],
        autoTranslateEnabled: true
      }
    };
    
    expect(resolveLocale(options)).toBe('pl');
  });

  // L07: Комплексный сценарий с пересечениями multiple источников
  test('L07: Complex scenario with multiple intersections', () => {
    const options: ResolveLocaleOptions = {
      client: { 
        preferredLocale: 'uk',  // не поддерживается
        alternateLocales: ['ru', 'en', 'pl']  // en первый поддерживается
      },
      salon: {
        primaryLocale: 'pl',
        supportedLocales: ['pl', 'en'],  // ru НЕ поддерживается
        publicDefaultLocale: 'en',
        autoTranslateEnabled: true
      },
      staff: {
        spokenLocales: ['pl', 'ru']  // ru не поддерживается салоном
      },
      browserLocales: ['uk-UA', 'ru-RU', 'en-US']
    };
    
    // Должен выбрать 'en' из client.alternateLocales ∩ salon.supported (второй элемент, так как ru не поддерживается)
    expect(resolveLocale(options)).toBe('en');
  });

  // L08: Browser locales normalization (en-US → en, uk-UA → uk)
  test('L08: Browser locales normalization', () => {
    const options: ResolveLocaleOptions = {
      salon: {
        primaryLocale: 'pl',
        supportedLocales: ['pl', 'uk', 'en'],
        autoTranslateEnabled: true
      },
      browserLocales: ['uk-UA', 'en-US', 'pl-PL']
    };
    
    expect(resolveLocale(options)).toBe('uk');
  });

  // L09: Edge case - салон поддерживает только primary locale
  test('L09: Salon supports only primary locale', () => {
    const options: ResolveLocaleOptions = {
      client: { 
        preferredLocale: 'en',
        alternateLocales: ['ru', 'uk']
      },
      salon: {
        primaryLocale: 'pl',
        supportedLocales: ['pl'],  // только польский
        autoTranslateEnabled: false
      },
      browserLocales: ['en-US', 'ru-RU']
    };
    
    expect(resolveLocale(options)).toBe('pl');
  });

  // L10: Empty/null inputs handling
  test('L10: Empty and null inputs handling', () => {
    const options: ResolveLocaleOptions = {
      salon: {
        primaryLocale: 'pl',
        supportedLocales: ['pl', 'en'],
        autoTranslateEnabled: true
      },
      client: undefined,
      staff: undefined,
      browserLocales: []
    };
    
    expect(resolveLocale(options)).toBe('pl');
  });

  // Дополнительные тесты для parseAcceptLanguage
  describe('parseAcceptLanguage', () => {
    test('should parse Accept-Language header correctly', () => {
      const header = 'en-US,en;q=0.9,pl;q=0.8,ru;q=0.7';
      const result = parseAcceptLanguage(header);
      
      expect(result).toEqual(['en-US', 'en', 'pl', 'ru']);
    });

    test('should handle empty or undefined input', () => {
      expect(parseAcceptLanguage(undefined)).toEqual([]);
      expect(parseAcceptLanguage('')).toEqual([]);
    });

    test('should handle single locale', () => {
      const result = parseAcceptLanguage('pl-PL');
      expect(result).toEqual(['pl-PL']);
    });

    test('should handle malformed input gracefully', () => {
      const result = parseAcceptLanguage('en;q=invalid,pl');
      expect(result.length).toBeGreaterThan(0);
      expect(result).toContain('pl');
    });
  });

  // Edge cases и дополнительные сценарии
  describe('Edge Cases', () => {
    test('should handle when salon supportedLocales is empty', () => {
      const options: ResolveLocaleOptions = {
        client: { preferredLocale: 'en' },
        salon: {
          primaryLocale: 'pl',
          supportedLocales: [],
          autoTranslateEnabled: true
        }
      };
      
      // Должен вернуть fallback, так как supportedLocales пустой
      expect(resolveLocale(options)).toBe('en'); // fallback default
    });

    test('should prioritize client over browser locales', () => {
      const options: ResolveLocaleOptions = {
        client: { preferredLocale: 'ru' },
        salon: {
          primaryLocale: 'pl',
          supportedLocales: ['pl', 'ru', 'en'],
          autoTranslateEnabled: true
        },
        browserLocales: ['en-US', 'pl-PL'] // en имеет высший приоритет в browser
      };
      
      // Должен выбрать client.preferred (ru) а не browser (en)
      expect(resolveLocale(options)).toBe('ru');
    });

    test('should handle Ukrainian locale variants (ua vs uk)', () => {
      const options: ResolveLocaleOptions = {
        salon: {
          primaryLocale: 'pl',
          supportedLocales: ['pl', 'uk', 'en'],
          autoTranslateEnabled: true
        },
        browserLocales: ['ua-UA', 'uk-UA'] // оба должны нормализоваться к uk
      };
      
      expect(resolveLocale(options)).toBe('uk');
    });
  });

});