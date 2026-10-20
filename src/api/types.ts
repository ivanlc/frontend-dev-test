/** Fields used by the catalog and shared with the detail response. */
export interface ProductSummary {
  id: string
  brand: string
  model: string
  price: string
  imgUrl: string
}

export interface ProductOption {
  code: number
  name: string
}

/** API field names and value shapes follow observed GET responses. */
export interface ProductDetail extends ProductSummary {
  cpu: string
  ram: string
  os: string
  displayResolution: string
  displaySize: string
  battery: string
  primaryCamera: string[]
  secondaryCmera: string | string[]
  dimentions: string
  weight: string
  options: {
    colors: ProductOption[]
    storages: ProductOption[]
  }
}

export interface AddToCartRequest {
  id: string
  colorCode: number
  storageCode: number
}

export interface AddToCartResponse {
  count: number
}
