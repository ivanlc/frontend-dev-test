import { Link, Route, Routes, useParams } from 'react-router-dom'
import { ProductListPage } from '../features/catalog/ProductListPage'

function ProductDetailPlaceholder() {
  const { id } = useParams()

  return (
    <main>
      <Link to="/">Volver al catálogo</Link>
      <h1>Detalle del producto</h1>
      <p>Producto: {id}</p>
    </main>
  )
}

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
      <header className="site-header">
        <Link className="site-title" to="/">
          Mobile Shop
        </Link>
      </header>
      <Routes>
        <Route path="/" element={<ProductListPage />} />
        <Route path="/product/:id" element={<ProductDetailPlaceholder />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  )
}
