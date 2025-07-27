# Beauty Platform CRM - Техническая спецификация

> **Статус**: 📝 В разработке (анализ 20/57 скриншотов Fresha CRM)  
> **URL**: `salon.beauty.designcorp.eu`  
> **Целевая аудитория**: Владельцы и администраторы салонов красоты  
> **Последнее обновление**: 2025-01-28

## 📚 Оглавление

- [1. Обзор проекта](#1-обзор-проекта)
- [2. Архитектура и интеграция](#2-архитектура-и-интеграция)
- [3. Основные модули CRM](#3-основные-модули-crm)
- [4. UI/UX спецификация](#4-uiux-спецификация)
- [5. Безопасность и изоляция данных](#5-безопасность-и-изоляция-данных)
- [6. Автоматизация и n8n](#6-автоматизация-и-n8n)
- [7. Мультиязычность и валюты](#7-мультиязычность-и-валюты)
- [8. Проанализированные модули](#8-проанализированные-модули)
- [9. Планы развития](#9-планы-развития)

---

## 1. Обзор проекта

### 1.1 Концепция

Beauty Platform CRM - это веб-приложение для управления салонами красоты, разработанное по образцу **Fresha CRM** с полной адаптацией под мультитенантную архитектуру Beauty Platform. 

**Целевая аудитория:**
- 👑 Владельцы салонов красоты
- 👩‍💼 Администраторы салонов  
- ✂️ Мастера и специалисты
- 📊 Менеджеры по продажам

### 1.2 Ключевые принципы

- **🔒 Tenant Isolation**: строгая изоляция данных между салонами
- **🌍 Multi-language**: поддержка PL/EN/UA/RU локализации
- **💰 Multi-currency**: EUR/PLN/UAH/USD/GBP/CZK
- **🤖 Automation Ready**: интеграция с n8n workflows
- **📱 Mobile First**: адаптивный дизайн для всех устройств
- **⚡ Performance**: оптимизированные запросы и кэширование

---

## 2. Архитектура и интеграция

### 2.1 Техническая архитектура

```
Beauty Platform CRM
├── apps/web-crm/              # React CRM приложение (:5173)
│   ├── src/
│   │   ├── components/        # React компоненты
│   │   ├── pages/            # Страницы приложения
│   │   ├── hooks/            # Custom React hooks
│   │   ├── store/            # Redux/Zustand состояние
│   │   ├── api/              # API клиенты
│   │   └── utils/            # Утилиты
│   ├── public/               # Статические ресурсы
│   └── dist/                 # Собранное приложение
├── packages/api/             # Backend API
│   └── src/routes/crm/       # CRM эндпоинты
└── packages/db/              # База данных
    └── prisma/               # Схема и миграции
```

### 2.2 Интеграция с Beauty Platform

**Базовая архитектура (уже реализована):**
- ✅ **TP-01**: Мультитенантная Prisma схема (13 таблиц)
- ✅ **TP-02**: Tenant middleware с автоматической фильтрацией
- ✅ **TP-03**: Библиотека услуг (40+ сервисов) 
- ✅ **TP-04**: Onboarding API для регистрации салонов
- ✅ **TP-05**: Language Resolver + Translation Bridge
- ✅ **TP-06**: Messaging Hub (Telegram + Email + WebChat)
- ✅ **TP-07**: Public Booking API v1
- ✅ **TP-08**: n8n Workflows automation
- ✅ **TP-09**: Public Microsite + Widget

**CRM расширения:**
- 🔄 **CRM-01**: Основные экраны и навигация
- 🔄 **CRM-02**: Календарь и планирование
- 🔄 **CRM-03**: Управление клиентами
- 🔄 **CRM-04**: Финансы и отчеты
- 🔄 **CRM-05**: Настройки и администрирование

### 2.3 Безопасность данных

```typescript
// Критический принцип: ВСЕ CRM запросы ОБЯЗАТЕЛЬНО используют tenant isolation
interface TenantRequest extends Request {
  tenant: {
    salonId: string;
    plan: 'STARTER' | 'PRO' | 'ENTERPRISE';
    locales: {
      primary: string;
      supported: string[];
    };
    role: 'OWNER' | 'ADMIN' | 'STAFF' | 'READONLY';
  };
}

// ✅ ПРАВИЛЬНО: автоматическая фильтрация
const clients = await tenantPrisma(req.tenant.salonId).client.findMany();

// ❌ ОПАСНО: прямой доступ без tenant фильтрации
const clients = await prisma.client.findMany(); // НИКОГДА!
```

---

## 3. Основные модули CRM

### 3.1 Навигация и структура

Левая боковая панель (по образцу Fresha):

```
🏠 Главная (Dashboard)
📅 Календарь 
🏷️ Каталог
  ├── Меню обслуживания
  ├── Членство  
  ├── Товары
  ├── Заказы на складе
  └── Поставщики
📊 Сообщения
  ├── Кампании массовой рассылки
  ├── Автоматизация
  ├── История сообщений
  └── Продвижение
👥 Команда
  ├── Члены команды
  ├── Запланированные сдвиги
  ├── Сроки
  └── Оплата пробегов
😊 Клиенты
💰 Продажи/Отчеты
⚙️ Настройки
```

### 3.2 Цветовая схема (Fresha-inspired)

```css
:root {
  /* Основные цвета */
  --primary-500: #6366f1;     /* Основной фиолетовый */
  --primary-600: #4f46e5;     /* Темнее для hover */
  --primary-700: #4338ca;     /* Активные состояния */

  /* Нейтральные */
  --gray-50: #f9fafb;         /* Основной фон */
  --gray-100: #f3f4f6;        /* Фон карточек */
  --gray-200: #e5e7eb;        /* Границы */
  --gray-700: #374151;        /* Темный текст */
  --gray-900: #111827;        /* Заголовки */

  /* Семантические */
  --success-500: #10b981;     /* Выполнено */
  --warning-500: #f59e0b;     /* Забронировано */
  --info-500: #3b82f6;        /* Информация */
  --sky-300: #7dd3fc;         /* Календарные блоки */
}
```

---

## 4. UI/UX спецификация

### 4.1 Боковая навигация

```css
.sidebar {
  width: 64px;
  background: #1f2937;
  position: fixed;
  height: 100vh;
  left: 0;
  top: 0;
  z-index: 100;
}

.nav-item {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 64px;
  width: 64px;
  color: white;
  text-decoration: none;
  transition: background-color 0.2s ease;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.nav-item.active {
  background: #6366f1;
}

.nav-icon {
  width: 24px;
  height: 24px;
}
```

### 4.2 Основной контент

```css
.main-content {
  margin-left: 64px;
  min-height: 100vh;
  background: #f9fafb;
}

.page-header {
  background: white;
  padding: 16px 24px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #111827;
}

.page-actions {
  display: flex;
  gap: 12px;
}
```

### 4.3 Карточки и компоненты

```css
.card {
  background: white;
  border-radius: 8px;
  padding: 24px;
  border: 1px solid #f3f4f6;
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
}

.btn-primary {
  background: #6366f1;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  border: none;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease;
}

.btn-primary:hover {
  background: #4f46e5;
}
```

---

## 5. Безопасность и изоляция данных

### 5.1 Tenant Middleware

```typescript
// apps/api/src/middleware/requireTenant.ts
export const requireTenant = (req: Request, res: Response, next: NextFunction) => {
  if (!req.tenant?.salonId) {
    return res.status(400).json({ 
      error: 'TENANT_REQUIRED',
      message: 'This endpoint requires salon context'
    });
  }
  next();
};

// Применение ко всем CRM маршрутам
app.use('/api/v1/crm', resolveTenant, requireTenant, crmRoutes);
```

### 5.2 Автоматическая фильтрация данных

```typescript
// packages/db/src/tenantPrisma.ts
export function tenantPrisma(salonId: string) {
  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (model && TENANTED_MODELS.has(model)) {
            args = args || {};
            if (!args.where) args.where = {};
            
            // Проверка конфликта tenant
            if (args.where.salonId && args.where.salonId !== salonId) {
              throw new Error(`Tenant mismatch for model ${model}`);
            }
            
            args.where.salonId = salonId;
          }
          return query(args);
        }
      }
    }
  });
}

// Список защищенных моделей
export const TENANTED_MODELS = new Set([
  'Staff', 'Client', 'Service', 'ServiceTranslation',
  'Appointment', 'AppointmentService', 'TimeOff', 
  'MessageLog', 'AgentSkill'
]);
```

---

## 6. Автоматизация и n8n

### 6.1 Интеграция с n8n workflows

```typescript
// CRM должен отображать статус и управлять n8n автоматизацией
interface AutomationStatus {
  workflowId: string;
  name: string;
  type: 'reminder' | 'marketing' | 'loyalty' | 'winback';
  enabled: boolean;
  lastExecution?: Date;
  nextExecution?: Date;
  executionCount: number;
  errorCount: number;
}

// API эндпоинты для управления автоматизацией
GET    /api/v1/crm/automations           # Список всех автоматизаций
POST   /api/v1/crm/automations/:id/toggle # Включить/выключить
GET    /api/v1/crm/automations/:id/logs   # История выполнений
POST   /api/v1/crm/automations/:id/test   # Тестовый запуск
```

### 6.2 Готовые шаблоны автоматизации

Основано на анализе скриншотов 10-16:

```html
<div class="automation-templates">
  <!-- Напоминания -->
  <div class="template-section">
    <h3>Напоминания</h3>
    <div class="template-grid">
      <div class="automation-card enabled">
        <div class="automation-icon">🔔</div>
        <h4>24 часа напоминание о предстоящей встрече</h4>
        <p>Уведомляет клиентов, напоминая им о предстоящей встрече</p>
        <div class="status-badge enabled">Включено</div>
        <div class="automation-stats">
          <span>Отправлено сегодня: 12</span>
          <span>Успешность: 95%</span>
        </div>
      </div>
      
      <div class="automation-card enabled">
        <div class="automation-icon">🔔</div>
        <h4>1 час напоминание о предстоящей встрече</h4>
        <p>Уведомляет клиентов, напоминая им о предстоящей встрече</p>
        <div class="status-badge enabled">Включено</div>
      </div>
    </div>
  </div>

  <!-- Маркетинг и лояльность -->
  <div class="template-section">
    <h3>Увеличьте количество бронирований</h3>
    <div class="template-grid">
      <div class="automation-card">
        <div class="automation-icon">🎂</div>
        <h4>Отправьте дни рождения</h4>
        <p>Удивите клиентов в их особый день</p>
        <button class="btn-secondary">Активировать</button>
      </div>
      
      <div class="automation-card">
        <div class="automation-icon">🔄</div>
        <h4>Поощрите лояльных клиентов</h4>
        <p>Напишите топ-тратчикам и привлеките их еще раз</p>
        <button class="btn-secondary">Активировать</button>
      </div>
      
      <div class="automation-card">
        <div class="automation-icon">💎</div>
        <h4>Сводка заработанных баллов</h4>
        <p>Отправить клиентам сводку заработанных баллов</p>
        <button class="btn-secondary">Активировать</button>
      </div>
    </div>
  </div>
</div>
```

---

## 7. Мультиязычность и валюты

### 7.1 Language Resolver интеграция

```typescript
// CRM должен использовать TP-05 Language Resolver
interface CRMLocaleContext {
  userLocale: string;        // Язык интерфейса CRM
  salonPrimary: string;      // Основной язык салона
  salonSupported: string[];  // Поддерживаемые языки
  clientLocale?: string;     // Язык конкретного клиента
}

// Автоматический выбор языка для различных контекстов
const useLocaleResolver = () => {
  return {
    // Язык интерфейса CRM
    getUILocale: () => resolveLocale({
      client: { preferredLocale: userPrefs.locale },
      salon: { supportedLocales, publicDefaultLocale }
    }),
    
    // Язык для отправки сообщений клиенту
    getClientLocale: (clientId: string) => resolveLocale({
      client: { preferredLocale: client.preferredLocale },
      salon: { supportedLocales, primaryLocale }
    })
  };
};
```

### 7.2 Multi-currency отображение

```typescript
// Все цены в CRM отображаются в salon.baseCurrency
interface PriceDisplay {
  amount: number;
  currency: string;
  formatted: string;  // "45,00 PLN" или "€35.00"
}

const useCurrencyFormatter = () => {
  const { baseCurrency } = useTenant();
  
  return {
    formatPrice: (amount: number): string => {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: baseCurrency
      }).format(amount);
    }
  };
};
```

---

## 8. Проанализированные модули

> **Статус анализа**: 20/57 скриншотов Fresha CRM

### 8.1 ✅ Каталог услуг (скриншот 1)

**Основные функции:**
- Категоризация услуг (Hair & styling, Nails, Face, etc.)
- Управление ценами и длительностью
- Поиск и фильтрация услуг
- Drag&drop сортировка

**Интеграция с Beauty Platform:**
- Использует TP-03 библиотеку услуг (40+ сервисов)
- Мультивалютные цены через `salon.baseCurrency`
- Переводы через таблицу `translations`
- Tenant isolation по `salonId`

```html
<div class="services-catalog">
  <header class="catalog-header">
    <h1>Меню обслуживания</h1>
    <div class="controls">
      <select class="variants-dropdown">Варианты</select>
      <button class="btn-primary">Указать</button>
    </div>
  </header>
  
  <div class="catalog-content">
    <aside class="categories-sidebar">
      <div class="category-item active">
        <span>Hair & styling</span>
        <span class="count">4</span>
      </div>
      <button class="add-category">+ Добавить категорию</button>
    </aside>
    
    <main class="services-list">
      <div class="service-card">
        <div class="service-info">
          <h3>Стрижка</h3>
          <p class="duration">45 мин</p>
        </div>
        <div class="service-price">
          <span class="amount">40 PLN</span>
          <button class="actions-menu">⋮</button>
        </div>
      </div>
    </main>
  </div>
</div>
```

### 8.2 ✅ Система подписок (скриншот 2)

**Основные функции:**
- Управление программами членства
- Пакетные предложения услуг
- Автоматическое продление
- Система скидок для членов

```css
.membership-promo {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 32px;
  color: white;
}

.membership-benefits ul li::before {
  content: "✓";
  color: #10b981;
  font-weight: bold;
  margin-right: 12px;
}
```

### 8.3 ✅ Управление товарами (скриншот 3)

**Основные функции:**
- Каталог продуктов с изображениями
- Управление складскими запасами  
- Категории и бренды
- Интеграция с онлайн-продажами

### 8.4 ✅ Автоматизация сообщений (скриншоты 10-16)

**Проанализированные шаблоны:**

1. **Напоминания**:
   - 24 часа до встречи (включено)
   - 1 час до встречи (включено)

2. **Lifecycle события**:
   - Новый визит - приветствие
   - Перенесенный визит - автоуведомление
   - Отмененный визит - обработка
   - Клиент не явился - follow-up

3. **Благодарности и отзывы**:
   - Благодарим за визит - просьба об отзыве
   - Благодарим за чаевые - укрепление лояльности

4. **Маркетинг и лояльность**:
   - Напоминание о повторном бронировании
   - Дни рождения клиентов
   - Отыгрывание клиентов с истекшим сроком действия
   - Поощрение лояльных клиентов

### 8.5 ✅ Управление командой (скриншот 20)

**Основные функции:**
- Список членов команды с контактами
- Системы ролей и разрешений
- Рейтинги и отзывы о мастерах
- Интеграция с планированием смен

```html
<div class="team-member">
  <div class="member-info">
    <div class="avatar">S</div>
    <div class="details">
      <h4>Sergii Shevtsov</h4>
      <p>design.corp.ua@gmail.com</p>
      <p>+48 515 582 273</p>
    </div>
  </div>
  <div class="member-status">Связаться</div>
  <div class="member-rating">Отзывов пока нет</div>
  <div class="member-actions">
    <button class="actions-menu">Действие ⌄</button>
  </div>
</div>
```

### 8.6 ✅ Маркетинговые инструменты (скриншоты 17-19)

**Проанализированные функции:**
- Система скидок и промокодов
- Динамическое ценообразование (пиковые/непиковые часы)
- Управление отзывами и репутацией
- Интеграция с Google Reviews

### 8.7 ✅ Онлайн-бронирование (скриншоты 6-8)

**Конструктор ссылок:**
- Ссылка на все услуги
- Ссылка на конкретные сервисы  
- Ссылка на подписки
- Ссылка на подарочные карты

**Интеграция с TP-07 Booking API:**
```typescript
interface BookingWidget {
  salonId: string;
  slug: string;
  widgetType: 'full' | 'services_only' | 'membership' | 'gift_cards';
  config: {
    primaryColor: string;
    locale: string;
    showStaffSelection: boolean;
  };
  generatedUrl: string; // {slug}.beauty.designcorp.eu
}
```

### 8.8 ✅ Push-уведомления (скриншот 16)

**Типы уведомлений:**
- 🎉 Happy birthday - празднование со скидкой
- 💜 Appointment confirmed - подтверждение записи  
- ⭐ Thanks for visiting - просьба об отзыве
- 🔔 Appointment reminder - напоминание о встрече

---

## 9. Планы развития

### 9.1 Следующие этапы анализа

**Ожидается анализ 37 оставшихся скриншотов:**

🔄 **Календарь и планирование**
- Детальные виды календаря (день/неделя/месяц)
- Управление расписанием мастеров
- Блокировка времени и отпуска
- Группировка и фильтрация записей

🔄 **Клиентская база**
- Детальные карточки клиентов
- История посещений и покупок
- Программы лояльности
- Сегментация клиентов

🔄 **Финансы и отчетность**
- Ежедневные продажи и отчеты
- Комиссионные мастеров
- Налоговая отчетность
- Аналитика производительности

🔄 **Настройки салона**
- Персонализация интерфейса
- Настройки уведомлений
- Интеграции с внешними сервисами
- Система резервного копирования

### 9.2 Техническая реализация

**CRM-01: Основные экраны** (планируется)
- Адаптация навигации Fresha под Beauty Platform
- Реализация основных CRUD операций
- Интеграция с существующими API (TP-04, TP-06, TP-07)

**CRM-02: Календарь** (планируется)
- Расширение календарного компонента
- Интеграция с Booking API v1
- Real-time обновления через WebSocket

**CRM-03: Клиенты** (планируется)
- Расширение модели Client из TP-01
- Интеграция с Messaging Hub (TP-06)
- Система лояльности и сегментации

### 9.3 Инструкции для следующих чатов

**Для анализа оставшихся скриншотов:**

```markdown
Контекст: Beauty Platform CRM техническая спецификация
Файл: docs/CRM_TECHNICAL_SPECIFICATION.md
Статус: Проанализировано 20/57 скриншотов Fresha CRM

Задача: Дополнить разделы 8.9-8.40 на основе оставшихся 37 скриншотов

Принципы:
- Tenant isolation обязателен (salonId фильтрация)
- Multi-currency поддержка (salon.baseCurrency)
- Multi-language через TP-05 Language Resolver
- Интеграция с n8n workflows (TP-08)
- Следование Fresha UX/UI паттернам

Архитектура: React CRM + Express API + Prisma ORM + Beauty Platform core
```

---

## 📞 Контакты

**Документ подготовлен**: AI Assistant  
**Команда проекта**: DesignCorporation  
**Репозиторий**: https://github.com/DesignCorporation/beauty  
**Обновления**: Следите за обновлениями документации в папке `/docs`

---

*Данная спецификация является живым документом и будет дополняться по мере анализа оставшихся материалов Fresha CRM и развития Beauty Platform.*
