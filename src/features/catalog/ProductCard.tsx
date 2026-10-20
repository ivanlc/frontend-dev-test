import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { ProductSummary } from '../../api/types'
import styles from './ProductListPage.module.css'

interface ProductCardProps {
  product: ProductSummary
}

export function ProductCard({ product }: ProductCardProps) {
  const [imageFailed, setImageFailed] = useState(false)
  const productName = `${product.brand} ${product.model}`

  return (
    <li className={styles.card}>
      <Link className={styles.cardLink} to={`/product/${encodeURIComponent(product.id)}`}>
        <div className={styles.imageFrame}>
          {product.imgUrl && !imageFailed ? (
            <img
              className={styles.productImage}
              src={product.imgUrl}
              alt={productName}
              loading="lazy"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <span className={styles.imageFallback}>Imagen no disponible</span>
          )}
        </div>
        <div className={styles.cardBody}>
          <p className={styles.brand}>{product.brand}</p>
          <h2 className={styles.model}>{product.model}</h2>
          <p className={styles.price}>
            {product.price.trim()
              ? `Precio: ${product.price}`
              : 'Precio no disponible'}
          </p>
        </div>
      </Link>
    </li>
  )
}
