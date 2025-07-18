# TP-05 Language Resolver - Current Status

**Дата:** 2025-07-18 20:25 UTC  
**Статус:** В разработке - архитектура готова, требуется реализация

## 🎯 Цель TP-05

Система автоматического определения языка клиента и переводов для мультиязычного API.

## ✅ Готово (сохранено на GitHub)

### 1. Core Architecture
- **`packages/utils/src/language/types.ts`** - базовые типы и интерфейсы
- **`packages/utils/src/language/resolver.ts`** - функция resolveLocale с приоритетами
- **`packages/utils/src/language/glossary.beauty.yaml`** - глоссарий beauty-терминов

### 2. Language Resolution Logic
Приоритеты определения языка:
1. `client.preferredLocale` (если поддерживается салоном)
2. `client.alternateLocales ∩ salon.supportedLocales`
3. `browserLocales ∩ salon.supportedLocales`
4. `staff.spokenLocales ∩ salon.supportedLocales`
5. `salon.publicDefaultLocale`
6. `salon.primaryLocale`

### 3. Beauty Glossary
30+ ключевых терминов салонов красоты:
- Hair: strzyżenie, koloryzacja, pasemka, balayage, keratyna
- Nails: manicure, pedicure, hybryda
- Brows/Lashes: brwi, rzęsy, regulacja, henna, laminacja
- Face: oczyszczanie, peeling
- Spa: masaż, depilacja, broda, golenie

## 🔄 В разработке (artifacts готовы)

### 1. Translation Bridge
- `TranslationBridge` класс с многоуровневым fallback
- Redis кеширование переводов (TTL 24h)
- LLM integration (OpenAI/Anthropic/stub)
- Глоссарий lookup для beauty-терминов

### 2. Express Middleware
- `languageResolver` middleware для API
- Автоматическое определение языка из заголовков/query
- Integration с tenant middleware
- `req.language` контекст

### 3. Service Translation
- `ensureServiceTranslation` функция
- Автосоздание переводов услуг по требованию
- Integration с Prisma и tenant isolation

### 4. Tests Suite
Готовы тесты L01-L10 scenarios:
- L01: Client preferred locale поддерживается салоном
- L02: Fallback к alternate locales
- L03: Browser locales при отсутствии client preferences
- L04: Staff spoken locales влияние
- L05: Public default locale fallback
- L06: Primary locale финальный fallback
- L07: Комплексный сценарий с пересечениями
- L08: Browser locales normalization
- L09: Edge case - салон поддерживает только primary
- L10: Empty/null inputs handling

## 🎯 Следующие шаги

### 1. Реализация файлов (готово в artifacts)
```bash
# Translation Bridge
packages/utils/src/language/translator.ts

# Service Translation Helper  
packages/utils/src/language/service-translation.ts

# Express Middleware
apps/api/src/middleware/languageResolver.ts

# Controllers Integration
apps/api/src/controllers/servicesController.ts

# Tests
packages/utils/src/language/__tests__/resolver.test.ts
packages/utils/src/language/__tests__/translator.test.ts
packages/utils/src/language/__tests__/integration.test.ts

# Index exports
packages/utils/src/language/index.ts
```

### 2. Package.json Dependencies
```json
{
  "dependencies": {
    "js-yaml": "^4.1.0",
    "crypto": "builtin"
  },
  "devDependencies": {
    "@types/js-yaml": "^4.0.5"
  }
}
```

### 3. Environment Variables
```bash
# Required
TRANSLATE_PROVIDER=stub  # openai | anthropic | stub
REDIS_URL=redis://localhost:6379

# Optional for LLM
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

## 📋 Implementation Command Block

```bash
BEGIN TP-05

Контекст: Beauty Platform / TP-05 Language Resolver. 
Базовая архитектура уже создана в packages/utils/src/language/.

Задачи:
1. Создать TranslationBridge класс в translator.ts
2. Реализовать ensureServiceTranslation в service-translation.ts  
3. Добавить languageResolver middleware в apps/api/
4. Обновить servicesController для мультиязычных ответов
5. Создать тесты L01-L10 scenarios
6. Добавить index.ts exports
7. Обновить package.json с зависимостями

Acceptance Criteria:
- resolveLocale возвращает ожидаемые результаты в тестах L01-L10
- translateText использует кеш (2-й вызов не обращается к LLM)
- ensureServiceTranslation создаёт запись в translations при отсутствии
- GET /api/v1/services?locale=ru возвращает переведенные услуги
- Тесты проходят: pnpm test

END TP-05
```

## 🔗 Links

- **GitHub Files**: packages/utils/src/language/ (types.ts, resolver.ts, glossary.beauty.yaml)
- **Memory**: TP-05 progress сохранен в knowledge graph
- **Next**: Завершить реализацию TranslationBridge и middleware

---

**Автор:** Claude Assistant  
**Проект:** Beauty Platform  
**Email:** beauty@designcorp.eu