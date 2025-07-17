# Database Package - TP-01 Completion

## Overview
This package contains the Prisma schema and database utilities for the Beauty Platform multitenant SaaS.

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
pnpm generate

# Создать миграции
pnpm migrate:dev --name init

# Запустить seed (создать демо данные)
SEED_CREATE=true pnpm seed
```

### 4. Verify Setup
```bash
# Открыть Prisma Studio для проверки данных
pnpm studio
```

## Seeds Created
- **Demo Salon**: "Demo Salon" with Polish locale support
- **Demo Staff**: "Anna Kowalska" (Master)
- **Demo Client**: "Maria Nowak" 
- **Services**: Polish beauty services from seed-services-pl.ts
- **Translations**: Auto-generated stubs for ru/uk/en (approved=false)

## Available Scripts
- `pnpm generate` - Generate Prisma Client
- `pnpm migrate:dev` - Create and apply development migrations
- `pnpm migrate:deploy` - Apply migrations to production
- `pnpm seed` - Run seed script (requires SEED_CREATE=true)
- `pnpm studio` - Open Prisma Studio

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
- `SEED_SALON_NIP` - NIP for demo salon (default: "0000000000")
