# Beauty Platform

Монорепозиторий для мультитенантной SaaS-платформы салонов красоты с ИИ-агентами, онлайн-записью и мультиязычностью.

## Требования

- Node.js >=22
- pnpm (latest)
- Docker Desktop или docker-ce
- PostgreSQL 16+ (через Docker)
- Redis 7+ (через Docker)

## Быстрый старт

1. **Клонируйте и установите зависимости**
   ```bash
   git clone https://github.com/DesignCorporation/beauty.git
   cd beauty
   pnpm install
   ```

2. **Настройте environment**
   ```bash
   cp .env.example .env
   # Отредактируйте .env при необходимости
   ```

3. **Запустите базы данных**
   ```bash
   docker compose -f docker/docker-compose.dev.yml up -d
   ```

4. **Запустите все сервисы**
   ```bash
   pnpm dev
   ```

5. **Откройте в браузере**
   - CRM: http://localhost:5173
   - Booking: http://localhost:5174
   - API Health: http://localhost:4000/health
   - Adminer: http://localhost:8080

## Архитектура

### Apps
- `api/` - Express.js API сервер
- `web-crm/` - React CRM для управления салонами
- `web-booking/` - React интерфейс онлайн-записи
- `scripts/` - Утилиты для БД и развертывания

### Packages
- `db/` - Prisma ORM и схема БД
- `config/` - Конфигурация и валидация env
- `ui/` - Переиспользуемые React компоненты
- `utils/` - Общие утилиты

## Разработка

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
pnpm generate  # Генерация Prisma клиента
pnpm migrate   # Применение миграций
pnpm studio    # Prisma Studio
```

## Технологии

- **Frontend**: React 18, TypeScript, Vite
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL, Prisma ORM
- **Cache**: Redis
- **Monorepo**: pnpm workspaces
- **CI/CD**: GitHub Actions
- **Containerization**: Docker Compose

## Roadmap

- [ ] Аутентификация и авторизация
- [ ] Мультитенантность
- [ ] ИИ-агенты (OpenAI интеграция)
- [ ] Telegram бот
- [ ] Email уведомления
- [ ] Мультиязычность (PL/RU/UA/EN)
- [ ] Дашборд аналитики
- [ ] Мобильное приложение

## Документация

Подробная документация будет доступна в будущих версиях.
Спецификация проекта: см. документ "Uroda v5".

---

**English**

# Beauty Platform

Monorepo for multi-tenant SaaS platform for beauty salons with AI agents, online booking, and multi-language support.

## Requirements

- Node.js >=22
- pnpm (latest)  
- Docker Desktop or docker-ce
- PostgreSQL 16+ (via Docker)
- Redis 7+ (via Docker)

## Quick Start

1. **Clone and install dependencies**
   ```bash
   git clone https://github.com/DesignCorporation/beauty.git
   cd beauty
   pnpm install
   ```

2. **Setup environment**
   ```bash
   cp .env.example .env
   # Edit .env if needed
   ```

3. **Start databases**
   ```bash
   docker compose -f docker/docker-compose.dev.yml up -d
   ```

4. **Start all services**
   ```bash
   pnpm dev
   ```

5. **Open in browser**
   - CRM: http://localhost:5173
   - Booking: http://localhost:5174
   - API Health: http://localhost:4000/health
   - Adminer: http://localhost:8080

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL, Prisma ORM
- **Cache**: Redis
- **Monorepo**: pnpm workspaces
- **CI/CD**: GitHub Actions
- **Containerization**: Docker Compose

For detailed documentation, see project specification "Uroda v5".
