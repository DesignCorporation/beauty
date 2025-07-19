/**
 * TP-07: Enhanced Public Booking Routes
 * Complete booking API endpoints with language support and transaction safety
 */

import { Router, Request, Response } from 'express';
import { publicTenantMiddleware, getPublicTenant } from '../middleware/publicTenant';
import { resolveLanguage } from '../middleware/resolveLanguage';
import { createTenantPrisma } from '../lib/tenantPrisma';
import { resolveLocale } from '../lib/languageResolver';
import { AvailabilityService } from '../services/booking/availability';
import { BookingService } from '../services/booking/booking';
import { rateLimitMiddleware } from '../lib/rateLimiter';
import { logger } from '@dc-beauty/utils';
import { 
  ServiceResponse, 
  StaffResponse, 
  AvailabilityResponse,
  BookingRequest,
  ApiResponse,
  ApiError
} from '../types/booking';

const router = Router();

// Apply public tenant resolution to all routes
router.use('/:slug', publicTenantMiddleware);

// Apply language resolution after tenant
router.use('/:slug', resolveLanguage);

// Rate limiting for booking endpoints
const bookingRateLimit = rateLimitMiddleware({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 booking attempts per window
  keyGenerator: (req) => `booking:${req.publicTenant?.salonId}:${req.ip}`,
  message: { error: 'TOO_MANY_BOOKING_ATTEMPTS', hint: 'Please wait before trying again' }
});

const availabilityRateLimit = rateLimitMiddleware({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 availability checks per minute
  keyGenerator: (req) => `availability:${req.publicTenant?.salonId}:${req.ip}`
});

/**
 * GET /public/:slug/services?locale=ru
 * Get localized services for public booking
 */
router.get('/:slug/services', async (req: Request, res: Response) => {
  try {
    const tenant = getPublicTenant(req);
    const prisma = createTenantPrisma(tenant.salonId);
    
    // Determine client locale
    const requestedLocale = req.query.locale as string;
    const clientLocale = resolveLocale({
      requestedLocale,
      acceptLanguageHeader: req.headers['accept-language'],
      salon: tenant.locales,
      fallbackChain: [
        tenant.locales.publicDefault,
        tenant.locales.primary,
        'en'
      ]
    });

    // Get services with translations
    const services = await prisma.service.findMany({
      where: { active: true },
      include: {
        translations: {
          where: { locale: clientLocale }
        }
      },
      orderBy: [
        { category: 'asc' },
        { baseName: 'asc' }
      ]
    });

    // Transform to localized response
    const localizedServices: ServiceResponse[] = services.map(service => {
      const translation = service.translations[0];
      return {
        id: service.id,
        code: service.code,
        name: translation?.name || service.baseName,
        description: translation?.description || service.baseDescription,
        durationMin: service.durationMin,
        priceAmount: parseFloat(service.priceAmount.toString()),
        priceCurrency: service.priceCurrency,
        category: service.category || 'general'
      };
    });

    const response: ApiResponse<ServiceResponse[]> = {
      success: true,
      data: localizedServices,
      meta: {
        salonSlug: tenant.salonSlug,
        locale: clientLocale,
        fallbackUsed: !requestedLocale || requestedLocale !== clientLocale,
        total: localizedServices.length,
        currency: tenant.currency
      }
    };

    res.json(response);

  } catch (error) {
    logger.error('Error fetching public services', {
      error: error.message,
      salonId: req.publicTenant?.salonId,
      slug: req.params.slug
    });

    const errorResponse: ApiError = {
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch services',
      requestId: Math.random().toString(36).substring(7)
    };
    res.status(500).json(errorResponse);
  }
});

/**
 * GET /public/:slug/staff?locale=ru&serviceIds=service1,service2
 * Get staff members with language compatibility flags
 */
router.get('/:slug/staff', async (req: Request, res: Response) => {
  try {
    const tenant = getPublicTenant(req);
    const prisma = createTenantPrisma(tenant.salonId);
    
    const requestedLocale = req.query.locale as string;
    const serviceIds = req.query.serviceIds as string;
    
    const clientLocale = resolveLocale({
      requestedLocale,
      acceptLanguageHeader: req.headers['accept-language'],
      salon: tenant.locales,
      fallbackChain: [tenant.locales.primary, 'en']
    });

    // Get active staff
    const staff = await prisma.staff.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        role: true,
        spokenLocales: true,
        color: true
      },
      orderBy: { name: 'asc' }
    });

    // Transform with language compatibility
    const staffWithLanguageInfo: StaffResponse[] = staff.map(member => ({
      id: member.id,
      name: member.name,
      role: member.role,
      spokenLocales: member.spokenLocales,
      speaksClientLanguage: member.spokenLocales.includes(clientLocale),
      availableServices: [], // Future feature: filter by service capabilities
      color: member.color
    }));

    // Generate language warnings
    const languageWarnings = staffWithLanguageInfo
      .filter(s => !s.speaksClientLanguage)
      .map(s => ({
        staffId: s.id,
        message: `${s.name} doesn't speak ${clientLocale}, but translation assistance is available`
      }));

    const response: ApiResponse<StaffResponse[]> = {
      success: true,
      data: staffWithLanguageInfo,
      meta: {
        salonSlug: tenant.salonSlug,
        locale: clientLocale,
        total: staffWithLanguageInfo.length,
        languageWarnings: languageWarnings.length
      },
      warnings: languageWarnings.length > 0 ? [{
        type: 'LANGUAGE_MISMATCH',
        message: `${languageWarnings.length} staff members don't speak ${clientLocale}`,
        severity: 'LOW'
      }] : undefined
    };

    res.json(response);

  } catch (error) {
    logger.error('Error fetching public staff', {
      error: error.message,
      salonId: req.publicTenant?.salonId
    });

    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch staff information'
    });
  }
});

