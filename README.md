# Beauty Platform

Мультитенантная SaaS платформа для салонов красоты с онлайн бронированием, CRM и системой переводов.

## 🚀 Текущий статус проекта

### ✅ Завершенные этапы

- **TP-01: Database Schema** - Полная мультитенантная Prisma схема, 40+ услуг, валютная система
- **TP-02: Tenant Middleware** - Жёсткая изоляция данных по salonId, автоматическая фильтрация
- **TP-03: Service Library** - Библиотека услуг с валютной конвертацией, CLI команды
- **TP-04: Onboarding API** - Полный цикл регистрации салона, NIP lookup, Salon Passport
- **TP-05: Language Resolver** - Система определения языка и переводов
- **TP-06: Messaging Hub** - Telegram, Email, Web-чат интеграции (PR #3)
- **TP-07: Booking API v1** - Публичные эндпоинты бронирования + E2E тесты
- **TP-08: n8n Workflows** - Автоматизация lifecycle коммуникаций (24h/2h reminders, birthday, winback)
- **TP-09: Public Microsite** - Next.js фронтенд + встраиваемый виджет (Lighthouse ≥80)

### 🔄 Следующие этапы

- **TP-10:** Global Admin Panel (планируется)

## 🌐 Production deployment

### Live URLs
- **GitHub Pages:** https://designcorporation.github.io/beauty
- **Widget Demo:** https://designcorporation.github.io/beauty/demo-salon
- **API Endpoint:** https://api.beauty.designcorp.eu

### Auto-Deploy Pipeline
- ✅ **GitHub Actions:** Auto-deploy on push to main
- ✅ **Lighthouse CI:** Mobile performance ≥80 validation
- ✅ **Corepack Support:** Automatic pnpm version management
- ✅ **Widget Distribution:** Automatic `/dist/widget.js` copying

## 📋 Требования

- **Node.js** >=18 (см. .nvmrc)
- **pnpm** >=10 (управляется через corepack)
- **Docker Desktop**
- **PostgreSQL** 16+ (через Docker)
- **Redis** 7+ (через Docker)

### Package Manager Setup

Проект использует **corepack** для автоматического управления версией pnpm:

```bash
# Включите corepack (если еще не включен)
corepack enable

# Проект автоматически использует pnpm@10.17.0
pnpm --version  # должно показать 10.17.0 или выше
```

> ❗ **Важно:** Если получаете ошибку "pnpm 8.x is not compatible with engines.pnpm >=10.0.0", убедитесь что corepack включен.

## 🚀 Быстрый старт

1. **Клонируйте и настройте package manager**
   ```bash
   git clone https://github.com/DesignCorporation/beauty.git
   cd beauty
   
   # Включите corepack для автоматического управления pnpm
   corepack enable
   
   # Установите зависимости
   pnpm install
   ```

2. **Настройте environment**
   ```bash
   cp .env.example .env
   # Настройте DATABASE_URL и валютные курсы
   ```

3. **Запустите базы данных и n8n**
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
   - n8n Dashboard: http://localhost:5678
   - Adminer: http://localhost:8080

## 🛠 Техническая архитектура

**Сервер:** 135.181.156.117 `/var/www/beauty`
**Домен:** beauty.designcorp.eu (SSL: Let's Encrypt)
**Репозиторий:** https://github.com/DesignCorporation/beauty

### Apps структура
```
apps/
  ├── api/          # Express API сервер (:4000)
  ├── web-crm/      # React CRM админка (:5173) 
  ├── web-booking/  # Next.js публичный сайт (:5174)
  └── scripts/      # CLI утилиты
packages/
  ├── db/           # Prisma schema + utilities
  ├── config/       # Общие конфигурации
  ├── ui/           # Компоненты интерфейса
  └── utils/        # Общие утилиты
docker/
  └── n8n/          # n8n workflow automation (:5678)
```

### База данных
- **PostgreSQL:** beauty_dev (beauty:beauty)
- **Мультитенантность:** строгая изоляция по salonId
- **Модели:** 13 основных таблиц + translations
- **Валюты:** EUR/PLN/UAH/USD/GBP/CZK с конвертацией

## 💻 Разработка

```bash
# Запуск в dev режиме
pnpm dev

# Сборка всех пакетов
pnpm build

# Линтинг и проверка типов
pnpm lint
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

## 🔧 Устранение проблем

### pnpm версии не совпадают
```bash
# Если получаете ошибку "pnpm 8.x is not compatible"
corepack enable
corepack prepare pnpm@10.17.0 --activate

# Проверьте версию
pnpm --version  # должно быть >=10.0.0
```

### CI/CD ошибки
- GitHub Actions автоматически использует corepack
- Убедитесь что поле `packageManager` присутствует в package.json
- Локально проверьте: `pnpm typecheck && pnpm build`

### Проблемы с workspace dependencies
```bash
# Очистите кэши и переустановите
pnpm store prune
rm -rf node_modules apps/*/node_modules packages/*/node_modules
pnpm install
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

## 🤖 n8n Automation (TP-08)

### Workflow Templates
- **24h Reminder**: Daily 07:00 UTC → appointment reminders
- **2h Urgent Reminder**: Every 30min → urgent notifications
- **Birthday Wishes**: Daily 09:00 UTC → birthday greetings
- **Winback 90d**: Weekly Mon 10:00 UTC → client retention

### n8n Dashboard
```
URL: http://localhost:5678
User: admin@beauty.designcorp.eu
Pass: BeautyN8N2025!
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

### Public Booking API v1
- `GET /public/:slug/services?locale=ru` - услуги салона (мультиязычные)
- `GET /public/:slug/staff?lang=ru` - мастера с языковыми флагами
- `GET /public/:slug/availability` - доступные слоты с business hours
- `POST /public/:slug/booking` - создание записи (double-booking защита)
- `POST /public/:slug/booking/:id/cancel` - отмена записи
- `POST /public/:slug/booking/:id/reschedule` - перенос записи

### Messaging API (TP-06)
- `POST /api/v1/messaging/send` - отправка сообщения
- `POST /api/v1/messaging/send-bulk` - массовая отправка
- `GET /api/v1/messaging/history` - история сообщений
- `GET /api/v1/messaging/stats` - статистика сообщений
- `POST /webhooks/telegram` - Telegram Bot webhook
- `POST /webhooks/email` - Email inbound webhook
- `WebSocket /messaging/webchat` - Real-time WebChat

## 🧪 Тестирование

```bash
# Запуск всех тестов
pnpm test

# E2E тестирование по этапам
pnpm test:tp01  # Database + Seed
pnpm test:tp02  # Tenant Isolation
pnpm test:tp04  # Onboarding Flow
pnpm test:tp06  # Messaging Hub
pnpm test:tp07  # Booking API (5 частей)
pnpm test:tp08  # n8n Workflows
```

## 📱 Messaging Hub (TP-06)

### Каналы связи
- **Telegram Bot API**: Webhooks, rich formatting, автоответы
- **Email SMTP**: HTML templates, delivery tracking
- **WebChat Socket.io**: Real-time communication, salon rooms

### Ключевые особенности
- **Rate Limiting**: Redis token bucket (60 msg/min)
- **Template Engine**: Мультиязычные шаблоны
- **Bulk Operations**: Оптимизированная массовая отправка
- **Message Logging**: Полная история с метаданными
- **Security**: Webhook verification, tenant isolation

## 🔧 Технологии

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Next.js 14
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL, Prisma ORM
- **Cache**: Redis
- **Real-time**: Socket.io
- **Automation**: n8n workflows
- **Monorepo**: pnpm workspaces
- **CI/CD**: GitHub Actions, corepack
- **Containerization**: Docker Compose
- **Authentication**: JWT with role-based access
- **Translations**: Custom bridge system

## 📊 Производительность

- **Query Optimization:** 87% улучшение (25+ → 3 запроса)
- **Redis Caching:** salon config кэширование
- **Batch Operations:** объединение SQL запросов
- **Tenant Filtering:** автоматическая оптимизация
- **Message Processing:** Async delivery с retry logic
- **n8n Workflows:** 500 executions/hour per workflow

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
git checkout -b feature/tp-09-public-microsite

# Коммиты с префиксами
git commit -m "feat(api): add public microsite endpoints"
git commit -m "fix(db): resolve tenant isolation issue"
git commit -m "docs: update API documentation"

# Push и PR
git push origin feature/tp-09-public-microsite
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
- ✅ Language Resolver
- ✅ Messaging Hub (Telegram + Email + WebChat)
- ✅ Booking API v1 + E2E тесты
- ✅ n8n Workflows (24h/2h reminders, birthday, winback)
- ✅ Public Microsite + Widget (TP-09)

### Phase 1 (планируется)
- ⏳ Global Admin Panel (TP-10)

### Phase 2 (будущее)
- ⏳ Analytics Dashboard
- ⏳ Mobile Apps
- ⏳ Advanced AI Features
- ⏳ Multi-salon Management

---

Разработано командой DesignCorporation для революции в индустрии красоты 💄✨

**Contacts:** beauty@designcorp.eu
**Documentation:** В разработке
**License:** Proprietary
