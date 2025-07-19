/**
 * Services API Routes with Language Integration (TP-05)
 * 
 * Provides multi-language service listings with automatic translation
 * and tenant-scoped access control.
 */

import { Router, Request, Response } from 'express';
import { requireTenant } from '../middleware/requireTenant';
import { resolveLanguage } from '../middleware/resolveLanguage';
import { tenantPrisma } from '../lib/tenantPrisma';
import { 
  ensureServiceTranslations,
  getServiceWithTranslations 
} from '@dc-beauty/utils/language';

const router = Router();

/**
 * GET /api/v1/services
 * 
 * Returns services for current tenant with translations in resolved language
 * Supports filtering by category and automatic translation generation
 * 
 * Query params:
 * - category: Filter by service category
 * - lang: Force specific language (overrides Accept-Language)
 * - includeInactive: Include inactive services (admin only)
 */
router.get('/', requireTenant, resolveLanguage, async (req: Request, res: Response) => {
  try {
    const salonId = req.tenant!.salonId;
    const locale = req.resolvedLocale!;
    const tprisma = tenantPrisma(salonId);

    // Parse query parameters
    const { category, includeInactive } = req.query;
    const isAdmin = req.tenant?.role === 'OWNER' || req.tenant?.role === 'ADMIN';

    // Build filters
    const where: any = {};
    if (category) {
      where.category = category as string;
    }
    if (!includeInactive || !isAdmin) {
      where.active = true;
    }

    console.log(`[Services API] Fetching services for salon ${salonId}, locale ${locale}`);

    // Fetch services with base translations
    const services = await tprisma.service.findMany({
      where,
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

    console.log(`[Services API] Found ${services.length} services`);

    // Ensure translations exist for missing ones
    const servicesNeedingTranslation = services.filter(
      service => service.translations.length === 0 && locale !== 'pl'
    );

    if (servicesNeedingTranslation.length > 0) {
      console.log(`[Services API] Auto-translating ${servicesNeedingTranslation.length} services to ${locale}`);
      
      // Check if salon has auto-translate enabled
      const salon = await tprisma.salon.findUnique({
        where: { id: salonId },
        select: { autoTranslateEnabled: true }
      });

      if (salon?.autoTranslateEnabled) {
        await ensureServiceTranslations(
          servicesNeedingTranslation.map(s => s.id),
          locale,
          salonId
        );

        // Refetch services with new translations
        const updatedServices = await tprisma.service.findMany({
          where,
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

        return res.json({
          services: formatServicesResponse(updatedServices, locale),
          meta: {
            total: updatedServices.length,
            locale,
            autoTranslated: servicesNeedingTranslation.length,
            category: category || null
          }
        });
      }
    }

    res.json({
      services: formatServicesResponse(services, locale),
      meta: {
        total: services.length,
        locale,
        autoTranslated: 0,
        category: category || null
      }
    });

  } catch (error) {
    console.error('[Services API] Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch services',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/v1/services/:serviceId
 * 
 * Get detailed service information with translations
 */
router.get('/:serviceId', requireTenant, resolveLanguage, async (req: Request, res: Response) => {
  try {
    const { serviceId } = req.params;
    const salonId = req.tenant!.salonId;
    const locale = req.resolvedLocale!;

    console.log(`[Services API] Fetching service ${serviceId} in ${locale}`);

    const service = await getServiceWithTranslations(serviceId, locale, salonId);

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json({
      service: formatServiceDetailResponse(service, locale),
      meta: { locale }
    });

  } catch (error) {
    console.error('[Services API] Error fetching service:', error);
    res.status(500).json({ 
      error: 'Failed to fetch service details'
    });
  }
});

/**
 * GET /api/v1/services/categories
 * 
 * Get list of service categories with counts
 */
router.get('/categories', requireTenant, async (req: Request, res: Response) => {
  try {
    const salonId = req.tenant!.salonId;
    const tprisma = tenantPrisma(salonId);

    const categories = await tprisma.service.groupBy({
      by: ['category'],
      where: { active: true },
      _count: { category: true },
      orderBy: { category: 'asc' }
    });

    const formattedCategories = categories.map(cat => ({
      name: cat.category,
      count: cat._count.category,
      // TODO: Add category translations from glossary
      displayName: cat.category || 'Other'
    }));

    res.json({
      categories: formattedCategories,
      total: categories.length
    });

  } catch (error) {
    console.error('[Services API] Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

/**
 * Format services for API response
 */
function formatServicesResponse(services: any[], locale: string) {
  return services.map(service => {
    const translation = service.translations[0];
    
    return {
      id: service.id,
      code: service.code,
      name: translation?.name || service.baseName,
      description: translation?.description || service.baseDescription,
      duration: service.durationMin,
      price: {
        amount: Number(service.priceAmount),
        currency: service.priceCurrency
      },
      category: service.category,
      active: service.active,
      translation: translation ? {
        locale: translation.locale,
        source: translation.source,
        approved: translation.approved
      } : null
    };
  });
}

/**
 * Format single service detail response
 */
function formatServiceDetailResponse(service: any, locale: string) {
  const translation = service.translations?.find((t: any) => t.locale === locale);
  
  return {
    id: service.id,
    code: service.code,
    baseName: service.baseName,
    baseDescription: service.baseDescription,
    name: translation?.name || service.baseName,
    description: translation?.description || service.baseDescription,
    duration: service.durationMin,
    price: {
      amount: Number(service.priceAmount),
      currency: service.priceCurrency
    },
    category: service.category,
    active: service.active,
    translations: service.translations?.map((t: any) => ({
      locale: t.locale,
      name: t.name,
      description: t.description,
      source: t.source,
      approved: t.approved,
      updatedAt: t.updatedAt
    })) || [],
    createdAt: service.createdAt,
    updatedAt: service.updatedAt
  };
}

export default router;
