/**
 * TP-07 Part 3: Availability E2E Tests
 * 
 * Tests for GET /public/:slug/availability endpoint
 * - Date range filtering and validation
 * - Staff availability with time-off conflicts  
 * - Service duration calculations
 * - Booking buffer time handling
 * - Language-aware availability responses
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../../server';
import { setupTestDatabase, cleanupTestDatabase, createTestSalon, createTestStaff, createTestService, createTestTimeOff, createTestAppointment } from '../helpers/testSetup';
import { addDays, format, addHours, subHours } from 'date-fns';

describe('TP-07 Part 3: Availability E2E Tests', () => {
  let salonId: string;
  let salonSlug: string;
  let staffId: string;
  let serviceId: string;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  beforeEach(async () => {
    // Create test salon with working hours
    const salon = await createTestSalon({
      slug: 'test-salon-availability',
      displayName: 'Test Salon Availability',
      primaryLocale: 'pl',
      supportedLocales: ['pl', 'en', 'uk'],
      workingHours: {
        monday: { open: '09:00', close: '18:00' },
        tuesday: { open: '09:00', close: '18:00' },
        wednesday: { open: '09:00', close: '18:00' },
        thursday: { open: '09:00', close: '18:00' },
        friday: { open: '09:00', close: '18:00' },
        saturday: { open: '10:00', close: '16:00' },
        sunday: { open: null, close: null } // Closed
      }
    });
    salonId = salon.id;
    salonSlug = salon.slug;

    const staff = await createTestStaff({
      salonId,
      name: 'Anna Kowalska',
      role: 'MASTER',
      spokenLocales: ['pl', 'en']
    });
    staffId = staff.id;

    const service = await createTestService({
      salonId,
      code: 'hair_womens_cut',
      baseName: 'Strzyżenie damskie',
      durationMin: 60,
      priceAmount: 35,
      category: 'hair'
    });
    serviceId = service.id;
  });

  afterEach(async () => {
    await cleanupTestDatabase();
  });

  describe('Basic Availability API', () => {
    it('should return available slots for a service', async () => {
      const tomorrow = addDays(new Date(), 1);
      const dateStr = format(tomorrow, 'yyyy-MM-dd');

      const response = await request(app)
        .get(`/public/${salonSlug}/availability`)
        .query({
          serviceCode: 'hair_womens_cut',
          date: dateStr,
          staffId
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          date: dateStr,
          serviceCode: 'hair_womens_cut',
          staffId,
          slots: expect.any(Array)
        }
      });

      expect(response.body.data.slots.length).toBeGreaterThan(0);
      expect(response.body.data.slots[0]).toMatchObject({
        time: expect.any(String),
        available: true,
        durationMin: 60
      });
    });

    it('should return empty slots for Sunday (salon closed)', async () => {
      let nextSunday = addDays(new Date(), 1);
      while (nextSunday.getDay() !== 0) {
        nextSunday = addDays(nextSunday, 1);
      }
      const dateStr = format(nextSunday, 'yyyy-MM-dd');

      const response = await request(app)
        .get(`/public/${salonSlug}/availability`)
        .query({
          serviceCode: 'hair_womens_cut',
          date: dateStr,
          staffId
        })
        .expect(200);

      expect(response.body.data.slots).toHaveLength(0);
    });

    it('should validate required parameters', async () => {
      const tomorrow = addDays(new Date(), 1);
      const dateStr = format(tomorrow, 'yyyy-MM-dd');

      // Missing serviceCode
      await request(app)
        .get(`/public/${salonSlug}/availability`)
        .query({ date: dateStr, staffId })
        .expect(400)
        .expect(res => {
          expect(res.body.error).toContain('serviceCode');
        });

      // Missing date  
      await request(app)
        .get(`/public/${salonSlug}/availability`)
        .query({ serviceCode: 'hair_womens_cut', staffId })
        .expect(400)
        .expect(res => {
          expect(res.body.error).toContain('date');
        });

      // Invalid date format
      await request(app)
        .get(`/public/${salonSlug}/availability`)
        .query({ serviceCode: 'hair_womens_cut', date: 'invalid-date', staffId })
        .expect(400);
    });

    it('should handle non-existent salon slug', async () => {
      const tomorrow = addDays(new Date(), 1);
      const dateStr = format(tomorrow, 'yyyy-MM-dd');

      await request(app)
        .get('/public/non-existent-salon/availability')
        .query({
          serviceCode: 'hair_womens_cut',
          date: dateStr,
          staffId
        })
        .expect(404)
        .expect(res => {
          expect(res.body.error).toContain('Salon not found');
        });
    });
  });

  describe('Staff Time-Off Conflicts', () => {
    it('should exclude slots when staff is on time-off', async () => {
      const tomorrow = addDays(new Date(), 1);
      const dateStr = format(tomorrow, 'yyyy-MM-dd');

      const timeOffStart = new Date(tomorrow);
      timeOffStart.setHours(12, 0, 0, 0);
      const timeOffEnd = new Date(tomorrow);
      timeOffEnd.setHours(15, 0, 0, 0);

      await createTestTimeOff({
        salonId,
        staffId,
        startAt: timeOffStart,
        endAt: timeOffEnd,
        reason: 'Lunch break'
      });

      const response = await request(app)
        .get(`/public/${salonSlug}/availability`)
        .query({
          serviceCode: 'hair_womens_cut',
          date: dateStr,
          staffId
        })
        .expect(200);

      const conflictSlots = response.body.data.slots.filter((slot: any) => {
        const slotTime = slot.time;
        return slotTime >= '12:00' && slotTime < '15:00';
      });

      expect(conflictSlots.every((slot: any) => !slot.available)).toBe(true);
    });

    it('should handle all-day time-off', async () => {
      const tomorrow = addDays(new Date(), 1);
      const dateStr = format(tomorrow, 'yyyy-MM-dd');

      const dayStart = new Date(tomorrow);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(tomorrow);
      dayEnd.setHours(23, 59, 59, 999);

      await createTestTimeOff({
        salonId,
        staffId,
        startAt: dayStart,
        endAt: dayEnd,
        reason: 'Sick day'
      });

      const response = await request(app)
        .get(`/public/${salonSlug}/availability`)
        .query({
          serviceCode: 'hair_womens_cut',
          date: dateStr,
          staffId
        })
        .expect(200);

      expect(response.body.data.slots.every((slot: any) => !slot.available)).toBe(true);
    });
  });

  describe('Service Duration Handling', () => {
    it('should calculate slots based on service duration', async () => {
      const longService = await createTestService({
        salonId,
        code: 'spa_massage_120',
        baseName: 'Massage 2h',
        durationMin: 120,
        priceAmount: 100,
        category: 'spa'
      });

      const tomorrow = addDays(new Date(), 1);
      const dateStr = format(tomorrow, 'yyyy-MM-dd');

      const response = await request(app)
        .get(`/public/${salonSlug}/availability`)
        .query({
          serviceCode: 'spa_massage_120',
          date: dateStr,
          staffId
        })
        .expect(200);

      const slots = response.body.data.slots.filter((slot: any) => slot.available);
      
      const lastSlot = slots[slots.length - 1];
      expect(lastSlot.time <= '16:00').toBe(true);
      expect(slots[0].durationMin).toBe(120);
    });

    it('should handle 15-minute slots for short services', async () => {
      const quickService = await createTestService({
        salonId,
        code: 'brow_shape_15',
        baseName: 'Quick Brow Shape',
        durationMin: 15,
        priceAmount: 10,
        category: 'brows'
      });

      const tomorrow = addDays(new Date(), 1);
      const dateStr = format(tomorrow, 'yyyy-MM-dd');

      const response = await request(app)
        .get(`/public/${salonSlug}/availability`)
        .query({
          serviceCode: 'brow_shape_15',
          date: dateStr,
          staffId
        })
        .expect(200);

      const slots = response.body.data.slots.filter((slot: any) => slot.available);
      expect(slots.length).toBeGreaterThan(20);
      expect(slots[0].durationMin).toBe(15);
    });
  });

  describe('Multi-Language Support', () => {
    it('should return availability in requested language', async () => {
      const tomorrow = addDays(new Date(), 1);
      const dateStr = format(tomorrow, 'yyyy-MM-dd');

      const responseEn = await request(app)
        .get(`/public/${salonSlug}/availability`)
        .query({
          serviceCode: 'hair_womens_cut',
          date: dateStr,
          staffId,
          locale: 'en'
        })
        .expect(200);

      expect(responseEn.body.data.serviceName).toBe('Women\'s Cut');

      const responsePl = await request(app)
        .get(`/public/${salonSlug}/availability`)
        .query({
          serviceCode: 'hair_womens_cut',
          date: dateStr,
          staffId,
          locale: 'pl'
        })
        .expect(200);

      expect(responsePl.body.data.serviceName).toBe('Strzyżenie damskie');
    });

    it('should include staff language compatibility warning', async () => {
      const tomorrow = addDays(new Date(), 1);
      const dateStr = format(tomorrow, 'yyyy-MM-dd');

      const response = await request(app)
        .get(`/public/${salonSlug}/availability`)
        .query({
          serviceCode: 'hair_womens_cut',
          date: dateStr,
          staffId,
          locale: 'uk'
        })
        .expect(200);

      expect(response.body.data.languageWarning).toBe(true);
      expect(response.body.data.staffSpokenLocales).toEqual(['pl', 'en']);
    });
  });

  describe('Date Range and Filtering', () => {
    it('should respect salon business hours for different weekdays', async () => {
      let nextSaturday = addDays(new Date(), 1);
      while (nextSaturday.getDay() !== 6) {
        nextSaturday = addDays(nextSaturday, 1);
      }
      const saturdayStr = format(nextSaturday, 'yyyy-MM-dd');

      const response = await request(app)
        .get(`/public/${salonSlug}/availability`)
        .query({
          serviceCode: 'hair_womens_cut',
          date: saturdayStr,
          staffId
        })
        .expect(200);

      const slots = response.body.data.slots.filter((slot: any) => slot.available);
      
      expect(slots[0].time).toBe('10:00');
      expect(slots[slots.length - 1].time <= '15:00').toBe(true);
    });

    it('should prevent booking in the past', async () => {
      const yesterday = subHours(new Date(), 24);
      const dateStr = format(yesterday, 'yyyy-MM-dd');

      await request(app)
        .get(`/public/${salonSlug}/availability`)
        .query({
          serviceCode: 'hair_womens_cut',
          date: dateStr,
          staffId
        })
        .expect(400)
        .expect(res => {
          expect(res.body.error).toContain('past');
        });
    });

    it('should limit future booking range (e.g., max 30 days)', async () => {
      const farFuture = addDays(new Date(), 35);
      const dateStr = format(farFuture, 'yyyy-MM-dd');

      await request(app)
        .get(`/public/${salonSlug}/availability`)
        .query({
          serviceCode: 'hair_womens_cut',
          date: dateStr,
          staffId
        })
        .expect(400)
        .expect(res => {
          expect(res.body.error).toContain('far future');
        });
    });
  });

  describe('Any Staff Availability', () => {
    let staff2Id: string;

    beforeEach(async () => {
      const staff2 = await createTestStaff({
        salonId,
        name: 'Maria Nowak',
        role: 'MASTER',
        spokenLocales: ['pl', 'uk']
      });
      staff2Id = staff2.id;
    });

    it('should return availability for any staff when staffId not specified', async () => {
      const tomorrow = addDays(new Date(), 1);
      const dateStr = format(tomorrow, 'yyyy-MM-dd');

      const response = await request(app)
        .get(`/public/${salonSlug}/availability`)
        .query({
          serviceCode: 'hair_womens_cut',
          date: dateStr
        })
        .expect(200);

      expect(response.body.data.staffOptions).toHaveLength(2);
      expect(response.body.data.staffOptions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: staffId, name: 'Anna Kowalska' }),
          expect.objectContaining({ id: staff2Id, name: 'Maria Nowak' })
        ])
      );
    });

    it('should prioritize staff by language compatibility', async () => {
      const tomorrow = addDays(new Date(), 1);
      const dateStr = format(tomorrow, 'yyyy-MM-dd');

      const response = await request(app)
        .get(`/public/${salonSlug}/availability`)
        .query({
          serviceCode: 'hair_womens_cut',
          date: dateStr,
          locale: 'uk'
        })
        .expect(200);

      expect(response.body.data.staffOptions[0].id).toBe(staff2Id);
      expect(response.body.data.staffOptions[0].languageMatch).toBe(true);
      expect(response.body.data.staffOptions[1].languageMatch).toBe(false);
    });
  });

  describe('Existing Appointment Conflicts', () => {
    it('should exclude slots with existing appointments', async () => {
      const tomorrow = addDays(new Date(), 1);
      const dateStr = format(tomorrow, 'yyyy-MM-dd');

      const appointmentStart = new Date(tomorrow);
      appointmentStart.setHours(14, 0, 0, 0);
      const appointmentEnd = new Date(tomorrow);
      appointmentEnd.setHours(15, 0, 0, 0);

      await createTestAppointment({
        salonId,
        staffId,
        startAt: appointmentStart,
        endAt: appointmentEnd,
        status: 'CONFIRMED'
      });

      const response = await request(app)
        .get(`/public/${salonSlug}/availability`)
        .query({
          serviceCode: 'hair_womens_cut',
          date: dateStr,
          staffId
        })
        .expect(200);

      const slot14 = response.body.data.slots.find((slot: any) => slot.time === '14:00');
      expect(slot14?.available).toBe(false);
    });

    it('should handle appointment buffer time', async () => {
      const tomorrow = addDays(new Date(), 1);
      const dateStr = format(tomorrow, 'yyyy-MM-dd');

      const appointmentStart = new Date(tomorrow);
      appointmentStart.setHours(14, 0, 0, 0);
      const appointmentEnd = new Date(tomorrow);
      appointmentEnd.setHours(15, 0, 0, 0);

      await createTestAppointment({
        salonId,
        staffId,
        startAt: appointmentStart,
        endAt: appointmentEnd,
        status: 'CONFIRMED'
      });

      const response = await request(app)
        .get(`/public/${salonSlug}/availability`)
        .query({
          serviceCode: 'hair_womens_cut',
          date: dateStr,
          staffId,
          bufferMin: 15
        })
        .expect(200);

      const bufferedSlots = ['13:45', '14:00', '15:00', '15:15'];
      bufferedSlots.forEach(time => {
        const slot = response.body.data.slots.find((s: any) => s.time === time);
        if (slot) {
          expect(slot.available).toBe(false);
        }
      });
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle multiple overlapping time-offs efficiently', async () => {
      const tomorrow = addDays(new Date(), 1);
      const dateStr = format(tomorrow, 'yyyy-MM-dd');

      const timeOff1Start = new Date(tomorrow);
      timeOff1Start.setHours(10, 0, 0, 0);
      const timeOff1End = new Date(tomorrow);
      timeOff1End.setHours(12, 0, 0, 0);

      const timeOff2Start = new Date(tomorrow);
      timeOff2Start.setHours(11, 30, 0, 0);
      const timeOff2End = new Date(tomorrow);
      timeOff2End.setHours(14, 0, 0, 0);

      await createTestTimeOff({
        salonId,
        staffId,
        startAt: timeOff1Start,
        endAt: timeOff1End,
        reason: 'Meeting 1'
      });

      await createTestTimeOff({
        salonId,
        staffId,
        startAt: timeOff2Start,
        endAt: timeOff2End,
        reason: 'Meeting 2'
      });

      const response = await request(app)
        .get(`/public/${salonSlug}/availability`)
        .query({
          serviceCode: 'hair_womens_cut',
          date: dateStr,
          staffId
        })
        .expect(200);

      const blockedSlots = response.body.data.slots.filter((slot: any) => {
        const slotTime = slot.time;
        return slotTime >= '10:00' && slotTime < '14:00';
      });

      expect(blockedSlots.every((slot: any) => !slot.available)).toBe(true);
    });

    it('should return reasonable response time for availability check', async () => {
      const tomorrow = addDays(new Date(), 1);
      const dateStr = format(tomorrow, 'yyyy-MM-dd');

      const startTime = Date.now();

      const response = await request(app)
        .get(`/public/${salonSlug}/availability`)
        .query({
          serviceCode: 'hair_womens_cut',
          date: dateStr,
          staffId
        })
        .expect(200);

      const responseTime = Date.now() - startTime;
      
      expect(responseTime).toBeLessThan(500);
      expect(response.body.data.slots).toBeDefined();
    });

    it('should handle edge case of service longer than working day', async () => {
      const ultraLongService = await createTestService({
        salonId,
        code: 'ultra_long_service',
        baseName: 'Ultra Long Service',
        durationMin: 600, // 10 hours
        priceAmount: 500,
        category: 'special'
      });

      const tomorrow = addDays(new Date(), 1);
      const dateStr = format(tomorrow, 'yyyy-MM-dd');

      const response = await request(app)
        .get(`/public/${salonSlug}/availability`)
        .query({
          serviceCode: 'ultra_long_service',
          date: dateStr,
          staffId
        })
        .expect(200);

      expect(response.body.data.slots.filter((slot: any) => slot.available)).toHaveLength(0);
    });
  });
});
