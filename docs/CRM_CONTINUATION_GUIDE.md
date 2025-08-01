# Beauty Platform CRM - Инструкции для продолжения работы

> 🤖 **Для AI помощников**: Данный файл содержит контекст и инструкции для продолжения анализа Fresha CRM и разработки Beauty Platform CRM

## 📊 Текущий статус

### ✅ Что уже проанализировано (57/57 скриншотов) - ЗАВЕРШЕНО!

**Основные модули:**
1. **Каталог услуг** - управление сервисами, категории, ценообразование
2. **Система подписок** - программы членства и лояльности  
3. **Управление товарами** - инвентарь и складские запасы
4. **Автоматизация n8n** - 8 типов автоматических сообщений
5. **Управление командой** - персонал, роли, рейтинги
6. **Маркетинг** - скидки, акции, динамические цены, отзывы
7. **Онлайн-бронирование** - конструктор ссылок, виджеты
8. **Push-уведомления** - мобильные нотификации

**Финальные модули (разделы 41-57):**
9. **Источники клиентов** - трекинг каналов привлечения (Instagram, Google, Facebook)
10. **Расширенный каталог услуг** - категоризация, отображение с ценами
11. **Детальный редактор услуг** - настройки типов сервисов, времени, буферов
12. **Система кастомных форм** - создание форм для услуг (COVID-19, согласия)
13. **Комиссионная система** - автоматический расчет комиссий персонала
14. **Финансовая панель** - баланс компании, платежные системы, банковские счета
15. **Глобальный поиск** - поиск по клиентам, записям, услугам, сотрудникам
16. **Боковая панель визитов** - быстрый доступ к записям на даты
17. **Социальные профили мастеров** - Instagram, TikTok, Facebook интеграция
18. **Портфолио мастеров** - галерея работ для демонстрации навыков
19. **Система отзывов и рейтингов** - сбор и модерация отзывов клиентов
20. **Календарь с расширенными фильтрами** - фильтрация по статусам, типам, каналам
21. **WhatsApp автоматизация** - интеграция с n8n для уведомлений
22. **Мультиворкспейс управление** - работа с несколькими салонами
23. **Расширенные настройки услуг** - налоги, уведомления, SKU, ограничения
24. **Промо-инструменты** - маркетинговые баннеры и кампании
25. **Персональные настройки** - управление аккаунтом, безопасность, локализация

### 🎯 Полная спецификация готова!

Все 57 функций CRM системы проанализированы и задокументированы в разделах 1-40 (базовые) + 41-57 (финальные).

---

## 🚀 ФИНАЛЬНЫЕ РАЗДЕЛЫ 41-57 (Дополнительный анализ)

### 41. Источники клиентов (Client Source Tracking)
**Приоритет**: HIGH  
**Интеграция**: Client, Marketing Analytics

**Функциональность**:
- Отслеживание каналов привлечения клиентов
- Поддержка источников: Без предварительной записи, Instagram, Google, Facebook, Fresha Marketplace, Импорт
- UTM-параметры для digital-маркетинга
- Аналитика эффективности каналов

**Техническая реализация**:
```typescript
// Новая модель в schema.prisma
model ClientSource {
  id          String   @id @default(cuid())
  salonId     String   // tenant isolation
  clientId    String
  sourceType  SourceType
  sourceName  String?
  utmCampaign String?
  utmMedium   String?
  utmSource   String?
  referrer    String?
  createdAt   DateTime @default(now())
  
  salon       Salon    @relation(fields: [salonId], references: [id], onDelete: Cascade)
  client      Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)
  
  @@index([salonId])
  @@map("client_sources")
}

enum SourceType {
  WALK_IN
  INSTAGRAM
  GOOGLE
  FACEBOOK
  MARKETPLACE
  IMPORT
  REFERRAL
  WEBSITE
}
```

### 42. Каталог услуг с детальным отображением
**Приоритет**: HIGH  
**Интеграция**: Service, Pricing, Categories

**Функциональность**:
- Структурированное отображение услуг по категориям
- Отображение времени, цены, валюты
- Поддержка множественных категорий
- Быстрое редактирование из списка

**Техническая реализация**:
```typescript
model ServiceCategory {
  id          String @id @default(cuid())
  salonId     String
  name        String
  displayName String
  sortOrder   Int    @default(0)
  color       String?
  icon        String?
  active      Boolean @default(true)
  
  salon       Salon @relation(fields: [salonId], references: [id], onDelete: Cascade)
  services    Service[]
  
  @@index([salonId])
  @@unique([salonId, name])
  @@map("service_categories")
}
```

### 43. Расширенный редактор услуг
**Приоритет**: HIGH  
**Интеграция**: Service, Translation, Pricing

**Функциональность**:
- Детальные настройки услуг (тип сервиса, категория)
- Многоязычные описания
- Настройка ценообразования
- Валидация бизнес-правил

