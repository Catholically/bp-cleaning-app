'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/auth-provider'
import { Machine, MACHINE_STATUS_LABELS, MACHINE_STATUS_COLORS, MachineStatus } from '@/lib/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { BottomNav } from '@/components/navigation/bottom-nav'
import Link from 'next/link'
import {
  ArrowLeft,
  Plus,
  Wrench,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Hash,
  ChevronRight,
  Filter
} from 'lucide-react'

export default function MacchinariPage() {
  const { isSuperuser } = useAuth()
  const [machines, setMachines] = useState<Machine[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<MachineStatus | 'all'>('all')
  const supabase = createClient()

  useEffect(() => {
    fetchMachines()
  }, [])

  const fetchMachines = async () => {
    const { data } = await supabase
      .from('machines')
      .select('*, supplier:suppliers(name)')
      .order('code')

    setMachines(data || [])
    setLoading(false)
  }

  const getWarrantyStatus = (machine: Machine) => {
    if (!machine.purchase_date || !machine.warranty_months) return null
    const purchaseDate = new Date(machine.purchase_date)
    const warrantyEnd = new Date(purchaseDate)
    warrantyEnd.setMonth(warrantyEnd.getMonth() + machine.warranty_months)
    const now = new Date()
    const daysLeft = Math.ceil((warrantyEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (daysLeft < 0) return { status: 'expired' as const, daysLeft, date: warrantyEnd }
    if (daysLeft <= 90) return { status: 'expiring' as const, daysLeft, date: warrantyEnd }
    return { status: 'active' as const, daysLeft, date: warrantyEnd }
  }

  const filtered = machines.filter(m => {
    const matchesSearch = !search ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.code.toLowerCase().includes(search.toLowerCase()) ||
      m.serial_number?.toLowerCase().includes(search.toLowerCase()) ||
      m.brand?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalValue = machines.filter(m => m.status !== 'dismesso').reduce((sum, m) => sum + m.purchase_cost, 0)
  const activeCount = machines.filter(m => m.status === 'attivo').length

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="gradient-water px-5 pt-14 pb-6">
        <div className="flex items-center justify-between mb-4 max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <Link href="/" className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <ArrowLeft className="w-5 h-5 text-white" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">Macchinari</h1>
              <p className="text-sky-100 text-sm">{activeCount} attivi su {machines.length}</p>
            </div>
          </div>
          {isSuperuser && (
            <Link
              href="/macchinari/nuovo"
              className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center"
            >
              <Plus className="w-5 h-5 text-white" />
            </Link>
          )}
        </div>

        {/* Value card */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 max-w-4xl mx-auto">
          <p className="text-sky-200 text-xs font-medium mb-1">Valore Parco Macchinari</p>
          <p className="text-white text-3xl font-bold">{formatCurrency(totalValue)}</p>
        </div>
      </header>

      <div className="px-5 max-w-4xl mx-auto">
        {/* Search + Filter */}
        <div className="flex gap-2 mt-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cerca macchinario..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as MachineStatus | 'all')}
            className="px-3 py-3 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">Tutti</option>
            {Object.entries(MACHINE_STATUS_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
            <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">
              {machines.length === 0 ? 'Nessun macchinario registrato' : 'Nessun risultato'}
            </p>
            {machines.length === 0 && isSuperuser && (
              <Link href="/macchinari/nuovo" className="inline-flex items-center gap-2 mt-3 text-sky-600 text-sm font-medium">
                <Plus className="w-4 h-4" /> Aggiungi il primo
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((machine) => {
              const warranty = getWarrantyStatus(machine)
              return (
                <Link
                  key={machine.id}
                  href={`/macchinari/${machine.id}`}
                  className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="w-12 h-12 bg-sky-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Wrench className="w-6 h-6 text-sky-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900 truncate">{machine.name}</p>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${MACHINE_STATUS_COLORS[machine.status]}`}>
                        {MACHINE_STATUS_LABELS[machine.status]}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400 font-mono">{machine.code}</span>
                      {machine.serial_number && (
                        <span className="text-xs text-gray-400">SN: {machine.serial_number}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm font-semibold text-gray-700">{formatCurrency(machine.purchase_cost)}</span>
                      {warranty && (
                        <span className={`text-xs flex items-center gap-1 ${
                          warranty.status === 'expired' ? 'text-red-500' :
                          warranty.status === 'expiring' ? 'text-amber-500' :
                          'text-emerald-500'
                        }`}>
                          {warranty.status === 'expired' ? <ShieldAlert className="w-3 h-3" /> :
                           warranty.status === 'expiring' ? <Shield className="w-3 h-3" /> :
                           <ShieldCheck className="w-3 h-3" />}
                          {warranty.status === 'expired' ? 'Scaduta' :
                           warranty.status === 'expiring' ? `${warranty.daysLeft}gg` :
                           'In garanzia'}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                </Link>
              )
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
