// TP-02 T8: Public Booking Router with slug-based tenant resolution

import { Router, Request, Response, NextFunction } from 'express';
import { getSalonConfigBySlug } from '../lib/salonConfig';
import { createTenantPrisma } from '../lib/tenantPrisma';

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

    res.json({
      success: true,
      data: staff,
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
 * POST /public/:slug/appointments
 * Create appointment for public booking
 */
router.post('/:slug/appointments', resolveSlugTenant, async (req: Request, res: Response) => {
  try {
    const prisma = createTenantPrisma(req.tenant?.salonId);
    const { 
      client, 
      serviceCode, 
      serviceCodes,
      staffId, 
      date, 
      time,
      notes 
    } = req.body;

    // Validate required fields
    if (!client?.name || !client?.phone || !date || !time) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Missing required fields: client.name, client.phone, date, time'
      });
    }

    if (!serviceCode && !serviceCodes?.length) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'At least one service must be specified'
      });
    }

    // Resolve services by code
    const codes = serviceCodes || [serviceCode];
    const services = await prisma.service.findMany({
      where: {
        code: { in: codes },
        active: true
      }
    });

    if (services.length !== codes.length) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'One or more service codes are invalid'
      });
    }

    // Calculate total duration
    const totalDuration = services.reduce((sum, service) => sum + service.durationMin, 0);
    const startAt = new Date(`${date}T${time}`);
    const endAt = new Date(startAt.getTime() + totalDuration * 60000);

    // Check if staff speaks client's preferred language
    let languageWarning = false;
    if (staffId && client.preferredLocale) {
      const staff = await prisma.staff.findUnique({
        where: { id: staffId },
        select: { spokenLocales: true }
      });
      
      if (staff && !staff.spokenLocales.includes(client.preferredLocale)) {
        languageWarning = true;
      }
    }

    // Find or create client
    let existingClient = null;
    if (client.phone) {
      existingClient = await prisma.client.findFirst({
        where: { phone: client.phone }
      });
    }

    const clientData = existingClient || await prisma.client.create({
      data: {
        name: client.name,
        phone: client.phone,
        email: client.email,
        preferredLocale: client.preferredLocale || req.tenant?.locales?.primary,
        alternateLocales: client.alternateLocales || []
      }
    });

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        clientId: clientData.id,
        staffId,
        startAt,
        endAt,
        notes,
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

    res.status(201).json({
      success: true,
      data: appointment,
      warnings: languageWarning ? [{
        type: 'LANGUAGE_MISMATCH',
        message: 'Selected staff may not speak client\'s preferred language'
      }] : [],
      meta: {
        salonSlug: req.tenant?.salonSlug,
        totalDuration,
        calculatedEndTime: endAt.toISOString()
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
 * GET /public/:slug/availability
 * Check availability for booking
 */
router.get('/:slug/availability', resolveSlugTenant, async (req: Request, res: Response) => {
  try {
    const prisma = createTenantPrisma(req.tenant?.salonId);
    const { serviceCode, date, staffId } = req.query;

    if (!serviceCode || !date) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'serviceCode and date are required'
      });
    }

    // Get service details
    const service = await prisma.service.findFirst({
      where: { 
        code: serviceCode as string,
        active: true
      }
    });

    if (!service) {
      return res.status(404).json({
        error: 'SERVICE_NOT_FOUND',
        message: 'Service not found'
      });
    }

    // Get existing appointments for the date
    const startOfDay = new Date(date as string);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const whereClause: any = {
      startAt: {
        gte: startOfDay,
        lt: endOfDay
      },
      status: {
        in: ['PENDING', 'CONFIRMED']
      }
    };

    if (staffId) {
      whereClause.staffId = staffId;
    }

    const existingAppointments = await prisma.appointment.findMany({
      where: whereClause,
      select: {
        startAt: true,
        endAt: true,
        staffId: true
      },
      orderBy: { startAt: 'asc' }
    });

    // Simple availability calculation (mock for now)
    // In production, this would consider business hours, breaks, etc.
    const availableSlots = [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
      '15:00', '15:30', '16:00', '16:30', '17:00'
    ].filter(time => {
      // Filter out slots that conflict with existing appointments
      const slotStart = new Date(`${date}T${time}`);
      const slotEnd = new Date(slotStart.getTime() + service.durationMin * 60000);
      
      return !existingAppointments.some(apt => {
        const aptStart = new Date(apt.startAt);
        const aptEnd = new Date(apt.endAt);
        
        // Check for overlap
        return (slotStart < aptEnd && slotEnd > aptStart);
      });
    });

    res.json({
      success: true,
      data: {
        date,
        serviceCode,
        serviceDuration: service.durationMin,
        availableSlots,
        existingAppointments: existingAppointments.length
      },
      meta: {
        salonSlug: req.tenant?.salonSlug,
        staffId
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

export default router;
