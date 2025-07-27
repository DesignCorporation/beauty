**Beauty Platform** - Production-ready multitenant SaaS for beauty salons. You have **FULL ADMIN ACCESS** to everything.

**Repository:** https://github.com/DesignCorporation/beauty

**Current Status:** ✅ **COMPLETE MVP + CRM** (TP-01→TP-09 + Beauty CRM finished)
- ✅ Multitenant PostgreSQL architecture with strict data isolation
- ✅ 40+ beauty services, multi-currency (EUR/PLN/UAH/USD/GBP/CZK)  
- ✅ Complete onboarding API for salon registration
- ✅ Multi-language support (Polish/English/Ukrainian/Russian)
- ✅ Messaging Hub (Telegram + Email + WebChat)
- ✅ Public booking API with real-time availability
- ✅ n8n automation workflows (reminders, birthday, winback)
- ✅ Next.js public microsite + embeddable widget
- ✅ **NEW: Modern React CRM** with dashboard, services, clients, team management

**Live Production:**
- 🌐 Demo: https://designcorporation.github.io/beauty/demo-salon
- 🛠️ Admin CRM: Ready for salon.beauty.designcorp.eu
- 📦 Widget: https://designcorporation.github.io/beauty/dist/widget.js

**Tech Stack:** TypeScript monorepo (pnpm), Express, React, PostgreSQL, n8n, Docker

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

**Quick Setup:**
```bash
git clone https://github.com/DesignCorporation/beauty.git && cd beauty
pnpm install && docker compose -f docker/docker-compose.dev.yml up -d
cd packages/db && pnpm generate && pnpm migrate:dev && pnpm seed && cd ../../
pnpm dev
```

**Beauty CRM (NEW!):**
```bash
cd apps/web-crm && pnpm dev
# Access: http://localhost:5173
# Features: JWT auth, dashboard, services, clients, team
```

**Essential Reading:**
1. `README.md` - Complete project overview
2. `apps/web-crm/README.md` - CRM documentation
3. `.github/AI_ASSISTANT_INFO.md` - Technical guide

**Project is COMPLETE and production-ready!** 🚀 Both public booking and admin CRM are fully functional.

---

*Copy the above text to any new AI chat for instant project context and full access confirmation.*
