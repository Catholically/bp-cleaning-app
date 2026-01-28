'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDateTime, cn } from '@/lib/utils'
import { Movement } from '@/lib/types'
import { useAuth } from '@/components/providers/auth-provider'
import {
  ClipboardList,
  ArrowDownToLine,
  ArrowUpFromLine,
  Filter,
  ChevronRight,
  ChevronLeft,
  Users,
  ShieldAlert,
  Loader2
} from 'lucide-react'
import Link from 'next/link'

export default function MovimentiPage() {
  const [movements, setMovements] = useState<Movement[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'carico' | 'scarico'>('all')
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

  const filteredMovements = movements.filter(m => 
    filter === 'all' || m.type === filter
  )

  // Group by date
  const groupedMovements = filteredMovements.reduce((acc, m) => {
    const date = new Date(m.created_at).toLocaleDateString('it-IT', {
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
              {items.map(movement => (
                <div
                  key={movement.id}
                  className={cn(
                    'list-item border-l-4',
                    movement.type === 'carico' ? 'border-l-emerald-500' : 'border-l-orange-500'
                  )}
                >
                  <div className={cn(
                    'list-item-icon',
                    movement.type === 'carico' ? 'bg-emerald-100' : 'bg-orange-100'
                  )}>
                    {movement.type === 'carico' ? (
                      <ArrowDownToLine className={cn(
                        'w-5 h-5',
                        'text-emerald-600'
                      )} />
                    ) : (
                      <ArrowUpFromLine className={cn(
                        'w-5 h-5',
                        'text-orange-600'
                      )} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 truncate">
                      {(movement as any).product?.name}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {movement.type === 'carico' ? '+' : '-'}{movement.quantity} pz
                      {movement.type === 'scarico' && (movement as any).worksite && (
                        <> → {(movement as any).worksite.code}</>
                      )}
                    </p>
                    <p className="text-xs text-gray-400">
                      {(movement as any).operator?.full_name} • {formatDateTime(movement.created_at)}
                    </p>
                  </div>
                  <span className={cn(
                    'font-bold',
                    movement.type === 'carico' ? 'text-emerald-600' : 'text-orange-600'
                  )}>
                    {movement.type === 'carico' ? '+' : '-'}{formatCurrency(movement.total_cost)}
                  </span>
                </div>
              ))}
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
