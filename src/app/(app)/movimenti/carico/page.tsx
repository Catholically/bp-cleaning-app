'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/auth-provider'
import { formatCurrency, formatNumber, cn } from '@/lib/utils'
import { Product } from '@/lib/types'
import { 
  ArrowDownToLine, 
  Search, 
  Minus, 
  Plus, 
  Check,
  Loader2
} from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function CaricoPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [successData, setSuccessData] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      try {
        await fetchProducts()
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    load()

    return () => {
      isMounted = false
    }
  }, [])

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('name')
    
    if (data) setProducts(data)
  }

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.barcode?.toLowerCase().includes(search.toLowerCase())
  )

  const handleSubmit = async () => {
    if (!selectedProduct || !user) return

    setSubmitting(true)
    try {
      const { error } = await supabase.from('movements').insert({
        type: 'carico',
        product_id: selectedProduct.id,
        quantity: quantity,
        unit_cost_at_time: selectedProduct.unit_cost,
        operator_id: user.id
      })

      if (error) throw error

      setSuccessData({
        product: selectedProduct.name,
        quantity,
        total: quantity * selectedProduct.unit_cost,
        newStock: selectedProduct.current_stock + quantity
      })
      setShowSuccess(true)
      
      setSelectedProduct(null)
      setQuantity(1)
      setSearch('')
    } catch (error) {
      console.error('Error:', error)
      alert('Errore durante il carico')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Success screen
  if (showSuccess && successData) {
    return (
      <div className="min-h-screen">
        <header className="bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 text-white px-4 pt-12 pb-6 rounded-b-3xl">
          <div className="flex items-center gap-3">
            <ArrowDownToLine className="w-6 h-6" />
            <div>
              <h1 className="text-xl font-bold">Carico Merce</h1>
              <p className="text-emerald-100 text-sm">Operazione completata</p>
            </div>
          </div>
        </header>

        <div className="px-4 -mt-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Carico Registrato!</h2>
            <p className="text-gray-600 mb-4">
              +{successData.quantity}x {successData.product}
            </p>
            <p className="text-lg text-gray-700">
              Nuova giacenza: <span className="font-bold text-emerald-600">{successData.newStock}</span>
            </p>
            <p className="text-2xl font-bold text-emerald-600 mt-2">
              {formatCurrency(successData.total)}
            </p>
            
            <div className="flex flex-col gap-3 mt-6">
              <button
                onClick={() => {
                  setShowSuccess(false)
                  setSuccessData(null)
                  fetchProducts()
                }}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 focus:ring-emerald-500 shadow-md hover:shadow-lg active:scale-[0.98] w-full"
              >
                Nuovo Carico
              </button>
              <button
                onClick={() => router.push('/movimenti')}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 border-2 border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50 focus:ring-gray-500 w-full"
              >
                Torna ai Movimenti
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Product selection
  if (!selectedProduct) {
    return (
      <div className="min-h-screen">
        <header className="bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 text-white px-4 pt-12 pb-6 rounded-b-3xl">
          <div className="flex items-center gap-3">
            <ArrowDownToLine className="w-6 h-6" />
            <div>
              <h1 className="text-xl font-bold">Carico Merce</h1>
              <p className="text-emerald-100 text-sm">Seleziona prodotto</p>
            </div>
          </div>
        </header>

        <div className="px-4 -mt-4 space-y-4">
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

          <div className="space-y-2">
            {filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm transition-all duration-200 hover:shadow-md hover:border-gray-200 w-full text-left"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-emerald-100">
                  🧴
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 truncate">{product.name}</h4>
                  <p className="text-sm text-gray-500">
                    {formatCurrency(product.unit_cost)}/pz
                  </p>
                </div>
                <span className="font-bold text-gray-900">
                  {formatNumber(product.current_stock, 0)}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Quantity selection
  return (
    <div className="min-h-screen">
      <header className="bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 text-white px-4 pt-12 pb-6 rounded-b-3xl">
        <div className="flex items-center gap-3">
          <ArrowDownToLine className="w-6 h-6" />
          <div>
            <h1 className="text-xl font-bold">Carico Merce</h1>
            <p className="text-emerald-100 text-sm truncate">{selectedProduct.name}</p>
          </div>
        </div>
      </header>

      <div className="px-4 -mt-4 space-y-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Prodotto</p>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-2xl">
              🧴
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{selectedProduct.name}</h3>
              <p className="text-sm text-gray-500">
                {formatCurrency(selectedProduct.unit_cost)}/pz • Giacenza attuale: {formatNumber(selectedProduct.current_stock, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">Quantità da Caricare</p>
          <div className="flex items-center justify-center gap-6">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-bold transition-all duration-200 active:scale-95 bg-red-100 text-red-600 hover:bg-red-200"
            >
              <Minus className="w-6 h-6" />
            </button>
            <span className="text-5xl font-bold text-gray-900 w-20 text-center">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-bold transition-all duration-200 active:scale-95 bg-emerald-100 text-emerald-600 hover:bg-emerald-200"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              Valore: <span className="font-semibold text-emerald-600">{formatCurrency(quantity * selectedProduct.unit_cost)}</span>
            </p>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => {
              setSelectedProduct(null)
              setQuantity(1)
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50 focus:ring-gray-500 flex-1"
          >
            Annulla
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 focus:ring-emerald-500 shadow-md hover:shadow-lg active:scale-[0.98] flex-1"
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Check className="w-5 h-5" />
                Conferma
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
