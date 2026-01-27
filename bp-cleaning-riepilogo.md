# 🧹 BP Cleaning App - Riassunto Progetto

## 📍 Repository GitHub
**https://github.com/Catholically/bp-cleaning-app**

## 🚀 Deploy Vercel
**https://bp-cleaning-app.vercel.app**

## 🗄️ Database Supabase
- **URL**: `https://nesvkpyngurlkmduyywy.supabase.co`
- **Progetto**: BP Cleaning

---

## 📊 Tabelle Database

### 1. profiles
Utenti dell'app
- `id` (UUID, collegato a auth.users)
- `email`
- `full_name`
- `role` ('user', 'manager' o 'superuser')

### 2. user_worksites
Assegnazione utenti ai cantieri
- `id` (UUID)
- `user_id` (FK → profiles)
- `worksite_id` (FK → worksites)
- `created_at`

### 3. suppliers
Fornitori prodotti
- `id`, `name`, `contact_email`, `phone`, `notes`

### 4. products
Prodotti magazzino
- `id`, `barcode` (univoco)
- `name`, `description`
- `category` (detergenti, carta, attrezzature, DPI, varie)
- `unit` (pz, lt, kg, rotolo, pacco)
- `current_stock`, `min_stock`
- `cost_per_unit`
- `supplier_id`

### 5. worksites
Cantieri/clienti
- `id`, `code` (es. CANT-001)
- `name`, `address`
- `contact_name`, `contact_phone`
- `monthly_budget`
- `is_active`

### 6. movements
Movimenti carico/scarico
- `id`, `type` ('carico' o 'scarico')
- `product_id`, `worksite_id` (solo per scarico)
- `quantity`, `unit_cost`, `total_cost` (calcolato auto)
- `notes`, `created_by`

---

## 👥 Ruoli e Permessi

L'app supporta 3 ruoli utente con permessi differenziati:

### Superuser (Admin)
Il superuser ha accesso completo a tutte le funzionalità:
- ✅ Dashboard
- ✅ Prodotti (visualizza, crea, modifica, elimina)
- ✅ Movimenti (carico/scarico su tutti i cantieri)
- ✅ Cantieri (tutti i cantieri)
- ✅ Fornitori (gestione completa)
- ✅ Utenti (gestione ruoli e assegnazione cantieri)
- ✅ Report & Export (tutti i report con costi)
- ✅ Stampa Etichette

### Manager (Gestore Dati)
Il manager gestisce i dati anagrafici ma NON vede costi e movimenti:
- ✅ Dashboard
- ✅ Prodotti (visualizza prezzi per inserimento)
- ❌ **Movimenti (NESSUN ACCESSO)**
- ✅ Cantieri (solo quelli assegnati)
- ✅ Fornitori (può aggiungere/modificare)
- ❌ Utenti (nessun accesso)
- ❌ **Report (NESSUN ACCESSO ai costi)**
- ✅ Stampa Etichette

### User (Operatore)
L'operatore registra movimenti sui propri cantieri assegnati:
- ✅ Dashboard
- ✅ Prodotti (solo visualizzazione)
- ✅ Movimenti (solo sui cantieri assegnati)
- ✅ Cantieri (solo quelli assegnati)
- ❌ Fornitori (nessun accesso)
- ❌ Utenti (nessun accesso)
- ❌ Report (nessun accesso)
- ❌ Stampa Etichette (nessun accesso)

### Tabella Riepilogativa Permessi

| Funzionalità | Superuser | Manager | User |
|--------------|:---------:|:-------:|:----:|
| Dashboard | ✅ | ✅ | ✅ |
| Prodotti | ✅ CRUD | ✅ R | ✅ R |
| Movimenti | ✅ Tutti | ❌ | ✅ Assegnati |
| Cantieri | ✅ Tutti | ✅ Assegnati | ✅ Assegnati |
| Fornitori | ✅ CRUD | ✅ CR | ❌ |
| Gestione Utenti | ✅ | ❌ | ❌ |
| Report/Costi | ✅ | ❌ | ❌ |
| Etichette | ✅ | ✅ | ❌ |

*CRUD = Create, Read, Update, Delete | R = Read only | CR = Create, Read*

### Assegnazione Cantieri

Il superuser può assegnare cantieri specifici a utenti e manager dalla pagina **Impostazioni → Utenti**:
1. Selezionare l'utente dalla lista
2. Cliccare sulla tab "Cantieri"
3. Selezionare/deselezionare i cantieri da assegnare
4. Salvare le modifiche

Gli utenti e manager vedranno solo i cantieri a loro assegnati nelle relative sezioni dell'app.

---

## ⚙️ Environment Variables (Vercel)

```env
NEXT_PUBLIC_SUPABASE_URL=https://nesvkpyngurlkmduyywy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[inserisci la chiave anon]
```

---

## 📱 Pagine App

| Route | Descrizione | Accesso |
|-------|-------------|---------|
| `/login` | Autenticazione email/password | Tutti |
| `/` | Dashboard home | Tutti |
| `/prodotti` | Lista prodotti, filtro scorte basse | Tutti |
| `/prodotti/nuovo` | Creazione nuovo prodotto | Superuser |
| `/prodotti/[id]` | Dettaglio/modifica prodotto | Superuser |
| `/movimenti` | Storico tutti i movimenti | Superuser, User |
| `/movimenti/carico` | Form carico merce | Superuser, User |
| `/movimenti/scarico` | Form scarico per cantiere | Superuser, User |
| `/cantieri` | Lista cantieri | Tutti (filtrato) |
| `/cantieri/[id]` | Dettaglio cantiere | Tutti (filtrato) |
| `/fornitori` | Gestione fornitori | Superuser, Manager |
| `/utenti` | Gestione utenti e assegnazione cantieri | Solo Superuser |
| `/report` | Report Excel con costi | Solo Superuser |
| `/etichette` | Generatore etichette barcode | Superuser, Manager |
| `/impostazioni` | Menu settings e logout | Tutti |

---

## 🔧 SQL Trigger per Auto-Creazione Profili

Eseguire in **Supabase → SQL Editor**:

```sql
-- Funzione per creare automaticamente il profilo utente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger che si attiva alla registrazione
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Enable insert for authentication" ON profiles;
CREATE POLICY "Enable insert for authentication" ON profiles
  FOR INSERT WITH CHECK (true);
```

---

## 🎨 Branding
- **Logo**: Goccia blu con "BP" bianco
- **Colori**: Blu primario (#3B82F6), sfondo grigio chiaro

---

## 📋 Prossimi Step Suggeriti
1. ✅ Eseguire il trigger SQL per auto-creazione profili
2. Aggiungere scanner barcode per mobile
3. Gestione fornitori completa
4. Report PDF mensili per cantiere
5. Notifiche scorte basse

---

*Ultimo aggiornamento: 27 Gennaio 2026*
