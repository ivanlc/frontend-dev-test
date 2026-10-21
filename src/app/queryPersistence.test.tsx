import { StrictMode } from 'react'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { addToCart } from '../api/cart'
import { getProduct, getProducts } from '../api/products'
import type { ProductDetail } from '../api/types'
import { CartCountProvider } from '../cart/CartCountProvider'
import { App } from './App'
import {
  createQueryClient,
  createQueryPersistenceOptions,
  ONE_HOUR_MS,
  PRODUCT_CACHE_KEY,
} from './queryClient'

vi.mock('../api/products', () => ({ getProduct: vi.fn(), getProducts: vi.fn() }))
vi.mock('../api/cart', () => ({ addToCart: vi.fn() }))

const firstProduct: ProductDetail = {
  id: 'sku-1', brand: 'Acer', model: 'Liquid Jade 2', price: '100', imgUrl: '',
  cpu: '', ram: '', os: '', displayResolution: '', displaySize: '', battery: '',
  primaryCamera: [], secondaryCmera: '', dimentions: '', weight: '',
  options: {
    colors: [{ code: 1000, name: 'Black' }],
    storages: [{ code: 2000, name: '16 GB' }],
  },
}
const secondProduct = { ...firstProduct, id: 'sku-2', model: 'Liquid Z6' }

function renderApp(client = createQueryClient(), initialEntry = '/') {
  const view = render(
    <StrictMode>
      <PersistQueryClientProvider
        client={client}
        persistOptions={createQueryPersistenceOptions()}
      >
        <MemoryRouter initialEntries={[initialEntry]}>
          <CartCountProvider><App /></CartCountProvider>
        </MemoryRouter>
      </PersistQueryClientProvider>
    </StrictMode>,
  )
  return { ...view, client }
}

async function savedQueries() {
  let queries: Array<{ queryKey: unknown[] }> = []
  await waitFor(() => {
    const saved = JSON.parse(localStorage.getItem(PRODUCT_CACHE_KEY) ?? '{}')
    queries = saved.clientState?.queries ?? []
    expect(queries.length).toBeGreaterThan(0)
  })
  return queries
}

describe('persistent GET cache', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    localStorage.clear()
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-20T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('reuses separate catalog and detail queries while navigating', async () => {
    vi.mocked(getProducts).mockResolvedValue([firstProduct, secondProduct])
    vi.mocked(getProduct).mockImplementation(async (id) =>
      id === 'sku-1' ? firstProduct : secondProduct)
    const user = userEvent.setup()
    const { client, unmount } = renderApp()

    await screen.findByRole('link', { name: /Acer Liquid Jade 2/ })
    await user.click(screen.getByRole('link', { name: /Acer Liquid Jade 2/ }))
    await screen.findByRole('heading', { name: 'Acer Liquid Jade 2' })
    const firstDetailCalls = vi.mocked(getProduct).mock.calls.filter(([id]) => id === 'sku-1').length
    await user.click(screen.getByRole('link', { name: '← Volver al catálogo' }))
    await user.click(await screen.findByRole('link', { name: /Acer Liquid Z6/ }))
    await screen.findByRole('heading', { name: 'Acer Liquid Z6' })
    const secondDetailCalls = vi.mocked(getProduct).mock.calls.filter(([id]) => id === 'sku-2').length
    await user.click(screen.getByRole('link', { name: '← Volver al catálogo' }))
    await user.click(await screen.findByRole('link', { name: /Acer Liquid Jade 2/ }))
    await screen.findByRole('heading', { name: 'Acer Liquid Jade 2' })

    expect(getProducts).toHaveBeenCalledTimes(1)
    expect(firstDetailCalls).toBeGreaterThan(0)
    expect(secondDetailCalls).toBeGreaterThan(0)
    expect(vi.mocked(getProduct).mock.calls.filter(([id]) => id === 'sku-1')).toHaveLength(firstDetailCalls)
    expect(vi.mocked(getProduct).mock.calls.filter(([id]) => id === 'sku-2')).toHaveLength(secondDetailCalls)
    await waitFor(async () => {
      const keys = (await savedQueries()).map(({ queryKey }) => queryKey)
      expect(keys).toEqual(expect.arrayContaining([
        ['products'], ['product', 'sku-1'], ['product', 'sku-2'],
      ]))
    })
    unmount()
    client.clear()
  })

  it('restores fresh GET data after reload without persisting the cart mutation', async () => {
    vi.mocked(getProducts).mockResolvedValue([firstProduct])
    vi.mocked(getProduct).mockResolvedValue(firstProduct)
    vi.mocked(addToCart).mockResolvedValue({ count: 4 })
    const user = userEvent.setup()
    const first = renderApp()

    await user.click(await screen.findByRole('link', { name: /Acer Liquid Jade 2/ }))
    await screen.findByRole('heading', { name: 'Acer Liquid Jade 2' })
    await user.click(screen.getByRole('button', { name: 'Añadir a la cesta' }))
    await screen.findByText('Producto añadido a la cesta.')
    expect(localStorage.getItem('itx-cart-count')).toBe('4')
    await waitFor(() => {
      const saved = JSON.parse(localStorage.getItem(PRODUCT_CACHE_KEY) ?? '{}')
      expect(saved.clientState?.queries).toHaveLength(2)
      expect(saved.clientState?.mutations).toEqual([])
    })
    const catalogCallsBeforeReload = vi.mocked(getProducts).mock.calls.length
    const detailCallsBeforeReload = vi.mocked(getProduct).mock.calls.length
    first.unmount()
    first.client.clear()

    vi.setSystemTime(new Date(Date.now() + ONE_HOUR_MS - 1))
    const second = renderApp()
    await screen.findByRole('link', { name: /Acer Liquid Jade 2/ })
    await user.click(screen.getByRole('link', { name: /Acer Liquid Jade 2/ }))
    await screen.findByRole('heading', { name: 'Acer Liquid Jade 2' })
    expect(getProducts).toHaveBeenCalledTimes(catalogCallsBeforeReload)
    expect(getProduct).toHaveBeenCalledTimes(detailCallsBeforeReload)
    expect(screen.getByText('4')).toBeInTheDocument()
    second.unmount()
    second.client.clear()
  })

  it('discards an expired snapshot and fetches the catalog again', async () => {
    vi.mocked(getProducts)
      .mockResolvedValueOnce([firstProduct])
      .mockResolvedValueOnce([secondProduct])
    const first = renderApp()
    await screen.findByRole('link', { name: /Acer Liquid Jade 2/ })
    await savedQueries()
    first.unmount()
    first.client.clear()

    vi.setSystemTime(new Date(Date.now() + ONE_HOUR_MS + 1))
    const second = renderApp()
    await screen.findByRole('link', { name: /Acer Liquid Z6/ })
    expect(getProducts).toHaveBeenCalledTimes(2)
    second.unmount()
    second.client.clear()
  })

  it('continues fetching when localStorage cannot be accessed', async () => {
    const original = Object.getOwnPropertyDescriptor(window, 'localStorage')
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get: () => { throw new Error('Storage blocked') },
    })
    try {
      vi.mocked(getProducts).mockResolvedValue([firstProduct])
      const view = renderApp()
      await screen.findByRole('link', { name: /Acer Liquid Jade 2/ })
      expect(getProducts).toHaveBeenCalledTimes(1)
      view.unmount()
      view.client.clear()
    } finally {
      if (original) Object.defineProperty(window, 'localStorage', original)
    }
  })
})
