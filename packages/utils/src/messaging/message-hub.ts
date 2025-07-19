/**
 * MessageHub - Central Orchestrator for Beauty Platform Messaging
 * 
 * Coordinates all messaging channels, handles routing, templates,
 * localization, rate limiting, and delivery tracking.
 */

import { EventEmitter } from 'events';
import { PrismaClient } from '@prisma/client';
import { resolveLocale, translateText } from '../language';
import { MessageRateLimiter } from './rate-limiter';
import { 
  Message, 
  IMessageChannel, 
  ChannelConfig, 
  SendResult, 
  MessageTemplate,
  TemplateContext,
  BulkMessageRequest,
  MessageHubEvents,
  RetryConfig,
  MessageStats
} from './types';

export class MessageHub extends EventEmitter {
  private channels = new Map<string, IMessageChannel>();
  private templates = new Map<string, MessageTemplate>();
  private prisma: PrismaClient;
  private rateLimiter: MessageRateLimiter;
  private retryConfig: RetryConfig;

  constructor(
    prisma: PrismaClient,
    rateLimiter: MessageRateLimiter,
    retryConfig?: Partial<RetryConfig>
  ) {
    super();
    this.prisma = prisma;
    this.rateLimiter = rateLimiter;
    this.retryConfig = {
      maxAttempts: 3,
      backoffMs: 1000,
      backoffMultiplier: 2,
      maxBackoffMs: 30000,
      retryableErrorCodes: ['NETWORK_ERROR', 'TIMEOUT', 'RATE_LIMIT'],
      retryableStatusCodes: [429, 500, 502, 503, 504],
      ...retryConfig
    };
  }

  /**
   * Register a messaging channel
   */
  registerChannel(channel: IMessageChannel): void {
    this.channels.set(channel.name, channel);
    console.log(`[MessageHub] Registered channel: ${channel.name}`);
  }

  /**
   * Register message template
   */
  registerTemplate(template: MessageTemplate): void {
    this.templates.set(template.code, template);
    console.log(`[MessageHub] Registered template: ${template.code}`);
  }

  /**
   * Send a single message
   */
  async sendMessage(
    tenantId: string,
    channelName: string,
    message: Partial<Message>
  ): Promise<SendResult> {
    const channel = this.channels.get(channelName);
    if (!channel) {
      throw new Error(`Channel not found: ${channelName}`);
    }

    // Build complete message
    const completeMessage: Message = {
      id: message.id || this.generateMessageId(),
      tenantId,
      channel: channel.name,
      direction: 'OUT',
      type: message.type || 'text',
      content: message.content || {},
      status: 'pending',
      metadata: message.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date(),
      ...message
    };

    try {
      // Check rate limits
      const rateLimitResult = await this.rateLimiter.isAllowed(
        tenantId,
        channelName,
        completeMessage.metadata.priority
      );

      if (!rateLimitResult.allowed) {
        const result: SendResult = {
          success: false,
          error: {
            code: 'RATE_LIMIT',
            message: 'Rate limit exceeded',
            retryable: true
          }
        };
        
        this.emit('rate-limit:exceeded', { tenantId, channel: channelName });
        await this.logMessage(completeMessage, result);
        return result;
      }

      // Get channel configuration
      const config = await this.getChannelConfig(tenantId, channelName);
      if (!channel.isConfigured(config)) {
        throw new Error(`Channel ${channelName} not configured for tenant ${tenantId}`);
      }

      // Process template if needed
      if (completeMessage.type === 'template') {
        await this.processTemplate(completeMessage, tenantId);
      }

      // Resolve locale and translate if needed
      if (completeMessage.locale && completeMessage.content.text) {
        completeMessage.content.text = await this.localizeContent(
          completeMessage.content.text,
          completeMessage.locale,
          tenantId
        );
      }

      // Send through channel
      const result = await this.sendWithRetry(completeMessage, channel, config);
      
      // Update message status
      completeMessage.status = result.success ? 'sent' : 'failed';
      completeMessage.metadata.sentAt = result.success ? new Date() : undefined;
      completeMessage.metadata.failureReason = result.error?.message;
      completeMessage.updatedAt = new Date();

      // Log message
      await this.logMessage(completeMessage, result);

      // Emit events
      if (result.success) {
        this.emit('message:sent', { message: completeMessage, result });
      } else {
        this.emit('message:failed', { message: completeMessage, error: result.error });
      }

      return result;

    } catch (error) {
      const result: SendResult = {
        success: false,
        error: {
          code: 'SEND_ERROR',
          message: error.message,
          retryable: false
        }
      };

      completeMessage.status = 'failed';
      completeMessage.metadata.failureReason = error.message;
      completeMessage.updatedAt = new Date();

      await this.logMessage(completeMessage, result);
      this.emit('message:failed', { message: completeMessage, error });

      return result;
    }
  }

