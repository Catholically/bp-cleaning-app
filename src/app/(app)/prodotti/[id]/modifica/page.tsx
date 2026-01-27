'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/auth-provider'
import {
  Product,
  ProductCategory,
  ProductUnit,
  CATEGORY_LABELS,
  UNIT_LABELS,
  Supplier
} from '@/lib/types'
import {
  ArrowLeft,
  Package,
  Save,
  Loader2,
  ShieldAlert,
  Trash2
} from 'lucide-react'

export default function ModificaProdottoPage() {
  const params = useParams()
  const router = useRouter()
  const { isSuperuser, loading: authLoading } = useAuth()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [product, setProduct] = useState<Product | null>(null)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])

  // Form state
  const [sku, setSku] = useState('')
  const [barcode, setBarcode] = useState('')
  const [name, setName] = useState('')
  const [category, setCategory] = useState<ProductCategory>('detergente')
  const [unit, setUnit] = useState<ProductUnit>('pezzi')
  const [quantityPerPackage, setQuantityPerPackage] = useState(1)
  const [unitCost, setUnitCost] = useState(0)
  const [currentStock, setCurrentStock] = useState(0)
  const [minStock, setMinStock] = useState(5)
  const [supplierId, setSupplierId] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (params.id && !authLoading && isSuperuser) {
      fetchData()
    }
  }, [params.id, authLoading, isSuperuser])

  const fetchData = async () => {
    // Fetch product
    const { data: productData, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !productData) {
      router.push('/prodotti')
      return
    }

    setProduct(productData)

    // Populate form
    setSku(productData.sku || '')
    setBarcode(productData.barcode || '')
    setName(productData.name || '')
    setCategory(productData.category || 'detergente')
    setUnit(productData.unit || 'pezzi')
    setQuantityPerPackage(productData.quantity_per_package || 1)
    setUnitCost(productData.unit_cost || 0)
    setCurrentStock(productData.current_stock || 0)
    setMinStock(productData.min_stock || 5)
    setSupplierId(productData.supplier_id || '')
    setNotes(productData.notes || '')

    // Fetch suppliers
    const { data: suppliersData } = await supabase
      .from('suppliers')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (suppliersData) setSuppliers(suppliersData)

    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      alert('Inserisci il nome del prodotto')
      return
    }

    setSaving(true)

    try {
      const { error } = await supabase
        .from('products')
        .update({
          name: name.trim(),
          category,
          unit,
          quantity_per_package: quantityPerPackage,
          unit_cost: unitCost,
          current_stock: currentStock,
          min_stock: minStock,
          supplier_id: supplierId || null,
          notes: notes.trim() || null
        })
        .eq('id', params.id)

      if (error) {
        console.error('Error updating product:', error)
        alert('Errore durante il salvataggio: ' + error.message)
      } else {
        router.push(`/prodotti/${params.id}`)
      }
    } catch (err) {
      console.error('Error:', err)
      alert('Errore durante il salvataggio')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!product) return

    // Check if there are movements for this product
    const { count } = await supabase
      .from('movements')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', params.id)

    if (count && count > 0) {
      if (!confirm(`Questo prodotto ha ${count} movimenti associati. Vuoi disattivarlo? Il prodotto non sarà più visibile ma i dati storici saranno mantenuti.`)) {
        return
      }
    } else {
      if (!confirm(`Sei sicuro di voler eliminare "${product.name}"? Questa azione non può essere annullata.`)) {
        return
      }
    }

    setDeleting(true)

    try {
      // Soft delete (set is_active to false)
      const { error } = await supabase
        .from('products')
        .update({ is_active: false })
        .eq('id', params.id)

      if (error) {
        console.error('Error deleting product:', error)
        alert('Errore durante l\'eliminazione: ' + error.message)
      } else {
        router.push('/prodotti')
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
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
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
        <p className="text-gray-500 mb-4">Solo i superuser possono modificare i prodotti.</p>
        <button
          onClick={() => router.push('/prodotti')}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl font-medium"
        >
          Torna ai Prodotti
        </button>
      </div>
    )
  }

  if (!product) {
    return null
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white px-4 pt-12 pb-6 rounded-b-3xl">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-blue-100">Modifica Prodotto</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
            <Package className="w-7 h-7" />
          </div>
          <div>
            <p className="text-blue-200 text-xs font-mono">{sku}</p>
            <h1 className="text-xl font-bold">{product.name}</h1>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="px-4 -mt-4 space-y-4">
        {/* Codici (readonly) */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-2xl border border-gray-200 p-4">
            <label className="block text-sm font-medium text-gray-500 mb-2">
              SKU (non modificabile)
            </label>
            <input
              type="text"
              value={sku}
              disabled
              className="w-full px-3 py-3 rounded-xl border border-gray-200 text-gray-500 bg-gray-100 cursor-not-allowed font-mono text-sm"
            />
          </div>
          <div className="bg-gray-50 rounded-2xl border border-gray-200 p-4">
            <label className="block text-sm font-medium text-gray-500 mb-2">
              Barcode (non modificabile)
            </label>
            <input
              type="text"
              value={barcode}
              disabled
              className="w-full px-3 py-3 rounded-xl border border-gray-200 text-gray-500 bg-gray-100 cursor-not-allowed font-mono text-sm"
            />
          </div>
        </div>

        {/* Nome */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nome Prodotto *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Es. Detergente Multiuso 5L"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        {/* Categoria e Unita */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoria
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ProductCategory)}
              className="w-full px-3 py-3 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Unita
            </label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value as ProductUnit)}
              className="w-full px-3 py-3 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(UNIT_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Quantita per confezione e Costo */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Qtà per Conf.
            </label>
            <input
              type="number"
              value={quantityPerPackage}
              onChange={(e) => setQuantityPerPackage(Number(e.target.value))}
              min="1"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Costo Unitario €
            </label>
            <input
              type="number"
              value={unitCost}
              onChange={(e) => setUnitCost(Number(e.target.value))}
              min="0"
              step="0.01"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Stock attuale e minimo */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Giacenza Attuale
            </label>
            <input
              type="number"
              value={currentStock}
              onChange={(e) => setCurrentStock(Number(e.target.value))}
              min="0"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-amber-600 mt-1">
              Usa i movimenti per aggiornare la giacenza
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Scorta Minima
            </label>
            <input
              type="number"
              value={minStock}
              onChange={(e) => setMinStock(Number(e.target.value))}
              min="0"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Fornitore */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fornitore
          </label>
          <select
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            className="w-full px-3 py-3 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Nessun fornitore --</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
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
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="w-full flex items-center justify-center gap-2 p-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                Disattivazione...
              </>
            ) : (
              <>
                <Trash2 className="w-5 h-5" />
                Disattiva Prodotto
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
