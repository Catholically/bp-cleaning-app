'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
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
  Edit2,
  Tag,
  Undo2,
  Loader2,
  X,
} from 'lucide-react'
import Link from 'next/link'

interface MovementWithProduct extends Omit<Movement, 'operator'> {
  product: Product
  operator?: { full_name: string }
}

interface MonthlyProductSummary {
  productId: string
  productName: string
  totalQuantity: number
  totalCost: number
  unit: string
  movements: MovementWithProduct[]
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
  const { user, isSuperuser } = useAuth()
  const [worksite, setWorksite] = useState<Worksite | null>(null)
  const [movements, setMovements] = useState<MovementWithProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set())
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set())
  const [reversingId, setReversingId] = useState<string | null>(null)
  const [confirmReversalId, setConfirmReversalId] = useState<string | null>(null)
  const [reversalQty, setReversalQty] = useState<number>(0)
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

    // Fetch ALL movements for this worksite (scarico + storno carico)
    const { data: movData } = await supabase
      .from('movements')
      .select('*, product:products(*), operator:profiles(full_name)')
      .eq('worksite_id', params.id)
      .order('created_at', { ascending: false })

    if (movData) {
      setMovements(movData as MovementWithProduct[])
    }

    setLoading(false)
  }

  // Filter active (non-reversed) scarico movements for aggregation
  const activeMovements = useMemo(() =>
    movements.filter(m => m.type === 'scarico' && !m.is_reversed),
    [movements]
  )

  // Group movements by month and aggregate products
  const monthlyData = useMemo(() => {
    const monthMap = new Map<string, Map<string, MonthlyProductSummary>>()

    // All scarico movements (including reversed, for drill-down)
    const scaricoMovements = movements.filter(m => m.type === 'scarico')

    scaricoMovements.forEach((mov) => {
      const date = new Date(mov.created_at)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, new Map())
      }

      const productMap = monthMap.get(monthKey)!
      const productId = mov.product_id

      if (productMap.has(productId)) {
        const existing = productMap.get(productId)!
        if (!mov.is_reversed) {
          existing.totalQuantity += mov.quantity
          existing.totalCost += mov.total_cost
        }
        existing.movements.push(mov)
      } else {
        productMap.set(productId, {
          productId,
          productName: mov.product?.name || 'Prodotto sconosciuto',
          totalQuantity: mov.is_reversed ? 0 : mov.quantity,
          totalCost: mov.is_reversed ? 0 : mov.total_cost,
          unit: mov.product?.unit || 'pz',
          movements: [mov]
        })
      }
    })

    const result: MonthData[] = []
    const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
      'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre']

    Array.from(monthMap.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .forEach(([key, productMap]) => {
        const [year, month] = key.split('-')
        const products = Array.from(productMap.values())
          .filter(p => p.totalQuantity > 0 || p.movements.some(m => m.is_reversed))
          .sort((a, b) => b.totalCost - a.totalCost)
        const totalCost = products.reduce((sum, p) => sum + p.totalCost, 0)

        if (products.length > 0) {
          result.push({
            key,
            label: `${monthNames[parseInt(month) - 1]} ${year}`,
            products,
            totalCost
          })
        }
      })

    return result
  }, [movements])

  // Calculate totals (only active movements)
  const totalSpent = useMemo(() =>
    activeMovements.reduce((sum, m) => sum + (m.total_cost || 0), 0),
    [activeMovements]
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

  const toggleProduct = (monthKey: string, productId: string) => {
    const compositeKey = `${monthKey}::${productId}`
    setExpandedProducts(prev => {
      const next = new Set(prev)
      if (next.has(compositeKey)) {
        next.delete(compositeKey)
      } else {
        next.add(compositeKey)
      }
      return next
    })
  }

  const handleReversal = useCallback(async (movement: MovementWithProduct, qty: number) => {
    if (!user || reversingId) return
    if (qty <= 0 || qty > movement.quantity) return

    setReversingId(movement.id)
    setConfirmReversalId(null)

    const isFullReversal = qty === movement.quantity

    try {
      // 1. Create reversal movement (carico to restore stock)
      const { error: insertError } = await supabase.from('movements').insert({
        type: 'carico',
        product_id: movement.product_id,
        worksite_id: movement.worksite_id,
        quantity: qty,
        unit_cost_at_time: movement.unit_cost_at_time,
        operator_id: user.id,
        movement_date: new Date().toISOString().split('T')[0],
        notes: isFullReversal
          ? `Storno scarico del ${new Date(movement.created_at).toLocaleDateString('it-IT')}`
          : `Storno parziale (${qty}/${movement.quantity}) scarico del ${new Date(movement.created_at).toLocaleDateString('it-IT')}`,
        reversal_of_id: movement.id
      })

      if (insertError) throw insertError

      // 2. Mark original as reversed only if full reversal
      if (isFullReversal) {
        const { error: updateError } = await supabase
          .from('movements')
          .update({ is_reversed: true })
          .eq('id', movement.id)

        if (updateError) throw updateError
      }

      // 3. Refresh data
      await fetchWorksite()
    } catch (error) {
      console.error('Errore storno:', error)
      alert('Errore durante lo storno del movimento')
    } finally {
      setReversingId(null)
    }
  }, [user, reversingId, supabase])

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

            {worksite.client_group && (
              <div className="flex items-center gap-3">
                <Tag className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Gruppo</p>
                  <p className="text-sm text-gray-900">{worksite.client_group}</p>
                </div>
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
                    {month.products.map((product) => {
                      const compositeKey = `${month.key}::${product.productId}`
                      const isExpanded = expandedProducts.has(compositeKey)
                      const hasMultipleMovements = product.movements.length > 1
                      const hasReversible = product.movements.some(m => !m.is_reversed)

                      return (
                        <div key={product.productId}>
                          <button
                            onClick={() => toggleProduct(month.key, product.productId)}
                            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
                          >
                            <div className="flex-1 min-w-0 text-left">
                              <p className={cn(
                                'text-sm font-medium truncate',
                                product.totalQuantity === 0 ? 'text-gray-400 line-through' : 'text-gray-900'
                              )}>
                                {product.productName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {product.totalQuantity} {product.unit}
                                {product.movements.some(m => m.is_reversed) && (
                                  <span className="ml-1.5 text-red-400">(con storni)</span>
                                )}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <p className={cn(
                                'text-sm font-semibold',
                                product.totalQuantity === 0 ? 'text-gray-400' : 'text-gray-900'
                              )}>
                                {formatCurrency(product.totalCost)}
                              </p>
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-gray-300" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-gray-300" />
                              )}
                            </div>
                          </button>

                          {/* Drill-down: individual movements */}
                          {isExpanded && (
                            <div className="bg-gray-50/50 border-t border-gray-100">
                              {product.movements
                                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                                .map((mov) => (
                                <div
                                  key={mov.id}
                                  className={cn(
                                    'px-4 py-2.5 flex items-center gap-3 border-b border-gray-100/50 last:border-b-0',
                                    mov.is_reversed && 'opacity-50'
                                  )}
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <p className={cn(
                                        'text-xs font-medium',
                                        mov.is_reversed ? 'text-gray-400 line-through' : 'text-gray-700'
                                      )}>
                                        {mov.quantity} {product.unit} &middot; {formatCurrency(mov.total_cost)}
                                      </p>
                                      {mov.is_reversed && (
                                        <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">
                                          STORNATO
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[11px] text-gray-400">
                                      {mov.operator?.full_name} &middot; {new Date(mov.created_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </p>
                                  </div>

                                  {/* Reversal button */}
                                  {!mov.is_reversed && (
                                    <>
                                      {confirmReversalId === mov.id ? (
                                        <div className="flex items-center gap-1.5">
                                          <input
                                            type="number"
                                            value={reversalQty}
                                            onChange={(e) => setReversalQty(Math.min(Math.max(1, Number(e.target.value)), mov.quantity))}
                                            min={1}
                                            max={mov.quantity}
                                            className="w-14 px-2 py-1.5 text-xs text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-400"
                                          />
                                          <button
                                            onClick={() => handleReversal(mov, reversalQty)}
                                            disabled={reversingId === mov.id || reversalQty <= 0}
                                            className="flex items-center gap-1 px-2.5 py-1.5 bg-red-500 text-white text-xs font-semibold rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                                          >
                                            {reversingId === mov.id ? (
                                              <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : (
                                              <Undo2 className="w-3 h-3" />
                                            )}
                                          </button>
                                          <button
                                            onClick={() => setConfirmReversalId(null)}
                                            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                                          >
                                            <X className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      ) : (
                                        <button
                                          onClick={() => { setConfirmReversalId(mov.id); setReversalQty(mov.quantity) }}
                                          className="flex items-center gap-1 px-2.5 py-1.5 text-red-500 hover:bg-red-50 text-xs font-medium rounded-lg transition-colors"
                                        >
                                          <Undo2 className="w-3.5 h-3.5" />
                                          Storna
                                        </button>
                                      )}
                                    </>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
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
