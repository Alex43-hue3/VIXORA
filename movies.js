/* =========================================================
   NETVISION - MÓDULO DE PELÍCULAS
   Catálogo + servidores de reproducción
========================================================= */

"use strict";


/* =========================================================
   CONFIGURACIÓN
========================================================= */

const MOVIES_API =
    "https://pelisplushd.tvymas.workers.dev/peliculas";

const MOVIE_DETAIL_API =
    "https://pelisplushd.tvymas.workers.dev/pelicula/";


/* =========================================================
   VARIABLES
========================================================= */

let netvisionMovies = [];

let moviesPage = 1;

let moviesTotalPages = 1;

let moviesLoading = false;

let selectedMovie = null;


/* =========================================================
   INICIO
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadMovies(1);

    }
);


/* =========================================================
   CARGAR PELÍCULAS
========================================================= */

async function loadMovies(page = 1) {

    if (moviesLoading) {
        return;
    }


    moviesLoading = true;


    showMoviesLoading();


    try {

        const response =
            await fetch(
                `${MOVIES_API}?page=${page}`,
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
            "NETVISION - PELÍCULAS:",
            data
        );


        netvisionMovies =
            Array.isArray(data.movies)
                ? data.movies
                : [];


        moviesPage =
            Number(data.page) || page;


        moviesTotalPages =
            Number(data.total_pages) || 1;


        renderMovies(
            netvisionMovies
        );


        updateMoviesPagination();


    } catch (error) {

        console.error(
            "NETVISION - ERROR AL CARGAR PELÍCULAS:",
            error
        );


        showMoviesError();

    } finally {

        moviesLoading = false;

    }

}


/* =========================================================
   MOSTRAR PELÍCULAS
========================================================= */

function renderMovies(list) {

    const grid =
        document.getElementById(
            "moviesGrid"
        );


    if (!grid) {

        console.warn(
            "NETVISION: #moviesGrid no existe"
        );

        return;

    }


    grid.innerHTML = "";


    if (!list.length) {

        grid.innerHTML = `

            <div class="movies-message">

                <h3>
                    No hay películas disponibles
                </h3>

            </div>

        `;

        return;

    }


    list.forEach(
        movie => {

            const card =
                createMovieCard(movie);


            grid.appendChild(
                card
            );

        }
    );

}


/* =========================================================
   CREAR TARJETA
========================================================= */

