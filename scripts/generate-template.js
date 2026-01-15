const XLSX = require('xlsx');
const path = require('path');

// Colori
const COLORS = {
  primary: '0EA5E9',      // Sky blue
  primaryDark: '0369A1',  // Darker blue
  success: '10B981',      // Green
  warning: 'F59E0B',      // Orange
  error: 'EF4444',        // Red
  gray: '64748B',         // Gray
  lightGray: 'F1F5F9',    // Light gray bg
  white: 'FFFFFF'
};

// Stili comuni
const headerStyle = {
  font: { bold: true, color: { rgb: COLORS.white }, sz: 11 },
  fill: { fgColor: { rgb: COLORS.primary } },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  border: {
    top: { style: 'thin', color: { rgb: COLORS.primaryDark } },
    bottom: { style: 'thin', color: { rgb: COLORS.primaryDark } },
    left: { style: 'thin', color: { rgb: COLORS.primaryDark } },
    right: { style: 'thin', color: { rgb: COLORS.primaryDark } }
  }
};

const titleStyle = {
  font: { bold: true, color: { rgb: COLORS.primaryDark }, sz: 16 },
  alignment: { horizontal: 'left', vertical: 'center' }
};

const subTitleStyle = {
  font: { italic: true, color: { rgb: COLORS.gray }, sz: 10 },
  alignment: { horizontal: 'left', vertical: 'center' }
};

const dataStyle = {
  font: { sz: 10 },
  alignment: { vertical: 'center' },
  border: {
    top: { style: 'thin', color: { rgb: 'E2E8F0' } },
    bottom: { style: 'thin', color: { rgb: 'E2E8F0' } },
    left: { style: 'thin', color: { rgb: 'E2E8F0' } },
    right: { style: 'thin', color: { rgb: 'E2E8F0' } }
  }
};

const currencyStyle = {
  ...dataStyle,
  numFmt: '€ #,##0.00'
};

const numberStyle = {
  ...dataStyle,
  numFmt: '#,##0'
};

const dateStyle = {
  ...dataStyle,
  numFmt: 'DD/MM/YYYY'
};

// Helper per applicare stili
function applyStyles(ws, range, style) {
  const decoded = XLSX.utils.decode_range(range);
  for (let r = decoded.s.r; r <= decoded.e.r; r++) {
    for (let c = decoded.s.c; c <= decoded.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      if (!ws[addr]) ws[addr] = { v: '' };
      ws[addr].s = style;
    }
  }
}

// Crea workbook
const wb = XLSX.utils.book_new();

// =============================================
// TAB 1: PRODOTTI
// =============================================
const prodottiHeaders = [
  'Barcode', 'Nome Prodotto *', 'Categoria *', 'Unità *', 'Qtà/Confezione',
  'Costo Unitario € *', 'Stock Attuale', 'Stock Minimo', 'Cod. Fornitore', 'Note'
];

const prodottiData = [
  ['8001234567001', 'Detergente Pavimenti Professional 5L', 'detergente', 'litri', 5, 12.50, 45, 10, 'FOR001', 'Prodotto principale'],
  ['8001234567002', 'Sgrassatore Universale 1L', 'sgrassatore', 'litri', 1, 4.80, 32, 15, 'FOR001', ''],
  ['8001234567003', 'Disinfettante Superfici 5L', 'disinfettante', 'litri', 5, 18.90, 8, 10, 'FOR002', 'Per cliniche e ospedali'],
  ['8001234567004', 'Lucidante Acciaio Inox 500ml', 'lucidante', 'ml', 500, 6.50, 25, 8, 'FOR002', ''],
  ['8001234567005', 'Deodorante Ambiente Lavanda 750ml', 'deodorante', 'ml', 750, 3.90, 40, 12, 'FOR003', ''],
  ['8001234567006', 'Panno Microfibra Multiuso (conf. 10)', 'accessorio', 'confezioni', 10, 8.50, 18, 5, 'FOR003', ''],
  ['8001234567007', 'Guanti Nitrile Taglia M (conf. 100)', 'accessorio', 'confezioni', 100, 12.00, 6, 8, 'FOR001', 'SCORTA BASSA!'],
  ['8001234567008', 'Sacchi Spazzatura 110L (rotolo 20)', 'accessorio', 'rotoli', 20, 7.50, 35, 10, 'FOR002', ''],
  ['8001234567009', 'Mocio Professionale Completo', 'attrezzatura', 'pezzi', 1, 25.00, 12, 3, 'FOR003', ''],
  ['8001234567010', 'Carrello Pulizia 2 Secchi', 'attrezzatura', 'pezzi', 1, 89.00, 4, 2, 'FOR001', ''],
];

// Calcola valore stock per ogni riga
prodottiData.forEach(row => {
  row.push(row[5] * row[6]); // Costo * Stock = Valore
});
prodottiHeaders.push('Valore Stock €');

