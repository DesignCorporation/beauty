# Database Package - TP-03 Service Library & Seeding

## Overview
This package contains the Prisma schema, database utilities, and service seeding functionality for the Beauty Platform multitenant SaaS.

## Setup Instructions

### Prerequisites
- Node.js 18+
- pnpm
- PostgreSQL database running (via Docker Compose)

### 1. Environment Setup
```bash
# В корне проекта
cp .env.example .env
# Отредактируйте DATABASE_URL для подключения к PostgreSQL
```

Make sure to set currency exchange rates in your `.env`:
```bash
# Currency exchange rates for service seeding (EUR as base)
SEED_RATE_EUR_PLN=4.35
SEED_RATE_EUR_UAH=43.00
SEED_RATE_EUR_USD=1.08
SEED_RATE_EUR_GBP=0.84
SEED_RATE_EUR_CZK=25.00

# Service seeding settings
SEED_SERVICES_ENABLED=true
```

### 2. Start Database
```bash
# Запустить PostgreSQL через Docker
docker compose -f docker/docker-compose.dev.yml up -d
```

### 3. Database Initialization
```bash
# Перейти в пакет db
cd packages/db

# Установить зависимости
pnpm install

# Генерировать Prisma Client
npx prisma generate

# Создать миграции
npx prisma db push

# Запустить seed (создать демо данные)
SEED_CREATE=true pnpm seed
```

### 4. Verify Setup
```bash
# Открыть Prisma Studio для проверки данных
npx prisma studio
```

## Service Library & Seeding (TP-03)

### Service Library
The service library contains 40+ predefined beauty services in categories:
- **Hair**: cuts, coloring, treatments
- **Nails**: manicure, pedicure, extensions
- **Brows & Lashes**: shaping, tinting, extensions
- **Skin & Face**: facials, peels, treatments
- **Waxing**: various body areas
- **Barber**: men's cuts, beard trimming
- **Spa**: massages, body treatments
- **Packages**: combined services

All services have:
- Standardized codes (e.g., `hair_womens_cut`)
- Polish canonical names
- EUR base prices (converted to salon currency)
- Duration in minutes
- Category classification

### Seeding Services for Salon
```bash
# From project root
pnpm seed:salon <nip|salonId>

# Examples:
pnpm seed:salon 1234567890          # By NIP
pnpm seed:salon nip:1234567890      # With nip: prefix  
pnpm seed:salon clpx1234567890      # By Salon ID
```

The seeding process:
1. **Finds salon** by NIP or ID
2. **Converts prices** from EUR to salon's `baseCurrency`
3. **Creates/updates services** with upsert (no duplicates)
4. **Generates translations** if `autoTranslateEnabled=true`
5. **Logs results** with counts

### Currency Conversion
- All library prices are in EUR
- Converted to salon's `baseCurrency` using env rates
- Supported currencies: EUR, PLN, UAH, USD, GBP, CZK
- Fallback: 1:1 rate if no conversion rate found

### Auto-translations
When `salon.autoTranslateEnabled=true` and multiple `supportedLocales`:
- Creates stub translations for each non-primary locale
- Format: `[LOCALE] Original Name` (placeholder)
- Marked as `source=AUTO, approved=false`
- Ready for real translation service integration

## Seeds Created
- **Demo Salon**: "Demo Salon" with Polish locale support
- **Demo Staff**: "Anna Kowalska" (Master)
- **Demo Client**: "Maria Nowak" 
- **Services**: 40+ services from service library (TP-03)
- **Translations**: Auto-generated stubs for ru/uk/en (approved=false)

## Available Scripts
- `pnpm generate` - Generate Prisma Client
- `pnpm migrate:dev` - Create and apply development migrations
- `pnpm migrate:deploy` - Apply migrations to production
- `pnpm seed` - Run seed script (requires SEED_CREATE=true)
- `pnpm seed:salon <nip>` - Seed services for specific salon (TP-03)
- `pnpm studio` - Open Prisma Studio

## Programming API (TP-03)

### Service Library
```typescript
import { SERVICE_LIBRARY, ServiceLibraryItem } from '@dc-beauty/db/serviceLibrary';

// All 40+ services with EUR prices
console.log(SERVICE_LIBRARY.length); // 40+
```

### Currency Conversion
```typescript
import { convertSeed, getSeedRate } from '@dc-beauty/utils';

// Convert EUR to PLN using env rates
const plnPrice = convertSeed(35, 'EUR', 'PLN'); // 35 * 4.35 = 152.25
const rate = getSeedRate('EUR', 'PLN'); // 4.35
```

### Seeding Functions
```typescript
import { seedServicesForSalon, seedServicesByNipOrId } from '@dc-beauty/db';

// Seed services for a salon
const result = await seedServicesForSalon({
  salonId: 'clpx...',
  primaryLocale: 'pl',
  supportedLocales: ['pl', 'ru', 'uk', 'en'],
  autoTranslateEnabled: true,
  baseCurrency: 'PLN'
});

// Or by NIP/ID
const result = await seedServicesByNipOrId('1234567890');
```

## Database Schema
The schema includes:
- **Multitenant structure** (salon isolation)
- **Service library integration** (TP-03)
- **Multilingual support** (ServiceTranslation) 
- **Multicurrency support** (salon.baseCurrency + service.priceCurrency)
- **Staff management** with roles
- **Client management** with preferences
- **Appointment system** with services
- **Message logging** for communication tracking
- **Agent skills** for AI automation

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `SEED_CREATE` - Set to "true" to enable seeding
- `SEED_SALON_NIP` - NIP for demo salon (default: "0000000000")
- `SEED_RATE_EUR_*` - Currency exchange rates for seeding
- `SEED_SERVICES_ENABLED` - Enable/disable service seeding

## Next Steps: TP-04 Onboarding API
After completing TP-03, the onboarding API (TP-04) will automatically call service seeding when a salon is finalized during the onboarding process.
