**Beauty Platform** - Production-ready multitenant SaaS for beauty salons. You have **FULL ADMIN ACCESS** to everything.

**Repository:** https://github.com/DesignCorporation/beauty

**Current Status:** ✅ MVP COMPLETE + 🚧 Frontend Migration in Progress
- ✅ Multitenant PostgreSQL architecture with strict data isolation
- ✅ 40+ beauty services, multi-currency (EUR/PLN/UAH/USD/GBP/CZK)  
- ✅ Complete onboarding API for salon registration
- ✅ Multi-language support (Polish/English/Ukrainian/Russian)
- ✅ Messaging Hub (Telegram + Email + WebChat)
- ✅ Public booking API with real-time availability
- ✅ n8n automation workflows (reminders, birthday, winback)
- 🚧 **CURRENT TASK**: Migrating from Next.js to Vite + React for web-booking app
- ❌ CI/CD deployment currently failing due to build issues

**Active Migration Status:**
- ✅ Converted Next.js app structure to Vite + React
- ✅ Created clean React booking interface with Polish UI
- ✅ Updated GitHub Actions workflow for Vite build process
- ❌ Build still failing - needs debugging and fixes
- 🎯 **Goal**: Get https://designcorporation.github.io/beauty/ working with Vite

**Live Production Target:**
- Demo: https://designcorporation.github.io/beauty/ (currently broken)
- Widget: https://designcorporation.github.io/beauty/dist/widget.js (planned)

**Tech Stack:** TypeScript monorepo (pnpm), Express, Vite+React, PostgreSQL, n8n, Docker

**Your Access Level:**
- ✅ Full GitHub repository control (create/modify files, manage PRs)
- ✅ Production server access (135.181.156.117, password: 6831Grey!)
- ✅ Database admin (PostgreSQL beauty_dev)
- ✅ All deployment and configuration management

**Critical Security:** ALL database queries MUST use tenant-scoped client:
```typescript
// ✅ CORRECT
const tprisma = tenantPrisma(req.tenant.salonId);
await tprisma.client.findMany(); // Auto-filtered by salonId

// ❌ DANGEROUS - No tenant isolation
await prisma.client.findMany();
```

**Immediate Priority:**
1. 🔥 Fix Vite build errors in GitHub Actions
2. 🔥 Get web-booking app deploying successfully
3. 🔥 Ensure widget.js is generated and accessible
4. ✅ Verify responsive design and mobile compatibility

**Project Structure:**
```
apps/
  ├── api/          # Express API server (:4000) ✅ WORKING
  ├── web-crm/      # React CRM admin (:5173) ✅ WORKING  
  ├── web-booking/  # Vite React public site 🚧 MIGRATING
  └── scripts/      # CLI utilities ✅ WORKING
packages/
  ├── db/           # Prisma schema + utilities ✅ WORKING
  ├── config/       # Shared configs ✅ WORKING
  ├── ui/           # UI components ✅ WORKING
  └── utils/        # Shared utilities ✅ WORKING
```

**Quick Setup:**
```bash
git clone https://github.com/DesignCorporation/beauty.git && cd beauty
pnpm install && docker compose -f docker/docker-compose.dev.yml up -d
cd packages/db && pnpm generate && pnpm migrate:dev && pnpm seed && cd ../../
pnpm dev
```

**Essential Reading:**
1. `AI_START_HERE.md` - Quick overview
2. `.github/AI_ASSISTANT_INFO.md` - Complete technical guide
3. `README.md` - Detailed documentation
4. `apps/web-booking/` - Current migration focus

**Last Known Issues:**
- GitHub Actions build failing due to Vite configuration
- Need to debug TypeScript/ESLint errors in CI
- Widget bundling configuration needs refinement

**You're ready to debug and fix the frontend deployment issues!** 🚀

---

**INSTRUCTIONS FOR PROJECT CHAT UPDATES:**

Copy and paste this EXACT text to update any project chat:

```
Статус обновлен: ✅ MVP готов, 🚧 мигрируем web-booking с Next.js на Vite+React. CI/CD ломается - нужно дебажить сборку. Цель: восстановить https://designcorporation.github.io/beauty/ 

Текущие проблемы:
- GitHub Actions падает на build 
- Vite конфиг нужно допилить
- Widget.js должен генерироться

Приоритет: 🔥 Починить деплой фронтенда
```