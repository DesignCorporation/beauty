// TP-07: Enhanced Public Booking API with calendar integration and notifications

import { Router, Request, Response, NextFunction } from 'express';
import { getSalonConfigBySlug } from '../lib/salonConfig';
import { createTenantPrisma } from '../lib/tenantPrisma';
import { BusinessHoursService } from '../services/BusinessHoursService';
import { BookingService } from '../services/BookingService';
import { NotificationService } from '../services/NotificationService';

const router = Router();

/**
 * Middleware that resolves tenant from slug parameter
 * Sets req.tenant for public booking endpoints
 */
const resolveSlugTenant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    
    if (!slug) {
      return res.status(400).json({
        error: 'SLUG_REQUIRED',
        message: 'Salon slug is required'
      });
    }

    const salonConfig = await getSalonConfigBySlug(slug);
    
    if (!salonConfig) {
      return res.status(404).json({
        error: 'SALON_NOT_FOUND',
        message: `Salon with slug '${slug}' not found`
      });
    }

    // Set tenant context for public booking
    req.tenant = {
      salonId: salonConfig.id,
      salonSlug: salonConfig.slug,
      plan: salonConfig.plan,
      locales: {
        primary: salonConfig.primaryLocale,
        supported: salonConfig.supportedLocales
      },
      source: 'slug'
    };

    next();
  } catch (error) {
    console.error('Error resolving slug tenant:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to resolve salon'
    });
  }
};

/**
 * GET /public/:slug/services
 * Get services for public booking with optional locale
 */
router.get('/:slug/services', resolveSlugTenant, async (req: Request, res: Response) => {
  try {
    const prisma = createTenantPrisma(req.tenant?.salonId);
    const locale = req.query.locale as string || req.tenant?.locales?.primary || 'pl';

    const services = await prisma.service.findMany({
      where: { active: true },
      include: {
        translations: {
          where: { locale }
        }
      },
      orderBy: [
        { category: 'asc' },
        { baseName: 'asc' }
      ]
    });

    // Transform services to include localized names
    const localizedServices = services.map(service => {
      const translation = service.translations[0];
      return {
        id: service.id,
        code: service.code,
        name: translation?.name || service.baseName,
        description: translation?.description || service.baseDescription,
        durationMin: service.durationMin,
        price: {
          amount: service.priceAmount,
          currency: service.priceCurrency
        },
        category: service.category
      };
    });

    res.json({
      success: true,
      data: localizedServices,
      meta: {
        salonSlug: req.tenant?.salonSlug,
        locale,
        total: localizedServices.length
      }
    });
  } catch (error) {
    console.error('Error fetching public services:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch services'
    });
  }
});

/**
 * GET /public/:slug/staff
 * Get staff for public booking with language filter
 */
router.get('/:slug/staff', resolveSlugTenant, async (req: Request, res: Response) => {
  try {
    const prisma = createTenantPrisma(req.tenant?.salonId);
    const lang = req.query.lang as string;

    let whereClause: any = { active: true };
    
    // Filter by spoken languages if specified
    if (lang && req.tenant?.locales?.supported.includes(lang)) {
      whereClause.spokenLocales = {
        has: lang
      };
    }

    const staff = await prisma.staff.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        role: true,
        spokenLocales: true,
        color: true
      },
      orderBy: { name: 'asc' }
    });

    // Add language compatibility flag
    const staffWithLanguageInfo = staff.map(member => ({
      ...member,
      speaksClientLang: lang ? member.spokenLocales.includes(lang) : true
    }));

    res.json({
      success: true,
      data: staffWithLanguageInfo,
      meta: {
        salonSlug: req.tenant?.salonSlug,
        languageFilter: lang,
        total: staff.length
      }
    });
  } catch (error) {
    console.error('Error fetching public staff:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch staff'
    });
  }
});

/**
 * GET /public/:slug/availability
 * Enhanced availability check with business hours integration
 */
