export type UserRole = 'user' | 'superuser' | 'manager'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Supplier {
  id: string
  code: string
  name: string
  contact_name?: string
  email?: string
  phone?: string
  address?: string
  notes?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export type ProductCategory = 
  | 'detergente' 
  | 'sgrassatore' 
  | 'disinfettante' 
  | 'lucidante'
  | 'deodorante' 
  | 'accessorio' 
  | 'attrezzatura' 
  | 'altro'

export type ProductUnit = 'litri' | 'pezzi' | 'kg' | 'ml' | 'rotoli' | 'confezioni'

export interface Product {
  id: string
  sku?: string
  barcode?: string
  name: string
  category: ProductCategory
  unit: ProductUnit
  quantity_per_package: number
  unit_cost: number
  current_stock: number
  min_stock: number
  supplier_id?: string
  supplier?: Supplier
  image_url?: string
  notes?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export type WorksiteStatus = 'active' | 'paused' | 'completed'

export interface Worksite {
  id: string
  code: string
  name: string
  address: string
  city: string
  cap?: string
  provincia?: string
  codice_fiscale?: string
  partita_iva?: string
  client_name?: string
  client_contact?: string
  client_phone?: string
  client_email?: string
  budget_allocated: number
  start_date?: string
  end_date?: string
  status: WorksiteStatus
  notes?: string
  created_at: string
}

export type MovementType = 'carico' | 'scarico'

export interface Movement {
  id: string
  type: MovementType
  product_id: string
  product?: Product
  worksite_id?: string
  worksite?: Worksite
  quantity: number
  unit_cost_at_time: number
  total_cost: number
  operator_id: string
  operator?: Profile
  notes?: string
  created_at: string
}

// View types
export interface LowStockProduct {
  id: string
  barcode?: string
  name: string
  category: ProductCategory
  current_stock: number
  min_stock: number
  unit: ProductUnit
  unit_cost: number
  stock_value: number
  supplier_name?: string
}

export interface WorksiteCost {
  worksite_id: string
  worksite_code: string
  worksite_name: string
  address: string
  city: string
  budget_allocated: number
  total_spent: number
  remaining_budget: number
  unique_products: number
  total_movements: number
}

export interface StockSummary {
  id: string
  barcode?: string
  name: string
  category: ProductCategory
  unit: ProductUnit
  current_stock: number
  min_stock: number
  unit_cost: number
  stock_value: number
  stock_status: 'riordino' | 'basso' | 'ok'
  supplier_name?: string
}

// Form types
export interface ProductFormData {
  barcode?: string
  name: string
  category: ProductCategory
  unit: ProductUnit
  quantity_per_package: number
  unit_cost: number
  current_stock: number
  min_stock: number
  supplier_id?: string
  notes?: string
}

export interface WorksiteFormData {
  code: string
  name: string
  address: string
  city: string
  client_name?: string
  client_contact?: string
  budget_allocated: number
  status: WorksiteStatus
  notes?: string
}

export interface MovementFormData {
  type: MovementType
  product_id: string
  worksite_id?: string
  quantity: number
  notes?: string
}

export interface UserWorksite {
  id: string
  user_id: string
  worksite_id: string
  created_at: string
  worksite?: Worksite
  user?: Profile
}

// Category labels for UI
export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  detergente: 'Detergente',
  sgrassatore: 'Sgrassatore',
  disinfettante: 'Disinfettante',
  lucidante: 'Lucidante',
  deodorante: 'Deodorante',
  accessorio: 'Accessorio',
  attrezzatura: 'Attrezzatura',
  altro: 'Altro'
}

export const UNIT_LABELS: Record<ProductUnit, string> = {
  litri: 'Litri',
  pezzi: 'Pezzi',
  kg: 'Kg',
  ml: 'ml',
  rotoli: 'Rotoli',
  confezioni: 'Confezioni'
}

export const STATUS_LABELS: Record<WorksiteStatus, string> = {
  active: 'Attivo',
  paused: 'In pausa',
  completed: 'Completato'
}

// Category icons (emoji for simplicity)
export const CATEGORY_ICONS: Record<ProductCategory, string> = {
  detergente: '🧴',
  sgrassatore: '💪',
  disinfettante: '🧹',
  lucidante: '✨',
  deodorante: '🌸',
  accessorio: '🧤',
  attrezzatura: '🛠️',
  altro: '📦'
}
