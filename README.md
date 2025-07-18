# Beauty Platform

Мультитенантная SaaS платформа для салонов красоты с онлайн бронированием, CRM и системой переводов.

## 🚀 Текущий статус проекта

### ✅ Завершенные этапы

- **TP-01: Database Schema** - Полная мультитенантная Prisma схема, 40+ услуг, валютная система
- **TP-02: Tenant Middleware** - Жёсткая изоляция данных по salonId, автоматическая фильтрация
- **TP-03: Service Library** - Библиотека услуг с валютной конвертацией, CLI команды
- **TP-04: Onboarding API** - Полный цикл регистрации салона, NIP lookup, Salon Passport

### 🔄 Текущий этап

- **TP-05: Language Resolver** - Система определения языка и переводов

### 📋 Следующие этапы

- **TP-06:** Messaging Hub (Telegram, Email, Web-чат)
- **TP-07:** Booking API v1 + Calendar Integration
- **TP-08:** n8n Workflows + Automation
- **TP-09:** Public Microsite + SEO

## 🛠 Техническая архитектура

**Сервер:** 135.181.156.117 `/var/www/beauty`
**Домен:** beauty.designcorp.eu (SSL: Let's Encrypt)
**Репозиторий:** https://github.com/DesignCorporation/beauty

### Apps структура
```
apps/
  ├── api/          # Express API сервер (:4000)
  ├── web-crm/      # React CRM админка (:5173) 
  ├── web-booking/  # React публичный сайт (:5174)
  └── scripts/      # CLI утилиты
packages/
  ├── db/           # Prisma schema + utilities
  ├── config/       # Общие конфигурации
  ├── ui/           # Компоненты интерфейса
  └── utils/        # Общие утилиты
```

### База данных
- **PostgreSQL:** beauty_dev (beauty:beauty)
- **Мультитенантность:** строгая изоляция по salonId
- **Модели:** 13 основных таблиц + translations
- **Валюты:** EUR/PLN/UAH/USD/GBP/CZK с конвертацией

## 📋 Требования

- Node.js >=18
- pnpm >=10
- Docker Desktop
- PostgreSQL 16+ (через Docker)
- Redis 7+ (через Docker)

## 🚀 Быстрый старт

1. **Клонируйте и установите зависимости**
   ```bash
   git clone https://github.com/DesignCorporation/beauty.git
   cd beauty
   pnpm install
   ```

2. **Настройте environment**
   ```bash
   cp .env.example .env
   # Настройте DATABASE_URL и валютные курсы
   ```

3. **Запустите базы данных**
   ```bash
   docker compose -f docker/docker-compose.dev.yml up -d
   ```

4. **Инициализируйте БД**
   ```bash
   cd packages/db
   pnpm generate
   pnpm migrate:dev --name init
   pnpm seed
   cd ../../
   ```

5. **Запустите все сервисы**
   ```bash
   pnpm dev
   ```

6. **Откройте в браузере**
   - CRM: http://localhost:5173
   - Booking: http://localhost:5174
   - API Health: http://localhost:4000/health
   - Adminer: http://localhost:8080

## 💻 Разработка

```bash
# Запуск в dev режиме
pnpm dev

# Сборка всех пакетов
pnpm build

# Линтинг и форматирование
pnpm lint
pnpm format

# Проверка типов
pnpm typecheck

# Работа с БД
cd packages/db
pnpm generate        # Генерация Prisma клиента
pnpm migrate:dev     # Новая миграция
pnpm migrate:deploy  # Применение в prod
pnpm studio          # Prisma Studio
pnpm seed            # Создание demo данных
pnpm seed:salon      # CLI для конкретного салона
```

## 🔒 Безопасность

- **Tenant Isolation:** автоматическая фильтрация по salonId
- **TENANTED_MODELS:** защита от утечки данных между салонами
- **JWT Authentication:** role-based access control
- **Public/Private API:** разделение эндпоинтов

## 🌍 Мультиязычность

- **Поддерживаемые языки:** Polish (каноничный), English, Ukrainian, Russian
- **Translation Bridge:** связь переводов с сущностями
- **Auto-translation:** готовность к интеграции с LLM
- **Глоссарий:** beauty-термины на 4 языках

## 💰 Валютная система

**Поддерживаемые валюты:** EUR, PLN, UAH, USD, GBP, CZK

**Environment переменные курсов:**
```bash
SEED_RATE_EUR_PLN=4.35
SEED_RATE_EUR_UAH=45.00
SEED_RATE_EUR_USD=1.08
SEED_RATE_EUR_GBP=0.84
SEED_RATE_EUR_CZK=25.00
```

## 📚 API документация

### Onboarding API
- `POST /onboarding/validate-nip` - валидация NIP
- `POST /onboarding/create-salon` - создание салона
- `PATCH /onboarding/:id/contact` - контактные данные
- `PATCH /onboarding/:id/hours` - часы работы
- `PATCH /onboarding/:id/social` - социальные сети
- `PATCH /onboarding/:id/locales` - языки
- `PATCH /onboarding/:id/plan` - тарифный план
- `POST /onboarding/:id/finalize` - завершение
- `GET /onboarding/:id/passport` - агрегированные данные

### Public Booking API
- `GET /public/:slug/services` - услуги салона
- `GET /public/:slug/staff` - мастера
- `GET /public/:slug/availability` - доступные слоты
- `POST /public/:slug/booking` - создание записи

## 🧪 Тестирование

```bash
# Запуск тестов
pnpm test

# E2E тестирование конкретного TP
pnpm test:tp01  # Database + Seed
pnpm test:tp02  # Tenant Isolation
pnpm test:tp04  # Onboarding Flow
```

## 🔧 Технологии

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL, Prisma ORM
- **Cache**: Redis
- **Monorepo**: pnpm workspaces
- **CI/CD**: GitHub Actions
- **Containerization**: Docker Compose
- **Authentication**: JWT with role-based access
- **Translations**: Custom bridge system

## 📊 Производительность

- **Query Optimization:** 87% улучшение (25+ → 3 запроса)
- **Redis Caching:** salon config кэширование
- **Batch Operations:** объединение SQL запросов
- **Tenant Filtering:** автоматическая оптимизация

## 🎯 Standards

- **TypeScript strict mode** везде
- **Prisma** для всех DB операций
- **Express middlewares** для общей логики
- **Structured errors** с HTTP кодами
- **Feature branches:** `feature/tp-XX-description`
- **E2E tests** для каждого TP этапа

## 📝 Git Workflow

```bash
# Создание feature branch
git checkout -b feature/tp-06-messaging-hub

# Коммиты с префиксами
git commit -m "feat(api): add telegram webhook endpoint"
git commit -m "fix(db): resolve tenant isolation issue"
git commit -m "docs: update API documentation"

# Push и PR
git push origin feature/tp-06-messaging-hub
```

## 🚨 Подключение к серверу

```powershell
# SSH подключение
ssh root@135.181.156.117

# Или через plink (Windows)
Start-Process -FilePath "C:\temp\plink.exe" -ArgumentList "-ssh","root@135.181.156.117","-pw","6831Grey!","-batch","cd /var/www/beauty && git status"
```

## 📈 Roadmap

### MVP (завершен)
- ✅ Мультитенантная архитектура
- ✅ Система услуг и переводов
- ✅ Onboarding API
- ✅ Безопасность данных

### Phase 1 (в разработке)
- 🔄 Language Resolver
- ⏳ Messaging Hub
- ⏳ Booking API
- ⏳ Workflows

### Phase 2 (планируется)
- ⏳ Public Microsite
- ⏳ Analytics Dashboard
- ⏳ Mobile Apps
- ⏳ Advanced AI Features

---

Разработано командой DesignCorporation для революции в индустрии красоты 💄✨

**Contacts:** beauty@designcorp.eu
**Documentation:** В разработке
**License:** Proprietary