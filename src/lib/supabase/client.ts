import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    // Return a mock client for build time
    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        signInWithPassword: async () => ({ error: { message: 'Not configured' } }),
        signUp: async () => ({ error: { message: 'Not configured' } }),
        signOut: async () => {},
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
      },
      from: () => ({
        select: () => ({ 
          eq: () => ({ 
            order: () => ({ data: [], error: null }),
            single: () => ({ data: null, error: null }),
            lte: () => ({ data: [], error: null }),
            gte: () => ({ data: [], error: null }),
            limit: () => ({ data: [], error: null })
          }),
          order: () => ({ data: [], error: null }),
          lte: () => ({ data: [], error: null }),
          gte: () => ({ data: [], error: null })
        }),
        insert: () => ({ error: null }),
        update: () => ({ error: null })
      })
    } as any
  }

  return createBrowserClient(supabaseUrl, supabaseKey)
}
