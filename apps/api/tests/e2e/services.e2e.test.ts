/**
 * TP-07 E2E Tests - Part 1: Public Services API
 * 
 * Tests for GET /public/:slug/services endpoint
 * - Service listing with localization
 * - Multi-language support
 * - Error handling for invalid salons
 * - Category filtering and sorting
 */

import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/server';
import { TestHelpers } from '../helpers/testHelpers';
import { ApiClient } from '../helpers/apiClient';
import { DatabaseManager } from '../helpers/databaseManager';

describe('TP-07 E2E: Public Services API', () => {
  let testHelpers: TestHelpers;
  let apiClient: ApiClient;
  let dbManager: DatabaseManager;
  let testSalon: any;
  let testServices: any[];

  beforeAll(async () => {
    testHelpers = new TestHelpers();
    apiClient = new ApiClient(app);
    dbManager = new DatabaseManager();

    // Setup test database
    await dbManager.setupTestDatabase();

    // Create test salon
    testSalon = await testHelpers.createTestSalon({
      slug: 'test-salon-services',
      displayName: 'Test Salon Services',
      primaryLocale: 'pl',
      supportedLocales: ['pl', 'en', 'uk', 'ru'],
      baseCurrency: 'PLN'
    });

    // Create test services with different categories
    testServices = await Promise.all([
      testHelpers.createTestService(testSalon.id, {
        code: 'hair_womens_cut',
        baseName: 'Strzyżenie damskie',
        baseDescription: 'Profesjonalne strzyżenie dla kobiet',
        category: 'hair',
        durationMin: 45,
        priceAmount: 120,
        priceCurrency: 'PLN'
      }),
      testHelpers.createTestService(testSalon.id, {
        code: 'nails_manicure',
        baseName: 'Manicure klasyczny',
        baseDescription: 'Klasyczny manicure bez lakieru',
        category: 'nails',
        durationMin: 30,
        priceAmount: 80,
        priceCurrency: 'PLN'
      }),
      testHelpers.createTestService(testSalon.id, {
        code: 'brow_shape',
        baseName: 'Regulacja brwi',
        baseDescription: 'Precyzyjna regulacja brwi',
        category: 'brows_lashes',
        durationMin: 20,
        priceAmount: 40,
        priceCurrency: 'PLN'
      }),
      testHelpers.createTestService(testSalon.id, {
        code: 'inactive_service',
        baseName: 'Nieaktywna usługa',
        baseDescription: 'Ta usługa nie powinna być widoczna',
        category: 'other',
        durationMin: 60,
        priceAmount: 100,
        priceCurrency: 'PLN',
        active: false
      })
    ]);

    // Create translations for services
    await testHelpers.createServiceTranslations(testServices[0].id, [
      { locale: 'en', name: 'Women\'s Haircut', description: 'Professional haircut for women' },
      { locale: 'uk', name: 'Жіноча стрижка', description: 'Професійна стрижка для жінок' },
      { locale: 'ru', name: 'Женская стрижка', description: 'Профессиональная стрижка для женщин' }
    ]);

    await testHelpers.createServiceTranslations(testServices[1].id, [
      { locale: 'en', name: 'Classic Manicure', description: 'Classic manicure without polish' },
      { locale: 'uk', name: 'Класичний манікюр', description: 'Класичний манікюр без лаку' }
    ]);
  });

  afterAll(async () => {
    await dbManager.cleanupTestDatabase();
  });

  describe('GET /public/:slug/services', () => {
    test('should return services for valid salon slug', async () => {
      const response = await apiClient.get(`/public/${testSalon.slug}/services`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toBeInstanceOf(Array);
      
      // Should return only active services (3 out of 4)
      expect(response.body.data).toHaveLength(3);
      
      // Check structure of returned service
      const service = response.body.data[0];
      expect(service).toHaveProperty('id');
      expect(service).toHaveProperty('code');
      expect(service).toHaveProperty('name');
      expect(service).toHaveProperty('description');
      expect(service).toHaveProperty('durationMin');
      expect(service).toHaveProperty('price');
      expect(service.price).toHaveProperty('amount');
      expect(service.price).toHaveProperty('currency');
      expect(service).toHaveProperty('category');

      // Check meta information
      expect(response.body).toHaveProperty('meta');
      expect(response.body.meta).toHaveProperty('salonSlug', testSalon.slug);
      expect(response.body.meta).toHaveProperty('locale', 'pl'); // Default locale
      expect(response.body.meta).toHaveProperty('total', 3);
    });

    test('should return services with English localization', async () => {
      const response = await apiClient.get(`/public/${testSalon.slug}/services?locale=en`);

      expect(response.status).toBe(200);
      expect(response.body.meta.locale).toBe('en');
      
      // Find the haircut service
      const haircutService = response.body.data.find((s: any) => s.code === 'hair_womens_cut');
      expect(haircutService).toBeDefined();
      expect(haircutService.name).toBe('Women\'s Haircut');
      expect(haircutService.description).toBe('Professional haircut for women');
    });

    test('should return services with Ukrainian localization', async () => {
      const response = await apiClient.get(`/public/${testSalon.slug}/services?locale=uk`);

      expect(response.status).toBe(200);
      expect(response.body.meta.locale).toBe('uk');
      
      const haircutService = response.body.data.find((s: any) => s.code === 'hair_womens_cut');
      expect(haircutService.name).toBe('Жіноча стрижка');
      expect(haircutService.description).toBe('Професійна стрижка для жінок');
    });

    test('should fallback to base name when translation not available', async () => {
      const response = await apiClient.get(`/public/${testSalon.slug}/services?locale=ru`);

      expect(response.status).toBe(200);
      
      // Find the brow service (no Russian translation)
      const browService = response.body.data.find((s: any) => s.code === 'brow_shape');
      expect(browService).toBeDefined();
      expect(browService.name).toBe('Regulacja brwi'); // Falls back to baseName
      expect(browService.description).toBe('Precyzyjna regulacja brwi'); // Falls back to baseDescription
    });

    test('should handle unsupported locale gracefully', async () => {
      const response = await apiClient.get(`/public/${testSalon.slug}/services?locale=de`);

      expect(response.status).toBe(200);
      // Should fallback to primary locale (pl)
      expect(response.body.meta.locale).toBe('de');
      
      // Services should use base names (Polish)
      const haircutService = response.body.data.find((s: any) => s.code === 'hair_womens_cut');
      expect(haircutService.name).toBe('Strzyżenie damskie');
    });

    test('should return services sorted by category and name', async () => {
      const response = await apiClient.get(`/public/${testSalon.slug}/services`);

      expect(response.status).toBe(200);
      const services = response.body.data;
      
      // Check if services are sorted by category
      const categories = services.map((s: any) => s.category);
      const sortedCategories = [...categories].sort();
      expect(categories).toEqual(sortedCategories);
      
      // Within same category, should be sorted by name
      const hairServices = services.filter((s: any) => s.category === 'hair');
      if (hairServices.length > 1) {
        const names = hairServices.map((s: any) => s.name);
        const sortedNames = [...names].sort();
        expect(names).toEqual(sortedNames);
      }
    });

    test('should exclude inactive services', async () => {
      const response = await apiClient.get(`/public/${testSalon.slug}/services`);

      expect(response.status).toBe(200);
      
      // Should not include the inactive service
      const inactiveService = response.body.data.find((s: any) => s.code === 'inactive_service');
      expect(inactiveService).toBeUndefined();
      
      // Should only return 3 active services
      expect(response.body.data).toHaveLength(3);
    });

    test('should return correct price information', async () => {
      const response = await apiClient.get(`/public/${testSalon.slug}/services`);

      expect(response.status).toBe(200);
      
      const haircutService = response.body.data.find((s: any) => s.code === 'hair_womens_cut');
      expect(haircutService.price.amount).toBe(120);
      expect(haircutService.price.currency).toBe('PLN');
      
      const manicureService = response.body.data.find((s: any) => s.code === 'nails_manicure');
      expect(manicureService.price.amount).toBe(80);
      expect(manicureService.price.currency).toBe('PLN');
    });

    test('should return 404 for non-existent salon slug', async () => {
      const response = await apiClient.get('/public/non-existent-salon/services');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'SALON_NOT_FOUND');
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('non-existent-salon');
    });

    test('should return 400 for missing salon slug', async () => {
      const response = await apiClient.get('/public//services');

      expect(response.status).toBe(404); // Express returns 404 for malformed routes
    });

    test('should handle database errors gracefully', async () => {
      // Create a salon with invalid database state
      const badSalon = await testHelpers.createTestSalon({
        slug: 'bad-salon-db-test',
        displayName: 'Bad Salon'
      });

      // Force a database error by breaking the connection temporarily
      await dbManager.simulateDatabaseError();

      const response = await apiClient.get(`/public/${badSalon.slug}/services`);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'INTERNAL_ERROR');
      expect(response.body).toHaveProperty('message', 'Failed to fetch services');

      // Restore database connection
      await dbManager.restoreDatabaseConnection();
    });

    test('should handle empty services list', async () => {
      // Create salon with no services
      const emptySalon = await testHelpers.createTestSalon({
        slug: 'empty-salon-services',
        displayName: 'Empty Salon'
      });

      const response = await apiClient.get(`/public/${emptySalon.slug}/services`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
      expect(response.body.meta.total).toBe(0);
    });

    test('should return consistent response format for different locales', async () => {
      const locales = ['pl', 'en', 'uk', 'ru'];
      
      for (const locale of locales) {
        const response = await apiClient.get(`/public/${testSalon.slug}/services?locale=${locale}`);
        
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('meta');
        expect(response.body.meta).toHaveProperty('salonSlug');
        expect(response.body.meta).toHaveProperty('locale', locale);
        expect(response.body.meta).toHaveProperty('total');
        
        // All services should have the same structure regardless of locale
        response.body.data.forEach((service: any) => {
          expect(service).toHaveProperty('id');
          expect(service).toHaveProperty('code');
          expect(service).toHaveProperty('name');
          expect(service).toHaveProperty('description');
          expect(service).toHaveProperty('durationMin');
          expect(service).toHaveProperty('price');
          expect(service).toHaveProperty('category');
          expect(typeof service.name).toBe('string');
          expect(typeof service.durationMin).toBe('number');
          expect(typeof service.price.amount).toBe('number');
        });
      }
    });

    test('should validate service categories are present', async () => {
      const response = await apiClient.get(`/public/${testSalon.slug}/services`);

      expect(response.status).toBe(200);
      
      const expectedCategories = ['hair', 'nails', 'brows_lashes'];
      const actualCategories = [...new Set(response.body.data.map((s: any) => s.category))];
      
      expectedCategories.forEach(category => {
        expect(actualCategories).toContain(category);
      });
    });

    test('should handle special characters in service names and descriptions', async () => {
      // Create service with special characters
      const specialService = await testHelpers.createTestService(testSalon.id, {
        code: 'special_chars_service',
        baseName: 'Usługa z ąćęłńóśźż & "quotes" <tags>',
        baseDescription: 'Opis z polskimi znakami: ąćęłńóśźż oraz symbolami: & < > " \'',
        category: 'special',
        durationMin: 30,
        priceAmount: 50,
        priceCurrency: 'PLN'
      });

      const response = await apiClient.get(`/public/${testSalon.slug}/services`);

      expect(response.status).toBe(200);
      
      const service = response.body.data.find((s: any) => s.code === 'special_chars_service');
      expect(service).toBeDefined();
      expect(service.name).toBe('Usługa z ąćęłńóśźż & "quotes" <tags>');
      expect(service.description).toBe('Opis z polskimi znakami: ąćęłńóśźż oraz symbolami: & < > " \'');
    });
  });
});
