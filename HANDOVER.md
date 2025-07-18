# Beauty Platform - Handover Documentation

**Дата обновления:** 2025-07-18
**Автор:** Claude (DesignCorporation Assistant)
**Цель:** Обеспечить непрерывность работы над проектом при смене контекста/чата

## 📋 Краткий статус проекта

### ✅ Завершенные этапы (готовы к production)

**TP-01: Database Schema**
- Полная Prisma схема для мультитенантности
- 13 основных таблиц (salons, staff, clients, services, appointments, etc.)
- Библиотека 40+ услуг с переводами на 4 языка
- Валютная система: EUR/PLN/UAH/USD/GBP/CZK
- Seed данные: Demo Salon готов к тестированию

**TP-02: Tenant Middleware**
- Критическая безопасность: 100% изоляция данных между салонами
- tenantPrisma helper с автоматической фильтрацией по salonId
- Приоритеты источников tenant: JWT → Host → Header → Query
- Public booking API с slug-based resolution
- TENANTED_MODELS константа для защиты

**TP-03: Service Library**
- CLI команда: `pnpm seed:salon <nip|salonId>`
- 8 категорий услуг: hair, nails, brows_lashes, face, wax, barber, spa, package
- Валютная конвертация через env rates (SEED_RATE_EUR_PLN=4.35)
- Upsert логика предотвращает дубликаты

**TP-04: Onboarding API**
- 9 эндпоинтов полного цикла: validate-nip → finalize
- NIP lookup service для Poland/Ukraine
- Автоопределение базовой валюты по стране
- Salon Passport - агрегированный JSON всех данных
- E2E тестирование работает

### 🔄 Текущий этап

**TP-05: Language Resolver** (в разработке)
- resolveLocale функция с приоритетами
- Translation Bridge для связи переводов с сущностями
- Глоссарий beauty-терминов на 4 языках
- Auto-translation integration готовность

## 🛠 Техническая информация

### Серверная инфраструктура
- **Сервер:** 135.181.156.117
- **Проект:** `/var/www/beauty`
- **SSH:** `ssh root@135.181.156.117` (пароль: 6831Grey!)
- **База:** PostgreSQL beauty_dev (beauty:beauty)
- **Домен:** beauty.designcorp.eu (SSL настроен)

### Структура портов
- **API:** :4000 (Express backend)
- **CRM:** :5173 (React админка)
- **Booking:** :5174 (React публичный сайт)
- **Adminer:** :8080 (БД интерфейс)
- **PostgreSQL:** :5432
- **Redis:** :6379

### Nginx routing
```nginx
/api/ → :4000
/crm/ → :5173
/ → :5174
```

## 🗂 Важные файлы и команды

### Базовые команды для работы
```bash
# Подключение к серверу
ssh root@135.181.156.117

# Переход в проект
cd /var/www/beauty

# Обновление кода
git pull origin main
pnpm install

# Запуск сервисов
pnpm dev

# Работа с БД
cd packages/db
pnpm generate
pnpm migrate:dev
pnpm seed
```

### Ключевые файлы конфигурации
- `packages/db/prisma/schema.prisma` - схема БД
- `apps/api/src/middleware/tenant.ts` - tenant middleware
- `packages/db/src/seed/serviceLibrary.ts` - библиотека услуг
- `apps/api/src/routes/onboarding.ts` - onboarding API
- `.env` - переменные окружения

### Environment переменные
```bash
DATABASE_URL="postgresql://beauty:beauty@localhost:5432/beauty_dev"
REDIS_URL="redis://localhost:6379"
SEED_RATE_EUR_PLN=4.35
SEED_RATE_EUR_UAH=45.00
SEED_RATE_EUR_USD=1.08
SEED_RATE_EUR_GBP=0.84
SEED_RATE_EUR_CZK=25.00
```

## 📚 Архитектурные принципы

### Tenant Isolation (КРИТИЧНО!)
- Все запросы к TENANTED_MODELS автоматически фильтруются по salonId
- Модели с tenant isolation: Staff, Client, Service, ServiceTranslation, Appointment, etc.
- tenantPrisma(salonId) helper обязателен для всех DB операций
- req.tenant устанавливается в middleware

### Мультиязычность
- Таблица `translations` для всех переводов
- Поддержка: pl (каноничный), en, uk, ru
- ensureServiceTranslation для автосоздания переводов
- Глоссарий beauty-терминов

### Валютная система
- salon.baseCurrency определяется по стране при онбординге
- Каждая цена хранится с валютой (price_amount + price_currency)
- Конвертация через env rates с fallback 1:1

## 🎯 Следующие этапы (приоритеты)

### TP-05: Language Resolver (ТЕКУЩИЙ)
- Завершить resolveLocale функцию
- Добавить Redis кэширование переводов
- Интегрировать с API эндпоинтами
- Unit тесты L01-L10

### TP-06: Messaging Hub
- Telegram Bot webhook
- Email отправка через SMTP
- Web-чат Socket.io
- Таблица message_log

### TP-07: Booking API v1
- Публичные эндпоинты для бронирования
- Календарная система
- Проверка доступности слотов
- Double-booking защита

### TP-08: n8n Workflows
- reminder_24h, reminder_2h
- birthday, winback_90d
- Интеграция с Messaging Hub

### TP-09: Public Microsite
- Next.js приложение
- SEO оптимизация
- Встраиваемый widget
- Мультиязычный интерфейс

## 🚨 Критические моменты для продолжения

### Безопасность данных
- **НИКОГДА** не используйте прямые Prisma запросы без tenant фильтрации
- Всегда используйте `tenantPrisma(req.tenant.salonId)`
- Проверяйте req.tenant?.salonId перед операциями

### Стандарты разработки
- TypeScript strict mode везде
- Feature branches: `feature/tp-XX-description`
- Коммиты с префиксами: `feat:`, `fix:`, `docs:`
- E2E тесты для каждого TP

### Тестирование
```bash
# Проверка tenant isolation
pnpm test:tenant

# E2E тестирование онбординга
pnpm test:onboarding

# Полный набор тестов
pnpm test
```

## 📞 Контакты и ресурсы

### GitHub
- **Репозиторий:** https://github.com/DesignCorporation/beauty
- **Issues:** Используйте GitHub Issues для багов
- **Документация:** README.md обновляется регулярно

### Команда
- **Project Lead:** DesignCorporation
- **Email:** beauty@designcorp.eu
- **Assistant:** Claude (сохранено в memory для continuity)

## 🔄 Инструкции для нового Assistant

1. **Прочитайте memory:** `read_graph` для полного контекста
2. **Проверьте status:** `git status` и `pnpm install`
3. **Запустите тесты:** `pnpm test` для проверки
4. **Изучите TP-05:** фокус на Language Resolver
5. **Обновляйте memory:** после важных изменений

### Команды для быстрого старта
```bash
# Вход на сервер
ssh root@135.181.156.117

# Статус проекта
cd /var/www/beauty && git status && pnpm test

# Запуск dev окружения
pnpm dev

# Проверка БД
cd packages/db && pnpm studio
```

---

**Важно:** Этот документ обновляется при каждом важном изменении. При работе с другим Assistant - начните с чтения memory и этого файла.

**Последнее обновление:** 2025-07-18 20:15 UTC