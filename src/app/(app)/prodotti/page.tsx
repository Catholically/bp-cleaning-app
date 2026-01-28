'use client'

import { useEffect, useState, useMemo, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/auth-provider'
import { formatCurrency, formatNumber, cn } from '@/lib/utils'
import { Product, ProductType, ProductCategory, CATEGORY_ICONS, CATEGORY_LABELS, CATEGORIES_BY_TYPE, filterProductsByType } from '@/lib/types'
import { Search, Plus, Filter, Package, AlertTriangle, Check, Sparkles, Wrench, ChevronDown, ChevronUp, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'

function ProductsContent() {
  const { isSuperuser } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterLow, setFilterLow] = useState(searchParams.get('filter') === 'low')
  const [productType, setProductType] = useState<ProductType>('all')
  const [expandedType, setExpandedType] = useState<ProductType | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null)
  const supabase = createClient()

  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      try {
        await fetchProducts()
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [])

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*, supplier:suppliers(name)')
      .eq('is_active', true)
      .order('category')
      .order('name')

    if (!error && data) {
      setProducts(data)
    }
  }

  const filteredProducts = useMemo(() => {
    // Prima filtra per categoria specifica se selezionata
    let filtered = products
    if (selectedCategory) {
      filtered = products.filter(p => p.category === selectedCategory)
    } else if (productType !== 'all') {
      filtered = filterProductsByType(products, productType)
    }

    return filtered.filter(p => {
      const matchesSearch = !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.barcode?.toLowerCase().includes(search.toLowerCase())

      const matchesFilter = !filterLow || p.current_stock <= p.min_stock

      return matchesSearch && matchesFilter
    })
  }, [products, search, filterLow, productType, selectedCategory])

  const handleTypeClick = (type: ProductType) => {
    if (type === 'all') {
      setProductType('all')
      setExpandedType(null)
      setSelectedCategory(null)
    } else if (expandedType === type) {
      // Cliccato di nuovo sullo stesso tipo espanso -> chiudi
      setExpandedType(null)
      setSelectedCategory(null)
      setProductType(type) // Mantieni filtro sul tipo
    } else {
      // Espandi nuovo tipo
      setProductType(type)
      setExpandedType(type)
      setSelectedCategory(null)
    }
  }

  const handleCategoryClick = (category: ProductCategory) => {
    if (selectedCategory === category) {
      // Deseleziona categoria, torna a mostrare tutto il tipo
      setSelectedCategory(null)
    } else {
      setSelectedCategory(category)
    }
  }

  const getStockStatus = (current: number, min: number) => {
    const ratio = current / min
    if (ratio <= 1) return { color: 'text-red-500', bg: 'bg-red-50', label: 'RIORDINO' }
    if (ratio <= 1.5) return { color: 'text-amber-500', bg: 'bg-amber-50', label: 'BASSO' }
    return { color: 'text-emerald-500', bg: 'bg-emerald-50', label: 'OK' }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <header className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white px-4 pt-12 pb-6 rounded-b-3xl">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Link href="/" className="p-2 -ml-2 hover:bg-white/10 rounded-xl transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <Package className="w-6 h-6" />
          <div>
            <h1 className="text-xl font-bold">Prodotti</h1>
            <p className="text-blue-100 text-sm">{products.length} prodotti in magazzino</p>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 -mt-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cerca prodotto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pl-12"
          />
        </div>

        {/* Filtro tipo prodotto */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <button
              onClick={() => handleTypeClick('all')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
                productType === 'all' && !selectedCategory
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-white text-gray-600 border border-gray-200'
              )}
            >
              <Package className="w-4 h-4" />
              Tutti
            </button>
            <button
              onClick={() => handleTypeClick('consumabile')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
                productType === 'consumabile'
                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  : 'bg-white text-gray-600 border border-gray-200'
              )}
            >
              <Sparkles className="w-4 h-4" />
              Pulizia
              {expandedType === 'consumabile' ? (
                <ChevronUp className="w-3 h-3 ml-1" />
              ) : (
                <ChevronDown className="w-3 h-3 ml-1" />
              )}
            </button>
            <button
              onClick={() => handleTypeClick('attrezzatura')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
                productType === 'attrezzatura'
                  ? 'bg-amber-100 text-amber-700 border border-amber-200'
                  : 'bg-white text-gray-600 border border-gray-200'
              )}
            >
              <Wrench className="w-4 h-4" />
              Attrezz.
              {expandedType === 'attrezzatura' ? (
                <ChevronUp className="w-3 h-3 ml-1" />
              ) : (
                <ChevronDown className="w-3 h-3 ml-1" />
              )}
            </button>
          </div>

          {/* Sottocategorie espandibili */}
          {expandedType && (
            <div className="flex flex-wrap gap-2 animate-slide-up">
              {CATEGORIES_BY_TYPE[expandedType].map(category => (
                <button
                  key={category}
                  onClick={() => handleCategoryClick(category)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                    selectedCategory === category
                      ? expandedType === 'consumabile'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-amber-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  <span>{CATEGORY_ICONS[category]}</span>
                  {CATEGORY_LABELS[category]}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => setFilterLow(!filterLow)}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
            filterLow
              ? 'bg-red-100 text-red-700 border border-red-200'
              : 'bg-white text-gray-600 border border-gray-200'
          )}
        >
          <Filter className="w-4 h-4" />
          Solo scorte basse
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-4 space-y-3 pb-6">
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4 text-gray-400">
              <Package className="w-8 h-8" />
            </div>
            <p className="text-lg font-semibold text-gray-900 mb-2">Nessun prodotto trovato</p>
            <p className="text-sm text-gray-500 max-w-sm">
              {search ? 'Prova con una ricerca diversa' : 'Aggiungi il primo prodotto'}
            </p>
          </div>
        ) : (
          filteredProducts.map((product, index) => {
            const status = getStockStatus(product.current_stock, product.min_stock)
            
            return (
              <Link
                key={product.id}
                href={`/prodotti/${product.id}`}
                className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm transition-all duration-200 hover:shadow-md hover:border-gray-200 animate-slide-up"
                style={{ animationDelay: `${index * 0.03}s` }}
              >
                <div className={cn('list-item-icon', status.bg)}>
                  <span className="text-xl">{CATEGORY_ICONS[product.category]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
                  <p className="text-sm text-gray-500">
                    {product.quantity_per_package}{product.unit} • {formatCurrency(product.unit_cost)}
                  </p>
                </div>
                <div className="text-right">
                  <p className={cn('text-lg font-bold', status.color)}>
                    {formatNumber(product.current_stock, 0)}
                  </p>
                  {product.current_stock <= product.min_stock ? (
                    <span className="badge-danger text-[10px]">{status.label}</span>
                  ) : (
                    <span className="text-xs text-gray-400">in stock</span>
                  )}
                </div>
              </Link>
            )
          })
        )}
      </div>

      {isSuperuser && (
        <Link href="/prodotti/nuovo" className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-xl flex items-center justify-center z-50 hover:from-blue-700 hover:to-blue-800 active:scale-95 transition-all duration-200">
          <Plus className="w-6 h-6" />
        </Link>
      )}
    </div>
  )
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ProductsContent />
    </Suspense>
  )
}
