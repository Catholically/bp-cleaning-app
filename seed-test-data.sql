-- =============================================
-- BP CLEANING - Test Data Seed
-- =============================================
-- Esegui in Supabase SQL Editor per popolare con dati di test
-- DA RIMUOVERE PRIMA DI ANDARE LIVE!

-- Prima pulisci i dati esistenti (se necessario)
-- ATTENZIONE: decommentare solo se vuoi cancellare tutto
-- DELETE FROM movements;
-- DELETE FROM products;
-- DELETE FROM worksites;
-- DELETE FROM suppliers;

-- =============================================
-- FORNITORI
-- =============================================
INSERT INTO suppliers (code, name, contact_name, phone, email, address) VALUES
  ('FOR001', 'CleanPro Italia', 'Marco Rossi', '+39 02 1234567', 'info@cleanpro.it', 'Via Industria 45, Milano'),
  ('FOR002', 'Detergenti Express', 'Laura Bianchi', '+39 06 7654321', 'ordini@detergentiexpress.it', 'Via Appia 123, Roma'),
  ('FOR003', 'EcoClean Srl', 'Paolo Verdi', '+39 011 9876543', 'vendite@ecoclean.it', 'Corso Francia 88, Torino'),
  ('FOR004', 'Professional Clean', 'Anna Neri', '+39 051 1111111', 'info@professionalclean.it', 'Via Emilia 200, Bologna'),
  ('FOR005', 'Hygiene Solutions', 'Giuseppe Blu', '+39 041 2222222', 'ordini@hygienesolutions.it', 'Via Mestre 50, Venezia')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  contact_name = EXCLUDED.contact_name,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email,
  address = EXCLUDED.address;

-- =============================================
-- CANTIERI
-- =============================================
INSERT INTO worksites (code, name, address, city, client_name, client_contact, budget_allocated, status) VALUES
  ('CA01', 'Uffici Tecnopark', 'Via Roma 123', 'Milano', 'Tecnopark Srl', 'Dr. Bianchi 02-555-1234', 500.00, 'active'),
  ('CA02', 'Condominio Belvedere', 'Via Dante 45', 'Roma', 'Amm. Belvedere', 'Sig. Verdi 06-555-4321', 350.00, 'active'),
  ('CA03', 'Centro Commerciale Nord', 'Via Torino 78', 'Torino', 'Galleria Nord SpA', 'Ufficio Acquisti', 800.00, 'active'),
  ('CA04', 'Scuola Manzoni', 'Piazza Manzoni 1', 'Firenze', 'Comune di Firenze', 'Dott.ssa Rossi', 400.00, 'active'),
  ('CA05', 'Clinica San Marco', 'Viale Salute 22', 'Bologna', 'Clinica San Marco', 'Direzione', 600.00, 'active'),
  ('CA06', 'Hotel Bellavista', 'Lungomare 100', 'Rimini', 'Hotel Bellavista Srl', 'Reception', 450.00, 'active'),
  ('CA07', 'Palestra FitLife', 'Via Sport 15', 'Milano', 'FitLife Srl', 'Manager', 300.00, 'active'),
  ('CA08', 'Ristorante Da Mario', 'Via Garibaldi 8', 'Napoli', 'Mario Esposito', 'Mario 081-555-9999', 250.00, 'paused')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  city = EXCLUDED.city,
  client_name = EXCLUDED.client_name,
  budget_allocated = EXCLUDED.budget_allocated,
  status = EXCLUDED.status;

-- =============================================
-- PRODOTTI (con vari livelli di stock)
-- =============================================

-- Ottieni gli ID dei fornitori
DO $$
DECLARE
  sup1 UUID;
  sup2 UUID;
  sup3 UUID;
  sup4 UUID;
  sup5 UUID;
