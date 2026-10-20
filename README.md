# Mobile Shop — prueba frontend ITX

SPA de React para explorar dispositivos móviles y añadir variantes al carrito. Este repositorio implementa únicamente el ejercicio frontend. El backend y la API son externos.

## Estado

Hito 4: catálogo y detalle conectados a la API, variantes seleccionables y contador compartido de la cesta. La interfaz tiene dos vistas principales: lista y detalle, más estados de error y 404.

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
- El detalle muestra los datos de pantalla del proveedor juntos, sin deducir cuál de `displayResolution` o `displaySize` representa cada medida. Los selectores de color y almacenamiento muestran incluso una opción única y eligen la primera disponible por defecto. Si falta alguna opción, el botón de añadir queda deshabilitado.
- `src/api` centraliza el acceso HTTP. Los tipos conservan los nombres de la API, incluso `dimentions` y `secondaryCmera`. Los IDs y precios son cadenas; un precio vacío no se convierte en uno inventado.
- TanStack Query guarda únicamente respuestas GET en memoria, por clave: catálogo y cada producto. Una respuesta exitosa es fresca durante una hora desde que se recibió (`staleTime`); una lectura durante ese plazo reutiliza el dato. Al vencer, un nuevo acceso hace otro GET. Una consulta abierta intenta revalidarse cada hora (`refetchInterval`); al volver a montarla, enfocar la pestaña o recuperar conexión también se revalida si está vencida. Si el GET de actualización falla, se muestra el dato anterior con un aviso y se vuelve a intentar en el siguiente disparador. Las consultas sin observadores se eliminan tras una hora inactivas (`gcTime`), por lo que ese plazo de retención puede terminar después de la hora de frescura; el dato vencido nunca se considera fresco. Recargar la página vacía esta caché y realiza un nuevo GET. Los límites de frescura y la revalidación de una consulta activa se comprueban con reloj simulado.
- `POST /api/cart` es una mutación: envía únicamente `id`, `colorCode` y `storageCode`. Tras una respuesta exitosa, la cabecera usa el `count` devuelto y lo guarda en `localStorage`; no incrementa el número de forma optimista. Ese valor restaurado es local y puede no reflejar el estado de otra sesión.

## Limitaciones actuales

El POST del carrito se ha probado con respuestas simuladas y todavía no se ha enviado una petición real durante el desarrollo; su comportamiento frente al servicio real sigue pendiente de validar. La aplicación muestra el contador, no el contenido de la cesta ni un checkout. La API alojada en Render puede tardar en responder durante su arranque.
