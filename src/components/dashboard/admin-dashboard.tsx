'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/providers/auth-provider'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { BottomNav } from '@/components/navigation/bottom-nav'
import Image from 'next/image'
import {
  Package,
  Building2,
  ArrowDownToLine,
  ArrowUpFromLine,
  ChevronRight,
  AlertTriangle,
  Activity,
  Euro,
  Boxes,
  Clock,
  Plus,
  BarChart3,
  Wrench,
  ShieldAlert,
  ShieldCheck,
  Shield
} from 'lucide-react'
import Link from 'next/link'

interface MachineInfo {
  id: string
  name: string
  code: string
  purchase_cost: number
  status: string
  purchase_date?: string
  warranty_months?: number
}

interface DashboardStats {
  totalProducts: number
  totalStockValue: number
  lowStockCount: number
  activeWorksites: number
  todayMovements: number
  monthlySpend: number
  recentMovements: RecentMovement[]
  machinesValue: number
  machinesCount: number
  machinesWarningCount: number
}

interface LowStockItem {
  id: string
  name: string
  current_stock: number
  min_stock: number
  unit: string
}

interface RecentMovement {
  id: string
  type: 'carico' | 'scarico'
  product_name: string
  quantity: number
  worksite_name?: string
  operator_name?: string
  created_at: string
}

