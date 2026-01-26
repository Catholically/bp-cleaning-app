'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/auth-provider'
import { Profile, UserRole } from '@/lib/types'
import {
  Users,
  Plus,
  Search,
  X,
  Shield,
  User,
  Edit,
  Trash2,
  ArrowLeft,
  Save,
  Loader2,
  Mail,
  Calendar
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function UtentiPage() {
  const router = useRouter()
  const { isSuperuser, profile: currentProfile } = useAuth()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  // Form state
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
    fetchProfiles()
  }, [isSuperuser])

  const fetchProfiles = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('role')
      .order('full_name')

    if (data) setProfiles(data)
    setLoading(false)
  }

  const handleEdit = (profile: Profile) => {
    setEditingProfile(profile)
    setFormData({
      email: profile.email,
      full_name: profile.full_name,
      role: profile.role
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.full_name.trim()) {
      alert('Inserisci il nome completo')
      return
    }

    setSaving(true)

    if (editingProfile) {
      // Update
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name.trim(),
          role: formData.role
        })
        .eq('id', editingProfile.id)

      if (error) {
        alert('Errore durante il salvataggio: ' + error.message)
      } else {
        setShowForm(false)
        fetchProfiles()
      }
    }

    setSaving(false)
  }

  const handleDelete = async (profile: Profile) => {
    if (profile.id === currentProfile?.id) {
      alert('Non puoi eliminare te stesso!')
      return
    }

    if (!confirm(`Sei sicuro di voler disattivare l'utente "${profile.full_name}"?`)) return

    // We can't actually delete users from auth, but we can change their role or mark them somehow
    // For now, we'll just show a message
    alert('Per eliminare un utente, contatta l\'amministratore di sistema.')
  }

  const filteredProfiles = profiles.filter(p => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      p.full_name.toLowerCase().includes(query) ||
      p.email.toLowerCase().includes(query)
    )
  })

  const superusers = filteredProfiles.filter(p => p.role === 'superuser')
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
              {formData.role === 'superuser' ? (
                <Shield className="w-7 h-7" />
              ) : (
                <User className="w-7 h-7" />
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold">{formData.full_name || 'Modifica'}</h1>
              <p className="text-blue-100 text-sm">{formData.email}</p>
            </div>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="px-4 -mt-4 space-y-4">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ruolo
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              disabled={editingProfile.id === currentProfile?.id}
              className="w-full px-3 py-3 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            >
              <option value="user">Operatore</option>
              <option value="superuser">Amministratore</option>
            </select>
            {editingProfile.id === currentProfile?.id && (
              <p className="text-xs text-gray-500 mt-2">
                Non puoi modificare il tuo ruolo
              </p>
            )}
          </div>

          <div className="bg-blue-50 rounded-2xl border border-blue-100 p-4">
            <p className="text-sm text-blue-800 font-medium mb-1">Ruoli utente</p>
            <p className="text-xs text-blue-600">
              <strong>Operatore</strong>: può fare carichi, scarichi e visualizzare prodotti<br />
              <strong>Amministratore</strong>: accesso completo al sistema
            </p>
          </div>

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
  return (
    <div className="min-h-screen">
      <header className="bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 text-white px-4 pt-12 pb-6 rounded-b-3xl">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold">Utenti</h1>
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

      <div className="px-4 -mt-4 space-y-4 pb-24">
        {/* Superusers */}
        {superusers.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Amministratori ({superusers.length})
            </h3>
            <div className="space-y-3">
              {superusers.map((profile, index) => (
                <div
                  key={profile.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 animate-slide-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center">
                        <Shield className="w-6 h-6 text-violet-600" />
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
                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-2 ml-15">
                    <Calendar className="w-3 h-3" />
                    Registrato il {formatDate(profile.created_at)}
                  </div>
                </div>
              ))}
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
              {users.map((profile, index) => (
                <div
                  key={profile.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 animate-slide-up"
                  style={{ animationDelay: `${(superusers.length + index) * 0.05}s` }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{profile.full_name}</h3>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Mail className="w-3 h-3" />
                          {profile.email}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(profile)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-2 ml-15">
                    <Calendar className="w-3 h-3" />
                    Registrato il {formatDate(profile.created_at)}
                  </div>
                </div>
              ))}
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

        {profiles.length === 0 && !searchQuery && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4 text-gray-400">
              <Users className="w-8 h-8" />
            </div>
            <p className="text-lg font-semibold text-gray-900 mb-2">Nessun utente</p>
            <p className="text-sm text-gray-500 max-w-sm">
              Non ci sono utenti registrati
            </p>
          </div>
        )}

        {/* Info box */}
        <div className="bg-blue-50 rounded-2xl border border-blue-100 p-4 mt-6">
          <p className="text-sm text-blue-800 font-medium mb-1">Come aggiungere nuovi utenti</p>
          <p className="text-xs text-blue-600">
            Per aggiungere un nuovo utente, chiedigli di registrarsi tramite la pagina di login.
            Dopo la registrazione, potrai modificare il suo ruolo da qui.
          </p>
        </div>
      </div>
    </div>
  )
}
