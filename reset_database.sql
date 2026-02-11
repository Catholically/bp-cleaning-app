-- RESET DATABASE FOR PRODUCTION START
-- Database: bp-cleaning-app (Supabase)
-- Date: 2026-02-11
-- ATTENZIONE: Questo script cancella tutti i dati di test

-- 1. Delete all movements (test data)
DELETE FROM movements;

-- 2. Delete fake/test products
DELETE FROM products
WHERE LOWER(name) LIKE '%test%'
   OR LOWER(name) LIKE '%fake%'
   OR LOWER(name) LIKE '%prova%';

-- 3. Reset all remaining product stock to 0
UPDATE products
SET current_stock = 0
WHERE is_active = true;

-- 4. Verify the cleanup
SELECT 'Movements deleted' as operation, COUNT(*) as remaining_count FROM movements
UNION ALL
SELECT 'Test products deleted', COUNT(*) FROM products WHERE LOWER(name) LIKE '%test%'
UNION ALL
SELECT 'Products with stock > 0', COUNT(*) FROM products WHERE current_stock > 0 AND is_active = true
UNION ALL
SELECT 'Total active products', COUNT(*) FROM products WHERE is_active = true;

-- 5. Show all products for verification
SELECT
  id,
  barcode,
  name,
  category,
  current_stock,
  min_stock,
  unit_cost
FROM products
WHERE is_active = true
ORDER BY category, name;
