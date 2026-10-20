import { postJson } from './client'
import type { AddToCartRequest, AddToCartResponse } from './types'

export async function addToCart(
  selection: AddToCartRequest,
): Promise<AddToCartResponse> {
  const response = await postJson<AddToCartResponse, AddToCartRequest>(
    '/api/cart',
    selection,
  )

  if (!response || !Number.isInteger(response.count) || response.count < 0) {
    throw new Error('Invalid cart response count')
  }

  return response
}
