/**
 * TP-06: Template Service для загрузки и рендера сообщений
 * Поддерживает мультиязычные шаблоны с переменными
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { TemplateVariables } from '../types/messaging';

interface TemplateCache {
  [key: string]: string; // key: `${locale}:${templateCode}`
}

export class TemplateService {
  private cache: TemplateCache = {};
  private templateDir: string;

  constructor(templateDir?: string) {
    this.templateDir = templateDir || path.join(__dirname, '../../templates');
  }

  /**
   * Загружает шаблон с кэшированием
   */
  private async loadTemplate(locale: string, templateCode: string): Promise<string> {
    const cacheKey = `${locale}:${templateCode}`;
    
    if (this.cache[cacheKey]) {
      return this.cache[cacheKey];
    }

    const templatePath = path.join(this.templateDir, locale, `${templateCode}.txt`);
    
    try {
      const template = await fs.readFile(templatePath, 'utf-8');
      this.cache[cacheKey] = template;
      return template;
    } catch (error) {
      // Fallback к английскому если локаль не найдена
      if (locale !== 'en') {
        console.warn(`Template not found for ${locale}:${templateCode}, falling back to English`);
        return this.loadTemplate('en', templateCode);
      }
      
      throw new Error(`Template not found: ${templateCode} for locale ${locale}`);
    }
  }

  /**
   * Рендерит шаблон с переменными
   */
  private renderTemplate(template: string, variables: TemplateVariables): string {
    let rendered = template;
    
    for (const [key, value] of Object.entries(variables)) {
      if (value !== undefined && value !== null) {
        const placeholder = `{{${key}}}`;
        rendered = rendered.replace(new RegExp(placeholder, 'g'), String(value));
      }
    }
    
    return rendered;
  }

  /**
   * Получает отрендеренный шаблон сообщения
   */
  async getMessage(
    templateCode: string,
    locale: string,
    variables: TemplateVariables
  ): Promise<string> {
    const template = await this.loadTemplate(locale, templateCode);
    return this.renderTemplate(template, variables);
  }

  /**
   * Получает доступные шаблоны для локали
   */
  async getAvailableTemplates(locale: string): Promise<string[]> {
    const localePath = path.join(this.templateDir, locale);
    
    try {
      const files = await fs.readdir(localePath);
      return files
        .filter(file => file.endsWith('.txt'))
        .map(file => file.replace('.txt', ''));
    } catch (error) {
      console.warn(`Cannot read templates for locale ${locale}:`, error);
      return [];
    }
  }

  /**
   * Проверяет существование шаблона
   */
  async templateExists(locale: string, templateCode: string): Promise<boolean> {
    const templatePath = path.join(this.templateDir, locale, `${templateCode}.txt`);
    
    try {
      await fs.access(templatePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Очищает кэш шаблонов (для hot reload в dev режиме)
   */
  clearCache(): void {
    this.cache = {};
  }

  /**
   * Предзагружает шаблоны для быстрого доступа
   */
  async preloadTemplates(locales: string[], templateCodes: string[]): Promise<void> {
    const promises: Promise<void>[] = [];
    
    for (const locale of locales) {
      for (const templateCode of templateCodes) {
        promises.push(
          this.loadTemplate(locale, templateCode)
            .then(() => {})
            .catch(error => {
              console.warn(`Failed to preload template ${locale}:${templateCode}:`, error);
            })
        );
      }
    }
    
    await Promise.all(promises);
    console.log(`Preloaded ${Object.keys(this.cache).length} templates`);
  }
}

// Singleton instance
let templateService: TemplateService | null = null;

export function getTemplateService(): TemplateService {
  if (!templateService) {
    templateService = new TemplateService();
  }
  return templateService;
}

// Utility function для быстрого доступа к шаблонам
export async function renderMessageTemplate(
  templateCode: string,
  locale: string,
  variables: TemplateVariables
): Promise<string> {
  const service = getTemplateService();
  return service.getMessage(templateCode, locale, variables);
}

// Константы доступных шаблонов
export const AVAILABLE_TEMPLATES = {
  REMINDER_24H: 'reminder_24h',
  REMINDER_2H: 'reminder_2h', 
  BOOKING_CONFIRMED: 'booking_confirmed',
  BOOKING_CANCELLED: 'booking_cancelled',
  BIRTHDAY_GREETING: 'birthday_greeting',
  WINBACK_OFFER: 'winback_offer'
} as const;

export type TemplateCode = typeof AVAILABLE_TEMPLATES[keyof typeof AVAILABLE_TEMPLATES];

// Инициализация и предзагрузка популярных шаблонов
export async function initializeTemplateService(): Promise<void> {
  const service = getTemplateService();
  
  const popularTemplates = [
    AVAILABLE_TEMPLATES.REMINDER_24H,
    AVAILABLE_TEMPLATES.REMINDER_2H,
    AVAILABLE_TEMPLATES.BOOKING_CONFIRMED
  ];
  
  const supportedLocales = ['pl', 'en', 'ru', 'uk'];
  
  try {
    await service.preloadTemplates(supportedLocales, popularTemplates);
    console.log('Template service initialized successfully');
  } catch (error) {
    console.error('Failed to initialize template service:', error);
  }
}
