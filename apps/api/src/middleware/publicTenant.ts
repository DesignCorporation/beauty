/**
 * TP-07: Enhanced Public Tenant Middleware
 * Resolves salon by slug for public booking endpoints
 * Extends TP-02 tenant middleware with public-specific features
 */

import { Request, Response, NextFunction } from 'express';
import { getSalonConfigBySlug } from '../lib/salonConfig';
import { logger } from '@dc-beauty/utils';

declare module 'express-serve-static-core' {
  interface Request {
    publicTenant?: {
      salonId: string;
      salonSlug: string;
      salonName: string;
      plan: 'STARTER' | 'PRO' | 'ENTERPRISE';
      locales: {
        primary: string;
        supported: string[];
        publicDefault?: string;
      };
      currency: string;
      timeZone?: string;
      source: 'slug';
      isPublic: true;
    };
  }
}

/**
 * Middleware that resolves tenant from slug parameter for public endpoints
 * Usage: app.use('/public/:slug', publicTenantMiddleware)
 */
export const publicTenantMiddleware = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  try {
    const { slug } = req.params;
    
    if (!slug) {
      return res.status(400).json({
        error: 'SLUG_REQUIRED',
        message: 'Salon slug is required in URL path',
        hint: 'Use format: /public/{salon-slug}/endpoint'
      });
    }

    // Validate slug format (alphanumeric + hyphens only)
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return res.status(400).json({
        error: 'INVALID_SLUG_FORMAT',
        message: 'Salon slug must contain only lowercase letters, numbers, and hyphens',
        received: slug
      });
    }

    const salonConfig = await getSalonConfigBySlug(slug);
    
    if (!salonConfig) {
      logger.warn('Salon not found for slug', { slug, ip: req.ip });
      return res.status(404).json({
        error: 'SALON_NOT_FOUND',
        message: `Salon with slug '${slug}' not found`,
        hint: 'Check the URL or contact the salon for the correct booking link'
      });
    }

    // Check if public booking is enabled for this salon
    if (!salonConfig.publicListingEnabled) {
      logger.warn('Public booking disabled for salon', { 
        salonId: salonConfig.id, 
        slug,
        ip: req.ip 
      });
      return res.status(403).json({
        error: 'PUBLIC_BOOKING_DISABLED',
        message: 'Online booking is not available for this salon',
        hint: 'Contact the salon directly to make an appointment'
      });
    }

    // Set public tenant context (separate from regular tenant for security)
    req.publicTenant = {
      salonId: salonConfig.id,
      salonSlug: salonConfig.slug,
      salonName: salonConfig.displayName,
      plan: salonConfig.plan,
      locales: {
        primary: salonConfig.primaryLocale,
        supported: salonConfig.supportedLocales,
        publicDefault: salonConfig.publicDefaultLocale
      },
      currency: salonConfig.baseCurrency,
      timeZone: salonConfig.timeZone, // Future feature
      source: 'slug',
      isPublic: true
    };

    // Also set regular tenant for backward compatibility with existing code
    req.tenant = {
      salonId: salonConfig.id,
      salonSlug: salonConfig.slug,
      plan: salonConfig.plan,
      locales: {
        primary: salonConfig.primaryLocale,
        supported: salonConfig.supportedLocales,
        publicDefault: salonConfig.publicDefaultLocale
      },
      source: 'slug'
    };

    // Log successful resolution for analytics
    logger.info('Public tenant resolved', {
      salonId: salonConfig.id,
      slug,
      plan: salonConfig.plan,
      userAgent: req.get('User-Agent'),
      referer: req.get('Referer'),
      ip: req.ip
    });

    next();
  } catch (error) {
    logger.error('Error in publicTenantMiddleware', {
      error: error.message,
      stack: error.stack,
      slug: req.params.slug,
      ip: req.ip
    });

    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to resolve salon information',
      requestId: Math.random().toString(36).substring(7)
    });
  }
};

/**
 * Utility function to get public tenant safely
 */
export const getPublicTenant = (req: Request) => {
  if (!req.publicTenant) {
    throw new Error('Public tenant not resolved. Ensure publicTenantMiddleware is applied.');
  }
  return req.publicTenant;
};

/**
 * Middleware to require public tenant (fail if not present)
 */
export const requirePublicTenant = (req: Request, res: Response, next: NextFunction) => {
  if (!req.publicTenant) {
    return res.status(400).json({
      error: 'PUBLIC_TENANT_REQUIRED',
      message: 'Public tenant context is required for this endpoint'
    });
  }
  next();
};

/**
 * Rate limiting keys for public booking endpoints
 */
export const getPublicRateLimitKey = (req: Request, type: 'booking' | 'availability' | 'services') => {
  const salonId = req.publicTenant?.salonId || 'unknown';
  const ip = req.ip;
  return `public:${type}:${salonId}:${ip}`;
};
