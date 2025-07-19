/**
 * Language Resolution Middleware for Beauty Platform
 * 
 * Integrates with TP-05 Language Resolver utilities to determine
 * the best language for API responses based on:
 * 1. Client preferences (Accept-Language header)
 * 2. Query parameters (?lang=en)
 * 3. Salon supported locales
 * 4. Staff spoken languages
 * 5. Fallbacks
 */

import { Request, Response, NextFunction } from 'express';
import { resolveLocale, type LocaleContext } from '@dc-beauty/utils/language';

declare module 'express-serve-static-core' {
  interface Request {
    resolvedLocale?: string;
    localeContext?: LocaleContext;
  }
}

/**
 * Middleware to resolve the best locale for API response
 * Requires tenant middleware to run first (req.tenant)
 */
export const resolveLanguage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Skip if no tenant context (global endpoints)
    if (!req.tenant?.salonId) {
      req.resolvedLocale = 'en'; // Global fallback
      return next();
    }

    // Extract client preferences from headers
    const acceptLanguage = req.headers['accept-language'];
    const clientPreferences = parseAcceptLanguage(acceptLanguage);
    
    // Check query parameter override
    const queryLang = req.query.lang as string | undefined;
    if (queryLang) {
      clientPreferences.unshift(queryLang);
    }

    // Build context for resolveLocale
    const context: LocaleContext = {
      client: {
        preferred: clientPreferences[0] || 'en',
        alternatives: clientPreferences.slice(1) || []
      },
      salon: {
        primary: req.tenant.locales?.primary || 'pl',
        supported: req.tenant.locales?.supported || ['pl', 'en'],
        publicDefault: req.tenant.locales?.publicDefault
      },
      // Staff context will be added when we have staffId in request
      staff: undefined
    };

    // Resolve the best locale
    const resolvedLocale = resolveLocale(context);
    
    req.resolvedLocale = resolvedLocale;
    req.localeContext = context;

    // Set response header for client awareness
    res.setHeader('Content-Language', resolvedLocale);
    
    next();
  } catch (error) {
    console.error('Language resolution error:', error);
    // Fallback to primary salon locale or 'en'
    req.resolvedLocale = req.tenant?.locales?.primary || 'en';
    next();
  }
};

/**
 * Parse Accept-Language header into ordered preference array
 * Example: "pl,en-US;q=0.9,en;q=0.8" → ["pl", "en-US", "en"]
 */
function parseAcceptLanguage(acceptLanguage?: string): string[] {
  if (!acceptLanguage) return [];

  return acceptLanguage
    .split(',')
    .map(lang => {
      const [locale, q] = lang.trim().split(';q=');
      const quality = q ? parseFloat(q) : 1.0;
      return { locale: locale.toLowerCase(), quality };
    })
    .sort((a, b) => b.quality - a.quality)
    .map(item => item.locale)
    .map(locale => {
      // Convert long locales to short ones: en-US → en
      const short = locale.split('-')[0];
      return ['pl', 'en', 'uk', 'ru'].includes(short) ? short : 'en';
    })
    .filter((locale, index, array) => array.indexOf(locale) === index); // Deduplicate
}

/**
 * Helper to add staff context to existing locale resolution
 * Call this in routes where staffId is available
 */
export const enrichWithStaffContext = (
  req: Request,
  staffId: string,
  staffSpokenLocales: string[]
): void => {
  if (!req.localeContext) return;

  req.localeContext.staff = {
    id: staffId,
    spoken: staffSpokenLocales
  };

  // Re-resolve with staff context
  req.resolvedLocale = resolveLocale(req.localeContext);
  req.res?.setHeader('Content-Language', req.resolvedLocale!);
};
