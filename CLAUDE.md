# CLAUDE.md - BP Cleaning App

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BP Cleaning App is a warehouse management system for cleaning supplies. It tracks products, manages inventory movements (inbound/outbound), and monitors worksite budgets.

**Company**: BP Cleaning
**Stack**: Next.js 15 (App Router), React 19, TypeScript, Supabase (PostgreSQL + Auth), Tailwind CSS 4
**URL Produzione**: https://bp-cleaning-app.vercel.app
**Supabase Project ID**: nesvkpyngurlkmduyywy

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
│   │   │   ├── page.tsx    # Product list
│   │   │   ├── [id]/       # Product detail
│   │   │   └── nuovo/      # Create new product
│   │   ├── movimenti/      # Movement history + carico/scarico
│   │   ├── cantieri/       # Worksites
│   │   ├── report/         # Excel exports
│   │   ├── etichette/      # Barcode label printing
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

### Database (Supabase)

**Tables**:
- `products` - 110 prodotti attivi con barcode, SKU, costi, fornitori
- `suppliers` - 11 fornitori (FOR001-FOR011)
- `worksites` - 101 cantieri/clienti
- `movements` - Storico movimenti carico/scarico
- `profiles` - Utenti collegati a auth.users

**RLS** (Row Level Security) enabled on all tables.

## Codici Prodotto

### SKU (Stock Keeping Unit)
Formato: `BP-XXX000` dove XXX = categoria

| Categoria | Prefisso | Esempio |
|-----------|----------|---------|
| Detergente | DET | BP-DET001 |
| Sgrassatore | SGR | BP-SGR001 |
| Disinfettante | DIS | BP-DIS001 |
| Lucidante | LUC | BP-LUC001 |
| Deodorante | DEO | BP-DEO001 |
| Accessorio | ACC | BP-ACC001 |
| Attrezzatura | ATT | BP-ATT001 |
| Altro | ALT | BP-ALT001 |

### Barcode
Formato: `BPCxxxxx` (8 caratteri)
- Generato automaticamente alla creazione prodotto
- Sequenziale: BPC00001, BPC00002, ...
- Attualmente 110 prodotti (BPC00001 - BPC00110)

## Fornitori

| Codice | Nome |
|--------|------|
| FOR001 | CleanPro Italia |
| FOR002 | Detergenti Express |
| FOR003 | EcoClean Srl |
| FOR004 | Professional Clean |
| FOR005 | Hygiene Solutions |
| FOR006 | S.G. PROFESSIONAL Srls |
| FOR007 | TORNADO VARESE SRL |
| FOR008 | ERREMME SRL |
| FOR009 | DIPRES SRL |
| FOR010 | SAN GIORGIO MONZA |
| FOR011 | CINESI MILANO |

## Key Patterns

### Supabase Clients
- Browser: `lib/supabase/client.ts` - Use in client components
- Server: `lib/supabase/server.ts` - Use in server components/middleware

### Styling
- Water/ocean theme defined in `globals.css` with CSS variables
- Primary blue (#3B82F6), mobile-first design
- Custom animations: slideUp, fadeIn, shimmer

### Utilities (`lib/utils.ts`)
- `formatCurrency(amount)` - EUR formatting
- `formatDate(date)` / `formatDateTime(date)` - Italian date format
- `cn()` - Tailwind class merging (clsx + tailwind-merge)

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL     # https://nesvkpyngurlkmduyywy.supabase.co
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
- Giacenza = Stock level
- Scorta minima = Minimum stock threshold

## Deploy

```bash
git add . && git commit -m "descrizione" && git push
vercel --prod --yes
```

---
*Ultimo aggiornamento: Gennaio 2026*