function createMovieCard(movie) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "netvision-movie-card";


    card.tabIndex = 0;


    const poster =
        movie.tmdb_poster ||
        movie.image ||
        "";


    const rating =
        movie.tmdb_rating !== undefined &&
        movie.tmdb_rating !== null
            ? Number(
                movie.tmdb_rating
            ).toFixed(1)
            : "N/A";


    const genres =
        Array.isArray(
            movie.tmdb_genres
        )
            ? movie.tmdb_genres
                .slice(0, 2)
                .join(" · ")
            : "";


    const year =
        movie.tmdb_release_date
            ? movie.tmdb_release_date
                .substring(0, 4)
            : "";


    card.innerHTML = `

        <div class="netvision-movie-poster">

            ${
                poster
                    ? `
                        <img
                            src="${escapeMovieAttr(poster)}"
                            alt="${escapeMovieAttr(movie.title)}"
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

                ★ ${rating}

            </div>


            <div class="netvision-movie-overlay">

                <span>
                    ▶
                </span>

            </div>

        </div>


        <div class="netvision-movie-info">

            <h3>
                ${escapeMovieHTML(movie.title)}
            </h3>


            <div class="netvision-movie-meta">

                ${
                    year
                        ? `
                            <span>
                                ${escapeMovieHTML(year)}
                            </span>
                        `
                        : ""
                }


                ${
                    genres
                        ? `
                            <span>
                                ${escapeMovieHTML(genres)}
                            </span>
                        `
                        : ""
                }

            </div>

        </div>

    `;


    /* =====================================================
       CLICK
    ===================================================== */

    card.addEventListener(
        "click",
        () => {

            openMovieDetails(
                movie
            );

        }
    );


    /* =====================================================
       TECLADO
    ===================================================== */

    card.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter" ||
                event.key === " "
            ) {

                event.preventDefault();


                openMovieDetails(
                    movie
                );

            }

        }
    );


    return card;

}


/* =========================================================
   ABRIR DETALLE
========================================================= */

async function openMovieDetails(movie) {

    selectedMovie =
        movie;


    console.log(
        "NETVISION - PELÍCULA SELECCIONADA:",
        movie
    );


 const modal =
    document.getElementById(
        "contentModal"
    );

    if (!modal) {

      console.warn(
    "No existe #contentModal"
);

        return;

    }


    /* =====================================================
       INFORMACIÓN BÁSICA
    ===================================================== */

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
            movie.image ||
            "";


        poster.alt =
            movie.title;

    }


    if (title) {

        title.textContent =
            movie.title;

    }


    if (overview) {

        overview.textContent =
            movie.tmdb_overview ||
            "Sinopsis no disponible.";

    }


    if (rating) {

        rating.textContent =
            `★ ${
                movie.tmdb_rating ??
                "N/A"
            }`;

    }


    if (genres) {

        genres.textContent =
            Array.isArray(
                movie.tmdb_genres
            )
                ? movie.tmdb_genres.join(
                    " · "
                )
                : "";

    }


    /* =====================================================
       MOSTRAR MODAL
    ===================================================== */

    modal.classList.add(
        "active"
    );


    /* =====================================================
       PREPARAR BOTÓN
    ===================================================== */

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


    /* =====================================================
       OBTENER SERVIDORES
    ===================================================== */

    await loadMovieServers(
        movie
    );

}


/* =========================================================
   OBTENER SERVIDORES DE PELÍCULA
========================================================= */

async function loadMovieServers(movie) {

    const playButton =
        document.getElementById(
            "playMovieBtn"
        );


    try {

        if (!movie.slug) {

            throw new Error(
                "La película no tiene slug."
            );

        }


        console.log(
            "NETVISION - CONSULTANDO DETALLE:",
            movie.slug
        );


        const response =
            await fetch(
                `${MOVIE_DETAIL_API}${encodeURIComponent(movie.slug)}`,
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
            "NETVISION - DETALLE:",
            data
        );


        const servers =
            data?.embeds?.video;


        if (
            !Array.isArray(servers) ||
            servers.length === 0
        ) {

            throw new Error(
                "No se encontraron servidores."
            );

        }


        /* =================================================
           GUARDAR SERVIDORES
        ================================================= */

        selectedMovie =
            {
                ...movie,
                detail: data,
                servers: servers
            };


        /* =================================================
           MOSTRAR SERVIDORES
        ================================================= */

        renderMovieServers(
            servers
        );


        /* =================================================
           ACTIVAR BOTÓN
        ================================================= */

        if (playButton) {

            playButton.disabled =
                false;


            playButton.innerHTML =
                "▶ Ver servidores";


            playButton.onclick =
                () => {

                    showMovieServers(
                        servers
                    );

                };

        }


    } catch (error) {

        console.error(
            "NETVISION - ERROR SERVIDORES:",
            error
        );


        renderMovieServersError(
            error.message
        );


        if (playButton) {

            playButton.disabled =
                true;


            playButton.innerHTML =
                "⚠️ Sin servidores";

        }

    }

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


    /* =====================================================
       CREAR CONTENEDOR SI NO EXISTE
    ===================================================== */

    if (!container) {

        const modalInfo =
            document.querySelector(
                "#movieModal .modal-info"
            );


        if (!modalInfo) {
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

            modalInfo.appendChild(
                container
            );

        }

    }


    container.innerHTML = `

        <div class="movie-servers-title">

            <span>
                SERVIDORES DISPONIBLES
            </span>

        </div>


        <div class="movie-servers-list">

            ${servers.map(
                (server, index) => {

                    const name =
                        server.name ||
                        server.server ||
                        `Servidor ${index + 1}`;


                    const language =
                        server.language ||
                        "Disponible";


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
                                    ${escapeMovieHTML(name)}
                                </strong>

                                <small>
                                    ${escapeMovieHTML(language)}
                                </small>

                            </span>

                        </button>

                    `;

                }
            ).join("")}

        </div>

    `;


    /* =====================================================
       EVENTOS
    ===================================================== */

    const buttons =
        container.querySelectorAll(
            ".movie-server-btn"
        );


    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const index =
                        Number(
                            button.dataset
                                .serverIndex
                        );


                    selectMovieServer(
                        servers[index]
                    );

                }
            );

        }
    );

}


/* =========================================================
   ERROR DE SERVIDORES
========================================================= */

