import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getProducts } from '../../api/products'
import type { ProductSummary } from '../../api/types'
import { ProductListPage } from './ProductListPage'

vi.mock('../../api/products', () => ({ getProducts: vi.fn() }))

const products: ProductSummary[] = [
  {
    id: 'acer-1',
    brand: 'Acer',
    model: 'Liquid Z6',
    price: '120',
    imgUrl: 'https://example.com/acer.jpg',
  },
  {
    id: 'samsung-2',
    brand: 'Samsung',
    model: 'Galaxy S',
    price: '',
    imgUrl: 'https://example.com/samsung.jpg',
  },
]

function renderCatalog() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<ProductListPage />} />
          <Route path="/product/:id" element={<p>Detalle provisional</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('ProductListPage', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('renders products and filters by brand or model without another GET', async () => {
    vi.mocked(getProducts).mockResolvedValue(products)
    const user = userEvent.setup()
    renderCatalog()

    expect(await screen.findByRole('heading', { name: 'Liquid Z6' })).toBeInTheDocument()
    expect(screen.getByText('Precio no disponible')).toBeInTheDocument()

    const search = screen.getByRole('searchbox', {
      name: 'Buscar por marca o modelo',
    })
    await user.type(search, 'sAmSuNg')
    expect(screen.getByRole('heading', { name: 'Galaxy S' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Liquid Z6' })).not.toBeInTheDocument()

    await user.clear(search)
    await user.type(search, 'liQuid')
    expect(screen.getByRole('heading', { name: 'Liquid Z6' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Galaxy S' })).not.toBeInTheDocument()
    expect(getProducts).toHaveBeenCalledTimes(1)
  })

  it('navigates to detail and replaces a broken image with a fallback', async () => {
    vi.mocked(getProducts).mockResolvedValue(products)
    const user = userEvent.setup()
    renderCatalog()

    const image = await screen.findByRole('img', { name: 'Acer Liquid Z6' })
    fireEvent.error(image)
    expect(screen.getByText('Imagen no disponible')).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: /Acer Liquid Z6/ }))
    expect(screen.getByText('Detalle provisional')).toBeInTheDocument()
  })

  it('shows an empty catalog and an empty search result distinctly', async () => {
    vi.mocked(getProducts).mockResolvedValueOnce([]).mockResolvedValueOnce(products)
    const user = userEvent.setup()
    const { unmount } = renderCatalog()

    expect(await screen.findByText('El catálogo está vacío.')).toBeInTheDocument()
    unmount()

    renderCatalog()
    await screen.findByRole('heading', { name: 'Liquid Z6' })
    await user.type(
      screen.getByRole('searchbox', { name: 'Buscar por marca o modelo' }),
      'sin coincidencias',
    )
    expect(
      screen.getByText('No encontramos productos para esa búsqueda.'),
    ).toBeInTheDocument()
  })

  it('shows loading and lets the user retry after a GET failure', async () => {
    vi.mocked(getProducts)
      .mockRejectedValueOnce(new Error('Network unavailable'))
      .mockResolvedValueOnce(products)
    const user = userEvent.setup()
    renderCatalog()

    expect(screen.getByRole('status', { name: '' })).toHaveTextContent(
      'Cargando productos',
    )
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No pudimos cargar el catálogo.',
    )
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByRole('heading', { name: 'Liquid Z6' })).toBeInTheDocument()
  })
})
