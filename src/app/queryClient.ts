import { QueryClient } from '@tanstack/react-query'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'

export const ONE_HOUR_MS = 60 * 60 * 1000

export const PRODUCT_CACHE_KEY = 'itx-product-query-cache'

function availableStorage(): Storage | undefined {
  try {
    return typeof window === 'undefined' ? undefined : window.localStorage
  } catch {
    return undefined
  }
}

export function createQueryPersistenceOptions(storage = availableStorage()) {
  return {
    persister: createAsyncStoragePersister({
      storage,
      key: PRODUCT_CACHE_KEY,
      throttleTime: 0,
    }),
    maxAge: ONE_HOUR_MS,
    dehydrateOptions: {
      shouldDehydrateQuery: (query: { queryKey: readonly unknown[]; state: { status: string } }) =>
        query.state.status === 'success' && (
          (query.queryKey.length === 1 && query.queryKey[0] === 'products') ||
          (query.queryKey.length === 2 && query.queryKey[0] === 'product' &&
            typeof query.queryKey[1] === 'string')
        ),
      shouldDehydrateMutation: () => false,
    },
  }
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: ONE_HOUR_MS,
        gcTime: ONE_HOUR_MS,
        refetchInterval: ONE_HOUR_MS,
        refetchOnMount: true,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      },
    },
  })
}

export const queryClient = createQueryClient()
