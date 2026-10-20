# Mobile Shop — prueba frontend ITX

SPA de React para explorar dispositivos móviles y añadir variantes al carrito. Este repositorio implementa únicamente el ejercicio frontend. El backend y la API son externos.

## Estado

Hito 2: catálogo conectado al API con búsqueda por marca o modelo, tarjetas adaptables y estados de carga, vacío y error. La ruta de detalle sigue siendo provisional; las variantes y el carrito se implementarán en el hito 3.

## Requisitos y ejecución

- Node.js 22.13.x, 24.x o 26+ y npm.
- `npm ci` para instalar las versiones del lockfile.
- `npm run start` para iniciar el servidor de desarrollo.
- `npm run build` para comprobar tipos y generar la compilación de producción.
- `npm test` para ejecutar Vitest.
- `npm run lint` para ejecutar ESLint.

`npm run dev` es un alias de `start`.

La API usa por defecto `https://itx-frontend-test.onrender.com`. Para cambiarla, definir `VITE_API_BASE_URL` en un `.env.local` sin barra final, por ejemplo `VITE_API_BASE_URL=https://example.com`. No guardar credenciales en ese archivo ni versionarlo.

## Decisiones de diseño

- React Router maneja `/` y `/product/:id` del lado del cliente; las rutas desconocidas muestran 404. El hosting de producción deberá devolver `index.html` para rutas de la SPA.
- La búsqueda filtra en memoria los productos ya obtenidos, comparando marca o modelo sin distinguir mayúsculas. Las tarjetas enlazan al detalle y muestran «Precio no disponible» cuando el API devuelve una cadena vacía.
- `src/api` centraliza el acceso HTTP. Los tipos conservan los nombres de la API, incluso `dimentions` y `secondaryCmera`. Los IDs y precios son cadenas; un precio vacío no se convierte en uno inventado.
- TanStack Query almacenará únicamente respuestas GET en memoria. Cada respuesta exitosa se considera fresca durante una hora (`staleTime`). Después de una hora inactiva se descarta (`gcTime`). Mientras una consulta permanezca activa, se intenta revalidar cada hora; al volver a montarla, enfocar la pestaña o recuperar conexión, se revalida si está vencida. Recargar la página vacía esta caché y realiza un nuevo GET. La expiración y sus disparadores tendrán pruebas con reloj simulado en el hito 4.
- El POST del carrito será una mutación en el hito 3. Su respuesta actualizará el contador compartido, que se guardará en el navegador. Ese valor restaurado es local y puede no reflejar el estado de otra sesión.

## Limitaciones actuales

La ruta de detalle muestra contenido provisional. No hay llamadas POST ni interfaz de carrito en este hito. La API alojada en Render puede tardar en responder durante su arranque.
