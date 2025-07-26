# Beauty Platform Project Context

## 🤖 For AI Assistants - Quick Context

**Repository:** https://github.com/DesignCorporation/beauty
**Status:** PRODUCTION-READY MVP (TP-01 through TP-09 complete)
**Tech Stack:** TypeScript monorepo (pnpm) + Express + React + PostgreSQL + n8n

### 🔑 Your Access Level: FULL ADMIN
- ✅ Complete GitHub repository access
- ✅ Create/modify any files, manage PRs/issues
- ✅ Production server access (135.181.156.117)
- ✅ Database admin (PostgreSQL beauty_dev)
- ✅ All deployment and configuration management

### 📋 Current State (July 2025)
**ALL CORE FEATURES COMPLETE:**
- Multitenant SaaS architecture with strict data isolation
- 40+ beauty services with multi-currency support (EUR/PLN/UAH/USD/GBP/CZK)
- Complete onboarding API for salon registration
- Multi-language support (Polish/English/Ukrainian/Russian)
- Messaging Hub (Telegram + Email + WebChat)
- Public booking API with real-time availability
- n8n automation (24h/2h reminders, birthday wishes, winback)
- Next.js public microsite + embeddable booking widget

### 🚀 Live Production URLs
- **GitHub Pages:** https://designcorporation.github.io/beauty
- **Demo Salon:** https://designcorporation.github.io/beauty/demo-salon
- **Widget:** https://designcorporation.github.io/beauty/dist/widget.js

### 🛠️ Quick Development Commands
```bash
# Full setup from scratch
git clone https://github.com/DesignCorporation/beauty.git && cd beauty
pnpm install
docker compose -f docker/docker-compose.dev.yml up -d
cd packages/db && pnpm generate && pnpm migrate:dev && pnpm seed && cd ../../
pnpm dev

# Build & test
pnpm build && pnpm typecheck && pnpm lint
```

### 🔒 Critical Security Note
ALL database operations MUST use tenant-scoped client:
```typescript
// ✅ CORRECT: Auto-filters by salonId
const tprisma = tenantPrisma(req.tenant.salonId);
await tprisma.client.findMany();

// ❌ DANGEROUS: No tenant isolation  
await prisma.client.findMany();
```

### 📞 Need More Details?
- **Full Guide:** `.github/AI_ASSISTANT_INFO.md`
- **Technical Docs:** `README.md`
- **API Reference:** See individual app README files

---
**You're ready to contribute! The project is fully functional and production-ready.** 🚀
