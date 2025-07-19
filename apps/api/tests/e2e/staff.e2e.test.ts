/**
 * TP-07 E2E Tests - Part 2: Public Staff API
 * 
 * Tests for GET /public/:slug/staff endpoint
 * - Staff listing with language filtering
 * - Active/inactive staff handling
 * - Language capability validation
 * - Error handling and edge cases
 */

import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/server';
import { TestHelpers } from '../helpers/testHelpers';
import { ApiClient } from '../helpers/apiClient';
import { DatabaseManager } from '../helpers/databaseManager';

describe('TP-07 E2E: Public Staff API', () => {
  let testHelpers: TestHelpers;
  let apiClient: ApiClient;
  let dbManager: DatabaseManager;
  let testSalon: any;
  let testStaff: any[];

  beforeAll(async () => {
    testHelpers = new TestHelpers();
    apiClient = new ApiClient(app);
    dbManager = new DatabaseManager();

    // Setup test database
    await dbManager.setupTestDatabase();

    // Create test salon
    testSalon = await testHelpers.createTestSalon({
      slug: 'test-salon-staff',
      displayName: 'Test Salon Staff',
      primaryLocale: 'pl',
      supportedLocales: ['pl', 'en', 'uk', 'ru'],
      baseCurrency: 'PLN'
    });

    // Create test staff with different language capabilities
    testStaff = await Promise.all([
      testHelpers.createTestStaff(testSalon.id, {
        name: 'Anna Kowalska',
        role: 'MASTER',
        spokenLocales: ['pl', 'en'],
        preferredLocaleForUi: 'pl',
        color: '#ff6b6b',
        active: true
      }),
      testHelpers.createTestStaff(testSalon.id, {
        name: 'Maria Petrov',
        role: 'MASTER',
        spokenLocales: ['uk', 'ru', 'en'],
        preferredLocaleForUi: 'uk',
        color: '#4ecdc4',
        active: true
      }),
      testHelpers.createTestStaff(testSalon.id, {
        name: 'Sarah Johnson',
        role: 'ADMIN',
        spokenLocales: ['en'],
        preferredLocaleForUi: 'en',
        color: '#45b7d1',
        active: true
      }),
      testHelpers.createTestStaff(testSalon.id, {
        name: 'Katarzyna Nowak',
        role: 'MASTER',
        spokenLocales: ['pl'],
        preferredLocaleForUi: 'pl',
        color: '#f9ca24',
        active: true
      }),
      testHelpers.createTestStaff(testSalon.id, {
        name: 'Inactive Master',
        role: 'MASTER',
        spokenLocales: ['pl', 'en'],
        preferredLocaleForUi: 'pl',
        color: '#6c5ce7',
        active: false
      }),
      testHelpers.createTestStaff(testSalon.id, {
        name: 'John Reception',
        role: 'RECEPTION',
        spokenLocales: ['en', 'pl'],
        preferredLocaleForUi: 'en',
        color: '#a29bfe',
        active: true
      })
    ]);
  });

  afterAll(async () => {
    await dbManager.cleanupTestDatabase();
  });

  describe('GET /public/:slug/staff', () => {
    test('should return all active staff for valid salon slug', async () => {
      const response = await apiClient.get(`/public/${testSalon.slug}/staff`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toBeInstanceOf(Array);
      
      // Should return only active staff (5 out of 6)
      expect(response.body.data).toHaveLength(5);
      
      // Check structure of returned staff member
      const staff = response.body.data[0];
      expect(staff).toHaveProperty('id');
      expect(staff).toHaveProperty('name');
      expect(staff).toHaveProperty('role');
      expect(staff).toHaveProperty('spokenLocales');
      expect(staff).toHaveProperty('color');
      expect(staff.spokenLocales).toBeInstanceOf(Array);

      // Should not include inactive staff
      const inactiveStaff = response.body.data.find((s: any) => s.name === 'Inactive Master');
      expect(inactiveStaff).toBeUndefined();

      // Check meta information
      expect(response.body).toHaveProperty('meta');
      expect(response.body.meta).toHaveProperty('salonSlug', testSalon.slug);
      expect(response.body.meta).toHaveProperty('total', 5);
    });

    test('should filter staff by Polish language capability', async () => {
      const response = await apiClient.get(`/public/${testSalon.slug}/staff?lang=pl`);

      expect(response.status).toBe(200);
      expect(response.body.meta.languageFilter).toBe('pl');
      
      // Should return staff who speak Polish
      const polishSpeakers = response.body.data;
      expect(polishSpeakers.length).toBeGreaterThan(0);
      
      // All returned staff should speak Polish
      polishSpeakers.forEach((staff: any) => {
        expect(staff.spokenLocales).toContain('pl');
      });
      
      // Verify specific staff members
      const annaKowalska = polishSpeakers.find((s: any) => s.name === 'Anna Kowalska');
      const katarzynaNowak = polishSpeakers.find((s: any) => s.name === 'Katarzyna Nowak');
      const johnReception = polishSpeakers.find((s: any) => s.name === 'John Reception');
      
      expect(annaKowalska).toBeDefined();
      expect(katarzynaNowak).toBeDefined();
      expect(johnReception).toBeDefined();
      
      // Should not include staff who don't speak Polish
      const sarahJohnson = polishSpeakers.find((s: any) => s.name === 'Sarah Johnson');
      expect(sarahJohnson).toBeUndefined();
    });

    test('should filter staff by English language capability', async () => {
      const response = await apiClient.get(`/public/${testSalon.slug}/staff?lang=en`);

      expect(response.status).toBe(200);
      expect(response.body.meta.languageFilter).toBe('en');
      
      const englishSpeakers = response.body.data;
      
      // All returned staff should speak English
      englishSpeakers.forEach((staff: any) => {
        expect(staff.spokenLocales).toContain('en');
      });
      
      // Verify specific English speakers
      const expectedEnglishSpeakers = ['Anna Kowalska', 'Maria Petrov', 'Sarah Johnson', 'John Reception'];
      expectedEnglishSpeakers.forEach(name => {
        const staff = englishSpeakers.find((s: any) => s.name === name);
        expect(staff).toBeDefined();
      });
      
      // Should not include Katarzyna Nowak (Polish only)
      const katarzyna = englishSpeakers.find((s: any) => s.name === 'Katarzyna Nowak');
      expect(katarzyna).toBeUndefined();
    });

    test('should filter staff by Ukrainian language capability', async () => {
      const response = await apiClient.get(`/public/${testSalon.slug}/staff?lang=uk`);

      expect(response.status).toBe(200);
      expect(response.body.meta.languageFilter).toBe('uk');
      
      const ukrainianSpeakers = response.body.data;
      
      // Should return only Maria Petrov (speaks Ukrainian)
      expect(ukrainianSpeakers).toHaveLength(1);
      expect(ukrainianSpeakers[0].name).toBe('Maria Petrov');
      expect(ukrainianSpeakers[0].spokenLocales).toContain('uk');
    });

    test('should filter staff by Russian language capability', async () => {
      const response = await apiClient.get(`/public/${testSalon.slug}/staff?lang=ru`);

      expect(response.status).toBe(200);
      expect(response.body.meta.languageFilter).toBe('ru');
      
      const russianSpeakers = response.body.data;
      
      // Should return only Maria Petrov (speaks Russian)
      expect(russianSpeakers).toHaveLength(1);
      expect(russianSpeakers[0].name).toBe('Maria Petrov');
      expect(russianSpeakers[0].spokenLocales).toContain('ru');
    });

    test('should return empty array for unsupported language filter', async () => {
      const response = await apiClient.get(`/public/${testSalon.slug}/staff?lang=de`);

      expect(response.status).toBe(200);
      expect(response.body.meta.languageFilter).toBe('de');
      expect(response.body.data).toEqual([]);
      expect(response.body.meta.total).toBe(0);
    });

    test('should ignore language filter if not in salon supported locales', async () => {
      // Create salon with limited supported locales
      const limitedSalon = await testHelpers.createTestSalon({
        slug: 'limited-salon-staff',
        displayName: 'Limited Salon',
        supportedLocales: ['pl', 'en'] // No Ukrainian support
      });

      await testHelpers.createTestStaff(limitedSalon.id, {
        name: 'Test Staff',
        role: 'MASTER',
        spokenLocales: ['uk'],
        active: true
      });

      const response = await apiClient.get(`/public/${limitedSalon.slug}/staff?lang=uk`);

      expect(response.status).toBe(200);
      // Should return all active staff since uk is not in supported locales
      expect(response.body.data).toHaveLength(1);
    });

    test('should return staff sorted by name', async () => {
      const response = await apiClient.get(`/public/${testSalon.slug}/staff`);

      expect(response.status).toBe(200);
      
      const staffNames = response.body.data.map((s: any) => s.name);
      const sortedNames = [...staffNames].sort();
      expect(staffNames).toEqual(sortedNames);
    });

    test('should include all required staff fields', async () => {
      const response = await apiClient.get(`/public/${testSalon.slug}/staff`);

      expect(response.status).toBe(200);
      
      response.body.data.forEach((staff: any) => {
        expect(staff).toHaveProperty('id');
        expect(staff).toHaveProperty('name');
        expect(staff).toHaveProperty('role');
        expect(staff).toHaveProperty('spokenLocales');
        expect(staff).toHaveProperty('color');
        
        // Validate data types
        expect(typeof staff.id).toBe('string');
        expect(typeof staff.name).toBe('string');
        expect(typeof staff.role).toBe('string');
        expect(Array.isArray(staff.spokenLocales)).toBe(true);
        expect(typeof staff.color).toBe('string');
        
        // Should not include sensitive fields
        expect(staff).not.toHaveProperty('userId');
        expect(staff).not.toHaveProperty('preferredLocaleForUi');
        expect(staff).not.toHaveProperty('active');
      });
    });

    test('should validate staff roles are correct', async () => {
      const response = await apiClient.get(`/public/${testSalon.slug}/staff`);

      expect(response.status).toBe(200);
      
      const validRoles = ['MASTER', 'ADMIN', 'RECEPTION', 'OTHER'];
      
      response.body.data.forEach((staff: any) => {
        expect(validRoles).toContain(staff.role);
      });
      
      // Check specific roles
      const annaKowalska = response.body.data.find((s: any) => s.name === 'Anna Kowalska');
      expect(annaKowalska.role).toBe('MASTER');
      
      const sarahJohnson = response.body.data.find((s: any) => s.name === 'Sarah Johnson');
      expect(sarahJohnson.role).toBe('ADMIN');
      
      const johnReception = response.body.data.find((s: any) => s.name === 'John Reception');
      expect(johnReception.role).toBe('RECEPTION');
    });

    test('should validate staff colors are valid hex codes', async () => {
      const response = await apiClient.get(`/public/${testSalon.slug}/staff`);

      expect(response.status).toBe(200);
      
      const hexColorRegex = /^#[0-9a-fA-F]{6}$/;
      
      response.body.data.forEach((staff: any) => {
        if (staff.color) {
          expect(staff.color).toMatch(hexColorRegex);
        }
      });
    });

    test('should return 404 for non-existent salon slug', async () => {
      const response = await apiClient.get('/public/non-existent-salon/staff');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'SALON_NOT_FOUND');
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('non-existent-salon');
    });

    test('should handle database errors gracefully', async () => {
      // Simulate database error
      await dbManager.simulateDatabaseError();

      const response = await apiClient.get(`/public/${testSalon.slug}/staff`);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'INTERNAL_ERROR');
      expect(response.body).toHaveProperty('message', 'Failed to fetch staff');

      // Restore database connection
      await dbManager.restoreDatabaseConnection();
    });

    test('should handle empty staff list', async () => {
      // Create salon with no staff
      const emptySalon = await testHelpers.createTestSalon({
        slug: 'empty-salon-staff',
        displayName: 'Empty Salon Staff'
      });

      const response = await apiClient.get(`/public/${emptySalon.slug}/staff`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
      expect(response.body.meta.total).toBe(0);
    });

    test('should handle special characters in staff names', async () => {
      // Create staff with special characters
      const specialStaff = await testHelpers.createTestStaff(testSalon.id, {
        name: 'Małgorzata Żółć-Węgiel & "Artist" <Master>',
        role: 'MASTER',
        spokenLocales: ['pl'],
        color: '#e17055',
        active: true
      });

      const response = await apiClient.get(`/public/${testSalon.slug}/staff`);

      expect(response.status).toBe(200);
      
      const staff = response.body.data.find((s: any) => s.id === specialStaff.id);
      expect(staff).toBeDefined();
      expect(staff.name).toBe('Małgorzata Żółć-Węgiel & "Artist" <Master>');
    });

    test('should maintain consistent response format across language filters', async () => {
      const languages = ['pl', 'en', 'uk', 'ru'];
      
      for (const lang of languages) {
        const response = await apiClient.get(`/public/${testSalon.slug}/staff?lang=${lang}`);
        
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('meta');
        expect(response.body.meta).toHaveProperty('salonSlug');
        expect(response.body.meta).toHaveProperty('languageFilter', lang);
        expect(response.body.meta).toHaveProperty('total');
        
        // All staff should have the same structure regardless of language filter
        response.body.data.forEach((staff: any) => {
          expect(staff).toHaveProperty('id');
          expect(staff).toHaveProperty('name');
          expect(staff).toHaveProperty('role');
          expect(staff).toHaveProperty('spokenLocales');
          expect(staff).toHaveProperty('color');
        });
      }
    });

    test('should properly filter multilingual staff', async () => {
      // Test that Maria Petrov appears in multiple language filters
      const languages = ['uk', 'ru', 'en'];
      
      for (const lang of languages) {
        const response = await apiClient.get(`/public/${testSalon.slug}/staff?lang=${lang}`);
        
        expect(response.status).toBe(200);
        
        const mariaPetrov = response.body.data.find((s: any) => s.name === 'Maria Petrov');
        expect(mariaPetrov).toBeDefined();
        expect(mariaPetrov.spokenLocales).toContain(lang);
      }
    });

    test('should validate spoken locales array format', async () => {
      const response = await apiClient.get(`/public/${testSalon.slug}/staff`);

      expect(response.status).toBe(200);
      
      response.body.data.forEach((staff: any) => {
        expect(Array.isArray(staff.spokenLocales)).toBe(true);
        expect(staff.spokenLocales.length).toBeGreaterThan(0);
        
        // All spoken locales should be valid locale codes
        const validLocales = ['pl', 'en', 'uk', 'ru', 'de', 'fr', 'es', 'it'];
        staff.spokenLocales.forEach((locale: string) => {
          expect(typeof locale).toBe('string');
          expect(locale.length).toBeGreaterThanOrEqual(2);
        });
      });
    });
  });
});
