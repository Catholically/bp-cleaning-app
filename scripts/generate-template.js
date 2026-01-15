const XLSX = require('xlsx');
const path = require('path');

// Crea workbook
const wb = XLSX.utils.book_new();

// =============================================
// TAB 1: PRODOTTI
// =============================================
const prodottiData = [
  // Header con istruzioni
  ['TEMPLATE IMPORTAZIONE PRODOTTI - BP Cleaning'],
  [''],
  ['ISTRUZIONI:'],
  ['- Compila i campi obbligatori (*)'],
  ['- barcode: codice a barre univoco (opzionale ma consigliato)'],
  ['- category: detergente, sgrassatore, disinfettante, lucidante, deodorante, accessorio, attrezzatura, altro'],
  ['- unit: litri, pezzi, kg, ml, rotoli, confezioni'],
  ['- supplier_code: codice fornitore (es. FOR001) - deve esistere in Fornitori'],
  [''],
  // Header colonne
  ['barcode', 'name *', 'category *', 'unit *', 'quantity_per_package', 'unit_cost *', 'current_stock', 'min_stock', 'supplier_code', 'notes'],
  // Esempi
  ['8001234567001', 'Detergente Pavimenti 5L', 'detergente', 'litri', 5, 12.50, 20, 10, 'FOR001', 'Prodotto principale'],
  ['8001234567002', 'Sgrassatore Universale 1L', 'sgrassatore', 'litri', 1, 4.80, 30, 15, 'FOR001', ''],
  ['8001234567003', 'Disinfettante Superfici 5L', 'disinfettante', 'litri', 5, 18.90, 15, 10, 'FOR002', 'Per cliniche'],
  ['8001234567004', 'Guanti Nitrile M (conf.100)', 'accessorio', 'confezioni', 100, 12.00, 10, 5, 'FOR002', ''],
  ['8001234567005', 'Mocio Professionale', 'attrezzatura', 'pezzi', 1, 25.00, 8, 3, 'FOR003', ''],
  ['', '', '', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', '', '', ''],
];

const wsProdotti = XLSX.utils.aoa_to_sheet(prodottiData);
wsProdotti['!cols'] = [
  { wch: 16 }, // barcode
  { wch: 35 }, // name
  { wch: 14 }, // category
  { wch: 12 }, // unit
  { wch: 20 }, // quantity_per_package
  { wch: 12 }, // unit_cost
  { wch: 14 }, // current_stock
  { wch: 12 }, // min_stock
  { wch: 14 }, // supplier_code
  { wch: 30 }, // notes
];
XLSX.utils.book_append_sheet(wb, wsProdotti, 'Prodotti');

// =============================================
// TAB 2: CANTIERI
// =============================================
const cantieriData = [
  ['TEMPLATE IMPORTAZIONE CANTIERI - BP Cleaning'],
  [''],
  ['ISTRUZIONI:'],
  ['- Compila i campi obbligatori (*)'],
  ['- code: codice univoco cantiere (es. CO01, CO02)'],
  ['- status: active, paused, completed'],
  ['- budget_allocated: budget mensile in euro'],
  ['- start_date/end_date: formato YYYY-MM-DD'],
  [''],
  // Header
  ['code *', 'name *', 'address *', 'city *', 'client_name', 'client_contact', 'budget_allocated', 'start_date', 'end_date', 'status', 'notes'],
  // Esempi
  ['CO01', 'Uffici Tecnopark', 'Via Roma 123', 'Milano', 'Tecnopark Srl', 'Mario Rossi - 02 1234567', 500, '2025-01-01', '', 'active', 'Pulizia giornaliera'],
  ['CO02', 'Condominio Belvedere', 'Via Dante 45', 'Roma', 'Amm. Belvedere', 'Laura Bianchi', 350, '2025-02-15', '', 'active', 'Scale e androne'],
  ['CO03', 'Centro Commerciale Nord', 'Via Torino 78', 'Torino', 'Galleria Nord SpA', '', 800, '2025-01-10', '', 'active', ''],
  ['CO04', 'Scuola Manzoni', 'Piazza Manzoni 1', 'Firenze', 'Comune di Firenze', '', 400, '2025-03-01', '2025-06-15', 'active', 'Anno scolastico'],
  ['CO05', 'Clinica San Marco', 'Viale Salute 22', 'Bologna', 'Clinica San Marco Srl', '', 600, '2025-01-20', '', 'active', 'Sanificazione'],
  ['', '', '', '', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', '', '', '', ''],
];

const wsCantieri = XLSX.utils.aoa_to_sheet(cantieriData);
wsCantieri['!cols'] = [
  { wch: 10 }, // code
  { wch: 30 }, // name
  { wch: 25 }, // address
  { wch: 14 }, // city
  { wch: 22 }, // client_name
  { wch: 25 }, // client_contact
  { wch: 16 }, // budget
  { wch: 12 }, // start_date
  { wch: 12 }, // end_date
  { wch: 10 }, // status
  { wch: 30 }, // notes
];
XLSX.utils.book_append_sheet(wb, wsCantieri, 'Cantieri');

// =============================================
// TAB 3: FORNITORI
// =============================================
const fornitoriData = [
  ['TEMPLATE IMPORTAZIONE FORNITORI - BP Cleaning'],
  [''],
  ['ISTRUZIONI:'],
  ['- Compila i campi obbligatori (*)'],
  ['- code: codice univoco fornitore (es. FOR001, FOR002)'],
  ['- Usa questo codice nel tab Prodotti per associare'],
  [''],
  // Header
  ['code *', 'name *', 'contact_name', 'email', 'phone', 'address', 'notes'],
  // Esempi
  ['FOR001', 'CleanPro Italia', 'Marco Rossi', 'info@cleanpro.it', '+39 02 1234567', 'Via Industria 10, Milano', 'Fornitore principale'],
  ['FOR002', 'Detergenti Express', 'Laura Bianchi', 'ordini@detergentiexpress.it', '+39 06 7654321', 'Via Commercio 5, Roma', 'Consegna rapida'],
  ['FOR003', 'EcoClean Srl', 'Paolo Verdi', 'vendite@ecoclean.it', '+39 011 9876543', 'Via Verde 20, Torino', 'Prodotti eco'],
  ['', '', '', '', '', '', ''],
  ['', '', '', '', '', '', ''],
];

const wsFornitori = XLSX.utils.aoa_to_sheet(fornitoriData);
wsFornitori['!cols'] = [
  { wch: 10 }, // code
  { wch: 25 }, // name
  { wch: 18 }, // contact_name
  { wch: 28 }, // email
  { wch: 18 }, // phone
  { wch: 35 }, // address
  { wch: 30 }, // notes
];
XLSX.utils.book_append_sheet(wb, wsFornitori, 'Fornitori');

// =============================================
// TAB 4: MOVIMENTI CARICO
// =============================================
const caricoData = [
  ['TEMPLATE CARICO MERCE - BP Cleaning'],
  [''],
  ['ISTRUZIONI:'],
  ['- Usa questo template per caricare più prodotti insieme'],
  ['- barcode o product_name: almeno uno dei due per identificare il prodotto'],
  ['- quantity: quantità da caricare'],
  ['- unit_cost: costo unitario (se diverso da quello salvato)'],
  [''],
  // Header
  ['barcode', 'product_name', 'quantity *', 'unit_cost', 'notes'],
  // Esempi
  ['8001234567001', '', 20, 12.50, 'Rifornimento mensile'],
  ['8001234567002', '', 30, 4.80, ''],
  ['', 'Disinfettante Superfici 5L', 15, 18.90, 'Ordine urgente'],
  ['8001234567004', '', 10, '', 'Prezzo invariato'],
  ['', '', '', '', ''],
  ['', '', '', '', ''],
];

const wsCarico = XLSX.utils.aoa_to_sheet(caricoData);
wsCarico['!cols'] = [
  { wch: 16 }, // barcode
  { wch: 35 }, // product_name
  { wch: 12 }, // quantity
  { wch: 12 }, // unit_cost
  { wch: 35 }, // notes
];
XLSX.utils.book_append_sheet(wb, wsCarico, 'Carico');

// =============================================
// TAB 5: MOVIMENTI SCARICO
// =============================================
const scaricoData = [
  ['TEMPLATE SCARICO MERCE - BP Cleaning'],
  [''],
  ['ISTRUZIONI:'],
  ['- Usa questo template per scaricare prodotti verso cantieri'],
  ['- barcode o product_name: almeno uno per identificare il prodotto'],
  ['- worksite_code: codice cantiere destinazione (es. CO01)'],
  ['- quantity: quantità da scaricare'],
  [''],
  // Header
  ['barcode', 'product_name', 'worksite_code *', 'quantity *', 'notes'],
  // Esempi
  ['8001234567001', '', 'CO01', 5, 'Consegna settimanale'],
  ['8001234567002', '', 'CO03', 8, ''],
  ['', 'Disinfettante Superfici 5L', 'CO05', 4, 'Urgente clinica'],
  ['8001234567004', '', 'CO04', 3, 'Scuola'],
  ['', '', '', '', ''],
  ['', '', '', '', ''],
];

const wsScarico = XLSX.utils.aoa_to_sheet(scaricoData);
wsScarico['!cols'] = [
  { wch: 16 }, // barcode
  { wch: 35 }, // product_name
  { wch: 16 }, // worksite_code
  { wch: 12 }, // quantity
  { wch: 35 }, // notes
];
XLSX.utils.book_append_sheet(wb, wsScarico, 'Scarico');

// =============================================
// SALVA FILE
// =============================================
const outputPath = path.join(__dirname, '..', 'public', 'BP_Cleaning_Template_Import.xlsx');
XLSX.writeFile(wb, outputPath);

console.log('✅ Template Excel creato: public/BP_Cleaning_Template_Import.xlsx');
console.log('');
console.log('Tab inclusi:');
console.log('  1. Prodotti - Per importare prodotti');
console.log('  2. Cantieri - Per importare cantieri');
console.log('  3. Fornitori - Per importare fornitori');
console.log('  4. Carico - Per caricare merce in bulk');
console.log('  5. Scarico - Per scaricare merce in bulk');
