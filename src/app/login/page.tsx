'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

// Inline SVG Icons matching the screenshot exactly
const DropletLogo = () => (
  <svg width="80" height="100" viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="dropletGradient" x1="40" y1="0" x2="40" y2="100" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#7DD3FC" />
        <stop offset="50%" stopColor="#38BDF8" />
        <stop offset="100%" stopColor="#0284C7" />
      </linearGradient>
      <linearGradient id="dropletInner1" x1="30" y1="20" x2="50" y2="80" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#BAE6FD" />
        <stop offset="100%" stopColor="#38BDF8" />
      </linearGradient>
      <linearGradient id="dropletInner2" x1="40" y1="30" x2="40" y2="90" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#0EA5E9" />
        <stop offset="100%" stopColor="#0369A1" />
      </linearGradient>
    </defs>
    {/* Main droplet shape */}
    <path d="M40 0C40 0 0 50 0 70C0 86.5685 17.9086 100 40 100C62.0914 100 80 86.5685 80 70C80 50 40 0 40 0Z" fill="url(#dropletGradient)" />
    {/* Inner highlight layer 1 */}
    <path d="M40 12C40 12 12 52 12 68C12 80.7025 24.536 91 40 91C55.464 91 68 80.7025 68 68C68 52 40 12 40 12Z" fill="url(#dropletInner1)" opacity="0.6" />
    {/* Inner highlight layer 2 */}
    <path d="M40 24C40 24 20 54 20 66C20 76.4934 28.9543 85 40 85C51.0457 85 60 76.4934 60 66C60 54 40 24 40 24Z" fill="url(#dropletInner2)" opacity="0.7" />
    {/* Small shine */}
    <ellipse cx="28" cy="50" rx="8" ry="12" fill="white" opacity="0.3" />
  </svg>
)

const MailIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M22 6L12 13L2 6" />
  </svg>
)

const LockIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0110 0v4" />
  </svg>
)

const EyeOffIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
)

const EyeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

const UserIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

const SparkleIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="rgba(255,255,255,0.6)">
    <path d="M12 0L13.5 8.5L22 10L13.5 11.5L12 20L10.5 11.5L2 10L10.5 8.5L12 0Z" />
  </svg>
)

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
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(160deg, #0F2A42 0%, #143D5E 25%, #0E3350 50%, #0B2740 75%, #091E32 100%)'
      }}
    >
      {/* Wave decorations - background */}
      <svg
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          width: '100%',
          height: '50%',
          opacity: 0.15
        }}
        viewBox="0 0 1440 500"
        preserveAspectRatio="none"
      >
        <path
          fill="#0A2840"
          d="M0,200 C300,280 600,180 900,220 C1200,260 1350,200 1440,240 L1440,500 L0,500 Z"
        />
      </svg>
      <svg
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          width: '100%',
          height: '40%',
          opacity: 0.12
        }}
        viewBox="0 0 1440 400"
        preserveAspectRatio="none"
      >
        <path
          fill="#0D3555"
          d="M0,150 C200,200 400,100 700,180 C1000,260 1200,140 1440,200 L1440,400 L0,400 Z"
        />
      </svg>
      <svg
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          width: '100%',
          height: '30%',
          opacity: 0.1
        }}
        viewBox="0 0 1440 300"
        preserveAspectRatio="none"
      >
        <path
          fill="#1A4D70"
          d="M0,100 C240,160 480,80 720,140 C960,200 1200,120 1440,160 L1440,300 L0,300 Z"
        />
      </svg>

      {/* Sparkle decoration - bottom right */}
      <div style={{ position: 'absolute', bottom: '24px', right: '24px', zIndex: 10 }}>
        <SparkleIcon />
      </div>

      {/* Main content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 20px',
          position: 'relative',
          zIndex: 10
        }}
      >
        {/* Logo and brand text */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <DropletLogo />
          </div>
          <h1
            style={{
              fontSize: '32px',
              fontWeight: 400,
              color: 'white',
              marginBottom: '4px',
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontStyle: 'italic',
              letterSpacing: '0.5px'
            }}
          >
            BP Cleaning srl
          </h1>
          <p
            style={{
              fontSize: '18px',
              fontWeight: 500,
              color: 'rgba(255,255,255,0.9)',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}
          >
            Multiservice
          </p>
        </div>

        {/* Card container with reflection effect */}
        <div style={{ width: '100%', maxWidth: '380px' }}>
          {/* Main card */}
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '24px',
              padding: '40px 32px 32px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.35), 0 8px 20px rgba(0,0,0,0.2)'
            }}
          >
            <h2
              style={{
                fontSize: '28px',
                fontWeight: 700,
                color: '#0F2A42',
                textAlign: 'center',
                marginBottom: '28px',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}
            >
              {mode === 'login' ? 'Bentornato!' : 'Crea Account'}
            </h2>

            <form onSubmit={handleSubmit}>
              {mode === 'signup' && (
                <div style={{ position: 'relative', marginBottom: '16px' }}>
                  <div
                    style={{
                      position: 'absolute',
                      left: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)'
                    }}
                  >
                    <UserIcon />
                  </div>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nome completo"
                    required
                    style={{
                      width: '100%',
                      padding: '16px 16px 16px 52px',
                      fontSize: '16px',
                      border: '2px solid #38BDF8',
                      borderRadius: '50px',
                      outline: 'none',
                      color: '#334155',
                      backgroundColor: 'white',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              )}

              {/* Email input */}
              <div style={{ position: 'relative', marginBottom: '16px' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)'
                  }}
                >
                  <MailIcon />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  required
                  style={{
                    width: '100%',
                    padding: '16px 16px 16px 52px',
                    fontSize: '16px',
                    border: '2px solid #38BDF8',
                    borderRadius: '50px',
                    outline: 'none',
                    color: '#334155',
                    backgroundColor: 'white',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Password input */}
              <div style={{ position: 'relative', marginBottom: '20px' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)'
                  }}
                >
                  <LockIcon />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  minLength={6}
                  style={{
                    width: '100%',
                    padding: '16px 52px 16px 52px',
                    fontSize: '16px',
                    border: '2px solid #38BDF8',
                    borderRadius: '50px',
                    outline: 'none',
                    color: '#334155',
                    backgroundColor: 'white',
                    boxSizing: 'border-box'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  {showPassword ? <EyeIcon /> : <EyeOffIcon />}
                </button>
              </div>

              {/* Error message */}
              {error && (
                <div
                  style={{
                    padding: '12px 16px',
                    marginBottom: '16px',
                    borderRadius: '12px',
                    fontSize: '14px',
                    backgroundColor: error.includes('email') || error.includes('Controlla') ? '#F0F9FF' : '#FEF2F2',
                    color: error.includes('email') || error.includes('Controlla') ? '#0369A1' : '#DC2626',
                    border: `1px solid ${error.includes('email') || error.includes('Controlla') ? '#BAE6FD' : '#FECACA'}`
                  }}
                >
                  {error}
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '16px',
                  fontSize: '18px',
                  fontWeight: 600,
                  color: 'white',
                  background: 'linear-gradient(180deg, #38BDF8 0%, #0284C7 100%)',
                  border: 'none',
                  borderRadius: '50px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  boxShadow: '0 8px 20px rgba(2,132,199,0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease'
                }}
              >
                {loading ? (
                  <Loader2 style={{ width: '24px', height: '24px', animation: 'spin 1s linear infinite' }} />
                ) : mode === 'login' ? (
                  'Accedi'
                ) : (
                  'Registrati'
                )}
              </button>
            </form>

            {/* Footer link */}
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <span style={{ color: '#64748B', fontSize: '14px' }}>
                {mode === 'login' ? 'Non hai un account? ' : 'Hai già un account? '}
              </span>
              <button
                onClick={() => {
                  setMode(mode === 'login' ? 'signup' : 'login')
                  setError('')
                }}
                style={{
                  color: '#0EA5E9',
                  fontSize: '14px',
                  fontWeight: 600,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textDecoration: 'none'
                }}
              >
                {mode === 'login' ? 'Registrati' : 'Accedi'}
              </button>
            </div>
          </div>

          {/* Reflection effect under card */}
          <div
            style={{
              height: '60px',
              marginTop: '-20px',
              background: 'linear-gradient(to bottom, rgba(255,255,255,0.08) 0%, transparent 100%)',
              borderRadius: '0 0 24px 24px',
              filter: 'blur(4px)',
              transform: 'scaleY(-0.3)',
              transformOrigin: 'top'
            }}
          />
        </div>
      </div>

      {/* Copyright footer */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          textAlign: 'center',
          paddingBottom: '24px'
        }}
      >
        <p
          style={{
            color: 'rgba(255,255,255,0.7)',
            fontSize: '13px',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}
        >
          © 2026 BP Cleaning srl Multiservice
        </p>
      </div>

      {/* Keyframes for spinner */}
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        input::placeholder {
          color: #94A3B8;
        }
        input:focus {
          border-color: #0EA5E9 !important;
          box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
        }
      `}</style>
    </div>
  )
}