### 44. Система кастомных форм
**Приоритет**: MEDIUM  
**Интеграция**: Service, Client, Appointments

**Функциональность**:
- Создание кастомных форм для услуг
- Поддержка различных типов полей
- Интеграция с процессом бронирования
- Сохранение ответов клиентов

### 45. Комиссионная система
**Приоритет**: MEDIUM  
**Интеграция**: Staff, Service, Appointments, Payments

**Функциональность**:
- Настройка комиссий по сотрудникам и услугам
- Автоматический расчет комиссий
- Отчеты по комиссиям
- Поддержка различных схем (процент, фиксированная сумма)

### 46. Финансовая панель и управление платежами
**Приоритет**: HIGH  
**Интеграция**: Payments, Reports, Multi-currency

**Функциональность**:
- Отображение баланса компании
- Интеграция с платежными системами
- Управление банковскими счетами
- Отчеты по доходам и расходам

### 47. Глобальный поиск и навигация
**Приоритет**: HIGH  
**Интеграция**: All modules, Search Engine

**Функциональность**:
- Поиск по клиентам, записям, услугам, сотрудникам
- Быстрые результаты с предпросмотром
- Интеллектуальные предложения
- История поиска

### 48. Боковая панель визитов и быстрый доступ
**Приоритет**: MEDIUM  
**Интеграция**: Appointments, Calendar, UX

**Функциональность**:
- Быстрый доступ к записям на выбранную дату
- Контекстная информация о клиентах
- Быстрые действия (отмена, перенос, завершение)

### 49. Социальные профили мастеров
**Приоритет**: LOW  
**Интеграция**: Staff, Marketing, Public Profiles

**Функциональность**:
- Привязка Instagram, TikTok, Facebook к профилю мастера
- Отображение в публичном профиле салона
- Интеграция с маркетинговыми кампаниями

### 50. Портфолио мастера
**Приоритет**: LOW  
**Интеграция**: Staff, File Upload, Public Profiles

**Функциональность**:
- Загрузка фотографий работ
- Категоризация по типам услуг
- Публичное отображение в профиле салона
- Модерация контента

### 51. Система отзывов и рейтингов
**Приоритет**: MEDIUM  
**Интеграция**: Client, Appointment, Reputation Management

**Функциональность**:
- Сбор отзывов после визита
- Система рейтингов (1-5 звезд)
- Модерация отзывов
- Публичное отображение на сайте салона

### 52. Календарь с расширенными фильтрами
**Приоритет**: HIGH  
**Интеграция**: Appointments, Staff, Services, Payments

**Функциональность**:
- Фильтрация по статусу назначения
- Фильтр по типу услуг
- Фильтр по каналам бронирования
- Фильтр по статусу платежа
- Фильтр по сотрудникам

### 53. WhatsApp автоматизация и уведомления
**Приоритет**: LOW  
**Интеграция**: Messaging Hub, n8n Workflows, TP-06

**Функциональность**:
- Автоматические уведомления через WhatsApp
- Напоминания о записях
- Подтверждения бронирования
- Интеграция с n8n для сложных сценариев

### 54. Многоворкспейсовое управление
**Приоритет**: LOW  
**Интеграция**: User Management, Multi-tenant Architecture

**Функциональность**:
- Управление несколькими салонами/компаниями
- Переключение между воркспейсами
- Централизованное управление пользователями
- Роли и права доступа

### 55. Расширенные настройки услуг и уведомлений
**Приоритет**: MEDIUM  
**Интеграция**: Service, Notifications, Tax Management

**Функциональность**:
- Настройка уведомлений для перебронирования
- Управление налогами с продаж
- Настройка SKU для интеграций
- Автоматические напоминания клиентам

### 56. Промо-блоки и маркетинговые инструменты
**Приоритет**: LOW  
**Интеграция**: Marketing, Public Website, Client Acquisition

**Функциональность**:
- Создание промо-блоков для привлечения клиентов
- Интеграция с онлайн-бронированием
- A/B тестирование промо-материалов
- Аналитика конверсий

### 57. Персональные настройки аккаунта
**Приоритет**: LOW  
**Интеграция**: User Management, Security, Localization

**Функциональность**:
- Управление личными данными
- Настройки безопасности (2FA, пароли)
- Языковые предпочтения
- Уведомления и приватность

---

## 📋 План реализации CRM (TP-21 → TP-35)

### Фаза 1: Критичные функции (TP-21 → TP-25)
**Срок**: 4-6 недель

**HIGH Priority функции**:
1. **Источники клиентов** (TP-21) - базовая аналитика маркетинга
2. **Каталог услуг** (TP-22) - улучшенное отображение
3. **Расширенный редактор услуг** (TP-23) - детальная настройка
4. **Календарь с фильтрами** (TP-24) - основной инструмент работы
5. **Глобальный поиск** (TP-25) - критично для UX

