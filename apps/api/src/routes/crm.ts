import { Router } from 'express';
import { logger } from '@dc-beauty/utils';
import { tenantPrisma } from '../lib/tenantPrisma';
import { requireTenant } from '../middleware/requireTenant';

const router = Router();

// Apply tenant requirement to all CRM routes
router.use(requireTenant);

// GET /crm/clients - List clients for salon
router.get('/clients', async (req, res) => {
  try {
    const salonId = req.tenant!.salonId;
    const tprisma = tenantPrisma(salonId);
    
    const clients = await tprisma.client.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        preferredLocale: true,
        tags: true,
        firstVisitAt: true,
        lastVisitAt: true,
        createdAt: true
      }
    });

    res.json({ data: clients });
  } catch (error) {
    logger.error('CRM: Failed to fetch clients:', error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

// GET /crm/services - List services for salon
router.get('/services', async (req, res) => {
  try {
    const salonId = req.tenant!.salonId;
    const tprisma = tenantPrisma(salonId);
    
    const services = await tprisma.service.findMany({
      where: { active: true },
      orderBy: { baseName: 'asc' },
      select: {
        id: true,
        code: true,
        baseName: true,
        baseDescription: true,
        durationMin: true,
        priceAmount: true,
        priceCurrency: true,
        category: true,
        active: true
      }
    });

    // Format response to match expected format
    const formattedServices = services.map(service => ({
      id: service.id,
      baseName: service.baseName,
      durationMin: service.durationMin,
      priceAmount: Number(service.priceAmount),
      priceCurrency: service.priceCurrency,
      category: service.category
    }));

    res.json({ data: formattedServices });
  } catch (error) {
    logger.error('CRM: Failed to fetch services:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// GET /crm/staff - List staff for salon
router.get('/staff', async (req, res) => {
  try {
    const salonId = req.tenant!.salonId;
    const tprisma = tenantPrisma(salonId);
    
    const staff = await tprisma.staff.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        role: true,
        active: true,
        spokenLocales: true,
        color: true
      }
    });

    res.json({ data: staff });
  } catch (error) {
    logger.error('CRM: Failed to fetch staff:', error);
    res.status(500).json({ error: 'Failed to fetch staff' });
  }
});

// GET /crm/appointments - List appointments for calendar
router.get('/appointments', async (req, res) => {
  try {
    const salonId = req.tenant!.salonId;
    const tprisma = tenantPrisma(salonId);

    const { date, view = 'day', staffIds, statuses } = req.query;

    if (!date || typeof date !== 'string') {
      return res.status(400).json({ error: 'date query param required' });
    }

    const baseDate = new Date(date);
    let startRange = new Date(baseDate);
    let endRange = new Date(baseDate);

    startRange.setHours(0, 0, 0, 0);

    if (view === 'week') {
      const day = baseDate.getDay();
      const diffToMonday = (day + 6) % 7;
      startRange.setDate(baseDate.getDate() - diffToMonday);
      endRange = new Date(startRange);
      endRange.setDate(startRange.getDate() + 7);
    } else if (view === 'month') {
      startRange = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
      endRange = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 1);
    } else {
      endRange.setDate(baseDate.getDate() + 1);
    }

    const where: any = {
      salonId,
      startAt: {
        gte: startRange,
        lt: endRange
      }
    };

    if (staffIds) {
      const list = (staffIds as string).split(',').filter(Boolean);
      if (list.length > 0) {
        where.staffId = { in: list };
      }
    }

    if (statuses) {
      const list = (statuses as string).split(',').filter(Boolean);
      if (list.length > 0) {
        where.status = { in: list };
      }
    }

    const appointments = await tprisma.appointment.findMany({
      where,
      include: {
        client: { select: { id: true, name: true } },
        staff: { select: { id: true, name: true, color: true } },
        services: {
          include: {
            service: { select: { id: true, baseName: true, priceAmount: true, priceCurrency: true } }
          }
        }
      },
      orderBy: { startAt: 'asc' }
    });

    const result = appointments.map(appt => ({
      id: appt.id,
      clientId: appt.clientId,
      clientName: appt.client.name,
      staffId: appt.staffId ?? '',
      staffName: appt.staff?.name || 'Unassigned',
      staffColor: appt.staff?.color || undefined,
      serviceIds: appt.services.map(s => s.serviceId),
      serviceNames: appt.services.map(s => s.service.baseName),
      startAt: appt.startAt.toISOString(),
      endAt: appt.endAt.toISOString(),
      status: appt.status,
      price: appt.services.reduce((sum, s) => sum + Number(s.service.priceAmount), 0),
      currency: appt.services[0]?.service.priceCurrency || 'PLN',
      notes: appt.notes || undefined
    }));

    res.json({ data: result });
  } catch (error) {
    logger.error('CRM: Failed to fetch appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// POST /crm/appointments - Create new appointment
router.post('/appointments', async (req, res) => {
  try {
    const salonId = req.tenant!.salonId;
    const tprisma = tenantPrisma(salonId);
    
    const { clientId, serviceIds, staffId, startAt, endAt, notes } = req.body;

    if (!clientId || !serviceIds || !Array.isArray(serviceIds) || serviceIds.length === 0 || !staffId || !startAt || !endAt) {
      return res.status(400).json({ 
        error: 'Missing required fields: clientId, serviceIds, staffId, startAt, endAt' 
      });
    }

    // Validate client exists in same salon
    const client = await tprisma.client.findUnique({
      where: { id: clientId }
    });
    
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Validate staff exists in same salon
    const staff = await tprisma.staff.findUnique({
      where: { id: staffId }
    });
    
    if (!staff) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    // Validate services exist in same salon
    const services = await tprisma.service.findMany({
      where: { 
        id: { in: serviceIds },
        active: true
      }
    });
    
    if (services.length !== serviceIds.length) {
      return res.status(400).json({ error: 'One or more services not found or inactive' });
    }

    // Create appointment with services in a transaction
    const result = await tprisma.$transaction(async (tx) => {
      // Create appointment
      const appointment = await tx.appointment.create({
        data: {
          salonId,
          clientId,
          staffId,
          startAt: new Date(startAt),
          endAt: new Date(endAt),
          notes: notes || null,
          status: 'CONFIRMED'
        }
      });

      // Create appointment services
      await tx.appointmentService.createMany({
        data: serviceIds.map((serviceId: string) => ({
          appointmentId: appointment.id,
          serviceId
        }))
      });

      return appointment;
    });

    logger.info('CRM: Created appointment:', { appointmentId: result.id, clientId, staffId });
    res.status(201).json({ 
      success: true, 
      data: result,
      message: 'Appointment created successfully' 
    });

  } catch (error) {
    logger.error('CRM: Failed to create appointment:', error);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});

// GET /crm/appointments/:id - Get appointment details
router.get('/appointments/:id', async (req, res) => {
  try {
    const salonId = req.tenant!.salonId;
    const tprisma = tenantPrisma(salonId);
    const { id } = req.params;

    const appointment = await tprisma.appointment.findUnique({
      where: { id },
      include: {
        client: {
          select: { id: true, name: true, phone: true, email: true }
        },
        staff: {
          select: { id: true, name: true, role: true }
        },
        services: {
          include: {
            service: {
              select: {
                id: true,
                baseName: true,
                durationMin: true,
                priceAmount: true,
                priceCurrency: true
              }
            }
          }
        }
      }
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Format response to match expected format
    const formattedAppointment = {
      id: appointment.id,
      startAt: appointment.startAt.toISOString(),
      endAt: appointment.endAt.toISOString(),
      status: appointment.status,
      notes: appointment.notes,
      clientName: appointment.client.name,
      staffName: appointment.staff?.name || 'Unassigned',
      serviceNames: appointment.services.map(as => as.service.baseName),
      price: appointment.services.reduce((sum, as) => sum + Number(as.service.priceAmount), 0),
      currency: appointment.services[0]?.service.priceCurrency || 'PLN'
    };

    res.json(formattedAppointment);
  } catch (error) {
    logger.error('CRM: Failed to fetch appointment:', error);
    res.status(500).json({ error: 'Failed to fetch appointment' });
  }
});

// PATCH /crm/appointments/:id/status - Update appointment status
router.patch('/appointments/:id/status', async (req, res) => {
  try {
    const salonId = req.tenant!.salonId;
    const tprisma = tenantPrisma(salonId);
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELED'].includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status. Must be one of: PENDING, CONFIRMED, COMPLETED, CANCELED' 
      });
    }

    const appointment = await tprisma.appointment.update({
      where: { id },
      data: { status },
      select: { id: true, status: true }
    });

    logger.info('CRM: Updated appointment status:', { appointmentId: id, status });
    res.json({ 
      success: true, 
      data: appointment,
      message: 'Appointment status updated successfully' 
    });

  } catch (error) {
    logger.error('CRM: Failed to update appointment status:', error);
    res.status(500).json({ error: 'Failed to update appointment status' });
  }
});

export default router;
