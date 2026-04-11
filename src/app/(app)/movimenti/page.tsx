'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDateTime, cn } from '@/lib/utils'
import { Movement } from '@/lib/types'
import { useAuth } from '@/components/providers/auth-provider'
import {
  ClipboardList,
  ArrowDownToLine,
  ArrowUpFromLine,
  ChevronLeft,
  Users,
  ShieldAlert,
  Loader2,
  Undo2,
  X
} from 'lucide-react'
import Link from 'next/link'

export default function MovimentiPage() {
  const [movements, setMovements] = useState<Movement[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'carico' | 'scarico'>('all')
  const [confirmReversalId, setConfirmReversalId] = useState<string | null>(null)
  const [reversingId, setReversingId] = useState<string | null>(null)
  const [reversalQty, setReversalQty] = useState<number>(0)
  const { user, isSuperuser, isManager, loading: authLoading } = useAuth()
  const supabase = createClient()
  const router = useRouter()

  // Redirect managers - they cannot access movements
  useEffect(() => {
    if (!authLoading && isManager) {
      router.replace('/')
    }
  }, [isManager, authLoading, router])

  useEffect(() => {
    if (user && !isManager) {
      fetchMovements()
    }
  }, [user, isSuperuser, isManager])

  const fetchMovements = async () => {
    let query = supabase
      .from('movements')
      .select(`
        *,
        product:products(name, unit),
        worksite:worksites(code, name),
        operator:profiles(full_name)
      `)
      .order('movement_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(100)

    // Se non è superuser, filtra solo i propri movimenti
    if (!isSuperuser && user) {
      query = query.eq('operator_id', user.id)
    }

    const { data, error } = await query

    if (!error && data) {
      setMovements(data as any)
    }
    setLoading(false)
  }

  const handleReversal = useCallback(async (movement: Movement, qty: number) => {
    if (!user || reversingId) return
    if (qty <= 0 || qty > movement.quantity) return

    setReversingId(movement.id)
    setConfirmReversalId(null)

    const isFullReversal = qty === movement.quantity

    try {
      const reverseType = movement.type === 'scarico' ? 'carico' : 'scarico'
      const dateLabel = new Date(movement.created_at).toLocaleDateString('it-IT')

      // 1. Create reversal movement
      const { error: insertError } = await supabase.from('movements').insert({
        type: reverseType,
        product_id: movement.product_id,
        worksite_id: movement.worksite_id,
        quantity: qty,
        unit_cost_at_time: movement.unit_cost_at_time,
        operator_id: user.id,
        movement_date: new Date().toISOString().split('T')[0],
        notes: isFullReversal
          ? `Storno ${movement.type} del ${dateLabel}`
          : `Storno parziale (${qty}/${movement.quantity}) ${movement.type} del ${dateLabel}`,
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

      // 3. Refresh
      await fetchMovements()
    } catch (error) {
      console.error('Errore storno:', error)
      alert('Errore durante lo storno del movimento')
    } finally {
      setReversingId(null)
    }
  }, [user, reversingId, supabase])

  const filteredMovements = movements.filter(m =>
    filter === 'all' || m.type === filter
  )

  // Group by movement_date
  const groupedMovements = filteredMovements.reduce((acc, m) => {
    const date = new Date(m.movement_date).toLocaleDateString('it-IT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    })
    if (!acc[date]) acc[date] = []
    acc[date].push(m)
    return acc
  }, {} as Record<string, Movement[]>)

  // Show loading spinner while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    )
  }

  // Show access denied for managers
  if (isManager) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Accesso Negato</h1>
        <p className="text-gray-500 mb-4">Non hai i permessi per accedere ai movimenti.</p>
        <button
          onClick={() => router.push('/')}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl font-medium"
        >
          Torna alla Home
        </button>
      </div>
    )
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
          <ClipboardList className="w-6 h-6" />
          <div>
            <h1 className="text-xl font-bold">Movimenti</h1>
            <p className="text-blue-100 text-sm">
              {movements.length} operazioni
              {isSuperuser && (
                <span className="ml-2 inline-flex items-center gap-1">
                  <Users className="w-3 h-3" /> tutti
                </span>
              )}
            </p>
          </div>
        </div>
      </header>

      {/* Quick actions */}
      <div className="max-w-4xl mx-auto px-4 -mt-4 mb-4">
        <div className="grid grid-cols-2 gap-3">
          <Link href="/movimenti/carico?from=movimenti" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <ArrowDownToLine className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="font-semibold text-gray-900">Carico</span>
          </Link>
          <Link href="/movimenti/scarico?from=movimenti" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
              <ArrowUpFromLine className="w-5 h-5 text-orange-600" />
            </div>
            <span className="font-semibold text-gray-900">Scarico</span>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-4xl mx-auto px-4 mb-4">
        <div className="flex gap-2">
          {(['all', 'carico', 'scarico'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium transition-all',
                filter === f
                  ? f === 'carico' ? 'bg-emerald-100 text-emerald-700'
                    : f === 'scarico' ? 'bg-orange-100 text-orange-700'
                    : 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600'
              )}
            >
              {f === 'all' ? 'Tutti' : f === 'carico' ? 'Carichi' : 'Scarichi'}
            </button>
          ))}
        </div>
      </div>

      {/* Movements list */}
      <div className="max-w-4xl mx-auto px-4 space-y-6 pb-6">
        {Object.entries(groupedMovements).map(([date, items]) => (
          <div key={date}>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 capitalize">
              {date}
            </h3>
            <div className="space-y-2">
              {items.map(movement => {
                const isReversal = !!(movement as any).reversal_of_id
                const isReversed = movement.is_reversed

                return (
                  <div
                    key={movement.id}
                    className={cn(
                      'list-item border-l-4',
                      isReversed
                        ? 'border-l-gray-300 opacity-50'
                        : isReversal
                          ? 'border-l-red-400'
                          : movement.type === 'carico' ? 'border-l-emerald-500' : 'border-l-orange-500'
                    )}
                  >
                    <div className={cn(
                      'list-item-icon',
                      isReversal
                        ? 'bg-red-50'
                        : movement.type === 'carico' ? 'bg-emerald-100' : 'bg-orange-100'
                    )}>
                      {isReversal ? (
                        <Undo2 className="w-5 h-5 text-red-500" />
                      ) : movement.type === 'carico' ? (
                        <ArrowDownToLine className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <ArrowUpFromLine className="w-5 h-5 text-orange-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className={cn(
                          'font-semibold truncate',
                          isReversed ? 'text-gray-400 line-through' : 'text-gray-900'
                        )}>
                          {(movement as any).product?.name}
                        </h4>
                        {isReversed && (
                          <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded shrink-0">
                            STORNATO
                          </span>
                        )}
                        {isReversal && (
                          <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded shrink-0">
                            STORNO
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {movement.type === 'carico' ? '+' : '-'}{movement.quantity} pz
                        {movement.type === 'scarico' && (movement as any).worksite && (
                          <> &rarr; {(movement as any).worksite.code}</>
                        )}
                        {isReversal && movement.worksite_id && (movement as any).worksite && (
                          <> &rarr; {(movement as any).worksite.code}</>
                        )}
                      </p>
                      <p className="text-xs text-gray-400">
                        {(movement as any).operator?.full_name} &middot; {formatDateTime(movement.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'font-bold',
                        isReversed ? 'text-gray-400'
                          : isReversal ? 'text-red-500'
                          : movement.type === 'carico' ? 'text-emerald-600' : 'text-orange-600'
                      )}>
                        {movement.type === 'carico' ? '+' : '-'}{formatCurrency(movement.total_cost)}
                      </span>

                      {/* Storno button - only for non-reversed, non-reversal movements */}
                      {!isReversed && !isReversal && (
                        <>
                          {confirmReversalId === movement.id ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                value={reversalQty}
                                onChange={(e) => setReversalQty(Math.min(Math.max(1, Number(e.target.value)), movement.quantity))}
                                min={1}
                                max={movement.quantity}
                                className="w-14 px-2 py-1.5 text-xs text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-400"
                              />
                              <button
                                onClick={() => handleReversal(movement as any, reversalQty)}
                                disabled={reversingId === movement.id || reversalQty <= 0}
                                className="flex items-center gap-1 px-2 py-1.5 bg-red-500 text-white text-xs font-semibold rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                              >
                                {reversingId === movement.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Undo2 className="w-3 h-3" />
                                )}
                              </button>
                              <button
                                onClick={() => setConfirmReversalId(null)}
                                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setConfirmReversalId(movement.id); setReversalQty(movement.quantity) }}
                              className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Storna movimento"
                            >
                              <Undo2 className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {filteredMovements.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4 text-gray-400">
              <ClipboardList className="w-8 h-8" />
            </div>
            <p className="text-lg font-semibold text-gray-900 mb-2">Nessun movimento</p>
            <p className="text-sm text-gray-500 max-w-sm">
              I movimenti di magazzino appariranno qui
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
