/**
 * TP-07: E2E Test Setup
 * Global test configuration and database setup for Vitest
 */

import { beforeAll, afterAll, beforeEach } from 'vitest';
import { createTenantPrisma, prisma } from '../src/lib/tenantPrisma';
import { seedServicesForSalon } from '@dc-beauty/db';
import { logger } from '@dc-beauty/utils';

// Test database configuration
export const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || 
  'postgresql://beauty:beauty@localhost:5432/beauty_test';

// Test salon data
export const TEST_SALON = {
  id: 'test_salon_123',
  nip: '0000000000',
  slug: 'test-salon',
  displayName: 'Test Beauty Salon',
  primaryLocale: 'pl',
  supportedLocales: ['pl', 'en', 'ru', 'uk'],
  publicDefaultLocale: 'pl',
  autoTranslateEnabled: true,
  baseCurrency: 'PLN',
  plan: 'PRO' as const
};

// Test client data
export const TEST_CLIENT = {
  name: 'Anna Testowa',
  phone: '+48123456789',
  email: 'anna.test@example.com',
  preferredLocale: 'pl'
};

// Test staff data
export const TEST_STAFF = {
  id: 'test_staff_123',
  name: 'Maria Kowalska',
  role: 'MASTER' as const,
  spokenLocales: ['pl', 'en'],
  active: true,
  color: '#4F46E5'
};

// Test services data
export const TEST_SERVICES = [
  {
    id: 'test_service_hair_cut',
    code: 'hair_womens_cut',
    baseName: 'Strzyżenie damskie',
    baseDescription: 'Mycie + strzyżenie + stylizacja',
    durationMin: 45,
    priceAmount: 35,
    priceCurrency: 'PLN',
    category: 'hair',
    active: true
  },
  {
    id: 'test_service_manicure',
    code: 'nails_manicure_hybrid',
    baseName: 'Manicure hybrydowy',
    baseDescription: 'Żel-lak',
    durationMin: 60,
    priceAmount: 30,
    priceCurrency: 'PLN',
    category: 'nails',
    active: true
  }
];

/**
 * Setup test database and seed data
 */
export async function setupTestDatabase() {
  try {
    logger.info('Setting up test database...');
    
    // Create test salon
    await prisma.salon.upsert({
      where: { id: TEST_SALON.id },
      update: {},
      create: {
        ...TEST_SALON,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Create test staff
    await prisma.staff.upsert({
      where: { id: TEST_STAFF.id },
      update: {},
      create: {
        ...TEST_STAFF,
        salonId: TEST_SALON.id,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Seed services for test salon
    await seedServicesForSalon({
      salonId: TEST_SALON.id,
      primaryLocale: TEST_SALON.primaryLocale,
      supportedLocales: TEST_SALON.supportedLocales,
      autoTranslateEnabled: TEST_SALON.autoTranslateEnabled,
      baseCurrency: TEST_SALON.baseCurrency
    });

    logger.info('Test database setup completed');
  } catch (error) {
    logger.error('Failed to setup test database:', error);
    throw error;
  }
}

/**
 * Cleanup test data
 */
export async function cleanupTestDatabase() {
  try {
    logger.info('Cleaning up test database...');

    // Delete in reverse order to respect foreign key constraints
    await prisma.appointmentService.deleteMany({
      where: {
        appointment: {
          salonId: TEST_SALON.id
        }
      }
    });

    await prisma.appointment.deleteMany({
      where: { salonId: TEST_SALON.id }
    });

    await prisma.client.deleteMany({
      where: { salonId: TEST_SALON.id }
    });

    await prisma.messageLog.deleteMany({
      where: { salonId: TEST_SALON.id }
    });

    await prisma.serviceTranslation.deleteMany({
      where: { salonId: TEST_SALON.id }
    });

    await prisma.service.deleteMany({
      where: { salonId: TEST_SALON.id }
    });

    await prisma.timeOff.deleteMany({
      where: { salonId: TEST_SALON.id }
    });

    await prisma.staff.deleteMany({
      where: { salonId: TEST_SALON.id }
    });

    await prisma.salonSocialLinks.deleteMany({
      where: { salonId: TEST_SALON.id }
    });

    await prisma.salon.deleteMany({
      where: { id: TEST_SALON.id }
    });

    logger.info('Test database cleanup completed');
  } catch (error) {
    logger.error('Failed to cleanup test database:', error);
    throw error;
  }
}

/**
 * Reset test data between tests
 */
export async function resetTestData() {
  try {
    // Clean up dynamic test data but keep salon/staff/services
    await prisma.appointmentService.deleteMany({
      where: {
        appointment: {
          salonId: TEST_SALON.id
        }
      }
    });

    await prisma.appointment.deleteMany({
      where: { salonId: TEST_SALON.id }
    });

    await prisma.client.deleteMany({
      where: { salonId: TEST_SALON.id }
    });

    await prisma.messageLog.deleteMany({
      where: { salonId: TEST_SALON.id }
    });
  } catch (error) {
    logger.error('Failed to reset test data:', error);
    throw error;
  }
}

/**
 * Create test client
 */
export async function createTestClient(overrides?: Partial<typeof TEST_CLIENT>) {
  const clientData = { ...TEST_CLIENT, ...overrides };
  
  return await prisma.client.create({
    data: {
      ...clientData,
      salonId: TEST_SALON.id,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  });
}

/**
 * Get tenant Prisma for test salon
 */
export function getTestTenantPrisma() {
  return createTenantPrisma(TEST_SALON.id);
}

// Global test hooks
beforeAll(async () => {
  await setupTestDatabase();
});

afterAll(async () => {
  await cleanupTestDatabase();
  await prisma.$disconnect();
});

beforeEach(async () => {
  await resetTestData();
});

// Export everything needed for tests
export {
  prisma,
  createTenantPrisma,
  logger
};
