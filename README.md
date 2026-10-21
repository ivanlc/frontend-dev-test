# Mobile Shop

## Overview

Mobile Shop is a client-side React application for browsing mobile devices and adding a selected color and storage variant to a cart. It implements the frontend assessment only; the API is provided externally.

## Tech Stack

- React, TypeScript, and Vite
- React Router for client-side navigation
- TanStack Query for GET requests and client-side caching
- CSS Modules for component styles
- Vitest, React Testing Library, and ESLint

## Features

- Product catalog with a responsive grid of up to four items per row.
- Immediate, case-insensitive search by brand or model without additional API requests.
- Product details with specifications and color and storage selectors. The first available option is selected by default.
- Add-to-cart action that sends the selected product and option codes. The header displays the count returned by the API on both pages.
- Loading, empty, error, and not-found states, plus a label for products without a price.
- Accessible labels, keyboard-operable controls, and image fallbacks.

## Getting Started

Requires Node.js `^22.13.0`, `^24.0.0`, or `>=26.0.0`, and npm.

```sh
npm ci
npm run start
```

Open `http://localhost:5173`. Run `npm run build` for a production build, `npm test` for the test suite, and `npm run lint` for static checks. `npm run dev` is an alias for `start`.

In development and Vite preview, `/api` is proxied to `https://itx-frontend-test.onrender.com`. This keeps the cart session cookie on the application's origin. A deployed host needs an equivalent reverse proxy; static hosting alone cannot preserve the cart session. If the host proxies the API under another same-origin prefix, set that prefix in a Git-ignored `.env.local` file:

```dotenv
VITE_API_BASE_URL=/backend
```

This example requires the host to forward `/backend/api` to the upstream `/api`. Do not put credentials in this file. A production host must also serve `index.html` for client-side routes.

## Architecture

- React Router serves the catalog at `/` and product details at `/product/:id`; unknown routes show a 404 page.
- `src/api` centralizes HTTP access. Product IDs and prices remain strings, and API field names are preserved as supplied, including `dimentions` and `secondaryCmera`.
- TanStack Query persists successful catalog and product-detail GET responses in `localStorage` with a one-hour maximum snapshot age. Fresh data is reused after navigation or reload; stale queries revalidate when revisited, focused, or reconnected, and active queries revalidate hourly. If storage is unavailable, in-memory caching still works.
- Cart additions send `id`, `colorCode`, and `storageCode` as a mutation. The shared counter uses the response `count` and persists it in `localStorage`; it is not incremented optimistically.

The stored count is local to the browser and may differ from the server's state in another session. The application does not show cart contents or provide checkout. The hosted API may respond slowly after an idle period.

## Testing

```sh
npm test
npm run lint
npm run build
```

Automated tests cover catalog search and states, navigation, product variants, cart request and counter behavior, and one-hour cache expiry and revalidation. The live cart endpoint accepted a controlled POST; the browser add-to-cart flow is tested with mocked responses rather than a live end-to-end POST.
