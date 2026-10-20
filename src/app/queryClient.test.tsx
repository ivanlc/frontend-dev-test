import { QueryClientProvider, useQuery } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { createQueryClient, ONE_HOUR_MS } from './queryClient'

describe('GET cache', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('reuses each GET response until one hour after that response was fetched', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-20T12:00:00Z'))
    const client = createQueryClient()
    const catalog = vi.fn().mockResolvedValue(['first catalog'])
    const detail = vi.fn().mockResolvedValue({ id: 'sku-1' })

    try {
      expect(await client.fetchQuery({ queryKey: ['products'], queryFn: catalog }))
        .toEqual(['first catalog'])
      expect(await client.fetchQuery({ queryKey: ['product', 'sku-1'], queryFn: detail }))
        .toEqual({ id: 'sku-1' })

      vi.setSystemTime(new Date(Date.now() + ONE_HOUR_MS - 1))
      await client.fetchQuery({ queryKey: ['products'], queryFn: catalog })
      await client.fetchQuery({ queryKey: ['product', 'sku-1'], queryFn: detail })
      expect(catalog).toHaveBeenCalledTimes(1)
      expect(detail).toHaveBeenCalledTimes(1)

      vi.setSystemTime(new Date(Date.now() + 1))
      catalog.mockResolvedValue(['updated catalog'])
      detail.mockResolvedValue({ id: 'sku-1', model: 'Updated' })
      expect(await client.fetchQuery({ queryKey: ['products'], queryFn: catalog }))
        .toEqual(['updated catalog'])
      expect(await client.fetchQuery({ queryKey: ['product', 'sku-1'], queryFn: detail }))
        .toEqual({ id: 'sku-1', model: 'Updated' })
      expect(catalog).toHaveBeenCalledTimes(2)
      expect(detail).toHaveBeenCalledTimes(2)
    } finally {
      client.clear()
    }
  })

  it('revalidates an active GET when its hour expires', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-20T12:00:00Z'))
    const client = createQueryClient()
    const getCatalog = vi.fn()
      .mockResolvedValueOnce(['initial'])
      .mockResolvedValueOnce(['updated'])
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    )

    try {
      const { result, unmount } = renderHook(
        () => useQuery({ queryKey: ['products'], queryFn: getCatalog }),
        { wrapper },
      )
      await act(async () => { await vi.advanceTimersByTimeAsync(0) })
      expect(result.current.data).toEqual(['initial'])

      await act(async () => { await vi.advanceTimersByTimeAsync(ONE_HOUR_MS - 1) })
      expect(getCatalog).toHaveBeenCalledTimes(1)

      await act(async () => { await vi.advanceTimersByTimeAsync(1) })
      await act(async () => { await vi.advanceTimersByTimeAsync(10) })
      expect(getCatalog).toHaveBeenCalledTimes(2)
      expect(result.current.data).toEqual(['updated'])
      unmount()
    } finally {
      client.clear()
    }
  })
})
