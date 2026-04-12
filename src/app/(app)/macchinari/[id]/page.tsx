'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/auth-provider'
import { Machine, MACHINE_STATUS_LABELS, MACHINE_STATUS_COLORS } from '@/lib/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { BottomNav } from '@/components/navigation/bottom-nav'
import Link from 'next/link'
import {
  ArrowLeft,
  Edit,
  Wrench,
  Hash,
  Calendar,
  Euro,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Building2,
  Truck,
  FileText,
  Trash2
} from 'lucide-react'

export default function MacchinarioDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { isSuperuser } = useAuth()
  const [machine, setMachine] = useState<Machine | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchMachine()
  }, [params.id])

  const fetchMachine = async () => {
    const { data } = await supabase
      .from('machines')
      .select('*, supplier:suppliers(name)')
      .eq('id', params.id)
      .single()

    setMachine(data)
    setLoading(false)
  }

  const handleDelete = async () => {
    if (!confirm('Sei sicuro di voler eliminare questo macchinario?')) return
    setDeleting(true)
    await supabase.from('machines').delete().eq('id', params.id)
    router.push('/macchinari')
  }

  const getWarrantyInfo = () => {
    if (!machine?.purchase_date || !machine?.warranty_months) return null
    const purchaseDate = new Date(machine.purchase_date)
    const warrantyEnd = new Date(purchaseDate)
    warrantyEnd.setMonth(warrantyEnd.getMonth() + machine.warranty_months)
    const now = new Date()
    const daysLeft = Math.ceil((warrantyEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (daysLeft < 0) return { status: 'expired' as const, daysLeft: Math.abs(daysLeft), date: warrantyEnd }
    if (daysLeft <= 90) return { status: 'expiring' as const, daysLeft, date: warrantyEnd }
    return { status: 'active' as const, daysLeft, date: warrantyEnd }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!machine) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-5">
        <div className="text-center">
          <p className="text-gray-500">Macchinario non trovato</p>
          <Link href="/macchinari" className="text-sky-600 text-sm mt-2 inline-block">Torna alla lista</Link>
        </div>
      </div>
    )
  }

  const warranty = getWarrantyInfo()

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="gradient-water px-5 pt-14 pb-6">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <Link href="/macchinari" className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <ArrowLeft className="w-5 h-5 text-white" />
            </Link>
            <div>
              <p className="text-sky-200 text-xs font-mono">{machine.code}</p>
              <h1 className="text-xl font-bold text-white">{machine.name}</h1>
            </div>
          </div>
          {isSuperuser && (
            <Link
              href={`/macchinari/${machine.id}/modifica`}
              className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center"
            >
              <Edit className="w-5 h-5 text-white" />
            </Link>
          )}
        </div>
      </header>

      <div className="px-5 max-w-4xl mx-auto space-y-4 mt-4">
        {/* Status + Value card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">Valore</p>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(machine.purchase_cost)}</p>
            </div>
            <span className={`px-3 py-1.5 rounded-full text-sm font-medium border ${MACHINE_STATUS_COLORS[machine.status]}`}>
              {MACHINE_STATUS_LABELS[machine.status]}
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">Dettagli</h2>

          {machine.brand && (
            <div className="flex items-center gap-3">
              <Wrench className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Marca / Modello</p>
                <p className="text-sm font-medium text-gray-900">
                  {machine.brand}{machine.model ? ` ${machine.model}` : ''}
                </p>
              </div>
            </div>
          )}

          {machine.serial_number && (
            <div className="flex items-center gap-3">
              <Hash className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Numero di Serie</p>
                <p className="text-sm font-medium text-gray-900 font-mono">{machine.serial_number}</p>
              </div>
            </div>
          )}

          {machine.purchase_date && (
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Data Acquisto</p>
                <p className="text-sm font-medium text-gray-900">{formatDate(machine.purchase_date)}</p>
              </div>
            </div>
          )}

          {(machine as any).supplier?.name && (
            <div className="flex items-center gap-3">
              <Truck className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Fornitore</p>
                <p className="text-sm font-medium text-gray-900">{(machine as any).supplier.name}</p>
              </div>
            </div>
          )}

          {machine.notes && (
            <div className="flex items-start gap-3">
              <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Note</p>
                <p className="text-sm text-gray-700">{machine.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Warranty */}
        {warranty && (
          <div className={`rounded-2xl border p-5 ${
            warranty.status === 'expired' ? 'bg-red-50 border-red-200' :
            warranty.status === 'expiring' ? 'bg-amber-50 border-amber-200' :
            'bg-emerald-50 border-emerald-200'
          }`}>
            <div className="flex items-center gap-3">
              {warranty.status === 'expired' ? (
                <ShieldAlert className="w-6 h-6 text-red-500" />
              ) : warranty.status === 'expiring' ? (
                <Shield className="w-6 h-6 text-amber-500" />
              ) : (
                <ShieldCheck className="w-6 h-6 text-emerald-500" />
              )}
              <div>
                <p className={`text-sm font-semibold ${
                  warranty.status === 'expired' ? 'text-red-700' :
                  warranty.status === 'expiring' ? 'text-amber-700' :
                  'text-emerald-700'
                }`}>
                  {warranty.status === 'expired' ? 'Garanzia Scaduta' :
                   warranty.status === 'expiring' ? 'Garanzia in Scadenza' :
                   'In Garanzia'}
                </p>
                <p className={`text-xs ${
                  warranty.status === 'expired' ? 'text-red-600' :
                  warranty.status === 'expiring' ? 'text-amber-600' :
                  'text-emerald-600'
                }`}>
                  {warranty.status === 'expired'
                    ? `Scaduta da ${warranty.daysLeft} giorni (${formatDate(warranty.date.toISOString())})`
                    : `Scade il ${formatDate(warranty.date.toISOString())} (${warranty.daysLeft} giorni)`
                  }
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Durata: {machine.warranty_months} mesi
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Delete */}
        {isSuperuser && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="w-full py-3 text-red-500 text-sm font-medium flex items-center justify-center gap-2 hover:bg-red-50 rounded-xl transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            {deleting ? 'Eliminazione...' : 'Elimina macchinario'}
          </button>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
