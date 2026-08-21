/* =========================================================
   NETVISION - APP PRINCIPAL
   TV EN VIVO + M3U/M3U8 + HLS.JS
========================================================= */

const M3U_FILE = "./canales.m3u";

let channels = [];
let currentChannel = null;
let selectedCategory = null;
let hls = null;

let videoPlayer;
let playerPlaceholder;
let selectedChannelName;
let selectedChannelCategory;
let currentChannelLogo;
let tvCategories;
let selectedCategoryTitle;
let selectedCategoryCount;
let selectedCategoryChannels;
let channelSearch;


/* =========================================================
   INICIO
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    cacheElements();

    setupNavigation();

    setupSearch();

    setupProfile();

    setupModal();

    loadM3U();

});


/* =========================================================
   ELEMENTOS
========================================================= */

function cacheElements() {

    videoPlayer =
        document.getElementById("videoPlayer");

    playerPlaceholder =
        document.getElementById("playerPlaceholder");

    selectedChannelName =
        document.getElementById("selectedChannelName");

    selectedChannelCategory =
        document.getElementById("selectedChannelCategory");

    currentChannelLogo =
        document.getElementById("currentChannelLogo");

    tvCategories =
        document.getElementById("tvCategories");

    selectedCategoryTitle =
        document.getElementById("selectedCategoryTitle");

    selectedCategoryCount =
        document.getElementById("selectedCategoryCount");

    selectedCategoryChannels =
        document.getElementById("selectedCategoryChannels");

    channelSearch =
        document.getElementById("channelSearch");

}


/* =========================================================
   NAVEGACIÓN
========================================================= */

function setupNavigation() {

    const pageButtons =
        document.querySelectorAll("[data-page]");

    const pages =
        document.querySelectorAll(".page");

    const navLinks =
        document.querySelectorAll(".nav-link");

    const mobileMenuBtn =
        document.getElementById("mobileMenuBtn");

    const mainNav =
        document.getElementById("mainNav");


    pageButtons.forEach(button => {

        button.addEventListener("click", () => {

            const page =
                button.dataset.page;

            if (page) {

                showPage(page);

            }

        });

    });


    navLinks.forEach(link => {

        link.addEventListener("click", () => {

            const page =
                link.dataset.page;

            if (page) {

                showPage(page);

            }

        });

    });


    if (
        mobileMenuBtn &&
        mainNav
    ) {

        mobileMenuBtn.addEventListener(
            "click",
            () => {

                mainNav.classList.toggle(
                    "open"
                );

            }
        );

    }


    function showPage(pageName) {

        pages.forEach(page => {

            page.classList.toggle(
                "active-page",
                page.id === `page-${pageName}`
            );

        });

navLinks.forEach(link => {

    link.addEventListener("click", () => {

        const page =
            link.dataset.page;


        // Si salimos de TV,
        // detener completamente el canal
        if (page !== "tv") {
            detenerTV();
        }


        mostrarPagina(page);

    });

});
window.addEventListener("beforeunload", () => {
    detenerTV();
});

        if (mainNav) {

            mainNav.classList.remove(
                "open"
            );

        }


        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }

}


/* =========================================================
   BÚSQUEDA
========================================================= */

