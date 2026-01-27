'use client'

import { useAuth } from '@/components/providers/auth-provider'
import {
  Settings,
  User,
  Building2,
  FileSpreadsheet,
  LogOut,
  ChevronRight,
  Shield,
  Briefcase,
  Users,
  Truck,
  Tag
} from 'lucide-react'
import Link from 'next/link'

export default function ImpostazioniPage() {
  const { profile, isSuperuser, isManager, isManagerOrSuperuser, signOut } = useAuth()

  return (
    <div className="min-h-screen">
      <header className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white px-4 pt-12 pb-6 rounded-b-3xl">
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6" />
          <div>
            <h1 className="text-xl font-bold">Impostazioni</h1>
            <p className="text-blue-100 text-sm">Gestisci il sistema</p>
          </div>
        </div>
      </header>

      <div className="px-4 -mt-4 space-y-4 pb-6">
        {/* User profile card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{profile?.full_name}</h3>
              <p className="text-sm text-gray-500">{profile?.email}</p>
            </div>
            {isSuperuser && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-100 text-violet-700">
                <Shield className="w-3 h-3 mr-1" />
                Admin
              </span>
            )}
            {isManager && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                <Briefcase className="w-3 h-3 mr-1" />
                Manager
              </span>
            )}
          </div>
        </div>

        {/* Menu items */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider px-1">
            Gestione
          </h3>

          <Link href="/cantieri" className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm transition-all duration-200 hover:shadow-md hover:border-gray-200">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-violet-100">
              <Building2 className="w-5 h-5 text-violet-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">Cantieri</h4>
              <p className="text-sm text-gray-500">Gestisci cantieri e clienti</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300" />
          </Link>

          {/* Fornitori - visible to superuser and manager */}
          {isManagerOrSuperuser && (
            <Link href="/fornitori" className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm transition-all duration-200 hover:shadow-md hover:border-gray-200">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-amber-100">
                <Truck className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">Fornitori</h4>
                <p className="text-sm text-gray-500">Gestisci fornitori prodotti</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300" />
            </Link>
          )}

          {/* Utenti - only superuser */}
          {isSuperuser && (
            <Link href="/utenti" className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm transition-all duration-200 hover:shadow-md hover:border-gray-200">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-blue-100">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">Utenti</h4>
                <p className="text-sm text-gray-500">Gestisci accessi al sistema</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300" />
            </Link>
          )}
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider px-1">
            Report & Export
          </h3>

          {/* Report - only superuser (managers cannot see cost reports) */}
          {isSuperuser && (
            <Link href="/report" className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm transition-all duration-200 hover:shadow-md hover:border-gray-200">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-emerald-100">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">Report & Export</h4>
                <p className="text-sm text-gray-500">Genera report Excel</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300" />
            </Link>
          )}

          {/* Etichette - visible to superuser and manager */}
          {isManagerOrSuperuser && (
            <Link href="/etichette" className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm transition-all duration-200 hover:shadow-md hover:border-gray-200">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-sky-100">
                <Tag className="w-5 h-5 text-sky-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">Stampa Etichette</h4>
                <p className="text-sm text-gray-500">PDF etichette con barcode</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300" />
            </Link>
          )}
        </div>

        {/* Sign out */}
        <div className="pt-4">
          <button
            onClick={signOut}
            className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm transition-all duration-200 hover:shadow-md hover:border-gray-200 w-full text-left hover:bg-red-50"
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-red-100">
              <LogOut className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-red-600">Esci</h4>
              <p className="text-sm text-gray-500">Disconnetti dal sistema</p>
            </div>
          </button>
        </div>

        {/* Version */}
        <p className="text-center text-xs text-gray-400 pt-4">
          BP Cleaning v1.0.0
        </p>
      </div>
    </div>
  )
}
