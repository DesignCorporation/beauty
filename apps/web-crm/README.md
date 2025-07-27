# Beauty CRM - Web Application

Nowoczesna aplikacja CRM dla salonów piękności oparta na React + TypeScript.

## Funkcjonalności

### ✅ Zaimplementowane
- **Autentyfikacja JWT** z tenant izolacją
- **Responsywny Layout** z boczną nawigacją
- **Dashboard** ze statystykami i szybkimi akcjami
- **Kalendarz** - zarządzanie wizytami (placeholder)
- **Usługi** - katalog usług z cenami
- **Klienci** - baza klientów z historią wizyt
- **Zespół** - zarządzanie pracownikami

### 🔄 W planach
- Pełny kalendarz z drag & drop
- Moduł raportów i analityk
- Integracja z systemem płatności
- Zarządzanie zapasami
- Moduł marketingu (SMS/Email)

## Stack technologiczny

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS z customową paletą kolorów
- **Routing**: React Router v6
- **State Management**: React Context + Reducers
- **HTTP Client**: Axios z interceptorami
- **Icons**: Lucide React

## Kolory marki

- **Primary**: #7c3aed (fioletowy)
- **Accent**: #f59e0b (pomarańczowy)
- **Background**: #f8fafc (jasny szary)

## Struktura katalogów

```
src/
├── components/     # Komponenty layout'u
├── contexts/       # React Contexts (Auth)
├── lib/           # Utilities (API client)
├── pages/         # Komponenty stron
├── types/         # TypeScript typy
└── index.css      # Globalne style Tailwind
```

## Uruchomienie

```bash
# Zainstaluj zależności
pnpm install

# Uruchom dev server
pnpm dev

# Build produkcyjny
pnpm build

# Type checking
pnpm typecheck
```

## API Integration

Aplikacja komunikuje się z backendem przez REST API:

- **Base URL**: `/api/v1`
- **Auth**: Bearer JWT token w headerze
- **Tenant**: Automatyczna izolacja przez JWT claims

### Endpointy:
- `POST /auth/login` - Logowanie
- `GET /auth/me` - Dane użytkownika
- `GET /clients` - Lista klientów
- `GET /services` - Lista usług
- `GET /staff` - Lista pracowników

## Bezpieczeństwo

- **JWT Authentication** z auto-logout przy 401
- **Tenant Isolation** - każdy salon widzi tylko swoje dane
- **Protected Routes** - automatyczne przekierowanie do loginu
- **TypeScript** - silne typowanie dla bezpieczeństwa

## Responsive Design

- **Desktop First** z 240px sidebar
- **Mobile** - zwinięty sidebar z hamburger menu
- **Tablet** - adaptacyjny layout
- **Touch-friendly** - większe elementy dotykowe

## Wydajność

- **Code Splitting** przez React Router
- **Lazy Loading** komponentów
- **Optimized Bundle** przez Vite
- **Tree Shaking** dla minimal bundle size

---

**Maintainer**: DesignCorporation  
**Version**: 0.0.1  
**License**: Private
