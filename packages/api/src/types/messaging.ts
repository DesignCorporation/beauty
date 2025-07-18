/**
 * TP-06: Messaging Hub - Core Types & DTOs
 * Унифицированная система сообщений для Beauty Platform
 */

import { MessageChannel, MessageDirection, MessageStatus } from '@dc-beauty/db';

// Базовый DTO для сообщений
export interface MessageDTO {
  tenantId: string;
  clientId?: string;
  staffId?: string;
  channel: MessageChannel;
  direction: MessageDirection;
  text: string;
  localeGuess?: string;
  meta?: MessageMeta;
}

// Метаданные сообщения (специфичные для канала)
export interface MessageMeta {
  // Telegram
  chatId?: string;
  messageId?: number;
  
  // Email
  from?: string;
  to?: string;
  subject?: string;
  
  // Web-chat
  sessionId?: string;
  userAgent?: string;
  
  // Общие
  templateCode?: string;
  originalText?: string; // до перевода
  translatedText?: string; // после перевода
  errorMessage?: string;
}

// Inbound webhook payload - Telegram
export interface TelegramWebhookPayload {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
    };
    chat: {
      id: number;
      type: string;
    };
    date: number;
    text?: string;
  };
}

// Inbound webhook payload - Web-chat
export interface WebChatPayload {
  sessionId: string;
  clientInfo?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  message: string;
  userAgent?: string;
  locale?: string;
}

// Outbound message request
export interface OutboundMessageRequest {
  salonId: string;
  clientId?: string;
  staffId?: string;
  channel: MessageChannel;
  templateCode?: string;
  text?: string;
  locale?: string;
  meta?: Partial<MessageMeta>;
}

// Message sending result
export interface MessageSendResult {
  success: boolean;
  messageId?: string;
  status: MessageStatus;
  error?: string;
  deliveredAt?: Date;
}

// Template variables для подстановки
export interface TemplateVariables {
  clientName?: string;
  salonName?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  serviceName?: string;
  staffName?: string;
  [key: string]: any;
}

// Конфигурация каналов салона
export interface SalonChannelConfig {
  salonId: string;
  
  // Telegram
  telegramBotToken?: string;
  telegramEnabled: boolean;
  
  // Email  
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  smtpFrom?: string;
  emailEnabled: boolean;
  
  // Web-chat
  webChatEnabled: boolean;
  webChatDomain?: string;
  
  // Rate limits
  rateLimitPerMinute: number;
  
  createdAt: Date;
  updatedAt: Date;
}

// Rate limiting
export interface RateLimitStatus {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  limitPerMinute: number;
}
