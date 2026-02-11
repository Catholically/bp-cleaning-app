import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

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

    // Get request data
    const body = await request.json()
    const {
      email,
      password,
      full_name,
      role = 'user',
      redirect_email  // Email where password reset will be sent (for aliases)
    } = body

    if (!email || !full_name) {
      return NextResponse.json({ error: 'Email e nome completo sono obbligatori' }, { status: 400 })
    }

    // Create user with admin client
    const adminClient = createAdminClient()

    // Generate a random password if not provided
    const userPassword = password || Math.random().toString(36).slice(-12) + 'Aa1!'

    // Create the auth user
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password: userPassword,
      email_confirm: true, // Auto-confirm email since we're admin
      user_metadata: {
        full_name,
        redirect_email: redirect_email || email // Store where password reset goes
      }
    })

    if (authError) {
      console.error('Auth error:', authError)
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Errore nella creazione utente' }, { status: 500 })
    }

    // Update the profile with role (trigger should have created it)
    const { error: profileError } = await adminClient
      .from('profiles')
      .update({
        full_name,
        role,
        email // Make sure email is set
      })
      .eq('id', authData.user.id)

    if (profileError) {
      console.error('Profile error:', profileError)
      // User was created but profile update failed - try to delete user
      await adminClient.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: 'Errore nell\'aggiornamento profilo' }, { status: 500 })
    }

    // If there's a worker with this email, link them
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

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        full_name
      },
      // Only return password if it was auto-generated
      ...(password ? {} : { generated_password: userPassword })
    })

  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}
