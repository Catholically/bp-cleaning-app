-- =============================================
-- BP CLEANING - Seed Data (Dati Demo)
-- =============================================
-- Esegui questo script nel SQL Editor di Supabase
-- DOPO aver creato il primo utente admin

-- Prima verifica i fornitori esistenti (dovrebbero già esserci dallo schema)
-- Se non ci sono, decommentare:
/*
INSERT INTO suppliers (code, name, contact_name, phone, email) VALUES
  ('FOR001', 'CleanPro Italia', 'Marco Rossi', '+39 02 1234567', 'info@cleanpro.it'),
  ('FOR002', 'Detergenti Express', 'Laura Bianchi', '+39 06 7654321', 'ordini@detergentiexpress.it'),
  ('FOR003', 'EcoClean Srl', 'Paolo Verdi', '+39 011 9876543', 'vendite@ecoclean.it')
ON CONFLICT (code) DO NOTHING;
*/

-- =============================================
-- PRODOTTI (Products)
-- =============================================
INSERT INTO products (barcode, name, category, unit, quantity_per_package, unit_cost, current_stock, min_stock, supplier_id) VALUES
  ('8001234567001', 'Detergente Pavimenti Professional 5L', 'detergente', 'litri', 5, 12.50, 45, 10, (SELECT id FROM suppliers WHERE code = 'FOR001')),
  ('8001234567002', 'Sgrassatore Universale 1L', 'sgrassatore', 'litri', 1, 4.80, 32, 15, (SELECT id FROM suppliers WHERE code = 'FOR001')),
  ('8001234567003', 'Disinfettante Superfici 5L', 'disinfettante', 'litri', 5, 18.90, 8, 10, (SELECT id FROM suppliers WHERE code = 'FOR002')),
  ('8001234567004', 'Lucidante Acciaio Inox 500ml', 'lucidante', 'ml', 500, 6.50, 25, 8, (SELECT id FROM suppliers WHERE code = 'FOR002')),
  ('8001234567005', 'Deodorante Ambiente Lavanda 750ml', 'deodorante', 'ml', 750, 3.90, 40, 12, (SELECT id FROM suppliers WHERE code = 'FOR003')),
  ('8001234567006', 'Panno Microfibra Multiuso (conf. 10)', 'accessorio', 'confezioni', 10, 8.50, 18, 5, (SELECT id FROM suppliers WHERE code = 'FOR003')),
  ('8001234567007', 'Guanti Nitrile Taglia M (conf. 100)', 'accessorio', 'confezioni', 100, 12.00, 6, 8, (SELECT id FROM suppliers WHERE code = 'FOR001')),
  ('8001234567008', 'Sacchi Spazzatura 110L (rotolo 20)', 'accessorio', 'rotoli', 20, 7.50, 35, 10, (SELECT id FROM suppliers WHERE code = 'FOR002')),
  ('8001234567009', 'Mocio Professionale Completo', 'attrezzatura', 'pezzi', 1, 25.00, 12, 3, (SELECT id FROM suppliers WHERE code = 'FOR003')),
  ('8001234567010', 'Carrello Pulizia 2 Secchi', 'attrezzatura', 'pezzi', 1, 89.00, 4, 2, (SELECT id FROM suppliers WHERE code = 'FOR001')),
  ('8001234567011', 'Detergente Vetri 1L', 'detergente', 'litri', 1, 3.50, 28, 10, (SELECT id FROM suppliers WHERE code = 'FOR002')),
  ('8001234567012', 'Ammorbidente Industriale 5L', 'altro', 'litri', 5, 9.80, 15, 5, (SELECT id FROM suppliers WHERE code = 'FOR003'))
ON CONFLICT (barcode) DO UPDATE SET
  current_stock = EXCLUDED.current_stock,
  unit_cost = EXCLUDED.unit_cost;

-- =============================================
-- CANTIERI (Worksites) - Verifica esistenti
-- =============================================
INSERT INTO worksites (code, name, address, city, client_name, budget_allocated, status, start_date) VALUES
  ('CO01', 'Uffici Tecnopark', 'Via Roma 123', 'Milano', 'Tecnopark Srl', 500.00, 'active', '2025-01-01'),
  ('CO02', 'Condominio Belvedere', 'Via Dante 45', 'Roma', 'Amm. Belvedere', 350.00, 'active', '2025-02-15'),
  ('CO03', 'Centro Commerciale Nord', 'Via Torino 78', 'Torino', 'Galleria Nord SpA', 800.00, 'active', '2025-01-10'),
  ('CO04', 'Scuola Elementare Manzoni', 'Piazza Manzoni 1', 'Firenze', 'Comune di Firenze', 400.00, 'active', '2025-03-01'),
  ('CO05', 'Clinica San Marco', 'Viale della Salute 22', 'Bologna', 'Clinica San Marco Srl', 600.00, 'active', '2025-01-20')
ON CONFLICT (code) DO UPDATE SET
  budget_allocated = EXCLUDED.budget_allocated,
  status = EXCLUDED.status;

-- =============================================
-- MOVIMENTI (Movements)
-- Nota: Usa l'ID del tuo utente admin
-- =============================================

-- Prima ottieni l'ID del primo utente admin
DO $$
DECLARE
    admin_id UUID;
    prod_id UUID;
    ws_id UUID;
