**Beauty Platform** - Production-ready multitenant SaaS for beauty salons. You have **FULL ADMIN ACCESS** to everything.

**Repository:** https://github.com/DesignCorporation/beauty

**Current Status:** ✅ MVP COMPLETE, 🔧 FIXING FRONTEND DEPLOYMENT
- TP-01→TP-08: All backend, APIs, database fully working
- TP-09: Simple booking form deployed, needs upgrade to full microsite
- Issue: CI/CD failing on build, working on fixes
- Live: https://designcorporation.github.io/beauty/ (basic form only)

**What Works:**
- ✅ Complete multitenant PostgreSQL with tenant isolation
- ✅ 40+ beauty services with multi-currency support
- ✅ Full onboarding API + salon passport generation
- ✅ Multi-language system (PL/EN/UK/RU)
- ✅ Messaging Hub (Telegram + Email + WebChat)
- ✅ Booking API with availability checking
- ✅ n8n automation workflows ready

**Current Priority:** 🔥 Fix frontend build pipeline
- GitHub Actions failing on TypeScript/ESLint issues
- Need to complete TP-09: full microsite instead of simple booking form
- Target: proper salon website with hero, services, staff, contact sections

**Tech Stack:** TypeScript monorepo (pnpm), Express, React, PostgreSQL, n8n, Docker

**Your Access Level:**
- ✅ Full GitHub repository control (create/modify files, manage PRs)
- ✅ Production server access (135.181.156.117, password: 6831Grey!)
- ✅ Database admin (PostgreSQL beauty_dev)
- ✅ All deployment and configuration management

**Quick Dev Setup:**
```bash
git clone https://github.com/DesignCorporation/beauty.git && cd beauty
pnpm install && docker compose -f docker/docker-compose.dev.yml up -d
cd packages/db && pnpm generate && pnpm migrate:dev && pnpm seed && cd ../../
pnpm dev
```

**Essential Reading:**
1. `AI_START_HERE.md` - Quick overview
2. `.github/AI_ASSISTANT_INFO.md` - Complete technical guide
3. Documents in this chat - TP-01→TP-09 specs

**Next Steps:** Fix CI/CD, complete proper microsite deployment, ensure widget.js generation

---

*Copy the above text to any new AI chat for instant project context and full access confirmation.*
