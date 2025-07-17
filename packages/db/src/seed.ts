import { PrismaClient, Prisma, TranslationSource } from './generated';
import { servicesPL } from './seed-services-pl';

const prisma = new PrismaClient();

async function main() {
  if (process.env.SEED_CREATE !== 'true') {
    console.log('Skip seed: SEED_CREATE!=true');
    return;
  }

  const nip = process.env.SEED_SALON_NIP ?? '0000000000';

  console.log('🌱 Starting seed...');

  // Создаем или находим демо салон
  let salon = await prisma.salon.findUnique({ where: { nip } });
  
  if (!salon) {
    console.log('Creating Demo Salon...');
    salon = await prisma.salon.create({
      data: {
        nip,
        displayName: 'Demo Salon',
        legalName: 'Demo Salon Sp. z o.o.',
        phone: '+48123456789',
        email: 'demo@salon.pl',
        addressCountry: 'Poland',
        addressCity: 'Warsaw',
        addressStreet: 'ul. Piękna 1',
        postalCode: '00-001',
        primaryLocale: 'pl',
        supportedLocales: ['pl', 'ru', 'uk', 'en'],
        baseCurrency: 'PLN',
        category: 'beauty',
        tags: ['hair', 'nails', 'beauty'],
        autoTranslateEnabled: true,
        publicListingEnabled: true,
      }
    });
    console.log(`✅ Created salon: ${salon.displayName} (${salon.id})`);
  } else {
    console.log(`✅ Found existing salon: ${salon.displayName} (${salon.id})`);
  }

  // Создаем демо мастера
  let staff = await prisma.staff.findFirst({ where: { salonId: salon.id } });
  
  if (!staff) {
    console.log('Creating Demo Master...');
    staff = await prisma.staff.create({
      data: {
        salonId: salon.id,
        name: 'Anna Kowalska',
        role: 'MASTER',
        spokenLocales: ['pl', 'en'],
        preferredLocaleForUi: 'pl',
        color: '#667eea',
        active: true,
      }
    });
    console.log(`✅ Created staff: ${staff.name} (${staff.id})`);
  }

  // Создаем услуги
  console.log('Creating services...');
  let servicesCount = 0;
  
  for (const s of servicesPL) {
    const existing = await prisma.service.findUnique({
      where: { 
        salonId_code: { 
          salonId: salon.id, 
          code: s.code 
        } 
      }
    });

    if (!existing) {
      await prisma.service.create({
        data: {
          salonId: salon.id,
          code: s.code,
          baseName: s.baseName,
          baseDescription: s.baseDescription,
          durationMin: s.durationMin,
          priceAmount: new Prisma.Decimal(s.priceAmount),
          priceCurrency: s.priceCurrency ?? salon.baseCurrency,
          category: s.category,
          active: true,
        }
      });
      servicesCount++;
    }
  }
  
  console.log(`✅ Created ${servicesCount} services`);

  // Создаем автопереводы-заглушки
  console.log('Creating auto-translations...');
  const locales = ['ru', 'uk', 'en'];
  const services = await prisma.service.findMany({ where: { salonId: salon.id } });
  
  let translationsCount = 0;
  
  for (const svc of services) {
    for (const locale of locales) {
      const existing = await prisma.serviceTranslation.findUnique({
        where: {
          serviceId_locale: {
            serviceId: svc.id,
            locale: locale
          }
        }
      });

      if (!existing) {
        await prisma.serviceTranslation.create({
          data: {
            salonId: salon.id,
            serviceId: svc.id,
            locale: locale,
            name: svc.baseName, // копия до реального перевода
            description: svc.baseDescription,
            source: TranslationSource.AUTO,
            approved: false,
          }
        });
        translationsCount++;
      }
    }
  }
  
  console.log(`✅ Created ${translationsCount} auto-translations`);

  // Создаем демо клиента
  let client = await prisma.client.findFirst({ where: { salonId: salon.id } });
  
  if (!client) {
    console.log('Creating Demo Client...');
    client = await prisma.client.create({
      data: {
        salonId: salon.id,
        name: 'Maria Nowak',
        phone: '+48987654321',
        email: 'maria@example.com',
        preferredLocale: 'pl',
        alternateLocales: ['en'],
        tags: ['regular', 'vip'],
        firstVisitAt: new Date('2025-01-01'),
        lastVisitAt: new Date('2025-07-01'),
      }
    });
    console.log(`✅ Created client: ${client.name} (${client.id})`);
  }

  console.log('🎉 Seed completed successfully!');
  console.log(`
📊 Summary:
- Salon: ${salon.displayName}
- Staff: ${staff?.name}
- Services: ${services.length}
- Translations: ${translationsCount}
- Client: ${client?.name}
  `);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
