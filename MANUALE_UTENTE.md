# BP Cleaning App - Manuale Operativo

## Accesso all'App

**URL**: https://bp-cleaning-app.vercel.app

### Login
1. Apri l'app dal browser (funziona anche da smartphone)
2. Inserisci email e password
3. Clicca "Accedi"

### Ruoli Utente
- **Operatore**: Può fare carichi, scarichi e visualizzare prodotti
- **Admin (Superuser)**: Può anche creare/modificare prodotti, cantieri, utenti

---

## Navigazione

L'app ha una barra di navigazione in basso con 5 sezioni:

| Icona | Sezione | Descrizione |
|-------|---------|-------------|
| 🏠 | Home | Dashboard con riepilogo |
| 📦 | Prodotti | Lista prodotti e giacenze |
| 📋 | Movimenti | Storico e nuovi movimenti |
| 🏗️ | Cantieri | Lista cantieri/clienti |
| ⚙️ | Altro | Impostazioni e report |

---

## Prodotti

### Visualizzare Prodotti
1. Vai su **Prodotti** dalla barra in basso
2. Usa la barra di ricerca per cercare per nome o barcode
3. Clicca "Solo scorte basse" per filtrare prodotti da riordinare

### Codici Prodotto
Ogni prodotto ha due codici:
- **SKU**: `BP-DET001` (codice interno per categoria)
- **Barcode**: `BPC00001` (codice per etichette e scanner)

### Stati Giacenza
- 🟢 **OK** - Giacenza sopra la scorta minima
- 🟡 **BASSO** - Giacenza vicina alla scorta minima
- 🔴 **RIORDINO** - Giacenza sotto la scorta minima

### Creare Nuovo Prodotto (Solo Admin)
1. Vai su **Prodotti**
2. Clicca il pulsante **+** blu in basso a destra
3. Compila i campi:
   - Nome prodotto (obbligatorio)
   - Categoria
   - Unità di misura
   - Quantità per confezione
   - Costo unitario €
   - Giacenza iniziale
   - Scorta minima
   - Fornitore (opzionale)
4. Clicca **Crea Prodotto**

> I codici SKU e Barcode vengono generati automaticamente!

### Dettaglio Prodotto
Clicca su un prodotto per vedere:
- Giacenza attuale e stato
- Prezzo unitario
- Fornitore
- Pulsanti rapidi per Carico/Scarico

---

## Movimenti

### Tipi di Movimento
- **Carico**: Merce in entrata (dal fornitore al magazzino)
- **Scarico**: Merce in uscita (dal magazzino al cantiere)

### Fare un Carico
1. Vai su **Movimenti** → **Carico** (pulsante verde)
2. Seleziona il prodotto (o scansiona barcode)
3. Inserisci la quantità
4. Aggiungi note (opzionale)
5. Clicca **Registra Carico**

### Fare uno Scarico
1. Vai su **Movimenti** → **Scarico** (pulsante rosso)
2. Seleziona il cantiere di destinazione
3. Seleziona il prodotto
4. Inserisci la quantità
5. Aggiungi note (opzionale)
6. Clicca **Registra Scarico**

### Storico Movimenti
- Vai su **Movimenti** per vedere tutti i movimenti
- Filtra per tipo (carico/scarico) o cerca per prodotto
- Ogni movimento mostra: data, prodotto, quantità, operatore

---

## Cantieri

### Lista Cantieri
- Vai su **Cantieri** dalla barra in basso
- Vedi tutti i cantieri attivi con indirizzo e budget

### Dettaglio Cantiere
Clicca su un cantiere per vedere:
- Dati cliente (nome, telefono, email)
- Indirizzo completo
- Budget allocato vs speso
- Storico scarichi per quel cantiere

---

## Report & Export (Sezione Altro)

### Report Disponibili
1. **Inventario Completo** - Tutti i prodotti con giacenze e valori
2. **Costi per Cantiere** - Spese prodotti per ogni cantiere (mese corrente)
3. **Storico Movimenti** - Tutti i carichi e scarichi del mese
4. **Prodotti da Riordinare** - Lista prodotti sotto scorta minima

### Come Esportare
1. Vai su **Altro** → **Report & Export**
2. Clicca sul report desiderato
3. Il file Excel viene scaricato automaticamente

---

## Stampa Etichette

### Generare Etichette con Barcode
1. Vai su **Altro** → **Stampa Etichette**
2. Seleziona i prodotti da stampare
3. Scegli il formato etichetta
4. Clicca **Genera PDF**
5. Stampa il PDF

---

## Scansione Barcode

L'app supporta la scansione barcode da smartphone:
1. Nella schermata Carico o Scarico, clicca l'icona 📷
2. Inquadra il barcode con la fotocamera
3. Il prodotto viene selezionato automaticamente

---

## Domande Frequenti

### Come cambio la mia password?
Contatta l'amministratore per il reset password.

### Un prodotto non ha il prezzo, come lo aggiungo?
Solo gli admin possono modificare i prodotti. Vai su Prodotti → clicca il prodotto → Modifica.

### Come aggiungo un nuovo cantiere?
Vai su Cantieri → clicca + → compila i dati del cliente.

### L'app non carica, cosa faccio?
1. Verifica la connessione internet
2. Prova a ricaricare la pagina
3. Se il problema persiste, contatta l'amministratore

---

## Contatti Supporto

Per problemi tecnici o richieste:
- Email: [inserire email supporto]
- Tel: [inserire telefono]

---

*Versione Manuale: 1.0 - Gennaio 2026*
