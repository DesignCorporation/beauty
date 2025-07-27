# Beauty Platform CRM - Инструкции для продолжения работы

> 🤖 **Для AI помощников**: Данный файл содержит контекст и инструкции для продолжения анализа Fresha CRM и разработки Beauty Platform CRM

## 📊 Текущий статус

### ✅ Что уже проанализировано (20/57 скриншотов)

**Основные модули:**
1. **Каталог услуг** - управление сервисами, категории, ценообразование
2. **Система подписок** - программы членства и лояльности  
3. **Управление товарами** - инвентарь и складские запасы
4. **Автоматизация n8n** - 8 типов автоматических сообщений
5. **Управление командой** - персонал, роли, рейтинги
6. **Маркетинг** - скидки, акции, динамические цены, отзывы
7. **Онлайн-бронирование** - конструктор ссылок, виджеты
8. **Push-уведомления** - мобильные нотификации

### 📋 Что нужно проанализировать (37 оставшихся скриншотов)

**Ожидаемые модули:**
- 📅 Календарь и планирование (детальные виды)
- 👥 Детальная работа с клиентами
- 💰 Финансы и отчетность  
- 📊 Аналитика и дашборды
- ⚙️ Настройки салона
- 📱 Мобильные приложения
- 🔗 Интеграции с внешними сервисами
- 🔒 Безопасность и права доступа

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
│   │   ├── calendar/         # Календарные виды
│   │   ├── services/         # Управление услугами  
│   │   ├── clients/          # База клиентов
│   │   ├── team/            # Управление персоналом
│   │   ├── automation/      # n8n интеграция
│   │   ├── marketing/       # Кампании и акции
│   │   ├── reports/         # Аналитика  
│   │   ├── settings/        # Настройки салона
│   │   └── common/          # Общие компоненты
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
  'MessageLog', 'AgentSkill', 'SalonSocialLinks'
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
📅 Календарь 
🏷️ Каталог → [Услуги, Членство, Товары, Склад, Поставщики]
📊 Сообщения → [Кампании, Автоматизация, История, Продвижение]  
👥 Команда → [Мастера, Смены, Сроки, Зарплата]
😊 Клиенты
💰 Продажи/Отчеты
⚙️ Настройки
```

## 🤖 n8n Интеграция

### Существующие workflows (TP-08):
1. **reminder_24h** - напоминания за 24 часа
2. **reminder_2h** - срочные напоминания за 2 часа  
3. **birthday** - поздравления с днем рождения
4. **winback_90d** - возврат неактивных клиентов

### CRM должен показывать:
```typescript
interface AutomationStatus {
  workflowId: string;
  name: string;
  type: 'reminder' | 'marketing' | 'loyalty' | 'winback';
  enabled: boolean;
  lastExecution?: Date;
  executionCount: number;
  errorCount: number;
}
```

## 📝 Инструкции для следующего чата

### Задача:
1. **Получить оставшиеся 37 скриншотов** Fresha CRM
2. **Дополнить файл** `docs/CRM_TECHNICAL_SPECIFICATION.md`
3. **Добавить разделы 8.9-8.40** с анализом новых модулей
4. **Создать финальную спецификацию** для реализации

### Команда для копирования:
```
Контекст: Beauty Platform CRM анализ
Статус: 20/57 скриншотов проанализировано  
Файл: docs/CRM_TECHNICAL_SPECIFICATION.md
Задача: Дополнить анализом оставшихся 37 скриншотов

Архитектура:
- Мультитенантная (tenant isolation ОБЯЗАТЕЛЕН)
- Мультивалютная (EUR/PLN/UAH/USD/GBP/CZK)
- Мультиязычная (PL/EN/UA/RU через TP-05)
- n8n автоматизация (TP-08 workflows)
- Fresha UX/UI паттерны

Принципы:
- Все запросы через tenantPrisma(salonId)
- Цены в salon.baseCurrency  
- Переводы через TP-05 Language Resolver
- Следование Fresha дизайн-системе
```

### Структура дополнения:
```markdown
### 8.9 ✅ [Название модуля] (скриншот X)
**Основные функции:**
- Список функций...

**Интеграция с Beauty Platform:**
- Использование существующих TP-XX
- Новые API эндпоинты
- Дополнения к схеме БД

**UI компоненты:**
```html
<div class="module-component">
  <!-- HTML структура -->
</div>
```

**CSS стили:**
```css
.module-component {
  /* Fresha-inspired стили */
}
```
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

## 🚀 Готов к продолжению!

**Следующий AI помощник**: используй эту информацию как базу для анализа оставшихся скриншотов и создания финальной CRM спецификации.

**Цель**: создать полную техническую документацию для реализации Beauty Platform CRM по образцу Fresha с учетом всех архитектурных особенностей платформы.

**Успехов в анализе! 🎯**
