'use client'

import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/lib/types'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  isSuperuser: boolean
  isManager: boolean
  isManagerOrSuperuser: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isSuperuser: false,
  isManager: false,
  isManagerOrSuperuser: false,
  signOut: async () => {},
  refreshProfile: async () => {}
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) {
      console.error('Error fetching profile:', error)
      return null
    }
    return data as Profile
  }

  const refreshProfile = async () => {
    if (user) {
      const profile = await fetchProfile(user.id)
      setProfile(profile)
    }
  }

  useEffect(() => {
    let mounted = true

    // Use getSession first (reads from local storage, faster)
    // Then onAuthStateChange will handle token refresh if needed
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (!mounted) return

        if (error || !session) {
          setUser(null)
          setProfile(null)
          setLoading(false)
          return
        }

        setUser(session.user)

        // Fetch profile in background, don't block loading
        fetchProfile(session.user.id).then(profile => {
          if (mounted) setProfile(profile)
        })

        setLoading(false)
      } catch (error) {
        console.error('Auth init error:', error)
        if (mounted) {
          setUser(null)
          setProfile(null)
          setLoading(false)
        }
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: any, session: any) => {
        if (!mounted) return

        if (session?.user) {
          setUser(session.user)
          // Fetch profile in background
          fetchProfile(session.user.id).then(profile => {
            if (mounted) setProfile(profile)
          })
        } else {
          setUser(null)
          setProfile(null)
        }

        setLoading(false)
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    // Force redirect to avoid state issues
    window.location.href = '/login'
  }

  const isSuperuser = profile?.role === 'superuser'
  const isManager = profile?.role === 'manager'
  const isManagerOrSuperuser = isSuperuser || isManager

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      isSuperuser,
      isManager,
      isManagerOrSuperuser,
      signOut,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
