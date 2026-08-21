/* =========================================================
   NETVISION
   MAIN APPLICATION
========================================================= */


/* =========================================================
   DATOS DE PRUEBA
   ---------------------------------------------
   Posteriormente estos datos vendrán del servidor.
========================================================= */

const movies = [

    {
        id: 1,
        title: "Horizonte",
        genre: "Acción",
        year: 2026
    },

    {
        id: 2,
        title: "Código Final",
        genre: "Acción",
        year: 2026
    },

    {
        id: 3,
        title: "Zona Cero",
        genre: "Acción",
        year: 2025
    },

    {
        id: 4,
        title: "Más Allá",
        genre: "Drama",
        year: 2026
    },

    {
        id: 5,
        title: "Última Señal",
        genre: "Suspenso",
        year: 2025
    },

    {
        id: 6,
        title: "Destino",
        genre: "Romance",
        year: 2026
    },

    {
        id: 7,
        title: "La Noche",
        genre: "Terror",
        year: 2025
    },

    {
        id: 8,
        title: "Sin Regreso",
        genre: "Acción",
        year: 2026
    },

    {
        id: 9,
        title: "El Último Viaje",
        genre: "Aventura",
        year: 2026
    },

    {
        id: 10,
        title: "Después de Ti",
        genre: "Romance",
        year: 2025
    },

    {
        id: 11,
        title: "Horizonte Oscuro",
        genre: "Terror",
        year: 2026
    },

    {
        id: 12,
        title: "Código 9",
        genre: "Suspenso",
        year: 2026
    }

];


const series = [

    {
        id: 1,
        title: "Distrito 9",
        genre: "Drama"
    },

    {
        id: 2,
        title: "Operación Norte",
        genre: "Acción"
    },

    {
        id: 3,
        title: "Entre Nosotros",
        genre: "Romance"
    },

    {
        id: 4,
        title: "Zona Oscura",
        genre: "Suspenso"
    },

    {
        id: 5,
        title: "Los Elegidos",
        genre: "Drama"
    },

    {
        id: 6,
        title: "Código Rojo",
        genre: "Acción"
    },

    {
        id: 7,
        title: "Destino Final",
        genre: "Drama"
    },

    {
        id: 8,
        title: "La Última Puerta",
        genre: "Terror"
    }

];


const channels = [

    {
        id: 1,
        name: "Canal Uno",
        category: "Entretenimiento"
    },

    {
        id: 2,
        name: "Noticias 24",
        category: "Noticias"
    },

    {
        id: 3,
        name: "Deportes HD",
        category: "Deportes"
    },

    {
        id: 4,
        name: "Music TV",
        category: "Música"
    },

    {
        id: 5,
        name: "Cine TV",
        category: "Entretenimiento"
    },

    {
        id: 6,
        name: "News Global",
        category: "Noticias"
    },

    {
        id: 7,
        name: "Sports Max",
        category: "Deportes"
    },

    {
        id: 8,
        name: "Music One",
        category: "Música"
    },

    {
        id: 9,
        name: "Action TV",
        category: "Entretenimiento"
    },

    {
        id: 10,
        name: "Noticias Ahora",
        category: "Noticias"
    },

    {
        id: 11,
        name: "Arena Deportes",
        category: "Deportes"
    },

    {
        id: 12,
        name: "Live Music",
        category: "Música"
    }

];


/* =========================================================
   ELEMENTOS
========================================================= */

const pages =
    document.querySelectorAll(".page");

const navLinks =
    document.querySelectorAll(".nav-link");

const mainNav =
    document.getElementById("mainNav");

const mobileMenuBtn =
    document.getElementById("mobileMenuBtn");

const searchBtn =
    document.getElementById("searchBtn");

const searchOverlay =
    document.getElementById("searchOverlay");

const closeSearch =
    document.getElementById("closeSearch");

const profileBtn =
    document.getElementById("profileBtn");

const profileMenu =
    document.getElementById("profileMenu");

const contentModal =
    document.getElementById("contentModal");

const closeContent =
    document.getElementById("closeContent");

const modalPoster =
    document.getElementById("modalPoster");

const modalTitle =
    document.getElementById("modalTitle");

