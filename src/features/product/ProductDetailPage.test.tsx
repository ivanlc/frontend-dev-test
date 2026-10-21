import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { addToCart } from '../../api/cart'
import { ApiError } from '../../api/client'
import { getProduct, getProducts } from '../../api/products'
import type { ProductDetail } from '../../api/types'
import { App } from '../../app/App'
import { CartCountProvider } from '../../cart/CartCountProvider'

vi.mock('../../api/products', () => ({ getProduct: vi.fn(), getProducts: vi.fn() }))
vi.mock('../../api/cart', () => ({ addToCart: vi.fn() }))

const product: ProductDetail = {
  id: 'sku-1',
  brand: 'Acer',
  model: 'Liquid Jade 2',
  price: '',
  imgUrl: 'https://example.com/product.jpg',
  cpu: 'Hexa-core',
  ram: '3 GB RAM',
  os: 'Android 6',
  displayResolution: '5.5 inches',
  displaySize: '1080 x 1920 pixels',
  battery: '',
  primaryCamera: ['21 MP', 'autofocus'],
  secondaryCmera: '8 MP',
  dimentions: '-',
  weight: '',
  options: {
    colors: [{ code: 1000, name: 'Black' }],
    storages: [
      { code: 2000, name: '16 GB' },
      { code: 2001, name: '32 GB' },
    ],
  },
}

function renderDetail() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  })

  const view = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/product/sku-1']}>
        <CartCountProvider>
          <App />
        </CartCountProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
  return { ...view, queryClient }
}

