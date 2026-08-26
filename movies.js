```javascript
/* =========================================================
   NETVISION - MOVIES.JS
   LA MOVIE API
   Catálogo + Detalle + Servidores + Reproductor
========================================================= */

"use strict";


/* =========================================================
   CONFIGURACIÓN
========================================================= */

const MOVIES_API =
    "https://lamoviebot.tvymas.workers.dev/peliculas?page=";

const MOVIE_DETAIL_API =
    "https://lamoviebot.tvymas.workers.dev/pelicula/";

const STREAM_URL_API =
    "https://lamoviebot.tvymas.workers.dev/streamurl?url=";

const STREAM_PROXY_API =
    "https://lamoviebot.tvymas.workers.dev/streamproxy?url=";


/* =========================================================
   VARIABLES
========================================================= */

let moviesPage = 1;

let moviesTotalPages = 1;

let moviesLoading = false;

let selectedMovie = null;

let currentMovieVideo = null;


/* =========================================================
   INICIO
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        console.log(
            "NETVISION - movies.js iniciado"
        );

        /*
         * Solo cargar películas si existe
         * el contenedor.
         *
         * Esto evita interferir con TV
         * o Series.
         */

        if (
            document.getElementById(
                "moviesGrid"
            )
        ) {

            loadMovies(1);

        }


        setupMovieModal();

    }
);


/* =========================================================
   CARGAR PELÍCULAS
========================================================= */

async function loadMovies(
    page = 1
) {

    if (moviesLoading) {

        return;

    }


    const grid =
        document.getElementById(
            "moviesGrid"
        );


    if (!grid) {

        console.warn(
            "NETVISION - No existe #moviesGrid"
        );

        return;

    }


    moviesLoading = true;

    moviesPage = page;


    showMoviesLoading();


    try {

        const url =
            `${MOVIES_API}${page}`;


        console.log(
            "NETVISION - Consultando:",
            url
        );


        const response =
            await fetch(
                url,
                {
                    cache: "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );

        }


        const data =
            await response.json();


        console.log(
            "NETVISION - RESPUESTA PELÍCULAS:",
            data
        );


        /*
         * Detectar automáticamente
         * el arreglo de películas.
         */

        const movies =
            extractMovies(
                data
            );


        if (
            !Array.isArray(
                movies
            ) ||
            movies.length === 0
        ) {

            throw new Error(
                "La API respondió, pero no se encontró ninguna película."
            );

        }


        /*
         * Detectar total de páginas
         */

        moviesTotalPages =
            Number(
                data?.total_pages ||
                data?.totalPages ||
                data?.pages ||
                data?.pagination?.total_pages ||
                1
            );


        if (
            !Number.isFinite(
                moviesTotalPages
            ) ||
            moviesTotalPages < 1
        ) {

            moviesTotalPages = 1;

        }


        renderMovies(
            movies
        );


        updateMoviesPagination();


    } catch (error) {

        console.error(
            "NETVISION - ERROR CATÁLOGO:",
            error
        );


        showMoviesError(
            error.message
        );

    } finally {

        moviesLoading = false;

    }

}


/* =========================================================
   EXTRAER PELÍCULAS
========================================================= */

function extractMovies(
    data
) {

    if (
        Array.isArray(
            data
        )
    ) {

        return data;

    }


    const possibleArrays = [

        data?.movies,

        data?.peliculas,

        data?.results,

        data?.items,

        data?.data,

        data?.data?.movies,

        data?.data?.peliculas,

        data?.data?.results,

        data?.data?.items

    ];


    for (
        const value of possibleArrays
    ) {

        if (
            Array.isArray(
                value
            )
        ) {

            return value;

        }

    }


    return [];

}


/* =========================================================
   RENDER CATÁLOGO
========================================================= */

function renderMovies(
    movies
) {

    const grid =
        document.getElementById(
            "moviesGrid"
        );


    if (!grid) {

        return;

    }


    grid.innerHTML = "";


    movies.forEach(
        movie => {

            grid.appendChild(
                createMovieCard(
                    movie
                )
            );

        }
    );

}


/* =========================================================
   CREAR TARJETA
========================================================= */

function createMovieCard(
    movie
) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "netvision-movie-card";


    card.tabIndex = 0;


    const poster =
        movie.tmdb_poster ||
        movie.poster ||
        movie.image ||
        movie.cover ||
        movie.thumbnail ||
        "";


    const title =
        movie.title ||
        movie.name ||
        movie.nombre ||
        "Película";


    const rating =
        movie.tmdb_rating !== undefined
            ? Number(
                movie.tmdb_rating
            ).toFixed(1)
            : (
                movie.rating !== undefined
                    ? Number(
                        movie.rating
                    ).toFixed(1)
                    : "N/A"
            );


    const genres =
        Array.isArray(
            movie.tmdb_genres
        )
            ? movie.tmdb_genres
                .slice(0, 2)
                .join(" · ")
            : (
                Array.isArray(
                    movie.genres
                )
                    ? movie.genres
                        .slice(0, 2)
                        .join(" · ")
                    : ""
            );


    const year =
        movie.tmdb_release_date
            ? movie.tmdb_release_date
                .substring(0, 4)
            : (
                movie.release_date
                    ? String(
                        movie.release_date
                    ).substring(0, 4)
                    : (
                        movie.year ||
                        ""
                    )
            );


    card.innerHTML = `

        <div class="netvision-movie-poster">

            ${
                poster
                    ? `
                        <img
                            src="${escapeMovieAttr(
                                poster
                            )}"
                            alt="${escapeMovieAttr(
                                title
                            )}"
                            loading="lazy"
                        >
                    `
                    : `
                        <div class="movie-poster-empty">
                            🎬
                        </div>
                    `
            }


            <div class="netvision-movie-rating">

                ★ ${escapeMovieHTML(
                    rating
                )}

            </div>


            <div class="netvision-movie-overlay">

                <span>
                    ▶
                </span>

            </div>

        </div>


        <div class="netvision-movie-info">

            <h3>
                ${escapeMovieHTML(
                    title
                )}
            </h3>


            <div class="netvision-movie-meta">

                ${
                    year
                        ? `
                            <span>
                                ${escapeMovieHTML(
                                    year
                                )}
                            </span>
                        `
                        : ""
                }


                ${
                    genres
                        ? `
                            <span>
                                ${escapeMovieHTML(
                                    genres
                                )}
                            </span>
                        `
                        : ""
                }

            </div>

        </div>

    `;


    card.addEventListener(
        "click",
        () => {

            openMovieDetails(
                movie
            );

        }
    );


    card.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Enter"
            ) {

                openMovieDetails(
                    movie
                );

            }

        }
    );


    return card;

}


/* =========================================================
   DETALLE DE PELÍCULA
========================================================= */

async function openMovieDetails(
    movie
) {

    selectedMovie =
        movie;


    console.log(
        "NETVISION - PELÍCULA SELECCIONADA:",
        movie
    );


    const modal =
        document.getElementById(
            "contentModal"
        ) ||
        document.getElementById(
            "movieModal"
        );


    if (!modal) {

        console.warn(
            "NETVISION - No existe #contentModal ni #movieModal"
        );

        /*
         * Creamos un modal de emergencia
         * para no dejar la película sin interacción.
         */

        createMovieModal();

    }


    const activeModal =
        document.getElementById(
            "contentModal"
        ) ||
        document.getElementById(
            "movieModal"
        );


    if (!activeModal) {

        return;

    }


    fillMovieModal(
        movie
    );


    activeModal.classList.add(
        "active"
    );


    const playButton =
        document.getElementById(
            "playMovieBtn"
        );


    if (playButton) {

        playButton.disabled =
            true;


        playButton.innerHTML =
            "⏳ Buscando servidores...";


        playButton.onclick =
            null;

    }


    const serversContainer =
        document.getElementById(
            "movieServers"
        );


    if (serversContainer) {

        serversContainer.innerHTML = `

            <div class="movie-stream-loading">

                <div class="movies-spinner"></div>

                <p>
                    Buscando servidores...
                </p>

            </div>

        `;

    }


    await loadMovieServers(
        movie
    );

}


/* =========================================================
   RELLENAR MODAL
========================================================= */

function fillMovieModal(
    movie
) {

    const poster =
        document.getElementById(
            "movieModalPoster"
        );


    const title =
        document.getElementById(
            "movieModalTitle"
        );


    const overview =
        document.getElementById(
            "movieModalOverview"
        );


    const rating =
        document.getElementById(
            "movieModalRating"
        );


    const genres =
        document.getElementById(
            "movieModalGenres"
        );


    if (poster) {

        poster.src =
            movie.tmdb_poster ||
            movie.poster ||
            movie.image ||
            "";


        poster.alt =
            movie.title ||
            movie.name ||
            "Película";

    }


    if (title) {

        title.textContent =
            movie.title ||
            movie.name ||
            "Película";

    }


    if (overview) {

        overview.textContent =
            movie.tmdb_overview ||
            movie.overview ||
            movie.synopsis ||
            movie.description ||
            "Sinopsis no disponible.";

    }


    if (rating) {

        rating.textContent =
            `★ ${
                movie.tmdb_rating ??
                movie.rating ??
                "N/A"
            }`;

    }


    if (genres) {

        const movieGenres =
            Array.isArray(
                movie.tmdb_genres
            )
                ? movie.tmdb_genres
                : (
                    Array.isArray(
                        movie.genres
                    )
                        ? movie.genres
                        : []
                );


        genres.textContent =
            movieGenres.join(
                " · "
            );

    }

}


/* =========================================================
   OBTENER DETALLE / SERVIDORES
========================================================= */

async function loadMovieServers(
    movie
) {

    try {

        const slug =
            movie.slug ||
            movie.id ||
            movie.tmdb_id;


        if (!slug) {

            throw new Error(
                "La película no tiene slug o ID."
            );

        }


        const url =
            `${MOVIE_DETAIL_API}${encodeURIComponent(
                slug
            )}`;


        console.log(
            "NETVISION - CONSULTANDO DETALLE:",
            url
        );


        const response =
            await fetch(
                url,
                {
                    cache: "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );

        }


        const data =
            await response.json();


        console.log(
            "NETVISION - RESPUESTA DETALLE:",
            data
        );


        /*
         * Buscar automáticamente posibles
         * servidores / embeds.
         */

        const servers =
            extractServers(
                data
            );


        if (
            servers.length === 0
        ) {

            throw new Error(
                "La API no devolvió servidores o embeds para esta película."
            );

        }


        selectedMovie =
            {
                ...movie,
                detail: data,
                servers: servers
            };


        renderMovieServers(
            servers
        );


        const playButton =
            document.getElementById(
                "playMovieBtn"
            );


        if (playButton) {

            playButton.disabled =
                false;


            playButton.innerHTML =
                "▶ Ver opciones";


            playButton.onclick =
                () => {

                    renderMovieServers(
                        servers
                    );

                };

        }


    } catch (error) {

        console.error(
            "NETVISION - ERROR DETALLE:",
            error
        );


        renderMovieServersError(
            error.message
        );

    }

}


/* =========================================================
   EXTRAER SERVIDORES
========================================================= */

function extractServers(
    data
) {

    const found = [];


    function scan(
        value,
        depth = 0
    ) {

        if (
            depth > 8 ||
            value === null ||
            value === undefined
        ) {

            return;

        }


        if (
            typeof value ===
            "string"
        ) {

            if (
                looksLikeVideoURL(
                    value
                ) ||
                looksLikeEmbedURL(
                    value
                )
            ) {

                found.push({

                    name:
                        "Servidor",

                    url:
                        value,

                    embed_url:
                        value

                });

            }


            return;

        }


        if (
            Array.isArray(
                value
            )
        ) {

            value.forEach(
                item => {

                    scan(
                        item,
                        depth + 1
                    );

                }
            );


            return;

        }


        if (
            typeof value !==
            "object"
        ) {

            return;

        }


        /*
         * Objetos que parecen servidores
         */

        const directURL =
            value.url ||
            value.embed_url ||
            value.embed ||
            value.iframe ||
            value.src ||
            value.link ||
            value.stream_url ||
            value.video_url;


        if (
            typeof directURL ===
            "string" &&
            (
                looksLikeVideoURL(
                    directURL
                ) ||
                looksLikeEmbedURL(
                    directURL
                )
            )
        ) {

            found.push({

                ...value,

                name:
                    value.name ||
                    value.server ||
                    value.provider ||
                    "Servidor",

                url:
                    directURL,

                embed_url:
                    value.embed_url ||
                    value.embed ||
                    directURL

            });

        }


        Object.keys(
            value
        ).forEach(
            key => {

                /*
                 * Evitamos volver a registrar
                 * el mismo URL como string.
                 */

                if (
                    key === "url" ||
                    key === "embed_url" ||
                    key === "embed" ||
                    key === "iframe" ||
                    key === "src" ||
                    key === "link" ||
                    key === "stream_url" ||
                    key === "video_url"
                ) {

                    return;

                }


                scan(
                    value[key],
                    depth + 1
                );

            }
        );

    }


    scan(
        data
    );


    /*
     * Eliminar duplicados
     */

    const unique = [];


    const seen =
        new Set();


    found.forEach(
        server => {

            const key =
                server.url ||
                server.embed_url;


            if (
                !key ||
                seen.has(
                    key
                )
            ) {

                return;

            }


            seen.add(
                key
            );


            unique.push(
                server
            );

        }
    );


    return unique;

}


/* =========================================================
   MOSTRAR SERVIDORES
========================================================= */

function renderMovieServers(
    servers
) {

    let container =
        document.getElementById(
            "movieServers"
        );


    if (!container) {

        const modal =
            document.getElementById(
                "contentModal"
            ) ||
            document.getElementById(
                "movieModal"
            );


        if (!modal) {

            return;

        }


        container =
            document.createElement(
                "div"
            );


        container.id =
            "movieServers";


        container.className =
            "movie-servers";


        const playButton =
            document.getElementById(
                "playMovieBtn"
            );


        if (playButton) {

            playButton.before(
                container
            );

        } else {

            modal.appendChild(
                container
            );

        }

    }


    if (
        !Array.isArray(
            servers
        ) ||
        servers.length === 0
    ) {

        renderMovieServersError(
            "No se encontraron servidores."
        );

        return;

    }


    container.innerHTML = `

        <div class="movie-servers-title">

            <span>
                SERVIDORES DISPONIBLES
            </span>

        </div>


        <div class="movie-servers-list">

            ${servers.map(
                (
                    server,
                    index
                ) => {

                    const name =
                        server.name ||
                        server.server ||
                        server.provider ||
                        `Servidor ${index + 1}`;


                    return `

                        <button
                            type="button"
                            class="movie-server-btn"
                            data-server-index="${index}"
                        >

                            <span class="server-play">
                                ▶
                            </span>


                            <span class="server-info">

                                <strong>
                                    ${escapeMovieHTML(
                                        name
                                    )}
                                </strong>

                                <small>
                                    Reproducir
                                </small>

                            </span>

                        </button>

                    `;

                }
            ).join("")}

        </div>

    `;


    container
        .querySelectorAll(
            ".movie-server-btn"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async () => {

                        const index =
                            Number(
                                button.dataset
                                    .serverIndex
                            );


                        await selectMovieServer(
                            servers[index]
                        );

                    }
                );

            }
        );

}


/* =========================================================
   SELECCIONAR SERVIDOR
========================================================= */

async function selectMovieServer(
    server
) {

    if (!server) {

        return;

    }


    console.log(
        "NETVISION - SERVIDOR:",
        server
    );


    showMovieServerLoading(
        server
    );


    try {

        const embedURL =
            server.embed_url ||
            server.url ||
            server.embed ||
            server.iframe ||
            server.src ||
            server.link;


        if (!embedURL) {

            throw new Error(
                "El servidor no tiene URL."
            );

        }


        /*
         * Si ya parece un MP4 o M3U8,
         * reproducimos directamente.
         */

        if (
            looksLikeVideoURL(
                embedURL
            )
        ) {

            await playMovieURL(
                embedURL,
                server.name
            );

            return;

        }


        /*
         * Resolver embed mediante
         * /streamurl
         */

        const resolved =
            await resolveStreamURL(
                embedURL
            );


        if (
            !resolved
        ) {

            throw new Error(
                "No se pudo obtener la URL del vídeo."
            );

        }


        console.log(
            "NETVISION - STREAM RESUELTO:",
            resolved
        );


        await playMovieURL(
            resolved.url,
            server.name,
            resolved.referer
        );


    } catch (error) {

        console.error(
            "NETVISION - ERROR REPRODUCCIÓN:",
            error
        );


        showMovieStreamError(
            server,
            error
        );

    }

}


/* =========================================================
   RESOLVER STREAMURL
========================================================= */

async function resolveStreamURL(
    embedURL
) {

    const url =
        `${STREAM_URL_API}${encodeURIComponent(
            embedURL
        )}`;


    console.log(
        "NETVISION - RESOLVIENDO:",
        url
    );


    const response =
        await fetch(
            url,
            {
                cache: "no-store"
            }
        );


    if (!response.ok) {

        throw new Error(
            `streamurl respondió HTTP ${response.status}`
        );

    }


    const data =
        await response.json();


    console.log(
        "NETVISION - STREAMURL RESPONSE:",
        data
    );


    /*
     * Buscar URL automáticamente.
     */

    const videoURL =
        findFirstURL(
            data
        );


    if (!videoURL) {

        throw new Error(
            "streamurl no devolvió una URL de vídeo."
        );

    }


    return {

        url:
            videoURL,

        referer:
            data?.referer ||
            data?.ref ||
            embedURL

    };

}


/* =========================================================
   BUSCAR URL EN RESPUESTA
========================================================= */

function findFirstURL(
    data
) {

    const priorityKeys = [

        "url",

        "stream_url",

        "streamUrl",

        "video_url",

        "videoUrl",

        "file",

        "src",

        "m3u8",

        "mp4",

        "source"

    ];


    if (
        data &&
        typeof data ===
        "object"
    ) {

        for (
            const key of priorityKeys
        ) {

            if (
                typeof data[key] ===
                "string" &&
                looksLikeVideoURL(
                    data[key]
                )
            ) {

                return data[key];

            }

        }

    }


    let result =
        null;


    function scan(
        value,
        depth = 0
    ) {

        if (
            result ||
            depth > 8 ||
            value === null ||
            value === undefined
        ) {

            return;

        }


        if (
            typeof value ===
            "string"
        ) {

            if (
                looksLikeVideoURL(
                    value
                )
            ) {

                result =
                    value;

            }


            return;

        }


        if (
            Array.isArray(
                value
            )
        ) {

            value.some(
                item => {

                    scan(
                        item,
                        depth + 1
                    );

                    return Boolean(
                        result
                    );

                }
            );


            return;

        }


        if (
            typeof value ===
            "object"
        ) {

            Object.values(
                value
            ).some(
                item => {

                    scan(
                        item,
                        depth + 1
                    );

                    return Boolean(
                        result
                    );

                }
            );

        }

    }


    scan(
        data
    );


    return result;

}


/* =========================================================
   REPRODUCIR URL
========================================================= */

async function playMovieURL(
    url,
    serverName = "Servidor",
    referer = ""
) {

    if (!url) {

        throw new Error(
            "URL de reproducción vacía."
        );

    }


    console.log(
        "NETVISION - REPRODUCIENDO:",
        url
    );


    /*
     * Si es M3U8
     */

    if (
        isM3U8(
            url
        )
    ) {

        /*
         * Primero intentamos proxy si
         * tenemos referer.
         */

        if (
            referer &&
            !isSameOrigin(
                url
            )
        ) {

            const proxied =
                `${STREAM_PROXY_API}${encodeURIComponent(
                    url
                )}&ref=${encodeURIComponent(
                    referer
                )}`;


            console.log(
                "NETVISION - PROXY HLS:",
                proxied
            );


            try {

                await openMoviePlayer(
                    proxied,
                    serverName,
                    true
                );


                return;

            } catch (
                proxyError
            ) {

                console.warn(
                    "NETVISION - Proxy HLS falló, intentando URL original:",
                    proxyError
                );

            }

        }


        await openMoviePlayer(
            url,
            serverName,
            true
        );


        return;

    }


    /*
     * MP4 u otro vídeo HTML5
     */

    await openMoviePlayer(
        url,
        serverName,
        false
    );

}


/* =========================================================
   ABRIR REPRODUCTOR
========================================================= */

async function openMoviePlayer(
    url,
    title,
    isHLS
) {

    closeMoviePlayer();


    const overlay =
        document.createElement(
            "div"
        );


    overlay.id =
        "netvisionMoviePlayer";


    overlay.className =
        "netvision-movie-player";


    overlay.innerHTML = `

        <div class="netvision-movie-player-top">

            <div class="netvision-movie-player-title">

                <span>
                    NETVISION
                </span>

                <strong>
                    ${escapeMovieHTML(
                        title ||
                        selectedMovie?.title ||
                        "Película"
                    )}
                </strong>

            </div>


            <button
                type="button"
                id="closeNetvisionMoviePlayer"
                aria-label="Cerrar reproductor"
            >
                ×
            </button>

        </div>


        <div class="netvision-movie-video-wrap">

            <video
                id="netvisionMovieVideo"
                controls
                playsinline
                preload="metadata"
            ></video>

        </div>

    `;


    document.body.appendChild(
        overlay
    );


    injectMoviePlayerStyles();


    const close =
        document.getElementById(
            "closeNetvisionMoviePlayer"
        );


    if (close) {

        close.addEventListener(
            "click",
            closeMoviePlayer
        );

    }


    const video =
        document.getElementById(
            "netvisionMovieVideo"
        );


    if (!video) {

        return;

    }


    currentMovieVideo =
        video;


    /*
     * HLS.js
     */

    if (
        isHLS
    ) {

        if (
            typeof Hls !==
            "undefined" &&
            Hls.isSupported()
        ) {

            const hls =
                new Hls({

                    enableWorker:
                        true,

                    lowLatencyMode:
                        false

                });


            hls.loadSource(
                url
            );


            hls.attachMedia(
                video
            );


            video._netvisionHls =
                hls;


            hls.on(
                Hls.Events.MANIFEST_PARSED,
                () => {

                    video
                        .play()
                        .catch(
                            () => {}
                        );

                }
            );


            hls.on(
                Hls.Events.ERROR,
                (
                    event,
                    data
                ) => {

                    console.error(
                        "NETVISION - HLS ERROR:",
                        data
                    );

                }
            );


        } else if (
            video.canPlayType(
                "application/vnd.apple.mpegurl"
            )
        ) {

            /*
             * Safari / soporte nativo
             */

            video.src =
                url;


            video
                .play()
                .catch(
                    () => {}
                );

        } else {

            throw new Error(
                "Este navegador no soporta reproducción HLS."
            );

        }

    } else {

        video.src =
            url;


        video
            .play()
            .catch(
                () => {}
            );

    }


    overlay.classList.add(
        "active"
    );

}


/* =========================================================
   CERRAR REPRODUCTOR
========================================================= */

function closeMoviePlayer() {

    const video =
        document.getElementById(
            "netvisionMovieVideo"
        );


    if (video) {

        if (
            video._netvisionHls
        ) {

            try {

                video
                    ._netvisionHls
                    .destroy();

            } catch (
                error
            ) {

                console.warn(
                    error
                );

            }

        }


        video.pause();


        video.removeAttribute(
            "src"
        );


        video.load();

    }


    const player =
        document.getElementById(
            "netvisionMoviePlayer"
        );


    if (player) {

        player.remove();

    }


    currentMovieVideo =
        null;

}


/* =========================================================
   CERRAR CON ESC
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key ===
            "Escape"
        ) {

            closeMoviePlayer();

        }

    }
);


/* =========================================================
   MODAL
========================================================= */

function setupMovieModal() {

    const closeButtons =
        document.querySelectorAll(
            "[data-close-modal], .modal-close, #closeMovieModal"
        );


    closeButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                closeMovieModal
            );

        }
    );


    const modal =
        document.getElementById(
            "contentModal"
        ) ||
        document.getElementById(
            "movieModal"
        );


    if (modal) {

        modal.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    modal
                ) {

                    closeMovieModal();

                }

            }
        );

    }

}


/* =========================================================
   CERRAR MODAL
========================================================= */

function closeMovieModal() {

    const modal =
        document.getElementById(
            "contentModal"
        ) ||
        document.getElementById(
            "movieModal"
        );


    if (modal) {

        modal.classList.remove(
            "active"
        );

    }


    /*
     * NO cerrar el reproductor
     * accidentalmente si está activo.
     */

}


/* =========================================================
   CREAR MODAL DE EMERGENCIA
========================================================= */

function createMovieModal() {

    if (
        document.getElementById(
            "contentModal"
        )
    ) {

        return;

    }


    const modal =
        document.createElement(
            "div"
        );


    modal.id =
        "contentModal";


    modal.className =
        "content-modal";


    modal.innerHTML = `

        <div class="movie-modal-box">

            <button
                type="button"
                class="modal-close"
                id="closeMovieModal"
            >
                ×
            </button>


            <div class="movie-modal-content">

                <img
                    id="movieModalPoster"
                    alt=""
                >


                <div
                    class="modal-info"
                >

                    <h2
                        id="movieModalTitle"
                    >
                    </h2>


                    <div
                        id="movieModalRating"
                    >
                    </div>


                    <div
                        id="movieModalGenres"
                    >
                    </div>


                    <p
                        id="movieModalOverview"
                    >
                    </p>


                    <button
                        type="button"
                        id="playMovieBtn"
                    >
                        ▶ Ver película
                    </button>


                    <div
                        id="movieServers"
                        class="movie-servers"
                    >
                    </div>

                </div>

            </div>

        </div>

    `;


    document.body.appendChild(
        modal
    );


    const close =
        document.getElementById(
            "closeMovieModal"
        );


    if (close) {

        close.addEventListener(
            "click",
            closeMovieModal
        );

    }


    modal.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                modal
            ) {

                closeMovieModal();

            }

        }
    );


    injectMovieModalStyles();

}


/* =========================================================
   LOADING SERVIDOR
========================================================= */

function showMovieServerLoading(
    server
) {

    let container =
        document.getElementById(
            "movieServers"
        );


    if (!container) {

        return;

    }


    container.innerHTML = `

        <div class="movie-stream-loading">

            <div class="movies-spinner"></div>


            <p>
                Conectando con
                <strong>
                    ${escapeMovieHTML(
                        server?.name ||
                        "servidor"
                    )}
                </strong>
                ...
            </p>

        </div>

    `;

}


/* =========================================================
   ERROR SERVIDORES
========================================================= */

function renderMovieServersError(
    message
) {

    let container =
        document.getElementById(
            "movieServers"
        );


    if (!container) {

        return;

    }


    container.innerHTML = `

        <div class="movie-stream-error">

            <div class="stream-result-icon">
                ⚠️
            </div>


            <h3>
                No se encontraron
                servidores
            </h3>


            <p>
                ${escapeMovieHTML(
                    message ||
                    "No disponible"
                )}
            </p>


            <button
                type="button"
                class="movie-back-servers"
                onclick="renderMovieServers(selectedMovie?.servers || [])"
            >
                ← Volver
            </button>

        </div>

    `;

}


/* =========================================================
   ERROR STREAM
========================================================= */

function showMovieStreamError(
    server,
    error
) {

    const container =
        document.getElementById(
            "movieServers"
        );


    if (!container) {

        return;

    }


    container.innerHTML = `

        <div class="movie-stream-error">

            <div class="stream-result-icon">
                ⚠️
            </div>


            <h3>
                No se pudo reproducir
            </h3>


            <p>
                ${escapeMovieHTML(
                    server?.name ||
                    "Servidor"
                )}
            </p>


            <small>
                ${escapeMovieHTML(
                    error?.message ||
                    "Error desconocido"
                )}
            </small>


            <button
                type="button"
                class="movie-back-servers"
                id="backMovieServersError"
            >
                ← Volver a servidores
            </button>

        </div>

    `;


    const back =
        document.getElementById(
            "backMovieServersError"
        );


    if (back) {

        back.addEventListener(
            "click",
            () => {

                renderMovieServers(
                    selectedMovie?.servers ||
                    []
                );

            }
        );

    }

}


/* =========================================================
   PAGINACIÓN
========================================================= */

function updateMoviesPagination() {

    const pageInfo =
        document.getElementById(
            "moviesPageInfo"
        );


    const previous =
        document.getElementById(
            "moviesPrevious"
        );


    const next =
        document.getElementById(
            "moviesNext"
        );


    if (pageInfo) {

        pageInfo.textContent =
            `Página ${moviesPage} de ${moviesTotalPages}`;

    }


    if (previous) {

        previous.disabled =
            moviesPage <= 1;

    }


    if (next) {

        next.disabled =
            moviesPage >=
            moviesTotalPages;

    }

}


function previousMoviesPage() {

    if (
        moviesPage <= 1 ||
        moviesLoading
    ) {

        return;

    }


    loadMovies(
        moviesPage - 1
    );


    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });

}


function nextMoviesPage() {

    if (
        moviesPage >=
        moviesTotalPages ||
        moviesLoading
    ) {

        return;

    }


    loadMovies(
        moviesPage + 1
    );


    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });

}


/* =========================================================
   LOADING CATÁLOGO
========================================================= */

function showMoviesLoading() {

    const grid =
        document.getElementById(
            "moviesGrid"
        );


    if (!grid) {

        return;

    }


    grid.innerHTML = `

        <div class="movies-message">

            <div class="movies-spinner"></div>


            <p>
                Cargando películas...
            </p>

        </div>

    `;

}


/* =========================================================
   ERROR CATÁLOGO
========================================================= */

function showMoviesError(
    message
) {

    const grid =
        document.getElementById(
            "moviesGrid"
        );


    if (!grid) {

        return;

    }


    grid.innerHTML = `

        <div class="movies-message movies-error">

            <div>
                ⚠️
            </div>


            <h3>
                No se pudieron cargar
                las películas
            </h3>


            <p>
                ${escapeMovieHTML(
                    message ||
                    "Comprueba tu conexión."
                )}
            </p>


            <button
                type="button"
                id="retryMoviesButton"
            >
                Reintentar
            </button>

        </div>

    `;


    const retry =
        document.getElementById(
            "retryMoviesButton"
        );


    if (retry) {

        retry.addEventListener(
            "click",
            () => {

                loadMovies(
                    1
                );

            }
        );

    }

}


/* =========================================================
   DETECTORES DE URL
========================================================= */

function looksLikeVideoURL(
    url
) {

    if (
        typeof url !==
        "string"
    ) {

        return false;

    }


    const lower =
        url.toLowerCase();


    return (

        lower.includes(
            ".m3u8"
        ) ||

        lower.includes(
            ".mp4"
        ) ||

        lower.includes(
            ".webm"
        ) ||

        lower.includes(
            ".mkv"
        ) ||

        lower.includes(
            ".mov"
        ) ||

        lower.includes(
            ".mpd"
        ) ||

        lower.includes(
            "manifest"

        ) ||

        lower.includes(
            "playlist"

        )

    );

}


function looksLikeEmbedURL(
    url
) {

    if (
        typeof url !==
        "string"
    ) {

        return false;

    }


    const lower =
        url.toLowerCase();


    return (

        lower.includes(
            "embed"
        ) ||

        lower.includes(
            "iframe"
        ) ||

        lower.includes(
            "player"
        ) ||

        lower.includes(
            "video"
        )

    );

}


function isM3U8(
    url
) {

    return (
        typeof url ===
        "string" &&
        (
            url.toLowerCase()
                .includes(
                    ".m3u8"
                )
        )
    );

}


function isSameOrigin(
    url
) {

    try {

        return (
            new URL(
                url
            ).origin ===
            window.location.origin
        );

    } catch (
        error
    ) {

        return false;

    }

}


/* =========================================================
   ESTILOS REPRODUCTOR
========================================================= */

function injectMoviePlayerStyles() {

    if (
        document.getElementById(
            "netvisionMoviePlayerStyles"
        )
    ) {

        return;

    }


    const style =
        document.createElement(
            "style"
        );


    style.id =
        "netvisionMoviePlayerStyles";


    style.textContent = `

        .netvision-movie-player {

            position: fixed;

            inset: 0;

            z-index: 999999;

            display: none;

            flex-direction: column;

            background: #000;

        }


        .netvision-movie-player.active {

            display: flex;

        }


        .netvision-movie-player-top {

            min-height: 58px;

            display: flex;

            align-items: center;

            justify-content: space-between;

            padding: 8px 16px;

            box-sizing: border-box;

            background:
                rgba(
                    10,
                    10,
                    10,
                    .96
                );

            color: #fff;

        }


        .netvision-movie-player-title {

            display: flex;

            flex-direction: column;

            min-width: 0;

        }


        .netvision-movie-player-title span {

            font-size: 10px;

            letter-spacing: 2px;

            opacity: .5;

        }


        .netvision-movie-player-title strong {

            font-size: 15px;

            white-space: nowrap;

            overflow: hidden;

            text-overflow: ellipsis;

            max-width: 75vw;

        }


        #closeNetvisionMoviePlayer {

            width: 42px;

            height: 42px;

            border: 0;

            border-radius: 50%;

            background:
                rgba(
                    255,
                    255,
                    255,
                    .1
                );

            color: #fff;

            font-size: 28px;

            cursor: pointer;

            flex-shrink: 0;

        }


        .netvision-movie-video-wrap {

            flex: 1;

            min-height: 0;

            display: flex;

            align-items: center;

            justify-content: center;

            background: #000;

        }


        .netvision-movie-video-wrap video {

            width: 100%;

            height: 100%;

            object-fit: contain;

        }


        @media (
            max-width: 700px
        ) {

            .netvision-movie-player-top {

                min-height: 52px;

                padding:
                    6px 10px;

            }

        }

    `;


    document.head.appendChild(
        style
    );

}


/* =========================================================
   ESTILOS MODAL DE EMERGENCIA
========================================================= */

function injectMovieModalStyles() {

    if (
        document.getElementById(
            "netvisionMovieModalStyles"
        )
    ) {

        return;

    }


    const style =
        document.createElement(
            "style"
        );


    style.id =
        "netvisionMovieModalStyles";


    style.textContent = `

        .content-modal {

            position: fixed;

            inset: 0;

            z-index: 99990;

            display: none;

            align-items: center;

            justify-content: center;

            padding: 20px;

            box-sizing: border-box;

            background:
                rgba(
                    0,
                    0,
                    0,
                    .75
                );

            overflow-y: auto;

        }


        .content-modal.active {

            display: flex;

        }


        .movie-modal-box {

            position: relative;

            width: min(
                900px,
                100%
            );

            max-height: 90vh;

            overflow-y: auto;

            padding: 25px;

            border-radius: 18px;

            background:
                #111;

            color: #fff;

        }


        .modal-close {

            position: absolute;

            right: 15px;

            top: 15px;

            width: 40px;

            height: 40px;

            border: 0;

            border-radius: 50%;

            background:
                rgba(
                    255,
                    255,
                    255,
                    .1
                );

            color: #fff;

            font-size: 25px;

            cursor: pointer;

        }


        .movie-modal-content {

            display: grid;

            grid-template-columns:
                250px
                1fr;

            gap: 25px;

        }


        .movie-modal-content > img {

            width: 100%;

            border-radius: 12px;

        }


        .modal-info h2 {

            margin-top: 0;

        }


        #movieModalOverview {

            line-height: 1.6;

            opacity: .8;

        }


        #playMovieBtn {

            padding: 12px 18px;

            border: 0;

            border-radius: 10px;

            cursor: pointer;

        }


        .movie-servers {

            margin-top: 20px;

        }


        .movie-servers-list {

            display: grid;

            gap: 10px;

            margin-top: 10px;

        }


        .movie-server-btn {

            display: flex;

            align-items: center;

            gap: 12px;

            width: 100%;

            padding: 12px;

            border: 1px solid
                rgba(
                    255,
                    255,
                    255,
                    .1
                );

            border-radius: 10px;

            background:
                rgba(
                    255,
                    255,
                    255,
                    .05
                );

            color: inherit;

            text-align: left;

            cursor: pointer;

        }


        .server-info {

            display: flex;

            flex-direction: column;

            gap: 3px;

        }


        .server-info small {

            opacity: .5;

        }


        @media (
            max-width: 700px
        ) {

            .movie-modal-content {

                grid-template-columns: 1fr;

            }


            .movie-modal-content > img {

                max-width: 220px;

                margin: auto;

            }

        }

    `;


    document.head.appendChild(
        style
    );

}


/* =========================================================
   UTILIDADES
========================================================= */

function escapeMovieHTML(
    value
) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


function escapeMovieAttr(
    value
) {

    return escapeMovieHTML(
        value
    );

}


/* =========================================================
   EXPORTAR
========================================================= */

window.loadMovies =
    loadMovies;


window.nextMoviesPage =
    nextMoviesPage;


window.previousMoviesPage =
    previousMoviesPage;


window.openMovieDetails =
    openMovieDetails;


window.closeMovieModal =
    closeMovieModal;


window.closeMoviePlayer =
    closeMoviePlayer;


window.renderMovieServers =
    renderMovieServers;
```
