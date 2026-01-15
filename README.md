# BP Cleaning - Sistema Gestione Magazzino

Sistema web/mobile per la gestione del magazzino di un'impresa di pulizie. Traccia prodotti, movimenti (carico/scarico), cantieri e genera report Excel.

## 🚀 Quick Start

### 1. Setup Supabase (Database)

1. Vai su [supabase.com](https://supabase.com) e crea un account gratuito
2. Crea un nuovo progetto (scegli una regione europea per velocità)
3. Attendi che il progetto sia pronto (~2 minuti)
4. Vai su **SQL Editor** nel menu laterale
5. Copia tutto il contenuto di `supabase-schema.sql` e incollalo nell'editor
6. Clicca **Run** per eseguire lo script
7. Vai su **Settings** → **API** e copia:
   - `Project URL` 
   - `anon public` key

### 2. Configura il Progetto

```bash
# Clona o scarica il progetto
cd bp-cleaning

# Copia il file di configurazione
cp .env.local.example .env.local

# Modifica .env.local con le tue chiavi Supabase
# NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Installa dipendenze
npm install

# Avvia in sviluppo
npm run dev
```

### 3. Crea il Primo Superuser (Admin)

1. Apri l'app su `http://localhost:3000`
2. Registra un nuovo utente con l'email dell'admin
3. Vai su Supabase → **Table Editor** → tabella `profiles`
4. Trova l'utente e cambia `role` da `user` a `superuser`

### 4. Deploy su Vercel

```bash
# Installa Vercel CLI
npm i -g vercel

# Deploy
vercel

# Segui le istruzioni e aggiungi le variabili d'ambiente
```

---

## 📱 Funzionalità

### Per tutti gli utenti (User)
- ✅ Dashboard con statistiche
- ✅ Visualizza prodotti e giacenze
- ✅ Carico merce (arrivo prodotti)
- ✅ Scarico merce per cantiere (con scanner barcode)
- ✅ Storico movimenti
- ✅ Visualizza cantieri e costi
- ✅ Export report Excel

### Solo Admin (Superuser)
- ✅ Crea/modifica prodotti
- ✅ Crea/modifica cantieri
- ✅ Gestisci fornitori
- ✅ Gestisci utenti

---

## 📊 Struttura Database

```
PRODUCTS (Prodotti)
├── barcode, name, category
├── unit, unit_cost, current_stock, min_stock
└── supplier_id

WORKSITES (Cantieri)
├── code, name, address, city
├── client_name, budget_allocated
└── status (active/paused/completed)

MOVEMENTS (Movimenti)
├── type (carico/scarico)
├── product_id, worksite_id, quantity
├── unit_cost_at_time, total_cost
└── operator_id, created_at
```

---

## 📁 Template Excel per Import

### Prodotti
| barcode | name | category | unit | quantity_per_package | unit_cost | current_stock | min_stock |
|---------|------|----------|------|---------------------|-----------|---------------|-----------|
| 8001234567890 | Detergente Pavimenti 5L | detergente | litri | 5 | 12.50 | 24 | 10 |

**Categorie:** detergente, sgrassatore, disinfettante, lucidante, deodorante, accessorio, attrezzatura, altro

**Unità:** litri, pezzi, kg, ml, rotoli, confezioni

### Cantieri
| code | name | address | city | client_name | budget_allocated | status |
|------|------|---------|------|-------------|-----------------|--------|
| CO01 | Uffici Tecnopark | Via Roma 123 | Milano | Tecnopark Srl | 500 | active |

---

## 📄 Licenza

Progetto privato - BP Cleaning
