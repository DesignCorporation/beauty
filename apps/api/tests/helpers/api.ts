/**
 * TP-07: Test Helpers
 * Utility functions for E2E testing
 */

import request from 'supertest';
import { Express } from 'express';
import { TEST_SALON, TEST_CLIENT, TEST_STAFF } from '../setup';

export interface TestApiResponse<T = any> {
  success: boolean;
  data: T;
  meta?: Record<string, any>;
  warnings?: Array<{
    type: string;
    message: string;
    severity: string;
  }>;
}

export interface TestApiError {
  error: string;
  message: string;
  requestId?: string;
  hint?: string;
}

/**
 * Helper to make API requests with proper headers
 */
export class ApiTestHelper {
  private app: Express;
  private baseUrl: string;

  constructor(app: Express, salonSlug: string = TEST_SALON.slug) {
    this.app = app;
    this.baseUrl = `/public/${salonSlug}`;
  }

  /**
   * GET /public/:slug/services
   */
  async getServices(locale?: string) {
    const url = locale ? `${this.baseUrl}/services?locale=${locale}` : `${this.baseUrl}/services`;
    return request(this.app)
      .get(url)
      .expect('Content-Type', /json/);
  }

  /**
   * GET /public/:slug/staff
   */
  async getStaff(locale?: string, serviceIds?: string[]) {
    let url = `${this.baseUrl}/staff`;
    const params = new URLSearchParams();
    
    if (locale) params.append('locale', locale);
    if (serviceIds?.length) params.append('serviceIds', serviceIds.join(','));
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    return request(this.app)
      .get(url)
      .expect('Content-Type', /json/);
  }

  /**
   * GET /public/:slug/availability
   */
  async getAvailability(params: {
    date: string;
    serviceIds: string[];
    staffId?: string;
    duration?: number;
  }) {
    const { date, serviceIds, staffId, duration } = params;
    let url = `${this.baseUrl}/availability?date=${date}&serviceIds=${serviceIds.join(',')}`;
    
    if (staffId) url += `&staffId=${staffId}`;
    if (duration) url += `&duration=${duration}`;

    return request(this.app)
      .get(url)
      .expect('Content-Type', /json/);
  }

  /**
   * POST /public/:slug/booking
   */
  async createBooking(bookingData: {
    client: {
      name: string;
      phone: string;
      email: string;
      preferredLocale?: string;
    };
    appointment: {
      date: string;
      startTime: string;
      serviceIds: string[];
      staffId?: string;
      notes?: string;
    };
  }) {
    return request(this.app)
      .post(`${this.baseUrl}/booking`)
      .send(bookingData)
      .expect('Content-Type', /json/);
  }

  /**
   * POST /public/:slug/booking/:id/cancel
   */
  async cancelBooking(appointmentId: string, reason?: string) {
    return request(this.app)
      .post(`${this.baseUrl}/booking/${appointmentId}/cancel`)
      .send({ reason, cancelledBy: 'client' })
      .expect('Content-Type', /json/);
  }

  /**
   * POST /public/:slug/booking/:id/reschedule
   */
  async rescheduleBooking(appointmentId: string, rescheduleData: {
    newDate: string;
    newStartTime: string;
    newStaffId?: string;
  }) {
    return request(this.app)
      .post(`${this.baseUrl}/booking/${appointmentId}/reschedule`)
      .send(rescheduleData)
      .expect('Content-Type', /json/);
  }

  /**
   * GET /public/:slug/booking/:id
   */
  async getBooking(appointmentId: string) {
    return request(this.app)
      .get(`${this.baseUrl}/booking/${appointmentId}`)
      .expect('Content-Type', /json/);
  }

  /**
   * Test rate limiting
   */
  async testRateLimit(endpoint: string, maxRequests: number) {
    const promises = Array.from({ length: maxRequests + 1 }, () =>
      request(this.app).get(`${this.baseUrl}${endpoint}`)
    );

    return Promise.all(promises);
  }
}

/**
 * Generate test booking data
 */