BEGIN
  SELECT id INTO sup1 FROM suppliers WHERE code = 'FOR001';
  SELECT id INTO sup2 FROM suppliers WHERE code = 'FOR002';
  SELECT id INTO sup3 FROM suppliers WHERE code = 'FOR003';
  SELECT id INTO sup4 FROM suppliers WHERE code = 'FOR004';
  SELECT id INTO sup5 FROM suppliers WHERE code = 'FOR005';

  -- DETERGENTI
  INSERT INTO products (barcode, name, category, unit, quantity_per_package, unit_cost, current_stock, min_stock, supplier_id, notes) VALUES
    ('2001234567890', 'Detergente Multiuso 5L', 'detergente', 'litri', 5, 12.50, 25, 10, sup1, 'Per tutte le superfici'),
    ('2001234567891', 'Detergente Pavimenti Profumato', 'detergente', 'litri', 5, 8.90, 0, 15, sup1, 'STOCK ZERO - RIORDINARE'),
    ('2001234567892', 'Detergente Vetri 1L', 'detergente', 'litri', 1, 3.50, 45, 20, sup2, 'Senza aloni'),
    ('2001234567893', 'Detergente Bagno Anticalcare', 'detergente', 'litri', 1, 4.20, 8, 10, sup2, 'Stock basso'),
    ('2001234567894', 'Detergente Piatti Concentrato', 'detergente', 'litri', 5, 15.00, 12, 5, sup1, NULL),

  -- SGRASSATORI
    ('2002234567890', 'Sgrassatore Industriale 5L', 'sgrassatore', 'litri', 5, 18.00, 6, 8, sup3, 'Per cucine industriali - QUASI ESAURITO'),
    ('2002234567891', 'Sgrassatore Spray 750ml', 'sgrassatore', 'ml', 750, 4.50, 0, 30, sup3, 'STOCK ZERO'),
    ('2002234567892', 'Sgrassatore Forno Professionale', 'sgrassatore', 'litri', 1, 7.80, 18, 10, sup4, NULL),

  -- DISINFETTANTI
    ('2003234567890', 'Disinfettante Superfici 5L', 'disinfettante', 'litri', 5, 22.00, 15, 8, sup4, 'PMC registrato'),
    ('2003234567891', 'Disinfettante Bagni 1L', 'disinfettante', 'litri', 1, 6.50, 3, 15, sup4, 'STOCK CRITICO'),
    ('2003234567892', 'Alcool Isopropilico 70%', 'disinfettante', 'litri', 1, 8.00, 20, 10, sup5, NULL),
    ('2003234567893', 'Igienizzante Mani 500ml', 'disinfettante', 'ml', 500, 3.80, 0, 25, sup5, 'ESAURITO'),

  -- LUCIDANTI
    ('2004234567890', 'Lucida Acciaio Spray', 'lucidante', 'ml', 500, 5.20, 22, 10, sup1, NULL),
    ('2004234567891', 'Cera Pavimenti Autolucidante', 'lucidante', 'litri', 5, 28.00, 4, 5, sup2, 'Stock basso'),
    ('2004234567892', 'Lucida Mobili Spray', 'lucidante', 'ml', 400, 4.80, 35, 15, sup1, NULL),

  -- DEODORANTI
    ('2005234567890', 'Deodorante Ambiente Lavanda', 'deodorante', 'ml', 750, 3.20, 50, 20, sup3, NULL),
    ('2005234567891', 'Deodorante WC Gel', 'deodorante', 'pezzi', 1, 2.50, 0, 40, sup3, 'TERMINATO'),
    ('2005234567892', 'Profumatore Ambienti Prof.', 'deodorante', 'litri', 1, 9.00, 12, 8, sup5, NULL),

  -- ACCESSORI
    ('2006234567890', 'Panni Microfibra (conf. 10)', 'accessorio', 'confezioni', 10, 12.00, 8, 5, sup4, NULL),
    ('2006234567891', 'Guanti Nitrile M (100pz)', 'accessorio', 'confezioni', 100, 18.50, 5, 10, sup4, 'Sotto scorta minima'),
    ('2006234567892', 'Guanti Nitrile L (100pz)', 'accessorio', 'confezioni', 100, 18.50, 0, 10, sup4, 'ESAURITO'),
    ('2006234567893', 'Sacchi Spazzatura 110L (20pz)', 'accessorio', 'confezioni', 20, 8.00, 25, 15, sup2, NULL),
    ('2006234567894', 'Sacchi Spazzatura 70L (30pz)', 'accessorio', 'confezioni', 30, 6.50, 40, 20, sup2, NULL),
    ('2006234567895', 'Spugne Abrasive (conf. 6)', 'accessorio', 'confezioni', 6, 4.00, 18, 10, sup1, NULL),
    ('2006234567896', 'Rotolo Carta Asciugamani', 'accessorio', 'rotoli', 1, 2.80, 60, 30, sup2, NULL),
    ('2006234567897', 'Carta Igienica Maxi (6 rotoli)', 'accessorio', 'confezioni', 6, 5.50, 2, 20, sup2, 'CRITICO - Ordinare subito'),

  -- ATTREZZATURA
    ('2007234567890', 'Secchio con Strizzatore 15L', 'attrezzatura', 'pezzi', 1, 35.00, 6, 3, sup5, NULL),
    ('2007234567891', 'Mop Cotone Ricambio', 'attrezzatura', 'pezzi', 1, 8.50, 15, 10, sup5, NULL),
    ('2007234567892', 'Scopa Saggina', 'attrezzatura', 'pezzi', 1, 12.00, 7, 5, sup5, NULL),
    ('2007234567893', 'Paletta con Manico', 'attrezzatura', 'pezzi', 1, 6.00, 10, 5, sup5, NULL),
    ('2007234567894', 'Tergivetro Professionale', 'attrezzatura', 'pezzi', 1, 15.00, 0, 4, sup5, 'DA RIORDINARE'),

  -- ALTRO
    ('2008234567890', 'Sapone Mani Liquido 5L', 'altro', 'litri', 5, 10.00, 8, 5, sup1, NULL),
    ('2008234567891', 'Crema Mani Professionale', 'altro', 'ml', 500, 6.00, 14, 8, sup1, NULL)
  ON CONFLICT (barcode) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    unit = EXCLUDED.unit,
    quantity_per_package = EXCLUDED.quantity_per_package,
    unit_cost = EXCLUDED.unit_cost,
    current_stock = EXCLUDED.current_stock,
    min_stock = EXCLUDED.min_stock,
    supplier_id = EXCLUDED.supplier_id,
    notes = EXCLUDED.notes;

END $$;

-- =============================================
-- RIEPILOGO DATI INSERITI
-- =============================================
SELECT 'Fornitori' as tabella, COUNT(*) as totale FROM suppliers
UNION ALL
SELECT 'Cantieri', COUNT(*) FROM worksites
UNION ALL
SELECT 'Prodotti', COUNT(*) FROM products;

-- Verifica prodotti con stock zero
SELECT 'Prodotti con stock ZERO:' as info;
SELECT barcode, name, category, current_stock, min_stock
FROM products
WHERE current_stock = 0
ORDER BY name;

-- Verifica prodotti sotto scorta minima
SELECT 'Prodotti SOTTO SCORTA MINIMA:' as info;
SELECT barcode, name, category, current_stock, min_stock
FROM products
WHERE current_stock > 0 AND current_stock <= min_stock
ORDER BY (current_stock::float / NULLIF(min_stock, 0)::float);
