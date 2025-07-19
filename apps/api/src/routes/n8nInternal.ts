import { Router } from 'express';
import { tenantPrisma } from '../lib/tenantPrisma';
import { requireTenant } from '../middleware/requireTenant';
import { MessageHub } from '../services/messaging/MessageHub';
import { resolveLocale } from '../services/language/LanguageResolver';

const router = Router();
const messageHub = new MessageHub();

/**
 * n8n Internal API Key validation middleware
 */
const requireInternalApiKey = (req: any, res: any, next: any) => {
  const apiKey = req.header('x-api-key');
  if (apiKey !== process.env.BEAUTY_INTERNAL_API_KEY) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  next();
};

/**
 * Get appointments for reminder workflows (24h, 2h)
 * Used by n8n reminder workflows
 */
router.get('/internal/appointments', requireInternalApiKey, async (req, res) => {
  try {
    const { between, salonId } = req.query;
    
    if (!salonId) {
      return res.status(400).json({ error: 'salonId is required' });
    }

    const tprisma = tenantPrisma(salonId as string);
    let appointments;

    if (between === '24h') {
      // Appointments in next 24±2 hours
      const now = new Date();
      const start = new Date(now.getTime() + 22 * 60 * 60 * 1000); // 22h from now
      const end = new Date(now.getTime() + 26 * 60 * 60 * 1000);   // 26h from now
      
      appointments = await tprisma.appointment.findMany({
        where: {
          startAt: { gte: start, lte: end },
          status: { in: ['PENDING', 'CONFIRMED'] }
        },
        include: {
          client: true,
          staff: true,
          services: {
            include: { service: true }
          }
        }
      });
    } else if (between === '2h') {
      // Appointments in next 2±0.25 hours
      const now = new Date();
      const start = new Date(now.getTime() + 1.75 * 60 * 60 * 1000); // 1h45m from now
      const end = new Date(now.getTime() + 2.25 * 60 * 60 * 1000);   // 2h15m from now
      
      appointments = await tprisma.appointment.findMany({
        where: {
          startAt: { gte: start, lte: end },
          status: { in: ['PENDING', 'CONFIRMED'] }
        },
        include: {
          client: true,
          staff: true,
          services: {
            include: { service: true }
          }
        }
      });
    } else {
      return res.status(400).json({ error: 'Invalid between parameter. Use: 24h or 2h' });
    }

    // Get salon info for locale resolution
    const salon = await tprisma.salon.findFirst();
    
    // Prepare response with language resolution
    const appointmentsWithLocale = appointments.map(apt => {
      const clientLocale = resolveLocale({
        client: { 
          preferredLocale: apt.client.preferredLocale,
          alternateLocales: apt.client.alternateLocales 
        },
        salon: {
          primaryLocale: salon?.primaryLocale || 'pl',
          supportedLocales: salon?.supportedLocales || ['pl'],
          publicDefaultLocale: salon?.publicDefaultLocale
        },
        staff: apt.staff ? {
          spokenLocales: apt.staff.spokenLocales
        } : undefined
      });

      return {
        ...apt,
        recommendedLocale: clientLocale,
        templateData: {
          clientName: apt.client.name,
          staffName: apt.staff?.name || 'team',
          appointmentTime: apt.startAt.toLocaleTimeString('pl-PL', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          appointmentDate: apt.startAt.toLocaleDateString('pl-PL'),
          services: apt.services.map(s => s.service.baseName).join(', '),
          salonName: salon?.displayName || 'Beauty Salon'
        }
      };
    });

    res.json({
      success: true,
      count: appointmentsWithLocale.length,
      appointments: appointmentsWithLocale
    });

  } catch (error) {
    console.error('Internal appointments API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get clients with birthdays today
 * Used by n8n birthday workflow
 */
router.get('/internal/birthdays', requireInternalApiKey, async (req, res) => {
  try {
    const { salonId, date } = req.query;
    
    if (!salonId) {
      return res.status(400).json({ error: 'salonId is required' });
    }

    const targetDate = date ? new Date(date as string) : new Date();
    const month = targetDate.getMonth() + 1;
    const day = targetDate.getDate();

    const tprisma = tenantPrisma(salonId as string);
    
    // Find clients with birthday today (month-day match)
    const clients = await tprisma.client.findMany({
      where: {
        birthday: {
          not: null
        }
      }
    });

    // Filter by month-day match (PostgreSQL EXTRACT alternative)
    const birthdayClients = clients.filter(client => {
      if (!client.birthday) return false;
      const bday = new Date(client.birthday);
      return bday.getMonth() + 1 === month && bday.getDate() === day;
    });

    // Get salon info
    const salon = await tprisma.salon.findFirst();

    // Prepare response with locale resolution
    const clientsWithLocale = birthdayClients.map(client => {
      const clientLocale = resolveLocale({
        client: {
          preferredLocale: client.preferredLocale,
          alternateLocales: client.alternateLocales
        },
        salon: {
          primaryLocale: salon?.primaryLocale || 'pl',
          supportedLocales: salon?.supportedLocales || ['pl'],
          publicDefaultLocale: salon?.publicDefaultLocale
        }
      });

      return {
        ...client,
        recommendedLocale: clientLocale,
        templateData: {
          clientName: client.name,
          salonName: salon?.displayName || 'Beauty Salon',
          age: client.birthday ? new Date().getFullYear() - new Date(client.birthday).getFullYear() : null
        }
      };
    });

    res.json({
      success: true,
      count: clientsWithLocale.length,
      clients: clientsWithLocale
    });

  } catch (error) {
    console.error('Internal birthdays API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get inactive clients for winback campaign
 * Used by n8n winback workflow
 */
router.get('/internal/winback', requireInternalApiKey, async (req, res) => {
  try {
    const { salonId, daysSince = 90 } = req.query;
    
    if (!salonId) {
      return res.status(400).json({ error: 'salonId is required' });
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(daysSince as string));

    const tprisma = tenantPrisma(salonId as string);
    
    // Find clients who haven't visited since cutoff date
    const inactiveClients = await tprisma.client.findMany({
      where: {
        OR: [
          { lastVisitAt: { lt: cutoffDate } },
          { lastVisitAt: null, createdAt: { lt: cutoffDate } }
        ]
      },
      include: {
        appointments: {
          orderBy: { startAt: 'desc' },
          take: 1,
          include: {
            services: {
              include: { service: true }
            }
          }
        }
      }
    });

    // Get salon info
    const salon = await tprisma.salon.findFirst();

    // Prepare response with locale resolution
    const clientsWithLocale = inactiveClients.map(client => {
      const clientLocale = resolveLocale({
        client: {
          preferredLocale: client.preferredLocale,
          alternateLocales: client.alternateLocales
        },
        salon: {
          primaryLocale: salon?.primaryLocale || 'pl',
          supportedLocales: salon?.supportedLocales || ['pl'],
          publicDefaultLocale: salon?.publicDefaultLocale
        }
      });

      const lastVisit = client.lastVisitAt || client.createdAt;
      const daysSinceVisit = lastVisit ? 
        Math.floor((new Date().getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24)) : 
        null;

      const lastServices = client.appointments[0]?.services?.map(s => s.service.baseName).join(', ') || '';

      return {
        ...client,
        daysSinceLastVisit: daysSinceVisit,
        recommendedLocale: clientLocale,
        templateData: {
          clientName: client.name,
          salonName: salon?.displayName || 'Beauty Salon',
          daysSinceVisit: daysSinceVisit,
          lastServices: lastServices,
          lastVisitDate: lastVisit?.toLocaleDateString('pl-PL') || 'unknown'
        }
      };
    });

    res.json({
      success: true,
      count: clientsWithLocale.length,
      clients: clientsWithLocale
    });

  } catch (error) {
    console.error('Internal winback API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Send message via Messaging Hub
 * Used by all n8n workflows to send messages
 */
router.post('/internal/send-message', requireInternalApiKey, async (req, res) => {
  try {
    const { 
      salonId, 
      clientId, 
      channel, 
      templateCode, 
      templateData, 
      locale,
      text 
    } = req.body;

    if (!salonId || !clientId || !channel) {
      return res.status(400).json({ 
        error: 'Missing required fields: salonId, clientId, channel' 
      });
    }

    // Check for duplicate message in recent time (prevent spam)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const tprisma = tenantPrisma(salonId);
    
    const recentMessage = await tprisma.messageLog.findFirst({
      where: {
        clientId,
        templateCode: templateCode || null,
        createdAt: { gte: fiveMinutesAgo }
      }
    });

    if (recentMessage) {
      return res.json({ 
        success: false, 
        skipped: true, 
        reason: 'Duplicate message within 5 minutes' 
      });
    }

    // Send message via MessageHub
    const result = await messageHub.sendMessage({
      salonId,
      clientId,
      channel: channel.toUpperCase(),
      text,
      templateCode,
      templateData,
      targetLocale: locale
    });

    res.json({
      success: true,
      messageId: result.messageId,
      status: result.status
    });

  } catch (error) {
    console.error('Internal send-message API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get all salons for multi-tenant workflows
 * Used by n8n workflows to iterate over all salons
 */
router.get('/internal/salons', requireInternalApiKey, async (req, res) => {
  try {
    const { active = true } = req.query;
    
    const salons = await tenantPrisma('').salon.findMany({
      where: active === 'true' ? {
        // Add any active salon criteria here
        plan: { not: null }
      } : undefined,
      select: {
        id: true,
        slug: true,
        displayName: true,
        primaryLocale: true,
        supportedLocales: true,
        baseCurrency: true,
        plan: true,
        timeZone: true // if we add timezone field later
      }
    });

    res.json({
      success: true,
      count: salons.length,
      salons
    });

  } catch (error) {
    console.error('Internal salons API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;