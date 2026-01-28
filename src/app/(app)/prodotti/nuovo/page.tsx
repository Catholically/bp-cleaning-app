'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/auth-provider'
import {
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
  Loader2
} from 'lucide-react'

export default function NuovoProdottoPage() {
  const router = useRouter()
  const { isSuperuser } = useAuth()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loadingSuppliers, setLoadingSuppliers] = useState(true)

  // Form state
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
    if (!isSuperuser) {
      router.push('/prodotti')
      return
    }
    fetchSuppliers()
  }, [isSuperuser])

  const fetchSuppliers = async () => {
    const { data } = await supabase
      .from('suppliers')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (data) setSuppliers(data)
    setLoadingSuppliers(false)
  }

  // Genera SKU automatico: BP-CATXXX (es. BP-DET001, BP-ACC042)
  const generateSKU = async (cat: ProductCategory): Promise<string> => {
    const prefixMap: Record<ProductCategory, string> = {
      detergente: 'DET',
      sgrassatore: 'SGR',
      disinfettante: 'DIS',
      lucidante: 'LUC',
      deodorante: 'DEO',
      accessorio: 'ACC',
      attrezzatura: 'ATT',
      altro: 'ALT'
    }

    const prefix = prefixMap[cat]

    // Trova il prossimo numero disponibile per questa categoria
    const { data } = await supabase
      .from('products')
      .select('sku')
      .like('sku', `BP-${prefix}%`)
      .order('sku', { ascending: false })
      .limit(1)

    let nextNum = 1
    if (data && data.length > 0 && data[0].sku) {
      const lastSku = data[0].sku
      const numPart = lastSku.replace(`BP-${prefix}`, '')
      nextNum = parseInt(numPart, 10) + 1
    }

    return `BP-${prefix}${nextNum.toString().padStart(3, '0')}`
  }

  // Genera Barcode automatico: BPC + 5 cifre (es. BPC00001)
  const generateBarcode = async (): Promise<string> => {
    // Trova il barcode più alto che inizia con BPC
    const { data } = await supabase
      .from('products')
      .select('barcode')
      .like('barcode', 'BPC%')
      .order('barcode', { ascending: false })
      .limit(1)

    let nextNum = 1
    if (data && data.length > 0 && data[0].barcode) {
      const lastBarcode = data[0].barcode
      // Estrai il numero dopo il prefisso BPC
      const numPart = lastBarcode.substring(3)
      nextNum = parseInt(numPart, 10) + 1
    }

    // Formato: BPC + 5 cifre = 8 caratteri totali
    return `BPC${nextNum.toString().padStart(5, '0')}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      alert('Inserisci il nome del prodotto')
      return
    }

    setLoading(true)

    try {
      // Genera SKU e Barcode automatici
      const sku = await generateSKU(category)
      const newBarcode = await generateBarcode()

      const { error } = await supabase
        .from('products')
        .insert({
          sku,
          barcode: newBarcode,
          name: name.trim(),
          category,
          unit,
          quantity_per_package: quantityPerPackage,
          unit_cost: unitCost,
          current_stock: currentStock,
          min_stock: minStock,
          supplier_id: supplierId || null,
          notes: notes || null,
          is_active: true
        })

      if (error) {
        console.error('Error creating product:', error)
        alert('Errore durante la creazione: ' + error.message)
      } else {
        router.push('/prodotti')
      }
    } catch (err) {
      console.error('Error:', err)
      alert('Errore durante la creazione')
    } finally {
      setLoading(false)
    }
  }

  if (!isSuperuser) {
    return null
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white px-4 pt-12 pb-6 rounded-b-3xl">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => router.back()}
              className="p-2 -ml-2 hover:bg-white/10 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="text-blue-100">Nuovo Prodotto</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
              <Package className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Aggiungi Prodotto</h1>
              <p className="text-blue-100 text-sm">Compila i dettagli</p>
            </div>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto px-4 -mt-4 space-y-4">
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

        {/* Stock iniziale e minimo */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Giacenza Iniziale
            </label>
            <input
              type="number"
              value={currentStock}
              onChange={(e) => setCurrentStock(Number(e.target.value))}
              min="0"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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
          {loadingSuppliers ? (
            <div className="flex items-center gap-2 text-gray-500 py-3">
              <Loader2 className="w-4 h-4 animate-spin" />
              Caricamento...
            </div>
          ) : (
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
          )}
        </div>

        {/* Info codici automatici */}
        <div className="bg-blue-50 rounded-2xl border border-blue-100 p-4">
          <p className="text-sm text-blue-800 font-medium mb-1">Codici generati automaticamente</p>
          <p className="text-xs text-blue-600">
            SKU: BP-XXX001 (es. BP-DET001) • Barcode: BPC00001
          </p>
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

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="w-full flex items-center justify-center gap-2 p-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Salvataggio...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Crea Prodotto
            </>
          )}
        </button>
      </form>
    </div>
  )
}
