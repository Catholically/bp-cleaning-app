/**
 * Script per creare gli account Supabase Auth per i 15 dipendenti BP Cleaning
 *
 * Esegui con: npx tsx scripts/create-workers-accounts.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nesvkpyngurlkmduyywy.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lc3ZrcHluZ3VybGttZHV5eXd5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODQ0OTU0MywiZXhwIjoyMDg0MDI1NTQzfQ.C2LDNfP_5FpysC3_l46No1f4p83g133zjPD1patcot0'

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Lista dipendenti da creare
const dipendenti = [
  { code: 'DIP001', first_name: 'Liud Cleider', last_name: 'Calderon Garces', email: 'l.calderongarces@bpcleaning.it' },
  { code: 'DIP002', first_name: 'Giusy', last_name: 'De Cubellis', email: 'g.decubellis@bpcleaning.it' },
  { code: 'DIP003', first_name: 'Ilona', last_name: 'Demydasyuk', email: 'i.demydasyuk@bpcleaning.it' },
  { code: 'DIP004', first_name: 'Domenica', last_name: 'Desogos', email: 'd.desogos@bpcleaning.it' },
  { code: 'DIP005', first_name: 'Samantha', last_name: 'Feltrin', email: 's.feltrin@bpcleaning.it' },
  { code: 'DIP006', first_name: 'Umberto', last_name: 'Galimberti', email: 'u.galimberti@bpcleaning.it' },
  { code: 'DIP007', first_name: 'Dafne', last_name: 'Garghentini', email: 'd.garghentini@bpcleaning.it' },
  { code: 'DIP008', first_name: 'Luis Cornelio', last_name: 'Guzhnay Guapacasa', email: 'l.guzhnayguapacasa@bpcleaning.it' },
  { code: 'DIP009', first_name: 'Zorka', last_name: 'Kastratovic', email: 'z.kastratovic@bpcleaning.it' },
  { code: 'DIP010', first_name: 'Elvisa', last_name: 'Rexaj', email: 'e.rexaj@bpcleaning.it' },
  { code: 'DIP011', first_name: 'Maria Esther', last_name: 'Rodriguez Hernandez', email: 'm.rodriguezhernandez@bpcleaning.it' },
  { code: 'DIP012', first_name: 'Marco', last_name: 'Saccon', email: 'm.saccon@bpcleaning.it' },
  { code: 'DIP013', first_name: 'Marina', last_name: 'Sala', email: 'm.sala@bpcleaning.it' },
  { code: 'DIP014', first_name: 'Abdelalim', last_name: 'Yassim', email: 'a.yassim@bpcleaning.it' },
  { code: 'DIP015', first_name: 'Valentina', last_name: 'Zaro', email: 'v.zaro@bpcleaning.it' },
]

interface CreatedUser {
  code: string
  email: string
  full_name: string
  password: string
  success: boolean
  error?: string
}

async function createWorkerAccounts() {
  console.log('='.repeat(60))
  console.log('BP CLEANING - Creazione Account Dipendenti')
  console.log('='.repeat(60))
  console.log('')

  const results: CreatedUser[] = []

  for (const dip of dipendenti) {
    const full_name = `${dip.first_name} ${dip.last_name}`
    const password = generatePassword()

    console.log(`Creando account per ${dip.code} - ${full_name}...`)

    try {
      // Check if user already exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers()
      const existingUser = existingUsers?.users?.find(u => u.email === dip.email)

      if (existingUser) {
        console.log(`  ⚠️  Utente già esistente: ${dip.email}`)
        results.push({
          code: dip.code,
          email: dip.email,
          full_name,
          password: '(esistente)',
          success: false,
          error: 'Utente già esistente'
        })
        continue
      }

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: dip.email,
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name,
          redirect_email: 'info@bpcleaning.it'
        }
      })

      if (authError || !authData.user) {
        console.log(`  ❌ Errore: ${authError?.message}`)
        results.push({
          code: dip.code,
          email: dip.email,
          full_name,
          password: '',
          success: false,
          error: authError?.message
        })
        continue
      }

      // Update profile with role
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name,
          role: 'user',
          email: dip.email
        })
        .eq('id', authData.user.id)

      if (profileError) {
        console.log(`  ⚠️  Profilo non aggiornato: ${profileError.message}`)
      }

      // Link to worker record
      const { error: workerError } = await supabase
        .from('workers')
        .update({ user_id: authData.user.id })
        .eq('email', dip.email)

      if (workerError) {
        console.log(`  ⚠️  Worker non collegato: ${workerError.message}`)
      }

      console.log(`  ✅ Creato con successo`)
      results.push({
        code: dip.code,
        email: dip.email,
        full_name,
        password,
        success: true
      })

    } catch (err) {
      console.log(`  ❌ Errore: ${err}`)
      results.push({
        code: dip.code,
        email: dip.email,
        full_name,
        password: '',
        success: false,
        error: String(err)
      })
    }
  }

  // Print summary
  console.log('')
  console.log('='.repeat(60))
  console.log('RIEPILOGO')
  console.log('='.repeat(60))
  console.log('')

  const successful = results.filter(r => r.success)
  const failed = results.filter(r => !r.success)

  console.log(`Creati: ${successful.length}`)
  console.log(`Falliti: ${failed.length}`)
  console.log('')

  if (successful.length > 0) {
    console.log('CREDENZIALI UTENTI CREATI:')
    console.log('-'.repeat(60))
    console.log('')

    for (const user of successful) {
      console.log(`${user.code} - ${user.full_name}`)
      console.log(`  Email:    ${user.email}`)
      console.log(`  Password: ${user.password}`)
      console.log('')
    }

    console.log('-'.repeat(60))
    console.log('⚠️  SALVA QUESTE PASSWORD! Non potrai vederle di nuovo.')
    console.log('')
  }

  if (failed.length > 0) {
    console.log('UTENTI NON CREATI:')
    for (const user of failed) {
      console.log(`  ${user.code} - ${user.email}: ${user.error}`)
    }
  }
}

function generatePassword(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz'
  const nums = '0123456789'
  let password = ''

  // 6 random lowercase letters
  for (let i = 0; i < 6; i++) {
    password += chars[Math.floor(Math.random() * chars.length)]
  }

  // 2 numbers
  for (let i = 0; i < 2; i++) {
    password += nums[Math.floor(Math.random() * nums.length)]
  }

  // Add complexity requirements
  password += 'Bp!'

  return password
}

// Run
createWorkerAccounts()
  .then(() => {
    console.log('Script completato.')
    process.exit(0)
  })
  .catch((err) => {
    console.error('Errore fatale:', err)
    process.exit(1)
  })
