-- PREVIEW: What will be deleted/reset
-- Database: bp-cleaning-app (Supabase)

-- Check movements to delete
SELECT 'Total movements to DELETE' as info, COUNT(*) as count FROM movements;

-- Check test products to delete
SELECT 'Test products to DELETE' as info, COUNT(*) as count
FROM products
WHERE LOWER(name) LIKE '%test%'
   OR LOWER(name) LIKE '%fake%'
   OR LOWER(name) LIKE '%prova%';

-- Show test products that will be deleted
SELECT id, barcode, name, category, current_stock
FROM products
WHERE LOWER(name) LIKE '%test%'
   OR LOWER(name) LIKE '%fake%'
   OR LOWER(name) LIKE '%prova%'
ORDER BY name;

-- Check products with stock to reset
SELECT 'Products with stock > 0 to RESET' as info, COUNT(*) as count
FROM products
WHERE current_stock > 0 AND is_active = true;

-- Check total active products
SELECT 'Total active products (will remain)' as info, COUNT(*) as count
FROM products
WHERE is_active = true
  AND NOT (LOWER(name) LIKE '%test%' OR LOWER(name) LIKE '%fake%' OR LOWER(name) LIKE '%prova%');