/**
 * GET /public/:slug/availability
 * Check availability for booking with comprehensive slot calculation
 */
router.get('/:slug/availability', availabilityRateLimit, async (req: Request, res: Response) => {
  try {
    const tenant = getPublicTenant(req);
    const { date, serviceIds, staffId, duration } = req.query;

    // Validation
    if (!date || !serviceIds) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'date and serviceIds parameters are required',
        hint: 'Format: ?date=2025-07-20&serviceIds=service1,service2'
      });
    }

    // Parse serviceIds
    const serviceIdArray = (serviceIds as string).split(',').filter(Boolean);
    if (serviceIdArray.length === 0) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'At least one serviceId is required'
      });
    }

    // Get services to calculate total duration
    const prisma = createTenantPrisma(tenant.salonId);
    const services = await prisma.service.findMany({
      where: {
        OR: [
          { id: { in: serviceIdArray } },
          { code: { in: serviceIdArray } }
        ],
        active: true
      }
    });

    if (services.length === 0) {
      return res.status(404).json({
        error: 'SERVICES_NOT_FOUND',
        message: 'No valid services found for the provided IDs'
      });
    }

    const totalDuration = duration ? parseInt(duration as string, 10) : 
      services.reduce((sum, service) => sum + service.durationMin, 0);

    // Calculate availability
    const availabilityService = new AvailabilityService(tenant.salonId);
    const appointmentDate = new Date(date as string);
    
    const slots = await availabilityService.getAvailableSlots({
      salonId: tenant.salonId,
      date: appointmentDate,
      serviceIds: serviceIdArray,
      staffId: staffId as string,
      totalDuration
    });

    // Get working hours for response
    const dayOfWeek = appointmentDate.getDay();
    const workingHours = {
      start: '09:00',
      end: dayOfWeek === 6 ? '16:00' : '18:00', // Saturday shorter hours
      dayOfWeek
    };

    const response: ApiResponse<AvailabilityResponse> = {
      success: true,
      data: {
        date: date as string,
        slots,
        workingHours,
        bufferMinutes: 15,
        serviceIds: serviceIdArray,
        totalDuration
      },
      meta: {
        salonSlug: tenant.salonSlug,
        requestedStaffId: staffId as string,
        availableSlots: slots.filter(s => s.available).length,
        totalSlots: slots.length
      }
    };

    res.json(response);

  } catch (error) {
    logger.error('Error checking availability', {
      error: error.message,
      salonId: req.publicTenant?.salonId,
      query: req.query
    });

    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to check availability'
    });
  }
});

/**
 * POST /public/:slug/booking
 * Create new appointment booking
 */
router.post('/:slug/booking', bookingRateLimit, async (req: Request, res: Response) => {
  try {
    const tenant = getPublicTenant(req);
    const bookingRequest: BookingRequest = req.body;

    // Validation
    if (!bookingRequest.client || !bookingRequest.appointment) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Both client and appointment data are required',
        hint: 'Check the request body structure'
      });
    }

    // Create booking
    const bookingService = new BookingService(tenant.salonId);
    const booking = await bookingService.createBooking(bookingRequest, tenant);

    const response: ApiResponse<typeof booking> = {
      success: true,
      data: booking,
      meta: {
        salonSlug: tenant.salonSlug,
        timestamp: new Date().toISOString()
      }
    };

    logger.info('Public booking created', {
      appointmentId: booking.appointmentId,
      salonId: tenant.salonId,
      clientPhone: bookingRequest.client.phone,
      ip: req.ip
    });

    res.status(201).json(response);

  } catch (error) {
    logger.error('Error creating booking', {
      error: error.message,
      salonId: req.publicTenant?.salonId,
      body: req.body,
      ip: req.ip
    });

    const statusCode = error.message.includes('Validation failed') ? 400 : 
                      error.message.includes('not available') ? 409 : 500;

    res.status(statusCode).json({
      error: statusCode === 400 ? 'VALIDATION_ERROR' : 
             statusCode === 409 ? 'BOOKING_CONFLICT' : 'INTERNAL_ERROR',
      message: error.message,
      requestId: Math.random().toString(36).substring(7)
    });
  }
});

