// TP-02 T4: Main tenant resolution middleware

import { Request, Response, NextFunction } from 'express';
import { RequestTenantContext } from '../types/tenant';
import { getSalonConfigById, getSalonConfigBySlug, extractSalonSlugFromHost } from '../lib/salonConfig';
import { verifyJwt } from '../auth/jwt'; // Will be implemented later

/**
 * Checks if tenant header override is allowed
 * In DEV: always allowed
 * In PROD: only with valid INTERNAL_API_KEY
 */
function allowTenantHeader(req: Request): boolean {
  if (process.env.NODE_ENV !== 'production') return true;
  
  const apiKey = req.header('x-api-key');
  return apiKey === process.env.INTERNAL_API_KEY;
}

/**
 * Main tenant resolution middleware
 * Priority: JWT → Host → Header → Query
 */
export const resolveTenant = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let ctx: RequestTenantContext | undefined;

    // 1. JWT (highest priority)
    const auth = req.headers.authorization?.split(' ');
    if (auth?.[0] === 'Bearer') {
      try {
        const token = auth[1];
        // TODO: Implement JWT verification when auth module is ready
        // const claims = verifyJwt(token);
        // if (claims?.tid) {
        //   const salonCfg = await getSalonConfigById(claims.tid);
        //   if (salonCfg) {
        //     ctx = {
        //       salonId: salonCfg.id,
        //       salonSlug: salonCfg.slug,
        //       plan: salonCfg.plan,
        //       locales: { 
        //         primary: salonCfg.primaryLocale, 
        //         supported: salonCfg.supportedLocales 
        //       },
        //       role: claims.role ?? 'ADMIN',
        //       userId: claims.sub,
        //       source: 'jwt'
        //     };
        //   }
        // }
      } catch (err) {
        // Invalid JWT, continue to other methods
        console.warn('Invalid JWT token:', err);
      }
    }

    // 2. Hostname (if no JWT context)
    if (!ctx) {
      const host = req.hostname.toLowerCase();
      const slug = extractSalonSlugFromHost(host);
      if (slug) {
        const salonCfg = await getSalonConfigBySlug(slug);
        if (salonCfg) {
          ctx = {
            salonId: salonCfg.id,
            salonSlug: salonCfg.slug,
            plan: salonCfg.plan,
            locales: { 
              primary: salonCfg.primaryLocale, 
              supported: salonCfg.supportedLocales 
            },
            source: 'host'
          };
        }
      }
    }

    // 3. Header override (Server / Dev)
    if (!ctx) {
      const tid = req.header('x-tenant-id');
      if (tid && allowTenantHeader(req)) {
        const salonCfg = await getSalonConfigById(tid);
        if (salonCfg) {
          ctx = {
            salonId: salonCfg.id,
            salonSlug: salonCfg.slug,
            plan: salonCfg.plan,
            locales: { 
              primary: salonCfg.primaryLocale, 
              supported: salonCfg.supportedLocales 
            },
            source: 'header'
          };
        }
      }
    }

    // 4. Query param fallback
    if (!ctx) {
      const tid = req.query.salon as string | undefined;
      if (tid) {
        const salonCfg = await getSalonConfigById(tid);
        if (salonCfg) {
          ctx = {
            salonId: salonCfg.id,
            salonSlug: salonCfg.slug,
            plan: salonCfg.plan,
            locales: { 
              primary: salonCfg.primaryLocale, 
              supported: salonCfg.supportedLocales 
            },
            source: 'query'
          };
        }
      }
    }

    // Attach context to request (may be undefined for global endpoints)
    req.tenant = ctx;
    next();
  } catch (err) {
    console.error('Error in resolveTenant middleware:', err);
    next(err);
  }
};
