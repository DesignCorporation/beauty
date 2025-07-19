/**
 * BusinessHoursService - Service for handling salon business hours and availability
 * Integrates with TP-07 Booking API for accurate availability calculation
 */

import { prisma } from '@dc-beauty/db';

export interface WeeklyHours {
  monday?: string;
  tuesday?: string;
  wednesday?: string;
  thursday?: string;
  friday?: string;
  saturday?: string;
  sunday?: string;
}

export interface TimeSlot {
  start: string;
  end: string;
}

export interface DaySchedule {
  isOpen: boolean;
  slots: TimeSlot[];
}

export class BusinessHoursService {
  /**
   * Parse weekly hours from salon.hours JSON field
   */
  static parseWeeklyHours(hours: any): WeeklyHours {
    if (!hours || typeof hours !== 'object') {
      return {};
    }

    return {
      monday: hours.monday || hours.mon,
      tuesday: hours.tuesday || hours.tue,
      wednesday: hours.wednesday || hours.wed,
      thursday: hours.thursday || hours.thu,
      friday: hours.friday || hours.fri,
      saturday: hours.saturday || hours.sat,
      sunday: hours.sunday || hours.sun,
    };
  }

  /**
   * Parse day hours string into time slots
   * Supports formats: "09:00-17:00", "09:00-12:00,14:00-18:00", "closed"
   */
  static parseDayHours(dayHours: string | undefined): DaySchedule {
    if (!dayHours || dayHours.toLowerCase() === 'closed') {
      return { isOpen: false, slots: [] };
    }

    const slots: TimeSlot[] = [];
    const ranges = dayHours.split(',').map(s => s.trim());

    for (const range of ranges) {
      const [start, end] = range.split('-').map(s => s.trim());
      if (start && end && this.isValidTime(start) && this.isValidTime(end)) {
        slots.push({ start, end });
      }
    }

    return {
      isOpen: slots.length > 0,
      slots
    };
  }

  /**
   * Check if salon is open on specific date and time
   */
  static async isOpenAt(salonId: string, dateTime: Date): Promise<boolean> {
    const salon = await prisma.salon.findUnique({
      where: { id: salonId },
      select: { hours: true }
    });

    if (!salon?.hours) {
      // Default hours if not configured: Monday-Friday 9-17
      const dayOfWeek = dateTime.getDay();
      return dayOfWeek >= 1 && dayOfWeek <= 5; // Mon-Fri
    }

    const weeklyHours = this.parseWeeklyHours(salon.hours);
    const dayName = this.getDayName(dateTime);
    const dayHours = weeklyHours[dayName as keyof WeeklyHours];
    const schedule = this.parseDayHours(dayHours);

    if (!schedule.isOpen) {
      return false;
    }

    const timeStr = this.formatTime(dateTime);
    return schedule.slots.some(slot => 
      timeStr >= slot.start && timeStr <= slot.end
    );
  }

  /**
   * Check if salon is open during entire time range
   */
  static async isOpenDuring(salonId: string, startTime: Date, endTime: Date): Promise<boolean> {
    // For now, just check start time (same day assumption)
    return this.isOpenAt(salonId, startTime);
  }

  /**
   * Get available time slots for a specific date
   */
  static async getAvailableSlots(
    salonId: string, 
    date: Date, 
    serviceDurationMin: number = 60,
    bufferMin: number = 5
  ): Promise<string[]> {
    const salon = await prisma.salon.findUnique({
      where: { id: salonId },
      select: { hours: true }
    });

    const weeklyHours = this.parseWeeklyHours(salon?.hours);
    const dayName = this.getDayName(date);
    const dayHours = weeklyHours[dayName as keyof WeeklyHours];
    const schedule = this.parseDayHours(dayHours);

    if (!schedule.isOpen) {
      return [];
    }

    const slots: string[] = [];
    const slotInterval = 30; // 30-minute intervals

    for (const timeSlot of schedule.slots) {
      const startMinutes = this.timeToMinutes(timeSlot.start);
      const endMinutes = this.timeToMinutes(timeSlot.end);

      for (let minutes = startMinutes; minutes + serviceDurationMin <= endMinutes; minutes += slotInterval) {
        const slotTime = this.minutesToTime(minutes);
        slots.push(slotTime);
      }
    }

    return slots;
  }

  /**
   * Check if staff member is available at specific time
   */
  static async isStaffAvailable(
    staffId: string,
    startTime: Date,
    endTime: Date
  ): Promise<boolean> {
    // Check for existing appointments
    const conflictingAppointments = await prisma.appointment.findMany({
      where: {
        staffId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        OR: [
          {
            startAt: { lte: startTime },
            endAt: { gt: startTime }
          },
          {
            startAt: { lt: endTime },
            endAt: { gte: endTime }
          },
          {
            startAt: { gte: startTime },
            endAt: { lte: endTime }
          }
        ]
      }
    });

    if (conflictingAppointments.length > 0) {
      return false;
    }

    // Check for time off
    const timeOff = await prisma.timeOff.findMany({
      where: {
        staffId,
        startAt: { lte: startTime },
        endAt: { gte: endTime }
      }
    });

    return timeOff.length === 0;
  }

  /**
   * Get filtered available slots considering existing appointments
   */
  static async getFilteredAvailableSlots(
    salonId: string,
    date: Date,
    serviceDurationMin: number,
    staffId?: string,
    bufferMin: number = 5
  ): Promise<string[]> {
    const availableSlots = await this.getAvailableSlots(salonId, date, serviceDurationMin, bufferMin);
    
    if (!staffId) {
      return availableSlots;
    }

    const filteredSlots: string[] = [];

    for (const slot of availableSlots) {
      const slotStart = new Date(`${date.toISOString().split('T')[0]}T${slot}`);
      const slotEnd = new Date(slotStart.getTime() + serviceDurationMin * 60000);

      const isAvailable = await this.isStaffAvailable(staffId, slotStart, slotEnd);
      if (isAvailable) {
        filteredSlots.push(slot);
      }
    }

    return filteredSlots;
  }

  // Helper methods
  private static getDayName(date: Date): string {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()];
  }

  private static formatTime(date: Date): string {
    return date.toTimeString().slice(0, 5); // HH:MM format
  }

  private static isValidTime(time: string): boolean {
    return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
  }

  private static timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private static minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }
}

export default BusinessHoursService;
