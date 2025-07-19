import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { createServer } from '../server';
import { prisma } from '@dc-beauty/db';
import { MessageHub } from '../messaging/MessageHub';
import { Express } from 'express';

describe('TP-06: Messaging Hub Integration Tests', () => {
  let app: Express;
  let testSalonId: string;
  let testClientId: string;

  beforeAll(async () => {
    app = createServer();
    
    // Create test salon
    const salon = await prisma.salon.create({
      data: {
        nip: '9999999999',
        displayName: 'Test Messaging Salon',
        slug: 'test-messaging-salon',
        primaryLocale: 'pl',
        supportedLocales: ['pl', 'en'],
        baseCurrency: 'PLN',
        status: 'ACTIVE'
      }
    });
    testSalonId = salon.id;

    // Create test client
    const client = await prisma.client.create({
      data: {
        salonId: testSalonId,
        name: 'Test Client',
        email: 'test@example.com',
        phone: '+48123456789',
        preferredLocale: 'pl'
      }
    });
    testClientId = client.id;

    // Create salon channels
    await prisma.salonChannels.create({
      data: {
        salonId: testSalonId,
        telegramBotToken: 'test_bot_token',
        smtpHost: 'smtp.test.com',
        smtpPort: 587,
        smtpUser: 'test@salon.com',
        smtpPassword: 'encrypted_password',
        webChatEnabled: true
      }
    });
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.messageLog.deleteMany({ where: { salonId: testSalonId } });
    await prisma.salonChannels.deleteMany({ where: { salonId: testSalonId } });
    await prisma.client.deleteMany({ where: { salonId: testSalonId } });
    await prisma.salon.delete({ where: { id: testSalonId } });
    await prisma.$disconnect();
  });

  describe('MessageHub Core Functionality', () => {
    it('should send a message through Telegram channel', async () => {
      const messageHub = new MessageHub();
      
      const result = await messageHub.sendMessage({
        tenantId: testSalonId,
        clientId: testClientId,
        channel: 'TELEGRAM',
        direction: 'OUT',
        text: 'Test message from Beauty Platform',
        templateCode: 'reminder_24h',
        meta: { testCase: 'telegram-send' }
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
      expect(result.channel).toBe('TELEGRAM');
      expect(result.deliveredAt).toBeInstanceOf(Date);
    });

    it('should send a message through Email channel', async () => {
      const messageHub = new MessageHub();
      
      const result = await messageHub.sendMessage({
        tenantId: testSalonId,
        clientId: testClientId,
        channel: 'EMAIL',
        direction: 'OUT',
        text: 'Test email from Beauty Platform',
        templateCode: 'booking_confirmed',
        meta: { testCase: 'email-send' }
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
      expect(result.channel).toBe('EMAIL');
    });

    it('should handle rate limiting correctly', async () => {
      const messageHub = new MessageHub();
      
      // Send multiple messages rapidly
      const promises = Array.from({ length: 10 }, (_, i) => 
        messageHub.sendMessage({
          tenantId: testSalonId,
          clientId: testClientId,
          channel: 'TELEGRAM',
          direction: 'OUT',
          text: `Rate limit test message ${i}`,
          meta: { testCase: 'rate-limiting' }
        })
      );

      const results = await Promise.all(promises);
      
      // Some messages should succeed, some might be rate limited
      const successCount = results.filter(r => r.success).length;
      const rateLimitedCount = results.filter(r => !r.success && r.error?.includes('rate limit')).length;
      
      expect(successCount).toBeGreaterThan(0);
      expect(successCount + rateLimitedCount).toBe(10);
    });

    it('should process bulk messages correctly', async () => {
      const messageHub = new MessageHub();
      
      const recipients = [
        { clientId: testClientId, locale: 'pl' },
        { clientId: testClientId, locale: 'en' }
      ];

      const results = await messageHub.sendBulkMessages({
        tenantId: testSalonId,
        recipients,
        channel: 'EMAIL',
        text: 'Bulk message test',
        templateCode: 'newsletter',
        meta: { testCase: 'bulk-send' }
      });

      expect(results).toHaveLength(2);
      expect(results.every(r => r.success)).toBe(true);
    });
  });

  describe('Messaging API Routes', () => {
    it('should send message via API', async () => {
      const response = await request(app)
        .post('/api/v1/messaging/send')
        .set('x-tenant-id', testSalonId)
        .send({
          channel: 'telegram',
          clientId: testClientId,
          text: 'API test message',
          templateCode: 'custom'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.messageId).toBeDefined();
    });

    it('should handle bulk send via API', async () => {
      const response = await request(app)
        .post('/api/v1/messaging/send-bulk')
        .set('x-tenant-id', testSalonId)
        .send({
          recipients: [
            { clientId: testClientId, locale: 'pl' }
          ],
          channel: 'email',
          text: 'Bulk API test',
          templateCode: 'promotion'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.totalSent).toBe(1);
      expect(response.body.totalFailed).toBe(0);
    });

    it('should retrieve message history via API', async () => {
      // First send a message
      await request(app)
        .post('/api/v1/messaging/send')
        .set('x-tenant-id', testSalonId)
        .send({
          channel: 'telegram',
          clientId: testClientId,
          text: 'History test message'
        });

      // Then retrieve history
      const response = await request(app)
        .get('/api/v1/messaging/history')
        .set('x-tenant-id', testSalonId)
        .query({
          clientId: testClientId,
          limit: 10
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.messages).toBeInstanceOf(Array);
      expect(response.body.total).toBeGreaterThan(0);
    });

    it('should get messaging statistics via API', async () => {
      const response = await request(app)
        .get('/api/v1/messaging/stats')
        .set('x-tenant-id', testSalonId)
        .query({ period: '7d' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.stats).toBeDefined();
      expect(response.body.stats.totalMessages).toBeGreaterThanOrEqual(0);
    });
  });

  describe('WebChat Integration', () => {
    it('should handle WebChat message via API', async () => {
      const response = await request(app)
        .post('/api/v1/messaging/webchat')
        .set('x-tenant-id', testSalonId)
        .send({
          text: 'WebChat test message',
          clientId: testClientId
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.messageId).toBeDefined();
    });
  });

  describe('Template Processing', () => {
    it('should process templates with localization', async () => {
      const messageHub = new MessageHub();
      
      const result = await messageHub.sendMessage({
        tenantId: testSalonId,
        clientId: testClientId,
        channel: 'EMAIL',
        direction: 'OUT',
        text: '', // Will be filled by template
        templateCode: 'reminder_24h',
        templateData: {
          clientName: 'Test Client',
          appointmentTime: '14:00',
          serviceName: 'Strzyżenie damskie'
        },
        targetLocale: 'pl',
        meta: { testCase: 'template-processing' }
      });

      expect(result.success).toBe(true);
      expect(result.processedTemplate).toBeDefined();
      expect(result.processedTemplate).toContain('Test Client');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid tenant ID', async () => {
      const response = await request(app)
        .post('/api/v1/messaging/send')
        .set('x-tenant-id', 'invalid-tenant-id')
        .send({
          channel: 'telegram',
          text: 'Test message'
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBeDefined();
    });

    it('should handle missing required fields', async () => {
      const response = await request(app)
        .post('/api/v1/messaging/send')
        .set('x-tenant-id', testSalonId)
        .send({
          // Missing channel and text
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Channel and text are required');
    });

    it('should handle unsupported channel', async () => {
      const messageHub = new MessageHub();
      
      const result = await messageHub.sendMessage({
        tenantId: testSalonId,
        clientId: testClientId,
        channel: 'UNSUPPORTED_CHANNEL',
        direction: 'OUT',
        text: 'Test message',
        meta: { testCase: 'unsupported-channel' }
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unsupported channel');
    });
  });

  describe('Webhook Endpoints', () => {
    it('should handle Telegram webhook', async () => {
      const telegramUpdate = {
        message: {
          message_id: 123,
          from: {
            id: 456,
            first_name: 'Test',
            username: 'testuser'
          },
          chat: {
            id: 789,
            type: 'private'
          },
          text: 'Hello from Telegram'
        }
      };

      const response = await request(app)
        .post('/api/v1/messaging/webhooks/telegram')
        .set('x-telegram-bot-api-secret-token', 'test-secret')
        .send(telegramUpdate);

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
    });

    it('should handle invalid Telegram webhook signature', async () => {
      const response = await request(app)
        .post('/api/v1/messaging/webhooks/telegram')
        .set('x-telegram-bot-api-secret-token', 'invalid-secret')
        .send({ message: { text: 'test' } });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid webhook secret');
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle concurrent message sends', async () => {
      const messageHub = new MessageHub();
      const concurrentRequests = 20;
      
      const promises = Array.from({ length: concurrentRequests }, (_, i) =>
        messageHub.sendMessage({
          tenantId: testSalonId,
          clientId: testClientId,
          channel: 'EMAIL',
          direction: 'OUT',
          text: `Concurrent test message ${i}`,
          meta: { testCase: 'concurrent-send', messageIndex: i }
        })
      );

      const results = await Promise.allSettled(promises);
      const successCount = results.filter(r => 
        r.status === 'fulfilled' && r.value.success
      ).length;

      // At least 80% should succeed
      expect(successCount).toBeGreaterThanOrEqual(concurrentRequests * 0.8);
    });

    it('should maintain performance under bulk operations', async () => {
      const messageHub = new MessageHub();
      const startTime = Date.now();
      
      const recipients = Array.from({ length: 50 }, (_, i) => ({
        clientId: testClientId,
        locale: 'pl',
        customData: { index: i }
      }));

      const results = await messageHub.sendBulkMessages({
        tenantId: testSalonId,
        recipients,
        channel: 'EMAIL',
        text: 'Performance test bulk message',
        templateCode: 'bulk_test',
        meta: { testCase: 'performance-bulk' }
      });

      const duration = Date.now() - startTime;
      
      expect(results).toHaveLength(50);
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
      
      const successRate = results.filter(r => r.success).length / results.length;
      expect(successRate).toBeGreaterThanOrEqual(0.9); // 90% success rate
    });
  });

  describe('Integration with TP-05 Language Resolver', () => {
    it('should automatically resolve client language', async () => {
      // Update client with specific locale preferences
      await prisma.client.update({
        where: { id: testClientId },
        data: {
          preferredLocale: 'en',
          alternateLocales: ['pl', 'uk']
        }
      });

      const messageHub = new MessageHub();
      
      const result = await messageHub.sendMessage({
        tenantId: testSalonId,
        clientId: testClientId,
        channel: 'EMAIL',
        direction: 'OUT',
        text: '', // Will be filled by template
        templateCode: 'welcome',
        meta: { testCase: 'language-resolution' }
      });

      expect(result.success).toBe(true);
      expect(result.resolvedLocale).toBe('en');
    });

    it('should fall back to salon default language', async () => {
      // Create client without preferred locale
      const clientWithoutLocale = await prisma.client.create({
        data: {
          salonId: testSalonId,
          name: 'Client Without Locale',
          email: 'nolang@example.com'
        }
      });

      const messageHub = new MessageHub();
      
      const result = await messageHub.sendMessage({
        tenantId: testSalonId,
        clientId: clientWithoutLocale.id,
        channel: 'EMAIL',
        direction: 'OUT',
        text: '', // Will be filled by template
        templateCode: 'welcome',
        meta: { testCase: 'fallback-language' }
      });

      expect(result.success).toBe(true);
      expect(result.resolvedLocale).toBe('pl'); // Salon's primary locale

      // Cleanup
      await prisma.client.delete({ where: { id: clientWithoutLocale.id } });
    });
  });
});
