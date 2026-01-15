-- =============================================
-- BP CLEANING - Database Schema for Supabase
-- =============================================
-- Run this in Supabase SQL Editor (supabase.com -> your project -> SQL Editor)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. USERS PROFILE TABLE (extends Supabase Auth)
-- =============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'superuser')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view all profiles" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Superusers can update any profile" ON profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superuser')
  );

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- 2. SUPPLIERS TABLE (Fornitori)
-- =============================================
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view suppliers" ON suppliers
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Superusers can manage suppliers" ON suppliers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superuser')
  );

-- =============================================
-- 3. PRODUCTS TABLE (Prodotti)
-- =============================================
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  barcode TEXT UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'detergente', 'sgrassatore', 'disinfettante', 'lucidante',
    'deodorante', 'accessorio', 'attrezzatura', 'altro'
  )),
  unit TEXT NOT NULL CHECK (unit IN ('litri', 'pezzi', 'kg', 'ml', 'rotoli', 'confezioni')),
  quantity_per_package DECIMAL(10,2) DEFAULT 1,
  unit_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  current_stock DECIMAL(10,2) DEFAULT 0,
  min_stock DECIMAL(10,2) DEFAULT 5,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  image_url TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view products" ON products
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update stock" ON products
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Superusers can manage products" ON products
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superuser')
  );

-- Index for barcode lookups
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);

-- =============================================
-- 4. WORKSITES TABLE (Cantieri)
-- =============================================
CREATE TABLE IF NOT EXISTS worksites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  client_name TEXT,
  client_contact TEXT,
  budget_allocated DECIMAL(10,2) DEFAULT 0,
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE worksites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view worksites" ON worksites
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Superusers can manage worksites" ON worksites
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superuser')
  );

-- =============================================
-- 5. MOVEMENTS TABLE (Movimenti)
-- =============================================
CREATE TABLE IF NOT EXISTS movements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('carico', 'scarico')),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  worksite_id UUID REFERENCES worksites(id) ON DELETE SET NULL,
  quantity DECIMAL(10,2) NOT NULL CHECK (quantity > 0),
  unit_cost_at_time DECIMAL(10,2) NOT NULL,
  total_cost DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_cost_at_time) STORED,
  operator_id UUID NOT NULL REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view movements" ON movements
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create movements" ON movements
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Superusers can manage movements" ON movements
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superuser')
  );

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_movements_product ON movements(product_id);
CREATE INDEX IF NOT EXISTS idx_movements_worksite ON movements(worksite_id);
CREATE INDEX IF NOT EXISTS idx_movements_date ON movements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_movements_type ON movements(type);

-- =============================================
-- 6. FUNCTION: Update product stock after movement
-- =============================================
CREATE OR REPLACE FUNCTION update_product_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'carico' THEN
    UPDATE products 
    SET current_stock = current_stock + NEW.quantity,
        updated_at = NOW()
    WHERE id = NEW.product_id;
  ELSIF NEW.type = 'scarico' THEN
    UPDATE products 
    SET current_stock = current_stock - NEW.quantity,
        updated_at = NOW()
    WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_movement_created ON movements;
CREATE TRIGGER on_movement_created
  AFTER INSERT ON movements
  FOR EACH ROW EXECUTE FUNCTION update_product_stock();

-- =============================================
-- 7. VIEWS for Reports
-- =============================================

-- View: Products with low stock
CREATE OR REPLACE VIEW v_low_stock_products AS
SELECT 
  p.id,
  p.barcode,
  p.name,
  p.category,
  p.current_stock,
  p.min_stock,
  p.unit,
  p.unit_cost,
  (p.current_stock * p.unit_cost) as stock_value,
  s.name as supplier_name
FROM products p
LEFT JOIN suppliers s ON p.supplier_id = s.id
WHERE p.current_stock <= p.min_stock AND p.is_active = true
ORDER BY (p.current_stock / NULLIF(p.min_stock, 0)) ASC;

