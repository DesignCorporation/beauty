/**
 * TP-07: Availability Service
 * Calculates available time slots for booking appointments
 */

import { PrismaClient } from '@dc-beauty/db';
import { createTenantPrisma } from '../lib/tenantPrisma';
import { logger } from '@dc-beauty/utils';
import { 
  TimeSlot, 
  WorkingHours, 
  AvailabilityCalculationParams,
  SlotConflict,
  WeekDay 
} from '../types/booking';

export class AvailabilityService {
  private prisma: PrismaClient;
  private bufferMinutes: number;

  constructor(salonId: string, bufferMinutes: number = 15) {
    this.prisma = createTenantPrisma(salonId);
    this.bufferMinutes = parseInt(process.env.BOOKING_BUFFER_MIN || '15', 10);
  }

  /**
   * Get available time slots for specified date and services
   */
  async getAvailableSlots(params: AvailabilityCalculationParams): Promise<TimeSlot[]> {
    const { date, serviceIds, staffId, totalDuration } = params;
    
    try {
      // 1. Get salon working hours for this day
      const workingHours = await this.getSalonWorkingHours(params.salonId, date);
      if (!workingHours) {
        logger.warn('No working hours found for date', { 
          salonId: params.salonId, 
          date: date.toISOString() 
        });
        return [];
      }

      // 2. Get staff availability (if specific staff requested)
      const availableStaff = await this.getAvailableStaff(params.salonId, date, staffId);
      if (availableStaff.length === 0) {
        logger.info('No staff available for date', { 
          salonId: params.salonId, 
          date: date.toISOString(),
          requestedStaffId: staffId 
        });
        return [];
      }

      // 3. Get existing conflicts (appointments + time off)
      const conflicts = await this.getSlotConflicts(params.salonId, date, staffId);

      // 4. Generate potential time slots
      const potentialSlots = this.generateTimeSlots(
        workingHours, 
        totalDuration + this.bufferMinutes, 
        30 // Generate slots every 30 minutes
      );

      // 5. Check each slot for availability
      const checkedSlots = await Promise.all(
        potentialSlots.map(async (slot) => {
          for (const staff of availableStaff) {
            const isAvailable = this.isSlotAvailable(
              slot.startTime,
              slot.endTime,
              staff.id,
              conflicts
            );
            
            if (isAvailable) {
              return {
                ...slot,
                staffId: staff.id,
                staffName: staff.name,
                available: true
              };
            }
          }
          
          // No staff available for this slot
          return {
            ...slot,
            staffId: availableStaff[0]?.id || '',
            staffName: availableStaff[0]?.name || '',
            available: false,
            reason: 'busy'
          };
        })
      );

      return checkedSlots;
    } catch (error) {
      logger.error('Error calculating availability', {
        error: error.message,
        params
      });
      throw new Error('Failed to calculate availability');
    }
  }

  /**
   * Get salon working hours for specific date
   */
  private async getSalonWorkingHours(salonId: string, date: Date): Promise<WorkingHours | null> {
    const dayOfWeek = date.getDay() as WeekDay;
    
    // For now, return default working hours
    // In production, this would query salon_working_hours table
    const defaultHours: Record<WeekDay, WorkingHours | null> = {
      0: null, // Sunday - closed
      1: { start: '09:00', end: '18:00', dayOfWeek: 1 }, // Monday
      2: { start: '09:00', end: '18:00', dayOfWeek: 2 }, // Tuesday
      3: { start: '09:00', end: '18:00', dayOfWeek: 3 }, // Wednesday
      4: { start: '09:00', end: '18:00', dayOfWeek: 4 }, // Thursday
      5: { start: '09:00', end: '18:00', dayOfWeek: 5 }, // Friday
      6: { start: '09:00', end: '16:00', dayOfWeek: 6 }, // Saturday
    };

    return defaultHours[dayOfWeek];
  }

