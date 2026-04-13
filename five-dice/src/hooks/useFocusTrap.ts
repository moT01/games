import { useEffect } from 'react'
import type { RefObject } from 'react'

const FOCUSABLE = [
  'a[href]',
  'button:not(:disabled)',
  'input:not(:disabled)',
  'select:not(:disabled)',
  'textarea:not(:disabled)',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

export function useFocusTrap(ref: RefObject<HTMLElement | null>, onEscape: () => void) {
  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Focus first focusable element
    const focusable = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE))
    focusable[0]?.focus()

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onEscape()
        return
      }
      if (e.key !== 'Tab') return

      const current = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (current.length === 0) return

      const first = current[0]
      const last = current[current.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [ref, onEscape])
}
