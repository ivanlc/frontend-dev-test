import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { addToCart } from '../../api/cart'
import { ApiError } from '../../api/client'
import { getProduct } from '../../api/products'
import type { ProductDetail } from '../../api/types'
import { useCartCount } from '../../cart/CartCountProvider'
import styles from './ProductDetailPage.module.css'

function formatSpec(value: string | string[]): string {
  const parts = Array.isArray(value) ? value : [value]
  return parts.filter((part) => part.trim()).join(', ') || 'No disponible'
}

function ProductContent({ product }: { product: ProductDetail }) {
  const [imageFailed, setImageFailed] = useState(false)
  const [colorCode, setColorCode] = useState<number | undefined>(
    product.options.colors[0]?.code,
  )
  const [storageCode, setStorageCode] = useState<number | undefined>(
    product.options.storages[0]?.code,
  )
  const selectedColorCode = product.options.colors.some(({ code }) => code === colorCode)
    ? colorCode
    : product.options.colors[0]?.code
  const selectedStorageCode = product.options.storages.some(({ code }) => code === storageCode)
    ? storageCode
    : product.options.storages[0]?.code
  const { updateCount } = useCartCount()
  const addMutation = useMutation({
    mutationFn: addToCart,
    onSuccess: ({ count }) => updateCount(count),
  })
  const canAdd = selectedColorCode !== undefined && selectedStorageCode !== undefined
  const productName = `${product.brand} ${product.model}`

  function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (selectedColorCode === undefined || selectedStorageCode === undefined) return

    addMutation.mutate({
      id: product.id,
      colorCode: selectedColorCode,
      storageCode: selectedStorageCode,
    })
  }

  return (
    <div className={styles.layout}>
      <div className={styles.imagePanel}>
        {product.imgUrl && !imageFailed ? (
          <img
            className={styles.productImage}
            src={product.imgUrl}
            alt={productName}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <p className={styles.imageFallback}>Imagen no disponible</p>
        )}
      </div>

      <div className={styles.information}>
        <p className={styles.brand}>{product.brand}</p>
        <h1>{productName}</h1>
        <p className={styles.price}>
          {product.price.trim()
            ? `Precio: ${product.price}`
            : 'Precio no disponible'}
        </p>

        <section aria-labelledby="specifications-title">
          <h2 id="specifications-title">Características</h2>
          <dl className={styles.specifications}>
            <div><dt>CPU</dt><dd>{formatSpec(product.cpu)}</dd></div>
            <div><dt>RAM</dt><dd>{formatSpec(product.ram)}</dd></div>
            <div><dt>Sistema operativo</dt><dd>{formatSpec(product.os)}</dd></div>
            <div>
              <dt>Pantalla</dt>
              <dd>
                {formatSpec(product.displayResolution)}<br />
                {formatSpec(product.displaySize)}
              </dd>
            </div>
            <div><dt>Batería</dt><dd>{formatSpec(product.battery)}</dd></div>
            <div><dt>Cámara principal</dt><dd>{formatSpec(product.primaryCamera)}</dd></div>
            <div><dt>Cámara secundaria</dt><dd>{formatSpec(product.secondaryCmera)}</dd></div>
            <div><dt>Dimensiones</dt><dd>{formatSpec(product.dimentions)}</dd></div>
            <div><dt>Peso</dt><dd>{formatSpec(product.weight)}</dd></div>
          </dl>
        </section>

        <form className={styles.actions} onSubmit={handleAdd}>
          <h2>Elegí tus opciones</h2>
          <div className={styles.selectors}>
            <div>
              <label htmlFor="product-storage">Almacenamiento</label>
              <select
                id="product-storage"
                value={selectedStorageCode ?? ''}
                disabled={product.options.storages.length === 0 || addMutation.isPending}
                onChange={(event) => {
                  setStorageCode(Number(event.target.value))
                  addMutation.reset()
                }}
              >
                {product.options.storages.length === 0 && (
                  <option value="">Sin opciones</option>
                )}
                {product.options.storages.map(({ code, name }) => (
                  <option key={code} value={code}>{name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="product-color">Color</label>
              <select
                id="product-color"
                value={selectedColorCode ?? ''}
                disabled={product.options.colors.length === 0 || addMutation.isPending}
                onChange={(event) => {
                  setColorCode(Number(event.target.value))
                  addMutation.reset()
                }}
              >
                {product.options.colors.length === 0 && (
                  <option value="">Sin opciones</option>
                )}
                {product.options.colors.map(({ code, name }) => (
                  <option key={code} value={code}>{name}</option>
                ))}
              </select>
            </div>
          </div>
          {!canAdd && (
            <p className={styles.note}>Este producto no tiene todas las opciones necesarias.</p>
          )}
          <button type="submit" disabled={!canAdd || addMutation.isPending}>
            {addMutation.isPending ? 'Añadiendo…' : 'Añadir a la cesta'}
          </button>
          {addMutation.isError && (
            <p className={styles.error} role="alert">
              No se pudo añadir el producto. Podés intentarlo de nuevo.
            </p>
          )}
          {addMutation.isSuccess && (
            <p className={styles.success} role="status">
              Producto añadido a la cesta.
            </p>
          )}
        </form>
      </div>
    </div>
  )
}

export function ProductDetailPage() {
  const { id = '' } = useParams()
  const { data, isPending, isError, isFetching, error, refetch } = useQuery({
    queryKey: ['product', id],
    queryFn: ({ signal }) => getProduct(id, signal),
    enabled: Boolean(id),
    retry: false,
  })

  const notFound = isError && !data && error instanceof ApiError && error.status === 404

  return (
    <main className={styles.page}>
      <Link className={styles.backLink} to="/">← Volver al catálogo</Link>

      {isPending && <p role="status">Cargando producto…</p>}

      {notFound && (
        <div className={styles.state}>
          <h1>Producto no encontrado</h1>
          <p>Este producto no está disponible en el catálogo.</p>
        </div>
      )}

      {isError && !data && !notFound && (
        <div className={styles.state} role="alert">
          <h1>No pudimos cargar el producto</h1>
          <button type="button" onClick={() => void refetch()}>Reintentar</button>
        </div>
      )}

      {isError && data && (
        <p className={styles.error} role="alert">
          No se pudo actualizar el producto. Se muestran los datos guardados.
        </p>
      )}

      {isFetching && data && !isError && (
        <p className={styles.refreshing} role="status">
          Actualizando producto…
        </p>
      )}

      {data && <ProductContent key={data.id} product={data} />}
    </main>
  )
}
