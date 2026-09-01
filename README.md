# NETVISION CATALOG TEST V2

Prueba aislada para catálogo y reproducción.

Películas:
- catálogo paginado
- detalle
- selección automática de fuente
- prioriza servidor cuyo nombre contenga Vidhide
- fallback a otras fuentes devueltas por la API

Series:
- catálogo
- intenta interpretar temporadas y episodios
- reproducción por episodio
- selección automática de fuente

No modifica el proyecto NETVISION.


Corrección móvil V3:
- evita depender de autoplay después de llamadas async;
- prepara HLS/MP4 y muestra un botón de reproducción cuando el navegador móvil bloquea autoplay;
- añade atributos playsinline para iPhone/iPad;
- amplía la detección de fuentes devueltas por la API;
- deja los iframes externos como último recurso.