### Фаза 2: Функциональная полнота (TP-26 → TP-30)
**Срок**: 6-8 недель

**MEDIUM Priority функции**:
1. **Система форм** (TP-26) - кастомизация процессов
2. **Комиссионная система** (TP-27) - мотивация персонала
3. **Финансовая панель** (TP-28) - управление деньгами
4. **Система отзывов** (TP-29) - репутационный менеджмент
5. **Расширенные настройки услуг** (TP-30) - детальная конфигурация

### Фаза 3: Дополнительные возможности (TP-31 → TP-35)
**Срок**: 4-6 недель

**LOW Priority функции**:
1. **Социальные профили** (TP-31) - маркетинговая интеграция
2. **Портфолио мастеров** (TP-32) - презентационные возможности
3. **WhatsApp автоматизация** (TP-33) - расширенные уведомления
4. **Промо-инструменты** (TP-34) - маркетинговые кампании
5. **Персональные настройки** (TP-35) - пользовательский опыт

---

## 🏗️ Архитектурный контекст

### Beauty Platform Foundation (уже реализовано)

```
TP-01: Database Schema      ✅ Мультитенантная Prisma схема
TP-02: Tenant Middleware    ✅ Изоляция данных по salonId  
TP-03: Service Library      ✅ 40+ услуг, валютная система
TP-04: Onboarding API       ✅ Регистрация салонов
TP-05: Language Resolver    ✅ Мультиязычность PL/EN/UA/RU
TP-06: Messaging Hub        ✅ Telegram + Email + WebChat
TP-07: Booking API v1       ✅ Публичное бронирование
TP-08: n8n Workflows        ✅ Автоматизация lifecycles
TP-09: Public Microsite     ✅ Next.js фронтенд + виджет
```

### CRM Architecture Target

```
apps/web-crm/
├── src/
│   ├── components/
│   │   ├── calendar/         # Календарные виды + фильтры
│   │   ├── services/         # Управление услугами + категории
│   │   ├── clients/          # База клиентов + источники
│   │   ├── team/            # Управление персоналом + комиссии
│   │   ├── automation/      # n8n интеграция + WhatsApp
│   │   ├── marketing/       # Кампании + промо + отзывы
│   │   ├── reports/         # Аналитика + финансы
│   │   ├── settings/        # Настройки салона + формы
│   │   └── common/          # Глобальный поиск + навигация
│   ├── hooks/
│   │   ├── useTenant.ts     # Tenant context (ОБЯЗАТЕЛЬНО!)
│   │   ├── useLocale.ts     # Мультиязычность
│   │   └── usePermissions.ts # Права доступа
│   └── api/
│       ├── tenant.ts        # Tenant-scoped запросы
│       └── automation.ts    # n8n интеграция
```

## 🔒 Критические принципы безопасности

### ОБЯЗАТЕЛЬНО для всех CRM компонентов:

```typescript
// ✅ ПРАВИЛЬНО: Используй tenantPrisma
const useTenantAPI = () => {
  const { salonId } = useTenant();
  const tprisma = tenantPrisma(salonId);
  
  return {
    getServices: () => tprisma.service.findMany(),
    getClients: () => tprisma.client.findMany(),
    // Автоматическая фильтрация по salonId
  };
};

// ❌ ОПАСНО: Прямые запросы без tenant
const badAPI = () => {
  return {
    getServices: () => prisma.service.findMany(), // НИКОГДА!
    // Это вернет услуги ВСЕХ салонов!
  };
};
```

### Tenant-scoped модели (автоматически фильтруются):
```typescript
export const TENANTED_MODELS = new Set([
  'Staff', 'Client', 'Service', 'ServiceTranslation',
  'Appointment', 'AppointmentService', 'TimeOff', 
  'MessageLog', 'AgentSkill', 'SalonSocialLinks',
  // Новые модели из разделов 41-57:
  'ClientSource', 'ServiceCategory', 'ServiceForm',
  'CommissionRule', 'Commission', 'SalonAccount',
  'Transaction', 'Review', 'Portfolio', 'MarketingBanner'
]);
```

## 🌍 Мультиязычность

### Language Resolver интеграция:
```typescript
// Используй TP-05 систему определения языка
const useLocaleContext = () => {
  return {
    // UI язык CRM
    crmLocale: resolveLocale({
      client: { preferredLocale: userSettings.locale },
      salon: { supportedLocales, publicDefaultLocale }
    }),
    
    // Язык для сообщений клиенту  
    getClientLocale: (clientId) => resolveLocale({
      client: { preferredLocale: client.preferredLocale },
      salon: { supportedLocales, primaryLocale }
    })
  };
};
```

