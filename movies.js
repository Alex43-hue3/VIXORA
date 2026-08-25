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

let moviePlayer = null;
let movieHls = null;
let currentMovieServer = null;

async function openMovieDetails(movie) {

    selectedMovie = movie;

    console.log(
        "NETVISION - PELÍCULA SELECCIONADA:",
        movie
    );

    const modal =
        document.getElementById(
            "contentModal"
        );

    if (!modal) {

        console.error(
            "NETVISION: No existe #contentModal"
        );

        return;
    }

    /* =====================================================
       PORTADA
    ===================================================== */

    const poster =
        document.getElementById(
            "modalPoster"
        );

    if (poster) {

        const posterURL =
            movie.tmdb_poster ||
            movie.image ||
            "";

        poster.innerHTML = posterURL
            ? `
                <img
                    src="${escapeMovieAttr(posterURL)}"
                    alt="${escapeMovieAttr(
                        movie.title || "Película"
                    )}"
                    class="netvision-modal-poster-img"
                >
            `
            : `
                <div class="movie-poster-empty">
                    🎬
                </div>
            `;
    }

    /* =====================================================
       TÍTULO
    ===================================================== */

    const title =
        document.getElementById(
            "modalTitle"
        );

    if (title) {

        title.textContent =
            movie.title ||
            "Película";
    }

    /* =====================================================
       DESCRIPCIÓN
    ===================================================== */

    const description =
        document.getElementById(
            "modalDescription"
        );

    if (description) {

        description.textContent =
            movie.tmdb_overview ||
            "Sinopsis no disponible.";
    }

    /* =====================================================
       ABRIR MODAL
    ===================================================== */

    modal.classList.add(
        "active"
    );

    document.body.classList.add(
        "modal-open"
    );

    setupMovieModalClose();

    /* =====================================================
       SERVIDORES
    ===================================================== */

    renderMovieServers(
        Array.isArray(movie.servers)
            ? movie.servers
            : []
    );
}


/* =========================================================
   CERRAR MODAL
========================================================= */

function setupMovieModalClose() {

    const closeButton =
        document.getElementById(
            "closeContent"
        );

    if (
        closeButton &&
        !closeButton.dataset.netvisionBound
    ) {

        closeButton.dataset.netvisionBound =
            "1";

        closeButton.addEventListener(
            "click",
            closeMovieModal
        );
    }
}


function closeMovieModal() {

    stopMoviePlayer();

    const modal =
        document.getElementById(
            "contentModal"
        );

    if (modal) {

        modal.classList.remove(
            "active"
        );
    }

    document.body.classList.remove(
        "modal-open"
    );
}


/* =========================================================
   SERVIDORES
========================================================= */

