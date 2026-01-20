import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date))
}

export function formatNumber(num: number, decimals = 2): string {
  return new Intl.NumberFormat('it-IT', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals
  }).format(num)
}

export function generateBarcode(): string {
  // Generate a random EAN-13 compatible barcode starting with 200 (in-store use)
  const prefix = '200'
  const random = Math.floor(Math.random() * 1000000000).toString().padStart(9, '0')
  const base = prefix + random
  
  // Calculate check digit
  let sum = 0
  for (let i = 0; i < 12; i++) {
    sum += parseInt(base[i]) * (i % 2 === 0 ? 1 : 3)
  }
  const checkDigit = (10 - (sum % 10)) % 10
  
  return base + checkDigit
}

export function getStockStatusColor(current: number, min: number): string {
  const ratio = current / min
  if (ratio <= 1) return 'text-red-500'
  if (ratio <= 1.5) return 'text-amber-500'
  return 'text-emerald-500'
}

export function getStockStatusBg(current: number, min: number): string {
  const ratio = current / min
  if (ratio <= 1) return 'bg-red-50 border-red-200'
  if (ratio <= 1.5) return 'bg-amber-50 border-amber-200'
  return 'bg-emerald-50 border-emerald-200'
}

export function getStockStatusLabel(current: number, min: number): string {
  const ratio = current / min
  if (ratio <= 1) return 'Riordino'
  if (ratio <= 1.5) return 'Basso'
  return 'OK'
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

// SKU prefix mapping for each category
export const SKU_PREFIXES: Record<string, string> = {
  detergente: 'DET',
  sgrassatore: 'SGR',
  disinfettante: 'DIS',
  lucidante: 'LUC',
  deodorante: 'DEO',
  accessorio: 'ACC',
  attrezzatura: 'ATT',
  altro: 'ALT'
}

// Generate next SKU for a category (needs current max number from DB)
export function generateSKU(category: string, nextNumber: number): string {
  const prefix = SKU_PREFIXES[category] || 'ALT'
  return `${prefix}-${nextNumber.toString().padStart(3, '0')}`
}
