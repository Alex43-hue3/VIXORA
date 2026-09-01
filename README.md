# NETVISION · V4 MOBILE PLAYER FIX

Esta versión corrige la selección de fuentes para teléfonos.

Cambios:
- En móvil prioriza `proxy_url` y reproductores embed antes que streams directos de terceros.
- Usa `playsinline`/`webkit-playsinline` y reproducción iniciada por el usuario.
- Añade `crossOrigin` y configuración HLS más tolerante.
- Detecta y muestra errores de video en vez de dejar una pantalla negra.
- Mantiene MP4/WebM/HLS y reproductores externos.
- En computadora conserva el catálogo y la navegación existentes.

Si un proveedor externo bloquea la reproducción dentro de un iframe, la aplicación lo muestra como reproductor externo; ese bloqueo depende del proveedor y no del catálogo.