  /**
   * Get available staff for date (considering specific staff request)
   */
  private async getAvailableStaff(salonId: string, date: Date, staffId?: string) {
    const whereClause: any = {
      active: true
    };

    if (staffId) {
      whereClause.id = staffId;
    }

    return await this.prisma.staff.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        spokenLocales: true,
        color: true
      },
      orderBy: { name: 'asc' }
    });
  }

  /**
   * Get all conflicts for the date (appointments + time off)
   */
  private async getSlotConflicts(salonId: string, date: Date, staffId?: string): Promise<SlotConflict[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const whereClause: any = {
      startAt: {
        gte: startOfDay,
        lte: endOfDay
      }
    };

    if (staffId) {
      whereClause.staffId = staffId;
    }

    // Get existing appointments
    const appointments = await this.prisma.appointment.findMany({
      where: {
        ...whereClause,
        status: { in: ['PENDING', 'CONFIRMED'] }
      },
      select: {
        id: true,
        startAt: true,
        endAt: true,
        staffId: true
      }
    });

    // Get time off periods
    const timeOffs = await this.prisma.timeOff.findMany({
      where: whereClause,
      select: {
        id: true,
        startAt: true,
        endAt: true,
        staffId: true
      }
    });

    const conflicts: SlotConflict[] = [
      ...appointments.map(apt => ({
        appointmentId: apt.id,
        startAt: apt.startAt,
        endAt: apt.endAt,
        staffId: apt.staffId || '',
        type: 'APPOINTMENT' as const
      })),
      ...timeOffs.map(timeOff => ({
        appointmentId: timeOff.id,
        startAt: timeOff.startAt,
        endAt: timeOff.endAt,
        staffId: timeOff.staffId || '',
        type: 'TIME_OFF' as const
      }))
    ];

    return conflicts;
  }

  /**
   * Generate potential time slots within working hours
   */
  private generateTimeSlots(
    workingHours: WorkingHours, 
    durationMinutes: number, 
    intervalMinutes: number
  ): Omit<TimeSlot, 'staffId' | 'staffName' | 'available'>[] {
    const slots: Omit<TimeSlot, 'staffId' | 'staffName' | 'available'>[] = [];
    
    const [startHour, startMin] = workingHours.start.split(':').map(Number);
    const [endHour, endMin] = workingHours.end.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    for (let current = startMinutes; current + durationMinutes <= endMinutes; current += intervalMinutes) {
      const startTime = this.minutesToTimeString(current);
      const endTime = this.minutesToTimeString(current + durationMinutes);
      
      slots.push({
        startTime,
        endTime
      });
    }
    
    return slots;
  }

  /**
   * Check if a time slot is available for specific staff
   */
  private isSlotAvailable(
    startTime: string, 
    endTime: string, 
    staffId: string, 
    conflicts: SlotConflict[]
  ): boolean {
    const slotStart = this.timeStringToMinutes(startTime);
    const slotEnd = this.timeStringToMinutes(endTime);

    return !conflicts.some(conflict => {
      if (conflict.staffId !== staffId && conflict.staffId !== null) {
        return false; // Different staff member
      }

      const conflictStart = conflict.startAt.getHours() * 60 + conflict.startAt.getMinutes();
      const conflictEnd = conflict.endAt.getHours() * 60 + conflict.endAt.getMinutes();

      // Check for overlap
      return slotStart < conflictEnd && slotEnd > conflictStart;
    });
  }

  /**
   * Convert minutes since midnight to HH:mm format
   */
  private minutesToTimeString(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  /**
   * Convert HH:mm format to minutes since midnight
   */
  private timeStringToMinutes(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Validate that a slot is still available (called before booking creation)
   */
  async validateSlotAvailability(
    date: Date,
    startTime: string,
    durationMinutes: number,
    staffId: string
  ): Promise<{ available: boolean; reason?: string }> {
    const conflicts = await this.getSlotConflicts(date.toISOString().split('T')[0], date, staffId);
    
    const isAvailable = this.isSlotAvailable(
      startTime,
      this.minutesToTimeString(
        this.timeStringToMinutes(startTime) + durationMinutes
      ),
      staffId,
      conflicts
    );

    return {
      available: isAvailable,
      reason: isAvailable ? undefined : 'SLOT_NO_LONGER_AVAILABLE'
    };
  }
}
