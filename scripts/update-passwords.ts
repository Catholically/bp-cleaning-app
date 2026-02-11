/**
 * Script per aggiornare le password dei dipendenti con password più semplici
 *
 * Esegui con: npx tsx scripts/update-passwords.ts
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

// Password semplici basate sul cognome + numero
const dipendenti = [
  { email: 'l.calderongarces@bpcleaning.it', password: 'Calderon1!', name: 'Liud Cleider Calderon Garces' },
  { email: 'g.decubellis@bpcleaning.it', password: 'Cubellis2!', name: 'Giusy De Cubellis' },
  { email: 'i.demydasyuk@bpcleaning.it', password: 'Ilona2026!', name: 'Ilona Demydasyuk' },
  { email: 'd.desogos@bpcleaning.it', password: 'Desogos4!', name: 'Domenica Desogos' },
  { email: 's.feltrin@bpcleaning.it', password: 'Feltrin5!', name: 'Samantha Feltrin' },
  { email: 'u.galimberti@bpcleaning.it', password: 'Umberto6!', name: 'Umberto Galimberti' },
  { email: 'd.garghentini@bpcleaning.it', password: 'Dafne2026!', name: 'Dafne Garghentini' },
  { email: 'l.guzhnayguapacasa@bpcleaning.it', password: 'Luis2026!', name: 'Luis Cornelio Guzhnay Guapacasa' },
  { email: 'z.kastratovic@bpcleaning.it', password: 'Zorka2026!', name: 'Zorka Kastratovic' },
  { email: 'e.rexaj@bpcleaning.it', password: 'Elvisa10!', name: 'Elvisa Rexaj' },
  { email: 'm.rodriguezhernandez@bpcleaning.it', password: 'Maria2026!', name: 'Maria Esther Rodriguez Hernandez' },
  { email: 'm.saccon@bpcleaning.it', password: 'Saccon12!', name: 'Marco Saccon' },
  { email: 'm.sala@bpcleaning.it', password: 'Marina13!', name: 'Marina Sala' },
  { email: 'a.yassim@bpcleaning.it', password: 'Yassim14!', name: 'Abdelalim Yassim' },
  { email: 'v.zaro@bpcleaning.it', password: 'Valentina!', name: 'Valentina Zaro' },
]

async function updatePasswords() {
  console.log('='.repeat(60))
  console.log('BP CLEANING - Aggiornamento Password')
  console.log('='.repeat(60))
  console.log('')

  // Get all users
  const { data: usersData } = await supabase.auth.admin.listUsers()
  const users = usersData?.users || []

  for (const dip of dipendenti) {
    const user = users.find(u => u.email === dip.email)

    if (!user) {
      console.log(`❌ ${dip.email} - Utente non trovato`)
      continue
    }

    const { error } = await supabase.auth.admin.updateUserById(user.id, {
      password: dip.password
    })

    if (error) {
      console.log(`❌ ${dip.email} - Errore: ${error.message}`)
    } else {
      console.log(`✅ ${dip.name}`)
      console.log(`   Email:    ${dip.email}`)
      console.log(`   Password: ${dip.password}`)
      console.log('')
    }
  }

  console.log('='.repeat(60))
  console.log('Aggiornamento completato!')
  console.log('='.repeat(60))
}

updatePasswords()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Errore:', err)
    process.exit(1)
  })