describe('ProductDetailPage', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    localStorage.clear()
  })

  it('shows product data and selected defaults, then persists the POST count', async () => {
    vi.mocked(getProduct).mockResolvedValue(product)
    vi.mocked(getProducts).mockResolvedValue([])
    vi.mocked(addToCart).mockResolvedValue({ count: 4 })
    const user = userEvent.setup()
    const { unmount } = renderDetail()

    expect(await screen.findByRole('heading', { name: 'Acer Liquid Jade 2' })).toBeInTheDocument()
    expect(screen.getByText('Precio no disponible')).toBeInTheDocument()
    expect(screen.getByText('21 MP, autofocus')).toBeInTheDocument()
    expect(screen.getByText('8 MP')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '← Volver al catálogo' })).toHaveAttribute('href', '/')

    const color = screen.getByRole('combobox', { name: 'Color' })
    const storage = screen.getByRole('combobox', { name: 'Almacenamiento' })
    expect(color).toHaveValue('1000')
    expect(storage).toHaveValue('2000')

    await user.selectOptions(storage, '2001')
    await user.click(screen.getByRole('button', { name: 'Añadir a la cesta' }))
    await waitFor(() => {
      expect(vi.mocked(addToCart).mock.calls[0][0]).toEqual({
        id: 'sku-1',
        colorCode: 1000,
        storageCode: 2001,
      })
    })
    expect(await screen.findByText('Producto añadido a la cesta.')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(localStorage.getItem('itx-cart-count')).toBe('4')

    await user.click(screen.getByRole('link', { name: '← Volver al catálogo' }))
    expect(await screen.findByRole('heading', { name: 'Catálogo de productos' })).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()

    unmount()
    renderDetail()
    expect(screen.getByText('4')).toBeInTheDocument()
  })

  it('disables another add while the POST is pending', async () => {
    vi.mocked(getProduct).mockResolvedValue(product)
    let resolveAdd: (value: { count: number }) => void = () => {}
    vi.mocked(addToCart).mockImplementation(
      () => new Promise((resolve) => { resolveAdd = resolve }),
    )
    const user = userEvent.setup()
    renderDetail()

    await screen.findByRole('heading', { name: 'Acer Liquid Jade 2' })
    await user.click(screen.getByRole('button', { name: 'Añadir a la cesta' }))
    expect(screen.getByRole('button', { name: 'Añadiendo…' })).toBeDisabled()

    resolveAdd({ count: 1 })
    expect(await screen.findByText('Producto añadido a la cesta.')).toBeInTheDocument()
  })

  it('keeps the count unchanged and offers a retry when POST fails', async () => {
    vi.mocked(getProduct).mockResolvedValue(product)
    vi.mocked(addToCart)
      .mockRejectedValueOnce(new Error('Network unavailable'))
      .mockResolvedValueOnce({ count: 2 })
    const user = userEvent.setup()
    renderDetail()

    await screen.findByRole('heading', { name: 'Acer Liquid Jade 2' })
    await user.click(screen.getByRole('button', { name: 'Añadir a la cesta' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo añadir el producto.')
    expect(localStorage.getItem('itx-cart-count')).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Añadir a la cesta' }))
    expect(await screen.findByText('Producto añadido a la cesta.')).toBeInTheDocument()
    expect(localStorage.getItem('itx-cart-count')).toBe('2')
  })

  it('shows the cumulative server count across additions and HTTP errors', async () => {
    vi.mocked(getProduct).mockResolvedValue(product)
    vi.mocked(addToCart)
      .mockResolvedValueOnce({ count: 1 })
      .mockRejectedValueOnce(new ApiError(503, 'Service Unavailable'))
      .mockResolvedValueOnce({ count: 2 })
    const user = userEvent.setup()
    const { unmount } = renderDetail()

    await screen.findByRole('heading', { name: 'Acer Liquid Jade 2' })
    await user.click(screen.getByRole('button', { name: 'Añadir a la cesta' }))
    expect(await screen.findByText('1')).toBeInTheDocument()
    expect(localStorage.getItem('itx-cart-count')).toBe('1')

    await user.click(screen.getByRole('button', { name: 'Añadir a la cesta' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo añadir')
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(localStorage.getItem('itx-cart-count')).toBe('1')

    await user.click(screen.getByRole('button', { name: 'Añadir a la cesta' }))
    expect(await screen.findByText('2')).toBeInTheDocument()
    expect(localStorage.getItem('itx-cart-count')).toBe('2')
    expect(addToCart).toHaveBeenCalledTimes(3)

    unmount()
    renderDetail()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('keeps selectors visible and disables adding when an option is missing', async () => {
    vi.mocked(getProduct).mockResolvedValue({
      ...product,
      secondaryCmera: ['2 MP', '720p'],
      options: { colors: product.options.colors, storages: [] },
    })
    renderDetail()

    await screen.findByRole('heading', { name: 'Acer Liquid Jade 2' })
    expect(screen.getByRole('combobox', { name: 'Color' })).toHaveValue('1000')
    expect(screen.getByText('2 MP, 720p')).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Almacenamiento' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Añadir a la cesta' })).toBeDisabled()
    expect(addToCart).not.toHaveBeenCalled()
  })

  it('shows a missing-product state for a 404 response', async () => {
    vi.mocked(getProduct).mockRejectedValue(new ApiError(404, 'Not Found'))
    renderDetail()

    expect(await screen.findByRole('heading', { name: 'Producto no encontrado' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '← Volver al catálogo' })).toHaveAttribute('href', '/')
  })

  it('offers a retry when the detail GET fails', async () => {
    vi.mocked(getProduct)
      .mockRejectedValueOnce(new Error('Network unavailable'))
      .mockResolvedValueOnce(product)
    const user = userEvent.setup()
    renderDetail()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No pudimos cargar el producto',
    )
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByRole('heading', { name: 'Acer Liquid Jade 2' }))
      .toBeInTheDocument()
  })

  it('uses a valid variant if revalidated options replace the selection', async () => {
    vi.mocked(getProduct).mockResolvedValue(product)
    vi.mocked(addToCart).mockResolvedValue({ count: 1 })
    const user = userEvent.setup()
    const { queryClient } = renderDetail()

    await screen.findByRole('heading', { name: 'Acer Liquid Jade 2' })
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Almacenamiento' }),
      '2001',
    )
    queryClient.setQueryData(['product', 'sku-1'], {
      ...product,
      options: {
        colors: [{ code: 1001, name: 'White' }],
        storages: [{ code: 2002, name: '64 GB' }],
      },
    })

    expect(await screen.findByRole('combobox', { name: 'Almacenamiento' }))
      .toHaveValue('2002')
    expect(screen.getByRole('combobox', { name: 'Color' })).toHaveValue('1001')
    await user.click(screen.getByRole('button', { name: 'Añadir a la cesta' }))
    expect(vi.mocked(addToCart).mock.calls[0][0]).toEqual({
      id: 'sku-1',
      colorCode: 1001,
      storageCode: 2002,
    })
  })
})
