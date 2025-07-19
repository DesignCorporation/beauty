/**
 * Telegram Channel Implementation for Beauty Platform
 * 
 * Handles Telegram Bot API integration with webhook support
 * for two-way communication.
 */

import { IMessageChannel, Message, ChannelConfig, SendResult, MessageType } from '../types';

export class TelegramChannel implements IMessageChannel {
  readonly name = 'telegram' as const;

  async send(message: Message, config: ChannelConfig): Promise<SendResult> {
    const telegramConfig = config.telegram;
    if (!telegramConfig?.botToken) {
      throw new Error('Telegram bot token not configured');
    }

    try {
      const url = `https://api.telegram.org/bot${telegramConfig.botToken}/sendMessage`;
      
      // Format message for Telegram
      const telegramMessage = this.formatMessage(message);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(telegramMessage),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: {
            code: `TELEGRAM_${response.status}`,
            message: errorData.description || 'Telegram API error',
            retryable: response.status >= 500 || response.status === 429
          }
        };
      }

      const data = await response.json();
      
      return {
        success: true,
        messageId: message.id,
        externalId: data.result.message_id.toString(),
        deliveredAt: new Date()
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'TELEGRAM_NETWORK_ERROR',
          message: error.message,
          retryable: true
        }
      };
    }
  }

  async receive(webhookData: any, tenantId?: string): Promise<Message | null> {
    if (!webhookData.message) {
      return null;
    }

    const telegramMessage = webhookData.message;
    
    // Extract client identifier (chat ID)
    const clientIdentifier = telegramMessage.chat.id.toString();
    
    // Build message object
    const message: Message = {
      id: `tg_${Date.now()}_${telegramMessage.message_id}`,
      tenantId: tenantId || '', // Will be resolved by tenant middleware
      channel: 'telegram',
      direction: 'IN',
      type: this.getMessageType(telegramMessage),
      content: this.extractContent(telegramMessage),
      status: 'delivered',
      locale: telegramMessage.from.language_code || 'en',
      metadata: {
        telegramMessageId: telegramMessage.message_id,
        threadId: telegramMessage.chat.id.toString(),
        webhookData: {
          chatId: telegramMessage.chat.id,
          userId: telegramMessage.from.id,
          username: telegramMessage.from.username,
          firstName: telegramMessage.from.first_name,
          lastName: telegramMessage.from.last_name,
        }
      },
      createdAt: new Date(telegramMessage.date * 1000),
      updatedAt: new Date()
    };

    return message;
  }

  isConfigured(config: ChannelConfig): boolean {
    return !!(config.telegram?.botToken);
  }

  validateConfig(config: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!config.botToken) {
      errors.push('Bot token is required');
    } else if (!config.botToken.match(/^\d+:[A-Za-z0-9_-]+$/)) {
      errors.push('Invalid bot token format');
    }

    if (config.webhookUrl && !this.isValidUrl(config.webhookUrl)) {
      errors.push('Invalid webhook URL format');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  getSupportedTypes(): MessageType[] {
    return ['text', 'template', 'media', 'location'];
  }

  formatMessage(message: Message): any {
    const telegramMessage: any = {
      chat_id: this.extractChatId(message),
      parse_mode: 'HTML'
    };

    switch (message.type) {
      case 'text':
      case 'template':
        telegramMessage.text = message.content.text || '';
        break;
        
      case 'media':
        if (message.content.media) {
          const media = message.content.media;
          switch (media.type) {
            case 'image':
              telegramMessage.photo = media.url;
              telegramMessage.caption = message.content.text;
              break;
            case 'video':
              telegramMessage.video = media.url;
              telegramMessage.caption = message.content.text;
              break;
            case 'audio':
              telegramMessage.audio = media.url;
              telegramMessage.caption = message.content.text;
              break;
            case 'document':
              telegramMessage.document = media.url;
              telegramMessage.caption = message.content.text;
              break;
          }
        }
        break;
        
      case 'location':
        if (message.content.location) {
          telegramMessage.latitude = message.content.location.latitude;
          telegramMessage.longitude = message.content.location.longitude;
        }
        break;
    }

    // Add reply-to if specified
    if (message.metadata.replyToMessageId) {
      telegramMessage.reply_to_message_id = parseInt(message.metadata.replyToMessageId);
    }

    return telegramMessage;
  }

  /**
   * Set webhook for bot
   */
  async setWebhook(botToken: string, webhookUrl: string): Promise<boolean> {
    try {
      const url = `https://api.telegram.org/bot${botToken}/setWebhook`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: webhookUrl,
          allowed_updates: ['message', 'callback_query']
        }),
      });

      const data = await response.json();
      return data.ok;
      
    } catch (error) {
      console.error('Error setting Telegram webhook:', error);
      return false;
    }
  }

  /**
   * Remove webhook for bot
   */
  async removeWebhook(botToken: string): Promise<boolean> {
    try {
      const url = `https://api.telegram.org/bot${botToken}/deleteWebhook`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      return data.ok;
      
    } catch (error) {
      console.error('Error removing Telegram webhook:', error);
      return false;
    }
  }

  // Private helper methods

  private extractChatId(message: Message): string {
    // Try to get chat ID from metadata
    if (message.metadata.webhookData?.chatId) {
      return message.metadata.webhookData.chatId.toString();
    }

    // Try to get from client ID (assuming it's a chat ID)
    if (message.clientId) {
      return message.clientId;
    }

    throw new Error('No chat ID found for Telegram message');
  }

  private getMessageType(telegramMessage: any): MessageType {
    if (telegramMessage.location) {
      return 'location';
    }
    
    if (telegramMessage.photo || telegramMessage.video || 
        telegramMessage.audio || telegramMessage.document) {
      return 'media';
    }
    
    return 'text';
  }

  private extractContent(telegramMessage: any): Message['content'] {
    const content: Message['content'] = {};

    // Text content
    if (telegramMessage.text) {
      content.text = telegramMessage.text;
    } else if (telegramMessage.caption) {
      content.text = telegramMessage.caption;
    }

    // Media content
    if (telegramMessage.photo) {
      const photo = telegramMessage.photo[telegramMessage.photo.length - 1]; // Get highest resolution
      content.media = {
        type: 'image',
        url: `https://api.telegram.org/file/bot{token}/${photo.file_path}`,
        filename: `photo_${photo.file_id}.jpg`
      };
    } else if (telegramMessage.video) {
      content.media = {
        type: 'video',
        url: `https://api.telegram.org/file/bot{token}/${telegramMessage.video.file_path}`,
        filename: telegramMessage.video.file_name || `video_${telegramMessage.video.file_id}.mp4`
      };
    } else if (telegramMessage.audio) {
      content.media = {
        type: 'audio',
        url: `https://api.telegram.org/file/bot{token}/${telegramMessage.audio.file_path}`,
        filename: telegramMessage.audio.file_name || `audio_${telegramMessage.audio.file_id}.mp3`
      };
    } else if (telegramMessage.document) {
      content.media = {
        type: 'document',
        url: `https://api.telegram.org/file/bot{token}/${telegramMessage.document.file_path}`,
        filename: telegramMessage.document.file_name || `document_${telegramMessage.document.file_id}`
      };
    }

    // Location content
    if (telegramMessage.location) {
      content.location = {
        latitude: telegramMessage.location.latitude,
        longitude: telegramMessage.location.longitude
      };
    }

    return content;
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return url.startsWith('https://');
    } catch {
      return false;
    }
  }
}
