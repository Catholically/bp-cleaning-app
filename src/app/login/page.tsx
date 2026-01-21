'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Loader2, Mail, Lock, Eye, EyeOff, User, Droplet } from 'lucide-react'

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
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Si è verificato un errore'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background gradient - matching design spec */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #0B2A45 0%, #0A3F66 50%, #0B3557 75%, #0A2F4E 100%)'
        }}
      />

      {/* Wave decorations */}
      <svg
        className="absolute bottom-0 left-0 right-0 w-full h-64"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        style={{ opacity: 0.22 }}
      >
        <path
          fill="rgba(0,0,0,0.18)"
          d="M0,160L60,170.7C120,181,240,203,360,197.3C480,192,600,160,720,154.7C840,149,960,171,1080,186.7C1200,203,1320,213,1380,218.7L1440,224L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
        />
      </svg>
      <svg
        className="absolute bottom-0 left-0 right-0 w-full h-48"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        style={{ opacity: 0.14 }}
      >
        <path
          fill="rgba(0,0,0,0.10)"
          d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,218.7C672,235,768,245,864,234.7C960,224,1056,192,1152,176C1248,160,1344,160,1392,160L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
        />
      </svg>

      {/* Sparkle decoration */}
      <div className="absolute bottom-6 right-6" style={{ opacity: 0.55 }}>
        <svg width="44" height="44" viewBox="0 0 24 24" fill="white">
          <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
        </svg>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-8 relative z-10">
        {/* Logo and brand */}
        <div className="mb-6 text-center">
          {/* Droplet logo */}
          <div className="w-[92px] h-[92px] mx-auto mb-4 flex items-center justify-center">
            <Droplet className="w-20 h-20 text-white drop-shadow-lg" fill="white" strokeWidth={1} />
          </div>
          <h1
            className="text-4xl font-bold text-white mb-2"
            style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              letterSpacing: '0.3px'
            }}
          >
            BP Cleaning srl
          </h1>
          <p
            className="text-white text-2xl font-semibold"
            style={{ opacity: 0.95 }}
          >
            Multiservice
          </p>
        </div>

        {/* Login Card */}
        <div className="w-full max-w-[360px]">
          <div
            className="bg-white p-8"
            style={{
              borderRadius: '28px',
              boxShadow: '0 18px 40px rgba(0,0,0,0.28)'
            }}
          >
            <h2
              className="text-3xl font-extrabold mb-8 text-center"
              style={{ color: '#0B2A45' }}
            >
              {mode === 'login' ? 'Bentornato!' : 'Crea Account'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              {mode === 'signup' && (
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#1D93CF' }}>
                    <User className="w-6 h-6" />
                  </div>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-14 pr-4 py-4 text-base focus:outline-none transition-colors"
                    style={{
                      borderRadius: '16px',
                      border: '3px solid #1D93CF',
                      color: '#1F2D3D',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.08)'
                    }}
                    placeholder="Nome completo"
                    required
                  />
                </div>
              )}

              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#1D93CF' }}>
                  <Mail className="w-6 h-6" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-14 pr-4 py-4 text-base focus:outline-none transition-colors"
                  style={{
                    borderRadius: '16px',
                    border: '3px solid #1D93CF',
                    color: '#1F2D3D',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.08)'
                  }}
                  placeholder="Email"
                  required
                />
              </div>

              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#1D93CF' }}>
                  <Lock className="w-6 h-6" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-14 pr-14 py-4 text-base focus:outline-none transition-colors"
                  style={{
                    borderRadius: '16px',
                    border: '3px solid #1D93CF',
                    color: '#1F2D3D',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.08)'
                  }}
                  placeholder="Password"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: '#1D93CF' }}
                >
                  {showPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
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
                className="w-full py-5 text-white text-xl font-extrabold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98]"
                style={{
                  borderRadius: '26px',
                  background: 'linear-gradient(to bottom, #26A7DD, #0B76B3)',
                  boxShadow: '0 10px 20px rgba(0,0,0,0.22)'
                }}
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : mode === 'login' ? (
                  'Accedi'
                ) : (
                  'Registrati'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <span style={{ color: '#1F2D3D', fontSize: '15px' }}>
                {mode === 'login' ? 'Non hai un account? ' : 'Hai già un account? '}
              </span>
              <button
                onClick={() => {
                  setMode(mode === 'login' ? 'signup' : 'login')
                  setError('')
                }}
                className="font-semibold transition-colors hover:underline"
                style={{ color: '#1D93CF', fontSize: '15px' }}
              >
                {mode === 'login' ? 'Registrati' : 'Accedi'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer copyright */}
      <div className="relative z-10 pb-6 text-center">
        <p
          className="text-sm"
          style={{ color: 'rgba(255,255,255,0.85)' }}
        >
          © 2026 BP Cleaning srl Multiservice
        </p>
      </div>
    </div>
  )
}
