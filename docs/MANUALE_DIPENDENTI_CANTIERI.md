# Manuale Gestione Dipendenti e Cantieri

## BP Cleaning App - Sistema di Assegnazione Personale

---

## Indice

1. [Panoramica](#panoramica)
2. [Struttura Database](#struttura-database)
3. [Dipendenti](#dipendenti)
4. [Cantieri e Gruppi Cliente](#cantieri-e-gruppi-cliente)
5. [Assegnazioni](#assegnazioni)
6. [Report Excel](#report-excel)
7. [Casi Speciali](#casi-speciali)

---

## Panoramica

Il sistema gestisce l'assegnazione dei dipendenti BP Cleaning ai vari cantieri/clienti. Ogni dipendente può essere assegnato a più cantieri, e ogni cantiere può avere più dipendenti assegnati.

### Concetti Chiave

- **Dipendente**: Operatore BP Cleaning con codice univoco (DIP001, DIP002, etc.)
- **Cantiere**: Luogo di lavoro/cliente con codice univoco (1, 2, 3, ... 419)
- **Gruppo Cliente**: Raggruppamento logico di più cantieri appartenenti allo stesso cliente
- **Assegnazione**: Relazione dipendente ↔ cantiere

---

## Struttura Database

### Tabella `workers` (Dipendenti)

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `id` | UUID | Identificatore univoco (auto-generato) |
| `code` | TEXT | Codice dipendente (es. DIP001) - UNIQUE |
| `first_name` | TEXT | Nome |
| `last_name` | TEXT | Cognome |
| `full_name` | TEXT | Nome completo (generato automaticamente) |
| `email` | TEXT | Email aziendale - UNIQUE |
| `phone` | TEXT | Telefono (opzionale) |
| `role` | TEXT | Ruolo: `user`, `superuser`, `manager` |
| `is_active` | BOOLEAN | Se il dipendente è attivo |
| `notes` | TEXT | Note aggiuntive |
| `created_at` | TIMESTAMP | Data creazione |
| `updated_at` | TIMESTAMP | Data ultimo aggiornamento |

### Tabella `worksites` (Cantieri)

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `id` | UUID | Identificatore univoco |
| `code` | TEXT | Codice cantiere (es. 1, 2, 309) |
| `name` | TEXT | Nome cantiere/cliente |
| `client_group` | TEXT | Gruppo cliente per raggruppamenti (opzionale) |
| `address` | TEXT | Indirizzo |
| `monthly_budget` | DECIMAL | Budget mensile |
| `is_active` | BOOLEAN | Se il cantiere è attivo |
| ... | ... | Altri campi esistenti |

### Tabella `worker_assignments` (Assegnazioni)

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `id` | UUID | Identificatore univoco |
| `worker_id` | UUID | FK → workers.id |
| `worksite_id` | UUID | FK → worksites.id |
| `created_at` | TIMESTAMP | Data assegnazione |

**Vincolo**: Combinazione `(worker_id, worksite_id)` deve essere UNIQUE.

---

## Dipendenti

### Lista Dipendenti Attivi

| Codice | Nome Completo | Email | N° Cantieri |
|--------|---------------|-------|-------------|
| DIP001 | Liud Cleider Calderon Garces | l.calderongarces@bpcleaning.it | 12 |
| DIP002 | Giusy De Cubellis | g.decubellis@bpcleaning.it | 6 |
| DIP003 | Ilona Demydasyuk | i.demydasyuk@bpcleaning.it | 7 |
| DIP004 | Domenica Desogos | d.desogos@bpcleaning.it | 14 |
| DIP005 | Samantha Feltrin | s.feltrin@bpcleaning.it | 11 |
| DIP006 | Umberto Galimberti | u.galimberti@bpcleaning.it | 20 |
| DIP007 | Dafne Garghentini | d.garghentini@bpcleaning.it | 11 |
| DIP008 | Luis Cornelio Guzhnay Guapacasa | l.guzhnayguapacasa@bpcleaning.it | 8 |
| DIP009 | Zorka Kastratovic | z.kastratovic@bpcleaning.it | 1 |
| DIP010 | Elvisa Rexaj | e.rexaj@bpcleaning.it | 14 |
| DIP011 | Maria Esther Rodriguez Hernandez | m.rodriguezhernandez@bpcleaning.it | 8 |
| DIP012 | Marco Saccon | m.saccon@bpcleaning.it | 9 |
| DIP013 | Marina Sala | m.sala@bpcleaning.it | 13 |
| DIP014 | Abdelalim Yassim | a.yassim@bpcleaning.it | 1 |
| DIP015 | Valentina Zaro | v.zaro@bpcleaning.it | 13 |

### Formato Email

Le email sono generate nel formato: `{iniziale_nome}.{cognome}@bpcleaning.it`

Esempi:
- Liud Cleider Calderon Garces → `l.calderongarces@bpcleaning.it`
- Maria Esther Rodriguez Hernandez → `m.rodriguezhernandez@bpcleaning.it`

---

## Cantieri e Gruppi Cliente

### Campo `client_group`

Il campo `client_group` permette di raggruppare più cantieri sotto lo stesso cliente. Questo è utile per:

1. **Report per cliente**: Aggregare dati di più sedi/cantieri
2. **Fatturazione**: Raggruppare costi per cliente
3. **Gestione**: Visualizzare tutti i cantieri di un cliente insieme

### Gruppi Cliente Configurati

| Gruppo Cliente | Cantieri Inclusi | Note |
|----------------|------------------|------|
| **AMBULATORI VIGGIU'** | DOTT. EMANUELE MARITAN (269), DOTT. ALFREDO DE NIGRIS (270), DOTT.SSA PAOLA MARIA PATRUNO (409) | 3 studi medici nello stesso edificio |
| **BASE BLU** | BASE BLU (104) | Unifica ex "Negozio Blu", "Base Blu Uffici", "Base Blu Varano Borghi" |
| **FARMACIE POMI** | FARMACIE POMI - SEDE 1 (349), FARMACIE POMI - SEDE 2 (351) | 2 sedi diverse della stessa farmacia |
| **IMPRESA SANGALLI** | IMPRESA SANGALLI VARESE (309), IMPRESA SANGALLI MILANO (419) | Sede Varese + Sede Milano |
| **AZIENDA SPECIALE A. PARMIANI** | AZIENDA SPECIALE "A. PARMIANI" (315) | Ex "Palestra Brenno" |

### Query per Gruppo Cliente

```sql
-- Tutti i cantieri di un gruppo
SELECT * FROM worksites
WHERE client_group = 'AMBULATORI VIGGIU''';

-- Report movimenti per gruppo cliente
SELECT
    w.client_group,
    SUM(m.total_cost) as totale_costo
FROM movements m
JOIN worksites w ON m.worksite_id = w.id
WHERE w.client_group IS NOT NULL
GROUP BY w.client_group;
```

---

## Assegnazioni

### Visualizzare Assegnazioni

```sql
-- Tutti i cantieri di un dipendente
SELECT
    w.code,
    w.first_name || ' ' || w.last_name as dipendente,
    ws.code as cantiere_code,
    ws.name as cantiere,
    ws.client_group
FROM worker_assignments wa
JOIN workers w ON wa.worker_id = w.id
JOIN worksites ws ON wa.worksite_id = ws.id
WHERE w.code = 'DIP001'
ORDER BY ws.name;

-- Tutti i dipendenti di un cantiere
SELECT
    w.code,
    w.first_name || ' ' || w.last_name as dipendente
FROM worker_assignments wa
JOIN workers w ON wa.worker_id = w.id
JOIN worksites ws ON wa.worksite_id = ws.id
WHERE ws.code = '309'
ORDER BY w.last_name;
```

### Aggiungere Assegnazione

```sql
INSERT INTO worker_assignments (worker_id, worksite_id)
SELECT w.id, ws.id
FROM workers w, worksites ws
WHERE w.code = 'DIP001' AND ws.code = '100';
```

### Rimuovere Assegnazione

```sql
DELETE FROM worker_assignments
WHERE worker_id = (SELECT id FROM workers WHERE code = 'DIP001')
AND worksite_id = (SELECT id FROM worksites WHERE code = '100');
```

---

## Report Excel

### File di Riferimento

**Percorso**: `public/BP_Dipendenti_Cantieri_Finale.xlsx`

### Struttura

**Foglio 1: Dipendenti**
| Colonna | Contenuto |
|---------|-----------|
| A | Codice (DIP001, DIP002, ...) |
| B | Nome |
| C | Cognome |
| D | Email |
| E | Telefono |
| F | Ruolo |
| G | Attivo |

**Foglio 2: Assegnazioni**
| Colonna | Contenuto |
|---------|-----------|
| A | Codice Dipendente |
| B | Nome Dipendente |
| C | Codice Cantiere |
| D | Nome Cantiere |
| E | Gruppo Cliente |

### Rigenerare Excel

Per rigenerare il file Excel con i dati aggiornati dal database:

```sql
-- Query per foglio Dipendenti
SELECT
    code, first_name, last_name, email, phone, role, is_active
FROM workers
ORDER BY code;

-- Query per foglio Assegnazioni
SELECT
    w.code as worker_code,
    w.first_name || ' ' || w.last_name as worker_name,
    ws.code as worksite_code,
    ws.name as worksite_name,
    ws.client_group
FROM worker_assignments wa
JOIN workers w ON wa.worker_id = w.id
JOIN worksites ws ON wa.worksite_id = ws.id
ORDER BY w.code, ws.name;
```

---

## Casi Speciali

### 1. AMBULATORI VIGGIU'

Tre studi medici distinti che condividono lo stesso edificio ad Arcisate. Mantengono codici separati per fatturazione individuale ma sono raggruppati per report aggregati.

| Cantiere | Codice | Dipendenti Assegnati |
|----------|--------|----------------------|
| DOTT. EMANUELE MARITAN | 269 | DIP004, DIP007, DIP012, DIP013 |
| DOTT. ALFREDO DE NIGRIS | 270 | DIP004, DIP007, DIP012, DIP013 |
| DOTT.SSA PAOLA MARIA PATRUNO | 409 | DIP004, DIP007, DIP012, DIP013 |

**Nota**: DOTT. MARCOMARIA CAPPELLO (codice 271) è un cliente SEPARATO, non fa parte di AMBULATORI VIGGIU'.

### 2. IMPRESA SANGALLI

Due sedi operative:
- **VARESE** (codice 309): Sede storica, include ex "Sangalli Front Office"
- **MILANO** (codice 419): Nuova sede, include ex "Discarica Sangalli"

### 3. BASE BLU

Unificazione di tre entry precedenti:
- Negozio Blu
- Base Blu Uffici
- Base Blu Varano Borghi

Ora esiste un unico cantiere BASE BLU (codice 104).

### 4. FARMACIE POMI

Due sedi fisicamente separate della stessa farmacia:
- SEDE 1 (codice 349)
- SEDE 2 (codice 351)

### 5. Cantieri Eliminati

I seguenti codici sono stati eliminati perché duplicati o errati:
- 410-418: Rimossi dopo normalizzazione

---

## Manutenzione

### Aggiungere Nuovo Dipendente

1. Inserire in tabella `workers`:
```sql
INSERT INTO workers (code, first_name, last_name, email, role, is_active)
VALUES ('DIP016', 'Mario', 'Rossi', 'm.rossi@bpcleaning.it', 'user', true);
```

2. Assegnare ai cantieri:
```sql
INSERT INTO worker_assignments (worker_id, worksite_id)
SELECT w.id, ws.id
FROM workers w, worksites ws
WHERE w.code = 'DIP016' AND ws.code IN ('100', '101', '102');
```

### Creare Nuovo Gruppo Cliente

1. Identificare i cantieri da raggruppare
2. Aggiornare il campo `client_group`:
```sql
UPDATE worksites
SET client_group = 'NUOVO GRUPPO'
WHERE code IN ('100', '101', '102');
```

### Backup

Eseguire regolarmente backup del database Supabase e del file Excel di riferimento.

---

## Sistema Autenticazione

### Creazione Account Utenti

Gli account utente vengono creati dall'amministratore tramite la pagina **Impostazioni → Utenti**.

**Funzionalità**:
- Creazione utente con email alias (es. `m.rossi@bpcleaning.it`)
- Redirect email per password reset (tutte le email alias puntano a `info@bpcleaning.it`)
- Password auto-generata mostrata una sola volta
- Collegamento automatico con record `workers` se email corrisponde

### Alias Email

Tutte le email dei dipendenti sono alias che puntano a `info@bpcleaning.it`:
- Login avviene con email alias (es. `l.calderongarces@bpcleaning.it`)
- Reset password viene inviato a `info@bpcleaning.it`
- L'admin può poi impostare la nuova password e comunicarla al dipendente

### API Endpoints

**POST `/api/users/create`** - Crea singolo utente
```json
{
  "email": "m.rossi@bpcleaning.it",
  "full_name": "Mario Rossi",
  "role": "user",
  "redirect_email": "info@bpcleaning.it"
}
```

**POST `/api/users/create-batch`** - Crea utenti in batch
```json
{
  "users": [
    { "email": "...", "full_name": "..." }
  ],
  "default_redirect_email": "info@bpcleaning.it"
}
```

### Collegamento Workers ↔ Auth Users

La tabella `workers` ha un campo `user_id` che viene popolato automaticamente quando:
1. Si crea un utente con email corrispondente a un worker esistente
2. L'admin collega manualmente i record

---

*Ultimo aggiornamento: Febbraio 2026*
