import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

interface UserToCreate {
  email: string
  full_name: string
  role?: string
  redirect_email?: string
}

interface CreatedUser {
  email: string
  full_name: string
  success: boolean
  error?: string
  generated_password?: string
  user_id?: string
}

export async function POST(request: NextRequest) {
  try {
    // Verify the requester is a superuser
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'superuser') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    const body = await request.json()
    const { users, default_redirect_email } = body as {
      users: UserToCreate[]
      default_redirect_email?: string
    }

    if (!users || !Array.isArray(users) || users.length === 0) {
      return NextResponse.json({ error: 'Lista utenti richiesta' }, { status: 400 })
    }

    const adminClient = createAdminClient()
    const results: CreatedUser[] = []

    for (const userData of users) {
      const { email, full_name, role = 'user', redirect_email } = userData

      if (!email || !full_name) {
        results.push({
          email: email || 'unknown',
          full_name: full_name || 'unknown',
          success: false,
          error: 'Email e nome completo sono obbligatori'
        })
        continue
      }

      try {
        // Check if user already exists
        const { data: existingUsers } = await adminClient.auth.admin.listUsers()
        const existingUser = existingUsers?.users?.find(u => u.email === email)

        if (existingUser) {
          results.push({
            email,
            full_name,
            success: false,
            error: 'Utente già esistente'
          })
          continue
        }

        // Generate password
        const userPassword = Math.random().toString(36).slice(-8) + 'Bp1!'

        // Create auth user
        const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
          email,
          password: userPassword,
          email_confirm: true,
          user_metadata: {
            full_name,
            redirect_email: redirect_email || default_redirect_email || email
          }
        })

        if (authError || !authData.user) {
          results.push({
            email,
            full_name,
            success: false,
            error: authError?.message || 'Errore creazione utente'
          })
          continue
        }

        // Update profile
        await adminClient
          .from('profiles')
          .update({
            full_name,
            role,
            email
          })
          .eq('id', authData.user.id)

        // Link to worker if exists
        const { data: worker } = await adminClient
          .from('workers')
          .select('id')
          .eq('email', email)
          .single()

        if (worker) {
          await adminClient
            .from('workers')
            .update({ user_id: authData.user.id })
            .eq('id', worker.id)
        }

        results.push({
          email,
          full_name,
          success: true,
          user_id: authData.user.id,
          generated_password: userPassword
        })

      } catch (err) {
        results.push({
          email,
          full_name,
          success: false,
          error: err instanceof Error ? err.message : 'Errore sconosciuto'
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length

    return NextResponse.json({
      success: true,
      summary: {
        total: results.length,
        success: successCount,
        failed: failCount
      },
      results
    })

  } catch (error) {
    console.error('Error creating users:', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}
