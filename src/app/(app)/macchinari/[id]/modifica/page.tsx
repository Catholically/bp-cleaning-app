'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/auth-provider'
import { Supplier, MACHINE_STATUS_LABELS, MachineStatus } from '@/lib/types'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'

export default function ModificaMacchinarioPage() {
  const params = useParams()
  const router = useRouter()
  const { isSuperuser } = useAuth()
  const supabase = createClient()

  const [name, setName] = useState('')
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [serialNumber, setSerialNumber] = useState('')
  const [purchaseDate, setPurchaseDate] = useState('')
  const [purchaseCost, setPurchaseCost] = useState<number | string>('')
  const [warrantyMonths, setWarrantyMonths] = useState(12)
  const [status, setStatus] = useState<MachineStatus>('attivo')
  const [supplierId, setSupplierId] = useState('')
  const [notes, setNotes] = useState('')
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchData()
  }, [params.id])

  const fetchData = async () => {
    const [{ data: machine }, { data: suppliersData }] = await Promise.all([
      supabase.from('machines').select('*').eq('id', params.id).single(),
      supabase.from('suppliers').select('*').eq('is_active', true).order('name')
    ])

    if (machine) {
      setName(machine.name)
      setBrand(machine.brand || '')
      setModel(machine.model || '')
      setSerialNumber(machine.serial_number || '')
      setPurchaseDate(machine.purchase_date || '')
      setPurchaseCost(machine.purchase_cost || '')
      setWarrantyMonths(machine.warranty_months || 12)
      setStatus(machine.status)
      setSupplierId(machine.supplier_id || '')
      setNotes(machine.notes || '')
    }
    if (suppliersData) setSuppliers(suppliersData)
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Inserisci il nome del macchinario')
      return
    }

    setSaving(true)
    setError('')

    try {
      const { error: updateError } = await supabase
        .from('machines')
        .update({
          name: name.trim(),
          brand: brand.trim() || null,
          model: model.trim() || null,
          serial_number: serialNumber.trim() || null,
          purchase_date: purchaseDate || null,
          purchase_cost: Number(purchaseCost) || 0,
          warranty_months: warrantyMonths,
          status,
          supplier_id: supplierId || null,
          notes: notes.trim() || null,
        })
        .eq('id', params.id)

      if (updateError) throw updateError
      router.push(`/macchinari/${params.id}`)
    } catch (err: any) {
      setError(err.message || 'Errore durante il salvataggio')
    } finally {
      setSaving(false)
    }
  }

  if (!isSuperuser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-5">
        <div className="text-center">
          <p className="text-gray-500">Accesso riservato agli amministratori</p>
          <Link href="/" className="text-sky-600 text-sm mt-2 inline-block">Torna alla home</Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <header className="gradient-water px-5 pt-14 pb-6">
        <div className="flex items-center gap-3 max-w-4xl mx-auto">
          <Link href={`/macchinari/${params.id}`} className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">Modifica Macchinario</h1>
            <p className="text-sky-100 text-sm">Aggiorna i dati</p>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="px-5 mt-6 max-w-4xl mx-auto space-y-5">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nome *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Marca</label>
            <input
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Modello</label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Numero di Serie</label>
            <input
              type="text"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fornitore</label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full px-3 py-3 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Nessuno --</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Costo Acquisto &euro;</label>
            <input
              type="number"
              value={purchaseCost}
              onChange={(e) => setPurchaseCost(e.target.value === '' ? '' : Number(e.target.value))}
              min="0"
              step="0.01"
              placeholder="0.00"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Data Acquisto</label>
            <input
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Garanzia (mesi)</label>
            <input
              type="number"
              value={warrantyMonths}
              onChange={(e) => setWarrantyMonths(Number(e.target.value))}
              min="0"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Stato</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as MachineStatus)}
              className="w-full px-3 py-3 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(MACHINE_STATUS_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Note</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-4 bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Salvataggio...' : 'Salva Modifiche'}
        </button>
      </form>
    </div>
  )
}
