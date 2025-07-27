# Beauty Platform 🌟

**Production-ready multitenant SaaS for beauty salons** - Complete MVP with CRM, booking system, and automation workflows.

## 🚀 Project Status: COMPLETED MVP ✅

### Recently Completed: Beauty CRM
- ✅ **JWT Authentication** with tenant isolation
- ✅ **Modern React 18 + TypeScript** architecture  
- ✅ **Responsive Dashboard** with stats and quick actions
- ✅ **Service Management** with pricing and categories
- ✅ **Client Database** with contact history
- ✅ **Team Management** with ratings and specializations
- ✅ **Protected Routing** with automatic redirects
- ✅ **Tailwind CSS** with custom brand colors (#7c3aed, #f59e0b)

### Live Demo
- 🌐 **Public Booking**: https://designcorporation.github.io/beauty/demo-salon
- 🛠️ **Admin CRM**: Ready for deployment at salon.beauty.designcorp.eu
- 📦 **Widget**: https://designcorporation.github.io/beauty/dist/widget.js

## 🏗️ Architecture Overview

### Tech Stack
- **Backend**: Node.js + Express + PostgreSQL + Prisma ORM
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Automation**: n8n workflows for reminders and marketing
- **Infrastructure**: Docker + GitHub Actions + Nginx

### Project Structure
```
apps/
├── api/          ✅ Express REST API with tenant middleware
├── web-crm/      ✅ React CRM admin panel (NEW!)
├── web-booking/  ✅ Next.js public booking site + widget
└── scripts/      ✅ CLI utilities and seed data

packages/
├── db/           ✅ Prisma schema + migrations
├── config/       ✅ Shared configurations
├── ui/           ✅ Component library
└── utils/        ✅ Shared utilities
```

## 🎯 Core Features

### ✅ Completed (TP-01 → TP-09 + CRM)
- **Multitenant Architecture** - Strict data isolation per salon
- **40+ Beauty Services** - Hair, nails, brows, spa, packages
- **Multi-currency Support** - EUR/PLN/UAH/USD/GBP/CZK with conversion
- **Onboarding API** - Complete salon registration flow
- **Multi-language** - Polish/English/Ukrainian/Russian
- **Public Booking** - Real-time availability + embeddable widget
- **Messaging Hub** - Telegram + Email + WebChat integration
- **n8n Automation** - 24h/2h reminders, birthday campaigns, winback
- **Admin CRM** - Modern dashboard for salon management

### 🔐 Security Features
- **JWT Authentication** with automatic token refresh
- **Tenant Isolation** - Zero data leakage between salons
- **Row-level Security** - Database-level protection
- **API Rate Limiting** - Protection against abuse
- **Input Validation** - Comprehensive request sanitization

### 📊 Business Intelligence
- **Real-time Analytics** - Revenue, bookings, client metrics
- **Automated Workflows** - Customer lifecycle management
- **Multi-channel Communication** - Unified messaging platform
- **Revenue Tracking** - Multi-currency financial reporting

## 🛠️ Quick Start

### Development Setup
```bash
# Clone repository
git clone https://github.com/DesignCorporation/beauty.git
cd beauty

# Install dependencies
pnpm install

# Start infrastructure
docker compose -f docker/docker-compose.dev.yml up -d

# Setup database
cd packages/db
pnpm generate && pnpm migrate:dev && pnpm seed

# Start all services
pnpm dev
```

### Production Deployment
- **Server**: 135.181.156.117 (VPS with Docker)
- **Domain**: beauty.designcorp.eu (SSL configured)
- **Database**: PostgreSQL with automated backups
- **CI/CD**: GitHub Actions with automated testing

## 📈 Performance Metrics

- **Database Optimization**: 87% query reduction (25+ → 3 queries)
- **Bundle Size**: Optimized with tree-shaking and code splitting
- **Lighthouse Score**: >90 on mobile for public booking
- **API Response**: <200ms average response time
- **Uptime**: 99.9% availability target

## 🎨 Design System

### Brand Colors
- **Primary**: #7c3aed (Purple) - Luxury and sophistication
- **Accent**: #f59e0b (Orange) - Energy and warmth  
- **Neutral**: #f8fafc (Light gray) - Clean and modern

### UI Principles
- **Mobile-first** responsive design
- **Accessibility** compliant (WCAG 2.1)
- **Modern aesthetics** with micro-interactions
- **Performance-focused** with optimized assets

## 🔮 Future Roadmap

### Phase 2: Advanced Features
- **Payment Integration** - Stripe/PayPal for online payments
- **Advanced Calendar** - Drag & drop scheduling with conflicts
- **Inventory Management** - Product stock and automatic reordering
- **Advanced Analytics** - Custom reports and business insights
- **Mobile Apps** - Native iOS/Android applications

### Phase 3: Enterprise
- **Multi-location** - Salon chains with centralized management
- **Staff Mobile App** - Schedule management and client communication
- **AI Features** - Smart scheduling and demand prediction
- **API Marketplace** - Third-party integrations ecosystem

## 📞 Support & Contact

- **Technical Issues**: Create GitHub issue
- **Business Inquiries**: info@designcorp.eu
- **Documentation**: See `/docs` folder
- **Demo Access**: Contact for salon credentials

## 📄 License

Private commercial software. All rights reserved.

---

**Latest Update**: January 2025 - Beauty CRM completed  
**Maintainer**: DesignCorporation  
**Status**: Production Ready ✅
