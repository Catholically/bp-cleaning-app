'use client'

import { useState, useEffect, Suspense } from 'react'
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
  ChevronLeft
} from 'lucide-react'
import Link from 'next/link'
import * as XLSX from 'xlsx'

function ReportContent() {
  const [loading, setLoading] = useState<string | null>(null)
  const supabase = createClient()
  const { isSuperuser, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const fromImpostazioni = searchParams.get('from') === 'impostazioni'
  const backUrl = fromImpostazioni ? '/impostazioni' : '/'

  // Redirect non-superusers (managers cannot access reports)
  useEffect(() => {
    if (!authLoading && !isSuperuser) {
      router.replace('/')
    }
  }, [isSuperuser, authLoading, router])

  // Show access denied while checking or for unauthorized users
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

  // Generate datetime string for filename: YYYY-MM-DD_HH-mm
  const getDateTimeString = () => {
    const now = new Date()
    const date = now.toISOString().split('T')[0]
    const time = now.toTimeString().slice(0, 5).replace(':', '-')
    return `${date}_${time}`
  }

  // Style configuration for Excel
  const headerStyle = {
    font: { bold: true, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '2563EB' } }, // Blue-600
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
    const ws = XLSX.utils.json_to_sheet(data)

    // Get the range of the worksheet
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
    const numCols = range.e.c + 1
    const numRows = range.e.r + 1

    // Calculate column widths based on content
    const colWidths: { wch: number }[] = []
    const headers = Object.keys(data[0] || {})

    headers.forEach((header, colIndex) => {
      let maxWidth = header.length
      data.forEach(row => {
        const cellValue = String(row[header] || '')
        maxWidth = Math.max(maxWidth, cellValue.length)
      })
      colWidths.push({ wch: Math.min(maxWidth + 2, 50) })
    })
    ws['!cols'] = colWidths

    // Apply styles to header row
    for (let col = 0; col <= range.e.c; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: col })
      if (ws[cellRef]) {
        ws[cellRef].s = headerStyle
      }
    }

    // Apply styles to data cells
    for (let row = 1; row <= range.e.r; row++) {
      for (let col = 0; col <= range.e.c; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: col })
        if (ws[cellRef]) {
          const cellStyle: any = {
            border: cellBorder,
            alignment: { vertical: 'center' }
          }

          // Alternate row colors
          if (row % 2 === 0) {
            cellStyle.fill = { fgColor: { rgb: 'F9FAFB' } } // Gray-50
          }

          // Conditional formatting for status columns
          if (conditionalColumn) {
            const colIndex = headers.indexOf(conditionalColumn)
            if (col === colIndex) {
              const cellValue = ws[cellRef].v
              if (cellValue === 'RIORDINO' || cellValue === 'SCARICO') {
                cellStyle.fill = { fgColor: { rgb: 'FEE2E2' } } // Red-100
                cellStyle.font = { color: { rgb: 'DC2626' }, bold: true } // Red-600
              } else if (cellValue === 'OK' || cellValue === 'CARICO') {
                cellStyle.fill = { fgColor: { rgb: 'DCFCE7' } } // Green-100
                cellStyle.font = { color: { rgb: '16A34A' }, bold: true } // Green-600
              }
            }
          }

          // Right-align numeric columns (€, quantities)
          const header = headers[col]
          if (header && (header.includes('€') || header.includes('Qtà') || header.includes('Quantità') || header === 'Giacenza' || header === 'Scorta Min.' || header === 'Da Ordinare' || header === 'N. Movimenti')) {
            cellStyle.alignment = { horizontal: 'right', vertical: 'center' }
          }

          ws[cellRef].s = cellStyle
        }
      }
    }

    // Freeze header row
    ws['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: 'A2', activePane: 'bottomLeft', state: 'frozen' }

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Dati')
    XLSX.writeFile(wb, `${filename}_${getDateTimeString()}.xlsx`)
  }

  const exportInventario = async () => {
    setLoading('inventario')
    try {
      const { data } = await supabase
        .from('products')
        .select('barcode, name, category, unit, quantity_per_package, unit_cost, current_stock, min_stock')
        .eq('is_active', true)
        .order('category')
        .order('name')

      if (data) {
        const formatted = data.map((p: any) => ({
          'Barcode': p.barcode || '',
          'Nome': p.name,
          'Categoria': p.category,
          'Unità': p.unit,
          'Qtà Conf.': p.quantity_per_package,
          'Costo €': p.unit_cost,
          'Giacenza': p.current_stock,
          'Scorta Min.': p.min_stock,
          'Valore €': (p.current_stock * p.unit_cost).toFixed(2),
          'Stato': p.current_stock <= p.min_stock ? 'RIORDINO' : 'OK'
        }))
        downloadExcel(formatted, 'inventario', 'Stato')
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
      const monthStart = new Date()
      monthStart.setDate(1)
      monthStart.setHours(0, 0, 0, 0)

      const { data: movements } = await supabase
        .from('movements')
        .select(`
          quantity,
          total_cost,
          product:products(name),
          worksite:worksites(code, name, address, city)
        `)
        .eq('type', 'scarico')
        .gte('created_at', monthStart.toISOString())

      if (movements) {
        // Aggregate by worksite
        const byWorksite = movements.reduce((acc: Record<string, any>, m: any) => {
          const ws = (m as any).worksite
          if (!ws) return acc
          const key = ws.code
          if (!acc[key]) {
            acc[key] = {
              'Codice': ws.code,
              'Cantiere': ws.name,
              'Indirizzo': `${ws.address}, ${ws.city}`,
              'Totale €': 0,
              'N. Movimenti': 0
            }
          }
          acc[key]['Totale €'] += m.total_cost || 0
          acc[key]['N. Movimenti']++
          return acc
        }, {} as Record<string, any>)

        downloadExcel(Object.values(byWorksite), 'costi_cantieri')
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
      const monthStart = new Date()
      monthStart.setDate(1)
      monthStart.setHours(0, 0, 0, 0)

      const { data } = await supabase
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
        .gte('created_at', monthStart.toISOString())
        .order('created_at', { ascending: false })

      if (data) {
        const formatted = data.map((m: any) => ({
          'Data': new Date(m.created_at).toLocaleString('it-IT'),
          'Tipo': m.type === 'carico' ? 'CARICO' : 'SCARICO',
          'Prodotto': (m as any).product?.name || '',
          'Quantità': m.quantity,
          'Costo Unit. €': m.unit_cost_at_time,
          'Totale €': m.total_cost,
          'Cantiere': (m as any).worksite ? `${(m as any).worksite.code} - ${(m as any).worksite.name}` : '',
          'Operatore': (m as any).operator?.full_name || ''
        }))
        downloadExcel(formatted, 'movimenti', 'Tipo')
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
      const { data } = await supabase
        .from('products')
        .select('barcode, name, category, current_stock, min_stock, unit_cost')
        .eq('is_active', true)
        .lte('current_stock', supabase.rpc('min_stock'))

      // Alternative: filter in JS
      const { data: allProducts } = await supabase
        .from('products')
        .select('barcode, name, category, current_stock, min_stock, unit_cost')
        .eq('is_active', true)

      const lowStock = (allProducts || []).filter((p: any) => p.current_stock <= p.min_stock)

      if (lowStock.length > 0) {
        const formatted = lowStock.map((p: any) => ({
          'Barcode': p.barcode || '',
          'Nome': p.name,
          'Categoria': p.category,
          'Giacenza': p.current_stock,
          'Scorta Min.': p.min_stock,
          'Da Ordinare': Math.max(0, p.min_stock * 2 - p.current_stock),
          'Costo Unit. €': p.unit_cost
        }))
        downloadExcel(formatted, 'scorte_basse')
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

  const reports = [
    {
      id: 'inventario',
      title: 'Inventario Completo',
      description: 'Tutti i prodotti con giacenze e valori',
      icon: Package,
      color: 'bg-blue-100 text-blue-600',
      action: exportInventario
    },
    {
      id: 'cantieri',
      title: 'Costi per Cantiere',
      description: 'Spese prodotti per ogni cantiere (mese corrente)',
      icon: Building2,
      color: 'bg-violet-100 text-violet-600',
      action: exportCostiCantieri
    },
    {
      id: 'movimenti',
      title: 'Storico Movimenti',
      description: 'Tutti i carichi e scarichi del mese',
      icon: ClipboardList,
      color: 'bg-emerald-100 text-emerald-600',
      action: exportMovimenti
    },
    {
      id: 'scorte',
      title: 'Prodotti da Riordinare',
      description: 'Prodotti sotto scorta minima',
      icon: AlertTriangle,
      color: 'bg-red-100 text-red-600',
      action: exportScorteBasse
    }
  ]

  return (
    <div className="min-h-screen">
      <header className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white px-4 pt-12 pb-6 rounded-b-3xl">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Link href={backUrl} className="p-2 -ml-2 hover:bg-white/10 rounded-xl transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <FileSpreadsheet className="w-6 h-6" />
          <div>
            <h1 className="text-xl font-bold">Report & Export</h1>
            <p className="text-blue-100 text-sm">Genera file Excel</p>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 -mt-4 space-y-3 pb-6">
        {reports.map(report => (
          <button
            key={report.id}
            onClick={report.action}
            disabled={loading !== null}
            className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm transition-all duration-200 hover:shadow-md hover:border-gray-200 w-full text-left"
          >
            <div className={`list-item-icon ${report.color}`}>
              <report.icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">{report.title}</h4>
              <p className="text-sm text-gray-500">{report.description}</p>
            </div>
            {loading === report.id ? (
              <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
            ) : (
              <Download className="w-5 h-5 text-gray-400" />
            )}
          </button>
        ))}
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
