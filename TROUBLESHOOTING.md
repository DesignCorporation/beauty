# Troubleshooting Beauty Platform

Руководство по решению типичных проблем при разработке и развертывании Beauty Platform.

## 🔧 pnpm Version Issues

### Проблема: "pnpm 8.x is not compatible with engines.pnpm >=10.0.0"

**Причина:** Проект требует pnpm версии 10+, но система использует старую версию.

**Решение:**
```bash
# 1. Включите corepack (рекомендуемый способ)
corepack enable

# 2. Проверьте что проект использует правильную версию
pnpm --version  # должно показать 10.17.0+

# 3. Если версия все еще неправильная, принудительно активируйте
corepack prepare pnpm@10.17.0 --activate

# 4. Переустановите зависимости
pnpm install
```

**Альтернативное решение (если corepack недоступен):**
```bash
# Установите pnpm 10+ глобально
npm uninstall -g pnpm
npm install -g pnpm@latest

# Проверьте версию
pnpm --version
```

### Проблема: Corepack недоступен в системе

**Для Node.js 16.10+:**
```bash
# Corepack должен быть включен по умолчанию
corepack enable
```

**Для старых версий Node.js:**
```bash
# Обновите Node.js до версии 18+ (см. .nvmrc)
nvm install 18
nvm use 18

# Включите corepack
corepack enable
```

## 🏗️ Build Issues

### Проблема: Сборка падает на packages/ui

**Решение:**
```bash
# Соберите пакеты в правильном порядке
pnpm build:packages  # Сначала UI библиотека
pnpm build:apps      # Затем приложения
```

### Проблема: TypeScript ошибки в монорепо

**Решение:**
```bash
# Проверьте каждый пакет отдельно
pnpm --filter @dc-beauty/ui typecheck
pnpm --filter @dc-beauty/web-booking typecheck

# Или запустите общую проверку
pnpm typecheck
```

### Проблема: Next.js static export ошибки

**Проверьте next.config.js:**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',           // Обязательно для GitHub Pages
  trailingSlash: true,
  images: {
    unoptimized: true         // Для статического экспорта
  },
  eslint: {
    ignoreDuringBuilds: true  // Пропускаем ESLint при сборке
  }
};
```

## 🔄 CI/CD Issues

### Проблема: GitHub Actions падают на установке зависимостей

**Проверьте workflow файл:**
```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '18'
    
- name: Enable corepack
  run: corepack enable      # Обязательно!
  
- name: Install dependencies
  run: pnpm install --no-frozen-lockfile
```

### Проблема: Cache не работает

**Решение:**
```yaml
- name: Get pnpm store directory
  shell: bash
  run: |
    echo "STORE_PATH=$(pnpm store path --silent)" >> $GITHUB_ENV
    
- name: Setup pnpm cache
  uses: actions/cache@v4
  with:
    path: ${{ env.STORE_PATH }}
    key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
```

## 🗄️ Database Issues

### Проблема: Prisma миграции не применяются

**Решение:**
```bash
cd packages/db

# Проверьте подключение к БД
npx prisma db pull

# Сгенерируйте клиент
pnpm generate

# Примените миграции
pnpm migrate:dev

# Если нужно пересоздать БД
pnpm migrate:reset
pnpm seed
```

### Проблема: Docker PostgreSQL не запускается

**Решение:**
```bash
# Остановите все контейнеры
docker compose -f docker/docker-compose.dev.yml down

# Очистите volumes если нужно
docker compose -f docker/docker-compose.dev.yml down -v

# Запустите заново
docker compose -f docker/docker-compose.dev.yml up -d

# Проверьте логи
docker compose -f docker/docker-compose.dev.yml logs postgres
```

## 🔌 Workspace Dependencies

### Проблема: "Cannot resolve workspace:*" ошибки

**Решение:**
```bash
# Очистите все node_modules
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf packages/*/node_modules

# Очистите pnpm store
pnpm store prune

# Переустановите все зависимости
pnpm install

# Проверьте что workspace ссылки работают
pnpm list --depth=0
```

### Проблема: Изменения в packages/ui не подхватываются

**Решение:**
```bash
# Перестройте UI пакет
cd packages/ui
pnpm build

# Или используйте watch режим во время разработки
pnpm dev  # в packages/ui
```

## 🌐 Development Server Issues

### Проблема: Порты заняты

**Решение:**
```bash
# Проверьте какие порты используются
lsof -i :4000  # API
lsof -i :5173  # web-crm
lsof -i :5174  # web-booking
lsof -i :5678  # n8n

# Завершите процессы если нужно
kill -9 <PID>

# Или измените порты в package.json скриптах
```

### Проблема: Hot reload не работает

**Решение:**
```bash
# Для Next.js (web-booking)
cd apps/web-booking
rm -rf .next
pnpm dev

# Для Vite (web-crm)
cd apps/web-crm
rm -rf dist
pnpm dev
```

## 🔐 Environment Issues

### Проблема: .env файл не загружается

**Проверьте структуру:**
```bash
# Должен быть в корне проекта
./env
./env.example

# Скопируйте из примера если нужно
cp .env.example .env
```

**Типичные переменные:**
```bash
# Database
DATABASE_URL="postgresql://beauty:beauty@localhost:5432/beauty_dev"

# Currency rates
SEED_RATE_EUR_PLN=4.35
SEED_RATE_EUR_UAH=45.00
SEED_RATE_EUR_USD=1.08
SEED_RATE_EUR_GBP=0.84
SEED_RATE_EUR_CZK=25.00

# Development
NODE_ENV=development
```

## 📱 Production Deployment Issues

### Проблема: GitHub Pages не обновляется

**Решение:**
```bash
# Проверьте что workflow запустился
# В GitHub: Actions -> последний workflow

# Проверьте что файлы сгенерировались
ls apps/web-booking/out/

# Принудительно запустите workflow
# GitHub: Actions -> Deploy to GitHub Pages -> Run workflow
```

### Проблема: Static assets не загружаются

**Проверьте next.config.js:**
```javascript
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  // Для GitHub Pages поддиректорий
  basePath: process.env.NODE_ENV === 'production' ? '/beauty' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/beauty' : '',
};
```

## 🆘 Emergency Recovery

### Полная переустановка проекта

```bash
# 1. Сохраните важные файлы
cp .env .env.backup

# 2. Очистите все
rm -rf node_modules
rm -rf apps/*/node_modules 
rm -rf packages/*/node_modules
rm -rf .pnpm-store

# 3. Переустановите с нуля
corepack enable
pnpm install

# 4. Восстановите базу данных
cd packages/db
pnpm generate
pnpm migrate:dev
pnpm seed

# 5. Проверьте работоспособность
pnpm typecheck
pnpm build
pnpm dev
```

### Сброс к последнему стабильному состоянию

```bash
# Откатитесь к последнему working commit
git stash
git checkout main
git pull origin main

# Или к конкретному коммиту
git checkout <commit-hash>

# Переустановите зависимости
pnpm install
```

## 📞 Получить помощь

1. **Проверьте GitHub Issues:** существующие проблемы и решения
2. **Запустите диагностику:**
   ```bash
   node --version      # >= 18
   pnpm --version      # >= 10  
   docker --version    # для БД
   ```
3. **Соберите логи:**
   ```bash
   pnpm dev > logs.txt 2>&1
   ```
4. **Контакты:** beauty@designcorp.eu

---

**💡 Совет:** Большинство проблем решается обновлением Node.js до версии 18+, включением corepack и переустановкой зависимостей.
