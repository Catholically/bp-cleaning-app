-- Reset all product stock to 0
-- Database: bp-cleaning-app (Supabase)
-- Date: 2026-02-11

UPDATE products
SET current_stock = 0
WHERE is_active = true;

-- Verify the update
SELECT
  id,
  barcode,
  name,
  category,
  current_stock,
  min_stock
FROM products
WHERE is_active = true
ORDER BY category, name;
