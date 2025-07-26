# 🤖 AI Assistant Quick Start Guide

## 🔑 Access & Permissions
- ✅ **Full GitHub Access**: Create/modify files, manage PRs, read all code
- ✅ **Repository Admin**: Complete control over DesignCorporation/beauty
- ✅ **Issue Management**: Create, update, close issues and PRs
- ✅ **File Operations**: Read, create, update any file in the repo
- ✅ **Branch Management**: Create branches, merge PRs, manage releases

## 📋 Project Status (July 2025)

### ✅ COMPLETED: TP-01 through TP-09 (100%)
All major development phases are **COMPLETE**:

1. **TP-01: Database Schema** - Prisma multitenant schema with 40+ services
2. **TP-02: Tenant Middleware** - Strict data isolation by salonId  
3. **TP-03: Service Library** - Auto-seeding with currency conversion
4. **TP-04: Onboarding API** - Complete salon registration flow
5. **TP-05: Language Resolver** - Multi-language support (PL/EN/UK/RU)
6. **TP-06: Messaging Hub** - Telegram + Email + WebChat integration
7. **TP-07: Booking API v1** - Public booking endpoints with E2E tests
8. **TP-08: n8n Workflows** - Automation (reminders, birthday, winback)  
9. **TP-09: Public Microsite** - Next.js frontend + embeddable widget

### 🔄 CURRENT FOCUS: Post-MVP Optimization
- Build system fixes (ESLint 9, TypeScript configs) ✅ RESOLVED
- Production deployment optimization
- Performance monitoring
- Documentation completion

## 🚀 Production Environment

### Live URLs
- **GitHub Pages**: https://designcorporation.github.io/beauty
- **Demo Salon**: https://designcorporation.github.io/beauty/demo-salon
- **Embeddable Widget**: https://designcorporation.github.io/beauty/dist/widget.js

### Server Access
```bash
# Server: 135.181.156.117
# Path: /var/www/beauty
# Domain: beauty.designcorp.eu (SSL configured)

# SSH Connection
ssh root@135.181.156.117
# Password: 6831Grey!
```

### Service Architecture
```
:4000  - Express API (apps/api)
:5173  - React CRM (apps/web-crm)  
:5174  - Next.js Booking (apps/web-booking)
:5678  - n8n Automation (docker/n8n)
:5432  - PostgreSQL (beauty_dev database)
:6379  - Redis (caching)
:8080  - Adminer (DB admin)
```

## 🔧 Tech Stack

### Core Technologies
- **Monorepo**: pnpm workspaces (Node 18+, pnpm 10+)
- **Backend**: Express + TypeScript + Prisma ORM
- **Frontend**: React 18 + Vite + Tailwind CSS  
- **Database**: PostgreSQL with strict multitenant architecture
- **Real-time**: Socket.io for WebChat
- **Automation**: n8n workflows for lifecycle events
- **Cache**: Redis for performance optimization

### Development Tools
- **TypeScript strict mode** everywhere
- **ESLint 9** with flat config
- **GitHub Actions** for CI/CD
- **Docker Compose** for local development
- **Lighthouse CI** for performance validation (≥80 mobile score)

## 🗃️ Database Architecture

### Core Models (13 tables)
```sql
salons (tenant root) → staff, clients, services, appointments
service_translations (multilingual)
appointment_services (join table)
message_log (communication history)
salon_channels (Telegram/Email configs)
time_off, agent_skills
```

### Demo Data Access
```bash
# Demo salon credentials
NIP: 0000000000
Slug: demo-salon
ID: Generated CUID (check Prisma Studio)
Base Currency: PLN
Languages: pl, ru, uk, en
Services: 40+ auto-seeded
```

## 🛡️ Security Model

### Tenant Isolation (CRITICAL)
```typescript
// ALL database queries MUST include salonId filter
const TENANTED_MODELS = [
  'Staff', 'Client', 'Service', 'ServiceTranslation',
  'Appointment', 'AppointmentService', 'TimeOff', 
  'MessageLog', 'AgentSkill', 'SalonSocialLinks'
];

// Auto-injection via tenantPrisma(salonId)
const tprisma = tenantPrisma(req.tenant.salonId);
const clients = await tprisma.client.findMany(); // Automatic where: {salonId}
```

