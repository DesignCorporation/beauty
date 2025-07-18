import type { SupportedLocale, TranslationCacheEntry } from './types';
import * as yaml from 'js-yaml';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

interface TranslationProvider {
  translate(text: string, from: SupportedLocale, to: SupportedLocale): Promise<string>;
}

interface TranslationOptions {
  provider?: 'openai' | 'anthropic' | 'stub';
  useCache?: boolean;
  useGlossary?: boolean;
}

/**
 * Translation Bridge - система переводов с кешем и глоссарием
 */
export class TranslationBridge {
  private cache = new Map<string, TranslationCacheEntry>();
  private glossary = new Map<string, Record<SupportedLocale, string>>();
  
  constructor(private options: TranslationOptions = {}) {
    this.loadGlossary();
  }

  /**
   * Переводит текст с кешированием
   */
  async translateText(text: string, from: SupportedLocale, to: SupportedLocale): Promise<string> {
    if (from === to) return text;

    const cacheKey = this.getCacheKey(text, from, to);
    
    // 1. Проверяем кеш
    if (this.options.useCache !== false) {
      const cached = this.cache.get(cacheKey);
      if (cached && this.isCacheValid(cached)) {
        return cached.text;
      }
    }

    // 2. Проверяем глоссарий
    if (this.options.useGlossary !== false) {
      const glossaryTranslation = this.getGlossaryTranslation(text, to);
      if (glossaryTranslation) {
        this.setCacheEntry(cacheKey, glossaryTranslation, from, to, 'glossary');
        return glossaryTranslation;
      }
    }

    // 3. LLM перевод
    const translated = await this.callLLMProvider(text, from, to);
    this.setCacheEntry(cacheKey, translated, from, to, 'llm');
    
    return translated;
  }

  /**
   * Загружает beauty-глоссарий
   */
  private loadGlossary() {
    try {
      const glossaryPath = path.join(__dirname, 'glossary.beauty.yaml');
      const glossaryContent = fs.readFileSync(glossaryPath, 'utf8');
      const glossaryData = yaml.load(glossaryContent) as Record<string, Record<SupportedLocale, string>>;

      Object.entries(glossaryData).forEach(([polishTerm, translations]) => {
        this.glossary.set(polishTerm.toLowerCase(), translations);
      });

      console.log(`Loaded ${this.glossary.size} beauty terms into glossary`);
    } catch (error) {
      console.error('Failed to load beauty glossary:', error);
    }
  }

  private getGlossaryTranslation(text: string, to: SupportedLocale): string | null {
    const normalized = text.toLowerCase().trim();
    const term = this.glossary.get(normalized);
    return term?.[to] || null;
  }

  private async callLLMProvider(text: string, from: SupportedLocale, to: SupportedLocale): Promise<string> {
    const provider = this.options.provider || process.env.TRANSLATE_PROVIDER || 'stub';
    
    switch (provider) {
      case 'openai':
        return this.translateWithOpenAI(text, from, to);
      case 'anthropic':
        return this.translateWithAnthropic(text, from, to);
      default:
        return this.stubTranslate(text, from, to);
    }
  }

  private async translateWithOpenAI(text: string, from: SupportedLocale, to: SupportedLocale): Promise<string> {
    try {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        console.warn('OPENAI_API_KEY not set, falling back to stub translation');
        return this.stubTranslate(text, from, to);
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are a professional translator specializing in beauty salon services. Translate from ${from} to ${to}. Provide only the translation, no explanations.`
            },
            {
              role: 'user',
              content: text
            }
          ],
          max_tokens: 100,
          temperature: 0.1
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content?.trim() || this.stubTranslate(text, from, to);
    } catch (error) {
      console.error('OpenAI translation failed:', error);
      return this.stubTranslate(text, from, to);
    }
  }

  private async translateWithAnthropic(text: string, from: SupportedLocale, to: SupportedLocale): Promise<string> {
    try {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        console.warn('ANTHROPIC_API_KEY not set, falling back to stub translation');
        return this.stubTranslate(text, from, to);
      }

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 100,
          messages: [
            {
              role: 'user',
              content: `Translate this beauty salon service text from ${from} to ${to}. Provide only the translation: "${text}"`
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status}`);
      }

      const data = await response.json();
      return data.content[0]?.text?.trim() || this.stubTranslate(text, from, to);
    } catch (error) {
      console.error('Anthropic translation failed:', error);
      return this.stubTranslate(text, from, to);
    }
  }

  private stubTranslate(text: string, from: SupportedLocale, to: SupportedLocale): string {
    return `[${to.toUpperCase()}] ${text}`;
  }

  private getCacheKey(text: string, from: SupportedLocale, to: SupportedLocale): string {
    return crypto.createHash('sha1').update(`${from}:${to}:${text}`).digest('hex');
  }

  private isCacheValid(entry: TranslationCacheEntry): boolean {
    const TTL_MS = 24 * 60 * 60 * 1000; // 24 часа
    return Date.now() - entry.createdAt.getTime() < TTL_MS;
  }

  private setCacheEntry(
    key: string, 
    text: string, 
    from: SupportedLocale, 
    to: SupportedLocale, 
    source: TranslationCacheEntry['source']
  ) {
    this.cache.set(key, {
      text,
      from,
      to,
      source,
      createdAt: new Date()
    });
  }

  /**
   * Получить статистику кеша для мониторинга
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      glossaryTerms: this.glossary.size,
      hitsBySource: this.getCacheHitsBySource()
    };
  }

  private getCacheHitsBySource() {
    const stats = { cache: 0, glossary: 0, llm: 0 };
    for (const entry of this.cache.values()) {
      stats[entry.source]++;
    }
    return stats;
  }

  /**
   * Очистка устаревших записей кеша
   */
  cleanupCache() {
    const now = Date.now();
    const TTL_MS = 24 * 60 * 60 * 1000;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.createdAt.getTime() > TTL_MS) {
        this.cache.delete(key);
      }
    }
  }
}