import { Router } from 'express';
import { requireTenant } from '../middleware/requireTenant';
import { MessageHub } from '../messaging/MessageHub';
import { logger } from '@dc-beauty/utils';
import crypto from 'crypto';

const router = Router();

// Initialize MessageHub (should be done in app startup)
const messageHub = new MessageHub();

/**
 * Telegram Bot Webhook
 * POST /api/v1/messaging/webhooks/telegram
 */
router.post('/telegram', async (req, res) => {
  try {
    const update = req.body;
    
    // Verify webhook signature if secret token is set
    const secretToken = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (secretToken) {
      const telegramInitData = req.headers['x-telegram-bot-api-secret-token'];
      if (telegramInitData !== secretToken) {
        return res.status(401).json({ error: 'Invalid webhook secret' });
      }
    }

    // Extract message info
    const message = update.message;
    if (!message) {
      return res.status(200).json({ ok: true }); // Not a message update
    }

    // Find salon by bot token (should be implemented)
    const botToken = extractBotTokenFromRequest(req);
    if (!botToken) {
      return res.status(400).json({ error: 'Bot token not found' });
    }

    // Process the message through MessageHub
    const result = await messageHub.processInboundMessage({
      tenantId: 'auto-resolve', // Will be resolved by bot token
      channel: 'TELEGRAM',
      direction: 'IN',
      text: message.text || '',
      meta: {
        telegramUpdate: update,
        chatId: message.chat.id,
        messageId: message.message_id,
        from: message.from
      }
    });

    if (result.success) {
      res.status(200).json({ ok: true, messageId: result.messageId });
    } else {
      res.status(500).json({ error: result.error });
    }

  } catch (error) {
    logger.error('Telegram webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Email Webhook (for inbound email handling)
 * POST /api/v1/messaging/webhooks/email
 */
router.post('/email', async (req, res) => {
  try {
    const emailData = req.body;
    
    // Verify webhook signature (implementation depends on email provider)
    if (!verifyEmailWebhookSignature(req)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Extract email info
    const { from, to, subject, text, html } = emailData;
    
    // Determine salon from email address
    const salonId = await resolveSalonFromEmail(to);
    if (!salonId) {
      return res.status(400).json({ error: 'Salon not found for email address' });
    }

    const result = await messageHub.processInboundMessage({
      tenantId: salonId,
      channel: 'EMAIL',
      direction: 'IN',
      text: text || html || subject,
      meta: {
        from,
        to,
        subject,
        html,
        emailProvider: 'webhook'
      }
    });

    if (result.success) {
      res.status(200).json({ ok: true, messageId: result.messageId });
    } else {
      res.status(500).json({ error: result.error });
    }

  } catch (error) {
    logger.error('Email webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * WebChat Message Endpoint
 * POST /api/v1/messaging/webchat
 */
router.post('/webchat', requireTenant, async (req, res) => {
  try {
    const { text, clientId } = req.body;
    const tenantId = req.tenant!.salonId;

    if (!text) {
      return res.status(400).json({ error: 'Message text is required' });
    }

    const result = await messageHub.processInboundMessage({
      tenantId,
      clientId,
      channel: 'WEB_CHAT',
      direction: 'IN',
      text,
      meta: {
        source: 'api',
        timestamp: new Date().toISOString()
      }
    });

    if (result.success) {
      res.status(200).json({ 
        success: true, 
        messageId: result.messageId,
        deliveredAt: result.deliveredAt 
      });
    } else {
      res.status(500).json({ error: result.error });
    }

  } catch (error) {
    logger.error('WebChat API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Send Message API (for admin/staff to send messages)
 * POST /api/v1/messaging/send
 */
router.post('/send', requireTenant, async (req, res) => {
  try {
    const { 
      channel, 
      clientId, 
      text, 
      templateCode, 
      templateData,
      targetLocale 
    } = req.body;
    
    const tenantId = req.tenant!.salonId;

    if (!channel || !text) {
      return res.status(400).json({ 
        error: 'Channel and text are required' 
      });
    }

    const result = await messageHub.sendMessage({
      tenantId,
      clientId,
      channel: channel.toUpperCase(),
      direction: 'OUT',
      text,
      templateCode,
      templateData,
      targetLocale,
      meta: {
        source: 'api',
        sentBy: 'staff' // Could be extracted from JWT
      }
    });

    if (result.success) {
      res.status(200).json({
        success: true,
        messageId: result.messageId,
        channel: result.channel,
        deliveredAt: result.deliveredAt
      });
    } else {
      res.status(500).json({ error: result.error });
    }

  } catch (error) {
    logger.error('Send message API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Bulk Send Messages
 * POST /api/v1/messaging/send-bulk
 */
router.post('/send-bulk', requireTenant, async (req, res) => {
  try {
    const { 
      recipients, 
      channel, 
      text, 
      templateCode, 
      templateData 
    } = req.body;
    
    const tenantId = req.tenant!.salonId;

    if (!recipients || !Array.isArray(recipients) || !channel || !text) {
      return res.status(400).json({ 
        error: 'Recipients array, channel, and text are required' 
      });
    }

    const results = await messageHub.sendBulkMessages({
      tenantId,
      recipients,
      channel: channel.toUpperCase(),
      text,
      templateCode,
      templateData,
      meta: {
        source: 'bulk-api',
        sentBy: 'staff'
      }
    });

    res.status(200).json({
      success: true,
      results,
      totalSent: results.filter(r => r.success).length,
      totalFailed: results.filter(r => !r.success).length
    });

  } catch (error) {
    logger.error('Bulk send API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get Message History
 * GET /api/v1/messaging/history
 */
router.get('/history', requireTenant, async (req, res) => {
  try {
    const tenantId = req.tenant!.salonId;
    const { 
      clientId, 
      channel, 
      limit = 50, 
      offset = 0,
      startDate,
      endDate 
    } = req.query;

    const history = await messageHub.getMessageHistory({
      tenantId,
      clientId: clientId as string,
      channel: channel as string,
      limit: Number(limit),
      offset: Number(offset),
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined
    });

    res.status(200).json({
      success: true,
      messages: history.messages,
      total: history.total,
      hasMore: history.hasMore
    });

  } catch (error) {
    logger.error('Message history API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get Messaging Statistics
 * GET /api/v1/messaging/stats
 */
router.get('/stats', requireTenant, async (req, res) => {
  try {
    const tenantId = req.tenant!.salonId;
    const { period = '30d' } = req.query;

    const stats = await messageHub.getMessagingStats({
      tenantId,
      period: period as string
    });

    res.status(200).json({
      success: true,
      stats
    });

  } catch (error) {
    logger.error('Messaging stats API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper functions
function extractBotTokenFromRequest(req: any): string | null {
  // Extract from URL path or headers
  // Implementation depends on how Telegram webhook is configured
  return req.headers['x-telegram-bot-token'] || null;
}

function verifyEmailWebhookSignature(req: any): boolean {
  // Implement signature verification based on email provider
  // (SendGrid, Mailgun, etc.)
  return true; // Placeholder
}

async function resolveSalonFromEmail(emailAddress: string): Promise<string | null> {
  // Implementation to find salon by email address
  // Could look up in salon_channels table
  return null; // Placeholder
}

export default router;