router.get('/:slug/availability', resolveSlugTenant, async (req: Request, res: Response) => {
  try {
    const { serviceCode, serviceCodes, date, staffId } = req.query;
    const bufferMin = parseInt(process.env.BOOKING_BUFFER_MIN || '5');

    if ((!serviceCode && !serviceCodes) || !date) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'serviceCode (or serviceCodes) and date are required'
      });
    }

    const prisma = createTenantPrisma(req.tenant?.salonId);
    const codes = serviceCodes ? 
      (serviceCodes as string).split(',') : 
      [serviceCode as string];

    // Get services and calculate total duration
    const services = await prisma.service.findMany({
      where: { 
        code: { in: codes },
        active: true
      }
    });

    if (services.length !== codes.length) {
      return res.status(404).json({
        error: 'SERVICE_NOT_FOUND',
        message: 'One or more services not found'
      });
    }

    const totalDuration = services.reduce((sum, service) => sum + service.durationMin, 0);
    const requestDate = new Date(date as string);

    // Get available slots using BusinessHoursService
    let availableSlots: string[];
    
    if (staffId) {
      availableSlots = await BusinessHoursService.getFilteredAvailableSlots(
        req.tenant!.salonId,
        requestDate,
        totalDuration,
        staffId as string,
        bufferMin
      );
    } else {
      availableSlots = await BusinessHoursService.getAvailableSlots(
        req.tenant!.salonId,
        requestDate,
        totalDuration,
        bufferMin
      );
    }

    res.json({
      success: true,
      data: {
        date: date as string,
        serviceCodes: codes,
        totalDuration,
        availableSlots,
        bufferMinutes: bufferMin
      },
      meta: {
        salonSlug: req.tenant?.salonSlug,
        staffId: staffId as string,
        total: availableSlots.length
      }
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to check availability'
    });
  }
});

/**
 * POST /public/:slug/appointments
 * Enhanced appointment creation with BookingService
 */
router.post('/:slug/appointments', resolveSlugTenant, async (req: Request, res: Response) => {
  try {
    const { 
      client, 
      serviceCodes,
      staffId, 
      date, 
      time,
      notes 
    } = req.body;

    // Validate required fields
    if (!client?.name || !client?.phone || !date || !time || !serviceCodes?.length) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Missing required fields: client.name, client.phone, date, time, serviceCodes'
      });
    }

    // Parse date and time
    const startAt = new Date(`${date}T${time}`);

    // Create booking request
    const bookingRequest = {
      salonId: req.tenant!.salonId,
      client: {
        name: client.name,
        phone: client.phone,
        email: client.email,
        preferredLocale: client.preferredLocale || req.tenant?.locales?.primary
      },
      serviceCodes,
      staffId,
      startAt,
      notes
    };

    // Use BookingService for enhanced validation and double-booking protection
    const result = await BookingService.createBooking(bookingRequest);

    if (!result.success) {
      return res.status(400).json({
        error: 'BOOKING_FAILED',
        message: 'Failed to create booking',
        errors: result.errors,
        warnings: result.warnings
      });
    }

    // Get salon info for notifications
    const prisma = createTenantPrisma(req.tenant!.salonId);
    const salon = await prisma.salon.findUnique({
      where: { id: req.tenant!.salonId },
      select: {
        displayName: true,
        phone: true,
        addressStreet: true,
        addressCity: true
      }
    });

    // Send booking confirmation notification
    if (salon && result.appointment) {
      try {
        const notificationData = NotificationService.createNotificationData(
          result.appointment,
          salon
        );
        await NotificationService.sendBookingConfirmation(notificationData);
      } catch (notificationError) {
        console.error('Failed to send booking confirmation:', notificationError);
        // Don't fail the booking if notification fails
      }
    }

    res.status(201).json({
      success: true,
      data: result.appointment,
      warnings: result.warnings || [],
      meta: {
        salonSlug: req.tenant?.salonSlug,
        notificationSent: !!salon
      }
    });
  } catch (error) {
    console.error('Error creating public appointment:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to create appointment'
    });
  }
});

