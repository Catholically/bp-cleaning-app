'use client'

import { useEffect, useState, useRef, Suspense, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/auth-provider'
import { formatCurrency, formatNumber, cn } from '@/lib/utils'
import { Product, Worksite, ProductType, ProductCategory, CATEGORY_ICONS, CATEGORY_LABELS, CATEGORIES_BY_TYPE, filterProductsByType } from '@/lib/types'
import {
  ArrowUpFromLine,
  Camera,
  Search,
  Minus,
  Plus,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Loader2,
  ShieldAlert,
  Package,
  Sparkles,
  Wrench
} from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } from '@zxing/library'

function ScaricoContent() {
  const { user, profile, isManager, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const productIdFromUrl = searchParams.get('product')
  const cantiereIdFromUrl = searchParams.get('cantiere')
  const [products, setProducts] = useState<Product[]>([])
  const [recentProducts, setRecentProducts] = useState<Product[]>([])
  const [worksites, setWorksites] = useState<Worksite[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [productType, setProductType] = useState<ProductType>('all')
  const [expandedType, setExpandedType] = useState<ProductType | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedWorksite, setSelectedWorksite] = useState<Worksite | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [successData, setSuccessData] = useState<any>(null)
  const [showWorksiteSelect, setShowWorksiteSelect] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [scannerError, setScannerError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null)
  const supabase = createClient()

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
        const { products: loadedProducts, worksites: loadedWorksites, recentProducts: loadedRecent } = await fetchData()

        // Auto-seleziona prodotto se passato via URL
        if (productIdFromUrl && loadedProducts && isMounted) {
          const preselectedProduct = loadedProducts.find((p: Product) => p.id === productIdFromUrl)
          if (preselectedProduct) {
            setSelectedProduct(preselectedProduct)
          }
        }

        // Auto-seleziona cantiere se passato via URL
        if (cantiereIdFromUrl && loadedWorksites && isMounted) {
          const preselectedWorksite = loadedWorksites.find((w: Worksite) => w.id === cantiereIdFromUrl)
          if (preselectedWorksite) {
            setSelectedWorksite(preselectedWorksite)
          }
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    load()

    // Cleanup camera and barcode reader on unmount
    return () => {
      isMounted = false
      stopScanner()
    }
  }, [productIdFromUrl, cantiereIdFromUrl, user?.id, isManager])

  const fetchData = async (): Promise<{ products: Product[] | null, worksites: Worksite[] | null, recentProducts: Product[] | null }> => {
    const [productsRes, worksitesRes] = await Promise.all([
      supabase.from('products').select('*').eq('is_active', true).order('name'),
      supabase.from('worksites').select('*').eq('status', 'active').order('code')
    ])

    if (productsRes.data) setProducts(productsRes.data)
    if (worksitesRes.data) setWorksites(worksitesRes.data)

    // Fetch recent products used by current operator (last 30 days)
    let recentProductsData: Product[] = []
    if (user?.id && productsRes.data) {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data: recentMovements } = await supabase
        .from('movements')
        .select('product_id, created_at')
        .eq('operator_id', user.id)
        .eq('type', 'scarico')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false })

      if (recentMovements && recentMovements.length > 0) {
        // Get unique product IDs in order of most recent usage
        const seenIds = new Set<string>()
        const uniqueProductIds: string[] = []
        for (const mov of recentMovements) {
          if (!seenIds.has(mov.product_id)) {
            seenIds.add(mov.product_id)
            uniqueProductIds.push(mov.product_id)
          }
        }

        // Map to actual products, keeping the recent order
        const productsMap = new Map(productsRes.data.map((p: Product) => [p.id, p]))
        recentProductsData = uniqueProductIds
          .map(id => productsMap.get(id))
          .filter((p): p is Product => p !== undefined)
          .slice(0, 10)
      }
    }

    setRecentProducts(recentProductsData)
    return { products: productsRes.data, worksites: worksitesRes.data, recentProducts: recentProductsData }
  }

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
    if (!selectedProduct || !selectedWorksite || !user) return

    setSubmitting(true)
    try {
      // Verifica stock attuale prima di procedere (previene stock negativo)
      const { data: freshProduct, error: fetchError } = await supabase
        .from('products')
        .select('current_stock')
        .eq('id', selectedProduct.id)
        .single()

      if (fetchError) throw fetchError

      if (freshProduct.current_stock < quantity) {
        alert(`Stock insufficiente! Disponibili solo ${freshProduct.current_stock} unità.`)
        // Aggiorna il prodotto selezionato con lo stock corretto
        setSelectedProduct({ ...selectedProduct, current_stock: freshProduct.current_stock })
        setQuantity(Math.min(quantity, freshProduct.current_stock))
        setSubmitting(false)
        return
      }

      const { error } = await supabase.from('movements').insert({
        type: 'scarico',
        product_id: selectedProduct.id,
        worksite_id: selectedWorksite.id,
        quantity: quantity,
        unit_cost_at_time: selectedProduct.unit_cost,
        operator_id: user.id
      })

      if (error) throw error

      setSuccessData({
        product: selectedProduct.name,
        quantity,
        worksite: `${selectedWorksite.code} ${selectedWorksite.name}`,
        total: quantity * selectedProduct.unit_cost
      })
      setShowSuccess(true)

      // Reset
      setSelectedProduct(null)
      setQuantity(1)
      setSearch('')
    } catch (error) {
      console.error('Error:', error)
      alert('Errore durante lo scarico')
    } finally {
      setSubmitting(false)
    }
  }

  const handleBarcodeDetected = useCallback((barcode: string) => {
    // Find product by barcode
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
      // Configure barcode reader for common formats
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

      // Get available video devices
      const videoInputDevices = await codeReader.listVideoInputDevices()

      // Prefer back camera
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

      // Start continuous decoding
      await codeReader.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current!,
        (result, error) => {
          if (result) {
            const barcode = result.getText()
            console.log('Barcode detected:', barcode)
            handleBarcodeDetected(barcode)
          }
          // Ignore errors during scanning (they're expected when no barcode is visible)
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

  // Show loading spinner while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
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
        <div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Success screen
  if (showSuccess && successData) {
    return (
      <div className="min-h-screen">
        <header className="bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 text-white px-4 pt-12 pb-6 rounded-b-3xl">
          <div className="flex items-center gap-3">
            <ArrowUpFromLine className="w-6 h-6" />
            <div>
              <h1 className="text-xl font-bold">Scarico Merce</h1>
              <p className="text-orange-100 text-sm">Operazione completata</p>
            </div>
          </div>
        </header>

        <div className="px-4 -mt-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Scarico Registrato!</h2>
            <p className="text-gray-600 mb-4">
              {successData.quantity}x {successData.product}<br />
              → {successData.worksite}
            </p>
            <p className="text-2xl font-bold text-emerald-600">
              {formatCurrency(successData.total)}
            </p>
            
            <div className="flex flex-col gap-3 mt-6">
              <button
                onClick={() => {
                  setShowSuccess(false)
                  setSuccessData(null)
                }}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 focus:ring-orange-500 shadow-md hover:shadow-lg active:scale-[0.98] w-full"
              >
                Nuovo Scarico
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

  // Product selection screen
  if (!selectedProduct) {
    return (
      <div className="min-h-screen">
        <header className="bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 text-white px-4 pt-12 pb-6 rounded-b-3xl">
          <div className="flex items-center gap-3">
            <ArrowUpFromLine className="w-6 h-6" />
            <div>
              <h1 className="text-xl font-bold">Scarico Merce</h1>
              <p className="text-orange-100 text-sm">Scansiona o cerca prodotto</p>
            </div>
          </div>
        </header>

        <div className="px-4 -mt-4 space-y-4">
          {/* Scanner area */}
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
              className="w-full h-32 sm:h-40 max-w-md mx-auto bg-gray-800 rounded-2xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:bg-gray-700 transition-colors"
            >
              <Camera className="w-8 h-8" />
              <span className="text-sm">Tocca per scansionare barcode</span>
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
          </div>

          {/* Filtro tipo prodotto */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <button
                onClick={() => handleTypeClick('all')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all',
                  productType === 'all' && !selectedCategory
                    ? 'bg-orange-100 text-orange-700 border border-orange-200'
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
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
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
                    ? 'bg-violet-100 text-violet-700 border border-violet-200'
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
                          ? 'bg-emerald-500 text-white'
                          : 'bg-violet-500 text-white'
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

          {/* Recent/filtered products */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
              {search || productType !== 'all' ? 'Risultati' : (recentProducts.length > 0 ? 'Usati di recente' : 'Tutti i prodotti')}
            </h3>
            <div className="space-y-2">
              {(search || productType !== 'all' ? filteredProducts.slice(0, 15) : (recentProducts.length > 0 ? recentProducts : filteredProducts.slice(0, 10))).map(product => (
                <button
                  key={product.id}
                  onClick={() => setSelectedProduct(product)}
                  className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm transition-all duration-200 hover:shadow-md hover:border-gray-200 w-full text-left"
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-orange-100">
                    {CATEGORY_ICONS[product.category]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 truncate">{product.name}</h4>
                    <p className="text-sm text-gray-500">
                      {product.quantity_per_package}{product.unit} • {formatCurrency(product.unit_cost)}
                    </p>
                  </div>
                  <span className={cn(
                    'font-bold',
                    product.current_stock <= product.min_stock ? 'text-red-500' : 'text-emerald-500'
                  )}>
                    {formatNumber(product.current_stock, 0)}
                  </span>
                </button>
              ))}

              {/* Show "all products" link if showing recent */}
              {!search && productType === 'all' && recentProducts.length > 0 && (
                <button
                  onClick={() => setSearch(' ')}
                  className="w-full p-3 text-center text-orange-600 font-medium text-sm hover:bg-orange-50 rounded-xl transition-colors"
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

  // Quantity selection screen
  return (
    <div className="min-h-screen">
      <header className="bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 text-white px-4 pt-12 pb-6 rounded-b-3xl">
        <div className="flex items-center gap-3">
          <ArrowUpFromLine className="w-6 h-6" />
          <div>
            <h1 className="text-xl font-bold">Scarico Merce</h1>
            <p className="text-orange-100 text-sm truncate">{selectedProduct.name}</p>
          </div>
        </div>
      </header>

      <div className="px-4 -mt-4 space-y-4">
        {/* Product card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Prodotto Selezionato</p>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-2xl">
              🧴
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{selectedProduct.name}</h3>
              <p className="text-sm text-gray-500">
                Barcode: {selectedProduct.barcode || 'N/A'}
              </p>
              <p className="text-sm text-gray-500">
                {selectedProduct.quantity_per_package} {selectedProduct.unit} • {formatCurrency(selectedProduct.unit_cost)}/pz
              </p>
            </div>
          </div>
        </div>

        {/* Quantity selector */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">Quantità da Scaricare</p>
          <div className="flex items-center justify-center gap-6">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-bold transition-all duration-200 active:scale-95 bg-red-100 text-red-600 hover:bg-red-200"
            >
              <Minus className="w-6 h-6" />
            </button>
            <span className="text-5xl font-bold text-gray-900 w-20 text-center">{quantity}</span>
            <button
              onClick={() => setQuantity(Math.min(selectedProduct.current_stock, quantity + 1))}
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-bold transition-all duration-200 active:scale-95 bg-emerald-100 text-emerald-600 hover:bg-emerald-200"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              Disponibili: <span className="font-semibold">{formatNumber(selectedProduct.current_stock, 0)}</span> • 
              Costo: <span className="font-semibold text-orange-600">{formatCurrency(quantity * selectedProduct.unit_cost)}</span>
            </p>
          </div>
        </div>

        {/* Worksite selector */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Cantiere destinazione *</p>
          <button
            onClick={() => setShowWorksiteSelect(true)}
            className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-xl"
          >
            {selectedWorksite ? (
              <div className="text-left">
                <p className="font-semibold text-gray-900">{selectedWorksite.code} - {selectedWorksite.name}</p>
                <p className="text-sm text-gray-500">{selectedWorksite.address}, {selectedWorksite.city}</p>
              </div>
            ) : (
              <span className="text-gray-400">Seleziona cantiere...</span>
            )}
            <ChevronDown className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Action buttons */}
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
            disabled={!selectedWorksite || submitting}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 focus:ring-orange-500 shadow-md hover:shadow-lg active:scale-[0.98] flex-1"
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

      {/* Worksite selector modal */}
      {showWorksiteSelect && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-4 max-h-[70vh] overflow-auto animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Seleziona Cantiere</h3>
              <button onClick={() => setShowWorksiteSelect(false)}>
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            <div className="space-y-2">
              {worksites.map(ws => (
                <button
                  key={ws.id}
                  onClick={() => {
                    setSelectedWorksite(ws)
                    setShowWorksiteSelect(false)
                  }}
                  className={cn(
                    'w-full p-4 rounded-xl text-left transition-all',
                    selectedWorksite?.id === ws.id
                      ? 'bg-orange-100 border-2 border-orange-500'
                      : 'bg-gray-50 border-2 border-transparent'
                  )}
                >
                  <p className="font-semibold text-gray-900">{ws.code} - {ws.name}</p>
                  <p className="text-sm text-gray-500">{ws.address}, {ws.city}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ScaricoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ScaricoContent />
    </Suspense>
  )
}
