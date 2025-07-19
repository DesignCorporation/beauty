/**
 * BookingService - Business logic for appointment booking operations
 * Provides double-booking protection and validation for TP-07 Booking API
 */

import { prisma } from '@dc-beauty/db';
import { BusinessHoursService } from './BusinessHoursService';

export interface CreateBookingRequest {
  salonId: string;
  client: {
    name: string;
    phone: string;
    email?: string;
    preferredLocale?: string;
    alternateLocales?: string[];
  };
  serviceCodes: string[];
  staffId?: string;
  startAt: Date;
  notes?: string;
}

export interface BookingValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestedAlternatives?: string[];
}

export interface BookingResult {
  success: boolean;
  appointment?: any;
  errors?: string[];
  warnings?: string[];
}

export class BookingService {
  /**
   * Create new booking with comprehensive validation and double-booking protection
   */
  static async createBooking(request: CreateBookingRequest): Promise<BookingResult> {
    try {
      // Validate the booking request
      const validation = await this.validateBooking(request);
      if (!validation.isValid) {
        return {
          success: false,
          errors: validation.errors,
          warnings: validation.warnings
        };
      }

      // Get services to calculate duration
      const services = await prisma.service.findMany({
        where: {
          salonId: request.salonId,
          code: { in: request.serviceCodes },
          active: true
        }
      });

      if (services.length !== request.serviceCodes.length) {
        return {
          success: false,
          errors: ['One or more service codes are invalid or inactive']
        };
      }

      const totalDuration = services.reduce((sum, service) => sum + service.durationMin, 0);
      const endAt = new Date(request.startAt.getTime() + totalDuration * 60000);

      // Find or create client
      const client = await this.findOrCreateClient(request.salonId, request.client);

      // Use transaction for double-booking protection
      const appointment = await prisma.$transaction(async (tx) => {
        // Final availability check with lock
        if (request.staffId) {
          const conflictCheck = await tx.appointment.findFirst({
            where: {
              salonId: request.salonId,
              staffId: request.staffId,
              status: { in: ['PENDING', 'CONFIRMED'] },
              OR: [
                {
                  startAt: { lte: request.startAt },
                  endAt: { gt: request.startAt }
                },
                {
                  startAt: { lt: endAt },
                  endAt: { gte: endAt }
                },
                {
                  startAt: { gte: request.startAt },
                  endAt: { lte: endAt }
                }
              ]
            }
          });

          if (conflictCheck) {
            throw new Error('Time slot is no longer available');
          }
        }

        // Create appointment
        return tx.appointment.create({
          data: {
            salonId: request.salonId,
            clientId: client.id,
            staffId: request.staffId,
            startAt: request.startAt,
            endAt,
            notes: request.notes,
            status: 'PENDING',
            services: {
              create: services.map(service => ({
                serviceId: service.id
              }))
            }
          },
          include: {
            client: true,
            staff: true,
            services: {
              include: {
                service: true
              }
            }
          }
        });
      });

      return {
        success: true,
        appointment,
        warnings: validation.warnings
      };

    } catch (error) {
      console.error('Error creating booking:', error);
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Failed to create booking']
      };
    }
  }

  /**
   * Cancel existing booking
   */
  static async cancelBooking(
    salonId: string,
    appointmentId: string,
    clientPhone: string,
    reason?: string
  ): Promise<BookingResult> {
    try {
      // Verify client ownership
      const appointment = await prisma.appointment.findFirst({
        where: {
          id: appointmentId,
          salonId,
          client: {
            phone: clientPhone
          },
          status: { in: ['PENDING', 'CONFIRMED'] }
        },
        include: {
          client: true,
          staff: true,
          services: {
            include: {
              service: true
            }
          }
        }
      });

      if (!appointment) {
        return {
          success: false,
          errors: ['Appointment not found or cannot be cancelled']
        };
      }

      // Check if cancellation is allowed (e.g., not too close to appointment time)
      const now = new Date();
      const appointmentTime = new Date(appointment.startAt);
      const hoursUntilAppointment = (appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      const warnings: string[] = [];
      if (hoursUntilAppointment < 24) {
        warnings.push('Cancellation within 24 hours may incur fees');
      }

      // Update appointment status
      const cancelledAppointment = await prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          status: 'CANCELED',
          notes: appointment.notes ? 
            `${appointment.notes}\n\nCancelled: ${reason || 'Client cancellation'}` :
            `Cancelled: ${reason || 'Client cancellation'}`
        },
        include: {
          client: true,
          staff: true,
          services: {
            include: {
              service: true
            }
          }
        }
      });

      return {
        success: true,
        appointment: cancelledAppointment,
        warnings
      };

    } catch (error) {
      console.error('Error cancelling booking:', error);
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Failed to cancel booking']
      };
    }
  }

  /**
   * Reschedule existing booking
   */
  static async rescheduleBooking(
    salonId: string,
    appointmentId: string,
    clientPhone: string,
    newStartAt: Date,
    newStaffId?: string
  ): Promise<BookingResult> {
    try {
      // Verify client ownership and get current appointment
      const appointment = await prisma.appointment.findFirst({
        where: {
          id: appointmentId,
          salonId,
          client: {
            phone: clientPhone
          },
          status: { in: ['PENDING', 'CONFIRMED'] }
        },
        include: {
          services: {
            include: {
              service: true
            }
          }
        }
      });

      if (!appointment) {
        return {
          success: false,
          errors: ['Appointment not found or cannot be rescheduled']
        };
      }

      // Calculate total duration
      const totalDuration = appointment.services.reduce(
        (sum, as) => sum + as.service.durationMin, 
        0
      );
      const newEndAt = new Date(newStartAt.getTime() + totalDuration * 60000);

      // Validate new time slot
      const validation = await this.validateTimeSlot(
        salonId,
        newStartAt,
        newEndAt,
        newStaffId || appointment.staffId
      );

      if (!validation.isValid) {
        return {
          success: false,
          errors: validation.errors,
          warnings: validation.warnings
        };
      }

      // Use transaction for rescheduling
      const updatedAppointment = await prisma.$transaction(async (tx) => {
        // Double-check availability (excluding current appointment)
        if (newStaffId || appointment.staffId) {
          const staffId = newStaffId || appointment.staffId;
          const conflictCheck = await tx.appointment.findFirst({
            where: {
              id: { not: appointmentId },
              salonId,
              staffId,
              status: { in: ['PENDING', 'CONFIRMED'] },
              OR: [
                {
                  startAt: { lte: newStartAt },
                  endAt: { gt: newStartAt }
                },
                {
                  startAt: { lt: newEndAt },
                  endAt: { gte: newEndAt }
                },
                {
                  startAt: { gte: newStartAt },
                  endAt: { lte: newEndAt }
                }
              ]
            }
          });

          if (conflictCheck) {
            throw new Error('New time slot is no longer available');
          }
        }

        // Update appointment
        return tx.appointment.update({
          where: { id: appointmentId },
          data: {
            startAt: newStartAt,
            endAt: newEndAt,
            staffId: newStaffId || appointment.staffId,
            notes: appointment.notes ? 
              `${appointment.notes}\n\nRescheduled to ${newStartAt.toISOString()}` :
              `Rescheduled to ${newStartAt.toISOString()}`
          },
          include: {
            client: true,
            staff: true,
            services: {
              include: {
                service: true
              }
            }
          }
        });
      });

      return {
        success: true,
        appointment: updatedAppointment,
        warnings: validation.warnings
      };

    } catch (error) {
      console.error('Error rescheduling booking:', error);
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Failed to reschedule booking']
      };
    }
  }

  /**
   * Validate booking request
   */
  static async validateBooking(request: CreateBookingRequest): Promise<BookingValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation
    if (!request.client.name?.trim()) {
      errors.push('Client name is required');
    }

    if (!request.client.phone?.trim()) {
      errors.push('Client phone is required');
    }

    if (!request.serviceCodes?.length) {
      errors.push('At least one service must be selected');
    }

    if (!request.startAt || isNaN(request.startAt.getTime())) {
      errors.push('Valid start time is required');
    }

    // Check if appointment is in the past
    if (request.startAt <= new Date()) {
      errors.push('Appointment cannot be scheduled in the past');
    }

    // Validate services exist
    const services = await prisma.service.findMany({
      where: {
        salonId: request.salonId,
        code: { in: request.serviceCodes },
        active: true
      }
    });

    if (services.length !== request.serviceCodes.length) {
      errors.push('One or more selected services are not available');
    }

    // Calculate duration and end time
    const totalDuration = services.reduce((sum, service) => sum + service.durationMin, 0);
    const endAt = new Date(request.startAt.getTime() + totalDuration * 60000);

    // Check business hours
    const isOpen = await BusinessHoursService.isOpenDuring(
      request.salonId,
      request.startAt,
      endAt
    );

    if (!isOpen) {
      errors.push('Salon is closed during requested time');
    }

    // Check staff availability if specified
    if (request.staffId) {
      const isStaffAvailable = await BusinessHoursService.isStaffAvailable(
        request.staffId,
        request.startAt,
        endAt
      );

      if (!isStaffAvailable) {
        errors.push('Selected staff member is not available at requested time');
      }

      // Check language compatibility
      const staff = await prisma.staff.findUnique({
        where: { id: request.staffId },
        select: { spokenLocales: true }
      });

      if (staff && request.client.preferredLocale && 
          !staff.spokenLocales.includes(request.client.preferredLocale)) {
        warnings.push('Selected staff member may not speak client\'s preferred language');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate time slot availability
   */
  static async validateTimeSlot(
    salonId: string,
    startAt: Date,
    endAt: Date,
    staffId?: string
  ): Promise<BookingValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check business hours
    const isOpen = await BusinessHoursService.isOpenDuring(salonId, startAt, endAt);
    if (!isOpen) {
      errors.push('Salon is closed during requested time');
    }

    // Check staff availability if specified
    if (staffId) {
      const isStaffAvailable = await BusinessHoursService.isStaffAvailable(
        staffId,
        startAt,
        endAt
      );

      if (!isStaffAvailable) {
        errors.push('Staff member is not available at requested time');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Find existing client or create new one
   */
  static async findOrCreateClient(salonId: string, clientData: CreateBookingRequest['client']) {
    // Try to find by phone first
    let client = await prisma.client.findFirst({
      where: {
        salonId,
        phone: clientData.phone
      }
    });

    if (!client) {
      // Create new client
      client = await prisma.client.create({
        data: {
          salonId,
          name: clientData.name,
          phone: clientData.phone,
          email: clientData.email,
          preferredLocale: clientData.preferredLocale,
          alternateLocales: clientData.alternateLocales || []
        }
      });
    } else {
      // Update existing client info if provided
      client = await prisma.client.update({
        where: { id: client.id },
        data: {
          name: clientData.name || client.name,
          email: clientData.email || client.email,
          preferredLocale: clientData.preferredLocale || client.preferredLocale,
          alternateLocales: clientData.alternateLocales || client.alternateLocales
        }
      });
    }

    return client;
  }
}

export default BookingService;
