'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/auth-provider'
import { Supplier } from '@/lib/types'
import {
  Truck,
  Plus,
  Search,
  X,
  Phone,
  Mail,
  Edit,
  Trash2,
  ArrowLeft,
  Save,
  Loader2
} from 'lucide-react'
import Link from 'next/link'

function FornitoriContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isSuperuser } = useAuth()

  const fromImpostazioni = searchParams.get('from') === 'impostazioni'
  const backUrl = fromImpostazioni ? '/impostazioni' : '/'
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    contact_name: '',
    email: '',
    phone: '',
    address: '',
    notes: ''
  })

  useEffect(() => {
    if (!isSuperuser) {
      router.push('/impostazioni')
      return
    }
    fetchSuppliers()
  }, [isSuperuser])

  const fetchSuppliers = async () => {
    const { data } = await supabase
      .from('suppliers')
      .select('*')
      .order('code')

    if (data) setSuppliers(data)
    setLoading(false)
  }

  const generateCode = async (): Promise<string> => {
    const { data } = await supabase
      .from('suppliers')
      .select('code')
      .like('code', 'FOR%')
      .order('code', { ascending: false })
      .limit(1)

    let nextNum = 1
    if (data && data.length > 0 && data[0].code) {
      const numPart = data[0].code.replace('FOR', '')
      nextNum = parseInt(numPart, 10) + 1
    }
    return `FOR${nextNum.toString().padStart(3, '0')}`
  }

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier)
    setFormData({
      code: supplier.code,
      name: supplier.name,
      contact_name: supplier.contact_name || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      notes: supplier.notes || ''
    })
    setShowForm(true)
  }

  const handleNew = async () => {
    setEditingSupplier(null)
    const code = await generateCode()
    setFormData({
      code,
      name: '',
      contact_name: '',
      email: '',
      phone: '',
      address: '',
      notes: ''
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      alert('Inserisci il nome del fornitore')
      return
    }

    setSaving(true)

    if (editingSupplier) {
      // Update
      const { error } = await supabase
        .from('suppliers')
        .update({
          name: formData.name.trim(),
          contact_name: formData.contact_name || null,
          email: formData.email || null,
          phone: formData.phone || null,
          address: formData.address || null,
          notes: formData.notes || null
        })
        .eq('id', editingSupplier.id)

      if (error) {
        alert('Errore durante il salvataggio: ' + error.message)
      } else {
        setShowForm(false)
        fetchSuppliers()
      }
    } else {
      // Insert
      const { error } = await supabase
        .from('suppliers')
        .insert({
          code: formData.code,
          name: formData.name.trim(),
          contact_name: formData.contact_name || null,
          email: formData.email || null,
          phone: formData.phone || null,
          address: formData.address || null,
          notes: formData.notes || null,
          is_active: true
        })

      if (error) {
        alert('Errore durante la creazione: ' + error.message)
      } else {
        setShowForm(false)
        fetchSuppliers()
      }
    }

    setSaving(false)
  }

  const handleDelete = async (supplier: Supplier) => {
    if (!confirm(`Sei sicuro di voler eliminare "${supplier.name}"?`)) return

    const { error } = await supabase
      .from('suppliers')
      .update({ is_active: false })
      .eq('id', supplier.id)

    if (!error) {
      fetchSuppliers()
    } else {
      alert('Errore durante l\'eliminazione')
    }
  }

  const filteredSuppliers = suppliers.filter(s => {
    if (!s.is_active) return false
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      s.name.toLowerCase().includes(query) ||
      s.code.toLowerCase().includes(query) ||
      s.contact_name?.toLowerCase().includes(query)
    )
  })

  if (!isSuperuser) return null

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Form view
  if (showForm) {
    return (
      <div className="min-h-screen pb-24">
        <header className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white px-4 pt-12 pb-6 rounded-b-3xl">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => setShowForm(false)}
              className="p-2 -ml-2 hover:bg-white/10 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="text-amber-100">
              {editingSupplier ? 'Modifica Fornitore' : 'Nuovo Fornitore'}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
              <Truck className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-bold">
                {editingSupplier ? formData.name || 'Modifica' : 'Nuovo Fornitore'}
              </h1>
              <p className="text-amber-100 text-sm font-mono">{formData.code}</p>
            </div>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="px-4 -mt-4 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome Fornitore *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Es. CleanPro Italia"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              required
            />
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Persona di Contatto
            </label>
            <input
              type="text"
              value={formData.contact_name}
              onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
              placeholder="Es. Mario Rossi"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@esempio.it"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefono
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+39 02 1234567"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Indirizzo
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Via Roma 1, Milano"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Note
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Note aggiuntive..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={saving || !formData.name.trim()}
            className="w-full flex items-center justify-center gap-2 p-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl font-semibold hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Salvataggio...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                {editingSupplier ? 'Salva Modifiche' : 'Crea Fornitore'}
              </>
            )}
          </button>
        </form>
      </div>
    )
  }

  // List view
  return (
    <div className="min-h-screen">
      <header className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white px-4 pt-12 pb-6 rounded-b-3xl">
        <div className="flex items-center gap-3 mb-4">
          <Link
            href={backUrl}
            className="p-2 -ml-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold">Fornitori</h1>
            <p className="text-amber-100 text-sm">{filteredSuppliers.length} fornitori attivi</p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-300" />
          <input
            type="text"
            placeholder="Cerca fornitore..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-amber-200 focus:outline-none focus:ring-2 focus:ring-white/30"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full"
            >
              <X className="w-4 h-4 text-amber-200" />
            </button>
          )}
        </div>
      </header>

      <div className="px-4 -mt-4 space-y-3 pb-24">
        {filteredSuppliers.map((supplier, index) => (
          <div
            key={supplier.id}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 animate-slide-up"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
                  {supplier.code}
                </span>
                <h3 className="font-semibold text-gray-900 mt-1">{supplier.name}</h3>
                {supplier.contact_name && (
                  <p className="text-sm text-gray-500">{supplier.contact_name}</p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(supplier)}
                  className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors"
                >
                  <Edit className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(supplier)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 text-sm text-gray-500">
              {supplier.phone && (
                <a href={`tel:${supplier.phone}`} className="flex items-center gap-1 hover:text-amber-600">
                  <Phone className="w-4 h-4" />
                  {supplier.phone}
                </a>
              )}
              {supplier.email && (
                <a href={`mailto:${supplier.email}`} className="flex items-center gap-1 hover:text-amber-600">
                  <Mail className="w-4 h-4" />
                  {supplier.email}
                </a>
              )}
            </div>
          </div>
        ))}

        {filteredSuppliers.length === 0 && searchQuery && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4 text-gray-400">
              <Search className="w-8 h-8" />
            </div>
            <p className="text-lg font-semibold text-gray-900 mb-2">Nessun risultato</p>
            <p className="text-sm text-gray-500 max-w-sm">
              Nessun fornitore trovato per "{searchQuery}"
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-4 text-amber-600 font-medium"
            >
              Cancella ricerca
            </button>
          </div>
        )}

        {filteredSuppliers.length === 0 && !searchQuery && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4 text-gray-400">
              <Truck className="w-8 h-8" />
            </div>
            <p className="text-lg font-semibold text-gray-900 mb-2">Nessun fornitore</p>
            <p className="text-sm text-gray-500 max-w-sm">
              Aggiungi il primo fornitore per iniziare
            </p>
          </div>
        )}
      </div>

      <button
        onClick={handleNew}
        className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xl flex items-center justify-center z-50 hover:from-amber-600 hover:to-orange-600 active:scale-95 transition-all duration-200"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  )
}

export default function FornitoriPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
      </div>
    }>
      <FornitoriContent />
    </Suspense>
  )
}
