'use client'

import { useAuth } from '@/components/providers/auth-provider'
import { AdminDashboard } from '@/components/dashboard/admin-dashboard'
import { OperatorDashboard } from '@/components/dashboard/operator-dashboard'
import Image from 'next/image'

export default function HomePage() {
  const { isSuperuser, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 to-cyan-50">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Image src="/logo.svg" alt="BP Cleaning" width={64} height={64} className="animate-pulse-soft" />
          </div>
          <div className="w-8 h-1 bg-sky-200 rounded-full overflow-hidden">
            <div className="h-full bg-sky-500 rounded-full animate-pulse" style={{ width: '50%' }} />
          </div>
        </div>
      </div>
    )
  }

  // Mostra dashboard admin per superuser, altrimenti dashboard operatore
  return isSuperuser ? <AdminDashboard /> : <OperatorDashboard />
}
