# TP-02: Tenant Middleware & Безопасная Мультитенантность

Реализация централизованного слоя изоляции данных для мультитенантной архитектуры Beauty Platform.

## Что реализовано

### ✅ T1: Поле slug в таблице salons
- Добавлено поле `slug` (TEXT UNIQUE NOT NULL) в модель Salon
- Миграция Prisma готова к применению

### ✅ T2: TypeScript типы для tenant context
- `RequestTenantContext` интерфейс с полями salonId, slug, plan, locales, role, userId, source
- `TENANTED_MODELS` константа для моделей с полем salonId
- Расширение Express Request через declaration merging

### ✅ T3: Утилиты загрузки конфигурации салона
- `getSalonConfigById()` и `getSalonConfigBySlug()` с кэшированием (TTL 5 мин)
- `extractSalonSlugFromHost()` для извлечения slug из hostname
- In-memory cache для оптимизации

### ✅ T4: Middleware resolveTenant
- Приоритеты источников tenant: JWT → Host → Header → Query
- Поддержка dev-режима с x-tenant-id override
- Production защита через INTERNAL_API_KEY

### ✅ T5: Helper requireTenant
- `requireTenant()` - проверка наличия tenant контекста (400 если нет)
- `requireAuthenticatedTenant()` - проверка auth + tenant
- `requireRole()` - проверка роли пользователя

### ✅ T6: tenantPrisma helper
- Автоматическое инжектирование `where: { salonId }` во все операции
- Поддержка find/create/update/delete/upsert операций
- Tenant mismatch protection - ошибка при конфликте salonId

### ✅ T7: Примеры API routes
- `/api/v1/clients`, `/api/v1/services`, `/api/v1/appointments`
- Демонстрация использования tenantPrisma и requireTenant
- Автоматическая фильтрация по текущему салону

### ✅ T8: Public Booking Router
- `/public/:slug/services` - услуги по slug салона
- `/public/:slug/staff` - мастера с фильтрацией по языкам
- `/public/:slug/appointments` - создание записи через публичный API
- `/public/:slug/availability` - проверка доступности слотов

### ✅ T9: Comprehensive тесты
- Тесты tenant resolution из разных источников
- Тесты изоляции данных между салонами
- Тесты public booking flow
- Тесты защиты от cross-tenant операций

## Использование

### 1. Применение middleware в Express app

```typescript
import { resolveTenant } from './middleware/resolveTenant';
import { requireTenant } from './middleware/requireTenant';

// Глобально применить resolveTenant
app.use(resolveTenant);

// Для protected endpoints
app.use('/api/v1', requireTenant);

// Для public booking
app.use('/public', publicBookingRouter);
```

### 2. Использование tenantPrisma в controllers

```typescript
import { createTenantPrisma } from './lib/tenantPrisma';

app.get('/api/v1/clients', requireTenant, async (req, res) => {
  const prisma = createTenantPrisma(req.tenant?.salonId);
  
  // Автоматически добавляется where: { salonId: req.tenant.salonId }
  const clients = await prisma.client.findMany(); 
  
  res.json(clients);
});
```

### 3. Источники tenant контекста

#### JWT (приоритет 1)
```http
Authorization: Bearer <jwt-with-tid-claim>
```

#### Hostname (приоритет 2)
```
Host: salon-slug.beauty.designcorp.eu
```

#### Header (приоритет 3, dev/server)
```http
x-tenant-id: salon_123
x-api-key: server_key  # для production
```

#### Query param (приоритет 4)
```
GET /api/endpoint?salon=salon_123
```

## Environment Variables

```env
# Production API key for server-to-server calls
INTERNAL_API_KEY=your_secret_server_key

# Database connection
DATABASE_URL=postgresql://user:pass@localhost:5432/beauty_dev

# Development mode (allows x-tenant-id without API key)
NODE_ENV=development
```

## Безопасность

### Автоматическая защита
- **Tenant isolation**: все TENANTED_MODELS автоматически фильтруются по salonId
- **Mismatch protection**: ошибка при попытке указать чужой salonId
- **Fail-fast**: 400 если нет tenant контекста для protected endpoint

### Примеры защищенных операций
```typescript
// ❌ НЕ БЕЗОПАСНО - прямое использование Prisma
const clients = await prisma.client.findMany(); // вернет ВСЕ клиенты

// ✅ БЕЗОПАСНО - через tenantPrisma
const clients = await tenantPrisma(salonId).client.findMany(); // только текущий салон
```

## Тестирование

```bash
# Установка зависимостей
pnpm install

# Применение миграций
pnpm db:migrate:dev --name tp02_add_salon_slug

# Обновление seed для демо салона
pnpm db:seed

# Запуск тестов
pnpm test:tenant

# Проверка типов
pnpm typecheck
```

## Acceptance Criteria ✅

- [x] Поле slug добавлено в салоны с UNIQUE ограничением
- [x] Tenant middleware резолвит контекст по приоритетам
- [x] tenantPrisma автоматически фильтрует по salonId
- [x] Public booking работает через slug без auth
- [x] Защита от cross-tenant утечек данных
- [x] Dev режим поддерживает x-tenant-id override
- [x] Все тесты проходят без ошибок

## Следующие шаги

После merge TP-02 можно переходить к:
- **TP-03**: Seed Library Services (автозаполнение услуг)
- **TP-04**: Онбординг API (создание салонов)
- **TP-05**: Language Resolver (мультиязычность)

---

**Автор**: Claude AI Assistant  
**Дата**: 2025-07-17  
**Версия**: TP-02 v1.0