function setupSearch() {

    const searchBtn =
        document.getElementById("searchBtn");

    const searchOverlay =
        document.getElementById("searchOverlay");

    const closeSearch =
        document.getElementById("closeSearch");

    const globalSearch =
        document.getElementById("globalSearch");


    if (
        searchBtn &&
        searchOverlay
    ) {

        searchBtn.addEventListener(
            "click",
            () => {

                searchOverlay.classList.add(
                    "active"
                );


                if (globalSearch) {

                    setTimeout(
                        () => globalSearch.focus(),
                        100
                    );

                }

            }
        );

    }


    if (
        closeSearch &&
        searchOverlay
    ) {

        closeSearch.addEventListener(
            "click",
            () => {

                searchOverlay.classList.remove(
                    "active"
                );

            }
        );

    }


    if (searchOverlay) {

        searchOverlay.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    searchOverlay
                ) {

                    searchOverlay.classList.remove(
                        "active"
                    );

                }

            }
        );

    }


    if (globalSearch) {

        globalSearch.addEventListener(
            "input",
            () => {

                const term =
                    globalSearch.value
                        .trim()
                        .toLowerCase();


                if (
                    term &&
                    channels.length
                ) {

                    const results =
                        channels.filter(
                            channel =>
                                channel.name
                                    .toLowerCase()
                                    .includes(term)
                        );


                    if (results.length) {

                        renderSearchResults(
                            results
                        );

                    }

                }

            }
        );

    }


    if (channelSearch) {

        channelSearch.addEventListener(
            "input",
            () => {

                const term =
                    channelSearch.value
                        .trim()
                        .toLowerCase();


                if (!term) {

                    if (
                        selectedCategory
                    ) {

                        selectCategory(
                            selectedCategory
                        );

                    } else {

                        renderTV(
                            channels
                        );

                    }

                    return;

                }


                const results =
                    channels.filter(
                        channel =>

                            channel.name
                                .toLowerCase()
                                .includes(term)

                            ||

                            channel.category
                                .toLowerCase()
                                .includes(term)
                    );


                renderSearchChannels(
                    results,
                    term
                );

            }
        );

    }

}


/* =========================================================
   BÚSQUEDA DE CANALES
========================================================= */

function renderSearchChannels(
    results,
    term
) {

    if (
        !selectedCategoryChannels
    ) return;


    if (
        selectedCategoryTitle
    ) {

        selectedCategoryTitle.innerHTML =
            `🔎 RESULTADOS PARA:
             <span>
                ${escapeHTML(term)}
             </span>`;

    }


    if (
        selectedCategoryCount
    ) {

        selectedCategoryCount.textContent =
            `${results.length}
             ${
                results.length === 1
                    ? "canal"
                    : "canales"
             }`;

    }


    selectedCategoryChannels.innerHTML =
        "";


    if (!results.length) {

        selectedCategoryChannels.innerHTML = `

            <div
                style="
                    padding:20px;
                    color:var(--text-soft);
                "
            >

                No encontramos canales
                con esa búsqueda.

            </div>

        `;

        return;

    }


    results.forEach(
        channel => {

            selectedCategoryChannels.appendChild(
                createChannelCard(
                    channel
                )
            );

        }
    );

}


/* =========================================================
   RESULTADOS DE BÚSQUEDA GLOBAL
========================================================= */

function renderSearchResults(
    results
) {

    const searchOverlay =
        document.getElementById(
            "searchOverlay"
        );


    if (searchOverlay) {

        searchOverlay.classList.remove(
            "active"
        );

    }


    const tvPage =
        document.getElementById(
            "page-tv"
        );


    if (!tvPage) return;


    document.querySelectorAll(
        ".page"
    ).forEach(
        page => {

            page.classList.toggle(
                "active-page",
                page === tvPage
            );

        }
    );


    document.querySelectorAll(
        ".nav-link"
    ).forEach(
        link => {

            link.classList.toggle(
                "active",
                link.dataset.page === "tv"
            );

        }
    );


    if (
        selectedCategoryChannels
    ) {

        if (
            selectedCategoryTitle
        ) {

            selectedCategoryTitle.innerHTML =
                "🔎 RESULTADOS DE BÚSQUEDA";

        }


        if (
            selectedCategoryCount
        ) {

            selectedCategoryCount.textContent =
                `${results.length} canales`;

        }


        selectedCategoryChannels.innerHTML =
            "";


        results.forEach(
            channel => {

                selectedCategoryChannels.appendChild(
                    createChannelCard(
                        channel
                    )
                );

            }
        );

    }

}


/* =========================================================
   PERFIL
========================================================= */

