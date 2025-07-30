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