const modalDescription =
    document.getElementById("modalDescription");

const modalType =
    document.getElementById("modalType");


/* =========================================================
   NAVEGACIÓN
========================================================= */

function goToPage(pageName) {

    pages.forEach(page => {

        page.classList.remove("active-page");

    });


    const targetPage =
        document.getElementById(
            `page-${pageName}`
        );


    if (!targetPage) return;


    targetPage.classList.add("active-page");


    navLinks.forEach(link => {

        link.classList.toggle(
            "active",
            link.dataset.page === pageName
        );

    });


    mainNav.classList.remove("open");


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


document.addEventListener(
    "click",
    function(event) {

        const pageButton =
            event.target.closest(
                "[data-page]"
            );


        if (!pageButton) return;


        goToPage(
            pageButton.dataset.page
        );

    }
);


/* =========================================================
   MENÚ MÓVIL
========================================================= */

mobileMenuBtn.addEventListener(
    "click",
    function() {

        mainNav.classList.toggle(
            "open"
        );

    }
);


/* =========================================================
   CREAR TARJETA DE PELÍCULA
========================================================= */

function createMovieCard(movie) {

    const card =
        document.createElement("article");

    card.className = "movie-card";


    card.innerHTML = `

        <div class="movie-poster">

            <div class="movie-poster-content">

                <div class="movie-number">
                    ${String(movie.id).padStart(2, "0")}
                </div>

                <div class="movie-title">
                    ${movie.title}
                </div>

                <div class="movie-meta">
                    ${movie.genre} · ${movie.year}
                </div>

            </div>

        </div>

    `;


    card.addEventListener(
        "click",
        function() {

            openContent(
                movie,
                "PELÍCULA"
            );

        }
    );


    return card;

}


/* =========================================================
   CREAR TARJETA DE SERIE
========================================================= */

function createSeriesCard(show) {

    const card =
        document.createElement("article");

    card.className = "movie-card";


    card.innerHTML = `

        <div class="movie-poster">

            <div class="movie-poster-content">

                <div class="movie-number">
                    ${String(show.id).padStart(2, "0")}
                </div>

                <div class="movie-title">
                    ${show.title}
                </div>

                <div class="movie-meta">
                    ${show.genre}
                </div>

            </div>

        </div>

    `;


    card.addEventListener(
        "click",
        function() {

            openContent(
                show,
                "SERIE"
            );

        }
    );


    return card;

}


/* =========================================================
   CREAR TARJETA DE CANAL
========================================================= */

function createChannelCard(channel) {

    const card =
        document.createElement("article");

    card.className = "channel-card";


    card.innerHTML = `

        <div class="channel-logo">
            ${channel.name.substring(0, 2).toUpperCase()}
        </div>

        <div class="channel-name">
            ${channel.name}
        </div>

    `;


    card.addEventListener(
        "click",
        function() {

            selectChannel(channel);

        }
    );


    return card;

}


/* =========================================================
   RENDER HOME
========================================================= */

function renderHome() {

    const popularMovies =
        document.getElementById(
            "homePopularMovies"
        );

    const newMovies =
        document.getElementById(
            "homeNewMovies"
        );

    const popularChannels =
        document.getElementById(
            "homePopularChannels"
        );

    const newChannels =
        document.getElementById(
            "homeNewChannels"
        );


    popularMovies.innerHTML = "";

    newMovies.innerHTML = "";

    popularChannels.innerHTML = "";

    newChannels.innerHTML = "";


    movies
        .slice(0, 8)
        .forEach(movie => {

            popularMovies.appendChild(
                createMovieCard(movie)
            );

        });


    movies
        .slice(4, 12)
        .forEach(movie => {

            newMovies.appendChild(
                createMovieCard(movie)
            );

        });


    channels
        .slice(0, 8)
        .forEach(channel => {

            popularChannels.appendChild(
                createChannelCard(channel)
            );

        });


    channels
        .slice(4, 12)
        .forEach(channel => {

            newChannels.appendChild(
                createChannelCard(channel)
            );

        });

}


/* =========================================================
   RENDER TV
========================================================= */

function renderTV() {

    const container =
        document.getElementById(
            "tvCategories"
        );


    container.innerHTML = "";


    const categories = [
        "Más vistos",
        "Noticias",
        "Deportes",
        "Música",
        "Entretenimiento"
    ];


    categories.forEach(
        category => {

            const section =
                document.createElement(
                    "section"
                );

            section.className =
                "category-section";


            let categoryChannels;


            if (
                category === "Más vistos"
            ) {

                categoryChannels =
                    channels.slice(0, 8);

            } else {

                categoryChannels =
                    channels.filter(
                        channel =>
                            channel.category ===
                            category
                    ).slice(0, 8);

            }


            if (
                categoryChannels.length === 0
            ) return;


            section.innerHTML = `

                <div class="category-title">

                    <h2>
                        ${
                            category === "Más vistos"
                                ? "🔥"
                                : "•"
                        }
                        ${category}
                    </h2>

                    <button>
                        Ver todo →
                    </button>

                </div>

                <div class="channel-row"></div>

            `;


            const row =
                section.querySelector(
                    ".channel-row"
                );


            categoryChannels.forEach(
                channel => {

                    row.appendChild(
                        createChannelCard(
                            channel
                        )
                    );

                }
            );


            container.appendChild(
                section
            );

        }
    );

}


/* =========================================================
   RENDER PELÍCULAS
========================================================= */

function renderMovies() {

    const container =
        document.getElementById(
            "movieCategories"
        );


    container.innerHTML = "";


    const categories = [
        "Acción",
        "Comedia",
        "Drama",
        "Terror",
        "Romance",
        "Suspenso"
    ];


    categories.forEach(
        category => {

            const section =
                document.createElement(
                    "section"
                );

            section.className =
                "category-section";


            let categoryMovies =
                movies.filter(
                    movie =>
                        movie.genre ===
                        category
                );


            /*
                Si todavía no tenemos
                suficientes datos, usamos
                contenido de prueba.
            */

            if (
                categoryMovies.length === 0
            ) {

                categoryMovies =
                    movies.slice(0, 8);

            }


            categoryMovies =
                categoryMovies.slice(
                    0,
                    8
                );


            section.innerHTML = `

                <div class="category-title">

                    <h2>
                        ${category}
                    </h2>

                    <button>
                        Ver todo →
                    </button>

                </div>

                <div class="movie-row"></div>

            `;


            const row =
                section.querySelector(
                    ".movie-row"
                );


            categoryMovies.forEach(
                movie => {

                    row.appendChild(
                        createMovieCard(
                            movie
                        )
                    );

                }
            );


            container.appendChild(
                section
            );

        }
    );

}


/* =========================================================
   RENDER SERIES
========================================================= */

function renderSeries() {

    const container =
        document.getElementById(
            "seriesCategories"
        );


    container.innerHTML = "";


    const categories = [
        "Más populares",
        "Acción",
        "Drama",
        "Romance",
        "Suspenso"
    ];


    categories.forEach(
        category => {

            const section =
                document.createElement(
                    "section"
                );

            section.className =
                "category-section";


            let categorySeries;


            if (
                category === "Más populares"
            ) {

                categorySeries =
                    series.slice(0, 8);

            } else {

                categorySeries =
                    series.filter(
                        show =>
                            show.genre ===
                            category
                    ).slice(0, 8);

            }


            if (
                categorySeries.length === 0
            ) {

                categorySeries =
                    series.slice(0, 8);

            }


            section.innerHTML = `

                <div class="category-title">

                    <h2>
                        ${category}
                    </h2>

                    <button>
                        Ver todo →
                    </button>

                </div>

                <div class="movie-row"></div>

            `;


            const row =
                section.querySelector(
                    ".movie-row"
                );


            categorySeries.forEach(
                show => {

                    row.appendChild(
                        createSeriesCard(
                            show
                        )
                    );

                }
            );


            container.appendChild(
                section
            );

        }
    );

}


/* =========================================================
   SELECCIONAR CANAL
========================================================= */

function selectChannel(channel) {

    goToPage("tv");


    const selected =
        document.getElementById(
            "selectedChannelName"
        );


    selected.textContent =
        channel.name;


    console.log(
        "Canal seleccionado:",
        channel
    );


    /*
        AQUÍ CONECTAREMOS DESPUÉS:

        M3U
        ↓
        URL DEL CANAL
        ↓
        HLS.JS
        ↓
        VIDEO

        Por ahora solamente
        actualizamos la interfaz.
    */

}


/* =========================================================
   BUSCAR CANALES
========================================================= */

const channelSearch =
    document.getElementById(
        "channelSearch"
    );


channelSearch.addEventListener(
    "input",
    function() {

        const search =
            this.value
                .toLowerCase()
                .trim();


        const categoryContainer =
            document.getElementById(
                "tvCategories"
            );


        categoryContainer.innerHTML = "";


        const results =
            channels.filter(
                channel =>
                    channel.name
                        .toLowerCase()
                        .includes(search)
            );


        const section =
            document.createElement(
                "section"
            );

        section.className =
            "category-section";


        section.innerHTML = `

            <div class="category-title">

                <h2>
                    Resultados
                </h2>

            </div>

            <div class="channel-row"></div>

        `;


        const row =
            section.querySelector(
                ".channel-row"
            );


        results.forEach(
            channel => {

                row.appendChild(
                    createChannelCard(
                        channel
                    )
                );

            }
        );


        categoryContainer.appendChild(
            section
        );

    }
);


/* =========================================================
   MODAL DE CONTENIDO
========================================================= */

function openContent(
    content,
    type
) {

    modalType.textContent =
        type;


    modalTitle.textContent =
        content.title;


    modalDescription.textContent =
        type === "SERIE"

            ? `Serie de ${content.genre}. Próximamente podrás consultar temporadas, episodios y reproducir el contenido desde NETVISION.`

            : `Película de ${content.genre}. Próximamente podrás reproducir este contenido desde NETVISION.`;


    modalPoster.innerHTML = `

        <div
            style="
                height:100%;
                display:flex;
                align-items:flex-end;
                padding:20px;
                font-size:35px;
                font-weight:900;
            "
        >
            ${String(content.id).padStart(2, "0")}
        </div>

    `;


    contentModal.classList.add(
        "show"
    );

}


/* =========================================================
   CERRAR MODAL
========================================================= */

closeContent.addEventListener(
    "click",
    function() {

        contentModal.classList.remove(
            "show"
        );

    }
);


contentModal.addEventListener(
    "click",
    function(event) {

        if (
            event.target ===
            contentModal
        ) {

            contentModal.classList.remove(
                "show"
            );

        }

    }
);


/* =========================================================
   BUSCADOR GLOBAL
========================================================= */

searchBtn.addEventListener(
    "click",
    function() {

        searchOverlay.classList.add(
            "show"
        );


        setTimeout(
            () => {

                document
                    .getElementById(
                        "globalSearch"
                    )
                    .focus();

            },
            100
        );

    }
);


closeSearch.addEventListener(
    "click",
    function() {

        searchOverlay.classList.remove(
            "show"
        );

    }
);


searchOverlay.addEventListener(
    "click",
    function(event) {

        if (
            event.target ===
            searchOverlay
        ) {

            searchOverlay.classList.remove(
                "show"
            );

        }

    }
);


/* =========================================================
   PERFIL
========================================================= */

profileBtn.addEventListener(
    "click",
    function(event) {

        event.stopPropagation();

        profileMenu.classList.toggle(
            "show"
        );

    }
);


profileMenu.addEventListener(
    "click",
    function(event) {

        if (
            event.target ===
            profileMenu
        ) {

            profileMenu.classList.remove(
                "show"
            );

        }

    }
);


/* =========================================================
   ESC PARA CERRAR VENTANAS
========================================================= */

document.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key === "Escape"
        ) {

            searchOverlay.classList.remove(
                "show"
            );

            profileMenu.classList.remove(
                "show"
            );

            contentModal.classList.remove(
                "show"
            );

        }

    }
);


/* =========================================================
   INICIALIZAR
========================================================= */

function initializeNETVISION() {

    renderHome();

    renderTV();

    renderMovies();

    renderSeries();

    console.log(
        "NETVISION iniciado correctamente."
    );

}


initializeNETVISION();
