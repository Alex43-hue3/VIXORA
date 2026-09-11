NETVISION 1.1 — V14 BÚSQUEDA PRIORITARIA

Base: V13 Catálogo Inteligente.

Cambios:
- La API comparte solicitudes por página para evitar peticiones duplicadas cuando la construcción del catálogo y una búsqueda necesitan la misma página al mismo tiempo.
- La búsqueda ya no espera a que termine la construcción completa del catálogo.
- Mientras el catálogo completo se construye en segundo plano, la búsqueda recorre páginas en bloques de 12 y termina en cuanto encuentra coincidencias.
- El catálogo completo continúa guardándose en caché al terminar.

PRUEBA PRINCIPAL
1. Borra el localStorage/cache del sitio o usa una ventana limpia.
2. Entra a Películas.
3. Antes de que termine la carga completa, busca "Star Wars".
4. Repite con "Transformers".
5. Comprueba que no tengas que esperar los ~70 segundos para obtener resultados.
6. Al terminar la carga completa, repite ambas búsquedas: deben ser inmediatas desde caché.

Resultado de referencia V13:
6,788 películas · catálogo completo · 70.2s


## V15 — Búsqueda prioritaria optimizada
La búsqueda de películas usa bloques de hasta 48 páginas y se detiene inmediatamente al encontrar coincidencias. No espera a construir las ~14 mil películas completas. Las páginas solicitadas se comparten mediante el caché de promesas de la API para evitar solicitudes duplicadas. El catálogo completo sigue siendo una tarea separada de segundo plano cuando no hay una búsqueda activa.


## NETVISION V16 — Interacción prioritaria
- La carga masiva del catálogo cede el turno cuando el usuario inicia una búsqueda.
- La búsqueda trabaja en bloques independientes y muestra coincidencias sin esperar a completar el catálogo.
- Se redujo el tamaño de los lotes del precargador de películas para disminuir presión de red/CPU.
- Se evita reconstruir miles de tarjetas y escribir localStorage en cada lote de carga.
- El campo de búsqueda espera 400 ms antes de lanzar una búsqueda para evitar peticiones innecesarias mientras se escribe.
- Al terminar la búsqueda, el precargador puede continuar desde donde se quedó.


## V17 — Catálogo completo seguro + búsqueda progresiva
- Corrige el falso final que podía ocurrir cuando una página dentro de un lote paralelo devolvía `hasNext=false`.
- El catálogo solo se marca como `completo` cuando realmente se alcanza `totalPages`.
- La búsqueda muestra las primeras coincidencias en cuanto aparecen, pero continúa recorriendo páginas para encontrar más títulos de una misma franquicia.
- La carga masiva cede prioridad a la búsqueda y no reconstruye miles de tarjetas en cada respuesta.


## V18 — Catálogo único
- Películas y series consultan únicamente PelisPlusHD en esta versión.
- Las respuestas se combinan y deduplican por ID/título+año.
- El fin del catálogo usa el mayor total de páginas reportado por los proveedores.
- La caché cambió a v2 para evitar reutilizar el catálogo de V17.


## V19 — Catálogo Doble Estable + Recuperación
- Esta versión usa PelisPlusHD como único proveedor de catálogo y reproducción.
- Reintenta automáticamente las solicitudes HTTP fallidas.
- Usa una concurrencia más conservadora para reducir cortes.
- Un fallo temporal de una página ya no se interpreta inmediatamente como fin del catálogo.
- Guarda checkpoints con mayor frecuencia para conservar el progreso.
- Usa una caché nueva (`v3`) para no reutilizar resultados incompletos de V18.
- Objetivo de esta versión: repetir la carga de ~17,000+ películas en una sola ejecución y medir estabilidad real.
