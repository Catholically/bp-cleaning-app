# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BP Cleaning App is a warehouse management system for cleaning supplies. It tracks products, manages inventory movements (inbound/outbound), and monitors worksite budgets.

**Stack**: Next.js 16 (App Router), React 19, TypeScript, Supabase (PostgreSQL + Auth), Tailwind CSS 4

## Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run lint     # Run ESLint
npm start        # Start production server
```

## Architecture

### Directory Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (app)/              # Protected routes (requires auth)
│   │   ├── prodotti/       # Product inventory
│   │   ├── movimenti/      # Movement history + carico/scarico
│   │   ├── cantieri/       # Worksites
│   │   ├── report/         # Excel exports
│   │   └── impostazioni/   # Admin settings
│   └── login/              # Public auth page
├── components/
│   ├── dashboard/          # Role-specific dashboards
│   ├── navigation/         # Bottom nav (mobile)
│   └── providers/          # Auth context
└── lib/
    ├── types.ts            # All TypeScript interfaces
    ├── utils.ts            # Formatting, barcode generation
    └── supabase/           # Client/server Supabase setup
```

### Authentication Flow

1. `middleware.ts` protects routes, redirects to `/login` if unauthenticated
2. `AuthProvider` manages session state via Supabase Auth
3. Two roles: `user` (operators) and `superuser` (admins with full access)
4. User profiles are auto-created on signup via database trigger

### Data Model

Core entities in `lib/types.ts`:
- **Product** - Inventory items with barcode, stock levels, min/max thresholds
- **Movement** - Carico (inbound) / Scarico (outbound) transactions
- **Worksite** - Job sites with monthly budget tracking
- **Supplier** - Product vendors
- **Profile** - User accounts with role field

### Database

- Schema defined in `supabase-schema.sql`
- RLS (Row Level Security) enabled on all tables
- Direct Supabase client calls (no custom API layer)

## Key Patterns

### Supabase Clients
- Browser: `lib/supabase/client.ts` - Use in client components
- Server: `lib/supabase/server.ts` - Use in server components/middleware

### Styling
- Water/ocean theme defined in `globals.css` with CSS variables
- Primary blue (#0EA5E9), mobile-first design
- Custom animations: slideUp, fadeIn, shimmer, scanner-line

### Utilities (`lib/utils.ts`)
- `formatCurrency(amount)` - EUR formatting
- `formatDate(date)` / `formatDateTime(date)` - Italian date format
- `generateBarcode()` - EAN-13 with check digit (200 prefix)
- `getStockStatusColor/Label/Bg()` - Stock level indicators
- `cn()` - Tailwind class merging (clsx + tailwind-merge)

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL     # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY # Supabase anonymous key
```

## Language

The application UI is in Italian. Key terms:
- Prodotti = Products
- Movimenti = Movements
- Carico = Inbound (receiving goods)
- Scarico = Outbound (sending to worksites)
- Cantieri = Worksites/Job sites
- Fornitori = Suppliers
