'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import Image from 'next/image'

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
              role: 'user'
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
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 gradient-water" />

      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
        <Image src="/logo.svg" alt="" fill className="object-contain" />
      </div>
      <div className="absolute bottom-0 left-0 w-48 h-48 opacity-5 transform rotate-180">
        <Image src="/logo.svg" alt="" fill className="object-contain" />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-8 relative z-10">
        {/* Logo area */}
        <div className="mb-10 text-center">
          <div className="w-24 h-24 bg-white/15 backdrop-blur-md rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-2xl border border-white/20">
            <Image src="/logo.svg" alt="BP Cleaning" width={56} height={56} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">BP Cleaning</h1>
          <p className="text-sky-200 text-sm font-medium">Gestione Magazzino</p>
        </div>

        {/* Login Card */}
        <div className="w-full max-w-sm">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-7 border border-white/50">
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
                    className="input"
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
                  className="input"
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
                  className="input"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>

              {error && (
                <div className={`text-sm p-3 rounded-xl ${
                  error.includes('email') || error.includes('Controlla')
                    ? 'bg-sky-50 text-sky-700 border border-sky-100'
                    : 'bg-red-50 text-red-700 border border-red-100'
                }`}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full py-3.5 text-base shadow-lg shadow-sky-500/30 hover:shadow-xl hover:shadow-sky-500/40"
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
                className="text-sm text-sky-600 hover:text-sky-700 font-medium transition-colors"
              >
                {mode === 'login'
                  ? 'Non hai un account? Registrati'
                  : 'Hai già un account? Accedi'}
              </button>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-sky-200/80 text-xs mt-8">
            © {new Date().getFullYear()} BP Cleaning
          </p>
        </div>
      </div>
    </div>
  )
}