### Authentication Layers
- **JWT + Role-based**: Private admin/staff APIs
- **Host-based**: Public booking via salon slug
- **API Key**: Internal n8n/automation services

## 🌍 Multi-language System

### Supported Locales
- **pl** (Polish) - Canonical language for service library
- **en** (English) - International default
- **uk** (Ukrainian) - Regional support  
- **ru** (Russian) - Regional support

### Translation Bridge
```typescript
// Auto-translation ready for LLM integration
await ensureServiceTranslation(service, locale);
const resolvedLang = resolveLocale({client, salon, staff});
```

## 💰 Currency System

### Multi-currency Support
**Base currencies**: EUR, PLN, UAH, USD, GBP, CZK

**Conversion rates** (environment variables):
```bash
SEED_RATE_EUR_PLN=4.35
SEED_RATE_EUR_UAH=45.00
SEED_RATE_EUR_USD=1.08
SEED_RATE_EUR_GBP=0.84
SEED_RATE_EUR_CZK=25.00
```

## 📡 API Endpoints

### Public Booking API (no auth required)
```bash
GET  /public/:slug/services?locale=ru    # Multilingual services
GET  /public/:slug/staff?lang=ru         # Staff with language flags  
GET  /public/:slug/availability          # Available time slots
POST /public/:slug/booking               # Create appointment
POST /public/:slug/booking/:id/cancel    # Cancel appointment
POST /public/:slug/booking/:id/reschedule # Reschedule appointment
```

### Admin API (JWT required, tenant-scoped)
```bash
GET  /api/v1/clients                     # Salon clients only
GET  /api/v1/services                    # Salon services only
GET  /api/v1/appointments                # Salon appointments only
POST /api/v1/appointments                # Create with auto salonId
```

### Onboarding API (salon creation)
```bash
POST /onboarding/validate-nip            # NIP validation (PL/UA)
POST /onboarding/create-salon            # Initial salon creation
PATCH /onboarding/:id/contact            # Contact information
PATCH /onboarding/:id/hours              # Business hours
PATCH /onboarding/:id/social             # Social media links
PATCH /onboarding/:id/locales            # Language preferences
PATCH /onboarding/:id/plan               # Subscription plan
POST /onboarding/:id/finalize            # Complete registration
GET  /onboarding/:id/passport            # Salon summary JSON
```

### Messaging API (TP-06)
```bash
POST /api/v1/messaging/send              # Send single message
POST /api/v1/messaging/send-bulk         # Bulk message sending
GET  /api/v1/messaging/history           # Message history  
GET  /api/v1/messaging/stats             # Messaging statistics
POST /webhooks/telegram                  # Telegram Bot webhook
POST /webhooks/email                     # Email inbound processing
WebSocket /messaging/webchat             # Real-time WebChat
```

### n8n Internal API (API key required)
```bash
GET  /internal/appointments/24h          # Tomorrow's appointments
GET  /internal/appointments/2h           # Appointments in 2 hours
GET  /internal/clients/birthday          # Today's birthdays
GET  /internal/clients/winback           # 90+ day inactive clients
POST /internal/messaging/send            # Send automated message
POST /internal/messaging/send-bulk       # Bulk automated messages
```

## 🔄 Common Development Tasks

### Database Operations
```bash
cd packages/db
pnpm generate                    # Regenerate Prisma client
pnpm migrate:dev                 # Create development migration  
pnpm migrate:deploy              # Deploy to production
pnpm studio                      # Open Prisma Studio (localhost:5555)
pnpm seed                        # Create demo salon + services
pnpm seed:salon <nip|salonId>    # Seed specific salon
```

### Testing Commands
```bash
pnpm test                        # Run all tests
pnpm test:e2e                    # E2E test suite
pnpm test:tp06                   # Messaging Hub tests (95% coverage)
pnpm test:tp07                   # Booking API tests (25+ scenarios)
pnpm test:tp08                   # n8n Workflow tests
```

### Build & Deploy
```bash
pnpm install                     # Install all dependencies
pnpm build                       # Build all apps for production
pnpm dev                         # Start all services in dev mode
pnpm typecheck                   # TypeScript validation
pnpm lint                        # ESLint validation (max-warnings 0)
```

