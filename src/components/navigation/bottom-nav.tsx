'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Package, ClipboardList, Building2, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/prodotti', icon: Package, label: 'Prodotti' },
  { href: '/movimenti', icon: ClipboardList, label: 'Movimenti' },
  { href: '/cantieri', icon: Building2, label: 'Cantieri' },
  { href: '/impostazioni', icon: Settings, label: 'Altro' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-2 py-2 safe-bottom z-40">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname.startsWith(item.href))
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'nav-item min-w-[64px]',
                isActive ? 'flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 text-blue-600' : 'flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 text-gray-400 hover:text-gray-600'
              )}
            >
              <item.icon 
                className={cn(
                  'w-6 h-6 transition-all',
                  isActive && 'scale-110'
                )} 
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className={cn(
                'text-xs font-medium',
                isActive ? 'text-blue-600' : 'text-gray-400'
              )}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
