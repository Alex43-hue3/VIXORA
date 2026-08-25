/* =========================================================
   NETVISION - PELÍCULAS
   Compatible con el index.html actual
========================================================= */

"use strict";


/* =========================================================
   API
========================================================= */

const MOVIES_API =
    "https://pelisplushd.tvymas.workers.dev/peliculas";

const MOVIE_DETAIL_API =
    "https://pelisplushd.tvymas.workers.dev/pelicula/";


/* =========================================================
   VARIABLES
========================================================= */

let moviesData = [];

let currentMoviePage = 1;

let totalMoviePages = 1;

let selectedMovie = null;

let movieServers = [];


/* =========================================================
   INICIO
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        console.log(
            "NETVISION - movies.js iniciado"
        );

        loadMovies(
            1
        );

        setupMovieModal();

    }
);


/* =========================================================
   CARGAR PELÍCULAS
========================================================= */

async function loadMovies(
    page = 1
) {

    const container =
        document.getElementById(
            "movieCategories"
        );


    if (!container) {

        console.error(
            "NETVISION: No existe #movieCategories"
        );

        return;

    }


    container.innerHTML = `

        <div class="movies-loading">

            <div class="movie-spinner"></div>

            <p>
                Cargando películas...
            </p>

        </div>

    `;


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
                `Error HTTP ${response.status}`
            );

        }


        const data =
            await response.json();


        console.log(
            "NETVISION - API PELÍCULAS:",
            data
        );


        moviesData =
            Array.isArray(
                data.movies
            )
                ? data.movies
                : [];


        currentMoviePage =
            Number(
                data.page
            ) || page;


        totalMoviePages =
            Number(
                data.total_pages
            ) || 1;


        renderMovies();


    } catch (error) {

        console.error(
            "NETVISION - Error cargando películas:",
            error
        );


        container.innerHTML = `

            <div class="movies-error">

                <div>
                    ⚠️
                </div>

                <h3>
                    No se pudieron cargar
                    las películas
                </h3>

                <p>
                    ${escapeHTML(
                        error.message
                    )}
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

}


/* =========================================================
   RENDERIZAR PELÍCULAS
========================================================= */

function renderMovies() {

    const container =
        document.getElementById(
            "movieCategories"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (
        !moviesData.length
    ) {

        container.innerHTML = `

            <div class="movies-error">

                <h3>
                    No hay películas disponibles
                </h3>

            </div>

        `;

        return;

    }


    /* =====================================================
       TÍTULO
    ===================================================== */

    const heading =
        document.createElement(
            "div"
        );


    heading.className =
        "movie-api-heading";


    heading.innerHTML = `

        <div>

            <span class="section-kicker">
                NETVISION
            </span>

            <h2>
                🎬 Películas
            </h2>

            <p>
                Descubre nuestro catálogo.
            </p>

        </div>

    `;


    container.appendChild(
        heading
    );


    /* =====================================================
       GRID
    ===================================================== */

    const grid =
        document.createElement(
            "div"
        );


    grid.className =
        "movies-grid";


    moviesData.forEach(
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


    container.appendChild(
        grid
    );


    /* =====================================================
       PAGINACIÓN
    ===================================================== */

    const pagination =
        document.createElement(
            "div"
        );


    pagination.className =
        "movies-pagination";


    pagination.innerHTML = `

        <button
            type="button"
            id="moviesPrevButton"
            ${currentMoviePage <= 1 ? "disabled" : ""}
        >
            ← Anteriores
        </button>


        <span>
            Página
            ${currentMoviePage}
            de
            ${totalMoviePages}
        </span>


        <button
            type="button"
            id="moviesNextButton"
            ${
                currentMoviePage >= totalMoviePages
                    ? "disabled"
                    : ""
            }
        >
            Siguientes →
        </button>

    `;


    container.appendChild(
        pagination
    );


    /* =====================================================
       PAGINACIÓN EVENTOS
    ===================================================== */

    const previous =
        document.getElementById(
            "moviesPrevButton"
        );


    const next =
        document.getElementById(
            "moviesNextButton"
        );


    if (previous) {

        previous.addEventListener(
            "click",
            () => {

                if (
                    currentMoviePage > 1
                ) {

                    loadMovies(
                        currentMoviePage - 1
                    );

                    scrollMoviesTop();

                }

            }
        );

    }


    if (next) {

        next.addEventListener(
            "click",
            () => {

                if (
                    currentMoviePage <
                    totalMoviePages
                ) {

                    loadMovies(
                        currentMoviePage + 1
                    );

                    scrollMoviesTop();

                }

            }
        );

    }

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
        "movie-card";


    card.setAttribute(
        "role",
        "button"
    );


    card.setAttribute(
        "tabindex",
        "0"
    );


    const poster =
        movie.tmdb_poster ||
        movie.image ||
        "";


    const rating =
        movie.tmdb_rating !== undefined
            ? Number(
                movie.tmdb_rating
            ).toFixed(1)
            : "N/A";


    const year =
        movie.tmdb_release_date
            ? movie.tmdb_release_date
                .substring(0, 4)
            : "";


    const genres =
        Array.isArray(
            movie.tmdb_genres
        )
            ? movie.tmdb_genres
                .slice(0, 2)
                .join(
                    " · "
                )
            : "";


    card.innerHTML = `

        <div class="movie-poster">

            ${
                poster
                    ? `
                        <img
                            src="${escapeHTML(
                                poster
                            )}"
                            alt="${escapeHTML(
                                movie.title
                            )}"
                            loading="lazy"
                        >
                    `
                    : `
                        <div class="movie-no-poster">
                            🎬
                        </div>
                    `
            }


            <div class="movie-rating">

                ★ ${rating}

            </div>


            <div class="movie-play-overlay">

                <span>
                    ▶
                </span>

            </div>

        </div>


        <div class="movie-card-info">

            <h3>
                ${escapeHTML(
                    movie.title
                )}
            </h3>


            <div class="movie-card-meta">

                ${
                    year
                        ? `
                            <span>
                                ${year}
                            </span>
                        `
                        : ""
                }


                ${
                    genres
                        ? `
                            <span>
                                ${escapeHTML(
                                    genres
                                )}
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

            openMovie(
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

                openMovie(
                    movie
                );

            }

        }
    );


    return card;

}


/* =========================================================
   ABRIR PELÍCULA
========================================================= */

function openMovie(
    movie
) {

    console.log(
        "NETVISION - Película seleccionada:",
        movie
    );


    selectedMovie =
        movie;


    movieServers =
        [];


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
       POSTER
    ===================================================== */

    const poster =
        document.getElementById(
            "modalPoster"
        );


    if (poster) {

        poster.innerHTML = `

            <img
                src="${escapeHTML(
                    movie.tmdb_poster ||
                    movie.image ||
                    ""
                )}"
                alt="${escapeHTML(
                    movie.title
                )}"
            >

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
            movie.title;

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
            "Sin descripción disponible.";

    }


    /* =====================================================
       MOSTRAR MODAL
    ===================================================== */

    modal.classList.add(
        "active"
    );


    /* =====================================================
       BUSCAR SERVIDORES
    ===================================================== */

    loadMovieServers(
        movie
    );

}


