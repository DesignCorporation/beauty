# Database Package - TP-03 Service Library & Seeding

## Overview
This package contains the Prisma schema, service library, and seeding utilities for the Beauty Platform multitenant SaaS.

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

## TP-03: Service Library & Auto-Seeding

### Service Seeding
Auto-populate salons with standardized services from the library:

```bash
# Seed services for salon by NIP
pnpm seed:salon 1234567890

# Seed services for salon by ID
pnpm seed:salon clpx1234567890

# With "nip:" prefix
pnpm seed:salon nip:1234567890
```

### Service Library
- **40+ services** across 8 categories
- **Base prices in EUR** - converted to salon's baseCurrency
- **Polish canonical names** - auto-translated if enabled
- **Categories**: hair, nails, brows_lashes, skin_face, waxing, barber, spa, packages

### Currency Conversion
Set exchange rates in `.env`:
```bash
SEED_RATE_EUR_PLN=4.35
SEED_RATE_EUR_UAH=43.00
SEED_RATE_EUR_USD=1.08
SEED_RATE_EUR_GBP=0.84
SEED_RATE_EUR_CZK=25.00
```

### Automatic Translations
When `salon.autoTranslateEnabled=true`:
- Creates stub translations for all `supportedLocales`
- Marks translations as `source='AUTO'`, `approved=false`
- Ready for real translation service integration

## Seeds Created
- **Demo Salon**: "Demo Salon" with Polish locale support
- **Demo Staff**: "Anna Kowalska" (Master)
- **Demo Client**: "Maria Nowak" 
- **Services**: 40+ services from service library with currency conversion
- **Translations**: Auto-generated stubs for supported locales

## Available Scripts
- `pnpm generate` - Generate Prisma Client
- `pnpm migrate:dev` - Create and apply development migrations
- `pnpm migrate:deploy` - Apply migrations to production
- `pnpm seed` - Run seed script (requires SEED_CREATE=true)
- `pnpm seed:salon <nip|id>` - Seed services for specific salon
- `pnpm studio` - Open Prisma Studio

## Programmatic Usage

### Import Service Library
```typescript
import { SERVICE_LIBRARY, ServiceCategory } from '@dc-beauty/db/serviceLibrary';
```

### Seed Services for Salon
```typescript
import { seedServicesForSalon } from '@dc-beauty/db/seedServices';

const result = await seedServicesForSalon({
  salonId: 'salon_id',
  primaryLocale: 'pl',
  supportedLocales: ['pl', 'ru', 'uk', 'en'],
  autoTranslateEnabled: true,
  baseCurrency: 'PLN'
});
```

### Currency Conversion
```typescript
import { convertSeed, getBaseCurrencyByCountry } from '@dc-beauty/utils/currency';

const plnPrice = convertSeed(35, 'EUR', 'PLN'); // 35 EUR -> PLN
const currency = getBaseCurrencyByCountry('PL'); // 'PLN'
```

## Database Schema
The schema includes:
- **Multitenant structure** (salon isolation)
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
- `SEED_SERVICES_ENABLED` - Enable service library seeding
- `SEED_RATE_EUR_*` - Currency exchange rates for conversion
