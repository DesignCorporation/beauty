# Beauty Platform CRM - AI Development Assistant Guide

## 🎯 Project Mission
Build a **complete Fresha-style CRM** for beauty salons with modern React interface, comprehensive business management tools, and scalable architecture.

## 📋 Current Development Phase: CRM Interface

### 🔥 IMMEDIATE PRIORITY
**Create `apps/web-crm` application** - Full salon management dashboard

**Reference Design:** Fresha CRM interface (screenshots in current chat)
- Sidebar navigation with 13 main modules
- Modern purple/pink color scheme  
- Card-based layouts with subtle shadows
- Responsive design patterns

### 🏗️ Technical Foundation (COMPLETED ✅)
- Multitenant PostgreSQL database with strict data isolation
- Express API with comprehensive business logic
- Authentication system with JWT + refresh tokens
- 40+ beauty services library with multi-currency support
- Multi-language system (Polish/English/Ukrainian/Russian)
- Messaging Hub (Telegram + Email + WebChat integration)
- n8n automation workflows for customer lifecycle

### 🎨 Design System Requirements

#### Color Palette
```css
/* Primary Beauty Colors */
--beauty-50: #faf8ff    /* Lightest purple background */
--beauty-500: #b084ff   /* Primary purple */
--beauty-600: #9b59ff   /* Darker purple for hover states */
--beauty-900: #6821d9   /* Dark purple for text */

/* Secondary Rose */
--rose-500: #ff4d75     /* Primary pink/rose */
--rose-600: #ff1f5a     /* Darker rose */

/* Neutrals */
--gray-50: #fafbfc      /* Background */
--gray-500: #6c737a     /* Medium text */
--gray-900: #2f3439     /* Dark text */
```

#### Component Standards
- **Sidebar:** 280px width, collapsible to 64px icon-only
- **Cards:** Rounded corners (8px), subtle shadow
- **Buttons:** Rounded (6px), gradient backgrounds for primary actions
- **Forms:** Clean inputs with proper validation states
- **Tables:** Zebra striping, sortable columns, pagination

### 📱 CRM Module Structure

#### Core Navigation (Sidebar)
1. **📅 Calendar** - Appointment scheduling with day/week/month views
2. **👥 Clients** - Customer database with history and segmentation  
3. **💰 Sales** - Revenue tracking, payments, transaction history
4. **📦 Inventory** - Product management, stock levels, suppliers
5. **✂️ Services** - Treatment menu, pricing, categories
6. **👨‍💼 Team** - Staff management, schedules, commissions
7. **⭐ Reviews** - Customer feedback and rating management
8. **🌐 Online Booking** - Public booking settings and links
9. **💬 Messages** - Communication campaigns and automation
10. **📈 Marketing** - Promotions, deals, loyalty programs
11. **📊 Analytics** - Business intelligence and reporting
12. **🔧 Add-ons** - Extended features and integrations
13. **⚙️ Settings** - Salon configuration and preferences

#### Interactive Patterns
- **Right Drawer** - Slide-out panels for editing entities
- **Modal Overlays** - For creating new records
- **Status Toggles** - Quick status changes with visual feedback
- **Empty States** - Helpful CTAs when no data exists
- **Loading States** - Skeleton loaders and progress indicators

### 🛠️ Implementation Stack

#### Frontend Technologies
- **Framework:** React 18 + TypeScript (strict mode)
- **Build Tool:** Vite (fast development and building)
- **Styling:** Tailwind CSS with custom design system
- **State Management:** React Context + React Query for server state
- **Routing:** React Router v6 with nested routes
- **Forms:** React Hook Form + Zod for validation
- **Charts:** Recharts for analytics and reporting
- **Icons:** Lucide React (consistent icon library)
- **Date/Time:** date-fns for date manipulation

#### Code Standards
- **File Structure:** Feature-based organization
- **Components:** Functional components with custom hooks
- **TypeScript:** 100% type coverage, strict configuration
- **Error Handling:** Proper error boundaries and user feedback
- **Performance:** Code splitting, lazy loading, optimistic updates
- **Accessibility:** WCAG 2.1 AA compliance