/* =========================================================
   BUSCAR SERVIDORES
========================================================= */

async function loadMovieServers(
    movie
) {

    const modalInfo =
        document.querySelector(
            "#contentModal .modal-info"
        );


    if (!modalInfo) {

        console.error(
            "NETVISION: No existe .modal-info"
        );

        return;

    }


    /* =====================================================
       CONTENEDOR SERVIDORES
    ===================================================== */

    let serverContainer =
        document.getElementById(
            "movieServers"
        );


    if (!serverContainer) {

        serverContainer =
            document.createElement(
                "div"
            );


        serverContainer.id =
            "movieServers";


        serverContainer.className =
            "movie-servers";


        modalInfo.appendChild(
            serverContainer
        );

    }


    serverContainer.innerHTML = `

        <div class="movie-server-loading">

            <span>
                ⏳
            </span>

            <p>
                Buscando servidores...
            </p>

        </div>

    `;


    try {

        if (
            !movie.slug
        ) {

            throw new Error(
                "La película no tiene slug."
            );

        }


        const response =
            await fetch(
                `${MOVIE_DETAIL_API}${encodeURIComponent(
                    movie.slug
                )}`,
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
            data &&
            data.embeds &&
            Array.isArray(
                data.embeds.video
            )
                ? data.embeds.video
                : [];


        movieServers =
            servers;


        if (
            !servers.length
        ) {

            serverContainer.innerHTML = `

                <div class="movie-server-error">

                    ⚠️

                    <p>
                        No se encontraron
                        servidores para esta película.
                    </p>

                </div>

            `;

            return;

        }


        renderMovieServers(
            servers
        );


    } catch (error) {

        console.error(
            "NETVISION - Error obteniendo servidores:",
            error
        );


        serverContainer.innerHTML = `

            <div class="movie-server-error">

                <strong>
                    ⚠️ No se pudieron cargar
                    los servidores
                </strong>

                <p>
                    ${escapeHTML(
                        error.message
                    )}
                </p>

                <button
                    type="button"
                    id="retryMovieServers"
                >
                    Reintentar
                </button>

            </div>

        `;


        const retry =
            document.getElementById(
                "retryMovieServers"
            );


        if (retry) {

            retry.addEventListener(
                "click",
                () => {

                    loadMovieServers(
                        movie
                    );

                }
            );

        }

    }

}


/* =========================================================
   MOSTRAR SERVIDORES
========================================================= */

function renderMovieServers(
    servers
) {

    const container =
        document.getElementById(
            "movieServers"
        );


    if (!container) {
        return;
    }


    container.innerHTML = `

        <div class="movie-servers-title">

            <span>
                SERVIDORES DISPONIBLES
            </span>

        </div>


        <div class="movie-servers-list">

            ${servers
                .map(
                    (
                        server,
                        index
                    ) => {

                        const name =
                            server.name ||
                            `Servidor ${index + 1}`;


                        const language =
                            server.language ||
                            "Disponible";


                        return `

                            <button
                                type="button"
                                class="movie-server-button"
                                data-server="${index}"
                            >

                                <span class="server-icon">
                                    ▶
                                </span>


                                <span>

                                    <strong>
                                        ${escapeHTML(
                                            name
                                        )}
                                    </strong>


                                    <small>
                                        ${escapeHTML(
                                            language
                                        )}
                                    </small>

                                </span>

                            </button>

                        `;

                    }
                )
                .join("")}

        </div>

    `;


    /* =====================================================
       EVENTOS
    ===================================================== */

    const buttons =
        container.querySelectorAll(
            ".movie-server-button"
        );


    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const index =
                        Number(
                            button.dataset
                                .server
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

async function selectMovieServer(
    server
) {

    console.log(
        "NETVISION - Servidor seleccionado:",
        server
    );


    const container =
        document.getElementById(
            "movieServers"
        );


    if (!container) {
        return;
    }


    if (
        !server ||
        !server.stream_url
    ) {

        container.innerHTML = `

            <div class="movie-server-error">

                ⚠️

                <p>
                    Este servidor no proporciona
                    una fuente de reproducción.
                </p>


                <button
                    type="button"
                    id="backMovieServers"
                >
                    ← Volver
                </button>

            </div>

        `;


        setupBackServers();

        return;

    }


    container.innerHTML = `

        <div class="movie-stream-loading">

            <div class="movie-spinner"></div>

            <p>
                Conectando con
                <strong>
                    ${escapeHTML(
                        server.name ||
                        "servidor"
                    )}
                </strong>
                ...
            </p>

        </div>

    `;


    try {

        console.log(
            "NETVISION - Stream URL:",
            server.stream_url
        );


        const response =
            await fetch(
                server.stream_url,
                {
                    cache: "no-store"
                }
            );


        const contentType =
            response.headers.get(
                "content-type"
            ) || "";


        const text =
            await response.text();


        console.log(
            "NETVISION - RESPUESTA STREAM:",
            {
                status:
                    response.status,

                contentType,

                text
            }
        );


        showStreamResponse(
            server,
            text,
            contentType
        );


    } catch (error) {

        console.error(
            "NETVISION - Error stream:",
            error
        );


        container.innerHTML = `

            <div class="movie-server-error">

                ⚠️

                <h3>
                    No se pudo conectar
                </h3>

                <p>
                    ${escapeHTML(
                        error.message
                    )}
                </p>


                <button
                    type="button"
                    id="backMovieServers"
                >
                    ← Volver a servidores
                </button>

            </div>

        `;


        setupBackServers();

    }

}


/* =========================================================
   MOSTRAR RESPUESTA DEL STREAM
========================================================= */

function showStreamResponse(
    server,
    text,
    contentType
) {

    const container =
        document.getElementById(
            "movieServers"
        );


    if (!container) {
        return;
    }


    const responseText =
        String(
            text || ""
        ).trim();


    let detected =
        "Respuesta desconocida";


    if (
        responseText.includes(
            "#EXTM3U"
        )
    ) {

        detected =
            "HLS / M3U8";

    } else if (
        contentType.includes(
            "video/mp4"
        )
    ) {

        detected =
            "MP4";

    } else if (
        /^https?:\/\//i.test(
            responseText
        )
    ) {

        detected =
            "URL de vídeo";

    }


    container.innerHTML = `

        <div class="movie-stream-result">

            <div class="stream-success">
                ✓
            </div>


            <h3>
                Servidor conectado
            </h3>


            <p>
                ${escapeHTML(
                    server.name ||
                    "Servidor"
                )}
            </p>


            <div class="stream-type">

                Tipo detectado:

                <strong>
                    ${detected}
                </strong>

            </div>


            <details>

                <summary>
                    Ver respuesta técnica
                </summary>


                <pre>${escapeHTML(
                    responseText
                )}</pre>

            </details>


            <button
                type="button"
                id="backMovieServers"
            >
                ← Volver a servidores
            </button>

        </div>

    `;


    setupBackServers();

}


/* =========================================================
   VOLVER A SERVIDORES
========================================================= */

function setupBackServers() {

    const button =
        document.getElementById(
            "backMovieServers"
        );


    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        () => {

            renderMovieServers(
                movieServers
            );

        }
    );

}


/* =========================================================
   CONFIGURAR MODAL
========================================================= */

function setupMovieModal() {

    const modal =
        document.getElementById(
            "contentModal"
        );


    if (!modal) {

        console.warn(
            "NETVISION: contentModal no encontrado"
        );

        return;

    }


    /* =====================================================
       BOTÓN CERRAR
    ===================================================== */

    const close =
        document.getElementById(
            "closeContent"
        );


    if (close) {

        close.addEventListener(
            "click",
            () => {

                closeMovieModal();

            }
        );

    }


    /* =====================================================
       CLICK FUERA
    ===================================================== */

    modal.addEventListener(
        "click",
        event => {

            if (
                event.target === modal
            ) {

                closeMovieModal();

            }

        }
    );


    /* =====================================================
       ESC
    ===================================================== */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape" &&
                modal.classList.contains(
                    "active"
                )
            ) {

                closeMovieModal();

            }

        }
    );

}


/* =========================================================
   CERRAR MODAL
========================================================= */

function closeMovieModal() {

    const modal =
        document.getElementById(
            "contentModal"
        );


    if (modal) {

        modal.classList.remove(
            "active"
        );

    }

}


/* =========================================================
   UTILIDADES
========================================================= */

function scrollMoviesTop() {

    const section =
        document.getElementById(
            "page-movies"
        );


    if (section) {

        section.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }

}


function escapeHTML(
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


/* =========================================================
   EXPORTAR
========================================================= */

window.loadMovies =
    loadMovies;


window.openMovie =
    openMovie;


window.nextMoviesPage =
    () => {

        if (
            currentMoviePage <
            totalMoviePages
        ) {

            loadMovies(
                currentMoviePage + 1
            );

        }

    };


window.previousMoviesPage =
    () => {

        if (
            currentMoviePage > 1
        ) {

            loadMovies(
                currentMoviePage - 1
            );

        }

    };
