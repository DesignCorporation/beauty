/**
 * Core Types and Interfaces for Beauty Platform Messaging Hub
 * 
 * Defines the unified message structure and channel interface
 * for consistent multi-channel communication.
 */

export type MessageChannel = 'telegram' | 'email' | 'webchat' | 'whatsapp';
export type MessageDirection = 'IN' | 'OUT';
export type MessageType = 'text' | 'template' | 'media' | 'location' | 'contact';
export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed' | 'retry';

/**
 * Core Message DTO - unified structure for all channels
 */
export interface Message {
  id: string;
  tenantId: string;
  clientId?: string;
  staffId?: string;
  channel: MessageChannel;
  direction: MessageDirection;
  type: MessageType;
  
  content: {
    text?: string;
    template?: {
      code: string;
      data: Record<string, any>;
    };
    media?: {
      url: string;
      type: 'image' | 'video' | 'audio' | 'document';
      filename?: string;
    };
    location?: {
      latitude: number;
      longitude: number;
      address?: string;
    };
  };
  
  locale?: string;
  status: MessageStatus;
  
  metadata: {
    // Channel-specific data
    telegramMessageId?: number;
    emailMessageId?: string;
    webhookData?: any;
    
    // Delivery tracking
    sentAt?: Date;
    deliveredAt?: Date;
    readAt?: Date;
    failureReason?: string;
    retryCount?: number;
    
    // Thread/conversation context
    threadId?: string;
    replyToMessageId?: string;
    
    // Rate limiting
    rateLimitKey?: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
  };
  
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Result of message sending operation
 */
export interface SendResult {
  success: boolean;
  messageId?: string;
  externalId?: string; // Telegram message ID, Email message ID, etc.
  error?: {
    code: string;
    message: string;
    retryable: boolean;
  };
  deliveredAt?: Date;
}

/**
 * Channel configuration for each salon
 */
export interface ChannelConfig {
  enabled: boolean;
  config: Record<string, any>;
  
  // Channel-specific configs
  telegram?: {
    botToken: string;
    chatId?: string;
    webhookUrl?: string;
  };
  
  email?: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPass: string;
    fromEmail: string;
    fromName: string;
    replyToEmail?: string;
  };
  
  webchat?: {
    enabled: boolean;
    widgetColor?: string;
    welcomeMessage?: string;
    offlineMessage?: string;
  };
}

/**
 * Unified Channel Interface
 * All messaging channels must implement this interface
 */
export interface IMessageChannel {
  readonly name: MessageChannel;
  
  /**
   * Send a message through this channel
   */
  send(message: Message, config: ChannelConfig): Promise<SendResult>;
  
  /**
   * Process incoming webhook/message (if supported)
   */
  receive?(webhookData: any, tenantId: string): Promise<Message | null>;
  
  /**
   * Check if channel is properly configured for tenant
   */
  isConfigured(config: ChannelConfig): boolean;
  
  /**
   * Validate channel configuration
   */
  validateConfig(config: any): { valid: boolean; errors: string[] };
  
  /**
   * Get supported message types for this channel
   */
  getSupportedTypes(): MessageType[];
  
  /**
   * Transform message content for channel-specific format
   */
  formatMessage(message: Message): any;
}

/**
 * Template context for message templating
 */
export interface TemplateContext {
  salon: {
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    website?: string;
  };
  
  client: {
    name: string;
    firstName?: string;
    phone?: string;
    email?: string;
    preferredLocale?: string;
  };
  
  staff?: {
    name: string;
    role?: string;
  };
  
  appointment?: {
    id: string;
    date: string;
    time: string;
    services: Array<{
      name: string;
      duration: number;
      price: number;
    }>;
    totalPrice: number;
    totalDuration: number;
  };
  
  // Custom data from specific message
  data?: Record<string, any>;
}

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  burstLimit?: number; // Allow burst of requests
  
  // Per-tenant overrides
  tenantOverrides?: Record<string, {
    maxRequests: number;
    burstLimit?: number;
  }>;
}

/**
 * Message template definition
 */
export interface MessageTemplate {
  code: string; // e.g., 'reminder-24h', 'booking-confirmed'
  name: string;
  description?: string;
  
  // Template content by locale
  content: Record<string, {
    subject?: string; // For email
    text: string; // Plain text version
    html?: string; // HTML version (for email)
    
    // Variables used in template
    variables?: string[];
  }>;
  
  // Supported channels
  channels: MessageChannel[];
  
  // Template metadata
  category?: 'reminder' | 'confirmation' | 'notification' | 'marketing';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Webhook payload structure
 */
export interface WebhookPayload {
  channel: MessageChannel;
  tenantId?: string;
  timestamp: Date;
  signature?: string; // For webhook verification
  data: any; // Channel-specific webhook data
}

/**
 * Message statistics for reporting
 */
export interface MessageStats {
  tenantId: string;
  channel: MessageChannel;
  period: {
    start: Date;
    end: Date;
  };
  
  counts: {
    total: number;
    sent: number;
    delivered: number;
    failed: number;
    inbound: number;
    outbound: number;
  };
  
  byTemplate: Record<string, number>;
  byStatus: Record<MessageStatus, number>;
  
  averageDeliveryTime?: number; // in milliseconds
  failureRate?: number; // percentage
}

/**
 * Bulk messaging operation
 */
export interface BulkMessageRequest {
  tenantId: string;
  template: {
    code: string;
    data?: Record<string, any>;
  };
  
  recipients: Array<{
    clientId?: string;
    staffId?: string;
    channels: MessageChannel[];
    customData?: Record<string, any>;
  }>;
  
  options?: {
    scheduleAt?: Date;
    priority?: 'low' | 'normal' | 'high';
    batchSize?: number;
    delayBetweenBatches?: number; // milliseconds
  };
}

/**
 * Message Hub events for real-time updates
 */
export interface MessageHubEvents {
  'message:sent': { message: Message; result: SendResult };
  'message:delivered': { message: Message };
  'message:failed': { message: Message; error: any };
  'message:received': { message: Message };
  'rate-limit:exceeded': { tenantId: string; channel: MessageChannel };
  'template:used': { templateCode: string; tenantId: string; count: number };
}

/**
 * Configuration for message retry logic
 */
export interface RetryConfig {
  maxAttempts: number;
  backoffMs: number; // Initial backoff
  backoffMultiplier: number; // Exponential backoff multiplier
  maxBackoffMs: number; // Maximum backoff time
  
  // Conditions for retry
  retryableErrorCodes: string[];
  retryableStatusCodes: number[];
}

export { MessageChannel as Channel };