/**
 * POST /public/:slug/booking/:id/cancel
 * Cancel existing appointment
 */
router.post('/:slug/booking/:id/cancel', async (req: Request, res: Response) => {
  try {
    const tenant = getPublicTenant(req);
    const { id: appointmentId } = req.params;
    const { reason, cancelledBy } = req.body;

    const bookingService = new BookingService(tenant.salonId);
    await bookingService.cancelAppointment(appointmentId, reason);

    logger.info('Booking cancelled', {
      appointmentId,
      salonId: tenant.salonId,
      reason,
      cancelledBy,
      ip: req.ip
    });

    res.json({
      success: true,
      newStatus: 'CANCELED',
      refundEligible: false, // Future feature
      cancellationCode: Math.random().toString(36).substring(7).toUpperCase()
    });

  } catch (error) {
    logger.error('Error cancelling booking', {
      error: error.message,
      appointmentId: req.params.id,
      salonId: req.publicTenant?.salonId
    });

    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to cancel appointment'
    });
  }
});

/**
 * POST /public/:slug/booking/:id/reschedule
 * Reschedule existing appointment
 */
router.post('/:slug/booking/:id/reschedule', async (req: Request, res: Response) => {
  try {
    const tenant = getPublicTenant(req);
    const { id: appointmentId } = req.params;
    const { newDate, newStartTime, newStaffId } = req.body;

    if (!newDate || !newStartTime) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'newDate and newStartTime are required'
      });
    }

    const bookingService = new BookingService(tenant.salonId);
    const updatedAppointment = await bookingService.rescheduleAppointment(
      appointmentId,
      newDate,
      newStartTime,
      newStaffId
    );

    logger.info('Booking rescheduled', {
      appointmentId,
      salonId: tenant.salonId,
      newDate,
      newStartTime,
      newStaffId,
      ip: req.ip
    });

    res.json({
      success: true,
      data: {
        appointmentId: updatedAppointment.id,
        newStartAt: updatedAppointment.startAt,
        newEndAt: updatedAppointment.endAt,
        newStaffId: updatedAppointment.staffId
      },
      meta: {
        salonSlug: tenant.salonSlug,
        rescheduleCode: Math.random().toString(36).substring(7).toUpperCase()
      }
    });

  } catch (error) {
    logger.error('Error rescheduling booking', {
      error: error.message,
      appointmentId: req.params.id,
      salonId: req.publicTenant?.salonId,
      body: req.body
    });

    const statusCode = error.message.includes('not available') ? 409 : 500;
    res.status(statusCode).json({
      error: statusCode === 409 ? 'SLOT_NOT_AVAILABLE' : 'INTERNAL_ERROR',
      message: error.message
    });
  }
});

/**
 * GET /public/:slug/booking/:id
 * Get booking details (for confirmation pages, etc.)
 */
router.get('/:slug/booking/:id', async (req: Request, res: Response) => {
  try {
    const tenant = getPublicTenant(req);
    const { id: appointmentId } = req.params;
    const prisma = createTenantPrisma(tenant.salonId);

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            preferredLocale: true
          }
        },
        staff: {
          select: {
            id: true,
            name: true,
            spokenLocales: true,
            color: true
          }
        },
        services: {
          include: {
            service: {
              include: {
                translations: true
              }
            }
          }
        }
      }
    });

    if (!appointment) {
      return res.status(404).json({
        error: 'APPOINTMENT_NOT_FOUND',
        message: 'Appointment not found'
      });
    }

    // Determine locale for service names
    const clientLocale = appointment.client.preferredLocale || tenant.locales.primary;

    // Transform services with localization
    const localizedServices = appointment.services.map(({ service }) => {
      const translation = service.translations.find(t => t.locale === clientLocale);
      return {
        id: service.id,
        code: service.code,
        name: translation?.name || service.baseName,
        description: translation?.description || service.baseDescription,
        durationMin: service.durationMin,
        priceAmount: parseFloat(service.priceAmount.toString()),
        priceCurrency: service.priceCurrency,
        category: service.category
      };
    });

    const response = {
      success: true,
      data: {
        id: appointment.id,
        status: appointment.status,
        startAt: appointment.startAt,
        endAt: appointment.endAt,
        notes: appointment.notes,
        client: appointment.client,
        staff: appointment.staff,
        services: localizedServices,
        totalDuration: localizedServices.reduce((sum, s) => sum + s.durationMin, 0),
        totalPrice: localizedServices.reduce((sum, s) => sum + s.priceAmount, 0)
      },
      meta: {
        salonSlug: tenant.salonSlug,
        locale: clientLocale,
        currency: tenant.currency
      }
    };

    res.json(response);

  } catch (error) {
    logger.error('Error fetching booking details', {
      error: error.message,
      appointmentId: req.params.id,
      salonId: req.publicTenant?.salonId
    });

    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch booking details'
    });
  }
});

export default router;
