'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/auth-provider'
import { formatCurrency, formatNumber, formatDate, cn } from '@/lib/utils'
import { Product, CATEGORY_LABELS, CATEGORY_ICONS } from '@/lib/types'
import {
  ArrowLeft,
  Package,
  Barcode,
  Building2,
  Calendar,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Edit,
  Trash2
} from 'lucide-react'
import Link from 'next/link'

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { isSuperuser } = useAuth()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchProduct()
  }, [params.id])

  const fetchProduct = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*, supplier:suppliers(name)')
      .eq('id', params.id)
      .single()

    if (!error && data) {
      setProduct(data)
    }
    setLoading(false)
  }

  const handleDelete = async () => {
    if (!product) return
    if (!confirm(`Sei sicuro di voler eliminare "${product.name}"?`)) return

    setDeleting(true)
    const { error } = await supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', product.id)

    if (!error) {
      router.push('/prodotti')
    } else {
      alert('Errore durante l\'eliminazione')
      setDeleting(false)
    }
  }

  const getStockStatus = (current: number, min: number) => {
    const ratio = current / min
    if (ratio <= 1) return { color: 'text-red-500', bg: 'bg-red-50 border-red-200', label: 'RIORDINO URGENTE' }
    if (ratio <= 1.5) return { color: 'text-amber-500', bg: 'bg-amber-50 border-amber-200', label: 'SCORTA BASSA' }
    return { color: 'text-emerald-500', bg: 'bg-emerald-50 border-emerald-200', label: 'DISPONIBILE' }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Package className="w-16 h-16 text-gray-300 mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">Prodotto non trovato</h1>
        <Link href="/prodotti" className="text-blue-600 hover:underline">
          Torna ai prodotti
        </Link>
      </div>
    )
  }

  const status = getStockStatus(product.current_stock, product.min_stock)

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white px-4 pt-12 pb-6 rounded-b-3xl">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-white/10 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-blue-100">Dettaglio Prodotto</span>
        </div>
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-3xl">
            {CATEGORY_ICONS[product.category]}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold truncate">{product.name}</h1>
            <p className="text-blue-100 text-sm">{CATEGORY_LABELS[product.category]}</p>
            {product.sku && (
              <p className="text-blue-200 text-xs font-mono mt-1">{product.sku}</p>
            )}
          </div>
        </div>
      </header>

      <div className="px-4 -mt-4 space-y-4">
        {/* Stock Status Card */}
        <div className={cn('p-4 rounded-2xl border-2', status.bg)}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Giacenza Attuale</p>
              <p className={cn('text-3xl font-bold', status.color)}>
                {formatNumber(product.current_stock, 0)}
              </p>
              <p className="text-sm text-gray-500">{product.unit}</p>
            </div>
            <div className="text-right">
              <span className={cn(
                'inline-block px-3 py-1 rounded-full text-xs font-semibold',
                status.color,
                status.bg
              )}>
                {status.label}
              </span>
              {product.current_stock <= product.min_stock && (
                <div className="flex items-center gap-1 mt-2 text-red-500">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-xs">Sotto soglia minima</span>
                </div>
              )}
            </div>
          </div>

          {/* Stock Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Min: {product.min_stock}</span>
              <span>Target: {product.min_stock * 2}</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  product.current_stock <= product.min_stock ? 'bg-red-500' :
                  product.current_stock <= product.min_stock * 1.5 ? 'bg-amber-500' : 'bg-emerald-500'
                )}
                style={{ width: `${Math.min((product.current_stock / (product.min_stock * 2)) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">Prezzo Unitario</p>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(product.unit_cost)}</p>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">Quantità/Conf.</p>
            <p className="text-lg font-bold text-gray-900">{product.quantity_per_package} {product.unit}</p>
          </div>
        </div>

        {/* Details */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
          {product.barcode && (
            <div className="flex items-center gap-4 p-4">
              <Barcode className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Barcode</p>
                <p className="font-mono text-gray-900">{product.barcode}</p>
              </div>
            </div>
          )}

          {product.supplier && (
            <div className="flex items-center gap-4 p-4">
              <Building2 className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Fornitore</p>
                <p className="text-gray-900">{(product.supplier as any).name}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 p-4">
            <Calendar className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Ultimo Aggiornamento</p>
              <p className="text-gray-900">{formatDate(product.updated_at)}</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href={`/movimenti/carico?product=${product.id}`}
            className="flex items-center justify-center gap-2 p-4 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-200 font-semibold hover:bg-emerald-100 transition-colors"
          >
            <TrendingUp className="w-5 h-5" />
            Carico
          </Link>
          <Link
            href={`/movimenti/scarico?product=${product.id}`}
            className="flex items-center justify-center gap-2 p-4 bg-red-50 text-red-700 rounded-2xl border border-red-200 font-semibold hover:bg-red-100 transition-colors"
          >
            <TrendingDown className="w-5 h-5" />
            Scarico
          </Link>
        </div>

        {/* Admin Actions */}
        {isSuperuser && (
          <div className="flex gap-3 pt-4">
            <Link
              href={`/prodotti/${product.id}/modifica`}
              className="flex-1 flex items-center justify-center gap-2 p-4 bg-blue-600 text-white rounded-2xl font-semibold hover:bg-blue-700 transition-colors"
            >
              <Edit className="w-5 h-5" />
              Modifica
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center justify-center gap-2 p-4 bg-gray-100 text-gray-700 rounded-2xl font-semibold hover:bg-red-100 hover:text-red-700 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