-- View: Costs per worksite (current month)
CREATE OR REPLACE VIEW v_worksite_costs_current_month AS
SELECT 
  w.id as worksite_id,
  w.code as worksite_code,
  w.name as worksite_name,
  w.address,
  w.city,
  w.budget_allocated,
  COALESCE(SUM(m.total_cost), 0) as total_spent,
  (w.budget_allocated - COALESCE(SUM(m.total_cost), 0)) as remaining_budget,
  COUNT(DISTINCT m.product_id) as unique_products,
  COUNT(m.id) as total_movements
FROM worksites w
LEFT JOIN movements m ON w.id = m.worksite_id 
  AND m.type = 'scarico'
  AND m.created_at >= date_trunc('month', CURRENT_DATE)
WHERE w.status = 'active'
GROUP BY w.id, w.code, w.name, w.address, w.city, w.budget_allocated
ORDER BY total_spent DESC;

-- View: Stock summary
CREATE OR REPLACE VIEW v_stock_summary AS
SELECT 
  p.id,
  p.barcode,
  p.name,
  p.category,
  p.unit,
  p.current_stock,
  p.min_stock,
  p.unit_cost,
  (p.current_stock * p.unit_cost) as stock_value,
  CASE 
    WHEN p.current_stock <= p.min_stock THEN 'riordino'
    WHEN p.current_stock <= p.min_stock * 1.5 THEN 'basso'
    ELSE 'ok'
  END as stock_status,
  s.name as supplier_name
FROM products p
LEFT JOIN suppliers s ON p.supplier_id = s.id
WHERE p.is_active = true
ORDER BY p.category, p.name;

-- =============================================
-- 8. SAMPLE DATA (Optional - remove in production)
-- =============================================

-- Insert sample suppliers
INSERT INTO suppliers (code, name, contact_name, phone, email) VALUES
  ('FOR001', 'CleanPro Italia', 'Marco Rossi', '+39 02 1234567', 'info@cleanpro.it'),
  ('FOR002', 'Detergenti Express', 'Laura Bianchi', '+39 06 7654321', 'ordini@detergentiexpress.it'),
  ('FOR003', 'EcoClean Srl', 'Paolo Verdi', '+39 011 9876543', 'vendite@ecoclean.it'),
  ('FOR004', 'Professional Clean', 'Anna Neri', '+39 051 1111111', 'info@professionalclean.it'),
  ('FOR005', 'Hygiene Solutions', 'Giuseppe Blu', '+39 041 2222222', 'ordini@hygienesolutions.it')
ON CONFLICT (code) DO NOTHING;

-- Insert sample worksites
INSERT INTO worksites (code, name, address, city, client_name, budget_allocated, status) VALUES
  ('CO01', 'Uffici Tecnopark', 'Via Roma 123', 'Milano', 'Tecnopark Srl', 500.00, 'active'),
  ('CO02', 'Condominio Belvedere', 'Via Dante 45', 'Roma', 'Amm. Belvedere', 350.00, 'active'),
  ('CO03', 'Centro Commerciale Nord', 'Via Torino 78', 'Torino', 'Galleria Nord SpA', 800.00, 'active'),
  ('CO04', 'Scuola Elementare Manzoni', 'Piazza Manzoni 1', 'Firenze', 'Comune di Firenze', 400.00, 'active'),
  ('CO05', 'Clinica San Marco', 'Viale della Salute 22', 'Bologna', 'Clinica San Marco Srl', 600.00, 'active')
ON CONFLICT (code) DO NOTHING;

-- =============================================
-- SETUP COMPLETE!
-- =============================================
-- Next steps:
-- 1. Go to Authentication -> URL Configuration and set your site URL
-- 2. Go to Authentication -> Providers and enable Email
-- 3. Create your first superuser manually or via the signup page
-- 4. Update the first user's role to 'superuser' with:
--    UPDATE profiles SET role = 'superuser' WHERE email = 'admin@example.com';
