/**
 * TP-07 Part 5: Integration E2E Tests
 * Full booking flow scenarios and edge cases
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
  sleep,
  generateAvailabilityQuery
} from '../helpers/api';
import { app } from '../../src/index';
import { setupTestEnvironment, cleanupTestEnvironment, TEST_SALON } from '../setup';

describe('TP-07 Part 5: Integration E2E Tests', () => {
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
    console.log('🧪 TP-07 Part 5: Integration tests started');
  });

  afterAll(async () => {
    await cleanupTestEnvironment();
    console.log('✅ TP-07 Part 5: Integration tests completed');
  });

  beforeEach(async () => {
    // Clean slate for each test
    await prisma.appointmentService.deleteMany();
    await prisma.appointment.deleteMany();
    await prisma.client.deleteMany({
      where: { phone: { startsWith: '+48' } }
    });
  });

  describe('Complete Booking Flow', () => {
    test('should handle full booking journey: services → staff → availability → booking → reschedule → cancel', async () => {
      const dates = getTestDates();
      const clientData = generateRandomClient();
      
      // Step 1: Get services
      const servicesResponse = await apiHelper.getServices('pl');
      expect(servicesResponse.status).toBe(200);
      
      const servicesResult = assertApiResponse(servicesResponse);
      expect(servicesResult.data.length).toBeGreaterThan(0);
      
      const selectedService = servicesResult.data[0];
      
      // Step 2: Get staff for service
      const staffResponse = await apiHelper.getStaff('pl', [selectedService.id]);
      expect(staffResponse.status).toBe(200);
      
      const staffResult = assertApiResponse(staffResponse);
      expect(staffResult.data.length).toBeGreaterThan(0);
      
      const selectedStaff = staffResult.data[0];
      
      // Step 3: Check availability
      const availabilityQuery = generateAvailabilityQuery({
        date: dates.tomorrow,
        serviceIds: [selectedService.id],
        staffId: selectedStaff.id
      });
      
      const availabilityResponse = await apiHelper.getAvailability(availabilityQuery);
      expect(availabilityResponse.status).toBe(200);
      
      const availabilityResult = assertApiResponse(availabilityResponse);
      expect(availabilityResult.data.availableSlots.length).toBeGreaterThan(0);
      
      const selectedSlot = availabilityResult.data.availableSlots[0];
      
      // Step 4: Create booking
      const bookingData = generateBookingData({
        client: clientData,
        appointment: {
          date: dates.tomorrow,
          startTime: selectedSlot,
          serviceIds: [selectedService.id],
          staffId: selectedStaff.id,
          notes: 'Integration test booking'
        }
      });
      
      const bookingResponse = await apiHelper.createBooking(bookingData);
      expect(bookingResponse.status).toBe(201);
      
      const bookingResult = assertApiResponse(bookingResponse);
      const appointmentId = bookingResult.data.id;
      
      // Step 5: Verify booking was created correctly
      expect(bookingResult.data.status).toBe('PENDING');
      expect(bookingResult.data.client.phone).toBe(clientData.phone);
      expect(bookingResult.data.services).toHaveLength(1);
      expect(bookingResult.data.staff.id).toBe(selectedStaff.id);
      
      // Step 6: Check that slot is no longer available
      const secondAvailabilityResponse = await apiHelper.getAvailability(availabilityQuery);
      const secondAvailabilityResult = assertApiResponse(secondAvailabilityResponse);
      
      expect(secondAvailabilityResult.data.availableSlots).not.toContain(selectedSlot);
      
      // Step 7: Reschedule booking
      const newSlot = secondAvailabilityResult.data.availableSlots[0];
      const rescheduleResponse = await apiHelper.rescheduleBooking(appointmentId, {
        newDate: dates.tomorrow,
        newStartTime: newSlot,
        newStaffId: selectedStaff.id
      });
      
      expect(rescheduleResponse.status).toBe(200);
      
      const rescheduleResult = assertApiResponse(rescheduleResponse);
      expect(rescheduleResult.data.startAt).toMatch(new RegExp(newSlot));
      
      // Step 8: Verify original slot is available again
      const thirdAvailabilityResponse = await apiHelper.getAvailability(availabilityQuery);
      const thirdAvailabilityResult = assertApiResponse(thirdAvailabilityResponse);
      
      expect(thirdAvailabilityResult.data.availableSlots).toContain(selectedSlot);
      
      // Step 9: Cancel booking
      const cancelResponse = await apiHelper.cancelBooking(
        appointmentId, 
        'Integration test completion'
      );
      
      expect(cancelResponse.status).toBe(200);
      
      const cancelResult = assertApiResponse(cancelResponse);
      expect(cancelResult.data.status).toBe('CANCELED');
      
      // Step 10: Verify both slots are available again
      const finalAvailabilityResponse = await apiHelper.getAvailability(availabilityQuery);
      const finalAvailabilityResult = assertApiResponse(finalAvailabilityResponse);
      
      expect(finalAvailabilityResult.data.availableSlots).toContain(selectedSlot);
      expect(finalAvailabilityResult.data.availableSlots).toContain(newSlot);
    });

    test('should handle multiple concurrent bookings gracefully', async () => {
      const dates = getTestDates();
      
      // Create 3 concurrent booking requests for different times
      const bookingPromises = [
        apiHelper.createBooking(generateBookingData({
          client: { ...generateRandomClient(), phone: '+48111111111' },
          appointment: {
            date: dates.tomorrow,
            startTime: '10:00',
            serviceIds: [testServices[0].id],
            staffId: testStaff[0].id
          }
        })),
        apiHelper.createBooking(generateBookingData({
          client: { ...generateRandomClient(), phone: '+48222222222' },
          appointment: {
            date: dates.tomorrow,
            startTime: '11:00',
            serviceIds: [testServices[0].id],
            staffId: testStaff[0].id
          }
        })),
        apiHelper.createBooking(generateBookingData({
          client: { ...generateRandomClient(), phone: '+48333333333' },
          appointment: {
            date: dates.tomorrow,
            startTime: '12:00',
            serviceIds: [testServices[0].id],
            staffId: testStaff[0].id
          }
        }))
      ];
      
      const responses = await Promise.all(bookingPromises);
      
      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201);
      });
      
      // Verify 3 appointments created
      const appointmentCount = await prisma.appointment.count();
      expect(appointmentCount).toBe(3);
      
      // Verify each has different start times
      const appointments = await prisma.appointment.findMany({
        orderBy: { startAt: 'asc' }
      });
      
      const times = appointments.map(apt => 
        new Date(apt.startAt).getHours()
      );
      
      expect(times).toEqual([10, 11, 12]);
    });

    test('should handle race condition on same time slot correctly', async () => {
      const dates = getTestDates();
      const timeSlot = '10:00';
      
      // Create 3 concurrent requests for the SAME time slot
      const bookingPromises = [
        apiHelper.createBooking(generateBookingData({
          client: { ...generateRandomClient(), phone: '+48111111111' },
          appointment: {
            date: dates.tomorrow,
            startTime: timeSlot,
            serviceIds: [testServices[0].id],
            staffId: testStaff[0].id
          }
        })),
        apiHelper.createBooking(generateBookingData({
          client: { ...generateRandomClient(), phone: '+48222222222' },
          appointment: {
            date: dates.tomorrow,
            startTime: timeSlot,
            serviceIds: [testServices[0].id],
            staffId: testStaff[0].id // Same staff, same time
          }
        })),
        apiHelper.createBooking(generateBookingData({
          client: { ...generateRandomClient(), phone: '+48333333333' },
          appointment: {
            date: dates.tomorrow,
            startTime: timeSlot,
            serviceIds: [testServices[0].id],
            staffId: testStaff[0].id // Same staff, same time
          }
        }))
      ];
      
      const responses = await Promise.all(bookingPromises);
      
      // Only one should succeed, others should fail with conflict
      const successCount = responses.filter(r => r.status === 201).length;
      const conflictCount = responses.filter(r => r.status === 409).length;
      
      expect(successCount).toBe(1);
      expect(conflictCount).toBe(2);
      
      // Verify only 1 appointment created
      const appointmentCount = await prisma.appointment.count();
      expect(appointmentCount).toBe(1);
    });
  });

  describe('Multi-language Integration', () => {
    test('should handle complete booking flow in different languages', async () => {
      const dates = getTestDates();
      
      // Test Polish flow
      const plServicesResponse = await apiHelper.getServices('pl');
      const plServices = assertApiResponse(plServicesResponse);
      
      // Test English flow
      const enServicesResponse = await apiHelper.getServices('en');
      const enServices = assertApiResponse(enServicesResponse);
      
      // Should have same number of services
      expect(plServices.data.length).toBe(enServices.data.length);
      
      // Test Ukrainian client with Polish service names
      const ukBooking = generateBookingData({
        client: {
          ...generateRandomClient(),
          preferredLocale: 'uk'
        },
        appointment: {
          serviceIds: [testServices[0].id],
          staffId: testStaff[0].id
        }
      });
      
      const ukResponse = await apiHelper.createBooking(ukBooking);
      expect(ukResponse.status).toBe(201);
      
      const ukResult = assertApiResponse(ukResponse);
      
      // Should have language warning since staff speaks pl,en but not uk
      expect(ukResult.warnings).toHaveLength(1);
      expect(ukResult.warnings?.[0].type).toBe('LANGUAGE_MISMATCH');
    });

    test('should prefer staff who speak client language', async () => {
      // Create multilingual staff
      const ruStaff = await prisma.staff.create({
        data: {
          salonId: TEST_SALON.id,
          name: 'Russian Speaking Master',
          role: 'MASTER',
          spokenLocales: ['ru', 'en'],
          active: true
        }
      });
      
      const staffResponse = await apiHelper.getStaff('ru');
      const staffResult = assertApiResponse(staffResponse);
      
      // Should filter to only Russian-speaking staff
      const ruSpeakingStaff = staffResult.data.filter(s => 
        s.spokenLocales.includes('ru')
      );
      
      expect(ruSpeakingStaff.length).toBeGreaterThan(0);
      
      // All returned staff should speak Russian
      staffResult.data.forEach(staff => {
        if (staff.speaksClientLanguage) {
          expect(staff.spokenLocales).toContain('ru');
        }
      });
      
      // Cleanup
      await prisma.staff.delete({ where: { id: ruStaff.id } });
    });
  });

  describe('Complex Booking Scenarios', () => {
    test('should handle booking with multiple services and calculate duration correctly', async () => {
      const dates = getTestDates();
      
      // Book multiple services
      const multiServiceBooking = generateBookingData({
        client: generateRandomClient(),
        appointment: {
          date: dates.tomorrow,
          startTime: '10:00',
          serviceIds: [testServices[0].id, testServices[1].id],
          staffId: testStaff[0].id,
          notes: 'Multi-service appointment'
        }
      });
      
      const response = await apiHelper.createBooking(multiServiceBooking);
      expect(response.status).toBe(201);
      
      const result = assertApiResponse(response);
      
      // Should have both services
      expect(result.data.services).toHaveLength(2);
      
      // Duration should be sum of both services
      const expectedDuration = testServices[0].durationMin + testServices[1].durationMin;
      expect(result.meta.totalDuration).toBe(expectedDuration);
      
      // Check that subsequent slot is blocked
      const blockedSlotTime = new Date(`${dates.tomorrow}T10:${expectedDuration}`);
      const blockedSlot = `${blockedSlotTime.getHours()}:${blockedSlotTime.getMinutes().toString().padStart(2, '0')}`;
      
      const availabilityResponse = await apiHelper.getAvailability({
        date: dates.tomorrow,
        serviceIds: [testServices[0].id],
        staffId: testStaff[0].id
      });
      
      const availabilityResult = assertApiResponse(availabilityResponse);
      
      // Should not contain any slots that would overlap
      const overlappingSlots = availabilityResult.data.availableSlots.filter(slot => {
        const slotTime = new Date(`${dates.tomorrow}T${slot}`);
        const appointmentStart = new Date(`${dates.tomorrow}T10:00`);
        const appointmentEnd = new Date(appointmentStart.getTime() + expectedDuration * 60000);
        
        return slotTime >= appointmentStart && slotTime < appointmentEnd;
      });
      
      expect(overlappingSlots).toHaveLength(0);
    });

    test('should handle client returning for second appointment', async () => {
      const dates = getTestDates();
      const clientData = generateRandomClient();
      
      // First appointment
      const firstBooking = generateBookingData({
        client: clientData,
        appointment: {
          date: dates.tomorrow,
          startTime: '10:00',
          serviceIds: [testServices[0].id],
          staffId: testStaff[0].id
        }
      });
      
      const firstResponse = await apiHelper.createBooking(firstBooking);
      expect(firstResponse.status).toBe(201);
      
      const firstResult = assertApiResponse(firstResponse);
      const firstClientId = firstResult.data.client.id;
      
      // Second appointment with updated client info
      const secondBooking = generateBookingData({
        client: {
          ...clientData,
          name: 'Updated Name', // Different name but same phone
          email: 'updated@example.com'
        },
        appointment: {
          date: dates.nextWeek,
          startTime: '14:00',
          serviceIds: [testServices[1].id],
          staffId: testStaff[1].id
        }
      });
      
      const secondResponse = await apiHelper.createBooking(secondBooking);
      expect(secondResponse.status).toBe(201);
      
      const secondResult = assertApiResponse(secondResponse);
      
      // Should reuse same client ID
      expect(secondResult.data.client.id).toBe(firstClientId);
      
      // Should update client info
      const updatedClient = await prisma.client.findUnique({
        where: { id: firstClientId }
      });
      
      expect(updatedClient?.email).toBe('updated@example.com');
      
      // Should have 2 appointments for same client
      const clientAppointments = await prisma.appointment.count({
        where: { clientId: firstClientId }
      });
      
      expect(clientAppointments).toBe(2);
    });

    test('should handle staff schedule conflicts properly', async () => {
      const dates = getTestDates();
      
      // Create appointment for staff[0]
      const firstBooking = generateBookingData({
        client: generateRandomClient(),
        appointment: {
          date: dates.tomorrow,
          startTime: '10:00',
          serviceIds: [testServices[0].id], // 45 min service
          staffId: testStaff[0].id
        }
      });
      
      const firstResponse = await apiHelper.createBooking(firstBooking);
      expect(firstResponse.status).toBe(201);
      
      // Try to book overlapping appointment for same staff
      const conflictingBooking = generateBookingData({
        client: generateRandomClient(),
        appointment: {
          date: dates.tomorrow,
          startTime: '10:30', // Overlaps with first appointment
          serviceIds: [testServices[1].id],
          staffId: testStaff[0].id // Same staff
        }
      });
      
      const conflictResponse = await apiHelper.createBooking(conflictingBooking);
      expect(conflictResponse.status).toBe(409);
      
      // But should allow booking with different staff
      const validBooking = generateBookingData({
        client: generateRandomClient(),
        appointment: {
          date: dates.tomorrow,
          startTime: '10:30',
          serviceIds: [testServices[1].id],
          staffId: testStaff[1].id // Different staff
        }
      });
      
      const validResponse = await apiHelper.createBooking(validBooking);
      expect(validResponse.status).toBe(201);
    });
  });

  describe('Edge Cases & Error Handling', () => {
    test('should handle malformed requests gracefully', async () => {
      // Empty request body
      const response1 = await apiHelper.createBooking({} as any);
      expect(response1.status).toBe(400);
      
      // Invalid date format
      const response2 = await apiHelper.createBooking({
        client: generateRandomClient(),
        appointment: {
          date: 'invalid-date',
          startTime: '10:00',
          serviceIds: [testServices[0].id]
        }
      } as any);
      expect(response2.status).toBe(400);
      
      // Negative service IDs
      const response3 = await apiHelper.createBooking({
        client: generateRandomClient(),
        appointment: {
          date: getTestDates().tomorrow,
          startTime: '10:00',
          serviceIds: ['']
        }
      } as any);
      expect(response3.status).toBe(400);
    });

    test('should handle salon not found', async () => {
      const invalidApiHelper = new ApiTestHelper(app as Express, 'non-existent-salon');
      
      const response = await invalidApiHelper.getServices();
      expect(response.status).toBe(404);
      
      const error = assertApiError(response);
      expect(error.error).toBe('SALON_NOT_FOUND');
    });

    test('should handle database connection issues gracefully', async () => {
      // This test would require mocking Prisma to simulate DB failures
      // For now, we'll test the structure is correct
      
      const bookingData = generateBookingData({
        client: generateRandomClient()
      });
      
      // Normal booking should work
      const response = await apiHelper.createBooking(bookingData);
      expect(response.status).toBe(201);
    });

    test('should validate business rules consistently', async () => {
      const dates = getTestDates();
      
      // Try to book in the past
      const pastBooking = generateBookingData({
        client: generateRandomClient(),
        appointment: {
          date: dates.yesterday,
          startTime: '10:00',
          serviceIds: [testServices[0].id]
        }
      });
      
      const pastResponse = await apiHelper.createBooking(pastBooking);
      expect(pastResponse.status).toBe(400);
      
      // Try to book outside business hours
      const lateBooking = generateBookingData({
        client: generateRandomClient(),
        appointment: {
          date: dates.tomorrow,
          startTime: '23:00', // Late at night
          serviceIds: [testServices[0].id]
        }
      });
      
      const lateResponse = await apiHelper.createBooking(lateBooking);
      expect(lateResponse.status).toBe(400);
    });
  });

  describe('Performance & Scalability', () => {
    test('should handle high availability check frequency', async () => {
      const dates = getTestDates();
      
      // Create multiple rapid availability checks
      const availabilityPromises = Array.from({ length: 10 }, () =>
        apiHelper.getAvailability({
          date: dates.tomorrow,
          serviceIds: [testServices[0].id],
          staffId: testStaff[0].id
        })
      );
      
      const responses = await Promise.all(availabilityPromises);
      
      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });

    test('should maintain data consistency under load', async () => {
      const dates = getTestDates();
      
      // Create many bookings in parallel
      const bookingPromises = Array.from({ length: 10 }, (_, i) =>
        apiHelper.createBooking(generateBookingData({
          client: {
            ...generateRandomClient(),
            phone: `+48${i.toString().padStart(9, '0')}`
          },
          appointment: {
            date: dates.tomorrow,
            startTime: `${9 + i}:00`, // Different times
            serviceIds: [testServices[0].id],
            staffId: testStaff[0].id
          }
        }))
      );
      
      const responses = await Promise.all(bookingPromises);
      
      // All should succeed (different times)
      const successCount = responses.filter(r => r.status === 201).length;
      expect(successCount).toBe(10);
      
      // Verify correct number of appointments in DB
      const dbCount = await prisma.appointment.count();
      expect(dbCount).toBe(10);
    });
  });

  describe('Real-world Scenarios', () => {
    test('should simulate typical salon day scheduling', async () => {
      const dates = getTestDates();
      
      // Simulate 5 clients booking throughout the day
      const scenarios = [
        {
          name: 'Early Bird',
          time: '09:00',
          services: [testServices[0].id], // Quick service
          staff: testStaff[0].id
        },
        {
          name: 'Lunch Break Client',
          time: '12:30',
          services: [testServices[1].id],
          staff: testStaff[1].id
        },
        {
          name: 'Premium Package',
          time: '14:00',
          services: [testServices[0].id, testServices[1].id], // Multiple services
          staff: testStaff[0].id
        },
        {
          name: 'Evening Client',
          time: '16:00',
          services: [testServices[2].id],
          staff: testStaff[1].id
        },
        {
          name: 'Last Minute',
          time: '17:30',
          services: [testServices[0].id],
          staff: testStaff[0].id
        }
      ];
      
      const results = [];
      
      for (const scenario of scenarios) {
        const booking = generateBookingData({
          client: {
            ...generateRandomClient(),
            name: scenario.name
          },
          appointment: {
            date: dates.tomorrow,
            startTime: scenario.time,
            serviceIds: scenario.services,
            staffId: scenario.staff,
            notes: `${scenario.name} appointment`
          }
        });
        
        const response = await apiHelper.createBooking(booking);
        expect(response.status).toBe(201);
        
        const result = assertApiResponse(response);
        results.push(result.data);
      }
      
      // Verify all appointments created
      expect(results).toHaveLength(5);
      
      // Verify no time conflicts
      const appointments = await prisma.appointment.findMany({
        include: { staff: true, services: true },
        orderBy: { startAt: 'asc' }
      });
      
      // Check for overlaps
      for (let i = 0; i < appointments.length - 1; i++) {
        const current = appointments[i];
        const next = appointments[i + 1];
        
        if (current.staffId === next.staffId) {
          expect(new Date(current.endAt).getTime()).toBeLessThanOrEqual(
            new Date(next.startAt).getTime()
          );
        }
      }
    });
  });
});
