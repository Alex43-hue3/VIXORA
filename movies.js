/* =========================================================
   NETVISION - PELÍCULAS
   Catálogo conectado a la API
========================================================= */

"use strict";

const MOVIES_API =
    "https://pelisplushd.tvymas.workers.dev/peliculas";

let movies = [];
let moviesPage = 1;
let moviesTotalPages = 1;
let moviesLoading = false;


/* =========================================================
   INICIAR
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    loadMovies(1);

});


/* =========================================================
   CARGAR PELÍCULAS
========================================================= */

async function loadMovies(page = 1) {

    if (moviesLoading) return;

    moviesLoading = true;

    showMoviesLoading();

    try {

        const response = await fetch(
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

        const data = await response.json();

        console.log(
            "NETVISION películas:",
            data
        );

        movies = data.movies || [];

        moviesPage =
            data.page || page;

        moviesTotalPages =
            data.total_pages || 1;

        renderMovies(movies);

    } catch (error) {

        console.error(
            "Error cargando películas:",
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

    const container =
        document.getElementById(
            "moviesGrid"
        );

    if (!container) {

        console.warn(
            "No existe #moviesGrid"
        );

        return;
    }

    container.innerHTML = "";

    if (!list.length) {

        container.innerHTML = `
            <div class="movies-empty">
                No hay películas disponibles.
            </div>
        `;

        return;
    }

    list.forEach(movie => {

        const card =
            createMovieCard(movie);

        container.appendChild(card);

    });

}


/* =========================================================
   TARJETA
========================================================= */

function createMovieCard(movie) {

    const card =
        document.createElement("article");

    card.className =
        "movie-card";

    const poster =
        movie.tmdb_poster ||
        movie.image ||
        "";

    const rating =
        movie.tmdb_rating ??
        "N/A";

    const genres =
        Array.isArray(movie.tmdb_genres)
            ? movie.tmdb_genres
                .slice(0, 2)
                .join(" · ")
            : "";

    card.innerHTML = `

        <div class="movie-poster">

            ${
                poster
                ?
                `<img
                    src="${escapeMovieAttr(poster)}"
                    alt="${escapeMovieAttr(movie.title)}"
                    loading="lazy"
                >`
                :
                `<div class="movie-no-poster">
                    🎬
                </div>`
            }

            <div class="movie-rating">
                ★ ${escapeMovieHTML(rating)}
            </div>

        </div>

        <div class="movie-info">

            <h3>
                ${escapeMovieHTML(movie.title)}
            </h3>

            <p>
                ${escapeMovieHTML(genres)}
            </p>

        </div>

    `;

    card.addEventListener(
        "click",
        () => openMovie(movie)
    );

    return card;

}


/* =========================================================
   DETALLE DE PELÍCULA
========================================================= */

function openMovie(movie) {

    console.log(
        "Película seleccionada:",
        movie
    );

    const modal =
        document.getElementById(
            "movieModal"
        );

    if (!modal) {

        /*
         * Por ahora mostramos la información
         * en consola.
         *
         * En el siguiente paso crearemos
         * el reproductor y la ficha completa.
         */

        alert(
            movie.title
        );

        return;
    }

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
            `★ ${movie.tmdb_rating ?? "N/A"}`;

    }

    if (genres) {

        genres.textContent =
            Array.isArray(
                movie.tmdb_genres
            )
            ?
            movie.tmdb_genres.join(" · ")
            :
            "";

    }

    modal.classList.add("show");

}


/* =========================================================
   CARGANDO
========================================================= */

function showMoviesLoading() {

    const container =
        document.getElementById(
            "moviesGrid"
        );

    if (!container) return;

    container.innerHTML = `

        <div class="movies-loading">

            <div class="loading-spinner"></div>

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

    const container =
        document.getElementById(
            "moviesGrid"
        );

    if (!container) return;

    container.innerHTML = `

        <div class="movies-error">

            <div>
                ⚠️
            </div>

            <h3>
                No se pudieron cargar
                las películas
            </h3>

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
   ESCAPAR HTML
========================================================= */

function escapeMovieHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


function escapeMovieAttr(value) {

    return escapeMovieHTML(value);

}


/* =========================================================
   PAGINACIÓN
========================================================= */

function nextMoviesPage() {

    if (
        moviesPage <
        moviesTotalPages
    ) {

        loadMovies(
            moviesPage + 1
        );

    }

}


function previousMoviesPage() {

    if (moviesPage > 1) {

        loadMovies(
            moviesPage - 1
        );

    }

}
