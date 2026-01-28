'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Product, CATEGORY_LABELS } from '@/lib/types'
import {
  Printer,
  Search,
  Check,
  X,
  Tag,
  ChevronLeft,
  ChevronRight,
  Package,
  Filter,
  QrCode,
  FileText
} from 'lucide-react'
import Link from 'next/link'
import JsBarcode from 'jsbarcode'
import { jsPDF } from 'jspdf'

// Layout etichette Avery compatibile (65 etichette per foglio A4)
// 5 colonne x 13 righe, etichetta 38.1mm x 21.2mm
const LABELS_PER_ROW = 5
const LABELS_PER_COL = 13
const LABELS_PER_PAGE = LABELS_PER_ROW * LABELS_PER_COL

// Dimensioni in mm per PDF A4
const PAGE_WIDTH = 210
const PAGE_HEIGHT = 297
const MARGIN_LEFT = 4.7
const MARGIN_TOP = 10.7
const LABEL_WIDTH = 38.1
const LABEL_HEIGHT = 21.2
const GAP_H = 2.5
const GAP_V = 0

// DYMO 30332 - 1" x 1" (25.4mm x 25.4mm)
const DYMO_WIDTH = 25.4
const DYMO_HEIGHT = 25.4

// Avery Small / DYMO 48.5mm x 25.4mm (tipo Avery L4731 - 84 etichette per foglio)
// 4 colonne x 21 righe
const SMALL_LABELS_PER_ROW = 4
const SMALL_LABELS_PER_COL = 21
const SMALL_LABELS_PER_PAGE = SMALL_LABELS_PER_ROW * SMALL_LABELS_PER_COL
const SMALL_LABEL_WIDTH = 48.5
const SMALL_LABEL_HEIGHT = 25.4
const SMALL_MARGIN_LEFT = 6.8
const SMALL_MARGIN_TOP = 8.8
const SMALL_GAP_H = 0
const SMALL_GAP_V = 0

interface ProductWithQuantity extends Product {
  printQuantity: number
  selected: boolean
}

type PrintMode = 'avery' | 'dymo' | 'small'

