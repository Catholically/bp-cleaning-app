'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/auth-provider'
import { formatCurrency, cn } from '@/lib/utils'
import { Worksite } from '@/lib/types'
import { Building2, Plus, MapPin, Search, X, ChevronLeft, Loader2, Users, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface WorksiteWithCosts extends Worksite {
  monthly_cost?: number
  workers?: Array<{ id: string; full_name: string }>
}

function CantieriContent() {
  const { isSuperuser } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const fromImpostazioni = searchParams.get('from') === 'impostazioni'
  const backUrl = fromImpostazioni ? '/impostazioni' : '/'

  const [worksites, setWorksites] = useState<WorksiteWithCosts[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGroup, setSelectedGroup] = useState('')
  const [expandedWorksites, setExpandedWorksites] = useState<Set<string>>(new Set())
  const supabase = createClient()

  useEffect(() => {
    fetchWorksites()
  }, [])

  const fetchWorksites = async () => {
    // Get worksites
    const { data: wsData } = await supabase
      .from('worksites')
      .select('*')
      .order('status')
      .order('code')

    if (wsData) {
      // Get monthly costs per worksite
      const monthStart = new Date()
      monthStart.setDate(1)
      monthStart.setHours(0, 0, 0, 0)

      const { data: costsData } = await supabase
        .from('movements')
        .select('worksite_id, total_cost')
        .eq('type', 'scarico')
        .gte('created_at', monthStart.toISOString())

      const costsByWorksite = (costsData || []).reduce((acc: Record<string, number>, m: any) => {
        if (m.worksite_id) {
          acc[m.worksite_id] = (acc[m.worksite_id] || 0) + (m.total_cost || 0)
        }
        return acc
      }, {} as Record<string, number>)

      // Get workers for each worksite
      const { data: assignmentsData } = await supabase
        .from('worker_assignments')
        .select(`
          worksite_id,
          workers (
            id,
            full_name
          )
        `)

      const workersByWorksite = (assignmentsData || []).reduce((acc: Record<string, any[]>, a: any) => {
        if (a.worksite_id && a.workers) {
          if (!acc[a.worksite_id]) acc[a.worksite_id] = []
          acc[a.worksite_id].push(a.workers)
        }
        return acc
      }, {} as Record<string, any[]>)

      setWorksites(wsData.map((ws: Worksite) => ({
        ...ws,
        monthly_cost: costsByWorksite[ws.id] || 0,
        workers: workersByWorksite[ws.id] || []
      })))
    }
    setLoading(false)
  }

  const toggleWorksiteExpansion = (id: string) => {
    setExpandedWorksites(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // Get unique groups
  const groups = [...new Set(worksites.map(w => w.client_group).filter(Boolean))].sort()

  // Filter worksites by search query and group
  const filteredWorksites = worksites.filter(w => {
    const matchesSearch = !searchQuery.trim() || (
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.city?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    const matchesGroup = !selectedGroup || w.client_group === selectedGroup
    return matchesSearch && matchesGroup
  })

  const activeWorksites = filteredWorksites.filter(w => w.status === 'active')
  const otherWorksites = filteredWorksites.filter(w => w.status !== 'active')

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <header className="bg-gradient-to-r from-violet-500 via-purple-600 to-indigo-600 text-white px-4 pt-12 pb-6 rounded-b-3xl">
        <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <Link href={backUrl} className="p-2 -ml-2 hover:bg-white/10 rounded-xl transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <Building2 className="w-6 h-6" />
          <div>
            <h1 className="text-xl font-bold">Cantieri</h1>
            <p className="text-purple-100 text-sm">{worksites.length} cantieri totali</p>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300" />
          <input
            type="text"
            placeholder="Cerca cantiere..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-white/30"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full"
            >
              <X className="w-4 h-4 text-purple-200" />
            </button>
          )}
        </div>

        {/* Group filter */}
        {groups.length > 0 && (
          <div>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white/30"
            >
              <option value="">Tutti i gruppi</option>
              {groups.map(group => (
                <option key={group} value={group} className="text-gray-900">{group}</option>
              ))}
            </select>
          </div>
        )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 -mt-4 space-y-4 pb-24">
        {/* Active worksites */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Attivi ({activeWorksites.length})
          </h3>
          <div className="space-y-3">
            {activeWorksites.map((ws, index) => {
              const isExpanded = expandedWorksites.has(ws.id)
              const hasWorkers = ws.workers && ws.workers.length > 0

              return (
                <div
                  key={ws.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 animate-slide-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <Link href={`/cantieri/${ws.id}`} className="block">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="badge-info text-xs">{ws.code}</span>
                        <h3 className="font-semibold text-gray-900 mt-1">{ws.name}</h3>
                      </div>
                      <p className="text-xl font-bold text-violet-600">
                        {formatCurrency(ws.monthly_cost || 0)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <MapPin className="w-4 h-4" />
                      {ws.address}, {ws.city}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">questo mese</p>
                  </Link>

                  {/* Workers section */}
                  {hasWorkers && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          toggleWorksiteExpansion(ws.id)
                        }}
                        className="w-full flex items-center justify-between text-sm font-medium text-gray-700 hover:text-violet-600 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>{ws.workers!.length} {ws.workers!.length === 1 ? 'lavoratore' : 'lavoratori'}</span>
                        </div>
                        <ChevronDown className={cn(
                          "w-4 h-4 transition-transform",
                          isExpanded && "rotate-180"
                        )} />
                      </button>

                      {isExpanded && (
                        <div className="mt-2 space-y-1 animate-fade-in">
                          {ws.workers!.map((worker) => (
                            <div
                              key={worker.id}
                              className="text-sm text-gray-600 pl-6 py-1"
                            >
                              • {worker.full_name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Other worksites */}
        {otherWorksites.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Non attivi ({otherWorksites.length})
            </h3>
            <div className="space-y-2">
              {otherWorksites.map(ws => (
                <Link
                  key={ws.id}
                  href={`/cantieri/${ws.id}`}
                  className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm transition-all duration-200 hover:shadow-md hover:border-gray-200 opacity-60"
                >
                  <div className="flex-1">
                    <span className="badge-neutral text-xs">{ws.code}</span>
                    <p className="font-medium text-gray-900">{ws.name}</p>
                  </div>
                  <span className={cn(
                    'badge',
                    ws.status === 'paused' ? 'badge-warning' : 'badge-neutral'
                  )}>
                    {ws.status === 'paused' ? 'In pausa' : 'Completato'}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {filteredWorksites.length === 0 && searchQuery && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4 text-gray-400">
              <Search className="w-8 h-8" />
            </div>
            <p className="text-lg font-semibold text-gray-900 mb-2">Nessun risultato</p>
            <p className="text-sm text-gray-500 max-w-sm">
              Nessun cantiere trovato per "{searchQuery}"
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-4 text-violet-600 font-medium"
            >
              Cancella ricerca
            </button>
          </div>
        )}

        {worksites.length === 0 && !searchQuery && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4 text-gray-400">
              <Building2 className="w-8 h-8" />
            </div>
            <p className="text-lg font-semibold text-gray-900 mb-2">Nessun cantiere</p>
            <p className="text-sm text-gray-500 max-w-sm">
              Aggiungi il primo cantiere per iniziare
            </p>
          </div>
        )}
      </div>

      {isSuperuser && (
        <Link href="/cantieri/nuovo" className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-xl flex items-center justify-center z-50 hover:from-blue-700 hover:to-blue-800 active:scale-95 transition-all duration-200 bg-gradient-to-r from-violet-600 to-purple-600">
          <Plus className="w-6 h-6" />
        </Link>
      )}
    </div>
  )
}

export default function CantieriPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
      </div>
    }>
      <CantieriContent />
    </Suspense>
  )
}
