// TP-02 T3: Salon configuration utilities with in-memory cache

import { PrismaClient } from '@beauty/db';
import { SalonConfig } from '../types/tenant';

// Simple in-memory cache with TTL (5 minutes)
interface CacheEntry {
  data: SalonConfig;
  expiry: number;
}

class SalonConfigCache {
  private cache = new Map<string, CacheEntry>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes

  get(key: string): SalonConfig | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  set(key: string, data: SalonConfig): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + this.TTL
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

const cache = new SalonConfigCache();

/**
 * Get salon configuration by ID with caching
 */
export async function getSalonConfigById(id: string): Promise<SalonConfig | null> {
  const cacheKey = `id:${id}`;
  
  // Try cache first
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  // Fetch from database
  const prisma = new PrismaClient();
  try {
    const salon = await prisma.salon.findUnique({
      where: { id },
      select: {
        id: true,
        slug: true,
        plan: true,
        primaryLocale: true,
        supportedLocales: true
      }
    });

    if (!salon) return null;

    const config: SalonConfig = {
      id: salon.id,
      slug: salon.slug,
      plan: salon.plan,
      primaryLocale: salon.primaryLocale,
      supportedLocales: salon.supportedLocales
    };

    // Cache both by ID and slug
    cache.set(cacheKey, config);
    cache.set(`slug:${salon.slug}`, config);

    return config;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Get salon configuration by slug with caching
 */
export async function getSalonConfigBySlug(slug: string): Promise<SalonConfig | null> {
  const cacheKey = `slug:${slug}`;
  
  // Try cache first
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  // Fetch from database
  const prisma = new PrismaClient();
  try {
    const salon = await prisma.salon.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        plan: true,
        primaryLocale: true,
        supportedLocales: true
      }
    });

    if (!salon) return null;

    const config: SalonConfig = {
      id: salon.id,
      slug: salon.slug,
      plan: salon.plan,
      primaryLocale: salon.primaryLocale,
      supportedLocales: salon.supportedLocales
    };

    // Cache both by ID and slug
    cache.set(`id:${salon.id}`, config);
    cache.set(cacheKey, config);

    return config;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Extract salon slug from hostname
 * Expects format: <slug>.beauty.designcorp.eu or <slug>.beauty.domain.tld
 */
export function extractSalonSlugFromHost(hostname: string): string | null {
  const parts = hostname.toLowerCase().split('.');
  
  // Look for pattern: slug.beauty.* or slug.beauty-dev.*
  if (parts.length >= 3) {
    const [slug, subdomain] = parts;
    if (subdomain === 'beauty' || subdomain === 'beauty-dev') {
      return slug;
    }
  }
  
  return null;
}

/**
 * Clear cache (useful for testing)
 */
export function clearSalonConfigCache(): void {
  cache.clear();
}
