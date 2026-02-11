'use client'

import { useState, useEffect, Suspense, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/auth-provider'
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
  BarChart3,
  X,
  ChevronDown
} from 'lucide-react'
import Link from 'next/link'
import * as XLSX from 'xlsx'

interface Supplier {
  id: string
  code: string
  name: string
}

interface Worksite {
  id: string
  code: string
  name: string
}

interface Stats {
  totalProducts: number
  lowStockCount: number
  totalValue: number
  monthlyMovements: number
  monthlyInbound: number
  monthlyOutbound: number
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
  const [worksites, setWorksites] = useState<Worksite[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  const supabase = createClient()
  const { isSuperuser, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const fromImpostazioni = searchParams.get('from') === 'impostazioni'
  const backUrl = fromImpostazioni ? '/impostazioni' : '/'

  // Load suppliers and worksites for filters
  useEffect(() => {
    const loadFilters = async () => {
      const [suppliersRes, worksitesRes] = await Promise.all([
        supabase.from('suppliers').select('id, code, name').order('name'),
        supabase.from('worksites').select('id, code, name').eq('is_active', true).order('name')
      ])
      if (suppliersRes.data) setSuppliers(suppliersRes.data)
      if (worksitesRes.data) setWorksites(worksitesRes.data)
    }
    loadFilters()
  }, [])

  // Load statistics
  useEffect(() => {
    const loadStats = async () => {
      setStatsLoading(true)
      try {
        const monthStart = new Date()
        monthStart.setDate(1)
        monthStart.setHours(0, 0, 0, 0)

        const [productsRes, movementsRes] = await Promise.all([
          supabase.from('products').select('current_stock, min_stock, unit_cost').eq('is_active', true),
          supabase.from('movements').select('type, total_cost').gte('created_at', monthStart.toISOString())
        ])

        if (productsRes.data && movementsRes.data) {
          const products = productsRes.data as { current_stock: number; min_stock: number; unit_cost: number }[]
          const movements = movementsRes.data as { type: string; total_cost: number | null }[]

          setStats({
            totalProducts: products.length,
            lowStockCount: products.filter((p) => p.current_stock <= p.min_stock).length,
            totalValue: products.reduce((sum, p) => sum + (p.current_stock * p.unit_cost), 0),
            monthlyMovements: movements.length,
            monthlyInbound: movements.filter((m) => m.type === 'carico').reduce((sum, m) => sum + (m.total_cost || 0), 0),
            monthlyOutbound: movements.filter((m) => m.type === 'scarico').reduce((sum, m) => sum + (m.total_cost || 0), 0)
          })
        }
      } catch (error) {
        console.error('Error loading stats:', error)
      } finally {
        setStatsLoading(false)
      }
    }
    loadStats()
  }, [])

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
        <button
          onClick={() => router.push('/')}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl font-medium"
        >
          Torna alla Home
        </button>
      </div>
    )
  }

  const getDateTimeString = () => {
    const now = new Date()
    const date = now.toISOString().split('T')[0]
    const time = now.toTimeString().slice(0, 5).replace(':', '-')
    return `${date}_${time}`
  }

