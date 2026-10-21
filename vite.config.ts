import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://itx-frontend-test.onrender.com',
        changeOrigin: true,
        fetch: globalThis.fetch,
        fetchOptions: {
          onBeforeRequest: (request) => {
            const headers = new Headers(request.headers)
            headers.set('accept-encoding', 'identity')
            request.headers = headers
          },
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
