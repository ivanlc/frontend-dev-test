import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getProducts } from '../../api/products'
import { ProductCard } from './ProductCard'
import styles from './ProductListPage.module.css'

export function ProductListPage() {
  const [search, setSearch] = useState('')
  const { data, isPending, isError, isFetching, refetch } = useQuery({
    queryKey: ['products'],
    queryFn: ({ signal }) => getProducts(signal),
  })

  const normalizedSearch = search.trim().toLocaleLowerCase()
  const products = data ?? []
  const visibleProducts = products.filter(
    ({ brand, model }) =>
      brand.toLocaleLowerCase().includes(normalizedSearch) ||
      model.toLocaleLowerCase().includes(normalizedSearch),
  )

  return (
    <main className={styles.page}>
      <div className={styles.intro}>
        <p className={styles.eyebrow}>Explorá la colección</p>
        <h1>Catálogo de productos</h1>
        <p>Elegí un dispositivo para conocer sus características y opciones.</p>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchField}>
          <label htmlFor="product-search">Buscar por marca o modelo</label>
          <input
            id="product-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Por ejemplo, Acer o Liquid"
          />
        </div>
        {data && (
          <p className={styles.resultCount} role="status" aria-live="polite">
            {visibleProducts.length} de {products.length} productos
          </p>
        )}
      </div>

      {isPending && <p role="status">Cargando productos…</p>}

      {isError && !data && (
        <div className={styles.message} role="alert">
          <p>No pudimos cargar el catálogo.</p>
          <button type="button" onClick={() => void refetch()}>
            Reintentar
          </button>
        </div>
      )}

      {isError && data && (
        <p className={styles.inlineError} role="alert">
          No se pudo actualizar el catálogo. Se muestran los datos guardados.
        </p>
      )}

      {isFetching && data && !isError && (
        <p className={styles.refreshing} role="status">
          Actualizando catálogo…
        </p>
      )}

      {data && products.length === 0 && (
        <p className={styles.message}>El catálogo está vacío.</p>
      )}

      {data && products.length > 0 && visibleProducts.length === 0 && (
        <p className={styles.message}>No encontramos productos para esa búsqueda.</p>
      )}

      {visibleProducts.length > 0 && (
        <ul className={styles.grid} aria-label="Productos">
          {visibleProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </ul>
      )}
    </main>
  )
}