function renderMovieServersError(
    message
) {

    let container =
        document.getElementById(
            "movieServers"
        );


    if (!container) {

        const modalInfo =
            document.querySelector(
                "#movieModal .modal-info"
            );


        if (!modalInfo) {
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


        modalInfo.appendChild(
            container
        );

    }


    container.innerHTML = `

        <div class="movie-servers-error">

            <strong>
                ⚠️ No se encontraron servidores
            </strong>

            <p>
                ${
                    escapeMovieHTML(
                        message ||
                        "No disponible"
                    )
                }
            </p>

        </div>

    `;

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
        "NETVISION - SERVIDOR SELECCIONADO:",
        server
    );


    /* =====================================================
       MOSTRAR ESTADO
    ===================================================== */

    showMovieServerLoading(
        server
    );


    try {

        if (!server.stream_url) {

            throw new Error(
                "Este servidor no tiene stream_url."
            );

        }


        console.log(
            "NETVISION - CONSULTANDO STREAM:",
            server.stream_url
        );


        const response =
            await fetch(
                server.stream_url,
                {
                    cache: "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );

        }


        const contentType =
            response.headers.get(
                "content-type"
            ) || "";


        const text =
            await response.text();


        console.log(
            "NETVISION - STREAM RESPONSE:",
            {
                contentType,
                response: text
            }
        );


        /*
         * ==================================================
         * IMPORTANTE
         *
         * En esta etapa NO intentamos reproducir
         * automáticamente.
         *
         * Primero mostramos qué devuelve el endpoint.
         * ==================================================
         */


        showMovieStreamResult(
            server,
            text,
            contentType
        );


    } catch (error) {

        console.error(
            "NETVISION - ERROR STREAM:",
            error
        );


        showMovieStreamError(
            server,
            error
        );

    }

}


/* =========================================================
   CARGANDO STREAM
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
                        server.name ||
                        "servidor"
                    )}
                </strong>
                ...
            </p>

        </div>

    `;

}


/* =========================================================
   RESULTADO DEL STREAM
========================================================= */

function showMovieStreamResult(
    server,
    response,
    contentType
) {

    const container =
        document.getElementById(
            "movieServers"
        );


    if (!container) {
        return;
    }


    const cleanResponse =
        String(
            response || ""
        ).trim();


    let detectedType =
        "Respuesta desconocida";


    if (
        cleanResponse.includes(
            "#EXTM3U"
        )
    ) {

        detectedType =
            "HLS / M3U8";

    } else if (
        contentType.includes(
            "video/mp4"
        )
    ) {

        detectedType =
            "MP4";

    } else if (
        cleanResponse.startsWith(
            "http://"
        ) ||
        cleanResponse.startsWith(
            "https://"
        )
    ) {

        detectedType =
            "URL de vídeo";

    }


    container.innerHTML = `

        <div class="movie-stream-result">

            <div class="stream-result-icon">
                ✓
            </div>


            <h3>
                Servidor conectado
            </h3>


            <p>
                ${
                    escapeMovieHTML(
                        server.name ||
                        "Servidor"
                    )
                }
            </p>


            <div class="stream-result-type">

                Tipo detectado:

                <strong>
                    ${detectedType}
                </strong>

            </div>


            <details>

                <summary>
                    Ver respuesta técnica
                </summary>


                <pre>${escapeMovieHTML(
                    cleanResponse
                )}</pre>

            </details>


            <button
                type="button"
                class="movie-back-servers"
                id="backMovieServers"
            >
                ← Volver a servidores
            </button>

        </div>

    `;


    const backButton =
        document.getElementById(
            "backMovieServers"
        );


    if (backButton) {

        backButton.addEventListener(
            "click",
            () => {

                if (
                    selectedMovie &&
                    selectedMovie.servers
                ) {

                    renderMovieServers(
                        selectedMovie.servers
                    );

                }

            }
        );

    }

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
                No se pudo consultar
                el servidor
            </h3>


            <p>

                ${
                    escapeMovieHTML(
                        server.name ||
                        "Servidor"
                    )
                }

            </p>


            <small>

                ${
                    escapeMovieHTML(
                        error?.message ||
                        "Error desconocido"
                    )
                }

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


    const backButton =
        document.getElementById(
            "backMovieServersError"
        );


    if (backButton) {

        backButton.addEventListener(
            "click",
            () => {

                if (
                    selectedMovie &&
                    selectedMovie.servers
                ) {

                    renderMovieServers(
                        selectedMovie.servers
                    );

                }

            }
        );

    }

}


/* =========================================================
   MOSTRAR SERVIDORES DESDE BOTÓN
========================================================= */

function showMovieServers(
    servers
) {

    if (
        !Array.isArray(
            servers
        )
    ) {
        return;
    }


    renderMovieServers(
        servers
    );

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
            moviesPage >= moviesTotalPages;

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
        moviesPage >= moviesTotalPages ||
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

function showMoviesError() {

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
                Comprueba tu conexión
                e inténtalo nuevamente.
            </p>


            <button
                type="button"
                onclick="loadMovies(1)"
            >
                Reintentar
            </button>

        </div>

    `;

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


window.showMovieServers =
    showMovieServers;
