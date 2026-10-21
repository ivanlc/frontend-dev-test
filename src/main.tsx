import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { BrowserRouter } from 'react-router-dom'
import { App } from './app/App'
import { createQueryPersistenceOptions, queryClient } from './app/queryClient'
import { CartCountProvider } from './cart/CartCountProvider'
import './styles/global.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={createQueryPersistenceOptions()}
    >
      <BrowserRouter>
        <CartCountProvider>
          <App />
        </CartCountProvider>
      </BrowserRouter>
    </PersistQueryClientProvider>
  </StrictMode>,
)
