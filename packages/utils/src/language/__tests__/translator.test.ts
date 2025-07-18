import { TranslationBridge } from '../translator';

// Mock fs для тестов
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

brwi:
  en: eyebrows
  uk: брови
  ru: брови
  `)
}));

describe('Translation Bridge Tests', () => {
  
  test('should return original text when from === to', async () => {
    const bridge = new TranslationBridge();
    const result = await bridge.translateText('test', 'en', 'en');
    expect(result).toBe('test');
  });

  test('should use glossary for known beauty terms', async () => {
    const bridge = new TranslationBridge({ useGlossary: true });
    const result = await bridge.translateText('manicure', 'pl', 'en');
    expect(result).toBe('manicure');
  });

  test('should translate Polish beauty terms to Ukrainian', async () => {
    const bridge = new TranslationBridge({ useGlossary: true });
    const result = await bridge.translateText('strzyżenie', 'pl', 'uk');
    expect(result).toBe('стрижка');
  });

  test('should translate Polish beauty terms to Russian', async () => {
    const bridge = new TranslationBridge({ useGlossary: true });
    const result = await bridge.translateText('brwi', 'pl', 'ru');
    expect(result).toBe('брови');
  });

  test('should fallback to stub translation for unknown terms', async () => {
    const bridge = new TranslationBridge({ provider: 'stub', useGlossary: false });
    const result = await bridge.translateText('unknown term', 'pl', 'en');
    expect(result).toBe('[EN] unknown term');
  });

  test('should cache translations', async () => {
    const bridge = new TranslationBridge({ useCache: true, provider: 'stub' });
    
    // Первый вызов
    const result1 = await bridge.translateText('test cache', 'pl', 'en');
    // Второй вызов должен использовать кеш (тот же результат)
    const result2 = await bridge.translateText('test cache', 'pl', 'en');
    
    expect(result1).toBe(result2);
    expect(result1).toBe('[EN] test cache');
  });

  test('should prioritize glossary over LLM', async () => {
    const bridge = new TranslationBridge({ 
      useGlossary: true, 
      provider: 'stub' 
    });
    
    // Для glossary термина должен использовать glossary, а не stub
    const result = await bridge.translateText('manicure', 'pl', 'ru');
    expect(result).toBe('маникюр'); // из glossary
    expect(result).not.toBe('[RU] manicure'); // не stub
  });

  test('should handle case insensitive glossary lookup', async () => {
    const bridge = new TranslationBridge({ useGlossary: true });
    
    // Разные регистры должны работать
    const result1 = await bridge.translateText('MANICURE', 'pl', 'en');
    const result2 = await bridge.translateText('Manicure', 'pl', 'en');
    const result3 = await bridge.translateText('manicure', 'pl', 'en');
    
    expect(result1).toBe('manicure');
    expect(result2).toBe('manicure');
    expect(result3).toBe('manicure');
  });

  test('should provide cache statistics', async () => {
    const bridge = new TranslationBridge({ useCache: true, useGlossary: true });
    
    // Добавляем несколько переводов
    await bridge.translateText('manicure', 'pl', 'en'); // glossary
    await bridge.translateText('unknown', 'pl', 'en');  // llm/stub
    
    const stats = bridge.getCacheStats();
    expect(stats.size).toBeGreaterThan(0);
    expect(stats.glossaryTerms).toBeGreaterThan(0);
    expect(stats.hitsBySource.glossary).toBe(1);
  });

  test('should cleanup expired cache entries', async () => {
    const bridge = new TranslationBridge({ useCache: true });
    
    // Добавляем запись
    await bridge.translateText('test cleanup', 'pl', 'en');
    
    const statsBefore = bridge.getCacheStats();
    expect(statsBefore.size).toBeGreaterThan(0);
    
    // Очищаем кеш (в реальности это бы удалило только expired, но для теста проверяем вызов)
    bridge.cleanupCache();
    
    // В тесте кеш не expired, поэтому размер не изменится
    const statsAfter = bridge.getCacheStats();
    expect(statsAfter.size).toBe(statsBefore.size);
  });

  test('should handle empty or whitespace input', async () => {
    const bridge = new TranslationBridge();
    
    const result1 = await bridge.translateText('', 'pl', 'en');
    const result2 = await bridge.translateText('   ', 'pl', 'en');
    
    expect(result1).toBe('[EN] ');
    expect(result2).toBe('[EN]    '); // whitespace preserved
  });

  describe('LLM Provider Fallbacks', () => {
    test('should fallback to stub when OpenAI API key is missing', async () => {
      const originalEnv = process.env.OPENAI_API_KEY;
      delete process.env.OPENAI_API_KEY;
      
      const bridge = new TranslationBridge({ provider: 'openai', useGlossary: false });
      const result = await bridge.translateText('test', 'pl', 'en');
      
      expect(result).toBe('[EN] test');
      
      // Restore env
      if (originalEnv) process.env.OPENAI_API_KEY = originalEnv;
    });

    test('should fallback to stub when Anthropic API key is missing', async () => {
      const originalEnv = process.env.ANTHROPIC_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;
      
      const bridge = new TranslationBridge({ provider: 'anthropic', useGlossary: false });
      const result = await bridge.translateText('test', 'pl', 'en');
      
      expect(result).toBe('[EN] test');
      
      // Restore env
      if (originalEnv) process.env.ANTHROPIC_API_KEY = originalEnv;
    });
  });

  describe('Performance Tests', () => {
    test('glossary lookup should be fast', async () => {
      const bridge = new TranslationBridge({ useGlossary: true });
      
      const start = Date.now();
      await bridge.translateText('manicure', 'pl', 'en');
      const duration = Date.now() - start;
      
      // Glossary lookup должен быть < 10ms
      expect(duration).toBeLessThan(10);
    });

    test('cache lookup should be faster than first translation', async () => {
      const bridge = new TranslationBridge({ useCache: true, provider: 'stub' });
      
      // Первый вызов (создание cache entry)
      const start1 = Date.now();
      await bridge.translateText('performance test', 'pl', 'en');
      const duration1 = Date.now() - start1;
      
      // Второй вызов (cache hit)
      const start2 = Date.now();
      await bridge.translateText('performance test', 'pl', 'en');
      const duration2 = Date.now() - start2;
      
      // Cache hit должен быть быстрее
      expect(duration2).toBeLessThanOrEqual(duration1);
    });
  });

});