function setupProfile() {

    const profileBtn =
        document.getElementById(
            "profileBtn"
        );

    const profileMenu =
        document.getElementById(
            "profileMenu"
        );


    if (
        !profileBtn ||
        !profileMenu
    ) return;


    profileBtn.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            profileMenu.classList.toggle(
                "active"
            );

        }
    );


    document.addEventListener(
        "click",
        event => {

            if (
                !profileMenu.contains(
                    event.target
                ) &&
                event.target !== profileBtn
            ) {

                profileMenu.classList.remove(
                    "active"
                );

            }

        }
    );

}


/* =========================================================
   MODAL
========================================================= */

function setupModal() {

    const modal =
        document.getElementById(
            "contentModal"
        );

    const close =
        document.getElementById(
            "closeContent"
        );


    if (
        close &&
        modal
    ) {

        close.addEventListener(
            "click",
            () => {

                modal.classList.remove(
                    "active"
                );

            }
        );

    }


    if (modal) {

        modal.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    modal
                ) {

                    modal.classList.remove(
                        "active"
                    );

                }

            }
        );

    }

}


/* =========================================================
   CARGAR M3U
========================================================= */

async function loadM3U() {

    try {

        console.log(
            "NETVISION: cargando",
            M3U_FILE
        );


        const response =
            await fetch(
                M3U_FILE,
                {
                    cache: "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );

        }


        const text =
            await response.text();


        channels =
            parseM3U(
                text
            );


        console.log(
            "NETVISION: canales encontrados:",
            channels.length
        );


        if (!channels.length) {

            showError(
                "La lista M3U está vacía."
            );

            return;

        }


        renderTV(
            channels
        );


        renderHomeChannels();


    } catch (error) {

        console.error(
            "NETVISION: error cargando M3U",
            error
        );


        showError(
            "No se pudo cargar la lista. " +
            "Verifica que exista canales.m3u."
        );

    }

}


/* =========================================================
   PARSER M3U
========================================================= */

function parseM3U(
    text
) {

    const lines =
        text
            .split(/\r?\n/)
            .map(
                line =>
                    line.trim()
            )
            .filter(Boolean);


    const result = [];


    for (
        let i = 0;
        i < lines.length;
        i++
    ) {

        const line =
            lines[i];


        if (
            !line.startsWith(
                "#EXTINF:"
            )
        ) {

            continue;

        }


        const info =
            line.substring(
                8
            );


        const commaIndex =
            info.indexOf(",");


        let attributes =
            info;

        let channelName =
            "Canal sin nombre";


        if (
            commaIndex !== -1
        ) {

            attributes =
                info.substring(
                    0,
                    commaIndex
                );


            channelName =
                info.substring(
                    commaIndex + 1
                ).trim() ||
                channelName;

        }


        let url = "";


        for (
            let j = i + 1;
            j < lines.length;
            j++
        ) {

            if (
                !lines[j].startsWith(
                    "#"
                )
            ) {

                url =
                    lines[j];

                break;

            }

        }


        if (!url) {

            continue;

        }


        result.push({

            id:
                getAttribute(
                    attributes,
                    "tvg-id"
                ) ||
                createId(
                    channelName
                ),

            name:
                channelName,

            url:
                url,

            logo:
                getAttribute(
                    attributes,
                    "tvg-logo"
                ),

            category:
                getAttribute(
                    attributes,
                    "group-title"
                ) ||
                "Otros"

        });

    }


    return result;

}


/* =========================================================
   ATRIBUTO M3U
========================================================= */

function getAttribute(
    text,
    attribute
) {

    const regex =
        new RegExp(
            `${attribute}="([^"]*)"`,
            "i"
        );


    const match =
        text.match(
            regex
        );


    return match
        ? match[1]
        : "";

}


/* =========================================================
   ID
========================================================= */

function createId(
    text
) {

    return text
        .toLowerCase()
        .normalize(
            "NFD"
        )
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .replace(
            /[^a-z0-9]+/g,
            "-"
        )
        .replace(
            /^-+|-+$/g,
            "");

}


/* =========================================================
   TV / CATEGORÍAS
========================================================= */

function renderTV(
    list = channels
) {

    if (!tvCategories) {

        console.error(
            "NETVISION: no existe #tvCategories"
        );

        return;

    }


    /*
       IMPORTANTE:
       Si tu HTML todavía tiene dos elementos
       con id="tvCategories", usamos el primero.
    */

    tvCategories.innerHTML =
        "";


    const categories = [];


    list.forEach(
        channel => {

            if (
                !categories.includes(
                    channel.category
                )
            ) {

                categories.push(
                    channel.category
                );

            }

        }
    );


    categories.forEach(
        category => {

            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.className =
                "tv-category-button";


            button.dataset.category =
                category;


            button.innerHTML = `

                <span class="category-icon">

                    ${getCategoryIcon(
                        category
                    )}

                </span>

                <span class="category-name">

                    ${escapeHTML(
                        category
                    )}

                </span>

                <span class="category-arrow">

                    ›

                </span>

            `;


            button.addEventListener(
                "click",
                function(event) {

                    event.preventDefault();

                    event.stopPropagation();

                    selectCategory(
                        category
                    );

                }
            );


            tvCategories.appendChild(
                button
            );

        }
    );


    /*
       Seleccionar primera categoría
    */

    if (
        categories.length
    ) {

        const category =
            selectedCategory &&
            categories.includes(
                selectedCategory
            )

                ? selectedCategory

                : categories[0];


        selectCategory(
            category
        );

    }

}


/* =========================================================
   SELECCIONAR CATEGORÍA
========================================================= */

function selectCategory(
    category
) {

    selectedCategory =
        category;


    console.log(
        "NETVISION: categoría",
        category
    );


    /*
       Activar botón
    */

    document.querySelectorAll(
        ".tv-category-button"
    ).forEach(
        button => {

            button.classList.toggle(
                "active",
                button.dataset.category ===
                category
            );

        }
    );


    /*
       Filtrar canales
    */

    const categoryChannels =
        channels.filter(
            channel =>
                channel.category ===
                category
        );


    renderSelectedCategory(
        category,
        categoryChannels
    );

}


/* =========================================================
   MOSTRAR CANALES
========================================================= */

function renderSelectedCategory(
    category,
    categoryChannels
) {

    if (
        !selectedCategoryChannels
    ) {

        console.error(
            "NETVISION: no existe #selectedCategoryChannels"
        );

        return;

    }


    if (
        selectedCategoryTitle
    ) {

        selectedCategoryTitle.innerHTML = `

            ${getCategoryIcon(
                category
            )}

            CANALES DE:

            <span>
                ${escapeHTML(
                    category
                )}
            </span>

        `;

    }


    if (
        selectedCategoryCount
    ) {

        selectedCategoryCount.textContent =
            `${categoryChannels.length} ${
                categoryChannels.length === 1
                    ? "canal"
                    : "canales"
            }`;

    }


    selectedCategoryChannels.innerHTML =
        "";


    categoryChannels.forEach(
        channel => {

            selectedCategoryChannels.appendChild(
                createChannelCard(
                    channel
                )
            );

        }
    );

}


/* =========================================================
   TARJETA DE CANAL
========================================================= */

function createChannelCard(
    channel
) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "channel-card";


    card.tabIndex =
        0;


    const logo =
        channel.logo

            ? `

                <img
                    src="${escapeAttribute(
                        channel.logo
                    )}"
                    alt="${escapeAttribute(
                        channel.name
                    )}"
                    loading="lazy"
                    onerror="
                        this.style.display='none';
                    "
                >

              `

            : `

                <span class="default-channel-logo">
                    TV
                </span>

              `;


    card.innerHTML = `

        <div class="channel-logo">

            ${logo}

        </div>


        <div class="channel-card-info">

            <div class="channel-name">

                ${escapeHTML(
                    cleanChannelName(
                        channel.name
                    )
                )}

            </div>


            <div class="channel-meta">

                ● EN VIVO

            </div>

        </div>

    `;


    card.addEventListener(
        "click",
        event => {

            event.preventDefault();

            selectChannel(
                channel
            );

        }
    );


    card.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter" ||
                event.key === " "
            ) {

                event.preventDefault();

                selectChannel(
                    channel
                );

            }

        }
    );


    return card;

}