const wsProdotti = XLSX.utils.aoa_to_sheet([
  ['BP CLEANING - Template Importazione Prodotti'],
  ['Compila i campi con * (obbligatori). Categorie: detergente, sgrassatore, disinfettante, lucidante, deodorante, accessorio, attrezzatura, altro'],
  [],
  prodottiHeaders,
  ...prodottiData,
  [], [], [], [], [] // Righe vuote per nuovi dati
]);

// Imposta larghezza colonne
wsProdotti['!cols'] = [
  { wch: 16 }, { wch: 38 }, { wch: 14 }, { wch: 12 }, { wch: 14 },
  { wch: 16 }, { wch: 13 }, { wch: 13 }, { wch: 14 }, { wch: 25 }, { wch: 14 }
];

// Merge celle titolo
wsProdotti['!merges'] = [
  { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
  { s: { r: 1, c: 0 }, e: { r: 1, c: 9 } }
];

// Auto-filtro
wsProdotti['!autofilter'] = { ref: 'A4:K14' };

XLSX.utils.book_append_sheet(wb, wsProdotti, 'Prodotti');

// =============================================
// TAB 2: CANTIERI
// =============================================
const cantieriHeaders = [
  'Codice *', 'Nome Cantiere *', 'Indirizzo *', 'Città *', 'Cliente',
  'Contatto', 'Budget Mensile €', 'Data Inizio', 'Data Fine', 'Stato', 'Note'
];

const cantieriData = [
  ['CO01', 'Uffici Tecnopark', 'Via Roma 123', 'Milano', 'Tecnopark Srl', 'Mario Rossi - 02 1234567', 500, '2025-01-01', '', 'active', 'Pulizia giornaliera lun-ven'],
  ['CO02', 'Condominio Belvedere', 'Via Dante 45', 'Roma', 'Amm. Belvedere', 'Laura Bianchi - 06 9876543', 350, '2025-02-15', '', 'active', 'Scale e androne 3x/settimana'],
  ['CO03', 'Centro Commerciale Nord', 'Via Torino 78', 'Torino', 'Galleria Nord SpA', 'Paolo Verdi', 800, '2025-01-10', '', 'active', 'Aree comuni e bagni'],
  ['CO04', 'Scuola Elementare Manzoni', 'Piazza Manzoni 1', 'Firenze', 'Comune di Firenze', 'Ufficio Tecnico', 400, '2025-03-01', '2025-06-15', 'active', 'Anno scolastico'],
  ['CO05', 'Clinica San Marco', 'Viale della Salute 22', 'Bologna', 'Clinica San Marco Srl', 'Dott. Bianchi', 600, '2025-01-20', '', 'active', 'Sanificazione giornaliera'],
];

const wsCantieri = XLSX.utils.aoa_to_sheet([
  ['BP CLEANING - Template Importazione Cantieri'],
  ['Compila i campi con * (obbligatori). Stato: active, paused, completed. Date in formato YYYY-MM-DD'],
  [],
  cantieriHeaders,
  ...cantieriData,
  [], [], [], [], []
]);

wsCantieri['!cols'] = [
  { wch: 10 }, { wch: 28 }, { wch: 24 }, { wch: 12 }, { wch: 20 },
  { wch: 26 }, { wch: 16 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 28 }
];

wsCantieri['!merges'] = [
  { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
  { s: { r: 1, c: 0 }, e: { r: 1, c: 10 } }
];

wsCantieri['!autofilter'] = { ref: 'A4:K9' };

XLSX.utils.book_append_sheet(wb, wsCantieri, 'Cantieri');

// =============================================
// TAB 3: FORNITORI
// =============================================
const fornitoriHeaders = [
  'Codice *', 'Ragione Sociale *', 'Referente', 'Email', 'Telefono', 'Indirizzo', 'P.IVA', 'Note'
];

const fornitoriData = [
  ['FOR001', 'CleanPro Italia Srl', 'Marco Rossi', 'ordini@cleanpro.it', '+39 02 1234567', 'Via Industria 10, 20100 Milano', '01234567890', 'Fornitore principale - Consegna 48h'],
  ['FOR002', 'Detergenti Express SpA', 'Laura Bianchi', 'vendite@detergentiexpress.it', '+39 06 7654321', 'Via Commercio 5, 00100 Roma', '09876543210', 'Prezzi competitivi'],
  ['FOR003', 'EcoClean Srl', 'Paolo Verdi', 'info@ecoclean.it', '+39 011 9876543', 'Via Verde 20, 10100 Torino', '05432109876', 'Prodotti ecologici certificati'],
];

const wsFornitori = XLSX.utils.aoa_to_sheet([
  ['BP CLEANING - Template Importazione Fornitori'],
  ['Compila i campi con * (obbligatori). Il Codice verrà usato per associare i prodotti.'],
  [],
  fornitoriHeaders,
  ...fornitoriData,
  [], [], [], [], []
]);

wsFornitori['!cols'] = [
  { wch: 10 }, { wch: 26 }, { wch: 18 }, { wch: 28 }, { wch: 18 }, { wch: 35 }, { wch: 14 }, { wch: 30 }
];

wsFornitori['!merges'] = [
  { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
  { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } }
];

wsFornitori['!autofilter'] = { ref: 'A4:H7' };

XLSX.utils.book_append_sheet(wb, wsFornitori, 'Fornitori');

// =============================================
// TAB 4: CARICO MERCE
// =============================================
const caricoHeaders = [
  'Data', 'Barcode', 'Nome Prodotto', 'Quantità *', 'Costo Unitario €', 'Totale €', 'Fornitore', 'N. Fattura', 'Note'
];

const caricoData = [
  ['2025-01-15', '8001234567001', 'Detergente Pavimenti Professional 5L', 20, 12.50, '=D5*E5', 'FOR001', 'FT-2025/001', 'Rifornimento mensile'],
  ['2025-01-15', '8001234567002', 'Sgrassatore Universale 1L', 30, 4.80, '=D6*E6', 'FOR001', 'FT-2025/001', ''],
  ['2025-01-16', '8001234567003', 'Disinfettante Superfici 5L', 15, 18.90, '=D7*E7', 'FOR002', 'FT-2025/045', 'Ordine urgente'],
  ['2025-01-18', '8001234567007', 'Guanti Nitrile Taglia M (conf. 100)', 10, 12.00, '=D8*E8', 'FOR001', 'FT-2025/002', ''],
];

// Riga totali
caricoData.push(['', '', 'TOTALE CARICO', '=SUM(D5:D8)', '', '=SUM(F5:F8)', '', '', '']);

const wsCarico = XLSX.utils.aoa_to_sheet([
  ['BP CLEANING - Registro Carico Merce'],
  ['Registra tutti gli arrivi merce. Il campo Totale € si calcola automaticamente.'],
  [],
  caricoHeaders,
  ...caricoData,
  [], [], [], [], []
]);

wsCarico['!cols'] = [
  { wch: 12 }, { wch: 16 }, { wch: 36 }, { wch: 12 }, { wch: 16 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 28 }
];

wsCarico['!merges'] = [
  { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
  { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } }
];

wsCarico['!autofilter'] = { ref: 'A4:I8' };

XLSX.utils.book_append_sheet(wb, wsCarico, 'Carico');

// =============================================
// TAB 5: SCARICO MERCE
// =============================================
const scaricoHeaders = [
  'Data', 'Barcode', 'Nome Prodotto', 'Cantiere *', 'Quantità *', 'Costo Unit. €', 'Totale €', 'Operatore', 'Note'
];

const scaricoData = [
  ['2025-01-15', '8001234567001', 'Detergente Pavimenti Professional 5L', 'CO01', 5, 12.50, '=E5*F5', 'Mario Rossi', 'Consegna settimanale'],
  ['2025-01-16', '8001234567002', 'Sgrassatore Universale 1L', 'CO03', 8, 4.80, '=E6*F6', 'Luigi Verdi', ''],
  ['2025-01-17', '8001234567003', 'Disinfettante Superfici 5L', 'CO05', 4, 18.90, '=E7*F7', 'Mario Rossi', 'Richiesta urgente clinica'],
  ['2025-01-18', '8001234567007', 'Guanti Nitrile Taglia M (conf. 100)', 'CO04', 3, 12.00, '=E8*F8', 'Anna Bianchi', 'Scuola'],
  ['2025-01-18', '8001234567005', 'Deodorante Ambiente Lavanda 750ml', 'CO02', 6, 3.90, '=E9*F9', 'Luigi Verdi', ''],
];

// Riga totali
scaricoData.push(['', '', 'TOTALE SCARICO', '', '=SUM(E5:E9)', '', '=SUM(G5:G9)', '', '']);

const wsScarico = XLSX.utils.aoa_to_sheet([
  ['BP CLEANING - Registro Scarico Merce per Cantiere'],
  ['Registra tutte le consegne ai cantieri. Il Totale € rappresenta il costo addebitato al cantiere.'],
  [],
  scaricoHeaders,
  ...scaricoData,
  [], [], [], [], []
]);

wsScarico['!cols'] = [
  { wch: 12 }, { wch: 16 }, { wch: 36 }, { wch: 10 }, { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 16 }, { wch: 28 }
];

wsScarico['!merges'] = [
  { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
  { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } }
];

wsScarico['!autofilter'] = { ref: 'A4:I9' };

XLSX.utils.book_append_sheet(wb, wsScarico, 'Scarico');

// =============================================
// TAB 6: RIEPILOGO COSTI PER CANTIERE
// =============================================
const riepilogoHeaders = [
  'Cantiere', 'Nome', 'Budget Mensile €', 'Costo Prodotti €', 'Differenza €', '% Utilizzo', 'Stato'
];

const riepilogoData = [
  ['CO01', 'Uffici Tecnopark', 500, 62.50, '=C5-D5', '=D5/C5', '=IF(F5>1,"OVER BUDGET",IF(F5>0.8,"ATTENZIONE","OK"))'],
  ['CO02', 'Condominio Belvedere', 350, 23.40, '=C6-D6', '=D6/C6', '=IF(F6>1,"OVER BUDGET",IF(F6>0.8,"ATTENZIONE","OK"))'],
  ['CO03', 'Centro Commerciale Nord', 800, 38.40, '=C7-D7', '=D7/C7', '=IF(F7>1,"OVER BUDGET",IF(F7>0.8,"ATTENZIONE","OK"))'],
  ['CO04', 'Scuola Elementare Manzoni', 400, 36.00, '=C8-D8', '=D8/C8', '=IF(F8>1,"OVER BUDGET",IF(F8>0.8,"ATTENZIONE","OK"))'],
  ['CO05', 'Clinica San Marco', 600, 75.60, '=C9-D9', '=D9/C9', '=IF(F9>1,"OVER BUDGET",IF(F9>0.8,"ATTENZIONE","OK"))'],
  ['', 'TOTALE', '=SUM(C5:C9)', '=SUM(D5:D9)', '=SUM(E5:E9)', '=D10/C10', ''],
];

const wsRiepilogo = XLSX.utils.aoa_to_sheet([
  ['BP CLEANING - Riepilogo Costi per Cantiere'],
  ['Analisi budget vs spesa effettiva. Aggiorna i costi prodotti dal tab Scarico.'],
  [],
  riepilogoHeaders,
  ...riepilogoData,
]);

wsRiepilogo['!cols'] = [
  { wch: 10 }, { wch: 28 }, { wch: 18 }, { wch: 18 }, { wch: 14 }, { wch: 12 }, { wch: 14 }
];

wsRiepilogo['!merges'] = [
  { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
  { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } }
];

XLSX.utils.book_append_sheet(wb, wsRiepilogo, 'Riepilogo Costi');

// =============================================
// TAB 7: REPORT MENSILE
// =============================================
const reportHeaders = [
  'Mese', 'Totale Carichi €', 'Totale Scarichi €', 'Margine €', 'N. Movimenti', 'Prodotti in Esaurimento'
];

const reportData = [
  ['Gennaio 2025', 850.00, 235.90, '=B5-C5', 15, 2],
  ['Febbraio 2025', 620.00, 410.50, '=B6-C6', 22, 1],
  ['Marzo 2025', 980.00, 520.30, '=B7-C7', 28, 3],
  ['', '', '', '', '', ''],
  ['TOTALE Q1', '=SUM(B5:B7)', '=SUM(C5:C7)', '=SUM(D5:D7)', '=SUM(E5:E7)', ''],
];

const wsReport = XLSX.utils.aoa_to_sheet([
  ['BP CLEANING - Report Mensile'],
  ['Riepilogo movimenti e costi per mese. Utile per analisi trend e pianificazione acquisti.'],
  [],
  reportHeaders,
  ...reportData,
]);

wsReport['!cols'] = [
  { wch: 16 }, { wch: 18 }, { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 22 }
];

wsReport['!merges'] = [
  { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
  { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } }
];

XLSX.utils.book_append_sheet(wb, wsReport, 'Report Mensile');

// =============================================
// SALVA FILE
// =============================================
const outputPath = path.join(__dirname, '..', 'public', 'BP_Cleaning_Template_Import.xlsx');
XLSX.writeFile(wb, outputPath);

console.log('');
console.log('✅ Template Excel PROFESSIONALE creato!');
console.log('📁 File: public/BP_Cleaning_Template_Import.xlsx');
console.log('');
console.log('📑 Tab inclusi:');
console.log('   1. Prodotti        - Anagrafica prodotti con calcolo valore stock');
console.log('   2. Cantieri        - Anagrafica cantieri con budget');
console.log('   3. Fornitori       - Anagrafica fornitori');
console.log('   4. Carico          - Registro arrivi con totali automatici');
console.log('   5. Scarico         - Registro consegne per cantiere');
console.log('   6. Riepilogo Costi - Analisi budget vs spesa per cantiere');
console.log('   7. Report Mensile  - Trend mensili');
console.log('');
console.log('✨ Features:');
console.log('   • Auto-filtri su tutte le tabelle');
console.log('   • Formule per calcoli automatici (totali, %)');
console.log('   • Dati esempio precompilati');
console.log('   • Colonne ottimizzate per la stampa');