### 📁 Project Structure
```
apps/web-crm/
├── src/
│   ├── components/
│   │   ├── ui/              # Reusable UI primitives
│   │   ├── layout/          # Layout components (Sidebar, Header)
│   │   ├── forms/           # Form components
│   │   └── charts/          # Chart components
│   ├── pages/
│   │   ├── calendar/        # Calendar module
│   │   ├── clients/         # Client management
│   │   ├── sales/           # Sales tracking
│   │   ├── inventory/       # Product management
│   │   ├── services/        # Service menu
│   │   ├── team/            # Staff management
│   │   ├── messages/        # Communication tools
│   │   ├── analytics/       # Business reports
│   │   └── settings/        # System configuration
│   ├── hooks/               # Custom React hooks
│   ├── services/            # API integration functions
│   ├── stores/              # Context providers and state
│   ├── types/               # TypeScript type definitions
│   └── utils/               # Helper functions and constants
```

### 🎯 Development Tasks (Priority Order)

#### Phase 1A: Foundation Setup
1. **Create CRM App** - Initialize `apps/web-crm` with Vite + React + TypeScript
2. **Design System** - Implement Tailwind config with Beauty Platform colors
3. **Layout Components** - Sidebar navigation and main content area
4. **Routing Setup** - React Router with protected routes
5. **Authentication** - Login flow with JWT token management

#### Phase 1B: Core Modules
1. **Dashboard Overview** - Summary cards with key metrics
2. **Calendar Component** - Full-featured scheduling interface
3. **Client Management** - Table view with search, filter, pagination
4. **Appointment System** - Create/edit appointment workflows
5. **Staff Profiles** - Team member management interface

#### Phase 1C: Advanced Features
1. **Real-time Updates** - WebSocket integration for live data
2. **Advanced Analytics** - Charts and business intelligence
3. **Mobile Responsive** - Complete mobile interface optimization
4. **Performance Optimization** - Code splitting and lazy loading
5. **Testing Suite** - Unit and integration test coverage

### 🔐 Security & Permissions

#### Role-Based Access Control
- **Salon Owner** - Complete system access
- **Admin** - All features except billing/account settings  
- **Staff** - Own schedule + assigned client access
- **Reception** - Booking and basic client management
- **Read-only** - Analytics and reports viewing

#### Data Protection Standards
- **Tenant Isolation** - Strict multi-tenant data separation
- **Input Validation** - Client and server-side validation
- **Audit Logging** - Track all system changes
- **GDPR Compliance** - Data export and deletion capabilities

### 📊 Success Metrics

#### Performance Targets
- **First Contentful Paint** - < 1.5 seconds
- **Time to Interactive** - < 3.5 seconds
- **Bundle Size** - < 500KB gzipped main bundle
- **Lighthouse Score** - 90+ on all metrics

#### User Experience Goals
- **Intuitive Navigation** - < 3 clicks to any feature
- **Fast Operations** - < 200ms response for common actions
- **Error Recovery** - Clear error messages with retry options
- **Accessibility** - Screen reader compatible, keyboard navigation

### 🚀 Deployment Strategy

#### Environment Setup
- **Development** - Local with hot reload
- **Staging** - Preview deployments for testing
- **Production** - Optimized builds with CDN
- **Monitoring** - Error tracking and performance monitoring

#### Quality Gates
- **TypeScript** - No type errors allowed
- **ESLint** - Code quality standards enforced
- **Testing** - 80%+ test coverage for critical paths
- **Accessibility** - Automated a11y testing in CI

---

## 💡 Development Tips for AI Assistants

### Getting Started
1. **Read CRM_DEVELOPMENT_CHECKLIST.md** - Complete feature breakdown
2. **Study Fresha screenshots** - Reference design patterns
3. **Review existing API** - Understand data models and endpoints
4. **Start with Layout** - Build sidebar and routing first

### Best Practices
- **Component Reuse** - Build flexible, reusable UI components
- **Type Safety** - Leverage TypeScript for better development experience
- **User Feedback** - Include loading states and error handling
- **Performance** - Optimize for fast interactions and smooth animations

### Common Patterns
- **Data Fetching** - Use React Query for server state management
- **Form Handling** - React Hook Form with Zod validation schemas
- **State Updates** - Optimistic updates for better user experience
- **Error Boundaries** - Graceful error handling with retry mechanisms

---

**Last Updated:** July 27, 2025  
**Next Milestone:** Complete Phase 1A foundation setup  
**Success Definition:** Full Fresha-style CRM operational for beauty salons