/* =========================================================
   SELECCIONAR CANAL
========================================================= */

function selectChannel(
    channel
) {

    currentChannel =
        channel;


    console.log(
        "NETVISION: seleccionando",
        channel.name
    );


    if (
        selectedChannelName
    ) {

        selectedChannelName.textContent =
            cleanChannelName(
                channel.name
            );

    }


    if (
        selectedChannelCategory
    ) {

        selectedChannelCategory.textContent =
            `${channel.category} · EN VIVO`;

    }


    if (
        currentChannelLogo
    ) {

        currentChannelLogo.innerHTML =
            channel.logo

                ? `

                    <img
                        src="${escapeAttribute(
                            channel.logo
                        )}"
                        alt="${escapeAttribute(
                            channel.name
                        )}"
                    >

                  `

                : `

                    <span>
                        TV
                    </span>

                  `;

    }


    if (
        playerPlaceholder
    ) {

        playerPlaceholder.classList.add(
            "hidden"
        );

    }


    playStream(
        channel.url
    );

}


/* =========================================================
   HLS.JS
========================================================= */

function playStream(
    url
) {

    if (!videoPlayer) {

        console.error(
            "NETVISION: no existe #videoPlayer"
        );

        return;

    }


    console.log(
        "NETVISION: reproduciendo",
        url
    );


    /*
       Destruir reproductor anterior
    */

    if (
        hls
    ) {

        hls.destroy();

        hls =
            null;

    }


    videoPlayer.pause();

    videoPlayer.removeAttribute(
        "src"
    );

    videoPlayer.load();


    /*
       HLS.js
    */

    if (
        window.Hls &&
        Hls.isSupported()
    ) {

        hls =
            new Hls({

                enableWorker:
                    true,

                lowLatencyMode:
                    true,

                backBufferLength:
                    90

            });


        hls.loadSource(
            url
        );


        hls.attachMedia(
            videoPlayer
        );


        hls.on(
            Hls.Events.MANIFEST_PARSED,
            () => {

                videoPlayer
                    .play()
                    .catch(
                        error => {

                            console.log(
                                "Autoplay bloqueado",
                                error
                            );

                        }
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
                    "NETVISION HLS ERROR:",
                    data
                );


                if (
                    !data.fatal
                ) {

                    return;

                }


                if (
                    data.type ===
                    Hls.ErrorTypes.NETWORK_ERROR
                ) {

                    hls.startLoad();

                }

                else if (
                    data.type ===
                    Hls.ErrorTypes.MEDIA_ERROR
                ) {

                    hls.recoverMediaError();

                }

                else {

                    showPlayerError();

                    hls.destroy();

                    hls =
                        null;

                }

            }
        );


        return;

    }


    /*
       HLS nativo
    */

    if (
        videoPlayer.canPlayType(
            "application/vnd.apple.mpegurl"
        )
    ) {

        videoPlayer.src =
            url;


        videoPlayer.addEventListener(
            "loadedmetadata",
            () => {

                videoPlayer
                    .play()
                    .catch(
                        error => {

                            console.log(
                                "Autoplay bloqueado",
                                error
                            );

                        }
                    );

            },
            {
                once: true
            }
        );


        return;

    }


    showPlayerError();

}
function detenerTV() {

    const video = document.getElementById("videoPlayer");

    // Detener HLS
    if (typeof hls !== "undefined" && hls) {
        try {
            hls.stopLoad();
            hls.detachMedia();
            hls.destroy();
        } catch (error) {
            console.log("HLS detenido");
        }

        hls = null;
    }

    // Detener completamente el video
    if (video) {

        try {
            video.pause();
        } catch (error) {}

        video.removeAttribute("src");

        video.src = "";

        video.load();
    }

    // Limpiar información del canal
    const channelName =
        document.getElementById("selectedChannelName");

    const channelCategory =
        document.getElementById("selectedChannelCategory");

    const channelLogo =
        document.getElementById("currentChannelLogo");

    if (channelName) {
        channelName.textContent =
            "Ningún canal seleccionado";
    }

    if (channelCategory) {
        channelCategory.textContent =
            "Selecciona un canal";
    }

    if (channelLogo) {
        channelLogo.textContent = "TV";
    }

}