export function generateBookingData(overrides?: {
  client?: Partial<typeof TEST_CLIENT>;
  appointment?: {
    date?: string;
    startTime?: string;
    serviceIds?: string[];
    staffId?: string;
    notes?: string;
  };
}) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  return {
    client: {
      ...TEST_CLIENT,
      ...overrides?.client
    },
    appointment: {
      date: tomorrowStr,
      startTime: '10:00',
      serviceIds: ['hair_womens_cut'],
      staffId: TEST_STAFF.id,
      notes: 'Test booking',
      ...overrides?.appointment
    }
  };
}

/**
 * Generate availability query
 */
export function generateAvailabilityQuery(overrides?: {
  date?: string;
  serviceIds?: string[];
  staffId?: string;
  duration?: number;
}) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  return {
    date: tomorrowStr,
    serviceIds: ['hair_womens_cut'],
    staffId: TEST_STAFF.id,
    ...overrides
  };
}

/**
 * Wait for a specific time (useful for testing time-dependent features)
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate random test data
 */
export function generateRandomClient() {
  const randomId = Math.random().toString(36).substring(7);
  return {
    name: `Test Client ${randomId}`,
    phone: `+48${Math.floor(Math.random() * 900000000) + 100000000}`,
    email: `test.${randomId}@example.com`,
    preferredLocale: 'pl'
  };
}

/**
 * Assert API response structure
 */
export function assertApiResponse<T>(response: any): TestApiResponse<T> {
  if (!response.body) {
    throw new Error('Response body is missing');
  }

  if (!response.body.success !== undefined) {
    throw new Error('Response missing success field');
  }

  return response.body as TestApiResponse<T>;
}

/**
 * Assert API error response
 */
export function assertApiError(response: any): TestApiError {
  if (!response.body) {
    throw new Error('Response body is missing');
  }

  if (!response.body.error) {
    throw new Error('Response missing error field');
  }

  return response.body as TestApiError;
}

/**
 * Get formatted date strings for testing
 */
export function getTestDates() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);
  
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  return {
    today: today.toISOString().split('T')[0],
    tomorrow: tomorrow.toISOString().split('T')[0],
    nextWeek: nextWeek.toISOString().split('T')[0],
    yesterday: yesterday.toISOString().split('T')[0]
  };
}

/**
 * Mock language headers
 */
export function getMockLanguageHeaders(locale: string) {
  const localeMap: Record<string, string> = {
    'pl': 'pl-PL,pl;q=0.9,en;q=0.8',
    'en': 'en-US,en;q=0.9',
    'ru': 'ru-RU,ru;q=0.9,en;q=0.8',
    'uk': 'uk-UA,uk;q=0.9,en;q=0.8'
  };

  return {
    'Accept-Language': localeMap[locale] || localeMap['en']
  };
}

/**
 * Validate service response structure
 */
export function validateServiceResponse(service: any) {
  const requiredFields = ['id', 'code', 'name', 'durationMin', 'priceAmount', 'priceCurrency'];
  
  for (const field of requiredFields) {
    if (!(field in service)) {
      throw new Error(`Service missing required field: ${field}`);
    }
  }

  if (typeof service.durationMin !== 'number' || service.durationMin <= 0) {
    throw new Error('Invalid durationMin');
  }

  if (typeof service.priceAmount !== 'number' || service.priceAmount <= 0) {
    throw new Error('Invalid priceAmount');
  }
}

/**
 * Validate staff response structure
 */
export function validateStaffResponse(staff: any) {
  const requiredFields = ['id', 'name', 'role', 'spokenLocales', 'speaksClientLanguage'];
  
  for (const field of requiredFields) {
    if (!(field in staff)) {
      throw new Error(`Staff missing required field: ${field}`);
    }
  }

  if (!Array.isArray(staff.spokenLocales)) {
    throw new Error('spokenLocales must be an array');
  }

  if (typeof staff.speaksClientLanguage !== 'boolean') {
    throw new Error('speaksClientLanguage must be boolean');
  }
}
