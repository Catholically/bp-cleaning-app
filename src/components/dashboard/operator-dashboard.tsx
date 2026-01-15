'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/providers/auth-provider'
import { createClient } from '@/lib/supabase/client'
import { BottomNav } from '@/components/navigation/bottom-nav'
import Image from 'next/image'
import {
  Building2,
  ArrowUpFromLine,
  ChevronRight,
  Clock,
  MapPin,
  Phone,
  ClipboardList
} from 'lucide-react'
import Link from 'next/link'

interface Worksite {
  id: string
  code: string
  name: string
  address: string
  city: string
  client_name: string
}

interface RecentMovement {
  id: string
  type: 'carico' | 'scarico'
  product_name: string
  quantity: number
  worksite_name?: string
  created_at: string
}

export function OperatorDashboard() {
  const { profile } = useAuth()
  const [worksites, setWorksites] = useState<Worksite[]>([])
  const [recentMovements, setRecentMovements] = useState<RecentMovement[]>([])
  const [todayCount, setTodayCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch active worksites
      const { data: worksitesData } = await supabase
        .from('worksites')
        .select('id, code, name, address, city, client_name')
        .eq('status', 'active')
        .order('name')

      // Fetch operator's recent movements
      const { data: movementsData } = await supabase
        .from('movements')
        .select(`
          id, type, quantity, created_at,
          products(name),
          worksites(name)
        `)
        .eq('operator_id', profile?.id)
        .order('created_at', { ascending: false })
        .limit(5)

      // Count today's movements by this operator
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const { count } = await supabase
        .from('movements')
        .select('*', { count: 'exact', head: true })
        .eq('operator_id', profile?.id)
        .gte('created_at', today.toISOString())

      setWorksites(worksitesData || [])
      setRecentMovements((movementsData || []).map((m: any) => ({
        id: m.id,
        type: m.type,
        product_name: m.products?.name || 'Prodotto',
        quantity: m.quantity,
        worksite_name: m.worksites?.name,
        created_at: m.created_at
      })))
      setTodayCount(count || 0)

    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Buongiorno'
    if (hour < 18) return 'Buon pomeriggio'
    return 'Buonasera'
  }

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'ora'
    if (diffMins < 60) return `${diffMins}min fa`
    if (diffHours < 24) return `${diffHours}h fa`
    return `${diffDays}g fa`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 to-cyan-50">
        <div className="flex flex-col items-center gap-4">
          <Image src="/logo.svg" alt="BP Cleaning" width={64} height={64} className="animate-pulse-soft" />
          <div className="w-8 h-1 bg-sky-200 rounded-full overflow-hidden">
            <div className="h-full bg-sky-500 rounded-full animate-pulse" style={{ width: '50%' }} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600" />
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'url(/logo.svg)',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right -20px top -20px',
          backgroundSize: '180px'
        }} />

        <div className="relative px-5 pt-14 pb-8">
          {/* Logo e Titolo */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
              <Image src="/logo.svg" alt="BP Cleaning" width={32} height={32} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">BP Cleaning</h1>
              <p className="text-emerald-100 text-sm">Area Operatore</p>
            </div>
          </div>

          {/* Saluto */}
          <div className="mb-4">
            <p className="text-emerald-100 text-sm">{greeting()},</p>
            <p className="text-white text-2xl font-bold">
              {profile?.full_name?.split(' ')[0] || 'Operatore'}
            </p>
          </div>

          {/* Stats */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-xs font-medium">Movimenti Oggi</p>
                <p className="text-white text-3xl font-bold">{todayCount}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Quick Action - Scarico */}
      <div className="px-5 -mt-4">
        <Link
          href="/movimenti/scarico"
          className="flex items-center gap-4 p-5 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl shadow-lg shadow-orange-500/30 animate-slide-up"
        >
          <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
            <ArrowUpFromLine className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-white text-lg">Scarico Merce</h3>
            <p className="text-orange-100 text-sm">Consegna prodotti al cantiere</p>
          </div>
          <ChevronRight className="w-6 h-6 text-white/70" />
        </Link>
      </div>

      {/* Cantieri Attivi */}
      <div className="px-5 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-900">Cantieri Attivi</h2>
          <span className="text-xs text-gray-500">{worksites.length} cantieri</span>
        </div>

        <div className="space-y-3">
          {worksites.slice(0, 4).map((ws, index) => (
            <Link
              key={ws.id}
              href={`/movimenti/scarico?cantiere=${ws.code}`}
              className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all animate-slide-up"
              style={{ animationDelay: `${0.1 + index * 0.05}s` }}
            >
              <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 text-violet-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{ws.name}</p>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate">{ws.city}</span>
                </div>
              </div>
              <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">
                {ws.code}
              </span>
            </Link>
          ))}

          {worksites.length > 4 && (
            <Link
              href="/cantieri"
              className="flex items-center justify-center gap-2 p-3 text-sm text-sky-600 font-medium hover:bg-sky-50 rounded-xl transition-colors"
            >
              Vedi tutti i cantieri
              <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>

      {/* I Miei Movimenti Recenti */}
      {recentMovements.length > 0 && (
        <div className="px-5 mt-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900">I Miei Movimenti</h2>
            <Link href="/movimenti" className="text-xs text-sky-600 font-medium">
              Storico
            </Link>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {recentMovements.map((mov, index) => (
              <div
                key={mov.id}
                className={`flex items-center gap-3 p-3 ${
                  index !== recentMovements.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  mov.type === 'carico' ? 'bg-emerald-100' : 'bg-orange-100'
                }`}>
                  <ArrowUpFromLine className={`w-4 h-4 ${
                    mov.type === 'carico' ? 'text-emerald-600 rotate-180' : 'text-orange-600'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{mov.product_name}</p>
                  <p className="text-xs text-gray-500">
                    {mov.type === 'scarico' ? '-' : '+'}{mov.quantity} {mov.worksite_name && `• ${mov.worksite_name}`}
                  </p>
                </div>
                <span className="text-xs text-gray-400">{formatTimeAgo(mov.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state se non ci sono movimenti */}
      {recentMovements.length === 0 && (
        <div className="px-5 mt-6 mb-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
            <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Nessun movimento recente</p>
            <p className="text-gray-400 text-sm mt-1">Inizia a scaricare prodotti ai cantieri</p>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