  /**
   * Send bulk messages with batching and rate limiting
   */
  async sendBulkMessages(request: BulkMessageRequest): Promise<{
    total: number;
    sent: number;
    failed: number;
    results: Array<{ recipientIndex: number; result: SendResult }>;
  }> {
    const { tenantId, template, recipients, options = {} } = request;
    const {
      batchSize = 10,
      delayBetweenBatches = 1000,
      priority = 'normal'
    } = options;

    const results: Array<{ recipientIndex: number; result: SendResult }> = [];
    let sent = 0;
    let failed = 0;

    // Process in batches
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      // Check if we need to delay
      if (i > 0 && delayBetweenBatches > 0) {
        await this.sleep(delayBetweenBatches);
      }

      // Process batch in parallel
      const batchPromises = batch.map(async (recipient, batchIndex) => {
        const recipientIndex = i + batchIndex;
        
        try {
          // Build message for each channel
          const channelResults = await Promise.all(
            recipient.channels.map(async (channelName) => {
              const message: Partial<Message> = {
                clientId: recipient.clientId,
                staffId: recipient.staffId,
                type: 'template',
                content: {
                  template: {
                    code: template.code,
                    data: { ...template.data, ...recipient.customData }
                  }
                },
                metadata: {
                  priority,
                  threadId: `bulk-${request.tenantId}-${Date.now()}`
                }
              };

              return await this.sendMessage(tenantId, channelName, message);
            })
          );

          // Aggregate results for this recipient
          const recipientSuccess = channelResults.some(r => r.success);
          if (recipientSuccess) {
            sent++;
          } else {
            failed++;
          }

          return {
            recipientIndex,
            result: {
              success: recipientSuccess,
              messageId: channelResults.find(r => r.messageId)?.messageId,
              error: recipientSuccess ? undefined : channelResults[0].error
            }
          };

        } catch (error) {
          failed++;
          return {
            recipientIndex,
            result: {
              success: false,
              error: {
                code: 'BULK_SEND_ERROR',
                message: error.message,
                retryable: false
              }
            }
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return {
      total: recipients.length,
      sent,
      failed,
      results
    };
  }

  /**
   * Process incoming message from webhook
   */
  async processIncomingMessage(
    channelName: string,
    webhookData: any,
    tenantId?: string
  ): Promise<Message | null> {
    const channel = this.channels.get(channelName);
    if (!channel || !channel.receive) {
      return null;
    }

    try {
      const message = await channel.receive(webhookData, tenantId);
      if (!message) {
        return null;
      }

      // Log incoming message
      await this.logMessage(message);

      // Emit event
      this.emit('message:received', { message });

      return message;

    } catch (error) {
      console.error(`[MessageHub] Error processing incoming message:`, error);
      return null;
    }
  }

  /**
   * Get message statistics for tenant
   */
  async getMessageStats(
    tenantId: string,
    period: { start: Date; end: Date },
    channel?: string
  ): Promise<MessageStats> {
    const where: any = {
      tenantId,
      createdAt: {
        gte: period.start,
        lte: period.end
      }
    };

    if (channel) {
      where.channel = channel;
    }

    const messages = await this.prisma.messageLog.findMany({
      where,
      select: {
        channel: true,
        direction: true,
        status: true,
        templateCode: true,
        createdAt: true,
        metadata: true
      }
    });

    const stats: MessageStats = {
      tenantId,
      channel: channel as any,
      period,
      counts: {
        total: messages.length,
        sent: messages.filter(m => m.status === 'sent').length,
        delivered: messages.filter(m => m.status === 'delivered').length,
        failed: messages.filter(m => m.status === 'failed').length,
        inbound: messages.filter(m => m.direction === 'IN').length,
        outbound: messages.filter(m => m.direction === 'OUT').length
      },
      byTemplate: {},
      byStatus: {}
    };

    // Group by template
    messages.forEach(msg => {
      if (msg.templateCode) {
        stats.byTemplate[msg.templateCode] = (stats.byTemplate[msg.templateCode] || 0) + 1;
      }
    });

    // Group by status
    messages.forEach(msg => {
      stats.byStatus[msg.status] = (stats.byStatus[msg.status] || 0) + 1;
    });

    // Calculate delivery metrics
    const sentMessages = messages.filter(m => m.metadata?.sentAt);
    const deliveredMessages = messages.filter(m => m.metadata?.deliveredAt);

    if (sentMessages.length > 0 && deliveredMessages.length > 0) {
      const deliveryTimes = deliveredMessages
        .map(m => {
          const sent = new Date(m.metadata.sentAt);
          const delivered = new Date(m.metadata.deliveredAt);
          return delivered.getTime() - sent.getTime();
        })
        .filter(time => time > 0);

      if (deliveryTimes.length > 0) {
        stats.averageDeliveryTime = deliveryTimes.reduce((a, b) => a + b, 0) / deliveryTimes.length;
      }
    }

    if (stats.counts.total > 0) {
      stats.failureRate = (stats.counts.failed / stats.counts.total) * 100;
    }

    return stats;
  }

  // Private helper methods

  private async processTemplate(message: Message, tenantId: string): Promise<void> {
    if (!message.content.template) {
      throw new Error('Template code required for template message');
    }

    const template = this.templates.get(message.content.template.code);
    if (!template) {
      throw new Error(`Template not found: ${message.content.template.code}`);
    }

    // Resolve locale for client
    const locale = message.locale || await this.resolveClientLocale(message, tenantId);
    
    // Get template content for locale
    const content = template.content[locale] || template.content['en'] || template.content['pl'];
    if (!content) {
      throw new Error(`Template content not found for locale: ${locale}`);
    }

    // Process template variables
    const processedText = await this.processTemplateVariables(
      content.text,
      message.content.template.data || {},
      tenantId,
      message
    );

    // Update message content
    message.content.text = processedText;
    message.locale = locale;

    // Emit template usage event
    this.emit('template:used', {
      templateCode: message.content.template.code,
      tenantId,
      count: 1
    });
  }

  private async processTemplateVariables(
    template: string,
    data: Record<string, any>,
    tenantId: string,
    message: Message
  ): Promise<string> {
    // Simple template variable replacement
    let result = template;

    // Replace variables like {{variable}}
    const variableRegex = /\{\{([^}]+)\}\}/g;
    const matches = template.match(variableRegex);

    if (matches) {
      for (const match of matches) {
        const variable = match.replace(/[{}]/g, '');
        const value = this.getVariableValue(variable, data, tenantId, message);
        result = result.replace(match, value);
      }
    }

    return result;
  }

  private getVariableValue(
    variable: string,
    data: Record<string, any>,
    tenantId: string,
    message: Message
  ): string {
    // Check custom data first
    if (data[variable] !== undefined) {
      return String(data[variable]);
    }

    // Built-in variables
    switch (variable) {
      case 'clientName':
        return data.client?.name || 'Valued Client';
      case 'salonName':
        return data.salon?.name || 'Beauty Salon';
      case 'date':
        return new Date().toLocaleDateString();
      case 'time':
        return new Date().toLocaleTimeString();
      default:
        return `{{${variable}}}`;
    }
  }

  private async resolveClientLocale(message: Message, tenantId: string): Promise<string> {
    // Use TP-05 language resolver
    try {
      if (message.clientId) {
        const client = await this.prisma.client.findUnique({
          where: { id: message.clientId },
          select: { preferredLocale: true, alternateLocales: true }
        });

        if (client?.preferredLocale) {
          return client.preferredLocale;
        }
      }

      // Fallback to salon primary locale
      const salon = await this.prisma.salon.findUnique({
        where: { id: tenantId },
        select: { primaryLocale: true }
      });

      return salon?.primaryLocale || 'en';
    } catch (error) {
      console.error('Error resolving client locale:', error);
      return 'en';
    }
  }

  private async localizeContent(
    text: string,
    locale: string,
    tenantId: string
  ): Promise<string> {
    // Use TP-05 translation system if needed
    try {
      // For now, return as-is since templates are already localized
      // In future, could use translateText for dynamic translation
      return text;
    } catch (error) {
      console.error('Error localizing content:', error);
      return text;
    }
  }

  private async sendWithRetry(
    message: Message,
    channel: IMessageChannel,
    config: ChannelConfig
  ): Promise<SendResult> {
    let lastError: any;
    let attempt = 0;

    while (attempt < this.retryConfig.maxAttempts) {
      try {
        const result = await channel.send(message, config);
        
        if (result.success || !result.error?.retryable) {
          return result;
        }

        lastError = result.error;
        attempt++;

        if (attempt < this.retryConfig.maxAttempts) {
          const backoff = Math.min(
            this.retryConfig.backoffMs * Math.pow(this.retryConfig.backoffMultiplier, attempt - 1),
            this.retryConfig.maxBackoffMs
          );
          
          console.log(`[MessageHub] Retrying message ${message.id} after ${backoff}ms (attempt ${attempt})`);
          await this.sleep(backoff);
        }

      } catch (error) {
        lastError = error;
        attempt++;

        if (attempt < this.retryConfig.maxAttempts && this.isRetryableError(error)) {
          const backoff = Math.min(
            this.retryConfig.backoffMs * Math.pow(this.retryConfig.backoffMultiplier, attempt - 1),
            this.retryConfig.maxBackoffMs
          );
          
          await this.sleep(backoff);
        } else {
          break;
        }
      }
    }

    message.metadata.retryCount = attempt;

    return {
      success: false,
      error: {
        code: lastError?.code || 'RETRY_EXHAUSTED',
        message: `Failed after ${attempt} attempts: ${lastError?.message || lastError.message}`,
        retryable: false
      }
    };
  }

  private isRetryableError(error: any): boolean {
    if (error.code && this.retryConfig.retryableErrorCodes.includes(error.code)) {
      return true;
    }

    if (error.status && this.retryConfig.retryableStatusCodes.includes(error.status)) {
      return true;
    }

    return false;
  }

  private async getChannelConfig(tenantId: string, channelName: string): Promise<ChannelConfig> {
    // TODO: Implement channel configuration retrieval from database
    // For now, return basic config
    return {
      enabled: true,
      config: {}
    };
  }

  private async logMessage(message: Message, result?: SendResult): Promise<void> {
    try {
      await this.prisma.messageLog.create({
        data: {
          id: message.id,
          salonId: message.tenantId,
          clientId: message.clientId,
          staffId: message.staffId,
          channel: message.channel,
          direction: message.direction,
          sourceLocale: message.locale,
          rawText: message.content.text,
          templateCode: message.content.template?.code,
          status: message.status,
          createdAt: message.createdAt
        }
      });
    } catch (error) {
      console.error('Error logging message:', error);
    }
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Factory function to create MessageHub instance
 */
export function createMessageHub(
  prisma: PrismaClient,
  rateLimiter: MessageRateLimiter,
  retryConfig?: Partial<RetryConfig>
): MessageHub {
  return new MessageHub(prisma, rateLimiter, retryConfig);
}
