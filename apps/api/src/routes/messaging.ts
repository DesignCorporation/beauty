import { Router } from 'express';
import { requireTenant } from '../middleware/requireTenant';
import { MessagingService } from '../services/messaging/MessagingService';
import { TelegramService } from '../services/messaging/TelegramService';
import { EmailService } from '../services/messaging/EmailService';
import { WebChatService } from '../services/messaging/WebChatService';
import { MessageChannel, MessageDirection } from '@dc-beauty/db';

const router = Router();

// Services
const messagingService = new MessagingService();
const telegramService = new TelegramService();
const emailService = new EmailService();
const webChatService = new WebChatService();

// Rate limiting middleware
const rateLimiter = (req: any, res: any, next: any) => {
  // TODO: implement Redis-based rate limiting
  // MSG_RATE_LIMIT_PER_MIN from env
  next();
};

/**
 * Telegram Bot Webhook
 * POST /webhooks/telegram
 */
router.post('/webhooks/telegram', rateLimiter, async (req, res) => {
  try {
    const update = req.body;
    console.log('Telegram webhook received:', JSON.stringify(update, null, 2));

    // Extract bot token from headers or query to identify salon
    const botToken = req.headers['x-telegram-bot-token'] || req.query.token;
    if (!botToken) {
      return res.status(400).json({ error: 'Missing bot token' });
    }

    // Find salon by bot token (would need salon_channels table)
    // For now, use demo salon
    const salonId = 'demo-salon-id'; // TODO: lookup by bot token

    // Process telegram message
    if (update.message) {
      const chatId = update.message.chat.id;
      const text = update.message.text;
      const from = update.message.from;

      // Find or create client
      const client = await messagingService.findOrCreateClientFromTelegram({
        salonId,
        chatId: chatId.toString(),
        firstName: from.first_name,
        lastName: from.last_name,
        username: from.username
      });

      // Log incoming message
      await messagingService.logMessage({
        salonId,
        clientId: client.id,
        channel: MessageChannel.TELEGRAM,
        direction: MessageDirection.IN,
        rawText: text,
        meta: { chatId, from }
      });

      // Auto-reply (basic implementation)
      const replyText = `Привет ${from.first_name}! Спасибо за сообщение. Мы скоро ответим.`;
      
      await telegramService.sendMessage({
        botToken: botToken as string,
        chatId,
        text: replyText
      });

      // Log outgoing message
      await messagingService.logMessage({
        salonId,
        clientId: client.id,
        channel: MessageChannel.TELEGRAM,
        direction: MessageDirection.OUT,
        rawText: replyText,
        status: 'SENT'
      });
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * Web Chat Messages
 * POST /webhooks/webchat
 */
router.post('/webhooks/webchat', async (req, res) => {
  try {
    const { salonSlug, clientId, message, locale } = req.body;

    // Resolve salon by slug
    const salon = await messagingService.getSalonBySlug(salonSlug);
    if (!salon) {
      return res.status(404).json({ error: 'Salon not found' });
    }

    // Log message
    await messagingService.logMessage({
      salonId: salon.id,
      clientId,
      channel: MessageChannel.WEB_CHAT,
      direction: MessageDirection.IN,
      rawText: message,
      sourceLocale: locale
    });

    // Send to Socket.IO room
    await webChatService.broadcastToRoom(`salon:${salon.id}`, {
      type: 'client_message',
      clientId,
      message,
      timestamp: new Date().toISOString()
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Web chat error:', error);
    res.status(500).json({ error: 'Message processing failed' });
  }
});

/**
 * Send outbound message
 * POST /api/v1/messages/send
 */
router.post('/api/v1/messages/send', requireTenant, async (req, res) => {
  try {
    const { clientId, channel, message, templateCode } = req.body;
    const { salonId } = req.tenant!;

    // Validate required fields
    if (!clientId || !channel || !message) {
      return res.status(400).json({ 
        error: 'Missing required fields: clientId, channel, message' 
      });
    }

    // Send message through appropriate service
    let result;
    switch (channel) {
      case MessageChannel.TELEGRAM:
        result = await telegramService.sendToClient({ 
          salonId, 
          clientId, 
          message 
        });
        break;
      case MessageChannel.EMAIL:
        result = await emailService.sendToClient({ 
          salonId, 
          clientId, 
          message, 
          templateCode 
        });
        break;
      case MessageChannel.WEB_CHAT:
        result = await webChatService.sendToClient({ 
          salonId, 
          clientId, 
          message 
        });
        break;
      default:
        return res.status(400).json({ error: 'Unsupported channel' });
    }

    // Log the message
    await messagingService.logMessage({
      salonId,
      clientId,
      channel,
      direction: MessageDirection.OUT,
      rawText: message,
      templateCode,
      status: result.success ? 'SENT' : 'FAILED'
    });

    res.json({ success: result.success, messageId: result.messageId });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

export default router;
