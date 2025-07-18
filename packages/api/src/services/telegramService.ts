/**
 * TP-06: Telegram Service для отправки и получения сообщений
 * Интеграция с Telegram Bot API
 */

import axios from 'axios';
import { MessageSendResult, TelegramWebhookPayload, MessageMeta } from '../types/messaging';

export interface TelegramConfig {
  botToken: string;
  webhookUrl?: string;
}

interface TelegramSendMessagePayload {
  chat_id: string | number;
  text: string;
  parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
  disable_web_page_preview?: boolean;
  disable_notification?: boolean;
  reply_to_message_id?: number;
}

interface TelegramApiResponse {
  ok: boolean;
  result?: {
    message_id: number;
    date: number;
    chat: {
      id: number;
      type: string;
    };
  };
  error_code?: number;
  description?: string;
}

export class TelegramService {
  private baseUrl: string;
  private config: TelegramConfig;

  constructor(config: TelegramConfig) {
    this.config = config;
    this.baseUrl = `https://api.telegram.org/bot${config.botToken}`;
  }

  /**
   * Отправляет сообщение в Telegram
   */
  async sendMessage(
    chatId: string | number,
    text: string,
    options?: {
      parseMode?: 'HTML' | 'Markdown';
      disablePreview?: boolean;
      disableNotification?: boolean;
    }
  ): Promise<MessageSendResult> {
    try {
      const payload: TelegramSendMessagePayload = {
        chat_id: chatId,
        text,
        parse_mode: options?.parseMode,
        disable_web_page_preview: options?.disablePreview,
        disable_notification: options?.disableNotification
      };

      const response = await axios.post<TelegramApiResponse>(
        `${this.baseUrl}/sendMessage`,
        payload,
        {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.ok && response.data.result) {
        return {
          success: true,
          messageId: response.data.result.message_id.toString(),
          status: 'SENT',
          deliveredAt: new Date(response.data.result.date * 1000)
        };
      } else {
        return {
          success: false,
          status: 'FAILED',
          error: response.data.description || 'Unknown Telegram API error'
        };
      }
    } catch (error) {
      console.error('Telegram send message error:', error);
      
      let errorMessage = 'Failed to send Telegram message';
      if (axios.isAxiosError(error)) {
        if (error.response?.data?.description) {
          errorMessage = error.response.data.description;
        } else if (error.code === 'ECONNABORTED') {
          errorMessage = 'Telegram API timeout';
        } else if (error.response?.status === 401) {
          errorMessage = 'Invalid Telegram bot token';
        } else if (error.response?.status === 400) {
          errorMessage = 'Bad request to Telegram API';
        }
      }

      return {
        success: false,
        status: 'FAILED',
        error: errorMessage
      };
    }
  }

  /**
   * Устанавливает webhook для получения сообщений
   */
  async setWebhook(webhookUrl: string, secretToken?: string): Promise<boolean> {
    try {
      const response = await axios.post<TelegramApiResponse>(
        `${this.baseUrl}/setWebhook`,
        {
          url: webhookUrl,
          secret_token: secretToken,
          allowed_updates: ['message', 'callback_query']
        }
      );

      return response.data.ok;
    } catch (error) {
      console.error('Failed to set Telegram webhook:', error);
      return false;
    }
  }

  /**
   * Удаляет webhook
   */
  async deleteWebhook(): Promise<boolean> {
    try {
      const response = await axios.post<TelegramApiResponse>(
        `${this.baseUrl}/deleteWebhook`
      );
      
      return response.data.ok;
    } catch (error) {
      console.error('Failed to delete Telegram webhook:', error);
      return false;
    }
  }

  /**
   * Получает информацию о боте
   */
  async getBotInfo(): Promise<{ username?: string; first_name?: string } | null> {
    try {
      const response = await axios.get<TelegramApiResponse & { result: any }>(
        `${this.baseUrl}/getMe`
      );
      
      if (response.data.ok) {
        return response.data.result;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get bot info:', error);
      return null;
    }
  }

  /**
   * Парсит webhook payload от Telegram
   */
  static parseWebhookPayload(payload: TelegramWebhookPayload): {
    chatId: string;
    messageId: number;
    text?: string;
    username?: string;
    firstName?: string;
    languageCode?: string;
  } | null {
    if (!payload.message) {
      return null;
    }

    const { message } = payload;
    
    return {
      chatId: message.chat.id.toString(),
      messageId: message.message_id,
      text: message.text,
      username: message.from.username,
      firstName: message.from.first_name,
      languageCode: message.from.language_code
    };
  }

  /**
   * Создает metadata объект для логирования
   */
  static createMessageMeta(
    chatId: string,
    messageId?: number,
    username?: string
  ): MessageMeta {
    return {
      chatId,
      messageId,
      // Добавляем username в meta для отладки
      originalText: username ? `@${username}` : undefined
    };
  }
}

// Utility функции для работы с Telegram

/**
 * Экранирует специальные символы для Telegram MarkdownV2
 */
export function escapeTelegramMarkdown(text: string): string {
  return text.replace(/[_*\[\]()~`>#+=|{}.!-]/g, '\\$&');
}

/**
 * Форматирует текст для Telegram с базовой разметкой
 */
export function formatTelegramMessage(text: string, useMarkdown: boolean = false): string {
  if (!useMarkdown) {
    return text;
  }

  // Простая разметка: **bold** -> *bold*, __italic__ -> _italic_
  return text
    .replace(/\*\*(.*?)\*\*/g, '*$1*')
    .replace(/__(.*?)__/g, '_$1_');
}

/**
 * Проверяет валидность Telegram bot token
 */
export function isValidTelegramToken(token: string): boolean {
  // Telegram bot token format: <bot_id>:<bot_secret>
  // Например: 123456789:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw
  const tokenRegex = /^\d+:[A-Za-z0-9_-]{35}$/;
  return tokenRegex.test(token);
}

/**
 * Извлекает bot ID из токена
 */
export function getBotIdFromToken(token: string): string | null {
  const match = token.match(/^(\d+):/);
  return match ? match[1] : null;
}