/* =========================================================
   ERROR REPRODUCTOR
========================================================= */

function showPlayerError() {

    if (
        !playerPlaceholder
    ) {

        return;

    }


    playerPlaceholder.classList.remove(
        "hidden"
    );


    playerPlaceholder.innerHTML = `

        <div class="player-icon">
            ⚠
        </div>

        <h3>
            No se pudo reproducir
        </h3>

        <p>
            El canal no está disponible
            en este momento.
        </p>

    `;

}


/* =========================================================
   CANALES EN INICIO
========================================================= */

function renderHomeChannels() {

    const popular =
        document.getElementById(
            "homePopularChannels"
        );


    const newest =
        document.getElementById(
            "homeNewChannels"
        );


    if (popular) {

        popular.innerHTML =
            "";


        channels
            .slice(
                0,
                6
            )
            .forEach(
                channel => {

                    popular.appendChild(
                        createChannelCard(
                            channel
                        )
                    );

                }
            );

    }


    if (newest) {

        newest.innerHTML =
            "";


        channels
            .slice(
                -6
            )
            .forEach(
                channel => {

                    newest.appendChild(
                        createChannelCard(
                            channel
                        )
                    );

                }
            );

    }

}


/* =========================================================
   ICONOS
========================================================= */

function getCategoryIcon(
    category
) {

    const name =
        category
            .toLowerCase()
            .normalize(
                "NFD"
            )
            .replace(
                /[\u0300-\u036f]/g,
                ""
            );


    if (
        name.includes(
            "relig"
        )
    ) return "✝️";


    if (
        name.includes(
            "anime"
        )
    ) return "🍥";


    if (
        name.includes(
            "caricatura"
        ) ||
        name.includes(
            "kids"
        ) ||
        name.includes(
            "infantil"
        )
    ) return "🎨";


    if (
        name.includes(
            "deporte"
        ) ||
        name.includes(
            "sport"
        )
    ) return "⚽";


    if (
        name.includes(
            "curiosity"
        ) ||
        name.includes(
            "document"
        )
    ) return "🔬";


    if (
        name.includes(
            "noticia"
        ) ||
        name.includes(
            "news"
        )
    ) return "📰";


    if (
        name.includes(
            "musica"
        ) ||
        name.includes(
            "music"
        )
    ) return "🎵";


    if (
        name.includes(
            "pelicula"
        ) ||
        name.includes(
            "movie"
        )
    ) return "🎬";


    return "📺";

}


/* =========================================================
   LIMPIAR NOMBRE
========================================================= */

function cleanChannelName(
    name
) {

    if (!name) {

        return "Canal";

    }


    return name
        .replace(
            /\s*\[[^\]]*\]\s*/g,
            " "
        )
        .replace(
            /\s+/g,
            " "
        )
        .trim();

}


/* =========================================================
   SEGURIDAD
========================================================= */

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


function escapeAttribute(
    value
) {

    return escapeHTML(
        value
    );

}


/* =========================================================
   ERROR GENERAL
========================================================= */

function showError(
    message
) {

    console.error(
        "NETVISION:",
        message
    );


    if (
        tvCategories
    ) {

        tvCategories.innerHTML = `

            <div
                style="
                    padding:15px;
                    color:#ff6b6b;
                    font-size:13px;
                "
            >

                ⚠️
                ${escapeHTML(
                    message
                )}

            </div>

        `;

    }

}


/* =========================================================
   LIMPIEZA
========================================================= */

window.addEventListener(
    "beforeunload",
    () => {

        if (
            hls
        ) {

            hls.destroy();

            hls =
                null;

        }

    }
);
