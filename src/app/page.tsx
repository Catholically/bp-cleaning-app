'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/providers/auth-provider'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { BottomNav } from '@/components/navigation/bottom-nav'
import {
  Package,
  TrendingDown,
  Building2,
  ArrowDownToLine,
  ArrowUpFromLine,
  ChevronRight,
  AlertTriangle,
  Sparkles
} from 'lucide-react'
import Link from 'next/link'

interface DashboardStats {
  totalProducts: number
  totalStockValue: number
  lowStockCount: number
  activeWorksites: number
  todayMovements: number
  monthlySpend: number
}

interface LowStockItem {
  id: string
  name: string
  current_stock: number
  min_stock: number
  unit: string
}

export default function HomePage() {
  const { profile } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [lowStock, setLowStock] = useState<LowStockItem[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch products stats
      const { data: products } = await supabase
        .from('products')
        .select('current_stock, unit_cost, min_stock, name, unit, id')
        .eq('is_active', true)

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

      const totalStockValue = products?.reduce(
        (sum: number, p: any) => sum + (p.current_stock * p.unit_cost), 0
      ) || 0

      const lowStockItems = products?.filter(
        (p: any) => p.current_stock <= p.min_stock
      ) || []

      const monthlySpend = monthlyMovements?.reduce(
        (sum: number, m: any) => sum + (m.total_cost || 0), 0
      ) || 0

      setStats({
        totalProducts: products?.length || 0,
        totalStockValue,
        lowStockCount: lowStockItems.length,
        activeWorksites: worksitesCount || 0,
        todayMovements: movementsCount || 0,
        monthlySpend
      })

      setLowStock(lowStockItems.slice(0, 5).map((p: any) => ({
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="min-h-screen">
        {/* Header */}
        <header className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white px-4 pt-12 pb-6 rounded-b-3xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold">BP Cleaning</h1>
              <p className="text-blue-100 text-sm">Gestione Magazzino</p>
            </div>
          </div>

          <p className="text-blue-100">
            {greeting()}, <span className="text-white font-semibold">{profile?.full_name?.split(' ')[0]}</span>
          </p>
        </header>

        {/* Stats Cards */}
        <div className="px-4 -mt-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="stat-card animate-slide-up">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 font-medium">Valore Stock</span>
                <Package className="w-5 h-5 text-blue-500" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{formatCurrency(stats?.totalStockValue || 0)}</span>
            </div>

            <div className="stat-card animate-slide-up" style={{ animationDelay: '0.05s' }}>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 font-medium">Da Riordinare</span>
                <TrendingDown className="w-5 h-5 text-red-500" />
              </div>
              <span className="stat-value text-red-500">{stats?.lowStockCount || 0}</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="px-4 mt-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Azioni Rapide
          </h2>
          <div className="space-y-3">
            <Link href="/movimenti/carico" className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm transition-all duration-200 hover:shadow-md hover:border-gray-200 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-emerald-100">
                <ArrowDownToLine className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Carico Merce</h3>
                <p className="text-sm text-gray-500">Registra arrivo prodotti</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300" />
            </Link>

            <Link href="/movimenti/scarico" className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm transition-all duration-200 hover:shadow-md hover:border-gray-200 animate-slide-up" style={{ animationDelay: '0.15s' }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-orange-100">
                <ArrowUpFromLine className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Scarico per Cantiere</h3>
                <p className="text-sm text-gray-500">Assegna prodotti a cantiere</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300" />
            </Link>

            <Link href="/prodotti" className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm transition-all duration-200 hover:shadow-md hover:border-gray-200 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-blue-100">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Vedi Prodotti</h3>
                <p className="text-sm text-gray-500">Inventario magazzino</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300" />
            </Link>

            <Link href="/cantieri" className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm transition-all duration-200 hover:shadow-md hover:border-gray-200 animate-slide-up" style={{ animationDelay: '0.25s' }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-violet-100">
                <Building2 className="w-6 h-6 text-violet-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Cantieri</h3>
                <p className="text-sm text-gray-500">Gestisci cantieri e costi</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300" />
            </Link>
          </div>
        </div>

        {/* Low Stock Alert */}
        {lowStock.length > 0 && (
          <div className="px-4 mt-6 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                Scorte Basse
              </h2>
              <Link href="/prodotti?filter=low" className="text-sm text-blue-600 font-medium">
                Vedi tutti
              </Link>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {lowStock.map((item, index) => (
                <Link
                  key={item.id}
                  href={`/prodotti/${item.id}`}
                  className={`flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors ${
                    index !== lowStock.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{item.name}</p>
                    <p className="text-sm text-gray-500">
                      {formatNumber(item.current_stock)} / {formatNumber(item.min_stock)} {item.unit}
                    </p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">Riordino</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  )
}
