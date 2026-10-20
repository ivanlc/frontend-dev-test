import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { CartCountProvider } from '../cart/CartCountProvider'
import { App } from './App'

describe('App', () => {
  it('renders the catalog route', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity } },
    })
    queryClient.setQueryData(['products'], [])

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/']}>
          <CartCountProvider>
            <App />
          </CartCountProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(
      screen.getByRole('heading', { name: 'Catálogo de productos' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Mobile Shop' })).toHaveAttribute(
      'href',
      '/',
    )
  })

  it('shows a 404 state for an unknown route', () => {
    const queryClient = new QueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/unknown']}>
          <CartCountProvider>
            <App />
          </CartCountProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(screen.getByRole('heading', { name: 'Página no encontrada' }))
      .toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ir al catálogo' }))
      .toHaveAttribute('href', '/')
  })
})
