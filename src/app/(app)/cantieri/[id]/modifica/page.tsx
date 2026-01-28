'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/auth-provider'
import { Worksite, WorksiteStatus, STATUS_LABELS } from '@/lib/types'
import {
  ArrowLeft,
  Building2,
  Save,
  Loader2,
  ShieldAlert,
  Trash2
} from 'lucide-react'

export default function ModificaCantiereePage() {
  const params = useParams()
  const router = useRouter()
  const { isSuperuser, loading: authLoading } = useAuth()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [worksite, setWorksite] = useState<Worksite | null>(null)

  // Form state
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [cap, setCap] = useState('')
  const [provincia, setProvincia] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientContact, setClientContact] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [codiceFiscale, setCodiceFiscale] = useState('')
  const [partitaIva, setPartitaIva] = useState('')
  const [budgetAllocated, setBudgetAllocated] = useState(0)
  const [status, setStatus] = useState<WorksiteStatus>('active')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (params.id && !authLoading && isSuperuser) {
      fetchWorksite()
    }
  }, [params.id, authLoading, isSuperuser])

  const fetchWorksite = async () => {
    const { data, error } = await supabase
      .from('worksites')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !data) {
      router.push('/cantieri')
      return
    }

    setWorksite(data)

    // Populate form
    setCode(data.code || '')
    setName(data.name || '')
    setAddress(data.address || '')
    setCity(data.city || '')
    setCap(data.cap || '')
    setProvincia(data.provincia || '')
    setClientName(data.client_name || '')
    setClientContact(data.client_contact || '')
    setClientPhone(data.client_phone || '')
    setClientEmail(data.client_email || '')
    setCodiceFiscale(data.codice_fiscale || '')
    setPartitaIva(data.partita_iva || '')
    setBudgetAllocated(data.budget_allocated || 0)
    setStatus(data.status || 'active')
    setNotes(data.notes || '')

    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      alert('Inserisci il nome del cantiere')
      return
    }

    if (!address.trim() || !city.trim()) {
      alert('Inserisci indirizzo e città')
      return
    }

    setSaving(true)

    try {
      const { error } = await supabase
        .from('worksites')
        .update({
          name: name.trim(),
          address: address.trim(),
          city: city.trim(),
          cap: cap.trim() || null,
          provincia: provincia.trim() || null,
          client_name: clientName.trim() || null,
          client_contact: clientContact.trim() || null,
          client_phone: clientPhone.trim() || null,
          client_email: clientEmail.trim() || null,
          codice_fiscale: codiceFiscale.trim() || null,
          partita_iva: partitaIva.trim() || null,
          budget_allocated: budgetAllocated,
          status,
          notes: notes.trim() || null
        })
        .eq('id', params.id)

      if (error) {
        console.error('Error updating worksite:', error)
        alert('Errore durante il salvataggio: ' + error.message)
      } else {
        router.push(`/cantieri/${params.id}`)
      }
    } catch (err) {
      console.error('Error:', err)
      alert('Errore durante il salvataggio')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    // Check if there are movements for this worksite
    const { count } = await supabase
      .from('movements')
      .select('*', { count: 'exact', head: true })
      .eq('worksite_id', params.id)

    if (count && count > 0) {
      alert(`Non puoi eliminare questo cantiere perché ha ${count} movimenti associati. Puoi invece cambiare lo stato a "Completato".`)
      return
    }

    if (!confirm('Sei sicuro di voler eliminare questo cantiere? Questa azione non può essere annullata.')) {
      return
    }

    setDeleting(true)

    try {
      const { error } = await supabase
        .from('worksites')
        .delete()
        .eq('id', params.id)

      if (error) {
        console.error('Error deleting worksite:', error)
        alert('Errore durante l\'eliminazione: ' + error.message)
      } else {
        router.push('/cantieri')
      }
    } catch (err) {
      console.error('Error:', err)
      alert('Errore durante l\'eliminazione')
    } finally {
      setDeleting(false)
    }
  }

  // Show loading while checking auth
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
      </div>
    )
  }

  // Access denied for non-superusers
  if (!isSuperuser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Accesso Negato</h1>
        <p className="text-gray-500 mb-4">Solo i superuser possono modificare i cantieri.</p>
        <button
          onClick={() => router.push('/cantieri')}
          className="px-4 py-2 bg-violet-600 text-white rounded-xl font-medium"
        >
          Torna ai Cantieri
        </button>
      </div>
    )
  }

  if (!worksite) {
    return null
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="bg-gradient-to-r from-violet-500 via-purple-600 to-indigo-600 text-white px-4 pt-12 pb-6 rounded-b-3xl">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => router.back()}
              className="p-2 -ml-2 hover:bg-white/10 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="text-purple-100">Modifica Cantiere</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-medium">
                {code}
              </span>
              <h1 className="text-xl font-bold mt-1">{worksite.name}</h1>
            </div>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto px-4 -mt-4 space-y-4">
        {/* Codice (readonly) */}
        <div className="bg-gray-50 rounded-2xl border border-gray-200 p-4">
          <label className="block text-sm font-medium text-gray-500 mb-2">
            Codice (non modificabile)
          </label>
          <input
            type="text"
            value={code}
            disabled
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-500 bg-gray-100 cursor-not-allowed font-mono"
          />
        </div>

        {/* Nome */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nome Cantiere *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Es. Uffici Via Roma"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            required
          />
        </div>

        {/* Indirizzo */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Indirizzo *
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Es. Via Roma 123"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            required
          />
        </div>

        {/* Città, CAP, Provincia */}
        <div className="grid grid-cols-5 gap-3">
          <div className="col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Città *
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Milano"
              className="w-full px-3 py-3 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
              required
            />
          </div>

          <div className="col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CAP
            </label>
            <input
              type="text"
              value={cap}
              onChange={(e) => setCap(e.target.value)}
              placeholder="20100"
              className="w-full px-3 py-3 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div className="col-span-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prov.
            </label>
            <input
              type="text"
              value={provincia}
              onChange={(e) => setProvincia(e.target.value.toUpperCase())}
              placeholder="MI"
              maxLength={2}
              className="w-full px-3 py-3 rounded-xl border border-gray-200 text-gray-900 uppercase focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
        </div>

        {/* Dati Cliente */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
          <h3 className="font-semibold text-gray-900">Dati Cliente</h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ragione Sociale
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Azienda Srl"
                className="w-full px-3 py-3 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Referente
              </label>
              <input
                type="text"
                value={clientContact}
                onChange={(e) => setClientContact(e.target.value)}
                placeholder="Mario Rossi"
                className="w-full px-3 py-3 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefono
              </label>
              <input
                type="tel"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="+39 02 1234567"
                className="w-full px-3 py-3 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="info@azienda.it"
                className="w-full px-3 py-3 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Codice Fiscale
              </label>
              <input
                type="text"
                value={codiceFiscale}
                onChange={(e) => setCodiceFiscale(e.target.value.toUpperCase())}
                placeholder="RSSMRA80A01H501U"
                className="w-full px-3 py-3 rounded-xl border border-gray-200 text-gray-900 uppercase font-mono focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Partita IVA
              </label>
              <input
                type="text"
                value={partitaIva}
                onChange={(e) => setPartitaIva(e.target.value)}
                placeholder="IT01234567890"
                className="w-full px-3 py-3 rounded-xl border border-gray-200 text-gray-900 font-mono focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>
        </div>

        {/* Budget e Stato */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Budget Mensile €
            </label>
            <input
              type="number"
              value={budgetAllocated}
              onChange={(e) => setBudgetAllocated(Number(e.target.value))}
              min="0"
              step="100"
              className="w-full px-3 py-3 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stato
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as WorksiteStatus)}
              className="w-full px-3 py-3 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Note */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Note (opzionale)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Note aggiuntive..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
          />
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <button
            type="submit"
            disabled={saving || !name.trim() || !address.trim() || !city.trim()}
            className="w-full flex items-center justify-center gap-2 p-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-2xl font-semibold hover:from-violet-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Salvataggio...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Salva Modifiche
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="w-full flex items-center justify-center gap-2 p-4 bg-white border-2 border-red-200 text-red-600 rounded-2xl font-semibold hover:bg-red-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Eliminazione...
              </>
            ) : (
              <>
                <Trash2 className="w-5 h-5" />
                Elimina Cantiere
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
