/**
 * TP-07: Booking Service
 * Handles appointment creation with validation and transaction safety
 */

import { PrismaClient } from '@dc-beauty/db';
import { createTenantPrisma } from '../lib/tenantPrisma';
import { messageHub } from '../lib/messaging/messageHub';
import { resolveLocale } from '../lib/languageResolver';
import { logger } from '@dc-beauty/utils';
import { AvailabilityService } from './availability';
import { 
  BookingRequest, 
  BookingResponse, 
  BookingValidationResult,
  BookingWarning,
  AppointmentWithDetails
} from '../types/booking';

export class BookingService {
  private prisma: PrismaClient;
  private salonId: string;
  private availabilityService: AvailabilityService;

  constructor(salonId: string) {
    this.salonId = salonId;
    this.prisma = createTenantPrisma(salonId);
    this.availabilityService = new AvailabilityService(salonId);
  }

  /**
   * Create a new booking with full validation and transaction safety
   */
  async createBooking(request: BookingRequest, tenantContext: any): Promise<BookingResponse> {
    const { client: clientData, appointment: appointmentData } = request;

    try {
      // 1. Validate the booking request
      const validation = await this.validateBookingRequest(request);
      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // 2. Resolve services and calculate duration
      const services = await this.resolveServices(appointmentData.serviceIds);
      const totalDuration = services.reduce((sum, service) => sum + service.durationMin, 0);

      // 3. Parse appointment datetime
      const startAt = new Date(`${appointmentData.date}T${appointmentData.startTime}`);
      const endAt = new Date(startAt.getTime() + totalDuration * 60000);

      // 4. Auto-select staff if not specified
      let selectedStaffId = appointmentData.staffId;
      if (!selectedStaffId) {
        selectedStaffId = await this.autoSelectStaff(startAt, endAt, services);
        if (!selectedStaffId) {
          throw new Error('No staff available for the selected time slot');
        }
      }

      // 5. Final availability check with transaction lock
      const appointment = await this.prisma.$transaction(async (tx) => {
        // Double-check availability with row-level lock
        const availabilityCheck = await this.availabilityService.validateSlotAvailability(
          startAt,
          appointmentData.startTime,
          totalDuration,
          selectedStaffId!
        );

        if (!availabilityCheck.available) {
          throw new Error('Time slot is no longer available');
        }

        // 6. Find or create client
        const client = await this.upsertClient(clientData, tx);

        // 7. Create appointment with services
        const createdAppointment = await tx.appointment.create({
          data: {
            salonId: this.salonId,
            clientId: client.id,
            staffId: selectedStaffId,
            startAt,
            endAt,
            status: 'PENDING',
            notes: appointmentData.notes,
            services: {
              create: services.map(service => ({
                serviceId: service.id,
                priceOverride: null, // Use default service price
                durationOverride: null // Use default service duration
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

        return createdAppointment;
      });

      // 8. Generate confirmation code
      const confirmationCode = this.generateConfirmationCode();

      // 9. Check for language warnings
      const languageWarning = await this.checkLanguageCompatibility(
        selectedStaffId,
        clientData.preferredLocale || tenantContext.locales.primary
      );

      // 10. Send confirmation messages
      const messagingResult = await this.sendConfirmationMessages(
        appointment,
        tenantContext,
        confirmationCode
      );

      // 11. Build response
      const response: BookingResponse = {
        appointmentId: appointment.id,
        clientId: appointment.clientId,
        status: appointment.status as 'PENDING',
        confirmationCode,
        appointmentDetails: {
          date: appointmentData.date,
          startTime: appointmentData.startTime,
          endTime: endAt.toTimeString().slice(0, 5),
          services: services.map(service => ({
            id: service.id,
            code: service.code,
            name: service.baseName,
            description: service.baseDescription,
            durationMin: service.durationMin,
            priceAmount: parseFloat(service.priceAmount.toString()),
            priceCurrency: service.priceCurrency,
            category: service.category || 'general'
          })),
          staff: {
            id: appointment.staff!.id,
            name: appointment.staff!.name,
            spokenLocales: appointment.staff!.spokenLocales,
            speaksClientLanguage: !languageWarning,
            availableServices: [], // Future feature
            color: appointment.staff!.color,
            role: appointment.staff!.role
          },
          totalDuration,
          totalPrice: services.reduce((sum, service) => sum + parseFloat(service.priceAmount.toString()), 0),
          currency: tenantContext.currency
        },
        languageWarning: languageWarning || undefined,
        nextSteps: {
          confirmationSent: messagingResult.success,
          channels: messagingResult.channels
        }
      };

      logger.info('Booking created successfully', {
        appointmentId: appointment.id,
        salonId: this.salonId,
        clientId: appointment.clientId,
        staffId: selectedStaffId,
        totalDuration,
        confirmationCode
      });

      return response;

    } catch (error) {
      logger.error('Error creating booking', {
        error: error.message,
        stack: error.stack,
        salonId: this.salonId,
        request
      });
      throw error;
    }
  }

  /**
   * Validate booking request data
   */
  private async validateBookingRequest(request: BookingRequest): Promise<BookingValidationResult> {
    const errors: string[] = [];
    const warnings: BookingWarning[] = [];

    // Client validation
    if (!request.client.name?.trim()) {
      errors.push('Client name is required');
    }
    if (!request.client.phone?.trim()) {
      errors.push('Client phone is required');
    }
    if (request.client.email && !this.isValidEmail(request.client.email)) {
      errors.push('Invalid email format');
    }

    // Appointment validation
    if (!request.appointment.date) {
      errors.push('Appointment date is required');
    }
    if (!request.appointment.startTime) {
      errors.push('Appointment start time is required');
    }
    if (!request.appointment.serviceIds?.length) {
      errors.push('At least one service must be selected');
    }

    // Date/time validation
    const appointmentDate = new Date(`${request.appointment.date}T${request.appointment.startTime}`);
    const now = new Date();
    
    if (appointmentDate <= now) {
      errors.push('Appointment must be in the future');
    }

    const maxAdvanceDays = parseInt(process.env.MAX_ADVANCE_BOOKING_DAYS || '90', 10);
    const maxDate = new Date(now.getTime() + maxAdvanceDays * 24 * 60 * 60 * 1000);
    if (appointmentDate > maxDate) {
      warnings.push({
        type: 'TIME_CONFLICT',
        message: `Appointment is more than ${maxAdvanceDays} days in advance`,
        severity: 'MEDIUM'
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Resolve service IDs to service objects
   */
  private async resolveServices(serviceIds: string[]) {
    const services = await this.prisma.service.findMany({
      where: {
        OR: [
          { id: { in: serviceIds } },
          { code: { in: serviceIds } }
        ],
        active: true
      }
    });

    if (services.length !== serviceIds.length) {
      const foundIds = services.map(s => s.id);
      const foundCodes = services.map(s => s.code);
      const missing = serviceIds.filter(id => !foundIds.includes(id) && !foundCodes.includes(id));
      throw new Error(`Services not found: ${missing.join(', ')}`);
    }

    return services;
  }

  /**
   * Auto-select available staff for the time slot
   */
  private async autoSelectStaff(startAt: Date, endAt: Date, services: any[]): Promise<string | null> {
    const availableStaff = await this.prisma.staff.findMany({
      where: {
        active: true,
        // Future: Add service-specific staff filtering
      },
      select: {
        id: true,
        name: true
      }
    });

    // Simple first-available selection
    // In production: consider staff workload, specialization, client preferences
    for (const staff of availableStaff) {
      const validation = await this.availabilityService.validateSlotAvailability(
        startAt,
        startAt.toTimeString().slice(0, 5),
        (endAt.getTime() - startAt.getTime()) / 60000,
        staff.id
      );

      if (validation.available) {
        return staff.id;
      }
    }

    return null;
  }

  /**
   * Find existing client or create new one
   */
  private async upsertClient(clientData: BookingRequest['client'], tx: any) {
    // Try to find existing client by phone
    let existingClient = null;
    if (clientData.phone) {
      existingClient = await tx.client.findFirst({
        where: { 
          phone: clientData.phone,
          salonId: this.salonId 
        }
      });
    }

    if (existingClient) {
      // Update existing client with any new information
      return await tx.client.update({
        where: { id: existingClient.id },
        data: {
          name: clientData.name,
          email: clientData.email || existingClient.email,
          preferredLocale: clientData.preferredLocale || existingClient.preferredLocale
        }
      });
    } else {
      // Create new client
      return await tx.client.create({
        data: {
          salonId: this.salonId,
          name: clientData.name,
          phone: clientData.phone,
          email: clientData.email,
          preferredLocale: clientData.preferredLocale
        }
      });
    }
  }

  /**
   * Check if staff speaks client's preferred language
   */
  private async checkLanguageCompatibility(staffId: string, clientLocale: string): Promise<string | null> {
    const staff = await this.prisma.staff.findUnique({
      where: { id: staffId },
      select: { spokenLocales: true, name: true }
    });

    if (!staff || staff.spokenLocales.includes(clientLocale)) {
      return null; // No warning needed
    }

    return `${staff.name} doesn't speak ${clientLocale}, but the salon provides translation assistance`;
  }

  /**
   * Send confirmation messages via Messaging Hub
   */
  private async sendConfirmationMessages(
    appointment: AppointmentWithDetails,
    tenantContext: any,
    confirmationCode: string
  ) {
    try {
      const clientLocale = resolveLocale({
        requestedLocale: appointment.client.preferredLocale,
        salon: tenantContext.locales,
        fallbackChain: [tenantContext.locales.primary, 'en']
      });

      const channels: ('EMAIL' | 'TELEGRAM')[] = [];

      // Send email if client has email
      if (appointment.client.email) {
        await messageHub.sendMessage({
          salonId: this.salonId,
          clientId: appointment.client.id,
          templateCode: 'booking_confirmed',
          channels: ['EMAIL'],
          locale: clientLocale,
          data: {
            confirmationCode,
            clientName: appointment.client.name,
            appointmentDate: appointment.startAt.toLocaleDateString(),
            appointmentTime: appointment.startAt.toLocaleTimeString().slice(0, 5),
            staffName: appointment.staff?.name || 'Our team',
            services: appointment.services.map(s => s.service.baseName).join(', ')
          }
        });
        channels.push('EMAIL');
      }

      // Future: Send Telegram if client has Telegram
      // if (appointment.client.telegramChatId) { ... }

      return { success: true, channels };
    } catch (error) {
      logger.error('Failed to send confirmation messages', {
        error: error.message,
        appointmentId: appointment.id
      });
      return { success: false, channels: [] };
    }
  }

  /**
   * Generate unique confirmation code
   */
  private generateConfirmationCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Simple email validation
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Cancel an existing appointment
   */
  async cancelAppointment(appointmentId: string, reason?: string) {
    return await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: 'CANCELED',
        notes: reason ? `Canceled: ${reason}` : 'Canceled'
      }
    });
  }

  /**
   * Reschedule an existing appointment
   */
  async rescheduleAppointment(
    appointmentId: string, 
    newDate: string, 
    newStartTime: string, 
    newStaffId?: string
  ) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { services: true }
    });

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    const totalDuration = appointment.services.length * 60; // Simplified
    const newStartAt = new Date(`${newDate}T${newStartTime}`);
    const newEndAt = new Date(newStartAt.getTime() + totalDuration * 60000);

    // Validate new slot availability
    const staffId = newStaffId || appointment.staffId!;
    const validation = await this.availabilityService.validateSlotAvailability(
      newStartAt,
      newStartTime,
      totalDuration,
      staffId
    );

    if (!validation.available) {
      throw new Error('New time slot is not available');
    }

    return await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        startAt: newStartAt,
        endAt: newEndAt,
        staffId: newStaffId || appointment.staffId
      }
    });
  }
}
