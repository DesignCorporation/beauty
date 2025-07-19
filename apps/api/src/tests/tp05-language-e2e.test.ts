/**
 * E2E Integration Tests for TP-05 Language Resolver
 * 
 * Tests the complete language resolution flow including:
 * - Language middleware integration
 * - Services API with auto-translation
 * - Multi-language response formatting
 * - Tenant isolation with language context
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { createServer } from '../server';
import { PrismaClient } from '@prisma/client';
import { Application } from 'express';

const prisma = new PrismaClient();
let app: Application;

// Test data
const testSalonId = 'test-salon-language-e2e';
const testSalonSlug = 'test-language-salon';

beforeAll(async () => {
  app = createServer();
  
  // Create test salon with multi-language support
  await prisma.salon.upsert({
    where: { id: testSalonId },
    update: {},
    create: {
      id: testSalonId,
      nip: '1234567890',
      displayName: 'Test Language Salon',
      slug: testSalonSlug,
      primaryLocale: 'pl',
      supportedLocales: ['pl', 'en', 'uk', 'ru'],
      autoTranslateEnabled: true,
      baseCurrency: 'PLN'
    }
  });

  // Create test services
  await prisma.service.createMany({
    data: [
      {
        id: 'service-1-lang-test',
        salonId: testSalonId,
        code: 'test_haircut',
        baseName: 'Strzyżenie damskie',
        baseDescription: 'Profesjonalne strzyżenie dla kobiet',
        durationMin: 45,
        priceAmount: 50,
        priceCurrency: 'PLN',
        category: 'hair'
      },
      {
        id: 'service-2-lang-test',
        salonId: testSalonId,
        code: 'test_manicure',
        baseName: 'Manicure hybrydowy',
        baseDescription: 'Trwały manicure z żel-lakiem',
        durationMin: 60,
        priceAmount: 35,
        priceCurrency: 'PLN',
        category: 'nails'
      }
    ],
    skipDuplicates: true
  });

  // Pre-create some translations for testing
  await prisma.translation.createMany({
    data: [
      {
        entityType: 'service',
        entityId: 'service-1-lang-test',
        field: 'name',
        locale: 'en',
        text: 'Women\'s Haircut',
        source: 'manual',
        approved: true
      },
      {
        entityType: 'service',
        entityId: 'service-1-lang-test',
        field: 'description',
        locale: 'en',
        text: 'Professional haircut for women',
        source: 'manual',
        approved: true
      }
    ],
    skipDuplicates: true
  });
});

afterAll(async () => {
  // Cleanup
  await prisma.translation.deleteMany({
    where: { entityId: { in: ['service-1-lang-test', 'service-2-lang-test'] } }
  });
  await prisma.service.deleteMany({
    where: { salonId: testSalonId }
  });
  await prisma.salon.delete({
    where: { id: testSalonId }
  });
  await prisma.$disconnect();
});

describe('TP-05 E2E Language Integration', () => {
  describe('Language Middleware Integration', () => {
    test('should resolve Polish as default language', async () => {
      const response = await request(app)
        .get('/api/v1/services')
        .set('x-tenant-id', testSalonId)
        .expect(200);

      expect(response.headers['content-language']).toBe('pl');
      expect(response.body.meta.locale).toBe('pl');
      
      // Should return Polish base names
      const service = response.body.services.find((s: any) => s.code === 'test_haircut');
      expect(service.name).toBe('Strzyżenie damskie');
    });

    test('should resolve English from Accept-Language header', async () => {
      const response = await request(app)
        .get('/api/v1/services')
        .set('x-tenant-id', testSalonId)
        .set('Accept-Language', 'en-US,en;q=0.9')
        .expect(200);

      expect(response.headers['content-language']).toBe('en');
      expect(response.body.meta.locale).toBe('en');
      
      // Should return English translation
      const service = response.body.services.find((s: any) => s.code === 'test_haircut');
      expect(service.name).toBe('Women\'s Haircut');
      expect(service.translation.approved).toBe(true);
    });

    test('should prioritize query parameter over Accept-Language', async () => {
      const response = await request(app)
        .get('/api/v1/services?lang=uk')
        .set('x-tenant-id', testSalonId)
        .set('Accept-Language', 'en-US,en;q=0.9')
        .expect(200);

      expect(response.headers['content-language']).toBe('uk');
      expect(response.body.meta.locale).toBe('uk');
    });

    test('should handle unsupported language gracefully', async () => {
      const response = await request(app)
        .get('/api/v1/services')
        .set('x-tenant-id', testSalonId)
        .set('Accept-Language', 'fr-FR,fr;q=0.9')
        .expect(200);

      // Should fallback to salon primary language
      expect(response.headers['content-language']).toBe('pl');
      expect(response.body.meta.locale).toBe('pl');
    });
  });

  describe('Auto-Translation Integration', () => {
    test('should auto-translate missing Ukrainian service', async () => {
      const response = await request(app)
        .get('/api/v1/services?lang=uk')
        .set('x-tenant-id', testSalonId)
        .expect(200);

      expect(response.body.meta.locale).toBe('uk');
      expect(response.body.meta.autoTranslated).toBeGreaterThan(0);
      
      // Should have created auto-translations
      const service = response.body.services.find((s: any) => s.code === 'test_manicure');
      expect(service.translation).toBeTruthy();
      expect(service.translation.source).toBe('auto');
      expect(service.translation.approved).toBe(false);
    });

    test('should not auto-translate if disabled', async () => {
      // Temporarily disable auto-translate
      await prisma.salon.update({
        where: { id: testSalonId },
        data: { autoTranslateEnabled: false }
      });

      const response = await request(app)
        .get('/api/v1/services?lang=ru')
        .set('x-tenant-id', testSalonId)
        .expect(200);

      expect(response.body.meta.autoTranslated).toBe(0);
      
      // Should fallback to base name
      const service = response.body.services.find((s: any) => s.code === 'test_haircut');
      expect(service.name).toBe('Strzyżenie damskie'); // Polish base name
      expect(service.translation).toBeNull();

      // Re-enable auto-translate
      await prisma.salon.update({
        where: { id: testSalonId },
        data: { autoTranslateEnabled: true }
      });
    });
  });

  describe('Service Detail API with Language', () => {
    test('should return service detail with all translations', async () => {
      const response = await request(app)
        .get('/api/v1/services/service-1-lang-test?lang=en')
        .set('x-tenant-id', testSalonId)
        .expect(200);

      const service = response.body.service;
      expect(service.name).toBe('Women\'s Haircut');
      expect(service.baseName).toBe('Strzyżenie damskie');
      expect(service.translations).toBeInstanceOf(Array);
      expect(service.translations.length).toBeGreaterThan(0);
      
      const enTranslation = service.translations.find((t: any) => t.locale === 'en');
      expect(enTranslation.approved).toBe(true);
      expect(enTranslation.source).toBe('manual');
    });

    test('should return 404 for non-existent service', async () => {
      await request(app)
        .get('/api/v1/services/non-existent-service')
        .set('x-tenant-id', testSalonId)
        .expect(404);
    });
  });

  describe('Service Categories with Language', () => {
    test('should return categories list', async () => {
      const response = await request(app)
        .get('/api/v1/services/categories')
        .set('x-tenant-id', testSalonId)
        .expect(200);

      expect(response.body.categories).toBeInstanceOf(Array);
      expect(response.body.categories.length).toBeGreaterThan(0);
      
      const hairCategory = response.body.categories.find((c: any) => c.name === 'hair');
      expect(hairCategory.count).toBeGreaterThan(0);
    });
  });

  describe('Public Booking API Language Resolution', () => {
    test('should resolve language from salon slug', async () => {
      const response = await request(app)
        .get(`/public/${testSalonSlug}/services?lang=en`)
        .expect(200);

      expect(response.body.meta.locale).toBe('en');
      expect(response.body.services).toBeInstanceOf(Array);
      
      const service = response.body.services.find((s: any) => s.code === 'test_haircut');
      expect(service.name).toBe('Women\'s Haircut');
    });

    test('should handle invalid salon slug', async () => {
      await request(app)
        .get('/public/non-existent-salon/services')
        .expect(404);
    });
  });

  describe('Error Handling with Language Context', () => {
    test('should handle missing tenant gracefully', async () => {
      const response = await request(app)
        .get('/api/v1/services')
        .expect(400);

      expect(response.body.error).toBe('TENANT_REQUIRED');
    });

    test('should handle translation errors gracefully', async () => {
      // Test with broken translation provider
      process.env.TRANSLATE_PROVIDER = 'broken';
      
      const response = await request(app)
        .get('/api/v1/services?lang=ru')
        .set('x-tenant-id', testSalonId)
        .expect(200);

      // Should still work but with base names
      expect(response.body.services).toBeInstanceOf(Array);
      expect(response.body.meta.autoTranslated).toBe(0);
      
      // Reset provider
      delete process.env.TRANSLATE_PROVIDER;
    });
  });

  describe('Performance and Caching', () => {
    test('should cache translation results', async () => {
      const start1 = Date.now();
      await request(app)
        .get('/api/v1/services?lang=en')
        .set('x-tenant-id', testSalonId)
        .expect(200);
      const time1 = Date.now() - start1;

      const start2 = Date.now();
      await request(app)
        .get('/api/v1/services?lang=en')
        .set('x-tenant-id', testSalonId)
        .expect(200);
      const time2 = Date.now() - start2;

      // Second request should be faster due to caching
      expect(time2).toBeLessThan(time1);
    });

    test('should handle concurrent requests efficiently', async () => {
      const promises = Array.from({ length: 5 }, () =>
        request(app)
          .get('/api/v1/services?lang=uk')
          .set('x-tenant-id', testSalonId)
          .expect(200)
      );

      const responses = await Promise.all(promises);
      
      // All should succeed
      responses.forEach(response => {
        expect(response.body.meta.locale).toBe('uk');
        expect(response.body.services).toBeInstanceOf(Array);
      });
    });
  });

  describe('Tenant Isolation with Language', () => {
    test('should maintain language isolation between tenants', async () => {
      // Create another test salon
      const otherSalonId = 'other-salon-lang-test';
      await prisma.salon.create({
        data: {
          id: otherSalonId,
          nip: '9876543210',
          displayName: 'Other Test Salon',
          slug: 'other-test-salon',
          primaryLocale: 'en',
          supportedLocales: ['en'],
          autoTranslateEnabled: false,
          baseCurrency: 'EUR'
        }
      });

      try {
        // Request from original salon (Polish)
        const response1 = await request(app)
          .get('/api/v1/services')
          .set('x-tenant-id', testSalonId)
          .expect(200);

        expect(response1.body.meta.locale).toBe('pl');
        expect(response1.body.services.length).toBeGreaterThan(0);

        // Request from other salon (English, no services)
        const response2 = await request(app)
          .get('/api/v1/services')
          .set('x-tenant-id', otherSalonId)
          .expect(200);

        expect(response2.body.meta.locale).toBe('en');
        expect(response2.body.services.length).toBe(0);

      } finally {
        // Cleanup
        await prisma.salon.delete({ where: { id: otherSalonId } });
      }
    });
  });
});
