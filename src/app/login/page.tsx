'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Loader2, Mail, Lock, Eye, EyeOff, User } from 'lucide-react'
import Image from 'next/image'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [fullName, setFullName] = useState('')
  const [showPassword, setShowPassword] = useState(false)

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
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-[#0a1628]">
      {/* Background with wave pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a1628] via-[#0d2847] to-[#0a1628]" />
        {/* Wave decorations */}
        <svg className="absolute bottom-0 left-0 right-0 opacity-10" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path fill="#38bdf8" d="M0,192L48,176C96,160,192,128,288,128C384,128,480,160,576,186.7C672,213,768,235,864,213.3C960,192,1056,128,1152,112C1248,96,1344,128,1392,144L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" />
        </svg>
        <svg className="absolute top-0 left-0 right-0 opacity-5 rotate-180" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path fill="#38bdf8" d="M0,64L48,80C96,96,192,128,288,128C384,128,480,96,576,90.7C672,85,768,107,864,128C960,149,1056,171,1152,165.3C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" />
        </svg>
      </div>

      {/* Sparkle decoration */}
      <div className="absolute bottom-8 right-8 text-sky-400/30">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
        </svg>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-8 relative z-10">
        {/* Logo and brand */}
        <div className="mb-8 text-center">
          <div className="w-20 h-20 mx-auto mb-4">
            <Image
              src="/logo.svg"
              alt="BP Cleaning"
              width={80}
              height={80}
              className="drop-shadow-lg"
            />
          </div>
          <h1 className="text-3xl font-bold text-white mb-1" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
            BP Cleaning srl
          </h1>
          <p className="text-sky-300 text-sm font-medium tracking-wide">Multiservice</p>
        </div>

        {/* Login Card */}
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
              {mode === 'login' ? 'Bentornato!' : 'Crea Account'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-500">
                    <User className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-sky-200 focus:border-sky-500 focus:outline-none transition-colors text-gray-700 placeholder-gray-400"
                    placeholder="Nome completo"
                    required
                  />
                </div>
              )}

              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-500">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-sky-200 focus:border-sky-500 focus:outline-none transition-colors text-gray-700 placeholder-gray-400"
                  placeholder="Email"
                  required
                />
              </div>

              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-500">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3.5 rounded-xl border-2 border-sky-200 focus:border-sky-500 focus:outline-none transition-colors text-gray-700 placeholder-gray-400"
                  placeholder="Password"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-sky-400 hover:text-sky-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {error && (
                <div className={`text-sm p-3 rounded-xl ${
                  error.includes('email') || error.includes('Controlla')
                    ? 'bg-sky-50 text-sky-700 border border-sky-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-sky-500 to-sky-600 text-white font-semibold rounded-full shadow-lg shadow-sky-500/30 hover:shadow-xl hover:shadow-sky-500/40 hover:from-sky-600 hover:to-sky-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
              <span className="text-gray-500 text-sm">
                {mode === 'login' ? 'Non hai un account? ' : 'Hai già un account? '}
              </span>
              <button
                onClick={() => {
                  setMode(mode === 'login' ? 'signup' : 'login')
                  setError('')
                }}
                className="text-sm text-sky-600 hover:text-sky-700 font-semibold transition-colors"
              >
                {mode === 'login' ? 'Registrati' : 'Accedi'}
              </button>
            </div>
          </div>

          {/* Footer with reflection effect */}
          <div className="mt-8 text-center">
            <p className="text-sky-300/60 text-xs">
              © {new Date().getFullYear()} BP Cleaning srl Multiservice
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
