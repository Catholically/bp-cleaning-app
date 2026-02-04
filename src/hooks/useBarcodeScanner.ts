'use client'

import { useEffect, useRef, useCallback, useState } from 'react'

interface UseBarcodeScanner {
  onScan: (barcode: string) => void
  enabled?: boolean
  minLength?: number
  maxDelay?: number // Max delay between keystrokes (ms)
}

/**
 * Hook per rilevare se siamo su dispositivo mobile
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      // Check screen width + touch capability
      const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      const isSmallScreen = window.innerWidth < 768
      setIsMobile(hasTouchScreen && isSmallScreen)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return isMobile
}

/**
 * Hook per catturare input da pistola barcode USB
 *
 * Le pistole barcode USB funzionano come tastiere:
 * - Digitano il codice molto velocemente (~50-100ms totali)
 * - Inviano Enter alla fine
 *
 * Questo hook distingue tra:
 * - Input rapido (scanner) → trigger callback
 * - Input lento (umano) → ignorato
 */
export function useBarcodeScanner({
  onScan,
  enabled = true,
  minLength = 5,
  maxDelay = 50, // Scanner digita molto veloce
}: UseBarcodeScanner) {
  const bufferRef = useRef('')
  const lastKeyTimeRef = useRef(0)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const resetBuffer = useCallback(() => {
    bufferRef.current = ''
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const processBuffer = useCallback(() => {
    const barcode = bufferRef.current.trim()

    if (barcode.length >= minLength) {
      console.log('[BarcodeScanner] Detected barcode:', barcode)
      onScan(barcode)
    }

    resetBuffer()
  }, [minLength, onScan, resetBuffer])

  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignora se focus su input/textarea (l'input gestisce da solo)
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return
      }

      const now = Date.now()
      const timeSinceLastKey = now - lastKeyTimeRef.current

      // Se è passato troppo tempo, resetta il buffer
      if (timeSinceLastKey > maxDelay && bufferRef.current.length > 0) {
        resetBuffer()
      }

      // Enter = fine scansione
      if (e.key === 'Enter') {
        e.preventDefault()
        processBuffer()
        return
      }

      // Caratteri stampabili (lettere, numeri, trattini)
      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        bufferRef.current += e.key
        lastKeyTimeRef.current = now

        // Timeout di sicurezza: processa se nessun input per 100ms
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
        timeoutRef.current = setTimeout(() => {
          if (bufferRef.current.length >= minLength) {
            processBuffer()
          } else {
            resetBuffer()
          }
        }, 100)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [enabled, maxDelay, minLength, processBuffer, resetBuffer])

  return { resetBuffer }
}

/**
 * Hook per input barcode dentro un campo di ricerca
 * Rileva quando un barcode viene "digitato" velocemente nel campo
 */
export function useBarcodeInput({
  onScan,
  minLength = 5,
  maxDelay = 50,
}: Omit<UseBarcodeScanner, 'enabled'>) {
  const lastInputTimeRef = useRef(0)
  const inputLengthRef = useRef(0)

  const handleInputChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement>,
    setSearch: (value: string) => void
  ) => {
    const now = Date.now()
    const newValue = e.target.value
    const timeSinceLastInput = now - lastInputTimeRef.current
    const addedChars = newValue.length - inputLengthRef.current

    // Aggiorna stato
    lastInputTimeRef.current = now
    inputLengthRef.current = newValue.length
    setSearch(newValue)

    // Se sono stati aggiunti molti caratteri in poco tempo → probabile scanner
    if (addedChars >= minLength && timeSinceLastInput < maxDelay * addedChars) {
      // Aspetta un attimo per vedere se arriva altro
      setTimeout(() => {
        const currentValue = newValue.trim()
        if (currentValue.length >= minLength) {
          console.log('[BarcodeInput] Fast input detected:', currentValue)
          onScan(currentValue)
        }
      }, 100)
    }
  }, [minLength, maxDelay, onScan])

  // Handler per Enter nel campo input
  const handleKeyDown = useCallback((
    e: React.KeyboardEvent<HTMLInputElement>,
    currentValue: string
  ) => {
    if (e.key === 'Enter' && currentValue.trim().length >= minLength) {
      e.preventDefault()
      onScan(currentValue.trim())
    }
  }, [minLength, onScan])

  return { handleInputChange, handleKeyDown }
}
