'use client'

import { useEffect, useState, useRef, Suspense, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/auth-provider'
import { formatCurrency, formatNumber, cn } from '@/lib/utils'
import { Product, ProductType, ProductCategory, CATEGORY_ICONS, CATEGORY_LABELS, CATEGORIES_BY_TYPE, filterProductsByType } from '@/lib/types'
import {
  ArrowDownToLine,
  Search,
  Minus,
  Plus,
  Check,
  Loader2,
  Camera,
  X,
  ShieldAlert,
  Package,
  Sparkles,
  Wrench,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ScanBarcode
} from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } from '@zxing/library'
import { useBarcodeScanner, useIsMobile } from '@/hooks/useBarcodeScanner'

function CaricoContent() {
  const { user, isManager, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const productIdFromUrl = searchParams.get('product')
  const fromMovimenti = searchParams.get('from') === 'movimenti'
  const backUrl = fromMovimenti ? '/movimenti' : '/'
  const [products, setProducts] = useState<Product[]>([])
  const [recentProducts, setRecentProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [successData, setSuccessData] = useState<any>(null)
  const [showScanner, setShowScanner] = useState(false)
  const [scannerError, setScannerError] = useState<string | null>(null)
  const [productType, setProductType] = useState<ProductType>('all')
  const [expandedType, setExpandedType] = useState<ProductType | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null)
  const supabase = createClient()
  const [lastScannedBarcode, setLastScannedBarcode] = useState<string | null>(null)
  const isMobile = useIsMobile()

  // Hook per pistola barcode USB (funziona quando non c'è focus su input)
  const handleUsbBarcodeScan = useCallback((barcode: string) => {
    // Trova prodotto per barcode
    const foundProduct = products.find(p => p.barcode === barcode)
    if (foundProduct) {
      setSelectedProduct(foundProduct)
      setLastScannedBarcode(barcode)
      // Feedback visivo
      setTimeout(() => setLastScannedBarcode(null), 2000)
    } else {
      setScannerError(`Prodotto non trovato: ${barcode}`)
      setTimeout(() => setScannerError(null), 3000)
    }
  }, [products])

  useBarcodeScanner({
    onScan: handleUsbBarcodeScan,
    enabled: !selectedProduct && !showScanner && products.length > 0 && !isMobile,
    minLength: 5,
  })

  // Redirect managers - they cannot access movements
  useEffect(() => {
    if (!authLoading && isManager) {
      router.replace('/')
    }
  }, [isManager, authLoading, router])

  useEffect(() => {
    if (isManager) return // Skip data loading for managers

    let isMounted = true

    const load = async () => {
      try {
        const { products: loadedProducts } = await fetchData()
        // Auto-seleziona prodotto se passato via URL
        if (productIdFromUrl && loadedProducts && isMounted) {
          const preselected = loadedProducts.find((p: Product) => p.id === productIdFromUrl)
          if (preselected) {
            setSelectedProduct(preselected)
          }
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    load()

    return () => {
      isMounted = false
      stopScanner()
    }
  }, [productIdFromUrl, user?.id, isManager])

  const fetchData = async (): Promise<{ products: Product[] | null, recentProducts: Product[] | null }> => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (data) setProducts(data)

    // Fetch recent products used by current operator (last 30 days)
    let recentProductsData: Product[] = []
    if (user?.id && data) {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data: recentMovements } = await supabase
        .from('movements')
        .select('product_id, created_at')
        .eq('operator_id', user.id)
        .eq('type', 'carico')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false })

      if (recentMovements && recentMovements.length > 0) {
        const seenIds = new Set<string>()
        const uniqueProductIds: string[] = []
        for (const mov of recentMovements) {
          if (!seenIds.has(mov.product_id)) {
            seenIds.add(mov.product_id)
            uniqueProductIds.push(mov.product_id)
          }
        }

        const productsMap = new Map(data.map((p: Product) => [p.id, p]))
        recentProductsData = uniqueProductIds
          .map(id => productsMap.get(id))
          .filter((p): p is Product => p !== undefined)
          .slice(0, 10)
      }
    }

    setRecentProducts(recentProductsData)
    return { products: data, recentProducts: recentProductsData }
  }

  const handleBarcodeDetected = useCallback((barcode: string) => {
    const foundProduct = products.find(p => p.barcode === barcode)
    if (foundProduct) {
      setSelectedProduct(foundProduct)
      stopScanner()
    } else {
      setScannerError(`Prodotto non trovato: ${barcode}`)
      setTimeout(() => setScannerError(null), 3000)
    }
  }, [products])

  const startScanner = async () => {
    setShowScanner(true)
    setScannerError(null)

    try {
      const hints = new Map()
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_39,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
        BarcodeFormat.QR_CODE
      ])

      const codeReader = new BrowserMultiFormatReader(hints)
      codeReaderRef.current = codeReader

      const videoInputDevices = await codeReader.listVideoInputDevices()

      let selectedDeviceId = videoInputDevices[0]?.deviceId
      const backCamera = videoInputDevices.find(device =>
        device.label.toLowerCase().includes('back') ||
        device.label.toLowerCase().includes('rear') ||
        device.label.toLowerCase().includes('environment')
      )
      if (backCamera) {
        selectedDeviceId = backCamera.deviceId
      }

      if (!selectedDeviceId) {
        throw new Error('Nessuna fotocamera trovata')
      }

      await codeReader.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current!,
        (result) => {
          if (result) {
            const barcode = result.getText()
            console.log('Barcode detected:', barcode)
            handleBarcodeDetected(barcode)
          }
        }
      )
    } catch (err) {
      console.error('Scanner error:', err)
      setScannerError('Impossibile accedere alla fotocamera')
      setShowScanner(false)
    }
  }

  const stopScanner = useCallback(() => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset()
      codeReaderRef.current = null
    }
    setShowScanner(false)
    setScannerError(null)
  }, [])

  const filteredProducts = (() => {
    let filtered = products
    if (selectedCategory) {
      filtered = products.filter(p => p.category === selectedCategory)
    } else if (productType !== 'all') {
      filtered = filterProductsByType(products, productType)
    }
    return filtered.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode?.toLowerCase().includes(search.toLowerCase())
    )
  })()

  const handleTypeClick = (type: ProductType) => {
    if (type === 'all') {
      setProductType('all')
      setExpandedType(null)
      setSelectedCategory(null)
    } else if (expandedType === type) {
      setExpandedType(null)
      setSelectedCategory(null)
      setProductType(type)
    } else {
      setProductType(type)
      setExpandedType(type)
      setSelectedCategory(null)
    }
  }

  const handleCategoryClick = (category: ProductCategory) => {
    if (selectedCategory === category) {
      setSelectedCategory(null)
    } else {
      setSelectedCategory(category)
    }
  }

  const handleSubmit = async () => {
    if (!selectedProduct || !user) return

    setSubmitting(true)
    try {
      const { error } = await supabase.from('movements').insert({
        type: 'carico',
        product_id: selectedProduct.id,
        quantity: quantity,
        unit_cost_at_time: selectedProduct.unit_cost,
        operator_id: user.id
      })

      if (error) throw error

      setSuccessData({
        product: selectedProduct.name,
        quantity,
        total: quantity * selectedProduct.unit_cost,
        newStock: selectedProduct.current_stock + quantity
      })
      setShowSuccess(true)
      
      setSelectedProduct(null)
      setQuantity(1)
      setSearch('')
    } catch (error) {
      console.error('Error:', error)
      alert('Errore durante il carico')
    } finally {
      setSubmitting(false)
    }
  }

  // Show loading spinner while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    )
  }

  // Show access denied for managers
  if (isManager) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Accesso Negato</h1>
        <p className="text-gray-500 mb-4">Non hai i permessi per accedere ai movimenti.</p>
        <button
          onClick={() => router.push('/')}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl font-medium"
        >
          Torna alla Home
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Success screen
  if (showSuccess && successData) {
    return (
      <div className="min-h-screen">
        <header className="bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 text-white px-4 pt-12 pb-6 rounded-b-3xl">
          <div className="max-w-4xl mx-auto flex items-center gap-3">
            <ArrowDownToLine className="w-6 h-6" />
            <div>
              <h1 className="text-xl font-bold">Carico Merce</h1>
              <p className="text-emerald-100 text-sm">Operazione completata</p>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 -mt-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Carico Registrato!</h2>
            <p className="text-gray-600 mb-4">
              +{successData.quantity}x {successData.product}
            </p>
            <p className="text-lg text-gray-700">
              Nuova giacenza: <span className="font-bold text-emerald-600">{successData.newStock}</span>
            </p>
            <p className="text-2xl font-bold text-emerald-600 mt-2">
              {formatCurrency(successData.total)}
            </p>
            
            <div className="flex flex-col gap-3 mt-6">
              <button
                onClick={() => {
                  setShowSuccess(false)
                  setSuccessData(null)
                  fetchData()
                }}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 focus:ring-emerald-500 shadow-md hover:shadow-lg active:scale-[0.98] w-full"
              >
                Nuovo Carico
              </button>
              <button
                onClick={() => router.push('/movimenti')}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 border-2 border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50 focus:ring-gray-500 w-full"
              >
                Vai a Movimenti
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Product selection
  if (!selectedProduct) {
    return (
      <div className="min-h-screen">
        <header className="bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 text-white px-4 pt-12 pb-6 rounded-b-3xl">
          <div className="max-w-4xl mx-auto flex items-center gap-3">
            <Link href={backUrl} className="p-2 -ml-2 hover:bg-white/10 rounded-xl transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <ArrowDownToLine className="w-6 h-6" />
            <div>
              <h1 className="text-xl font-bold">Carico Merce</h1>
              <p className="text-emerald-100 text-sm">Scansiona o cerca prodotto</p>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 -mt-4 space-y-4">
          {/* USB Barcode Scanner indicator - solo su desktop */}
          {!isMobile && (
            <div className={cn(
              "flex items-center gap-3 p-4 rounded-2xl border-2 transition-all",
              lastScannedBarcode
                ? "bg-emerald-50 border-emerald-500"
                : "bg-blue-50 border-blue-200"
            )}>
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                lastScannedBarcode ? "bg-emerald-500 text-white" : "bg-blue-500 text-white"
              )}>
                <ScanBarcode className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">
                  {lastScannedBarcode ? 'Barcode rilevato!' : 'Pistola barcode pronta'}
                </p>
                <p className="text-sm text-gray-500">
                  {lastScannedBarcode
                    ? lastScannedBarcode
                    : 'Scansiona un prodotto con la pistola USB'}
                </p>
              </div>
              {lastScannedBarcode && (
                <Check className="w-6 h-6 text-emerald-500" />
              )}
            </div>
          )}

          {/* Camera Scanner area */}
          {showScanner ? (
            <div className="relative h-48 sm:h-56 md:h-64 max-w-md mx-auto bg-gray-900 rounded-2xl overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 sm:w-40 sm:h-40 border-2 border-cyan-400 rounded-xl relative">
                  <div className="scanner-line" />
                </div>
              </div>
              {scannerError && (
                <div className="absolute bottom-3 left-3 right-3 bg-red-500 text-white text-sm px-3 py-2 rounded-lg text-center">
                  {scannerError}
                </div>
              )}
              <button
                onClick={stopScanner}
                className="absolute top-3 right-3 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center"
              >
                <X className="w-4 h-4 text-white" />
              </button>
              <div className="absolute top-3 left-3 bg-black/50 text-white text-xs px-2 py-1 rounded">
                Inquadra il barcode
              </div>
            </div>
          ) : (
            <button
              onClick={startScanner}
              className={cn(
                "w-full max-w-md mx-auto bg-gray-800 rounded-2xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:bg-gray-700 transition-colors",
                isMobile ? "h-32" : "h-24"
              )}
            >
              <Camera className={isMobile ? "w-8 h-8" : "w-6 h-6"} />
              <span className={isMobile ? "text-sm" : "text-xs"}>
                {isMobile ? "Tocca per scansionare barcode" : "Oppure usa la fotocamera"}
              </span>
            </button>
          )}

          {/* Search */}
          <div>
            <p className="text-sm text-gray-500 mb-2">Oppure cerca manualmente</p>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Nome prodotto o barcode..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pl-12"
              />
            </div>

            {/* Product Type Filter */}
            <div className="space-y-2 mt-3">
              <div className="flex gap-2">
                <button
                  onClick={() => handleTypeClick('all')}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all',
                    productType === 'all' && !selectedCategory
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      : 'bg-white text-gray-600 border border-gray-200'
                  )}
                >
                  <Package className="w-4 h-4" />
                  Tutti
                </button>
                <button
                  onClick={() => handleTypeClick('consumabile')}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all',
                    productType === 'consumabile'
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'bg-white text-gray-600 border border-gray-200'
                  )}
                >
                  <Sparkles className="w-4 h-4" />
                  Pulizia
                  {expandedType === 'consumabile' ? (
                    <ChevronUp className="w-3 h-3 ml-1" />
                  ) : (
                    <ChevronDown className="w-3 h-3 ml-1" />
                  )}
                </button>
                <button
                  onClick={() => handleTypeClick('attrezzatura')}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all',
                    productType === 'attrezzatura'
                      ? 'bg-amber-100 text-amber-700 border border-amber-200'
                      : 'bg-white text-gray-600 border border-gray-200'
                  )}
                >
                  <Wrench className="w-4 h-4" />
                  Attrezz.
                  {expandedType === 'attrezzatura' ? (
                    <ChevronUp className="w-3 h-3 ml-1" />
                  ) : (
                    <ChevronDown className="w-3 h-3 ml-1" />
                  )}
                </button>
              </div>

              {/* Sottocategorie espandibili */}
              {expandedType && (
                <div className="flex flex-wrap gap-2 animate-slide-up">
                  {CATEGORIES_BY_TYPE[expandedType].map(category => (
                    <button
                      key={category}
                      onClick={() => handleCategoryClick(category)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                        selectedCategory === category
                          ? expandedType === 'consumabile'
                            ? 'bg-blue-500 text-white'
                            : 'bg-amber-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      )}
                    >
                      <span>{CATEGORY_ICONS[category]}</span>
                      {CATEGORY_LABELS[category]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent/filtered products */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
              {search || productType !== 'all' ? 'Risultati ricerca' : (recentProducts.length > 0 ? 'Caricati di recente' : 'Tutti i prodotti')}
            </h3>
            <div className="space-y-2">
              {(search || productType !== 'all' ? filteredProducts.slice(0, 15) : (recentProducts.length > 0 ? recentProducts : filteredProducts.slice(0, 10))).map(product => (
                <button
                  key={product.id}
                  onClick={() => setSelectedProduct(product)}
                  className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm transition-all duration-200 hover:shadow-md hover:border-gray-200 w-full text-left"
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-emerald-100">
                    {CATEGORY_ICONS[product.category]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 truncate">{product.name}</h4>
                    <p className="text-sm text-gray-500">
                      {formatCurrency(product.unit_cost)}/pz
                    </p>
                  </div>
                  <span className="font-bold text-gray-900">
                    {formatNumber(product.current_stock, 0)}
                  </span>
                </button>
              ))}

              {/* Show "all products" link if showing recent */}
              {!search && productType === 'all' && recentProducts.length > 0 && (
                <button
                  onClick={() => setSearch(' ')}
                  className="w-full p-3 text-center text-emerald-600 font-medium text-sm hover:bg-emerald-50 rounded-xl transition-colors"
                >
                  Mostra tutti i prodotti →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Quantity selection
  return (
    <div className="min-h-screen">
      <header className="bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 text-white px-4 pt-12 pb-6 rounded-b-3xl">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <ArrowDownToLine className="w-6 h-6" />
          <div>
            <h1 className="text-xl font-bold">Carico Merce</h1>
            <p className="text-emerald-100 text-sm truncate">{selectedProduct.name}</p>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 -mt-4 space-y-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Prodotto</p>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-2xl">
              {CATEGORY_ICONS[selectedProduct.category]}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{selectedProduct.name}</h3>
              <p className="text-sm text-gray-500">
                {formatCurrency(selectedProduct.unit_cost)}/pz • Giacenza attuale: {formatNumber(selectedProduct.current_stock, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">Quantità da Caricare</p>
          <div className="flex items-center justify-center gap-6">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-bold transition-all duration-200 active:scale-95 bg-red-100 text-red-600 hover:bg-red-200"
            >
              <Minus className="w-6 h-6" />
            </button>
            <span className="text-5xl font-bold text-gray-900 w-20 text-center">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-bold transition-all duration-200 active:scale-95 bg-emerald-100 text-emerald-600 hover:bg-emerald-200"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              Valore: <span className="font-semibold text-emerald-600">{formatCurrency(quantity * selectedProduct.unit_cost)}</span>
            </p>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => {
              setSelectedProduct(null)
              setQuantity(1)
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50 focus:ring-gray-500 flex-1"
          >
            Annulla
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 focus:ring-emerald-500 shadow-md hover:shadow-lg active:scale-[0.98] flex-1"
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Check className="w-5 h-5" />
                Conferma
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CaricoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <CaricoContent />
    </Suspense>
  )
}
