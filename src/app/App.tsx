import { Link, Route, Routes } from 'react-router-dom'
import { ProductListPage } from '../features/catalog/ProductListPage'
import { ProductDetailPage } from '../features/product/ProductDetailPage'
import { Header } from './Header'

function NotFoundPage() {
  return (
    <main>
      <h1>Página no encontrada</h1>
      <Link to="/">Ir al catálogo</Link>
    </main>
  )
}

export function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<ProductListPage />} />
        <Route path="/product/:id" element={<ProductDetailPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  )
}
