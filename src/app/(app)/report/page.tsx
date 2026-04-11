'use client'

import { useState, useEffect, Suspense, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/auth-provider'
import { formatCurrency, cn } from '@/lib/utils'
import {
  FileSpreadsheet,
  Download,
  Package,
  Building2,
  ClipboardList,
  AlertTriangle,
  Loader2,
  ShieldAlert,
  ChevronLeft,
  Calendar,
  Filter,
  TrendingUp,
  TrendingDown,
  Euro,
  X,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react'
import Link from 'next/link'
import * as XLSX from 'xlsx'

interface Supplier {
  id: string
  code: string
  name: string
}

interface WorksiteOption {
  id: string
  code: string
  name: string
}

interface MonthStats {
  inbound: number
  outbound: number
  movements: number
}

interface TopProduct {
  name: string
  quantity: number
  cost: number
}

interface TopWorksite {
  code: string
  name: string
  cost: number
  movements: number
}

interface LowStockItem {
  id: string
  barcode: string
  name: string
  category: string
  current_stock: number
  min_stock: number
  unit_cost: number
  supplier_name: string
}

function ReportContent() {
  const [loading, setLoading] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date()
    d.setDate(1)
    return d.toISOString().split('T')[0]
  })
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0])
  const [selectedSupplier, setSelectedSupplier] = useState<string>('')
  const [selectedWorksite, setSelectedWorksite] = useState<string>('')
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [worksites, setWorksites] = useState<WorksiteOption[]>([])

  // Dashboard data
  const [currentMonth, setCurrentMonth] = useState<MonthStats | null>(null)
  const [prevMonth, setPrevMonth] = useState<MonthStats | null>(null)
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [topWorksites, setTopWorksites] = useState<TopWorksite[]>([])
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([])
  const [totalProducts, setTotalProducts] = useState(0)
  const [totalValue, setTotalValue] = useState(0)
  const [dashLoading, setDashLoading] = useState(true)

  const supabase = createClient()
  const { isSuperuser, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const fromImpostazioni = searchParams.get('from') === 'impostazioni'
  const backUrl = fromImpostazioni ? '/impostazioni' : '/'

  // Load filters
  useEffect(() => {
    const loadFilters = async () => {
      const [suppliersRes, worksitesRes] = await Promise.all([
        supabase.from('suppliers').select('id, code, name').order('name'),
        supabase.from('worksites').select('id, code, name').eq('status', 'active').order('name')
      ])
      if (suppliersRes.data) setSuppliers(suppliersRes.data)
      if (worksitesRes.data) setWorksites(worksitesRes.data)
    }
    loadFilters()
  }, [])

  // Load dashboard data
  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    setDashLoading(true)
    try {
      const now = new Date()
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

      // Parallel queries
      const [
        currentMovRes,
        prevMovRes,
        topProdRes,
        topWsRes,
        productsRes,
        lowStockRes
      ] = await Promise.all([
        // Current month movements
        supabase.from('movements')
          .select('type, total_cost')
          .gte('created_at', currentMonthStart.toISOString())
          .neq('is_reversed', true)
          .is('reversal_of_id', null),
        // Previous month movements
        supabase.from('movements')
          .select('type, total_cost')
          .gte('created_at', prevMonthStart.toISOString())
          .lte('created_at', prevMonthEnd.toISOString())
          .neq('is_reversed', true)
          .is('reversal_of_id', null),
        // Top products (current month scarichi)
        supabase.from('movements')
          .select('quantity, total_cost, product:products(name)')
          .eq('type', 'scarico')
          .gte('created_at', currentMonthStart.toISOString())
          .neq('is_reversed', true)
          .is('reversal_of_id', null),
        // Top worksites (current month scarichi)
        supabase.from('movements')
          .select('total_cost, worksite:worksites(code, name)')
          .eq('type', 'scarico')
          .gte('created_at', currentMonthStart.toISOString())
          .neq('is_reversed', true)
          .is('reversal_of_id', null),
        // All products for totals
        supabase.from('products')
          .select('current_stock, unit_cost, min_stock')
          .eq('is_active', true),
        // Low stock products
        supabase.from('products')
          .select('id, barcode, name, category, current_stock, min_stock, unit_cost, supplier:suppliers(name)')
          .eq('is_active', true)
          .order('name')
      ])

      // Current month stats
      if (currentMovRes.data) {
        const movs = currentMovRes.data as { type: string; total_cost: number | null }[]
        setCurrentMonth({
          inbound: movs.filter(m => m.type === 'carico').reduce((s, m) => s + (m.total_cost || 0), 0),
          outbound: movs.filter(m => m.type === 'scarico').reduce((s, m) => s + (m.total_cost || 0), 0),
          movements: movs.length
        })
      }

      // Previous month stats
      if (prevMovRes.data) {
        const movs = prevMovRes.data as { type: string; total_cost: number | null }[]
        setPrevMonth({
          inbound: movs.filter(m => m.type === 'carico').reduce((s, m) => s + (m.total_cost || 0), 0),
          outbound: movs.filter(m => m.type === 'scarico').reduce((s, m) => s + (m.total_cost || 0), 0),
          movements: movs.length
        })
      }

      // Top products aggregation
      if (topProdRes.data) {
        const byProduct: Record<string, TopProduct> = {}
        topProdRes.data.forEach((m: any) => {
          const name = m.product?.name || 'Sconosciuto'
          if (!byProduct[name]) byProduct[name] = { name, quantity: 0, cost: 0 }
          byProduct[name].quantity += m.quantity || 0
          byProduct[name].cost += m.total_cost || 0
        })
        setTopProducts(
          Object.values(byProduct).sort((a, b) => b.cost - a.cost).slice(0, 10)
        )
      }

      // Top worksites aggregation
      if (topWsRes.data) {
        const byWs: Record<string, TopWorksite> = {}
        topWsRes.data.forEach((m: any) => {
          const ws = m.worksite
          if (!ws) return
          const key = ws.code
          if (!byWs[key]) byWs[key] = { code: ws.code, name: ws.name, cost: 0, movements: 0 }
          byWs[key].cost += m.total_cost || 0
          byWs[key].movements++
        })
        setTopWorksites(
          Object.values(byWs).sort((a, b) => b.cost - a.cost).slice(0, 10)
        )
      }

      // Product totals
      if (productsRes.data) {
        const prods = productsRes.data as { current_stock: number; unit_cost: number; min_stock: number }[]
        setTotalProducts(prods.length)
        setTotalValue(prods.reduce((s, p) => s + p.current_stock * p.unit_cost, 0))
      }

      // Low stock
      if (lowStockRes.data) {
        const low = lowStockRes.data
          .filter((p: any) => p.current_stock <= p.min_stock)
          .map((p: any) => ({
            id: p.id,
            barcode: p.barcode || '',
            name: p.name,
            category: p.category,
            current_stock: p.current_stock,
            min_stock: p.min_stock,
            unit_cost: p.unit_cost,
            supplier_name: p.supplier?.name || '-'
          }))
        setLowStockItems(low)
      }
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setDashLoading(false)
    }
  }

  // Redirect non-superusers
  useEffect(() => {
    if (!authLoading && !isSuperuser) {
      router.replace('/')
    }
  }, [isSuperuser, authLoading, router])

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    )
  }

  if (!isSuperuser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Accesso Negato</h1>
        <p className="text-gray-500 mb-4">Non hai i permessi per accedere ai report.</p>
        <button onClick={() => router.push('/')} className="px-4 py-2 bg-blue-600 text-white rounded-xl font-medium">
          Torna alla Home
        </button>
      </div>
    )
  }

  // Trend helpers
  const getTrend = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return Math.round(((current - previous) / previous) * 100)
  }

  const TrendBadge = ({ current, previous, invertColor = false }: { current: number; previous: number; invertColor?: boolean }) => {
    const pct = getTrend(current, previous)
    if (pct === 0) return <span className="flex items-center gap-0.5 text-xs text-gray-400"><Minus className="w-3 h-3" /> 0%</span>
    const isUp = pct > 0
    const color = invertColor
      ? (isUp ? 'text-red-500' : 'text-emerald-500')
      : (isUp ? 'text-emerald-500' : 'text-red-500')
    return (
      <span className={cn('flex items-center gap-0.5 text-xs font-medium', color)}>
        {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
        {Math.abs(pct)}%
      </span>
    )
  }

  // Excel export functions (kept from original)
  const getDateTimeString = () => {
    const now = new Date()
    return `${now.toISOString().split('T')[0]}_${now.toTimeString().slice(0, 5).replace(':', '-')}`
  }

  const headerStyle = {
    font: { bold: true, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '2563EB' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: { top: { style: 'thin', color: { rgb: '1E40AF' } }, bottom: { style: 'thin', color: { rgb: '1E40AF' } }, left: { style: 'thin', color: { rgb: '1E40AF' } }, right: { style: 'thin', color: { rgb: '1E40AF' } } }
  }

  const cellBorder = { top: { style: 'thin', color: { rgb: 'E5E7EB' } }, bottom: { style: 'thin', color: { rgb: 'E5E7EB' } }, left: { style: 'thin', color: { rgb: 'E5E7EB' } }, right: { style: 'thin', color: { rgb: 'E5E7EB' } } }

  const downloadExcel = (data: any[], filename: string, conditionalColumn?: string) => {
    if (data.length === 0) { alert('Nessun dato da esportare'); return }
    const ws = XLSX.utils.json_to_sheet(data)
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
    const headers = Object.keys(data[0] || {})
    ws['!cols'] = headers.map((header) => {
      let maxWidth = header.length
      data.forEach(row => { maxWidth = Math.max(maxWidth, String(row[header] || '').length) })
      return { wch: Math.min(maxWidth + 2, 50) }
    })
    for (let col = 0; col <= range.e.c; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: col })
      if (ws[cellRef]) ws[cellRef].s = headerStyle
    }
    for (let row = 1; row <= range.e.r; row++) {
      for (let col = 0; col <= range.e.c; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: col })
        if (ws[cellRef]) {
          const cellStyle: any = { border: cellBorder, alignment: { vertical: 'center' } }
          if (row % 2 === 0) cellStyle.fill = { fgColor: { rgb: 'F9FAFB' } }
          if (conditionalColumn) {
            const colIndex = headers.indexOf(conditionalColumn)
            if (col === colIndex) {
              const v = ws[cellRef].v
              if (v === 'RIORDINO' || v === 'SCARICO') { cellStyle.fill = { fgColor: { rgb: 'FEE2E2' } }; cellStyle.font = { color: { rgb: 'DC2626' }, bold: true } }
              else if (v === 'OK' || v === 'CARICO') { cellStyle.fill = { fgColor: { rgb: 'DCFCE7' } }; cellStyle.font = { color: { rgb: '16A34A' }, bold: true } }
            }
          }
          const h = headers[col]
          if (h && (h.includes('€') || h.includes('Qtà') || h.includes('Quantità') || h === 'Giacenza' || h === 'Scorta Min.' || h === 'Da Ordinare' || h === 'N. Movimenti'))
            cellStyle.alignment = { horizontal: 'right', vertical: 'center' }
          ws[cellRef].s = cellStyle
        }
      }
    }
    ws['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: 'A2', activePane: 'bottomLeft', state: 'frozen' }
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Dati')
    XLSX.writeFile(wb, `${filename}_${getDateTimeString()}.xlsx`)
  }

  const exportInventario = async () => {
    setLoading('inventario')
    try {
      let query = supabase.from('products').select('barcode, name, category, unit, quantity_per_package, unit_cost, current_stock, min_stock, supplier_id, suppliers(name)').eq('is_active', true)
      if (selectedSupplier) query = query.eq('supplier_id', selectedSupplier)
      const { data } = await query.order('category').order('name')
      if (data) {
        downloadExcel(data.map((p: any) => ({
          'Barcode': p.barcode || '', 'Nome': p.name, 'Categoria': p.category, 'Fornitore': p.suppliers?.name || '-',
          'Unità': p.unit, 'Qtà Conf.': p.quantity_per_package, 'Costo €': p.unit_cost?.toFixed(2) || '0.00',
          'Giacenza': p.current_stock, 'Scorta Min.': p.min_stock, 'Valore €': (p.current_stock * p.unit_cost).toFixed(2),
          'Stato': p.current_stock <= p.min_stock ? 'RIORDINO' : 'OK'
        })), selectedSupplier ? `inventario_${suppliers.find(s => s.id === selectedSupplier)?.code || 'fornitore'}` : 'inventario', 'Stato')
      }
    } catch { alert('Errore durante l\'export') } finally { setLoading(null) }
  }

  const exportCostiCantieri = async () => {
    setLoading('cantieri')
    try {
      const fromDate = new Date(dateFrom); fromDate.setHours(0, 0, 0, 0)
      const toDate = new Date(dateTo); toDate.setHours(23, 59, 59, 999)
      let query = supabase.from('movements').select('quantity, total_cost, product:products(name), worksite:worksites(code, name, address, city)')
        .eq('type', 'scarico').neq('is_reversed', true).is('reversal_of_id', null)
        .gte('created_at', fromDate.toISOString()).lte('created_at', toDate.toISOString())
      if (selectedWorksite) query = query.eq('worksite_id', selectedWorksite)
      const { data: movements } = await query
      if (movements) {
        const byWs = movements.reduce((acc: Record<string, any>, m: any) => {
          const ws = m.worksite; if (!ws) return acc
          if (!acc[ws.code]) acc[ws.code] = { 'Codice': ws.code, 'Cantiere': ws.name, 'Indirizzo': `${ws.address || ''}, ${ws.city || ''}`.replace(/^,\s*|,\s*$/g, ''), 'Totale €': 0, 'N. Movimenti': 0 }
          acc[ws.code]['Totale €'] += m.total_cost || 0; acc[ws.code]['N. Movimenti']++
          return acc
        }, {})
        downloadExcel(Object.values(byWs).map((w: any) => ({ ...w, 'Totale €': w['Totale €'].toFixed(2) })), `costi_cantieri_${dateFrom}_${dateTo}`)
      }
    } catch { alert('Errore durante l\'export') } finally { setLoading(null) }
  }

  const exportMovimenti = async () => {
    setLoading('movimenti')
    try {
      const fromDate = new Date(dateFrom); fromDate.setHours(0, 0, 0, 0)
      const toDate = new Date(dateTo); toDate.setHours(23, 59, 59, 999)
      let query = supabase.from('movements').select('type, quantity, unit_cost_at_time, total_cost, created_at, product:products(name), worksite:worksites(code, name), operator:profiles(full_name)')
        .gte('created_at', fromDate.toISOString()).lte('created_at', toDate.toISOString())
      if (selectedWorksite) query = query.eq('worksite_id', selectedWorksite)
      const { data } = await query.order('created_at', { ascending: false })
      if (data) {
        downloadExcel(data.map((m: any) => ({
          'Data': new Date(m.created_at).toLocaleString('it-IT'), 'Tipo': m.type === 'carico' ? 'CARICO' : 'SCARICO',
          'Prodotto': m.product?.name || '', 'Quantità': m.quantity, 'Costo Unit. €': m.unit_cost_at_time?.toFixed(2) || '0.00',
          'Totale €': m.total_cost?.toFixed(2) || '0.00',
          'Cantiere': m.worksite ? `${m.worksite.code} - ${m.worksite.name}` : '', 'Operatore': m.operator?.full_name || ''
        })), `movimenti_${dateFrom}_${dateTo}`, 'Tipo')
      }
    } catch { alert('Errore durante l\'export') } finally { setLoading(null) }
  }

  const exportScorteBasse = async () => {
    setLoading('scorte')
    try {
      let query = supabase.from('products').select('barcode, name, category, current_stock, min_stock, unit_cost, supplier_id, suppliers(name, code)').eq('is_active', true)
      if (selectedSupplier) query = query.eq('supplier_id', selectedSupplier)
      const { data } = await query
      const low = (data || []).filter((p: any) => p.current_stock <= p.min_stock)
      if (low.length > 0) {
        downloadExcel(low.map((p: any) => ({
          'Barcode': p.barcode || '', 'Nome': p.name, 'Categoria': p.category, 'Fornitore': p.suppliers?.name || '-',
          'Cod. Fornitore': p.suppliers?.code || '-', 'Giacenza': p.current_stock, 'Scorta Min.': p.min_stock,
          'Da Ordinare': Math.max(0, p.min_stock * 2 - p.current_stock),
          'Costo Unit. €': p.unit_cost?.toFixed(2) || '0.00',
          'Valore Ordine €': (Math.max(0, p.min_stock * 2 - p.current_stock) * p.unit_cost).toFixed(2)
        })), selectedSupplier ? `scorte_basse_${suppliers.find(s => s.id === selectedSupplier)?.code || 'fornitore'}` : 'scorte_basse')
      } else { alert('Nessun prodotto sotto scorta minima') }
    } catch { alert('Errore durante l\'export') } finally { setLoading(null) }
  }

  const quickDateRanges = [
    { label: 'Oggi', getValue: () => { const t = new Date().toISOString().split('T')[0]; return { from: t, to: t } } },
    { label: 'Ultima settimana', getValue: () => { const to = new Date(); const from = new Date(); from.setDate(from.getDate() - 7); return { from: from.toISOString().split('T')[0], to: to.toISOString().split('T')[0] } } },
    { label: 'Questo mese', getValue: () => { const now = new Date(); return { from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0], to: now.toISOString().split('T')[0] } } },
    { label: 'Mese scorso', getValue: () => { const now = new Date(); return { from: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0], to: new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0] } } },
    { label: 'Quest\'anno', getValue: () => { const now = new Date(); return { from: new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0], to: now.toISOString().split('T')[0] } } }
  ]

  const monthName = new Date().toLocaleString('it-IT', { month: 'long' })
  const prevMonthName = new Date(new Date().setMonth(new Date().getMonth() - 1)).toLocaleString('it-IT', { month: 'long' })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white px-4 pt-12 pb-6 rounded-b-3xl">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Link href={backUrl} className="p-2 -ml-2 hover:bg-white/10 rounded-xl transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <FileSpreadsheet className="w-6 h-6" />
            <div>
              <h1 className="text-xl font-bold">Report</h1>
              <p className="text-blue-100 text-sm">{totalProducts} prodotti &middot; Valore {formatCurrency(totalValue)}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 -mt-4 pb-24 space-y-4">

        {/* === PANORAMICA MESE === */}
        {dashLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 animate-pulse">
                <div className="h-3 bg-gray-200 rounded w-16 mb-3" />
                <div className="h-6 bg-gray-200 rounded w-20" />
              </div>
            ))}
          </div>
        ) : currentMonth && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500 font-medium">Carichi</span>
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(currentMonth.inbound)}</p>
                {prevMonth && <TrendBadge current={currentMonth.inbound} previous={prevMonth.inbound} />}
                <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${currentMonth.inbound + currentMonth.outbound > 0 ? (currentMonth.inbound / (currentMonth.inbound + currentMonth.outbound)) * 100 : 50}%` }} />
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500 font-medium">Scarichi</span>
                  <TrendingDown className="w-4 h-4 text-orange-400" />
                </div>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(currentMonth.outbound)}</p>
                {prevMonth && <TrendBadge current={currentMonth.outbound} previous={prevMonth.outbound} invertColor />}
                <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-400 rounded-full" style={{ width: `${currentMonth.inbound + currentMonth.outbound > 0 ? (currentMonth.outbound / (currentMonth.inbound + currentMonth.outbound)) * 100 : 50}%` }} />
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500 font-medium">Movimenti</span>
                  <ClipboardList className="w-4 h-4 text-blue-400" />
                </div>
                <p className="text-xl font-bold text-gray-900">{currentMonth.movements}</p>
                {prevMonth && <TrendBadge current={currentMonth.movements} previous={prevMonth.movements} />}
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500 font-medium">Sotto scorta</span>
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                </div>
                <p className={cn('text-xl font-bold', lowStockItems.length > 0 ? 'text-red-500' : 'text-gray-900')}>
                  {lowStockItems.length}
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-400 text-center capitalize">
              {monthName} vs {prevMonthName}
            </p>
          </>
        )}

        {/* === TOP 10 PRODOTTI === */}
        {topProducts.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-500" />
                Top prodotti del mese
              </h3>
            </div>
            <div className="divide-y divide-gray-50">
              {topProducts.map((p, i) => {
                const maxCost = topProducts[0].cost
                const pct = maxCost > 0 ? (p.cost / maxCost) * 100 : 0
                return (
                  <div key={p.name} className="px-4 py-3 flex items-center gap-3">
                    <span className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                      i === 0 ? 'bg-blue-500 text-white' : i < 3 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                    )}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                      <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <p className="text-sm font-bold text-gray-900">{formatCurrency(p.cost)}</p>
                      <p className="text-xs text-gray-400">{p.quantity} pz</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* === TOP 10 CANTIERI === */}
        {topWorksites.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-violet-500" />
                Top cantieri del mese
              </h3>
            </div>
            <div className="divide-y divide-gray-50">
              {topWorksites.map((ws, i) => {
                const maxCost = topWorksites[0].cost
                const pct = maxCost > 0 ? (ws.cost / maxCost) * 100 : 0
                return (
                  <div key={ws.code} className="px-4 py-3 flex items-center gap-3">
                    <span className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                      i === 0 ? 'bg-violet-500 text-white' : i < 3 ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-500'
                    )}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{ws.name}</p>
                      <p className="text-xs text-gray-400 font-mono">{ws.code}</p>
                      <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-violet-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <p className="text-sm font-bold text-gray-900">{formatCurrency(ws.cost)}</p>
                      <p className="text-xs text-gray-400">{ws.movements} mov</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* === SCORTE BASSE === */}
        {lowStockItems.length > 0 && (
          <div className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-red-100 bg-red-50/50">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                Prodotti da riordinare
                <span className="ml-auto bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">{lowStockItems.length}</span>
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-4 py-2 text-xs font-medium text-gray-500">Prodotto</th>
                    <th className="px-3 py-2 text-xs font-medium text-gray-500 text-right">Giacenza</th>
                    <th className="px-3 py-2 text-xs font-medium text-gray-500 text-right">Min</th>
                    <th className="px-3 py-2 text-xs font-medium text-gray-500 text-right">Da ordinare</th>
                    <th className="px-4 py-2 text-xs font-medium text-gray-500 text-right">Costo stim.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {lowStockItems.map(item => {
                    const toOrder = Math.max(0, item.min_stock * 2 - item.current_stock)
                    const orderCost = toOrder * item.unit_cost
                    const urgency = item.current_stock === 0 ? 'bg-red-50' : item.current_stock < item.min_stock * 0.5 ? 'bg-orange-50' : ''
                    return (
                      <tr key={item.id} className={urgency}>
                        <td className="px-4 py-2.5">
                          <Link href={`/prodotti/${item.id}`} className="hover:text-blue-600 transition-colors">
                            <p className="font-medium text-gray-900 truncate max-w-[200px]">{item.name}</p>
                            <p className="text-xs text-gray-400">{item.supplier_name}</p>
                          </Link>
                        </td>
                        <td className={cn('px-3 py-2.5 text-right font-bold', item.current_stock === 0 ? 'text-red-600' : 'text-orange-600')}>
                          {item.current_stock}
                        </td>
                        <td className="px-3 py-2.5 text-right text-gray-500">{item.min_stock}</td>
                        <td className="px-3 py-2.5 text-right font-semibold text-gray-900">{toOrder}</td>
                        <td className="px-4 py-2.5 text-right text-gray-700">{formatCurrency(orderCost)}</td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 font-semibold">
                    <td className="px-4 py-2.5 text-gray-700" colSpan={3}>Totale ordine stimato</td>
                    <td className="px-3 py-2.5 text-right text-gray-900">
                      {lowStockItems.reduce((s, i) => s + Math.max(0, i.min_stock * 2 - i.current_stock), 0)} pz
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-900">
                      {formatCurrency(lowStockItems.reduce((s, i) => s + Math.max(0, i.min_stock * 2 - i.current_stock) * i.unit_cost, 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* === EXPORT EXCEL === */}
        <div className="pt-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-between w-full bg-white rounded-2xl border border-gray-200 shadow-sm p-4 transition-all hover:border-blue-300"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Filter className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-900">Filtri Export</h3>
                <p className="text-sm text-gray-500">
                  {dateFrom === dateTo
                    ? new Date(dateFrom).toLocaleDateString('it-IT')
                    : `${new Date(dateFrom).toLocaleDateString('it-IT')} - ${new Date(dateTo).toLocaleDateString('it-IT')}`}
                  {selectedSupplier && ` · ${suppliers.find(s => s.id === selectedSupplier)?.name}`}
                  {selectedWorksite && ` · ${worksites.find(w => w.id === selectedWorksite)?.name}`}
                </p>
              </div>
            </div>
            <ChevronDown className={cn('w-5 h-5 text-gray-400 transition-transform', showFilters && 'rotate-180')} />
          </button>

          {showFilters && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 mt-3 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Periodo rapido</label>
                <div className="flex flex-wrap gap-2">
                  {quickDateRanges.map(range => (
                    <button key={range.label} onClick={() => { const { from, to } = range.getValue(); setDateFrom(from); setDateTo(to) }}
                      className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-blue-100 hover:text-blue-700 rounded-lg transition-colors">
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1"><Calendar className="w-4 h-4 inline mr-1" />Da</label>
                  <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1"><Calendar className="w-4 h-4 inline mr-1" />A</label>
                  <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fornitore</label>
                <select value={selectedSupplier} onChange={(e) => setSelectedSupplier(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl">
                  <option value="">Tutti i fornitori</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.code} - {s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cantiere</label>
                <select value={selectedWorksite} onChange={(e) => setSelectedWorksite(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl">
                  <option value="">Tutti i cantieri</option>
                  {worksites.map(w => <option key={w.id} value={w.id}>{w.code} - {w.name}</option>)}
                </select>
              </div>
              {(selectedSupplier || selectedWorksite) && (
                <button onClick={() => { setSelectedSupplier(''); setSelectedWorksite('') }} className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700">
                  <X className="w-4 h-4" /> Rimuovi filtri
                </button>
              )}
            </div>
          )}

          {/* Export buttons */}
          <div className="grid grid-cols-2 gap-3 mt-3">
            {[
              { id: 'inventario', label: 'Inventario', icon: Package, color: 'blue', action: exportInventario },
              { id: 'cantieri', label: 'Costi Cantieri', icon: Building2, color: 'violet', action: exportCostiCantieri },
              { id: 'movimenti', label: 'Movimenti', icon: ClipboardList, color: 'emerald', action: exportMovimenti },
              { id: 'scorte', label: 'Scorte Basse', icon: AlertTriangle, color: 'amber', action: exportScorteBasse },
            ].map(report => (
              <button
                key={report.id}
                onClick={report.action}
                disabled={loading !== null}
                className={cn(
                  'flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 shadow-sm transition-all hover:shadow-md text-left',
                  loading === report.id && 'opacity-70'
                )}
              >
                <div className={`w-9 h-9 bg-${report.color}-100 rounded-lg flex items-center justify-center shrink-0`}>
                  {loading === report.id
                    ? <Loader2 className={`w-4 h-4 text-${report.color}-600 animate-spin`} />
                    : <Download className={`w-4 h-4 text-${report.color}-600`} />
                  }
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">{report.label}</p>
                  <p className="text-xs text-gray-400">Excel</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ReportPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    }>
      <ReportContent />
    </Suspense>
  )
}
