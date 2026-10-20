import { getJson } from './client'
import type { ProductDetail, ProductSummary } from './types'

export function getProducts(signal?: AbortSignal): Promise<ProductSummary[]> {
  return getJson<ProductSummary[]>('/api/product', signal)
}

export function getProduct(
  id: string,
  signal?: AbortSignal,
): Promise<ProductDetail> {
  return getJson<ProductDetail>(`/api/product/${encodeURIComponent(id)}`, signal)
}
