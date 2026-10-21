import { afterEach, describe, expect, it, vi } from 'vitest'
import { addToCart } from './cart'

describe('addToCart', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sends only the selected product and option codes', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ count: 3 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      addToCart({ id: 'sku-1', colorCode: 1000, storageCode: 2001 }),
    ).resolves.toEqual({ count: 3 })
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
      '/api/cart',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'sku-1',
          colorCode: 1000,
          storageCode: 2001,
        }),
      },
    )
  })

  it('rejects a response without a numeric count', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ count: '3' }))),
    )

    await expect(
      addToCart({ id: 'sku-1', colorCode: 1000, storageCode: 2001 }),
    ).rejects.toThrow('Invalid cart response count')
  })
})