function renderMovieServers(
    servers
) {

    const modalInfo =
        document.querySelector(
            "#contentModal .modal-info"
        );

    if (!modalInfo) {

        console.warn(
            "NETVISION: No existe .modal-info"
        );

        return;
    }

    let container =
        document.getElementById(
            "movieServers"
        );

    if (!container) {

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

    /* =====================================================
       SIN SERVIDORES
    ===================================================== */

    if (
        !Array.isArray(servers) ||
        servers.length === 0
    ) {

        container.innerHTML = `

            <div class="movie-servers-empty">

                <strong>
                    🎬 Lista para reproducir
                </strong>

                <p>
                    No hay una fuente de vídeo
                    autorizada asociada a esta película.
                </p>

            </div>

        `;

        return;
    }

    /* =====================================================
       LISTA
    ===================================================== */

    container.innerHTML = `

        <div class="movie-servers-title">

            SERVIDORES DISPONIBLES

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

                            <span
                                class="server-play"
                            >
                                ▶
                            </span>


                            <span
                                class="server-info"
                            >

                                <strong>
                                    ${escapeMovieHTML(
                                        name
                                    )}
                                </strong>

                                <small>
                                    ${escapeMovieHTML(
                                        language
                                    )}
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


/* =========================================================
   SELECCIONAR SERVIDOR
========================================================= */

function selectMovieServer(
    server
) {

    if (!server) {

        return;
    }

    const streamURL =
        server.stream_url ||
        server.url ||
        server.src ||
        "";

    if (!streamURL) {

        showMovieStreamError(
            server,
            new Error(
                "El servidor no contiene una URL de vídeo."
            )
        );

        return;
    }

    currentMovieServer =
        server;

    openMoviePlayer(
        streamURL,
        server.name ||
        "NETVISION"
    );
}


/* =========================================================
   CREAR REPRODUCTOR
========================================================= */

function ensureMoviePlayer() {

    let player =
        document.getElementById(
            "netvisionMoviePlayer"
        );

    if (player) {

        return player;
    }

    player =
        document.createElement(
            "div"
        );

    player.id =
        "netvisionMoviePlayer";

    player.className =
        "netvision-movie-player";

    player.innerHTML = `

        <div
            class="netvision-player-header"
        >

            <strong
                id="netvisionPlayerTitle"
            >
                NETVISION
            </strong>


            <button
                type="button"
                id="netvisionPlayerClose"
                aria-label="Cerrar reproductor"
            >
                ×
            </button>

        </div>


        <div
            class="netvision-player-video-wrap"
        >

            <video
                id="netvisionMovieVideo"
                controls
                playsinline
                preload="metadata"
            ></video>

        </div>


        <div
            id="netvisionPlayerStatus"
            class="netvision-player-status"
        >
        </div>

    `;

    document.body.appendChild(
        player
    );

    injectMoviePlayerStyles();

    const closeButton =
        document.getElementById(
            "netvisionPlayerClose"
        );

    if (closeButton) {

        closeButton.addEventListener(
            "click",
            stopMoviePlayer
        );
    }

    return player;
}


/* =========================================================
   REPRODUCTOR MP4 / HLS
========================================================= */

async function openMoviePlayer(
    streamURL,
    title
) {

    const player =
        ensureMoviePlayer();

    const video =
        document.getElementById(
            "netvisionMovieVideo"
        );

    const playerTitle =
        document.getElementById(
            "netvisionPlayerTitle"
        );

    const status =
        document.getElementById(
            "netvisionPlayerStatus"
        );

    if (!video) {

        return;
    }

    stopMoviePlaybackOnly();

    player.classList.add(
        "active"
    );

    if (playerTitle) {

        playerTitle.textContent =
            title ||
            "NETVISION";
    }

    if (status) {

        status.textContent =
            "Conectando...";
    }

    const isHLS =
        /\.m3u8(?:$|[?#])/i.test(
            streamURL
        );


    /* =====================================================
       HLS.JS
    ===================================================== */

    if (
        isHLS &&
        window.Hls &&
        Hls.isSupported()
    ) {

        movieHls =
            new Hls();

        movieHls.loadSource(
            streamURL
        );

        movieHls.attachMedia(
            video
        );

        movieHls.on(
            Hls.Events.MANIFEST_PARSED,
            () => {

                if (status) {

                    status.textContent =
                        "Reproduciendo";
                }

                video
                    .play()
                    .catch(
                        () => {}
                    );
            }
        );

        movieHls.on(
            Hls.Events.ERROR,
            (
                event,
                data
            ) => {

                if (
                    data &&
                    data.fatal
                ) {

                    console.error(
                        "NETVISION HLS:",
                        data
                    );

                    if (status) {

                        status.textContent =
                            "No se pudo reproducir la fuente.";
                    }
                }
            }
        );

        return;
    }


    /* =====================================================
       HLS NATIVO
    ===================================================== */

    if (
        isHLS &&
        video.canPlayType(
            "application/vnd.apple.mpegurl"
        )
    ) {

        video.src =
            streamURL;

        video.addEventListener(
            "loadedmetadata",
            () => {

                if (status) {

                    status.textContent =
                        "Reproduciendo";
                }

                video
                    .play()
                    .catch(
                        () => {}
                    );
            },
            {
                once: true
            }
        );

        return;
    }


    /* =====================================================
       MP4 / VIDEO DIRECTO
    ===================================================== */

    video.src =
        streamURL;

    video.addEventListener(
        "loadedmetadata",
        () => {

            if (status) {

                status.textContent =
                    "Reproduciendo";
            }

            video
                .play()
                .catch(
                    () => {}
                );

        },
        {
            once: true
        }
    );

    video.addEventListener(
        "error",
        () => {

            if (status) {

                status.textContent =
                    "El navegador no puede reproducir esta fuente.";
            }

        },
        {
            once: true
        }
    );
}


/* =========================================================
   DETENER REPRODUCCIÓN
========================================================= */

function stopMoviePlaybackOnly() {

    const video =
        document.getElementById(
            "netvisionMovieVideo"
        );

    if (movieHls) {

        try {

            movieHls.destroy();

        } catch (error) {

            console.warn(
                error
            );
        }

        movieHls =
            null;
    }

    if (video) {

        video.pause();

        video.removeAttribute(
            "src"
        );

        video.load();
    }
}


function stopMoviePlayer() {

    stopMoviePlaybackOnly();

    const player =
        document.getElementById(
            "netvisionMoviePlayer"
        );

    if (player) {

        player.classList.remove(
            "active"
        );
    }

    currentMovieServer =
        null;
}


/* =========================================================
   ERROR
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

        <div
            class="movie-stream-error"
        >

            <div>
                ⚠️
            </div>

            <h3>
                No se pudo iniciar
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
                    "Fuente no disponible."
                )}
            </small>

        </div>

    `;
}


/* =========================================================
   ESTILOS DEL REPRODUCTOR
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

        body.modal-open {
            overflow: hidden;
        }


        .netvision-movie-player {

            position: fixed;

            inset: 0;

            z-index: 99999;

            display: none;

            align-items: center;

            justify-content: center;

            padding: 20px;

            background:
                rgba(
                    0,
                    0,
                    0,
                    .96
                );

        }


        .netvision-movie-player.active {

            display: flex;

        }


        .netvision-player-video-wrap {

            width:
                min(
                    1100px,
                    100%
                );

            aspect-ratio:
                16 / 9;

            background:
                #000;

            border-radius:
                14px;

            overflow:
                hidden;

            box-shadow:
                0 20px 70px
                rgba(
                    0,
                    0,
                    0,
                    .55
                );

        }


        .netvision-player-video-wrap video {

            width:
                100%;

            height:
                100%;

            display:
                block;

            background:
                #000;

            object-fit:
                contain;

        }


        .netvision-player-header {

            position:
                absolute;

            top:
                0;

            left:
                0;

            right:
                0;

            min-height:
                64px;

            padding:
                12px 20px;

            display:
                flex;

            align-items:
                center;

            justify-content:
                space-between;

            background:
                linear-gradient(
                    to bottom,
                    rgba(
                        0,
                        0,
                        0,
                        .9
                    ),
                    transparent
                );

            color:
                #fff;

            pointer-events:
                none;

        }


        .netvision-player-header
        strong,

        .netvision-player-header
        button {

            pointer-events:
                auto;

        }


        .netvision-player-header
        button {

            width:
                42px;

            height:
                42px;

            border:
                0;

            border-radius:
                50%;

            background:
                rgba(
                    255,
                    255,
                    255,
                    .12
                );

            color:
                #fff;

            font-size:
                28px;

            cursor:
                pointer;

        }


        .netvision-player-status {

            position:
                absolute;

            bottom:
                18px;

            left:
                50%;

            transform:
                translateX(-50%);

            color:
                #fff;

            font-size:
                13px;

            text-align:
                center;

            pointer-events:
                none;

        }


        .movie-servers {

            margin-top:
                18px;

        }


        .movie-servers-title {

            margin-bottom:
                10px;

            font-weight:
                700;

        }


        .movie-servers-list {

            display:
                flex;

            flex-wrap:
                wrap;

            gap:
                10px;

        }


        .movie-server-btn {

            display:
                flex;

            align-items:
                center;

            gap:
                10px;

            padding:
                10px 14px;

            border:
                1px solid
                rgba(
                    255,
                    255,
                    255,
                    .14
                );

            border-radius:
                10px;

            background:
                rgba(
                    255,
                    255,
                    255,
                    .06
                );

            color:
                inherit;

            cursor:
                pointer;

        }


        .movie-server-btn:hover {

            background:
                rgba(
                    255,
                    255,
                    255,
                    .12
                );

        }


        .server-info {

            display:
                flex;

            flex-direction:
                column;

            align-items:
                flex-start;

        }


        .server-info small {

            opacity:
                .7;

        }


        @media (
            max-width: 700px
        ) {

            .netvision-movie-player {

                padding:
                    0;

            }


            .netvision-player-video-wrap {

                width:
                    100%;

                border-radius:
                    0;

                aspect-ratio:
                    16 / 9;

            }


            .netvision-player-header {

                min-height:
                    54px;

                padding:
                    8px 12px;

            }


            .movie-servers-list {

                flex-direction:
                    column;

            }


            .movie-server-btn {

                width:
                    100%;

            }

        }

    `;

    document.head.appendChild(
        style
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
   LOADING
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

        <div
            class="movies-message"
        >

            <div
                class="movies-spinner"
            ></div>

            <p>
                Cargando películas...
            </p>

        </div>

    `;
}


/* =========================================================
   ERROR
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

        <div
            class="
                movies-message
                movies-error
            "
        >

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


window.closeMovieModal =
    closeMovieModal;


window.stopMoviePlayer =
    stopMoviePlayer;

