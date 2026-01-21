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
        .login-body {
          margin: 0;
          padding: 0;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #0093E9 0%, #004d7a 100%);
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          position: relative;
          overflow: hidden;
        }

        .bg-decoration {
          position: absolute;
          width: 100%;
          height: 100%;
          background-image:
            radial-gradient(circle at 80% 20%, rgba(255,255,255,0.05) 0%, transparent 20%),
            radial-gradient(circle at 10% 80%, rgba(255,255,255,0.05) 0%, transparent 20%);
          z-index: 0;
        }

        .login-container {
          z-index: 1;
          text-align: center;
          width: 100%;
          max-width: 400px;
          padding: 0 20px;
        }

        .header-logo {
          margin-bottom: 20px;
        }

        .logo-icon {
          width: 60px;
          height: auto;
          margin-bottom: 10px;
          filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));
        }

        .brand-name {
          color: white;
          font-size: 24px;
          font-weight: bold;
          margin: 0;
          letter-spacing: 0.5px;
        }

        .brand-subtitle {
          color: rgba(255,255,255,0.8);
          font-size: 14px;
          margin-top: 5px;
        }

        .login-card {
          background: white;
          border-radius: 20px;
          padding: 40px 30px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.2);
          text-align: left;
        }

        .card-title {
          text-align: center;
          color: #333;
          font-size: 22px;
          font-weight: 800;
          margin-bottom: 30px;
        }

        .input-group {
          margin-bottom: 20px;
        }

        .input-label {
          display: block;
          color: #666;
          font-size: 12px;
          font-weight: bold;
          margin-bottom: 8px;
        }

        .input-field {
          width: 100%;
          padding: 12px 15px;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          background-color: #f9f9f9;
          font-size: 14px;
          box-sizing: border-box;
          color: #333;
        }

        .input-field::placeholder {
          color: #ccc;
        }

        .input-field:focus {
          outline: none;
          border-color: #0099ff;
          background-color: #fff;
        }

        .btn-login {
          width: 100%;
          padding: 12px;
          background-color: #0099ff;
          color: white;
          border: none;
          border-radius: 25px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          margin-top: 10px;
          transition: background 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .btn-login:hover {
          background-color: #007acc;
        }

        .btn-login:disabled {
          background-color: #99d6ff;
          cursor: not-allowed;
        }

        .register-link {
          display: block;
          text-align: center;
          margin-top: 20px;
          font-size: 12px;
          color: #666;
        }

        .register-link button {
          color: #0099ff;
          background: none;
          border: none;
          font-weight: 600;
          cursor: pointer;
          font-size: 12px;
        }

        .register-link button:hover {
          text-decoration: underline;
        }

        .login-footer {
          margin-top: 40px;
          color: rgba(255,255,255,0.4);
          font-size: 10px;
        }

        .error-message {
          padding: 10px 15px;
          border-radius: 8px;
          font-size: 12px;
          margin-bottom: 15px;
          text-align: center;
        }

        .error-message.info {
          background-color: #e3f2fd;
          color: #1565c0;
          border: 1px solid #90caf9;
        }

        .error-message.error {
          background-color: #ffebee;
          color: #c62828;
          border: 1px solid #ef9a9a;
        }

        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div className="login-body">
        <div className="bg-decoration"></div>

        <div className="login-container">
          <div className="header-logo">
            <svg className="logo-icon" viewBox="0 0 200 260" xmlns="http://www.w3.org/2000/svg">
              <path d="M100 0 C 100 0 10 120 10 170 A 90 90 0 0 0 190 170 C 190 120 100 0 100 0 Z" fill="#bce6f7" />
              <path d="M190 170 A 90 90 0 0 1 10 170 C 10 140 40 80 100 0 C 120 40 190 110 190 170" fill="#89d0ef" />
              <path d="M185 180 A 85 85 0 0 1 20 160 C 40 100 100 0 100 0 C 140 80 185 130 185 180" fill="#29abe2" />
              <path d="M175 190 A 75 75 0 0 1 40 180 C 60 120 100 0 100 0 C 150 100 175 140 175 190" fill="#0071bc" />
              <path d="M140 100 Q 170 150 145 200 Q 155 160 140 100" fill="#ffffff" />
            </svg>
            <div className="brand-name">BP Cleaning</div>
            <div className="brand-subtitle">Gestione Magazzino</div>
          </div>

          <form className="login-card" onSubmit={handleSubmit}>
            <div className="card-title">
              {mode === 'login' ? 'Bentornato!' : 'Crea Account'}
            </div>

            {mode === 'signup' && (
              <div className="input-group">
                <label className="input-label">Nome completo</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Mario Rossi"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="input-group">
              <label className="input-label">Email</label>
              <input
                type="email"
                className="input-field"
                placeholder="nome@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">Password</label>
              <input
                type="password"
                className="input-field"
                placeholder="........"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className={`error-message ${error.includes('email') || error.includes('Controlla') ? 'info' : 'error'}`}>
                {error}
              </div>
            )}

            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? (
                <div className="spinner"></div>
              ) : mode === 'login' ? (
                'Accedi'
              ) : (
                'Registrati'
              )}
            </button>

            <div className="register-link">
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

          <div className="login-footer">
            © 2026 BP Cleaning
          </div>
        </div>
      </div>
    </>
  )
}