/**
 * DELETE /public/:slug/booking/:id/cancel
 * Cancel existing booking with client verification
 */
router.delete('/:slug/booking/:id/cancel', resolveSlugTenant, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { clientPhone, reason } = req.body;

    if (!clientPhone) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'clientPhone is required for verification'
      });
    }

    // Use BookingService for cancellation
    const result = await BookingService.cancelBooking(
      req.tenant!.salonId,
      id,
      clientPhone,
      reason
    );

    if (!result.success) {
      return res.status(400).json({
        error: 'CANCELLATION_FAILED',
        message: 'Failed to cancel booking',
        errors: result.errors
      });
    }

    // Get salon info for notifications
    const prisma = createTenantPrisma(req.tenant!.salonId);
    const salon = await prisma.salon.findUnique({
      where: { id: req.tenant!.salonId },
      select: {
        displayName: true,
        phone: true,
        addressStreet: true,
        addressCity: true
      }
    });

    // Send cancellation notification
    if (salon && result.appointment) {
      try {
        const notificationData = NotificationService.createNotificationData(
          result.appointment,
          salon
        );
        await NotificationService.sendBookingCancellation(notificationData, reason);
      } catch (notificationError) {
        console.error('Failed to send cancellation notification:', notificationError);
      }
    }

    res.json({
      success: true,
      data: result.appointment,
      warnings: result.warnings || [],
      meta: {
        salonSlug: req.tenant?.salonSlug,
        notificationSent: !!salon
      }
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to cancel booking'
    });
  }
});

/**
 * PUT /public/:slug/booking/:id/reschedule
 * Reschedule existing booking with client verification
 */
router.put('/:slug/booking/:id/reschedule', resolveSlugTenant, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { clientPhone, date, time, staffId } = req.body;

    if (!clientPhone || !date || !time) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'clientPhone, date, and time are required'
      });
    }

    // Parse new date and time
    const newStartAt = new Date(`${date}T${time}`);

    // Get original appointment for notification comparison
    const prisma = createTenantPrisma(req.tenant!.salonId);
    const originalAppointment = await prisma.appointment.findFirst({
      where: {
        id,
        client: { phone: clientPhone }
      },
      select: {
        startAt: true
      }
    });

    if (!originalAppointment) {
      return res.status(404).json({
        error: 'APPOINTMENT_NOT_FOUND',
        message: 'Appointment not found'
      });
    }

    // Use BookingService for rescheduling
    const result = await BookingService.rescheduleBooking(
      req.tenant!.salonId,
      id,
      clientPhone,
      newStartAt,
      staffId
    );

    if (!result.success) {
      return res.status(400).json({
        error: 'RESCHEDULE_FAILED',
        message: 'Failed to reschedule booking',
        errors: result.errors
      });
    }

    // Get salon info for notifications
    const salon = await prisma.salon.findUnique({
      where: { id: req.tenant!.salonId },
      select: {
        displayName: true,
        phone: true,
        addressStreet: true,
        addressCity: true
      }
    });

    // Send reschedule notification
    if (salon && result.appointment) {
      try {
        const notificationData = NotificationService.createNotificationData(
          result.appointment,
          salon
        );
        const oldDate = new Date(originalAppointment.startAt);
        const oldTime = oldDate.toTimeString().slice(0, 5);
        
        await NotificationService.sendBookingReschedule(
          notificationData,
          oldDate,
          oldTime
        );
      } catch (notificationError) {
        console.error('Failed to send reschedule notification:', notificationError);
      }
    }

    res.json({
      success: true,
      data: result.appointment,
      warnings: result.warnings || [],
      meta: {
        salonSlug: req.tenant?.salonSlug,
        notificationSent: !!salon
      }
    });
  } catch (error) {
    console.error('Error rescheduling booking:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to reschedule booking'
    });
  }
});

export default router;