export default function EtichettePage() {
  const [products, setProducts] = useState<ProductWithQuantity[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [generating, setGenerating] = useState(false)
  const [printMode, setPrintMode] = useState<PrintMode>('dymo')
  const [customBarcode, setCustomBarcode] = useState('')
  const [customText, setCustomText] = useState('')
  const [dymoQuantity, setDymoQuantity] = useState(1)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      try {
        await loadProducts()
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    load()

    return () => {
      isMounted = false
    }
  }, [])

  // Aggiorna preview quando cambiano i dati
  useEffect(() => {
    if (printMode === 'dymo') {
      updateDymoPreview()
    }
  }, [customBarcode, customText, printMode])

  async function loadProducts() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('sku')

    if (data && !error) {
      setProducts(data.map((p: Product) => ({ ...p, printQuantity: 1, selected: false })))
    }
  }

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.barcode?.includes(searchTerm)
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const selectedProducts = products.filter(p => p.selected)
  const totalLabels = selectedProducts.reduce((sum, p) => sum + p.printQuantity, 0)

  function toggleSelect(id: string) {
    setProducts(prev => prev.map(p =>
      p.id === id ? { ...p, selected: !p.selected } : p
    ))
  }

  function toggleSelectAll() {
    const allFilteredSelected = filteredProducts.every(p => p.selected)
    const filteredIds = new Set(filteredProducts.map(p => p.id))
    setProducts(prev => prev.map(p =>
      filteredIds.has(p.id) ? { ...p, selected: !allFilteredSelected } : p
    ))
  }

  function updateQuantity(id: string, delta: number) {
    setProducts(prev => prev.map(p =>
      p.id === id ? { ...p, printQuantity: Math.max(1, p.printQuantity + delta) } : p
    ))
  }

  function setQuantity(id: string, value: number) {
    setProducts(prev => prev.map(p =>
      p.id === id ? { ...p, printQuantity: Math.max(1, value) } : p
    ))
  }

  function generateBarcodeDataURL(code: string, format: 'EAN13' | 'CODE128' = 'EAN13'): string {
    const canvas = document.createElement('canvas')
    try {
      JsBarcode(canvas, code, {
        format: format,
        width: format === 'CODE128' ? 1.2 : 1.5,
        height: format === 'CODE128' ? 25 : 30,
        displayValue: true,
        fontSize: format === 'CODE128' ? 9 : 10,
        margin: 2,
        background: '#ffffff',
        textMargin: 1
      })
      return canvas.toDataURL('image/png')
    } catch {
      return ''
    }
  }

  function updateDymoPreview() {
    const canvas = previewCanvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Scala per preview (3x per nitidezza)
    const scale = 3
    const size = 96 * scale // 96px = 1" a 96dpi * 3
    canvas.width = size
    canvas.height = size

    // Background bianco
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, size, size)

    // Bordo etichetta (solo per preview)
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 1
    ctx.strokeRect(0.5, 0.5, size - 1, size - 1)

    const barcodeValue = customBarcode.trim()
    const textValue = customText.trim()

    if (!barcodeValue && !textValue) {
      // Placeholder
      ctx.fillStyle = '#9ca3af'
      ctx.font = `${12 * scale}px sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText('Inserisci codice', size / 2, size / 2)
      return
    }

    // Genera barcode Code 128
    if (barcodeValue) {
      try {
        const barcodeCanvas = document.createElement('canvas')
        JsBarcode(barcodeCanvas, barcodeValue, {
          format: 'CODE128',
          width: 1.5,
          height: 40,
          displayValue: true,
          fontSize: 11,
          margin: 0,
          background: '#ffffff',
          textMargin: 2
        })

        // Centra il barcode
        const barcodeWidth = Math.min(barcodeCanvas.width, size - 10 * scale)
        const barcodeHeight = (barcodeCanvas.height / barcodeCanvas.width) * barcodeWidth
        const x = (size - barcodeWidth) / 2
        const y = textValue ? 8 * scale : (size - barcodeHeight) / 2

        ctx.drawImage(barcodeCanvas, x, y, barcodeWidth, barcodeHeight)

        // Testo sotto il barcode
        if (textValue) {
          ctx.fillStyle = '#374151'
          ctx.font = `bold ${8 * scale}px sans-serif`
          ctx.textAlign = 'center'
          ctx.fillText(textValue.substring(0, 20), size / 2, size - 6 * scale)
        }
      } catch (e) {
        ctx.fillStyle = '#ef4444'
        ctx.font = `${10 * scale}px sans-serif`
        ctx.textAlign = 'center'
        ctx.fillText('Codice non valido', size / 2, size / 2)
      }
    } else if (textValue) {
      // Solo testo
      ctx.fillStyle = '#111827'
      ctx.font = `bold ${14 * scale}px sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText(textValue.substring(0, 15), size / 2, size / 2 + 5 * scale)
    }
  }

  async function generateDymoPDF() {
    if (!customBarcode.trim() && !customText.trim()) {
      alert('Inserisci un codice a barre o del testo')
      return
    }

    setGenerating(true)

    try {
      // PDF dimensione DYMO 1x1" (25.4mm x 25.4mm)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [DYMO_WIDTH, DYMO_HEIGHT]
      })

      for (let i = 0; i < dymoQuantity; i++) {
        if (i > 0) pdf.addPage([DYMO_WIDTH, DYMO_HEIGHT])

        const barcodeValue = customBarcode.trim()
        const textValue = customText.trim()

        if (barcodeValue) {
          // Genera barcode
          const barcodeCanvas = document.createElement('canvas')
          JsBarcode(barcodeCanvas, barcodeValue, {
            format: 'CODE128',
            width: 1.2,
            height: 35,
            displayValue: true,
            fontSize: 9,
            margin: 0,
            background: '#ffffff',
            textMargin: 1
          })

          const barcodeDataURL = barcodeCanvas.toDataURL('image/png')

          // Calcola dimensioni per centrare
          const maxBarcodeWidth = DYMO_WIDTH - 2
          const barcodeAspect = barcodeCanvas.height / barcodeCanvas.width
          const barcodeWidth = Math.min(maxBarcodeWidth, DYMO_WIDTH - 2)
          const barcodeHeight = barcodeWidth * barcodeAspect

          const x = (DYMO_WIDTH - barcodeWidth) / 2
          const y = textValue ? 1.5 : (DYMO_HEIGHT - barcodeHeight) / 2

          pdf.addImage(barcodeDataURL, 'PNG', x, y, barcodeWidth, barcodeHeight)

          // Testo aggiuntivo sotto
          if (textValue) {
            pdf.setFontSize(7)
            pdf.setFont('helvetica', 'bold')
            const textWidth = pdf.getTextWidth(textValue.substring(0, 20))
            pdf.text(textValue.substring(0, 20), (DYMO_WIDTH - textWidth) / 2, DYMO_HEIGHT - 1.5)
          }
        } else if (textValue) {
          // Solo testo grande centrato
          pdf.setFontSize(12)
          pdf.setFont('helvetica', 'bold')
          const textWidth = pdf.getTextWidth(textValue.substring(0, 12))
          pdf.text(textValue.substring(0, 12), (DYMO_WIDTH - textWidth) / 2, DYMO_HEIGHT / 2 + 2)
        }
      }

      const filename = customBarcode.trim() || customText.trim().replace(/\s+/g, '_')
      pdf.save(`dymo-${filename}-x${dymoQuantity}.pdf`)

    } catch (error) {
      console.error('Errore generazione PDF:', error)
      alert('Errore nella generazione del PDF')
    }

    setGenerating(false)
  }

  async function generatePDF() {
    if (selectedProducts.length === 0) return

    setGenerating(true)

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      // Prepara lista etichette da stampare
      const labelsToPrint: ProductWithQuantity[] = []
      selectedProducts.forEach(p => {
        for (let i = 0; i < p.printQuantity; i++) {
          labelsToPrint.push(p)
        }
      })

      let currentPage = 0
      let labelIndex = 0

      for (const product of labelsToPrint) {
        const pageIndex = Math.floor(labelIndex / LABELS_PER_PAGE)
        const positionOnPage = labelIndex % LABELS_PER_PAGE
        const col = positionOnPage % LABELS_PER_ROW
        const row = Math.floor(positionOnPage / LABELS_PER_ROW)

        // Nuova pagina se necessario
        if (pageIndex > currentPage) {
          pdf.addPage()
          currentPage = pageIndex
        }

        // Calcola posizione etichetta
        const x = MARGIN_LEFT + col * (LABEL_WIDTH + GAP_H)
        const y = MARGIN_TOP + row * (LABEL_HEIGHT + GAP_V)

        // Disegna etichetta
        drawLabel(pdf, product, x, y)

        labelIndex++
      }

      // Salva PDF
      const date = new Date().toISOString().slice(0, 10)
      pdf.save(`etichette-bp-${date}.pdf`)

    } catch (error) {
      console.error('Errore generazione PDF:', error)
      alert('Errore nella generazione del PDF')
    }

    setGenerating(false)
  }

  function drawLabel(pdf: jsPDF, product: ProductWithQuantity, x: number, y: number) {
    const padding = 1.5

    // SKU in alto a sinistra (grande e bold)
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'bold')
    pdf.text(product.sku || '', x + padding, y + 4)

    // Unità in alto a destra
    pdf.setFontSize(7)
    pdf.setFont('helvetica', 'normal')
    const unitText = `${product.quantity_per_package} ${product.unit}`
    const unitWidth = pdf.getTextWidth(unitText)
    pdf.text(unitText, x + LABEL_WIDTH - padding - unitWidth, y + 4)

    // Nome prodotto (troncato se troppo lungo)
    pdf.setFontSize(6)
    let name = product.name
    const maxWidth = LABEL_WIDTH - padding * 2
    while (pdf.getTextWidth(name) > maxWidth && name.length > 10) {
      name = name.slice(0, -4) + '...'
    }
    pdf.text(name, x + padding, y + 8)

    // Barcode
    if (product.barcode) {
      const barcodeDataURL = generateBarcodeDataURL(product.barcode)
      if (barcodeDataURL) {
        const barcodeWidth = 32
        const barcodeHeight = 10
        const barcodeX = x + (LABEL_WIDTH - barcodeWidth) / 2
        const barcodeY = y + 9.5
        pdf.addImage(barcodeDataURL, 'PNG', barcodeX, barcodeY, barcodeWidth, barcodeHeight)
      }
    }
  }

  async function generateSmallPDF() {
    if (selectedProducts.length === 0) return

    setGenerating(true)

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      // Prepara lista etichette da stampare
      const labelsToPrint: ProductWithQuantity[] = []
      selectedProducts.forEach(p => {
        for (let i = 0; i < p.printQuantity; i++) {
          labelsToPrint.push(p)
        }
      })

      let currentPage = 0
      let labelIndex = 0

      for (const product of labelsToPrint) {
        const pageIndex = Math.floor(labelIndex / SMALL_LABELS_PER_PAGE)
        const positionOnPage = labelIndex % SMALL_LABELS_PER_PAGE
        const col = positionOnPage % SMALL_LABELS_PER_ROW
        const row = Math.floor(positionOnPage / SMALL_LABELS_PER_ROW)

        // Nuova pagina se necessario
        if (pageIndex > currentPage) {
          pdf.addPage()
          currentPage = pageIndex
        }

        // Calcola posizione etichetta
        const x = SMALL_MARGIN_LEFT + col * (SMALL_LABEL_WIDTH + SMALL_GAP_H)
        const y = SMALL_MARGIN_TOP + row * (SMALL_LABEL_HEIGHT + SMALL_GAP_V)

        // Disegna etichetta
        drawSmallLabel(pdf, product, x, y)

        labelIndex++
      }

      // Salva PDF
      const date = new Date().toISOString().slice(0, 10)
      pdf.save(`etichette-small-${date}.pdf`)

    } catch (error) {
      console.error('Errore generazione PDF:', error)
      alert('Errore nella generazione del PDF')
    }

    setGenerating(false)
  }

  function drawSmallLabel(pdf: jsPDF, product: ProductWithQuantity, x: number, y: number) {
    const padding = 2

    // SKU in alto a sinistra (bold)
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'bold')
    pdf.text(product.sku || '', x + padding, y + 5)

    // Unità in alto a destra
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'normal')
    const unitText = `${product.quantity_per_package} ${product.unit}`
    const unitWidth = pdf.getTextWidth(unitText)
    pdf.text(unitText, x + SMALL_LABEL_WIDTH - padding - unitWidth, y + 5)

    // Nome prodotto (troncato se troppo lungo)
    pdf.setFontSize(7)
    let name = product.name
    const maxWidth = SMALL_LABEL_WIDTH - padding * 2
    while (pdf.getTextWidth(name) > maxWidth && name.length > 10) {
      name = name.slice(0, -4) + '...'
    }
    pdf.text(name, x + padding, y + 10)

    // Barcode - più grande per etichetta più larga
    if (product.barcode) {
      const barcodeDataURL = generateBarcodeDataURL(product.barcode)
      if (barcodeDataURL) {
        const barcodeWidth = 42
        const barcodeHeight = 12
        const barcodeX = x + (SMALL_LABEL_WIDTH - barcodeWidth) / 2
        const barcodeY = y + 11.5
        pdf.addImage(barcodeDataURL, 'PNG', barcodeX, barcodeY, barcodeWidth, barcodeHeight)
      }
    }
  }

  function selectProductForDymo(product: Product) {
    setCustomBarcode(product.sku || product.barcode || '')
    setCustomText(product.name.substring(0, 20))
  }

  const categories = [...new Set(products.map(p => p.category))]

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-50 to-cyan-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-cyan-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-500 to-cyan-500 text-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/" className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Tag className="w-6 h-6" />
                Stampa Etichette
              </h1>
              <p className="text-sky-100 text-sm">
                {printMode === 'dymo' ? 'DYMO 1"x1" - Code 128' : printMode === 'small' ? '48.5x25.4mm - 84 per foglio' : 'Foglio A4 - 65 per foglio'}
              </p>
            </div>
          </div>

          {/* Mode Toggle */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setPrintMode('dymo')}
              className={`flex-1 py-2.5 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors ${
                printMode === 'dymo'
                  ? 'bg-white text-sky-600'
                  : 'bg-white/20 hover:bg-white/30'
              }`}
            >
              <QrCode className="w-4 h-4" />
              DYMO 1"x1"
            </button>
            <button
              onClick={() => setPrintMode('small')}
              className={`flex-1 py-2.5 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors ${
                printMode === 'small'
                  ? 'bg-white text-sky-600'
                  : 'bg-white/20 hover:bg-white/30'
              }`}
            >
              <Tag className="w-4 h-4" />
              48.5x25.4
            </button>
            <button
              onClick={() => setPrintMode('avery')}
              className={`flex-1 py-2.5 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors ${
                printMode === 'avery'
                  ? 'bg-white text-sky-600'
                  : 'bg-white/20 hover:bg-white/30'
              }`}
            >
              <FileText className="w-4 h-4" />
              Foglio A4
            </button>
          </div>

          {printMode === 'dymo' ? (
            /* DYMO Mode Header */
            <div className="space-y-3">
              {/* Preview */}
              <div className="flex justify-center">
                <div className="bg-white rounded-xl p-3 shadow-lg">
                  <canvas
                    ref={previewCanvasRef}
                    className="w-24 h-24"
                    style={{ imageRendering: 'crisp-edges' }}
                  />
                  <p className="text-center text-xs text-gray-500 mt-1">25.4mm x 25.4mm</p>
                </div>
              </div>

              {/* Input Fields */}
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Codice a barre (es. SKU, codice prodotto)"
                  value={customBarcode}
                  onChange={(e) => setCustomBarcode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 rounded-xl text-gray-900 placeholder-gray-400 font-mono"
                />
                <input
                  type="text"
                  placeholder="Testo aggiuntivo (opzionale)"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  maxLength={20}
                  className="w-full px-4 py-3 rounded-xl text-gray-900 placeholder-gray-400"
                />
              </div>

              {/* Quantity & Print */}
              <div className="flex gap-2">
                <div className="flex items-center gap-2 bg-white/20 rounded-xl px-3">
                  <button
                    onClick={() => setDymoQuantity(Math.max(1, dymoQuantity - 1))}
                    className="p-1.5 hover:bg-white/20 rounded-lg"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={dymoQuantity}
                    onChange={(e) => setDymoQuantity(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                    className="w-12 bg-transparent text-center font-bold text-lg"
                  />
                  <button
                    onClick={() => setDymoQuantity(Math.min(100, dymoQuantity + 1))}
                    className="p-1.5 hover:bg-white/20 rounded-lg"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
                <button
                  onClick={generateDymoPDF}
                  disabled={generating || (!customBarcode.trim() && !customText.trim())}
                  className="flex-1 bg-white text-sky-600 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-sky-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {generating ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-sky-600" />
                  ) : (
                    <>
                      <Printer className="w-5 h-5" />
                      STAMPA {dymoQuantity} ETICHETT{dymoQuantity === 1 ? 'A' : 'E'}
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Avery / Small Mode Header */
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/20 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold">{selectedProducts.length}</div>
                  <div className="text-xs text-sky-100">Prodotti</div>
                </div>
                <div className="bg-white/20 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold">{totalLabels}</div>
                  <div className="text-xs text-sky-100">Etichette</div>
                </div>
                <div className="bg-white/20 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold">{Math.ceil(totalLabels / (printMode === 'small' ? SMALL_LABELS_PER_PAGE : LABELS_PER_PAGE))}</div>
                  <div className="text-xs text-sky-100">Pagine A4</div>
                </div>
              </div>

              <button
                onClick={() => printMode === 'small' ? generateSmallPDF() : generatePDF()}
                disabled={generating || selectedProducts.length === 0}
                className="w-full mt-4 bg-white text-sky-600 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-sky-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg text-lg"
              >
                {generating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-sky-600"></div>
                    Generazione in corso...
                  </>
                ) : selectedProducts.length === 0 ? (
                  <>
                    <Printer className="w-6 h-6" />
                    Seleziona prodotti da stampare
                  </>
                ) : (
                  <>
                    <Printer className="w-6 h-6" />
                    STAMPA PDF ({totalLabels} etichette)
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        {/* Search & Filter */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cerca per nome, SKU o barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-sky-500 text-sm bg-white"
          >
            <option value="all">Tutte</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
            ))}
          </select>
        </div>

        {printMode === 'avery' && (
          /* Select All - Only for Avery mode */
          <div className="flex items-center justify-between mb-3 px-1">
            <button
              onClick={toggleSelectAll}
              className="text-sm text-sky-600 hover:text-sky-700 font-medium flex items-center gap-1"
            >
              <Check className="w-4 h-4" />
              {filteredProducts.every(p => p.selected) ? 'Deseleziona tutti' : 'Seleziona tutti'}
            </button>
            <span className="text-sm text-gray-500">{filteredProducts.length} prodotti</span>
          </div>
        )}

        {printMode === 'dymo' && (
          <p className="text-sm text-gray-500 mb-3 px-1">
            Clicca su un prodotto per copiare SKU e nome
          </p>
        )}

        {/* Product List */}
        <div className="space-y-2">
          {filteredProducts.map(product => (
            <div
              key={product.id}
              onClick={() => printMode === 'dymo' && selectProductForDymo(product)}
              className={`bg-white rounded-xl border-2 transition-all ${
                printMode === 'dymo'
                  ? 'cursor-pointer hover:border-sky-300 border-transparent shadow-sm'
                  : product.selected
                    ? 'border-sky-500 shadow-md'
                    : 'border-transparent shadow-sm'
              }`}
            >
              <div className="p-3 flex items-center gap-3">
                {/* Checkbox - Only for Avery mode */}
                {printMode === 'avery' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleSelect(product.id)
                    }}
                    className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${
                      product.selected
                        ? 'bg-sky-500 border-sky-500 text-white'
                        : 'border-gray-300 hover:border-sky-400'
                    }`}
                  >
                    {product.selected && <Check className="w-4 h-4" />}
                  </button>
                )}

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-sky-600">{product.sku}</span>
                    <span className="text-xs text-gray-400">|</span>
                    <span className="text-xs text-gray-500">{product.quantity_per_package} {product.unit}</span>
                  </div>
                  <div className="text-sm text-gray-700 truncate">{product.name}</div>
                  <div className="text-xs text-gray-400 font-mono">{product.barcode}</div>
                </div>

                {/* Quantity Controls - Only for Avery mode when selected */}
                {printMode === 'avery' && product.selected && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        updateQuantity(product.id, -1)
                      }}
                      className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={product.printQuantity}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setQuantity(product.id, parseInt(e.target.value) || 1)}
                      className="w-12 h-8 text-center border rounded-lg text-sm font-medium"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        updateQuantity(product.id, 1)
                      }}
                      className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* DYMO quick select indicator */}
                {printMode === 'dymo' && (
                  <div className="text-sky-500">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nessun prodotto trovato</p>
          </div>
        )}
      </div>


      {/* Hidden canvas for barcode generation */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}