### Поддерживаемые языки:
- 🇵🇱 **Polish** (каноничный) - `pl`
- 🇬🇧 **English** - `en` 
- 🇺🇦 **Ukrainian** - `uk`
- 🇷🇺 **Russian** - `ru`

## 💰 Валютная система

### Multi-currency support:
- **EUR** - Euro (базовая валюта библиотеки услуг)
- **PLN** - Polish Złoty  
- **UAH** - Ukrainian Hryvnia
- **USD** - US Dollar
- **GBP** - British Pound
- **CZK** - Czech Koruna

### Использование в CRM:
```typescript
const useCurrencyFormatter = () => {
  const { baseCurrency } = useTenant();
  
  return {
    formatPrice: (amount: number) => {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: baseCurrency
      }).format(amount);
    }
  };
};
```

## 🎨 UI/UX Guidelines (Fresha-inspired)

### Цветовая схема:
```css
:root {
  --primary-500: #6366f1;     /* Основной фиолетовый */
  --primary-600: #4f46e5;     /* Hover состояния */
  --primary-700: #4338ca;     /* Active состояния */
  
  --gray-50: #f9fafb;         /* Основной фон */
  --gray-100: #f3f4f6;        /* Фон карточек */
  --gray-900: #111827;        /* Заголовки */
  
  --success-500: #10b981;     /* Выполнено */
  --warning-500: #f59e0b;     /* В ожидании */
  --sky-300: #7dd3fc;         /* Календарные блоки */
}
```

### Структура навигации:
```
🏠 Главная (Dashboard)
📅 Календарь → [Расширенные фильтры, Боковая панель визитов]
🏷️ Каталог → [Услуги с категориями, Формы, Членство, Товары, Склад, Поставщики]
📊 Сообщения → [Кампании, Автоматизация + WhatsApp, История, Продвижение]  
👥 Команда → [Мастера + Социальные профили + Портфолио, Смены, Сроки, Комиссии]
😊 Клиенты → [База клиентов, Источники, Отзывы]
💰 Продажи/Отчеты → [Финансовая панель, Аналитика]
⚙️ Настройки → [Промо-инструменты, Персональные настройки]
🔍 Глобальный поиск
```

## 🤖 n8n Интеграция

### Существующие workflows (TP-08):
1. **reminder_24h** - напоминания за 24 часа
2. **reminder_2h** - срочные напоминания за 2 часа  
3. **birthday** - поздравления с днем рождения
4. **winback_90d** - возврат неактивных клиентов

### Новые workflows (разделы 41-57):
5. **whatsapp_booking_confirmation** - подтверждения через WhatsApp
6. **whatsapp_reminder_24h** - напоминания через WhatsApp
7. **commission_calculation** - автоматический расчет комиссий
8. **review_request** - запросы отзывов после визита

### CRM должен показывать:
```typescript
interface AutomationStatus {
  workflowId: string;
  name: string;
  type: 'reminder' | 'marketing' | 'loyalty' | 'winback' | 'whatsapp' | 'commission';
  enabled: boolean;
  lastExecution?: Date;
  executionCount: number;
  errorCount: number;
}
```

## 📚 Справочные материалы

### Репозиторий:
- **URL**: https://github.com/DesignCorporation/beauty
- **Основная документация**: README.md
- **CRM спецификация**: docs/CRM_TECHNICAL_SPECIFICATION.md
- **Этот файл**: docs/CRM_CONTINUATION_GUIDE.md

### Live Demo:
- **Микросайт**: https://designcorporation.github.io/beauty/demo-salon
- **Виджет**: https://designcorporation.github.io/beauty/dist/widget.js

### Ключевые файлы для изучения:
```
packages/db/prisma/schema.prisma    # Схема БД
apps/api/src/middleware/tenant.ts   # Tenant middleware  
packages/db/src/serviceLibrary.ts   # Библиотека услуг
apps/api/src/routes/onboarding.ts   # Onboarding API
apps/api/src/routes/booking.ts      # Public Booking API
```

---

## 🎯 АНАЛИЗ ЗАВЕРШЕН!

**Статус**: ✅ Все 57 функций CRM системы проанализированы и задокументированы
**Готово к реализации**: Полная техническая спецификация для Beauty Platform CRM

### Итоговая статистика:
- **57 функций CRM** - полностью проанализированы
- **25 новых модулей** (разделы 41-57) - готовы к разработке
- **3 фазы реализации** (TP-21 → TP-35) - приоритизированы
- **Полная интеграция** с существующей архитектурой Beauty Platform

### Следующие шаги:
1. **Начать реализацию TP-21** (Источники клиентов)
2. **Создать CRM фронтенд** в `apps/web-crm/`
3. **Расширить API** новыми эндпоинтами
4. **Обновить схему БД** новыми моделями

**Beauty Platform CRM готов к созданию полноценной системы уровня Fresha! 🚀**
