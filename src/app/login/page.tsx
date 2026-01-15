'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Loader2, Sparkles } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [fullName, setFullName] = useState('')
  
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        router.push('/')
        router.refresh()
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: 'user' // Default to user, admin can upgrade later
            }
          }
        })
        if (error) throw error
        setError('Controlla la tua email per confermare la registrazione')
        setMode('login')
      }
    } catch (err: any) {
      setError(err.message || 'Si è verificato un errore')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex flex-col">
      {/* Header decoration */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {/* Logo area */}
        <div className="mb-8 text-center">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">BP Cleaning</h1>
          <p className="text-blue-200 text-sm">Gestione Magazzino</p>
        </div>

        {/* Login Card */}
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-3xl shadow-2xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">
              {mode === 'login' ? 'Bentornato!' : 'Crea Account'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome completo</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Mario Rossi"
                    required
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="nome@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>

              {error && (
                <div className={`text-sm p-3 rounded-xl ${
                  error.includes('email') 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'bg-red-50 text-red-700'
                }`}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 focus:ring-blue-500 shadow-md hover:shadow-lg active:scale-[0.98] w-full py-3"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : mode === 'login' ? (
                  'Accedi'
                ) : (
                  'Registrati'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setMode(mode === 'login' ? 'signup' : 'login')
                  setError('')
                }}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {mode === 'login' 
                  ? 'Non hai un account? Registrati' 
                  : 'Hai già un account? Accedi'}
              </button>
            </div>
          </div>

          {/* Footer text */}
          <p className="text-center text-blue-200 text-xs mt-6">
            © {new Date().getFullYear()} BP Cleaning
          </p>
        </div>
      </div>
    </div>
  )
}