BEGIN
    -- Prendi il primo superuser o il primo utente
    SELECT id INTO admin_id FROM profiles WHERE role = 'superuser' LIMIT 1;
    IF admin_id IS NULL THEN
        SELECT id INTO admin_id FROM profiles LIMIT 1;
    END IF;

    -- Se non c'è nessun utente, esci
    IF admin_id IS NULL THEN
        RAISE NOTICE 'Nessun utente trovato. Crea prima un utente admin.';
        RETURN;
    END IF;

    RAISE NOTICE 'Usando admin_id: %', admin_id;

    -- Movimento 1: Carico Detergente Pavimenti
    SELECT id INTO prod_id FROM products WHERE barcode = '8001234567001';
    INSERT INTO movements (type, product_id, quantity, unit_cost_at_time, operator_id, notes, created_at)
    VALUES ('carico', prod_id, 20, 12.50, admin_id, 'Rifornimento mensile', NOW() - INTERVAL '5 days');

    -- Movimento 2: Scarico per Uffici Tecnopark
    SELECT id INTO ws_id FROM worksites WHERE code = 'CO01';
    INSERT INTO movements (type, product_id, worksite_id, quantity, unit_cost_at_time, operator_id, notes, created_at)
    VALUES ('scarico', prod_id, ws_id, 5, 12.50, admin_id, 'Consegna settimanale', NOW() - INTERVAL '3 days');

    -- Movimento 3: Carico Sgrassatore
    SELECT id INTO prod_id FROM products WHERE barcode = '8001234567002';
    INSERT INTO movements (type, product_id, quantity, unit_cost_at_time, operator_id, notes, created_at)
    VALUES ('carico', prod_id, 30, 4.80, admin_id, 'Ordine fornitore', NOW() - INTERVAL '4 days');

    -- Movimento 4: Scarico Sgrassatore per Centro Commerciale
    SELECT id INTO ws_id FROM worksites WHERE code = 'CO03';
    INSERT INTO movements (type, product_id, worksite_id, quantity, unit_cost_at_time, operator_id, notes, created_at)
    VALUES ('scarico', prod_id, ws_id, 8, 4.80, admin_id, 'Fornitura extra', NOW() - INTERVAL '2 days');

    -- Movimento 5: Carico Disinfettante
    SELECT id INTO prod_id FROM products WHERE barcode = '8001234567003';
    INSERT INTO movements (type, product_id, quantity, unit_cost_at_time, operator_id, notes, created_at)
    VALUES ('carico', prod_id, 15, 18.90, admin_id, 'Scorta', NOW() - INTERVAL '6 days');

    -- Movimento 6: Scarico Disinfettante per Clinica
    SELECT id INTO ws_id FROM worksites WHERE code = 'CO05';
    INSERT INTO movements (type, product_id, worksite_id, quantity, unit_cost_at_time, operator_id, notes, created_at)
    VALUES ('scarico', prod_id, ws_id, 4, 18.90, admin_id, 'Urgente', NOW() - INTERVAL '1 day');

    -- Movimento 7: Scarico Guanti per Scuola
    SELECT id INTO prod_id FROM products WHERE barcode = '8001234567007';
    SELECT id INTO ws_id FROM worksites WHERE code = 'CO04';
    INSERT INTO movements (type, product_id, worksite_id, quantity, unit_cost_at_time, operator_id, notes, created_at)
    VALUES ('scarico', prod_id, ws_id, 3, 12.00, admin_id, 'Consegna mensile', NOW() - INTERVAL '12 hours');

    -- Movimento 8: Carico Panno Microfibra
    SELECT id INTO prod_id FROM products WHERE barcode = '8001234567006';
    INSERT INTO movements (type, product_id, quantity, unit_cost_at_time, operator_id, notes, created_at)
    VALUES ('carico', prod_id, 10, 8.50, admin_id, 'Nuova fornitura', NOW() - INTERVAL '8 hours');

    -- Movimento 9: Scarico recente Deodorante
    SELECT id INTO prod_id FROM products WHERE barcode = '8001234567005';
    SELECT id INTO ws_id FROM worksites WHERE code = 'CO02';
    INSERT INTO movements (type, product_id, worksite_id, quantity, unit_cost_at_time, operator_id, notes, created_at)
    VALUES ('scarico', prod_id, ws_id, 6, 3.90, admin_id, 'Richiesta condominio', NOW() - INTERVAL '2 hours');

    -- Movimento 10: Carico oggi
    SELECT id INTO prod_id FROM products WHERE barcode = '8001234567011';
    INSERT INTO movements (type, product_id, quantity, unit_cost_at_time, operator_id, notes, created_at)
    VALUES ('carico', prod_id, 24, 3.50, admin_id, 'Ordine urgente', NOW() - INTERVAL '30 minutes');

    RAISE NOTICE 'Dati demo inseriti con successo!';
END $$;

-- =============================================
-- Verifica dati inseriti
-- =============================================
SELECT 'Prodotti:' as info, COUNT(*) as count FROM products WHERE is_active = true;
SELECT 'Cantieri:' as info, COUNT(*) as count FROM worksites WHERE status = 'active';
SELECT 'Movimenti:' as info, COUNT(*) as count FROM movements;
SELECT 'Fornitori:' as info, COUNT(*) as count FROM suppliers WHERE is_active = true;
