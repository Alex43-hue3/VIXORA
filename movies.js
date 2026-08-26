```javascript
/* =========================================================
   NETVISION - MOVIES.JS
   Catálogo de películas
   No modifica TV ni SERIES
========================================================= */

(() => {

    "use strict";

    /* =====================================================
       CONFIGURACIÓN
    ===================================================== */

    const MOVIES_API =
        "https://lamoviebot.tvymas.workers.dev/peliculas?page=";

    const MOVIE_DETAIL_API =
        "https://lamoviebot.tvymas.workers.dev/pelicula/";

    let moviesPage = 1;
    let moviesTotalPages = 1;
    let moviesLoading = false;

    let selectedMovie = null;


    /* =====================================================
       INICIO
    ===================================================== */

    document.addEventListener(
        "DOMContentLoaded",
        () => {

            console.log(
                "NETVISION - movies.js iniciado"
            );

            initializeMovies();

        }
    );


    /* =====================================================
       INICIALIZAR
    ===================================================== */

    function initializeMovies() {

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

        setupMovieNavigation();

        setupMovieModal();

        loadMovies(1);

    }


    /* =====================================================
       CARGAR PELÍCULAS
    ===================================================== */

    async function loadMovies(page = 1) {

        if (moviesLoading) {
            return;
        }

        const grid =
            document.getElementById(
                "moviesGrid"
            );

        if (!grid) {
            return;
        }

        moviesLoading = true;

        showMoviesLoading();

        try {

            console.log(
                "NETVISION - Cargando películas:",
                page
            );

            const response =
                await fetch(
                    MOVIES_API +
                    encodeURIComponent(page),
                    {
                        method: "GET",
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
                "NETVISION - Respuesta películas:",
                data
            );


            /* =================================================
               VALIDAR RESPUESTA
            ================================================= */

            if (!data) {

                throw new Error(
                    "La API no devolvió datos."
                );

            }


            const movies =
                Array.isArray(data.movies)
                    ? data.movies
                    : [];


            if (!movies.length) {

                throw new Error(
                    "La API no devolvió películas."
                );

            }


            moviesPage =
                Number(
                    data.page || page
                );


            moviesTotalPages =
                Number(
                    data.total_pages || 1
                );


            renderMovies(
                movies
            );


            updateMoviesPagination();


            console.log(
                `NETVISION - ${movies.length} películas cargadas`
            );


        } catch (error) {

            console.error(
                "NETVISION - Error cargando películas:",
                error
            );

            showMoviesError(
                error
            );

        } finally {

            moviesLoading = false;

        }

    }


    /* =====================================================
       MOSTRAR PELÍCULAS
    ===================================================== */

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

                const card =
                    createMovieCard(
                        movie
                    );

                grid.appendChild(
                    card
                );

            }
        );

    }


    /* =====================================================
       CREAR TARJETA
    ===================================================== */

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
            movie.image ||
            "";


        const rating =
            movie.tmdb_rating !== undefined &&
            movie.tmdb_rating !== null
                ? Number(
                    movie.tmdb_rating
                ).toFixed(1)
                : "N/A";


        const year =
            movie.tmdb_release_date
                ? String(
                    movie.tmdb_release_date
                ).substring(0, 4)
                : "";


        const genres =
            Array.isArray(
                movie.tmdb_genres
            )
                ? movie.tmdb_genres
                    .slice(0, 2)
                    .join(" · ")
                : "";


        card.innerHTML = `

            <div class="netvision-movie-poster">

                ${
                    poster
                        ? `
                            <img
                                src="${escapeMovieAttr(poster)}"
                                alt="${escapeMovieAttr(movie.title || "Película")}"
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
                    ${escapeMovieHTML(
                        movie.title ||
                        "Sin título"
                    )}
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


        /* =================================================
           CLICK
        ================================================= */

        card.addEventListener(
            "click",
            () => {

                openMovieDetails(
                    movie
                );

            }
        );


        /* =================================================
           TECLADO
        ================================================= */

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


    /* =====================================================
       ABRIR DETALLE
    ===================================================== */

    async function openMovieDetails(
        movie
    ) {

        if (!movie) {
            return;
        }


        selectedMovie =
            movie;


        console.log(
            "NETVISION - Película seleccionada:",
            movie
        );


        const modal =
            document.getElementById(
                "contentModal"
            );


        if (!modal) {

            console.warn(
                "NETVISION - No existe #contentModal"
            );

            return;

        }


        /* =================================================
           BUSCAR ELEMENTOS DEL MODAL
        ================================================= */

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
                movie.title ||
                "Película";

        }


        if (title) {

            title.textContent =
                movie.title ||
                "Sin título";

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


        /* =================================================
           MOSTRAR MODAL
        ================================================= */

        modal.classList.add(
            "active"
        );

        modal.classList.add(
            "show"
        );


        /* =================================================
           BOTÓN REPRODUCIR
        ================================================= */

        const playButton =
            document.getElementById(
                "playMovieBtn"
            );


        if (playButton) {

            playButton.disabled =
                true;

            playButton.textContent =
                "⏳ Buscando servidores...";

            playButton.onclick =
                null;

        }


        /* =================================================
           LIMPIAR SERVIDORES ANTERIORES
        ================================================= */

        const serversContainer =
            document.getElementById(
                "movieServers"
            );


        if (serversContainer) {

            serversContainer.innerHTML =
                "";

        }


        /* =================================================
           CONSULTAR DETALLE
        ================================================= */

        await loadMovieDetails(
            movie
        );

    }


    /* =====================================================
       OBTENER DETALLE
    ===================================================== */

    async function loadMovieDetails(
        movie
    ) {

        try {

            if (!movie.slug) {

                throw new Error(
                    "La película no tiene slug."
                );

            }


            console.log(
                "NETVISION - Consultando detalle:",
                movie.slug
            );


            const response =
                await fetch(
                    MOVIE_DETAIL_API +
                    encodeURIComponent(
                        movie.slug
                    ),
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
                "NETVISION - Detalle recibido:",
                data
            );


            selectedMovie =
                {
                    ...movie,
                    detail: data
                };


            /* =================================================
               BUSCAR SERVIDORES EN DIFERENTES FORMATOS
            ================================================= */

            const servers =
                extractMovieServers(
                    data
                );


            console.log(
                "NETVISION - Servidores encontrados:",
                servers
            );


            if (!servers.length) {

                renderMovieServersError(
                    "La API respondió correctamente, pero no encontramos servidores de vídeo en el detalle."
                );

                return;

            }


            selectedMovie.servers =
                servers;


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

                playButton.textContent =
                    "▶ Ver servidores";

                playButton.onclick =
                    () => {

                        renderMovieServers(
                            servers
                        );

                    };

            }


        } catch (error) {

            console.error(
                "NETVISION - Error detalle:",
                error
            );


            renderMovieServersError(
                error.message
            );

        }

    }


    /* =====================================================
       EXTRAER SERVIDORES
    ===================================================== */

    function extractMovieServers(
        data
    ) {

        const result = [];


        /* =================================================
           FORMATO 1
           embeds.video
        ================================================= */

        if (
            Array.isArray(
                data?.embeds?.video
            )
        ) {

            result.push(
                ...data.embeds.video
            );

        }


        /* =================================================
           FORMATO 2
           video
        ================================================= */

        if (
            Array.isArray(
                data?.video
            )
        ) {

            result.push(
                ...data.video
            );

        }


        /* =================================================
           FORMATO 3
           servers
        ================================================= */

        if (
            Array.isArray(
                data?.servers
            )
        ) {

            result.push(
                ...data.servers
            );

        }


        /* =================================================
           FORMATO 4
           embeds
        ================================================= */

        if (
            Array.isArray(
                data?.embeds
            )
        ) {

            result.push(
                ...data.embeds
            );

        }


        /* =================================================
           NORMALIZAR
        ================================================= */

        return result
            .filter(Boolean)
            .map(
                (server, index) => {

                    if (
                        typeof server ===
                        "string"
                    ) {

                        return {
                            name:
                                `Servidor ${index + 1}`,
                            stream_url:
                                server
                        };

                    }


                    return {
                        ...server,

                        name:
                            server.name ||
                            server.server ||
                            server.title ||
                            `Servidor ${index + 1}`,

                        stream_url:
                            server.stream_url ||
                            server.url ||
                            server.embed_url ||
                            server.src ||
                            server.file ||
                            ""

                    };

                }
            )
            .filter(
                server =>
                    server.stream_url
            );

    }


    /* =====================================================
       MOSTRAR SERVIDORES
    ===================================================== */

    function renderMovieServers(
        servers
    ) {

        let container =
            document.getElementById(
                "movieServers"
            );


        if (!container) {

            const modalInfo =
                document.querySelector(
                    "#contentModal .modal-info"
                );


            if (!modalInfo) {

                console.warn(
                    "NETVISION - No se encontró contenedor del modal."
                );

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
                    (server, index) => `

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
                                        server.name ||
                                        `Servidor ${index + 1}`
                                    )}
                                </strong>

                                <small>
                                    ${
                                        escapeMovieHTML(
                                            server.language ||
                                            "Disponible"
                                        )
                                    }
                                </small>

                            </span>

                        </button>

                    `
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


    /* =====================================================
       SELECCIONAR SERVIDOR
    ===================================================== */

    function selectMovieServer(
        server
    ) {

        if (!server) {
            return;
        }


        console.log(
            "NETVISION - Servidor seleccionado:",
            server
        );


        /*
         * Por ahora mostramos la URL real
         * recibida por la API.
         *
         * No alteramos TV.
         */

        const url =
            server.stream_url;


        if (!url) {

            renderMovieServersError(
                "El servidor no tiene una URL de vídeo."
            );

            return;

        }


        renderMoviePlayer(
            server,
            url
        );

    }


    /* =====================================================
       REPRODUCTOR DE PELÍCULA
    ===================================================== */

    function renderMoviePlayer(
        server,
        url
    ) {

        let container =
            document.getElementById(
                "movieServers"
            );


        if (!container) {
            return;
        }


        const safeURL =
            escapeMovieAttr(
                url
            );


        container.innerHTML = `

            <div class="movie-player-container">

                <div class="movie-player-header">

                    <strong>
                        ${escapeMovieHTML(
                            server.name ||
                            "Servidor"
                        )}
                    </strong>

                </div>


                <video
                    id="netvisionMoviePlayer"
                    class="netvision-movie-player"
                    controls
                    playsinline
                    preload="metadata"
                    style="
                        width:100%;
                        max-width:100%;
                        background:#000;
                        border-radius:12px;
                    "
                >
                    <source
                        src="${safeURL}"
                    >
                </video>


                <div
                    class="movie-player-url"
                    style="
                        margin-top:10px;
                        word-break:break-all;
                    "
                >
                    ${escapeMovieHTML(url)}
                </div>


                <button
                    type="button"
                    class="movie-back-servers"
                    id="backMovieServers"
                >
                    ← Volver a servidores
                </button>

            </div>

        `;


        const player =
            document.getElementById(
                "netvisionMoviePlayer"
            );


        if (player) {

            player.addEventListener(
                "error",
                () => {

                    console.error(
                        "NETVISION - El navegador no pudo reproducir:",
                        url
                    );

                }
            );

        }


        const back =
            document.getElementById(
                "backMovieServers"
            );


        if (back) {

            back.addEventListener(
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


    /* =====================================================
       ERROR SERVIDORES
    ===================================================== */

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
                    "#contentModal .modal-info"
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

                <div>
                    ⚠️
                </div>

                <strong>
                    No se encontraron servidores
                </strong>

                <p>
                    ${escapeMovieHTML(
                        message ||
                        "No disponible"
                    )}
                </p>

            </div>

        `;

    }


    /* =====================================================
       MODAL
    ===================================================== */

    function setupMovieModal() {

        const modal =
            document.getElementById(
                "contentModal"
            );


        if (!modal) {
            return;
        }


        const closeButton =
            document.getElementById(
                "closeContent"
            );


        if (
            closeButton &&
            closeButton.dataset.moviesBound !== "1"
        ) {

            closeButton.dataset.moviesBound =
                "1";


            closeButton.addEventListener(
                "click",
                () => {

                    closeMovieModal();

                }
            );

        }


        if (
            modal.dataset.moviesBound !== "1"
        ) {

            modal.dataset.moviesBound =
                "1";


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


    /* =====================================================
       CERRAR MODAL
    ===================================================== */

    function closeMovieModal() {

        const modal =
            document.getElementById(
                "contentModal"
            );


        if (!modal) {
            return;
        }


        const player =
            document.getElementById(
                "netvisionMoviePlayer"
            );


        if (player) {

            try {
                player.pause();
            } catch (error) {}

            player.removeAttribute(
                "src"
            );

            player.load();

        }


        modal.classList.remove(
            "active"
        );

        modal.classList.remove(
            "show"
        );

    }


    /* =====================================================
       PAGINACIÓN
    ===================================================== */

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
            moviesLoading ||
            moviesPage <= 1
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
            moviesLoading ||
            moviesPage >=
            moviesTotalPages
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


    /* =====================================================
       NAVEGACIÓN
    ===================================================== */

    function setupMovieNavigation() {

        const previous =
            document.getElementById(
                "moviesPrevious"
            );


        const next =
            document.getElementById(
                "moviesNext"
            );


        if (
            previous &&
            previous.dataset.moviesBound !== "1"
        ) {

            previous.dataset.moviesBound =
                "1";


            previous.addEventListener(
                "click",
                previousMoviesPage
            );

        }


        if (
            next &&
            next.dataset.moviesBound !== "1"
        ) {

            next.dataset.moviesBound =
                "1";


            next.addEventListener(
                "click",
                nextMoviesPage
            );

        }

    }


    /* =====================================================
       LOADING
    ===================================================== */

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

                <div class="movies-spinner">
                    ⏳
                </div>

                <p>
                    Cargando películas...
                </p>

            </div>

        `;

    }


    /* =====================================================
       ERROR
    ===================================================== */

    function showMoviesError(
        error
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
                        error?.message ||
                        "Error desconocido"
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
                        moviesPage
                    );

                }
            );

        }

    }


    /* =====================================================
       SEGURIDAD HTML
    ===================================================== */

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


    /* =====================================================
       EXPORTAR
    ===================================================== */

    window.loadMovies =
        loadMovies;


    window.nextMoviesPage =
        nextMoviesPage;


    window.previousMoviesPage =
        previousMoviesPage;


    window.openMovieDetails =
        openMovieDetails;


})();
```
