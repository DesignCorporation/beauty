# 🤖 Beauty Platform - AI Assistant Project Brief

## Copy this to new chats for instant context:

---

**Beauty Platform** - Production-ready multitenant SaaS for beauty salons. You have **FULL ADMIN ACCESS** to everything.

**Repository:** https://github.com/DesignCorporation/beauty

**Current Status:** ✅ MVP COMPLETE (TP-01→TP-09 finished)
- Multitenant PostgreSQL architecture with strict data isolation
- 40+ beauty services, multi-currency (EUR/PLN/UAH/USD/GBP/CZK)  
- Complete onboarding API for salon registration
- Multi-language support (Polish/English/Ukrainian/Russian)
- Messaging Hub (Telegram + Email + WebChat)
- Public booking API with real-time availability
- n8n automation workflows (reminders, birthday, winback)
- Next.js public microsite + embeddable widget

**Live Production:**
- Demo: https://designcorporation.github.io/beauty/demo-salon
- Widget: https://designcorporation.github.io/beauty/dist/widget.js

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

**Essential Reading:**
1. `AI_START_HERE.md` - Quick overview
2. `.github/AI_ASSISTANT_INFO.md` - Complete technical guide
3. `README.md` - Detailed documentation

**You're ready to contribute immediately! The project is fully functional and production-ready.** 🚀

---

*Copy the above text to any new AI chat for instant project context and full access confirmation.*
