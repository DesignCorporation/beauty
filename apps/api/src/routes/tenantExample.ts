// TP-02 T7: Example API routes demonstrating tenant usage

import { Router, Request, Response } from 'express';
import { requireTenant } from '../middleware/requireTenant';
import { createTenantPrisma } from '../lib/tenantPrisma';

const router = Router();

/**
 * GET /api/v1/clients
 * Returns clients for the current salon only
 */
router.get('/clients', requireTenant, async (req: Request, res: Response) => {
  try {
    const prisma = createTenantPrisma(req.tenant?.salonId);
    
    const clients = await prisma.client.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        appointments: {
          where: {
            startAt: { gte: new Date() }
          },
          orderBy: { startAt: 'asc' },
          take: 3
        }
      }
    });

    res.json({
      success: true,
      data: clients,
      meta: {
        total: clients.length,
        salonId: req.tenant?.salonId
      }
    });
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch clients'
    });
  }
});

/**
 * GET /api/v1/services
 * Returns services for the current salon only
 */
router.get('/services', requireTenant, async (req: Request, res: Response) => {
  try {
    const prisma = createTenantPrisma(req.tenant?.salonId);
    
    const services = await prisma.service.findMany({
      where: { active: true },
      include: {
        translations: {
          where: {
            locale: req.tenant?.locales?.primary || 'pl'
          }
        }
      },
      orderBy: { category: 'asc' }
    });

    res.json({
      success: true,
      data: services,
      meta: {
        total: services.length,
        salonId: req.tenant?.salonId,
        locale: req.tenant?.locales?.primary
      }
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch services'
    });
  }
});

/**
 * POST /api/v1/appointments
 * Creates appointment for the current salon
 * Note: salonId is automatically injected, ignoring any in request body
 */
router.post('/appointments', requireTenant, async (req: Request, res: Response) => {
  try {
    const prisma = createTenantPrisma(req.tenant?.salonId);
    const { clientId, staffId, startAt, endAt, serviceIds, notes } = req.body;

    // Validate required fields
    if (!clientId || !startAt || !endAt || !serviceIds?.length) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Missing required fields: clientId, startAt, endAt, serviceIds'
      });
    }

    // Create appointment with tenant-filtered services
    const appointment = await prisma.appointment.create({
      data: {
        clientId,
        staffId,
        startAt: new Date(startAt),
        endAt: new Date(endAt),
        notes,
        status: 'PENDING',
        // salonId is automatically injected by tenantPrisma
        services: {
          create: serviceIds.map((serviceId: string) => ({
            serviceId
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
      meta: {
        salonId: req.tenant?.salonId
      }
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to create appointment'
    });
  }
});

/**
 * GET /api/v1/appointments
 * Returns appointments for the current salon with filtering
 */
router.get('/appointments', requireTenant, async (req: Request, res: Response) => {
  try {
    const prisma = createTenantPrisma(req.tenant?.salonId);
    const { 
      startDate, 
      endDate, 
      staffId, 
      status = 'PENDING,CONFIRMED',
      limit = '50' 
    } = req.query;

    const filters: any = {};
    
    if (startDate) {
      filters.startAt = { gte: new Date(startDate as string) };
    }
    
    if (endDate) {
      if (filters.startAt) {
        filters.startAt.lte = new Date(endDate as string);
      } else {
        filters.startAt = { lte: new Date(endDate as string) };
      }
    }
    
    if (staffId) {
      filters.staffId = staffId;
    }
    
    if (status) {
      const statusList = (status as string).split(',');
      filters.status = { in: statusList };
    }

    const appointments = await prisma.appointment.findMany({
      where: filters,
      include: {
        client: true,
        staff: true,
        services: {
          include: {
            service: {
              include: {
                translations: {
                  where: {
                    locale: req.tenant?.locales?.primary || 'pl'
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { startAt: 'asc' },
      take: parseInt(limit as string)
    });

    res.json({
      success: true,
      data: appointments,
      meta: {
        total: appointments.length,
        salonId: req.tenant?.salonId,
        filters: {
          startDate,
          endDate,
          staffId,
          status
        }
      }
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch appointments'
    });
  }
});

export default router;
