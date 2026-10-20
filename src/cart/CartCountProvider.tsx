import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

const STORAGE_KEY = 'itx-cart-count'

interface CartCountContextValue {
  count: number
  updateCount: (count: number) => void
}

const CartCountContext = createContext<CartCountContextValue | null>(null)

function readStoredCount(): number {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored !== null) {
      const count = Number(stored)
      if (Number.isInteger(count) && count >= 0) return count
    }
  } catch {
    // Storage can be unavailable; the current page still works in memory.
  }

  return 0
}

export function CartCountProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(readStoredCount)

  function updateCount(nextCount: number) {
    if (!Number.isInteger(nextCount) || nextCount < 0) return

    setCount(nextCount)
    try {
      localStorage.setItem(STORAGE_KEY, String(nextCount))
    } catch {
      // Keep the count in memory when storage is unavailable.
    }
  }

  return (
    <CartCountContext.Provider value={{ count, updateCount }}>
      {children}
    </CartCountContext.Provider>
  )
}

export function useCartCount(): CartCountContextValue {
  const context = useContext(CartCountContext)
  if (!context) throw new Error('useCartCount must be used within CartCountProvider')
  return context
}
