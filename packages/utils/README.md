# @dc-beauty/utils

Utility package for the Beauty Platform containing language resolution, translation, messaging, and currency conversion utilities.

## Features

### Language System
- **Language Resolver**: Automatic locale detection based on client preferences, salon settings, and browser language
- **Translation Bridge**: Multi-source translation with caching (LLM providers, glossary, Redis cache)
- **Supported Locales**: Polish (pl), English (en), Ukrainian (uk), Russian (ru)

### Messaging System
- **Message Hub**: Centralized messaging orchestrator
- **Multi-channel Support**: Email, Telegram, Web chat
- **Rate Limiting**: Tenant-based rate limiting with Redis
- **Template System**: Localized message templates

### Currency System
- **Multi-currency Support**: EUR, PLN, UAH, USD, GBP, CZK
- **Automatic Conversion**: Environment-based exchange rates
- **Seed Data Conversion**: Convert service prices to salon's base currency

## Installation

```bash
pnpm install
```

## Development

### Build
```bash
pnpm build
```

### Type Checking
```bash
pnpm typecheck
```

### Testing
```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Generate coverage report
pnpm test:coverage
```

### Linting
```bash
pnpm lint
```

## Usage

### Language Resolution
```typescript
import { resolveLocale } from '@dc-beauty/utils';

const locale = resolveLocale({
  client: { preferredLocale: 'uk' },
  salon: { 
    primaryLocale: 'pl', 
    supportedLocales: ['pl', 'en', 'uk'],
    autoTranslateEnabled: true 
  },
  browserLocales: ['en-US', 'pl-PL']
});
// Returns: 'uk'
```

### Translation
```typescript
import { TranslationBridge } from '@dc-beauty/utils';

const bridge = new TranslationBridge({
  provider: 'openai', // or 'anthropic', 'stub'
  useCache: true,
  useGlossary: true
});

const translated = await bridge.translateText('strzyżenie', 'pl', 'en');
// Returns: 'haircut'
```

### Currency Conversion
```typescript
import { convertSeed, getSeedRate } from '@dc-beauty/utils';

// Convert EUR to PLN using environment rates
const priceInPLN = convertSeed(35.00, 'EUR', 'PLN');
// With SEED_RATE_EUR_PLN=4.35: Returns 152.25
```

### Messaging
```typescript
import { MessageHub, EmailChannel } from '@dc-beauty/utils';

const hub = new MessageHub(prisma, rateLimiter);
hub.registerChannel(new EmailChannel());

await hub.sendMessage('tenant123', 'email', {
  type: 'template',
  content: {
    template: {
      code: 'appointment_reminder',
      data: { clientName: 'Anna', appointmentTime: '14:00' }
    }
  },
  clientId: 'client456'
});
```

## Environment Variables

### Translation
- `OPENAI_API_KEY` - OpenAI API key for translations
- `ANTHROPIC_API_KEY` - Anthropic API key for translations
- `TRANSLATE_PROVIDER` - Translation provider: `openai`, `anthropic`, or `stub`

### Currency Conversion
- `SEED_RATE_EUR_PLN` - EUR to PLN exchange rate (default: 4.35)
- `SEED_RATE_EUR_UAH` - EUR to UAH exchange rate (default: 45)
- `SEED_RATE_EUR_USD` - EUR to USD exchange rate (default: 1.08)
- `SEED_RATE_EUR_GBP` - EUR to GBP exchange rate (default: 0.84)
- `SEED_RATE_EUR_CZK` - EUR to CZK exchange rate (default: 25)

### Messaging
- `REDIS_URL` - Redis connection string for caching
- `MSG_RATE_LIMIT_PER_MIN` - Messages per minute rate limit

## Testing

The package includes comprehensive tests for:
- Language resolution scenarios (L01-L10)
- Translation bridge functionality
- Currency conversion accuracy
- Message hub orchestration
- Rate limiting behavior

Run tests with:
```bash
pnpm test
```

## Type Safety

This package is built with strict TypeScript and includes:
- Full type definitions for all public APIs
- Comprehensive generic types for locales
- Jest type definitions for testing
- Node.js type definitions

## Dependencies

### Runtime Dependencies
- `nodemailer` - Email sending functionality
- `ioredis` - Redis client for caching
- `js-yaml` - YAML parsing for glossary files

### Development Dependencies
- `@types/jest` - Jest type definitions
- `@types/node` - Node.js type definitions
- `@types/nodemailer` - Nodemailer type definitions
- `@types/js-yaml` - js-yaml type definitions
- `jest` - Testing framework
- `ts-jest` - TypeScript preprocessor for Jest

## License

Private package for Beauty Platform.
