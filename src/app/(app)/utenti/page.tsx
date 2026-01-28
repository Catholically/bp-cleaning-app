'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useAuth } from '@/components/providers/auth-provider'
import { Profile, UserRole, Worksite, UserWorksite } from '@/lib/types'
import {
  Users,
  Search,
  X,
  Shield,
  User,
  Edit,
  ArrowLeft,
  Save,
  Loader2,
  Mail,
  Calendar,
  Building2,
  Plus,
  Check,
  Briefcase
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

const ROLE_CONFIG = {
  superuser: {
    label: 'Amministratore',
    description: 'Accesso completo al sistema',
    color: 'violet',
    icon: Shield
  },
  manager: {
    label: 'Data Manager',
    description: 'Gestisce prodotti, fornitori e cantieri',
    color: 'amber',
    icon: Briefcase
  },
  user: {
    label: 'Operatore',
    description: 'Movimenti sui cantieri assegnati',
    color: 'blue',
    icon: User
  }
}

export default function UtentiPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isSuperuser, profile: currentProfile } = useAuth()

  const fromImpostazioni = searchParams.get('from') === 'impostazioni'
  const backUrl = fromImpostazioni ? '/impostazioni' : '/'
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [worksites, setWorksites] = useState<Worksite[]>([])
  const [userWorksites, setUserWorksites] = useState<UserWorksite[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'info' | 'cantieri'>('info')
  const [selectedWorksites, setSelectedWorksites] = useState<string[]>([])
  const [worksiteSearch, setWorksiteSearch] = useState('')
  const supabase = createClient()

  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    role: 'user' as UserRole
  })

  useEffect(() => {
    if (!isSuperuser) {
      router.push('/impostazioni')
      return
    }
    fetchData()
  }, [isSuperuser])

  const fetchData = async () => {
    const [profilesRes, worksitesRes, userWorksitesRes] = await Promise.all([
      supabase.from('profiles').select('*').order('role').order('full_name'),
      supabase.from('worksites').select('*').eq('status', 'active').order('name'),
      supabase.from('user_worksites').select('*, worksite:worksites(*), user:profiles(*)')
    ])

    if (profilesRes.data) setProfiles(profilesRes.data)
    if (worksitesRes.data) setWorksites(worksitesRes.data)
    if (userWorksitesRes.data) setUserWorksites(userWorksitesRes.data)
    setLoading(false)
  }

  const handleEdit = (profile: Profile) => {
    setEditingProfile(profile)
    setFormData({
      email: profile.email,
      full_name: profile.full_name,
      role: profile.role
    })
    const assigned = userWorksites
      .filter(uw => uw.user_id === profile.id)
      .map(uw => uw.worksite_id)
    setSelectedWorksites(assigned)
    setActiveTab('info')
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.full_name.trim() || !editingProfile) return

    setSaving(true)

    // Update profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: formData.full_name.trim(),
        role: formData.role
      })
      .eq('id', editingProfile.id)

    if (profileError) {
      alert('Errore durante il salvataggio: ' + profileError.message)
      setSaving(false)
      return
    }

    // Update worksite assignments (only for user and manager roles)
    if (formData.role !== 'superuser') {
      // Delete existing assignments
      await supabase
        .from('user_worksites')
        .delete()
        .eq('user_id', editingProfile.id)

      // Insert new assignments
      if (selectedWorksites.length > 0) {
        const assignments = selectedWorksites.map(wsId => ({
          user_id: editingProfile.id,
          worksite_id: wsId
        }))
        await supabase.from('user_worksites').insert(assignments)
      }
    }

    setShowForm(false)
    fetchData()
    setSaving(false)
  }

  const toggleWorksite = (worksiteId: string) => {
    setSelectedWorksites(prev =>
      prev.includes(worksiteId)
        ? prev.filter(id => id !== worksiteId)
        : [...prev, worksiteId]
    )
  }

  const getUserWorksiteCount = (userId: string) => {
    return userWorksites.filter(uw => uw.user_id === userId).length
  }

  const filteredProfiles = profiles.filter(p => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      p.full_name.toLowerCase().includes(query) ||
      p.email.toLowerCase().includes(query)
    )
  })

  const filteredWorksites = worksites.filter(w => {
    if (!worksiteSearch.trim()) return true
    const query = worksiteSearch.toLowerCase()
    return (
      w.name.toLowerCase().includes(query) ||
      w.code.toLowerCase().includes(query) ||
      w.city?.toLowerCase().includes(query)
    )
  })

  const superusers = filteredProfiles.filter(p => p.role === 'superuser')
  const managers = filteredProfiles.filter(p => p.role === 'manager')
  const users = filteredProfiles.filter(p => p.role === 'user')

  if (!isSuperuser) return null

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Form view
  if (showForm && editingProfile) {
    const roleConfig = ROLE_CONFIG[formData.role]
    const RoleIcon = roleConfig.icon

    return (
      <div className="min-h-screen pb-24">
        <header className="bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 text-white px-4 pt-12 pb-6 rounded-b-3xl">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => setShowForm(false)}
              className="p-2 -ml-2 hover:bg-white/10 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="text-blue-100">Modifica Utente</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
              <RoleIcon className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{formData.full_name || 'Modifica'}</h1>
              <p className="text-blue-100 text-sm">{formData.email}</p>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="px-4 -mt-4 mb-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-1 flex">
            <button
              onClick={() => setActiveTab('info')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-colors ${
                activeTab === 'info'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Informazioni
            </button>
            {formData.role !== 'superuser' && (
              <button
                onClick={() => setActiveTab('cantieri')}
                className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  activeTab === 'cantieri'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Cantieri
                {selectedWorksites.length > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    activeTab === 'cantieri' ? 'bg-white/20' : 'bg-blue-100 text-blue-600'
                  }`}>
                    {selectedWorksites.length}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-4 space-y-4">
          {activeTab === 'info' ? (
            <>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email (non modificabile)
                </label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-500 bg-gray-50"
                />
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Es. Mario Rossi"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Ruolo
                </label>
                <div className="space-y-2">
                  {(Object.entries(ROLE_CONFIG) as [UserRole, typeof ROLE_CONFIG.superuser][]).map(([role, config]) => {
                    const Icon = config.icon
                    const isDisabled = editingProfile.id === currentProfile?.id && role !== formData.role
                    return (
                      <label
                        key={role}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          formData.role === role
                            ? `border-${config.color}-500 bg-${config.color}-50`
                            : 'border-gray-100 hover:border-gray-200'
                        } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <input
                          type="radio"
                          name="role"
                          value={role}
                          checked={formData.role === role}
                          onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                          disabled={isDisabled}
                          className="sr-only"
                        />
                        <div className={`w-10 h-10 rounded-xl bg-${config.color}-100 flex items-center justify-center`}>
                          <Icon className={`w-5 h-5 text-${config.color}-600`} />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{config.label}</p>
                          <p className="text-xs text-gray-500">{config.description}</p>
                        </div>
                        {formData.role === role && (
                          <div className={`w-6 h-6 rounded-full bg-${config.color}-500 flex items-center justify-center`}>
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </label>
                    )
                  })}
                </div>
                {editingProfile.id === currentProfile?.id && (
                  <p className="text-xs text-gray-500 mt-3">
                    Non puoi modificare il tuo ruolo
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Worksite search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cerca cantiere..."
                  value={worksiteSearch}
                  onChange={(e) => setWorksiteSearch(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {worksiteSearch && (
                  <button
                    type="button"
                    onClick={() => setWorksiteSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </div>

              {/* Selected count */}
              <div className="flex items-center justify-between px-1">
                <span className="text-sm text-gray-500">
                  {selectedWorksites.length} cantieri selezionati
                </span>
                {selectedWorksites.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedWorksites([])}
                    className="text-sm text-red-600 font-medium"
                  >
                    Rimuovi tutti
                  </button>
                )}
              </div>

              {/* Worksites list */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden max-h-96 overflow-y-auto">
                {filteredWorksites.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    Nessun cantiere trovato
                  </div>
                ) : (
                  filteredWorksites.map((worksite, index) => {
                    const isSelected = selectedWorksites.includes(worksite.id)
                    return (
                      <button
                        key={worksite.id}
                        type="button"
                        onClick={() => toggleWorksite(worksite.id)}
                        className={`w-full flex items-center gap-3 p-3 text-left transition-colors ${
                          index !== filteredWorksites.length - 1 ? 'border-b border-gray-100' : ''
                        } ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          isSelected ? 'bg-blue-500' : 'bg-gray-100'
                        }`}>
                          {isSelected ? (
                            <Check className="w-5 h-5 text-white" />
                          ) : (
                            <Building2 className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{worksite.name}</p>
                          <p className="text-xs text-gray-500 truncate">
                            {worksite.code} • {worksite.city}
                          </p>
                        </div>
                      </button>
                    )
                  })
                )}
              </div>

              <div className="bg-amber-50 rounded-2xl border border-amber-100 p-4">
                <p className="text-sm text-amber-800">
                  <strong>Nota:</strong> L'utente potrà accedere solo ai cantieri selezionati.
                  {formData.role === 'user' && ' Gli operatori potranno registrare movimenti solo su questi cantieri.'}
                  {formData.role === 'manager' && ' I manager potranno modificare solo questi cantieri.'}
                </p>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={saving || !formData.full_name.trim()}
            className="w-full flex items-center justify-center gap-2 p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
        </form>
      </div>
    )
  }

  // List view
  const renderUserCard = (profile: Profile, index: number, offsetIndex: number = 0) => {
    const config = ROLE_CONFIG[profile.role]
    const Icon = config.icon
    const worksiteCount = getUserWorksiteCount(profile.id)

    return (
      <div
        key={profile.id}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 animate-slide-up"
        style={{ animationDelay: `${(offsetIndex + index) * 0.05}s` }}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 bg-${config.color}-100 rounded-full flex items-center justify-center`}>
              <Icon className={`w-6 h-6 text-${config.color}-600`} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {profile.full_name}
                {profile.id === currentProfile?.id && (
                  <span className="ml-2 text-xs text-violet-600">(tu)</span>
                )}
              </h3>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Mail className="w-3 h-3" />
                {profile.email}
              </div>
            </div>
          </div>
          <button
            onClick={() => handleEdit(profile)}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
          >
            <Edit className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center gap-4 mt-3 ml-15">
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Calendar className="w-3 h-3" />
            {formatDate(profile.created_at)}
          </div>
          {profile.role !== 'superuser' && (
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Building2 className="w-3 h-3" />
              {worksiteCount} {worksiteCount === 1 ? 'cantiere' : 'cantieri'}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <header className="bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 text-white px-4 pt-12 pb-6 rounded-b-3xl">
        <div className="flex items-center gap-3 mb-4">
          <Link
            href={backUrl}
            className="p-2 -ml-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold">Gestione Utenti</h1>
            <p className="text-blue-100 text-sm">{profiles.length} utenti registrati</p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300" />
          <input
            type="text"
            placeholder="Cerca utente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/30"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full"
            >
              <X className="w-4 h-4 text-blue-200" />
            </button>
          )}
        </div>
      </header>

      <div className="px-4 space-y-4 pb-24 pt-4">
        {/* Superusers */}
        {superusers.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Amministratori ({superusers.length})
            </h3>
            <div className="space-y-3">
              {superusers.map((profile, index) => renderUserCard(profile, index))}
            </div>
          </div>
        )}

        {/* Managers */}
        {managers.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Data Manager ({managers.length})
            </h3>
            <div className="space-y-3">
              {managers.map((profile, index) => renderUserCard(profile, index, superusers.length))}
            </div>
          </div>
        )}

        {/* Regular users */}
        {users.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <User className="w-4 h-4" />
              Operatori ({users.length})
            </h3>
            <div className="space-y-3">
              {users.map((profile, index) => renderUserCard(profile, index, superusers.length + managers.length))}
            </div>
          </div>
        )}

        {filteredProfiles.length === 0 && searchQuery && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4 text-gray-400">
              <Search className="w-8 h-8" />
            </div>
            <p className="text-lg font-semibold text-gray-900 mb-2">Nessun risultato</p>
            <p className="text-sm text-gray-500 max-w-sm">
              Nessun utente trovato per "{searchQuery}"
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-4 text-blue-600 font-medium"
            >
              Cancella ricerca
            </button>
          </div>
        )}

        {/* Info box */}
        <div className="bg-blue-50 rounded-2xl border border-blue-100 p-4 mt-6">
          <p className="text-sm text-blue-800 font-medium mb-2">Ruoli disponibili</p>
          <div className="space-y-2 text-xs text-blue-600">
            <p><strong>Amministratore</strong>: accesso completo a tutto il sistema</p>
            <p><strong>Data Manager</strong>: gestisce prodotti, fornitori e cantieri (no report costi)</p>
            <p><strong>Operatore</strong>: registra movimenti solo sui cantieri assegnati</p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4">
          <p className="text-sm text-gray-700 font-medium mb-1">Come aggiungere nuovi utenti</p>
          <p className="text-xs text-gray-500">
            Per aggiungere un nuovo utente, chiedigli di registrarsi tramite la pagina di login.
            Dopo la registrazione, potrai modificare il suo ruolo e assegnargli i cantieri da qui.
          </p>
        </div>
      </div>
    </div>
  )
}