export function AdminDashboard() {
  const { profile, isSuperuser } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [lowStock, setLowStock] = useState<LowStockItem[]>([])
  const [machines, setMachines] = useState<MachineInfo[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch products stats (exclude macchinari - tracked separately)
      const { data: products } = await supabase
        .from('products')
        .select('current_stock, unit_cost, min_stock, name, unit, id')
        .eq('is_active', true)
        .neq('category', 'macchinario')

      // Fetch active worksites
      const { count: worksitesCount } = await supabase
        .from('worksites')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')

      // Fetch today's movements
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const { count: movementsCount } = await supabase
        .from('movements')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString())

      // Fetch monthly spend (scarichi only)
      const monthStart = new Date()
      monthStart.setDate(1)
      monthStart.setHours(0, 0, 0, 0)
      const { data: monthlyMovements } = await supabase
        .from('movements')
        .select('total_cost')
        .eq('type', 'scarico')
        .gte('created_at', monthStart.toISOString())

      // Fetch machines
      const { data: machinesData } = await supabase
        .from('machines')
        .select('id, name, code, purchase_cost, status, purchase_date, warranty_months')
        .neq('status', 'dismesso')

      // Fetch recent movements with product, worksite, and operator names
      const { data: recentMov } = await supabase
        .from('movements')
        .select(`
          id, type, quantity, created_at,
          products(name),
          worksites(name),
          profiles:operator_id(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(5)

      const totalStockValue = products?.reduce(
        (sum: number, p: any) => sum + (p.current_stock * p.unit_cost), 0
      ) || 0

      const lowStockItems = products?.filter(
        (p: any) => p.current_stock <= p.min_stock
      ) || []

      const monthlySpend = monthlyMovements?.reduce(
        (sum: number, m: any) => sum + (m.total_cost || 0), 0
      ) || 0

      const machinesValue = (machinesData || []).reduce(
        (sum: number, m: any) => sum + (m.purchase_cost || 0), 0
      )
      const now = new Date()
      const machinesWarningCount = (machinesData || []).filter((m: any) => {
        if (!m.purchase_date || !m.warranty_months) return false
        const end = new Date(m.purchase_date)
        end.setMonth(end.getMonth() + m.warranty_months)
        return end.getTime() - now.getTime() < 90 * 24 * 60 * 60 * 1000
      }).length

      const recentMovements: RecentMovement[] = (recentMov || []).map((m: any) => ({
        id: m.id,
        type: m.type,
        product_name: m.products?.name || 'Prodotto',
        quantity: m.quantity,
        worksite_name: m.worksites?.name,
        operator_name: m.profiles?.full_name,
        created_at: m.created_at
      }))

      setMachines(machinesData || [])

      setStats({
        totalProducts: products?.length || 0,
        totalStockValue,
        lowStockCount: lowStockItems.length,
        activeWorksites: worksitesCount || 0,
        todayMovements: movementsCount || 0,
        monthlySpend,
        recentMovements,
        machinesValue,
        machinesCount: (machinesData || []).length,
        machinesWarningCount
      })

      setLowStock(lowStockItems.slice(0, 3).map((p: any) => ({
        id: p.id,
        name: p.name,
        current_stock: p.current_stock,
        min_stock: p.min_stock,
        unit: p.unit
      })))

    } catch (error) {
      console.error('Error fetching dashboard:', error)
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
        <div className="absolute inset-0 gradient-water" />
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'url(/logo.svg)',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right -20px top -20px',
          backgroundSize: '180px'
        }} />

        <div className="relative px-5 pt-14 pb-8 max-w-4xl mx-auto">
          {/* Logo e Titolo */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
              <Image src="/logo.svg" alt="BP Cleaning" width={32} height={32} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">BP Cleaning</h1>
              <p className="text-sky-100 text-sm">Gestione Magazzino</p>
            </div>
            {isSuperuser && (
              <span className="ml-auto px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-sm">
                Admin
              </span>
            )}
          </div>

          {/* Saluto */}
          <div className="mb-6">
            <p className="text-sky-100 text-sm">
              {greeting()},
            </p>
            <p className="text-white text-2xl font-bold">
              {profile?.full_name?.split(' ')[0] || 'Utente'}
            </p>
          </div>

          {/* Quick Stats in header */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-1">
                <Euro className="w-4 h-4 text-sky-200" />
                <span className="text-sky-200 text-xs font-medium">Valore Stock</span>
              </div>
              <p className="text-white text-2xl font-bold number-animate">
                {formatCurrency(stats?.totalStockValue || 0)}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-4 h-4 text-sky-200" />
                <span className="text-sky-200 text-xs font-medium">Spesa {new Date().toLocaleDateString('it-IT', { month: 'long' }).charAt(0).toUpperCase() + new Date().toLocaleDateString('it-IT', { month: 'long' }).slice(1)}</span>
              </div>
              <p className="text-white text-2xl font-bold number-animate">
                {formatCurrency(stats?.monthlySpend || 0)}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="px-5 -mt-2 max-w-4xl mx-auto">
        <div className="grid grid-cols-4 gap-2 lg:gap-3">
          <Link href="/prodotti" className="stat-card text-center animate-slide-up hover:shadow-md hover:scale-[1.02] transition-all" style={{ animationDelay: '0.05s' }}>
            <Boxes className="w-5 h-5 text-sky-500 mx-auto mb-1" />
            <p className="text-xl font-bold text-gray-900">{stats?.totalProducts || 0}</p>
            <p className="text-xs text-gray-500">Prodotti</p>
          </Link>
          <Link href="/cantieri" className="stat-card text-center animate-slide-up hover:shadow-md hover:scale-[1.02] transition-all" style={{ animationDelay: '0.1s' }}>
            <Building2 className="w-5 h-5 text-violet-500 mx-auto mb-1" />
            <p className="text-xl font-bold text-gray-900">{stats?.activeWorksites || 0}</p>
            <p className="text-xs text-gray-500">Cantieri</p>
          </Link>
          <Link href="/movimenti" className="stat-card text-center animate-slide-up hover:shadow-md hover:scale-[1.02] transition-all" style={{ animationDelay: '0.15s' }}>
            <Clock className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
            <p className="text-xl font-bold text-gray-900">{stats?.todayMovements || 0}</p>
            <p className="text-xs text-gray-500">Oggi</p>
          </Link>
          <Link href="/prodotti?filter=low" className="stat-card text-center animate-slide-up hover:shadow-md hover:scale-[1.02] transition-all" style={{ animationDelay: '0.2s' }}>
            <AlertTriangle className={`w-5 h-5 mx-auto mb-1 ${(stats?.lowStockCount || 0) > 0 ? 'text-red-500' : 'text-gray-300'}`} />
            <p className={`text-xl font-bold ${(stats?.lowStockCount || 0) > 0 ? 'text-red-500' : 'text-gray-900'}`}>
              {stats?.lowStockCount || 0}
            </p>
            <p className="text-xs text-gray-500">Riordino</p>
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-5 mt-6 max-w-4xl mx-auto">
        <div className={`grid gap-3 ${isSuperuser ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2'}`}>
          {/* Carico - visibile a tutti */}
          <Link
            href="/movimenti/carico"
            className="action-card flex items-center gap-3 animate-slide-up"
            style={{ animationDelay: '0.25s' }}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <ArrowDownToLine className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Carico</h3>
              <p className="text-xs text-gray-500">Arrivo merce</p>
            </div>
          </Link>

          {/* Scarico - visibile a tutti */}
          <Link
            href="/movimenti/scarico"
            className="action-card flex items-center gap-3 animate-slide-up"
            style={{ animationDelay: '0.3s' }}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <ArrowUpFromLine className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Scarico</h3>
              <p className="text-xs text-gray-500">Per cantiere</p>
            </div>
          </Link>

          {/* + Prodotto - solo admin */}
          {isSuperuser && (
            <Link
              href="/prodotti/nuovo"
              className="action-card flex items-center gap-3 animate-slide-up"
              style={{ animationDelay: '0.35s' }}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Prodotto</h3>
                <p className="text-xs text-gray-500">Aggiungi nuovo</p>
              </div>
            </Link>
          )}

          {/* + Cantiere - solo admin */}
          {isSuperuser && (
            <Link
              href="/cantieri/nuovo"
              className="action-card flex items-center gap-3 animate-slide-up"
              style={{ animationDelay: '0.4s' }}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Cantiere</h3>
                <p className="text-xs text-gray-500">Aggiungi nuovo</p>
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* Macchinari Widget */}
      <div className="px-5 mt-6 max-w-4xl mx-auto animate-slide-up" style={{ animationDelay: '0.42s' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-sky-600" />
            <h2 className="text-sm font-semibold text-gray-900">Parco Macchinari</h2>
          </div>
          <Link href="/macchinari" className="text-xs text-sky-600 font-medium">
            Vedi tutti
          </Link>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Value + count header */}
          <div className="p-4 flex items-center justify-between border-b border-gray-100">
            <div>
              <p className="text-xs text-gray-500">Valore Totale</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats?.machinesValue || 0)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">{stats?.machinesCount || 0} attivi</p>
              {(stats?.machinesWarningCount || 0) > 0 && (
                <p className="text-xs text-amber-500 flex items-center gap-1 justify-end mt-0.5">
                  <ShieldAlert className="w-3 h-3" />
                  {stats?.machinesWarningCount} garanzia
                </p>
              )}
            </div>
          </div>
          {/* Quick list of machines */}
          {machines.length > 0 ? (
            <>
              {machines.slice(0, 3).map((m, index) => {
                const warranty = (() => {
                  if (!m.purchase_date || !m.warranty_months) return null
                  const end = new Date(m.purchase_date)
                  end.setMonth(end.getMonth() + m.warranty_months)
                  const days = Math.ceil((end.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                  if (days < 0) return 'expired'
                  if (days <= 90) return 'expiring'
                  return 'active'
                })()
                return (
                  <Link
                    key={m.id}
                    href={`/macchinari/${m.id}`}
                    className={`flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors ${
                      index !== Math.min(machines.length, 3) - 1 ? 'border-b border-gray-100' : ''
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center flex-shrink-0">
                      <Wrench className="w-4 h-4 text-sky-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{m.name}</p>
                      <p className="text-xs text-gray-400">{m.code}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-gray-700">{formatCurrency(m.purchase_cost)}</p>
                      {warranty && (
                        <span className={`text-xs ${
                          warranty === 'expired' ? 'text-red-500' :
                          warranty === 'expiring' ? 'text-amber-500' : 'text-emerald-500'
                        }`}>
                          {warranty === 'expired' ? '⚠ Scaduta' :
                           warranty === 'expiring' ? '⚠ In scadenza' : '✓ Garanzia'}
                        </span>
                      )}
                    </div>
                  </Link>
                )
              })}
            </>
          ) : (
            <div className="p-4 text-center text-gray-400 text-sm">
              Nessun macchinario registrato
            </div>
          )}
          {/* Add button */}
          {isSuperuser && (
            <Link
              href="/macchinari/nuovo"
              className="flex items-center justify-center gap-2 p-3 text-sky-600 text-sm font-medium hover:bg-sky-50 transition-colors border-t border-gray-100"
            >
              <Plus className="w-4 h-4" />
              Aggiungi Macchinario
            </Link>
          )}
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStock.length > 0 && (
        <div className="px-5 mt-6 max-w-4xl mx-auto animate-slide-up" style={{ animationDelay: '0.45s' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <h2 className="text-sm font-semibold text-gray-900">Scorte Basse</h2>
            </div>
            <Link href="/prodotti?filter=low" className="text-xs text-sky-600 font-medium">
              Vedi tutti
            </Link>
          </div>
          <div className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden">
            {lowStock.map((item, index) => (
              <Link
                key={item.id}
                href={`/prodotti/${item.id}`}
                className={`flex items-center gap-3 p-3 hover:bg-red-50 transition-colors ${
                  index !== lowStock.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{item.name}</p>
                  <p className="text-xs text-gray-500">
                    {formatNumber(item.current_stock)} / {formatNumber(item.min_stock)} {item.unit}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {stats?.recentMovements && stats.recentMovements.length > 0 && (
        <div className="px-5 mt-6 mb-6 max-w-4xl mx-auto animate-slide-up" style={{ animationDelay: '0.5s' }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900">Attività Recente</h2>
            <Link href="/movimenti" className="text-xs text-sky-600 font-medium">
              Storico
            </Link>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {stats.recentMovements.map((mov, index) => (
              <div
                key={mov.id}
                className={`flex items-center gap-3 p-3 ${
                  index !== stats.recentMovements.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  mov.type === 'carico' ? 'bg-emerald-100' : 'bg-orange-100'
                }`}>
                  {mov.type === 'carico' ? (
                    <ArrowDownToLine className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <ArrowUpFromLine className="w-4 h-4 text-orange-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{mov.product_name}</p>
                  <p className="text-xs text-gray-500">
                    {mov.type === 'carico' ? '+' : '-'}{mov.quantity}
                    {mov.worksite_name && ` • ${mov.worksite_name}`}
                    {mov.operator_name && ` • ${mov.operator_name}`}
                  </p>
                </div>
                <span className="text-xs text-gray-400">{formatTimeAgo(mov.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admin-only: Reports link */}
      {isSuperuser && (
        <div className="px-5 mb-6 max-w-4xl mx-auto animate-slide-up" style={{ animationDelay: '0.55s' }}>
          <Link
            href="/report"
            className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl shadow-lg"
          >
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white">Report & Analytics</h3>
              <p className="text-sm text-gray-400">Esporta dati in Excel</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </Link>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
