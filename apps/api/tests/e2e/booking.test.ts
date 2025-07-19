/**
 * TP-07 Part 4: Booking E2E Tests
 * Tests for POST /public/:slug/booking (create/cancel/reschedule)
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { 
  ApiTestHelper, 
  generateBookingData, 
  generateRandomClient,
  assertApiResponse,
  assertApiError,
  getTestDates,
  sleep
} from '../helpers/api';
import { app } from '../../src/index';
import { setupTestEnvironment, cleanupTestEnvironment, TEST_SALON } from '../setup';

describe('TP-07 Part 4: Booking API E2E Tests', () => {
  let apiHelper: ApiTestHelper;
  let prisma: PrismaClient;
  let testServices: any[];
  let testStaff: any[];

  beforeAll(async () => {
    const setup = await setupTestEnvironment();
    prisma = setup.prisma;
    testServices = setup.services;
    testStaff = setup.staff;
    
    apiHelper = new ApiTestHelper(app as Express);
    console.log('🧪 TP-07 Part 4: Booking tests started');
  });

  afterAll(async () => {
    await cleanupTestEnvironment();
    console.log('✅ TP-07 Part 4: Booking tests completed');
  });

  beforeEach(async () => {
    // Clean existing appointments before each test
    await prisma.appointmentService.deleteMany();
    await prisma.appointment.deleteMany();
    await prisma.client.deleteMany({
      where: { phone: { startsWith: '+48' } }
    });
  });

  describe('POST /public/:slug/booking', () => {
    test('should create booking successfully with valid data', async () => {
      const bookingData = generateBookingData({
        client: generateRandomClient(),
        appointment: {
          serviceIds: [testServices[0].id],
          staffId: testStaff[0].id
        }
      });

      const response = await apiHelper.createBooking(bookingData);
      
      expect(response.status).toBe(201);
      
      const result = assertApiResponse(response);
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('id');
      expect(result.data).toHaveProperty('status', 'PENDING');
      expect(result.data.client).toHaveProperty('name', bookingData.client.name);
      expect(result.data.services).toHaveLength(1);
      
      // Verify in database
      const appointment = await prisma.appointment.findUnique({
        where: { id: result.data.id },
        include: { client: true, services: true }
      });
      
      expect(appointment).not.toBeNull();
      expect(appointment?.client.phone).toBe(bookingData.client.phone);
    });

    test('should create booking with multiple services', async () => {
      const bookingData = generateBookingData({
        client: generateRandomClient(),
        appointment: {
          serviceIds: [testServices[0].id, testServices[1].id],
          staffId: testStaff[0].id
        }
      });

      const response = await apiHelper.createBooking(bookingData);
      
      expect(response.status).toBe(201);
      
      const result = assertApiResponse(response);
      expect(result.data.services).toHaveLength(2);
      
      // Check total duration calculation
      const expectedDuration = testServices[0].durationMin + testServices[1].durationMin;
      expect(result.meta.totalDuration).toBe(expectedDuration);
    });

    test('should return language warning when staff does not speak client language', async () => {
      const bookingData = generateBookingData({
        client: {
          ...generateRandomClient(),
          preferredLocale: 'uk' // Ukrainian - staff speaks pl,en
        },
        appointment: {
          serviceIds: [testServices[0].id],
          staffId: testStaff[0].id
        }
      });

      const response = await apiHelper.createBooking(bookingData);
      
      expect(response.status).toBe(201);
      
      const result = assertApiResponse(response);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings?.[0].type).toBe('LANGUAGE_MISMATCH');
    });

    test('should reuse existing client with same phone', async () => {
      const clientData = generateRandomClient();
      
      // Create first booking
      const firstBooking = generateBookingData({
        client: clientData,
        appointment: {
          serviceIds: [testServices[0].id],
          startTime: '10:00'
        }
      });
      
      const response1 = await apiHelper.createBooking(firstBooking);
      expect(response1.status).toBe(201);
      
      // Create second booking with same phone but different name
      const secondBooking = generateBookingData({
        client: {
          ...clientData,
          name: 'Different Name'
        },
        appointment: {
          serviceIds: [testServices[1].id],
          startTime: '14:00'
        }
      });
      
      const response2 = await apiHelper.createBooking(secondBooking);
      expect(response2.status).toBe(201);
      
      const result1 = assertApiResponse(response1);
      const result2 = assertApiResponse(response2);
      
      // Should reuse same client
      expect(result1.data.client.id).toBe(result2.data.client.id);
      
      // Verify only one client in database
      const clientCount = await prisma.client.count({
        where: { phone: clientData.phone }
      });
      expect(clientCount).toBe(1);
    });

    test('should prevent double booking for same time slot', async () => {
      const dates = getTestDates();
      const timeSlot = '10:00';
      
      // Create first booking
      const firstBooking = generateBookingData({
        client: generateRandomClient(),
        appointment: {
          date: dates.tomorrow,
          startTime: timeSlot,
          serviceIds: [testServices[0].id],
          staffId: testStaff[0].id
        }
      });
      
      const response1 = await apiHelper.createBooking(firstBooking);
      expect(response1.status).toBe(201);
      
      // Try to create overlapping booking
      const secondBooking = generateBookingData({
        client: generateRandomClient(),
        appointment: {
          date: dates.tomorrow,
          startTime: timeSlot,
          serviceIds: [testServices[0].id],
          staffId: testStaff[0].id // Same staff
        }
      });
      
      const response2 = await apiHelper.createBooking(secondBooking);
      expect(response2.status).toBe(409); // Conflict
      
      const error = assertApiError(response2);
      expect(error.error).toBe('TIME_CONFLICT');
    });

    test('should allow booking with different staff at same time', async () => {
      const dates = getTestDates();
      const timeSlot = '10:00';
      
      // Create first booking with staff[0]
      const firstBooking = generateBookingData({
        client: generateRandomClient(),
        appointment: {
          date: dates.tomorrow,
          startTime: timeSlot,
          serviceIds: [testServices[0].id],
          staffId: testStaff[0].id
        }
      });
      
      const response1 = await apiHelper.createBooking(firstBooking);
      expect(response1.status).toBe(201);
      
      // Create second booking with staff[1] at same time
      const secondBooking = generateBookingData({
        client: generateRandomClient(),
        appointment: {
          date: dates.tomorrow,
          startTime: timeSlot,
          serviceIds: [testServices[0].id],
          staffId: testStaff[1].id // Different staff
        }
      });
      
      const response2 = await apiHelper.createBooking(secondBooking);
      expect(response2.status).toBe(201);
      
      // Both should succeed
      const result1 = assertApiResponse(response1);
      const result2 = assertApiResponse(response2);
      
      expect(result1.data.staff.id).toBe(testStaff[0].id);
      expect(result2.data.staff.id).toBe(testStaff[1].id);
    });

    test('should validate required fields', async () => {
      // Missing client name
      const invalidBooking = {
        client: {
          phone: '+48123456789',
          email: 'test@example.com'
          // name missing
        },
        appointment: {
          date: getTestDates().tomorrow,
          startTime: '10:00',
          serviceIds: [testServices[0].id]
        }
      };

      const response = await apiHelper.createBooking(invalidBooking as any);
      expect(response.status).toBe(400);
      
      const error = assertApiError(response);
      expect(error.error).toBe('VALIDATION_ERROR');
      expect(error.message).toMatch(/name.*required/i);
    });

    test('should validate service IDs exist', async () => {
      const bookingData = generateBookingData({
        client: generateRandomClient(),
        appointment: {
          serviceIds: ['non-existent-service-id']
        }
      });

      const response = await apiHelper.createBooking(bookingData);
      expect(response.status).toBe(400);
      
      const error = assertApiError(response);
      expect(error.error).toBe('VALIDATION_ERROR');
      expect(error.message).toMatch(/service.*invalid/i);
    });

    test('should validate business hours', async () => {
      const bookingData = generateBookingData({
        client: generateRandomClient(),
        appointment: {
          startTime: '22:00', // Outside business hours
          serviceIds: [testServices[0].id]
        }
      });

      const response = await apiHelper.createBooking(bookingData);
      expect(response.status).toBe(400);
      
      const error = assertApiError(response);
      expect(error.error).toBe('VALIDATION_ERROR');
      expect(error.message).toMatch(/business hours/i);
    });
  });

  describe('POST /public/:slug/booking/:id/cancel', () => {
    test('should cancel booking successfully', async () => {
      // Create booking first
      const bookingData = generateBookingData({
        client: generateRandomClient(),
        appointment: {
          serviceIds: [testServices[0].id]
        }
      });

      const createResponse = await apiHelper.createBooking(bookingData);
      expect(createResponse.status).toBe(201);
      
      const booking = assertApiResponse(createResponse);
      
      // Cancel booking
      const cancelResponse = await apiHelper.cancelBooking(
        booking.data.id, 
        'Client requested cancellation'
      );
      
      expect(cancelResponse.status).toBe(200);
      
      const result = assertApiResponse(cancelResponse);
      expect(result.data.status).toBe('CANCELED');
      expect(result.data.cancelReason).toMatch(/client requested/i);
      
      // Verify in database
      const appointment = await prisma.appointment.findUnique({
        where: { id: booking.data.id }
      });
      
      expect(appointment?.status).toBe('CANCELED');
    });

    test('should not cancel non-existent booking', async () => {
      const response = await apiHelper.cancelBooking('non-existent-id');
      
      expect(response.status).toBe(404);
      
      const error = assertApiError(response);
      expect(error.error).toBe('BOOKING_NOT_FOUND');
    });

    test('should not cancel already completed booking', async () => {
      // Create booking
      const bookingData = generateBookingData({
        client: generateRandomClient()
      });

      const createResponse = await apiHelper.createBooking(bookingData);
      const booking = assertApiResponse(createResponse);
      
      // Mark as completed
      await prisma.appointment.update({
        where: { id: booking.data.id },
        data: { status: 'COMPLETED' }
      });
      
      // Try to cancel
      const cancelResponse = await apiHelper.cancelBooking(booking.data.id);
      
      expect(cancelResponse.status).toBe(400);
      
      const error = assertApiError(cancelResponse);
      expect(error.error).toBe('INVALID_STATUS');
    });
  });

  describe('POST /public/:slug/booking/:id/reschedule', () => {
    test('should reschedule booking successfully', async () => {
      const dates = getTestDates();
      
      // Create booking
      const bookingData = generateBookingData({
        client: generateRandomClient(),
        appointment: {
          date: dates.tomorrow,
          startTime: '10:00',
          serviceIds: [testServices[0].id],
          staffId: testStaff[0].id
        }
      });

      const createResponse = await apiHelper.createBooking(bookingData);
      const booking = assertApiResponse(createResponse);
      
      // Reschedule to different time
      const rescheduleData = {
        newDate: dates.nextWeek,
        newStartTime: '14:00',
        newStaffId: testStaff[1].id
      };
      
      const rescheduleResponse = await apiHelper.rescheduleBooking(
        booking.data.id, 
        rescheduleData
      );
      
      expect(rescheduleResponse.status).toBe(200);
      
      const result = assertApiResponse(rescheduleResponse);
      expect(result.data.startAt).toMatch(/14:00/);
      expect(result.data.staff.id).toBe(testStaff[1].id);
      
      // Verify in database
      const appointment = await prisma.appointment.findUnique({
        where: { id: booking.data.id },
        include: { staff: true }
      });
      
      const appointmentDate = new Date(appointment!.startAt).toISOString().split('T')[0];
      expect(appointmentDate).toBe(dates.nextWeek);
      expect(appointment?.staff?.id).toBe(testStaff[1].id);
    });

    test('should not reschedule to conflicting time', async () => {
      const dates = getTestDates();
      
      // Create first booking
      const firstBooking = generateBookingData({
        client: generateRandomClient(),
        appointment: {
          date: dates.tomorrow,
          startTime: '10:00',
          staffId: testStaff[0].id
        }
      });

      const response1 = await apiHelper.createBooking(firstBooking);
      const booking1 = assertApiResponse(response1);
      
      // Create second booking
      const secondBooking = generateBookingData({
        client: generateRandomClient(),
        appointment: {
          date: dates.tomorrow,
          startTime: '14:00',
          staffId: testStaff[0].id
        }
      });

      const response2 = await apiHelper.createBooking(secondBooking);
      const booking2 = assertApiResponse(response2);
      
      // Try to reschedule second booking to conflict with first
      const rescheduleResponse = await apiHelper.rescheduleBooking(
        booking2.data.id,
        {
          newDate: dates.tomorrow,
          newStartTime: '10:00' // Conflicts with booking1
        }
      );
      
      expect(rescheduleResponse.status).toBe(409);
      
      const error = assertApiError(rescheduleResponse);
      expect(error.error).toBe('TIME_CONFLICT');
    });

    test('should validate new booking time is in future', async () => {
      const dates = getTestDates();
      
      // Create booking
      const bookingData = generateBookingData({
        client: generateRandomClient()
      });

      const createResponse = await apiHelper.createBooking(bookingData);
      const booking = assertApiResponse(createResponse);
      
      // Try to reschedule to past date
      const rescheduleResponse = await apiHelper.rescheduleBooking(
        booking.data.id,
        {
          newDate: dates.yesterday,
          newStartTime: '10:00'
        }
      );
      
      expect(rescheduleResponse.status).toBe(400);
      
      const error = assertApiError(rescheduleResponse);
      expect(error.error).toBe('VALIDATION_ERROR');
      expect(error.message).toMatch(/past/i);
    });
  });

  describe('Rate Limiting & Performance', () => {
    test('should handle rapid booking requests gracefully', async () => {
      const promises = Array.from({ length: 5 }, (_, i) => {
        const bookingData = generateBookingData({
          client: {
            ...generateRandomClient(),
            phone: `+4812345678${i}`
          },
          appointment: {
            startTime: `${10 + i}:00`,
            serviceIds: [testServices[0].id]
          }
        });
        
        return apiHelper.createBooking(bookingData);
      });

      const responses = await Promise.all(promises);
      
      // All should succeed (different times/clients)
      responses.forEach(response => {
        expect(response.status).toBe(201);
      });
      
      // Verify all appointments created
      const appointmentCount = await prisma.appointment.count();
      expect(appointmentCount).toBe(5);
    });

    test('should enforce rate limiting on booking endpoint', async () => {
      const maxRequests = 20; // Adjust based on rate limit config
      const responses = await apiHelper.testRateLimit('/booking', maxRequests);
      
      const successCount = responses.filter(r => r.status < 400).length;
      const rateLimitedCount = responses.filter(r => r.status === 429).length;
      
      expect(rateLimitedCount).toBeGreaterThan(0);
      expect(successCount).toBeLessThan(maxRequests);
    });
  });
});
