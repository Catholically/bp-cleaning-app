'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

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
    <>
      <style jsx global>{`
        .login-page {
          --bg1: #0B2A45;
          --bg2: #0A3F66;
          --bg3: #0B3557;
          --bg4: #0A2F4E;
          --card: #ffffff;
          --title: #0B2A45;
          --text: #1F2D3D;
          --muted: #6B7C8F;
          --stroke: #1D93CF;
          --btn1: #26A7DD;
          --btn2: #0B76B3;
          --shadow-card: 0 18px 40px rgba(0,0,0,0.28);
          --shadow-btn: 0 10px 20px rgba(0,0,0,0.22);
        }
        .login-page * { box-sizing: border-box; }
        .login-page {
          margin: 0;
          font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";
          background: radial-gradient(1200px 900px at 35% 20%, rgba(255,255,255,0.12), transparent 55%),
                      linear-gradient(135deg, var(--bg1), var(--bg2) 35%, var(--bg3) 70%, var(--bg4));
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }
        .login-frame {
          width: min(1024px, 100vw);
          aspect-ratio: 1/1;
          position: relative;
          overflow: hidden;
        }
        .login-wave {
          position: absolute;
          width: 120%;
          height: 55%;
          left: -10%;
          border-radius: 40% 60% 55% 45% / 55% 45% 55% 45%;
        }
        .login-wave.w1 {
          top: 120px;
          background: rgba(0,0,0,0.18);
          transform: rotate(-6deg);
        }
        .login-wave.w2 {
          top: 260px;
          background: rgba(0,0,0,0.10);
          transform: rotate(10deg);
        }
        .login-header {
          position: absolute;
          top: 120px;
          left: 50%;
          transform: translateX(-50%);
          text-align: center;
          width: 100%;
          padding: 0 24px;
        }
        .login-brand {
          margin-top: 14px;
          font-size: 54px;
          font-weight: 700;
          letter-spacing: 0.3px;
          text-shadow: 0 10px 18px rgba(0,0,0,0.25);
        }
        .login-sub {
          margin-top: 6px;
          font-size: 40px;
          font-weight: 600;
          opacity: 0.95;
          text-shadow: 0 10px 18px rgba(0,0,0,0.25);
        }
        .login-card {
          position: absolute;
          left: 50%;
          top: 420px;
          transform: translateX(-50%);
          width: min(720px, calc(100% - 64px));
          background: var(--card);
          border-radius: 28px;
          box-shadow: var(--shadow-card);
          color: var(--text);
          padding: 44px 56px 40px 56px;
        }
        .login-card h1 {
          margin: 0;
          text-align: center;
          color: var(--title);
          font-size: 54px;
          font-weight: 800;
        }
        .login-field {
          margin-top: 34px;
          height: 74px;
          border: 3px solid var(--stroke);
          border-radius: 16px;
          display: flex;
          align-items: center;
          padding: 0 18px;
          gap: 14px;
          background: #ffffff;
        }
        .login-field:first-of-type {
          margin-top: 44px;
        }
        .login-field input {
          border: none;
          outline: none;
          width: 100%;
          font-size: 24px;
          color: var(--text);
          background: transparent;
        }
        .login-field input::placeholder {
          color: var(--muted);
        }
        .login-icon {
          width: 28px;
          height: 28px;
          flex: 0 0 auto;
          color: var(--stroke);
        }
        .login-icon.right {
          opacity: 0.95;
          cursor: pointer;
        }
        .login-btn {
          margin-top: 28px;
          height: 84px;
          border: none;
          width: 100%;
          border-radius: 26px;
          background: linear-gradient(180deg, var(--btn1), var(--btn2));
          color: white;
          font-size: 34px;
          font-weight: 800;
          box-shadow: var(--shadow-btn);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }
        .login-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .login-footerRow {
          margin-top: 18px;
          text-align: center;
          font-size: 24px;
          color: var(--text);
        }
        .login-footerRow button {
          color: var(--stroke);
          background: none;
          border: none;
          font-weight: 700;
          font-size: 24px;
          cursor: pointer;
        }
        .login-copyright {
          position: absolute;
          left: 50%;
          bottom: 36px;
          transform: translateX(-50%);
          font-size: 22px;
          color: rgba(255,255,255,0.85);
          text-align: center;
          width: 100%;
          padding: 0 24px;
        }
        .login-sparkle {
          position: absolute;
          right: 48px;
          bottom: 92px;
          width: 44px;
          height: 44px;
          opacity: 0.55;
          color: white;
          transform: rotate(10deg);
          filter: drop-shadow(0 6px 10px rgba(0,0,0,0.25));
        }
        .login-error {
          margin-top: 20px;
          padding: 16px;
          border-radius: 12px;
          font-size: 20px;
          text-align: center;
        }
        .login-error.info {
          background: #F0F9FF;
          color: #0369A1;
          border: 1px solid #BAE6FD;
        }
        .login-error.error {
          background: #FEF2F2;
          color: #DC2626;
          border: 1px solid #FECACA;
        }
        .login-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: login-spin 0.8s linear infinite;
        }
        @keyframes login-spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 720px) {
          .login-brand { font-size: 40px; }
          .login-sub { font-size: 30px; }
          .login-card {
            height: auto;
            padding: 34px 22px 28px;
            top: 390px;
          }
          .login-card h1 { font-size: 40px; }
          .login-field { height: 66px; }
          .login-field input { font-size: 18px; }
          .login-btn { height: 76px; font-size: 28px; }
          .login-footerRow { font-size: 18px; }
          .login-footerRow button { font-size: 18px; }
        }
      `}</style>

      <div className="login-page">
        <div className="login-frame">
          <div className="login-wave w1"></div>
          <div className="login-wave w2"></div>

          <div className="login-header">
            {/* Droplet logo */}
            <svg width="92" height="92" viewBox="0 0 96 96" aria-hidden="true">
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#7FE0FF"/>
                  <stop offset="1" stopColor="#1AA7E0"/>
                </linearGradient>
                <linearGradient id="g2" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#E7FBFF" stopOpacity="0.9"/>
                  <stop offset="1" stopColor="#5AD2FF" stopOpacity="0.2"/>
                </linearGradient>
              </defs>
              <path d="M48 6 C40 18 22 36 22 54 C22 72 34 86 48 86 C62 86 74 72 74 54 C74 36 56 18 48 6Z" fill="url(#g1)"/>
              <path d="M48 16 C43 26 30 40 30 54 C30 66 38 76 48 76 C58 76 66 66 66 54 C66 40 53 26 48 16Z" fill="rgba(0,0,0,0.08)"/>
              <path d="M38 26 C34 34 30 42 30 52 C30 60 34 68 40 72 C30 58 34 42 44 28Z" fill="url(#g2)"/>
              <path d="M58 24 C64 34 66 44 64 56 C62 66 54 74 46 76 C58 68 64 58 64 48 C64 40 62 32 58 24Z" fill="rgba(255,255,255,0.35)"/>
            </svg>

            <div className="login-brand">BP Cleaning srl</div>
            <div className="login-sub">Multiservice</div>
          </div>

          <form className="login-card" onSubmit={handleSubmit}>
            <h1>{mode === 'login' ? 'Bentornato!' : 'Crea Account'}</h1>

            {mode === 'signup' && (
              <div className="login-field">
                {/* user icon */}
                <svg className="login-icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
                <input
                  type="text"
                  placeholder="Nome completo"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="login-field">
              {/* mail icon */}
              <svg className="login-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="currentColor" d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"/>
              </svg>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="login-field">
              {/* lock icon */}
              <svg className="login-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="currentColor" d="M12 17a2 2 0 0 0 2-2v-2a2 2 0 0 0-4 0v2a2 2 0 0 0 2 2zm6-7h-1V8a5 5 0 0 0-10 0v2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2zM9 10V8a3 3 0 0 1 6 0v2H9z"/>
              </svg>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              {/* eye-off / eye icon */}
              <svg
                className="login-icon right"
                viewBox="0 0 24 24"
                aria-hidden="true"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <path fill="currentColor" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                ) : (
                  <path fill="currentColor" d="M2 4.27 3.28 3 21 20.72 19.73 22l-3.06-3.06A11.8 11.8 0 0 1 12 20C6 20 1.73 15.61.5 12c.45-1.32 1.27-2.72 2.44-4.06L2 4.27zM12 6c6 0 10.27 4.39 11.5 8-.53 1.56-1.57 3.2-3.12 4.64l-2.02-2.02A5 5 0 0 0 9.4 7.64L7.55 5.79A11.7 11.7 0 0 1 12 6z"/>
                )}
              </svg>
            </div>

            {error && (
              <div className={`login-error ${error.includes('email') || error.includes('Controlla') ? 'info' : 'error'}`}>
                {error}
              </div>
            )}

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? (
                <div className="login-spinner"></div>
              ) : mode === 'login' ? (
                'Accedi'
              ) : (
                'Registrati'
              )}
            </button>

            <div className="login-footerRow">
              {mode === 'login' ? 'Non hai un account? ' : 'Hai già un account? '}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'login' ? 'signup' : 'login')
                  setError('')
                }}
              >
                {mode === 'login' ? 'Registrati' : 'Accedi'}
              </button>
            </div>
          </form>

          <div className="login-copyright">© 2026 BP Cleaning srl Multiservice</div>

          {/* sparkle */}
          <svg className="login-sparkle" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="currentColor" d="M12 2l1.2 5.1L18 9l-4.8 1.9L12 16l-1.2-5.1L6 9l4.8-1.9L12 2zm8 10l.7 3 2.3 1-2.3 1-.7 3-.7-3-2.3-1 2.3-1 .7-3zM4 14l.7 3 2.3 1-2.3 1-.7 3-.7-3-2.3-1 2.3-1 .7-3z"/>
          </svg>
        </div>
      </div>
    </>
  )
}
