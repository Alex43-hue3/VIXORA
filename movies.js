/* =========================================================
   NETVISION - MÓDULO DE PELÍCULAS
   API DE CATÁLOGO
========================================================= */

"use strict";

const MOVIES_API =
    "https://pelisplushd.tvymas.workers.dev/peliculas";

let netvisionMovies = [];
let moviesPage = 1;
let moviesTotalPages = 1;
let moviesLoading = false;


/* =========================================================
   INICIO
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    loadMovies(1);

});


/* =========================================================
   CARGAR CATÁLOGO
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

        const data =
            await response.json();

        console.log(
            "NETVISION - API PELÍCULAS:",
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
            "NETVISION - ERROR PELÍCULAS:",
            error
        );

        showMoviesError();

    } finally {

        moviesLoading = false;

    }

}


/* =========================================================
   RENDER PELÍCULAS
========================================================= */

function renderMovies(list) {

    const grid =
        document.getElementById(
            "moviesGrid"
        );

    if (!grid) {

        console.warn(
            "NETVISION: no existe #moviesGrid"
        );

        return;

    }

    grid.innerHTML = "";

    if (!list.length) {

        grid.innerHTML = `
            <div class="movies-message">
                No hay películas disponibles.
            </div>
        `;

        return;

    }

    list.forEach(movie => {

        const card =
            createMovieCard(movie);

        grid.appendChild(card);

    });

}


/* =========================================================
   TARJETA DE PELÍCULA
========================================================= */

function createMovieCard(movie) {

    const card =
        document.createElement("article");

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
            ? Number(movie.tmdb_rating).toFixed(1)
            : "N/A";

    const genres =
        Array.isArray(movie.tmdb_genres)
            ? movie.tmdb_genres
                .slice(0, 2)
                .join(" · ")
            : "";

    const year =
        movie.tmdb_release_date
            ? movie.tmdb_release_date.substring(0, 4)
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
                        ? `<span>${escapeMovieHTML(year)}</span>`
                        : ""
                }

                ${
                    genres
                        ? `<span>${escapeMovieHTML(genres)}</span>`
                        : ""
                }

            </div>

        </div>

    `;


    card.addEventListener(
        "click",
        () => openMovieDetails(movie)
    );


    card.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter" ||
                event.key === " "
            ) {

                event.preventDefault();

                openMovieDetails(movie);

            }

        }
    );


    return card;

}


/* =========================================================
   DETALLE
========================================================= */

function openMovieDetails(movie) {

    console.log(
        "NETVISION - PELÍCULA:",
        movie
    );


    const modal =
        document.getElementById(
            "movieModal"
        );


    if (!modal) {

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
                ? movie.tmdb_genres.join(" · ")
                : "";

    }


    modal.classList.add(
        "active"
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
   LOADING
========================================================= */

function showMoviesLoading() {

    const grid =
        document.getElementById(
            "moviesGrid"
        );

    if (!grid) return;


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
   ERROR
========================================================= */

function showMoviesError() {

    const grid =
        document.getElementById(
            "moviesGrid"
        );

    if (!grid) return;


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

function escapeMovieHTML(value) {

    return String(value ?? "")
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


function escapeMovieAttr(value) {

    return escapeMovieHTML(
        value
    );

}


/* =========================================================
   EXPORTAR PARA BOTONES HTML
========================================================= */

window.loadMovies =
    loadMovies;

window.nextMoviesPage =
    nextMoviesPage;

window.previousMoviesPage =
    previousMoviesPage;

window.openMovieDetails =
    openMovieDetails;