  const headerStyle = {
    font: { bold: true, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '2563EB' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: '1E40AF' } },
      bottom: { style: 'thin', color: { rgb: '1E40AF' } },
      left: { style: 'thin', color: { rgb: '1E40AF' } },
      right: { style: 'thin', color: { rgb: '1E40AF' } }
    }
  }

  const cellBorder = {
    top: { style: 'thin', color: { rgb: 'E5E7EB' } },
    bottom: { style: 'thin', color: { rgb: 'E5E7EB' } },
    left: { style: 'thin', color: { rgb: 'E5E7EB' } },
    right: { style: 'thin', color: { rgb: 'E5E7EB' } }
  }

  const downloadExcel = (data: any[], filename: string, conditionalColumn?: string) => {
    if (data.length === 0) {
      alert('Nessun dato da esportare')
      return
    }

    const ws = XLSX.utils.json_to_sheet(data)
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
    const headers = Object.keys(data[0] || {})

    // Column widths
    const colWidths: { wch: number }[] = []
    headers.forEach((header, colIndex) => {
      let maxWidth = header.length
      data.forEach(row => {
        const cellValue = String(row[header] || '')
        maxWidth = Math.max(maxWidth, cellValue.length)
      })
      colWidths.push({ wch: Math.min(maxWidth + 2, 50) })
    })
    ws['!cols'] = colWidths

    // Apply styles
    for (let col = 0; col <= range.e.c; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: col })
      if (ws[cellRef]) {
        ws[cellRef].s = headerStyle
      }
    }

    for (let row = 1; row <= range.e.r; row++) {
      for (let col = 0; col <= range.e.c; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: col })
        if (ws[cellRef]) {
          const cellStyle: any = {
            border: cellBorder,
            alignment: { vertical: 'center' }
          }

          if (row % 2 === 0) {
            cellStyle.fill = { fgColor: { rgb: 'F9FAFB' } }
          }

          if (conditionalColumn) {
            const colIndex = headers.indexOf(conditionalColumn)
            if (col === colIndex) {
              const cellValue = ws[cellRef].v
              if (cellValue === 'RIORDINO' || cellValue === 'SCARICO') {
                cellStyle.fill = { fgColor: { rgb: 'FEE2E2' } }
                cellStyle.font = { color: { rgb: 'DC2626' }, bold: true }
              } else if (cellValue === 'OK' || cellValue === 'CARICO') {
                cellStyle.fill = { fgColor: { rgb: 'DCFCE7' } }
                cellStyle.font = { color: { rgb: '16A34A' }, bold: true }
              }
            }
          }

          const header = headers[col]
          if (header && (header.includes('€') || header.includes('Qtà') || header.includes('Quantità') || header === 'Giacenza' || header === 'Scorta Min.' || header === 'Da Ordinare' || header === 'N. Movimenti')) {
            cellStyle.alignment = { horizontal: 'right', vertical: 'center' }
          }

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
      let query = supabase
        .from('products')
        .select('barcode, name, category, unit, quantity_per_package, unit_cost, current_stock, min_stock, supplier_id, suppliers(name)')
        .eq('is_active', true)

      if (selectedSupplier) {
        query = query.eq('supplier_id', selectedSupplier)
      }

      const { data } = await query.order('category').order('name')

      if (data) {
        const formatted = data.map((p: any) => ({
          'Barcode': p.barcode || '',
          'Nome': p.name,
          'Categoria': p.category,
          'Fornitore': p.suppliers?.name || '-',
          'Unità': p.unit,
          'Qtà Conf.': p.quantity_per_package,
          'Costo €': p.unit_cost?.toFixed(2) || '0.00',
          'Giacenza': p.current_stock,
          'Scorta Min.': p.min_stock,
          'Valore €': (p.current_stock * p.unit_cost).toFixed(2),
          'Stato': p.current_stock <= p.min_stock ? 'RIORDINO' : 'OK'
        }))
        downloadExcel(formatted, selectedSupplier ? `inventario_${suppliers.find(s => s.id === selectedSupplier)?.code || 'fornitore'}` : 'inventario', 'Stato')
      }
    } catch (error) {
      console.error(error)
      alert('Errore durante l\'export')
    } finally {
      setLoading(null)
    }
  }

  const exportCostiCantieri = async () => {
    setLoading('cantieri')
    try {
      const fromDate = new Date(dateFrom)
      fromDate.setHours(0, 0, 0, 0)
      const toDate = new Date(dateTo)
      toDate.setHours(23, 59, 59, 999)

      let query = supabase
        .from('movements')
        .select(`
          quantity,
          total_cost,
          product:products(name),
          worksite:worksites(code, name, address, city)
        `)
        .eq('type', 'scarico')
        .gte('created_at', fromDate.toISOString())
        .lte('created_at', toDate.toISOString())

      if (selectedWorksite) {
        query = query.eq('worksite_id', selectedWorksite)
      }

      const { data: movements } = await query

      if (movements) {
        const byWorksite = movements.reduce((acc: Record<string, any>, m: any) => {
          const ws = (m as any).worksite
          if (!ws) return acc
          const key = ws.code
          if (!acc[key]) {
            acc[key] = {
              'Codice': ws.code,
              'Cantiere': ws.name,
              'Indirizzo': `${ws.address || ''}, ${ws.city || ''}`.replace(/^,\s*|,\s*$/g, ''),
              'Totale €': 0,
              'N. Movimenti': 0
            }
          }
          acc[key]['Totale €'] += m.total_cost || 0
          acc[key]['N. Movimenti']++
          return acc
        }, {} as Record<string, any>)

        const formatted = Object.values(byWorksite).map((w: any) => ({
          ...w,
          'Totale €': w['Totale €'].toFixed(2)
        }))

        downloadExcel(formatted, `costi_cantieri_${dateFrom}_${dateTo}`)
      }
    } catch (error) {
      console.error(error)
      alert('Errore durante l\'export')
    } finally {
      setLoading(null)
    }
  }

  const exportMovimenti = async () => {
    setLoading('movimenti')
    try {
      const fromDate = new Date(dateFrom)
      fromDate.setHours(0, 0, 0, 0)
      const toDate = new Date(dateTo)
      toDate.setHours(23, 59, 59, 999)

      let query = supabase
        .from('movements')
        .select(`
          type,
          quantity,
          unit_cost_at_time,
          total_cost,
          created_at,
          product:products(name),
          worksite:worksites(code, name),
          operator:profiles(full_name)
        `)
        .gte('created_at', fromDate.toISOString())
        .lte('created_at', toDate.toISOString())

      if (selectedWorksite) {
        query = query.eq('worksite_id', selectedWorksite)
      }

      const { data } = await query.order('created_at', { ascending: false })

      if (data) {
        const formatted = data.map((m: any) => ({
          'Data': new Date(m.created_at).toLocaleString('it-IT'),
          'Tipo': m.type === 'carico' ? 'CARICO' : 'SCARICO',
          'Prodotto': (m as any).product?.name || '',
          'Quantità': m.quantity,
          'Costo Unit. €': m.unit_cost_at_time?.toFixed(2) || '0.00',
          'Totale €': m.total_cost?.toFixed(2) || '0.00',
          'Cantiere': (m as any).worksite ? `${(m as any).worksite.code} - ${(m as any).worksite.name}` : '',
          'Operatore': (m as any).operator?.full_name || ''
        }))
        downloadExcel(formatted, `movimenti_${dateFrom}_${dateTo}`, 'Tipo')
      }
    } catch (error) {
      console.error(error)
      alert('Errore durante l\'export')
    } finally {
      setLoading(null)
    }
  }

  const exportScorteBasse = async () => {
    setLoading('scorte')
    try {
      let query = supabase
        .from('products')
        .select('barcode, name, category, current_stock, min_stock, unit_cost, supplier_id, suppliers(name, code)')
        .eq('is_active', true)

      if (selectedSupplier) {
        query = query.eq('supplier_id', selectedSupplier)
      }

      const { data: allProducts } = await query

      const lowStock = (allProducts || []).filter((p: any) => p.current_stock <= p.min_stock)

      if (lowStock.length > 0) {
        const formatted = lowStock.map((p: any) => ({
          'Barcode': p.barcode || '',
          'Nome': p.name,
          'Categoria': p.category,
          'Fornitore': p.suppliers?.name || '-',
          'Cod. Fornitore': p.suppliers?.code || '-',
          'Giacenza': p.current_stock,
          'Scorta Min.': p.min_stock,
          'Da Ordinare': Math.max(0, p.min_stock * 2 - p.current_stock),
          'Costo Unit. €': p.unit_cost?.toFixed(2) || '0.00',
          'Valore Ordine €': (Math.max(0, p.min_stock * 2 - p.current_stock) * p.unit_cost).toFixed(2)
        }))
        downloadExcel(formatted, selectedSupplier ? `scorte_basse_${suppliers.find(s => s.id === selectedSupplier)?.code || 'fornitore'}` : 'scorte_basse')
      } else {
        alert('Nessun prodotto sotto scorta minima')
      }
    } catch (error) {
      console.error(error)
      alert('Errore durante l\'export')
    } finally {
      setLoading(null)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value)
  }

  const reports = [
    {
      id: 'inventario',
      title: 'Inventario Completo',
      description: 'Tutti i prodotti con giacenze e valori',
      icon: Package,
      gradient: 'from-blue-500 to-blue-600',
      bgLight: 'bg-blue-50',
      textColor: 'text-blue-600',
      borderColor: 'border-blue-200',
      action: exportInventario,
      filters: ['supplier']
    },
    {
      id: 'cantieri',
      title: 'Costi per Cantiere',
      description: 'Spese prodotti per ogni cantiere',
      icon: Building2,
      gradient: 'from-violet-500 to-violet-600',
      bgLight: 'bg-violet-50',
      textColor: 'text-violet-600',
      borderColor: 'border-violet-200',
      action: exportCostiCantieri,
      filters: ['date', 'worksite']
    },
    {
      id: 'movimenti',
      title: 'Storico Movimenti',
      description: 'Tutti i carichi e scarichi',
      icon: ClipboardList,
      gradient: 'from-emerald-500 to-emerald-600',
      bgLight: 'bg-emerald-50',
      textColor: 'text-emerald-600',
      borderColor: 'border-emerald-200',
      action: exportMovimenti,
      filters: ['date', 'worksite']
    },
    {
      id: 'scorte',
      title: 'Prodotti da Riordinare',
      description: 'Prodotti sotto scorta minima',
      icon: AlertTriangle,
      gradient: 'from-amber-500 to-orange-500',
      bgLight: 'bg-amber-50',
      textColor: 'text-amber-600',
      borderColor: 'border-amber-200',
      action: exportScorteBasse,
      filters: ['supplier']
    }
  ]

  const quickDateRanges = [
    { label: 'Oggi', getValue: () => {
      const today = new Date().toISOString().split('T')[0]
      return { from: today, to: today }
    }},
    { label: 'Ultima settimana', getValue: () => {
      const to = new Date()
      const from = new Date()
      from.setDate(from.getDate() - 7)
      return { from: from.toISOString().split('T')[0], to: to.toISOString().split('T')[0] }
    }},
    { label: 'Questo mese', getValue: () => {
      const now = new Date()
      const from = new Date(now.getFullYear(), now.getMonth(), 1)
      return { from: from.toISOString().split('T')[0], to: now.toISOString().split('T')[0] }
    }},
    { label: 'Mese scorso', getValue: () => {
      const now = new Date()
      const from = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const to = new Date(now.getFullYear(), now.getMonth(), 0)
      return { from: from.toISOString().split('T')[0], to: to.toISOString().split('T')[0] }
    }},
    { label: 'Questo anno', getValue: () => {
      const now = new Date()
      const from = new Date(now.getFullYear(), 0, 1)
      return { from: from.toISOString().split('T')[0], to: now.toISOString().split('T')[0] }
    }}
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white px-4 pt-12 pb-8 rounded-b-3xl shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Link href={backUrl} className="p-2 -ml-2 hover:bg-white/10 rounded-xl transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <FileSpreadsheet className="w-6 h-6" />
            <div>
              <h1 className="text-xl font-bold">Report & Export</h1>
              <p className="text-blue-100 text-sm">Genera file Excel con filtri avanzati</p>
            </div>
          </div>

          {/* Stats Cards */}
          {statsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white/10 backdrop-blur rounded-xl p-3 animate-pulse">
                  <div className="h-4 bg-white/20 rounded w-20 mb-2" />
                  <div className="h-6 bg-white/20 rounded w-16" />
                </div>
              ))}
            </div>
          ) : stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white/10 backdrop-blur rounded-xl p-3">
                <div className="flex items-center gap-2 text-blue-100 text-xs mb-1">
                  <Package className="w-3.5 h-3.5" />
                  <span>Prodotti</span>
                </div>
                <p className="text-xl font-bold">{stats.totalProducts}</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-3">
                <div className="flex items-center gap-2 text-blue-100 text-xs mb-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Sotto scorta</span>
                </div>
                <p className="text-xl font-bold text-amber-300">{stats.lowStockCount}</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-3">
                <div className="flex items-center gap-2 text-blue-100 text-xs mb-1">
                  <Euro className="w-3.5 h-3.5" />
                  <span>Valore magazzino</span>
                </div>
                <p className="text-lg font-bold">{formatCurrency(stats.totalValue)}</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-3">
                <div className="flex items-center gap-2 text-blue-100 text-xs mb-1">
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Movimenti mese</span>
                </div>
                <p className="text-xl font-bold">{stats.monthlyMovements}</p>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 -mt-4 pb-24 space-y-4">
        {/* Filters Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center justify-between w-full bg-white rounded-2xl border border-gray-200 shadow-sm p-4 transition-all hover:border-blue-300"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Filter className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900">Filtri Report</h3>
              <p className="text-sm text-gray-500">
                {dateFrom === dateTo
                  ? new Date(dateFrom).toLocaleDateString('it-IT')
                  : `${new Date(dateFrom).toLocaleDateString('it-IT')} - ${new Date(dateTo).toLocaleDateString('it-IT')}`}
                {selectedSupplier && ` • ${suppliers.find(s => s.id === selectedSupplier)?.name}`}
                {selectedWorksite && ` • ${worksites.find(w => w.id === selectedWorksite)?.name}`}
              </p>
            </div>
          </div>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
            {/* Quick Date Ranges */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Periodo rapido</label>
              <div className="flex flex-wrap gap-2">
                {quickDateRanges.map(range => (
                  <button
                    key={range.label}
                    onClick={() => {
                      const { from, to } = range.getValue()
                      setDateFrom(from)
                      setDateTo(to)
                    }}
                    className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-blue-100 hover:text-blue-700 rounded-lg transition-colors"
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Date Range */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Da
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  A
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Supplier Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fornitore</label>
              <select
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Tutti i fornitori</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
                ))}
              </select>
            </div>

            {/* Worksite Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cantiere</label>
              <select
                value={selectedWorksite}
                onChange={(e) => setSelectedWorksite(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Tutti i cantieri</option>
                {worksites.map(w => (
                  <option key={w.id} value={w.id}>{w.code} - {w.name}</option>
                ))}
              </select>
            </div>

            {/* Clear Filters */}
            {(selectedSupplier || selectedWorksite) && (
              <button
                onClick={() => {
                  setSelectedSupplier('')
                  setSelectedWorksite('')
                }}
                className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700"
              >
                <X className="w-4 h-4" />
                Rimuovi filtri
              </button>
            )}
          </div>
        )}

        {/* Monthly Summary */}
        {stats && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-gray-400" />
              Riepilogo Mese Corrente
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                <div className="flex items-center gap-2 text-emerald-600 text-sm mb-1">
                  <TrendingUp className="w-4 h-4" />
                  <span>Carichi</span>
                </div>
                <p className="text-lg font-bold text-emerald-700">{formatCurrency(stats.monthlyInbound)}</p>
              </div>
              <div className="bg-red-50 rounded-xl p-3 border border-red-100">
                <div className="flex items-center gap-2 text-red-600 text-sm mb-1">
                  <TrendingDown className="w-4 h-4" />
                  <span>Scarichi</span>
                </div>
                <p className="text-lg font-bold text-red-700">{formatCurrency(stats.monthlyOutbound)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Report Cards */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 px-1">Esporta Report</h3>
          {reports.map(report => (
            <button
              key={report.id}
              onClick={report.action}
              disabled={loading !== null}
              className={`flex items-center gap-4 p-4 bg-white rounded-2xl border ${report.borderColor} shadow-sm transition-all duration-200 hover:shadow-md w-full text-left group`}
            >
              <div className={`w-12 h-12 bg-gradient-to-br ${report.gradient} rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform`}>
                <report.icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900">{report.title}</h4>
                <p className="text-sm text-gray-500">{report.description}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {report.filters.includes('date') && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                      <Calendar className="w-3 h-3" />
                      Periodo
                    </span>
                  )}
                  {report.filters.includes('supplier') && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                      <Package className="w-3 h-3" />
                      Fornitore
                    </span>
                  )}
                  {report.filters.includes('worksite') && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                      <Building2 className="w-3 h-3" />
                      Cantiere
                    </span>
                  )}
                </div>
              </div>
              {loading === report.id ? (
                <div className={`w-10 h-10 ${report.bgLight} rounded-xl flex items-center justify-center`}>
                  <Loader2 className={`w-5 h-5 ${report.textColor} animate-spin`} />
                </div>
              ) : (
                <div className={`w-10 h-10 ${report.bgLight} rounded-xl flex items-center justify-center group-hover:bg-gradient-to-br group-hover:${report.gradient} transition-all`}>
                  <Download className={`w-5 h-5 ${report.textColor} group-hover:text-white transition-colors`} />
                </div>
              )}
            </button>
          ))}
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