### n8n Workflow Management
```bash
# n8n Dashboard: http://localhost:5678
# Credentials: admin@beauty.designcorp.eu / BeautyN8N2025!

# Available workflows:
# - 24h-reminder (daily 07:00 UTC)
# - 2h-urgent-reminder (every 30min)  
# - birthday-wishes (daily 09:00 UTC)
# - winback-90d (weekly Monday 10:00 UTC)
```

## 🚀 Quick Development Setup

### 1. Environment Setup
```bash
git clone https://github.com/DesignCorporation/beauty.git
cd beauty
cp .env.example .env
# Edit DATABASE_URL and currency rates
```

### 2. Services Startup
```bash
docker compose -f docker/docker-compose.dev.yml up -d  # Start DB + Redis + n8n
pnpm install                                           # Install dependencies
cd packages/db && pnpm generate && pnpm migrate:dev && pnpm seed && cd ../../
pnpm dev                                              # Start all applications
```

### 3. Verify Installation
- API Health: http://localhost:4000/health
- CRM Admin: http://localhost:5173  
- Public Booking: http://localhost:5174
- n8n Dashboard: http://localhost:5678
- Prisma Studio: http://localhost:5555 (run `pnpm studio` in packages/db)
- Adminer DB: http://localhost:8080

## 🧪 Testing & Quality Assurance

### Comprehensive Test Coverage
- **E2E Testing**: Full user journeys (salon creation → booking → automation)
- **API Testing**: All endpoints with edge cases
- **Security Testing**: Tenant isolation validation
- **Performance Testing**: Race condition protection, load testing
- **Multi-language Testing**: All 4 supported locales
- **Integration Testing**: n8n workflows, message delivery, real-time features

### Test Data Management
```bash
# Reset to clean state
docker compose -f docker/docker-compose.dev.yml down -v
docker compose -f docker/docker-compose.dev.yml up -d
cd packages/db && pnpm migrate:dev && pnpm seed

# Create test salon
pnpm seed:salon nip:1234567890

# Verify in Prisma Studio
pnpm studio
```

## ⚠️ Critical Security Notes

### NEVER bypass tenant isolation
```typescript
// ❌ NEVER do this - bypasses tenant protection
await prisma.client.findMany();

// ✅ ALWAYS use tenant-scoped client
const tprisma = tenantPrisma(salonId);
await tprisma.client.findMany(); // Automatically filtered by salonId
```

### Authentication Flow
1. **Public APIs**: Determine salonId from host slug or query param
2. **Private APIs**: Extract salonId from JWT `tid` claim  
3. **Internal APIs**: Validate API key + explicit `x-tenant-id` header
4. **All operations**: Automatically scope to determined salonId

## 📞 Support & Troubleshooting

### Common Issues & Solutions

**Build failures**: Ensure ESLint 9 + TypeScript dependencies are aligned
**Test failures**: Check tenant isolation, reset test database  
**n8n issues**: Verify internal API keys and webhook signatures
**Performance**: Monitor Redis cache hit rates, optimize Prisma queries

### Quick Health Checks
```bash
# Verify all services responding
curl http://localhost:4000/health                    # API
curl http://localhost:5173                           # CRM  
curl http://localhost:5174                           # Booking
curl http://localhost:5678                           # n8n
curl http://localhost:8080                           # Adminer

# Check database connectivity
cd packages/db && pnpm studio                        # Should open on :5555

# Verify tenant isolation
curl -H "x-tenant-id: demo-salon-id" http://localhost:4000/api/v1/clients
```

---

## 🎯 IMPORTANT FOR AI ASSISTANTS

**You have COMPLETE access to:**
- ✅ Modify any file in the repository
- ✅ Create/manage branches and PRs
- ✅ Update dependencies and configurations  
- ✅ Deploy changes via GitHub Actions
- ✅ Manage issues and project documentation
- ✅ Access production server and databases
- ✅ Execute administrative commands

**Current project state:** PRODUCTION-READY MVP with all core features complete.
**Next priorities:** Documentation, performance optimization, admin panel (TP-10).

**Repository:** https://github.com/DesignCorporation/beauty
**Maintainer:** DesignCorporation team
**Last updated:** July 2025 🚀
