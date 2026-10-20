import { Link, useLocation } from 'react-router-dom'
import { useCartCount } from '../cart/CartCountProvider'
import styles from './Header.module.css'

export function Header() {
  const { pathname } = useLocation()
  const { count } = useCartCount()
  const isCatalog = pathname === '/'
  const isDetail = pathname.startsWith('/product/')

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link className={styles.title} to="/">
          Mobile Shop
        </Link>
        <nav className={styles.breadcrumbs} aria-label="Ruta de navegación">
          {isCatalog ? (
            <span aria-current="page">Catálogo</span>
          ) : (
            <>
              <Link to="/">Catálogo</Link>
              <span aria-hidden="true">/</span>
              <span aria-current="page">
                {isDetail ? 'Detalle' : 'Página no encontrada'}
              </span>
            </>
          )}
        </nav>
        <output className={styles.cartCount} aria-live="polite">
          Cesta <strong>{count}</strong>
        </output>
      </div>
    </header>
  )
}
