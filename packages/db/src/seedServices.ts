import { PrismaClient } from './generated';
import { SERVICE_LIBRARY, ServiceLibraryItem } from './serviceLibrary';
import { convertSeed, type CurrencyCode } from '@dc-beauty/utils/currency';

export interface SeedServicesForSalonOptions {
  salonId: string;
  primaryLocale: string;
  supportedLocales: string[];
  autoTranslateEnabled: boolean;
  baseCurrency: CurrencyCode;
  prisma?: PrismaClient;
}

export interface SeedServicesResult {
  servicesCreated: number;
  servicesUpdated: number;
  translationsCreated: number;
  salonId: string;
}

/**
 * Seed services for a salon from the service library
 */
export async function seedServicesForSalon(
  options: SeedServicesForSalonOptions
): Promise<SeedServicesResult> {
  const { 
    salonId, 
    primaryLocale, 
    supportedLocales, 
    autoTranslateEnabled, 
    baseCurrency,
    prisma: externalPrisma 
  } = options;

  // Use provided prisma client or create new one
  const prisma = externalPrisma || new PrismaClient();

  let servicesCreated = 0;
  let servicesUpdated = 0;
  let translationsCreated = 0;

  try {
    // Process each service in the library
    for (const libraryItem of SERVICE_LIBRARY) {
      const convertedPrice = convertSeed(libraryItem.price_eur, 'EUR', baseCurrency);
      
      // Determine base name and description based on primary locale
      let baseName = libraryItem.name_pl;
      let baseDescription = libraryItem.notes || null;
      
      // If primary locale is not Polish, we'll use Polish as base for now
      // In a real implementation, you might want to translate here
      // For now, keeping Polish as canonical
      
      // Upsert service
      const service = await prisma.service.upsert({
        where: {
          salonId_code: {
            salonId,
            code: libraryItem.code
          }
        },
        update: {
          baseName,
          baseDescription,
          durationMin: libraryItem.duration_min,
          priceAmount: convertedPrice,
          priceCurrency: baseCurrency,
          category: libraryItem.category,
          updatedAt: new Date()
        },
        create: {
          salonId,
          code: libraryItem.code,
          baseName,
          baseDescription,
          durationMin: libraryItem.duration_min,
          priceAmount: convertedPrice,
          priceCurrency: baseCurrency,
          category: libraryItem.category,
          active: true
        }
      });

      // Check if this was a create or update
      const existingService = await prisma.service.findUnique({
        where: {
          salonId_code: {
            salonId,
            code: libraryItem.code
          }
        },
        select: {
          createdAt: true,
          updatedAt: true
        }
      });

      if (existingService && existingService.createdAt.getTime() === existingService.updatedAt.getTime()) {
        servicesCreated++;
      } else {
        servicesUpdated++;
      }

      // Create translations if auto-translate is enabled and we have multiple locales
      if (autoTranslateEnabled && supportedLocales.length > 1) {
        for (const locale of supportedLocales) {
          // Skip primary locale (already stored as base)
          if (locale === primaryLocale) continue;

          // Check if translation already exists
          const existingTranslation = await prisma.serviceTranslation.findUnique({
            where: {
              serviceId_locale: {
                serviceId: service.id,
                locale
              }
            }
          });

          if (!existingTranslation) {
            // Create stub translation
            // In a real implementation, you'd call a translation service here
            await prisma.serviceTranslation.create({
              data: {
                salonId,
                serviceId: service.id,
                locale,
                name: `[${locale.toUpperCase()}] ${baseName}`, // Stub translation
                description: baseDescription ? `[${locale.toUpperCase()}] ${baseDescription}` : null,
                source: 'AUTO',
                approved: false
              }
            });
            translationsCreated++;
          }
        }
      }
    }

    console.log(`✅ Seeded salon ${salonId}:`);
    console.log(`   - Services created: ${servicesCreated}`);
    console.log(`   - Services updated: ${servicesUpdated}`);
    console.log(`   - Translations created: ${translationsCreated}`);
    console.log(`   - Base currency: ${baseCurrency}`);

    return {
      servicesCreated,
      servicesUpdated,
      translationsCreated,
      salonId
    };

  } catch (error) {
    console.error('Error seeding services:', error);
    throw error;
  } finally {
    if (!externalPrisma) {
      await prisma.$disconnect();
    }
  }
}

/**
 * Find salon by NIP or ID
 */
export async function findSalonByNipOrId(
  nipOrId: string,
  prisma?: PrismaClient
): Promise<any> {
  const client = prisma || new PrismaClient();
  
  try {
    // Try to find by ID first
    let salon = await client.salon.findUnique({
      where: { id: nipOrId },
      select: {
        id: true,
        nip: true,
        displayName: true,
        primaryLocale: true,
        supportedLocales: true,
        autoTranslateEnabled: true,
        baseCurrency: true,
        addressCountry: true
      }
    });

    // If not found by ID, try by NIP
    if (!salon) {
      salon = await client.salon.findUnique({
        where: { nip: nipOrId },
        select: {
          id: true,
          nip: true,
          displayName: true,
          primaryLocale: true,
          supportedLocales: true,
          autoTranslateEnabled: true,
          baseCurrency: true,
          addressCountry: true
        }
      });
    }

    return salon;
  } finally {
    if (!prisma) {
      await client.$disconnect();
    }
  }
}

/**
 * Seed services for salon by NIP or ID
 */
export async function seedServicesByNipOrId(
  nipOrId: string,
  prisma?: PrismaClient
): Promise<SeedServicesResult> {
  const salon = await findSalonByNipOrId(nipOrId, prisma);
  
  if (!salon) {
    throw new Error(`Salon not found with NIP/ID: ${nipOrId}`);
  }

  console.log(`📍 Found salon: ${salon.displayName} (${salon.nip})`);

  return await seedServicesForSalon({
    salonId: salon.id,
    primaryLocale: salon.primaryLocale,
    supportedLocales: salon.supportedLocales,
    autoTranslateEnabled: salon.autoTranslateEnabled,
    baseCurrency: salon.baseCurrency as CurrencyCode,
    prisma
  });
}
