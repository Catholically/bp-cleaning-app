'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/auth-provider'
import { formatCurrency, cn } from '@/lib/utils'
import { Worksite, Movement, Product } from '@/lib/types'
import {
  Building2,
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  FileText,
  Package,
  Calendar,
  ChevronDown,
  ChevronUp,
  Edit2
} from 'lucide-react'
import Link from 'next/link'

interface MovementWithProduct extends Movement {
  product: Product
}

interface MonthlyProductSummary {
  productId: string
  productName: string
  totalQuantity: number
  totalCost: number
  unit: string
}

interface MonthData {
  key: string
  label: string
  products: MonthlyProductSummary[]
  totalCost: number
}

export default function CantiereDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { isSuperuser } = useAuth()
  const [worksite, setWorksite] = useState<Worksite | null>(null)
  const [movements, setMovements] = useState<MovementWithProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set())
  const supabase = createClient()

  useEffect(() => {
    if (params.id) {
      fetchWorksite()
    }
  }, [params.id])

  const fetchWorksite = async () => {
    const { data: wsData, error } = await supabase
      .from('worksites')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !wsData) {
      router.push('/cantieri')
      return
    }

    setWorksite(wsData)

    // Fetch ALL movements for this worksite (no limit)
    const { data: movData } = await supabase
      .from('movements')
      .select('*, product:products(*)')
      .eq('worksite_id', params.id)
      .eq('type', 'scarico')
      .order('created_at', { ascending: false })

    if (movData) {
      setMovements(movData as MovementWithProduct[])
    }

    setLoading(false)
  }

  // Group movements by month and aggregate products
  const monthlyData = useMemo(() => {
    const monthMap = new Map<string, Map<string, MonthlyProductSummary>>()

    movements.forEach((mov) => {
      const date = new Date(mov.created_at)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, new Map())
      }

      const productMap = monthMap.get(monthKey)!
      const productId = mov.product_id

      if (productMap.has(productId)) {
        const existing = productMap.get(productId)!
        existing.totalQuantity += mov.quantity
        existing.totalCost += mov.total_cost
      } else {
        productMap.set(productId, {
          productId,
          productName: mov.product?.name || 'Prodotto sconosciuto',
          totalQuantity: mov.quantity,
          totalCost: mov.total_cost,
          unit: mov.product?.unit || 'pz'
        })
      }
    })

    // Convert to array and sort by month descending
    const result: MonthData[] = []
    const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
      'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre']

    Array.from(monthMap.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .forEach(([key, productMap]) => {
        const [year, month] = key.split('-')
        const products = Array.from(productMap.values()).sort((a, b) => b.totalCost - a.totalCost)
        const totalCost = products.reduce((sum, p) => sum + p.totalCost, 0)

        result.push({
          key,
          label: `${monthNames[parseInt(month) - 1]} ${year}`,
          products,
          totalCost
        })
      })

    return result
  }, [movements])

  // Calculate totals
  const totalSpent = useMemo(() =>
    movements.reduce((sum, m) => sum + (m.total_cost || 0), 0),
    [movements]
  )

  const currentMonthSpent = useMemo(() => {
    const now = new Date()
    const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const currentMonth = monthlyData.find(m => m.key === currentKey)
    return currentMonth?.totalCost || 0
  }, [monthlyData])

  // Auto-expand current month
  useEffect(() => {
    if (monthlyData.length > 0) {
      setExpandedMonths(new Set([monthlyData[0].key]))
    }
  }, [monthlyData])

  const toggleMonth = (key: string) => {
    setExpandedMonths(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!worksite) {
    return null
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="bg-gradient-to-r from-violet-500 via-purple-600 to-indigo-600 text-white px-4 pt-12 pb-6 rounded-b-3xl">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => router.back()}
              className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-medium">
                {worksite.code}
              </span>
              <h1 className="text-xl font-bold mt-1">{worksite.name}</h1>
            </div>
            {isSuperuser && (
              <Link
                href={`/cantieri/${worksite.id}/modifica`}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <Edit2 className="w-5 h-5" />
              </Link>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
              <p className="text-purple-100 text-xs">Questo mese</p>
              <p className="text-2xl font-bold">{formatCurrency(currentMonthSpent)}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
              <p className="text-purple-100 text-xs">Totale storico</p>
              <p className="text-2xl font-bold">{formatCurrency(totalSpent)}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 -mt-4 space-y-4">
        {/* Info Card - Collapsible */}
        <details className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <summary className="p-4 cursor-pointer flex items-center gap-2 font-semibold text-gray-900">
            <Building2 className="w-4 h-4 text-violet-600" />
            Informazioni
          </summary>
          <div className="px-4 pb-4 space-y-3">
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-900">{worksite.address}</p>
                <p className="text-sm text-gray-500">
                  {worksite.cap} {worksite.city} ({worksite.provincia})
                </p>
              </div>
            </div>

            {worksite.codice_fiscale && (
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Codice Fiscale</p>
                  <p className="text-sm text-gray-900 font-mono">{worksite.codice_fiscale}</p>
                </div>
              </div>
            )}

            {worksite.partita_iva && (
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Partita IVA</p>
                  <p className="text-sm text-gray-900 font-mono">{worksite.partita_iva}</p>
                </div>
              </div>
            )}

            {worksite.client_phone && (
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gray-400" />
                <a href={`tel:${worksite.client_phone}`} className="text-sm text-violet-600">
                  {worksite.client_phone}
                </a>
              </div>
            )}

            {worksite.client_email && (
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-400" />
                <a href={`mailto:${worksite.client_email}`} className="text-sm text-violet-600">
                  {worksite.client_email}
                </a>
              </div>
            )}

            {worksite.notes && (
              <div className="pt-2 border-t border-gray-100">
                <p className="text-sm text-gray-600">{worksite.notes}</p>
              </div>
            )}
          </div>
        </details>

        {/* Monthly Products */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-violet-600" />
            Prodotti per mese
          </h3>

          {monthlyData.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Nessuno scarico registrato</p>
            </div>
          ) : (
            monthlyData.map((month) => (
              <div
                key={month.key}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => toggleMonth(month.key)}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-violet-500" />
                    <span className="font-semibold text-gray-900">{month.label}</span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                      {month.products.length} prodotti
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-violet-600">{formatCurrency(month.totalCost)}</span>
                    {expandedMonths.has(month.key) ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </button>

                {expandedMonths.has(month.key) && (
                  <div className="border-t border-gray-100 divide-y divide-gray-50">
                    {month.products.map((product) => (
                      <div
                        key={product.productId}
                        className="px-4 py-3 flex items-center justify-between"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {product.productName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {product.totalQuantity} {product.unit}
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-gray-900 ml-4">
                          {formatCurrency(product.totalCost)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Quick action */}
        <Link
          href={`/movimenti/scarico?cantiere=${worksite.id}`}
          className="block w-full bg-gradient-to-r from-violet-600 to-purple-600 text-white text-center py-4 rounded-2xl font-semibold shadow-lg"
        >
          Nuovo Scarico per questo cantiere
        </Link>
      </div>
    </div>
  )
}
