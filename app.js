
/* =========================================================
   NETVISION
   TV EN VIVO + M3U + HLS.JS
========================================================= */


/* =========================================================
   VARIABLES
========================================================= */

let channels = [];

let hls = null;

let currentChannel = null;


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

const videoPlayer =
    document.getElementById("videoPlayer");

const playerPlaceholder =
    document.getElementById(
        "playerPlaceholder"
    );

const selectedChannelName =
    document.getElementById(
        "selectedChannelName"
    );

const selectedChannelCategory =
    document.getElementById(
        "selectedChannelCategory"
    );

const channelSearch =
    document.getElementById(
        "channelSearch"
    );


/* =========================================================
   NAVEGACIÓN
========================================================= */

function goToPage(pageName) {

    pages.forEach(page => {

        page.classList.remove(
            "active-page"
        );

    });


    const targetPage =
        document.getElementById(
            `page-${pageName}`
        );


    if (!targetPage) return;


    targetPage.classList.add(
        "active-page"
    );


    navLinks.forEach(link => {

        link.classList.toggle(
            "active",
            link.dataset.page === pageName
        );

    });


    mainNav.classList.remove(
        "open"
    );


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


document.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                "[data-page]"
            );


        if (!button) return;


        goToPage(
            button.dataset.page
        );

    }
);


/* =========================================================
   MENÚ MÓVIL
========================================================= */

mobileMenuBtn.addEventListener(
    "click",
    () => {

        mainNav.classList.toggle(
            "open"
        );

    }
);


/* =========================================================
   PARSER M3U
========================================================= */

function parseM3U(text) {

    const lines =
        text
            .split(/\r?\n/)
            .map(line => line.trim())
            .filter(Boolean);


    const result = [];


    for (
        let i = 0;
        i < lines.length;
        i++
    ) {

        const line = lines[i];


        if (
            !line.startsWith("#EXTINF")
        ) {
            continue;
        }


        const url =
            lines[i + 1] || "";


        const nameMatch =
            line.match(
                /,(.*)$/
            );


        const groupMatch =
            line.match(
                /group-title="([^"]*)"/i
            );


        const logoMatch =
            line.match(
                /tvg-logo="([^"]*)"/i
            );


        const idMatch =
            line.match(
                /tvg-id="([^"]*)"/i
            );


        const name =
            nameMatch
                ? nameMatch[1].trim()
                : "Canal sin nombre";


        const category =
            groupMatch
                ? groupMatch[1].trim()
                : "General";


        const logo =
            logoMatch
                ? logoMatch[1].trim()
                : "";


        const id =
            idMatch
                ? idMatch[1].trim()
                : "";


        result.push({

            id,

            name,

            category,

            logo,

            url

        });

    }


    return result;

}


/* =========================================================
   CARGAR M3U
========================================================= */

async function loadM3U() {

    try {

        console.log(
            "NETVISION: cargando lista M3U..."
        );


        const response =
            await fetch(
                "./canales.m3u"
            );


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );

        }


        const text =
            await response.text();


        channels =
            parseM3U(text);


        console.log(
            `NETVISION: ${channels.length} canales encontrados.`
        );


        renderTV();

        renderHomeChannels();


    } catch (error) {

        console.error(
            "Error cargando M3U:",
            error
        );


        showM3UError();

    }

}


/* =========================================================
   ERROR DE M3U
========================================================= */

function showM3UError() {

    const container =
        document.getElementById(
            "tvCategories"
        );


    container.innerHTML = `

        <section class="category-section">

            <div class="category-title">

                <h2>
                    ⚠️ No se pudo cargar la lista
                </h2>

            </div>

            <p style="
                color:var(--text-soft);
                line-height:1.6;
            ">

                Verifica que exista:

                <br><br>

                <strong>
                    data/canales.m3u
                </strong>

            </p>

        </section>

    `;

}


/* =========================================================
   CREAR TARJETA DE CANAL
========================================================= */

function createChannelCard(channel) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "channel-card";


    const logoHTML =
        channel.logo

            ? `
                <img
                    src="${channel.logo}"
                    alt="${channel.name}"
                    loading="lazy"
                    onerror="
                        this.style.display='none';
                        this.parentElement.textContent='TV';
                    "
                >
              `

            : `
                TV
              `;


    card.innerHTML = `

        <div class="channel-logo">

            ${logoHTML}

        </div>

        <div class="channel-name">

            ${escapeHTML(
                cleanChannelName(
                    channel.name
                )
            )}

        </div>

    `;


    card.addEventListener(
        "click",
        () => {

            selectChannel(
                channel
            );

        }
    );


    return card;

}


/* =========================================================
   LIMPIAR NOMBRE
========================================================= */

function cleanChannelName(name) {

    return name
        .replace(
            /\s*\[(.*?)\]/g,
            ""
        )
        .trim();

}


/* =========================================================
   SEGURIDAD HTML
========================================================= */

function escapeHTML(value) {

    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* =========================================================
   RENDER TV
========================================================= */

function renderTV(
    filteredChannels = channels
) {

    const container =
        document.getElementById(
            "tvCategories"
        );


    if (!container) return;


    container.innerHTML = "";


    if (
        filteredChannels.length === 0
    ) {

        container.innerHTML = `

            <section class="category-section">

                <div class="category-title">

                    <h2>
                        No encontramos canales
                    </h2>

                </div>

            </section>

        `;

        return;

    }


    /*
       Crear categorías respetando
       el orden de la lista M3U.
    */

    const categories = [];


    filteredChannels.forEach(
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

            const categoryChannels =
                filteredChannels.filter(
                    channel =>
                        channel.category ===
                        category
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
                        ${getCategoryIcon(
                            category
                        )}
                        ${escapeHTML(
                            category
                        )}
                    </h2>

                    <button>
                        ${categoryChannels.length}
                        canales
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
   ICONOS DE CATEGORÍA
========================================================= */

function getCategoryIcon(category) {

    const icons = {

        "Religioso": "✝️",

        "Caricaturas": "🎨",

        "Anime": "🍥",

        "Deportes": "⚽",

        "Curiosity": "🔬",

        "Documentary": "🎥",

        "Kids": "👦",

        "Noticias": "📰",

        "Música": "🎵",

        "Entretenimiento": "🎬"

    };


    return icons[category] || "📺";

}


/* =========================================================
   HOME — CANALES
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


    if (!popular || !newest) return;


    popular.innerHTML = "";

    newest.innerHTML = "";


    channels
        .slice(0, 8)
        .forEach(channel => {

            popular.appendChild(
                createChannelCard(
                    channel
                )
            );

        });


    channels
        .slice(-8)
        .forEach(channel => {

            newest.appendChild(
                createChannelCard(
                    channel
                )
            );

        });

}


/* =========================================================
   REPRODUCIR CANAL
========================================================= */

function selectChannel(channel) {

    currentChannel =
        channel;


    console.log(
        "NETVISION:",
        "Seleccionando canal",
        channel.name
    );


    selectedChannelName.textContent =
        cleanChannelName(
            channel.name
        );


    selectedChannelCategory.textContent =
        `${channel.category} · EN VIVO`;


    playerPlaceholder.classList.add(
        "hidden"
    );


    playStream(
        channel.url
    );


    /*
       En móvil regresamos
       al reproductor.
    */

    const player =
        document.querySelector(
            ".player-box"
        );


    if (window.innerWidth < 760) {

        player.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

    }

}


/* =========================================================
   HLS.JS
========================================================= */

function playStream(url) {

    removePlayerError();


    /*
       Si existe una instancia
       anterior de HLS, destruirla.
    */

    if (hls) {

        hls.destroy();

        hls = null;

    }


    /*
       Safari / navegadores con HLS nativo
    */

    if (
        videoPlayer.canPlayType(
            "application/vnd.apple.mpegurl"
        )
    ) {

        videoPlayer.src =
            url;


        videoPlayer.play()
            .catch(() => {});


        return;

    }


    /*
       HLS.js
    */

    if (
        window.Hls &&
        Hls.isSupported()
    ) {

        hls =
            new Hls({

                enableWorker: true,

                lowLatencyMode: true,

                backBufferLength: 90

            });


        hls.loadSource(
            url
        );


        hls.attachMedia(
            videoPlayer
        );


        hls.on(
            Hls.Events.MANIFEST_PARSED,
            function() {

                console.log(
                    "NETVISION: HLS cargado correctamente."
                );


                videoPlayer
                    .play()
                    .catch(
                        error => {

                            console.log(
                                "Autoplay bloqueado:",
                                error
                            );

                        }
                    );

            }
        );


        hls.on(
            Hls.Events.ERROR,
            function(
                event,
                data
            ) {

                console.error(
                    "HLS error:",
                    data
                );


                if (
                    data.fatal
                ) {

                    handleHLSError(
                        data
                    );

                }

            }
        );


        return;

    }


    showPlayerError(
        "Este navegador no soporta reproducción HLS."
    );

}


/* =========================================================
   MANEJO DE ERRORES HLS
========================================================= */

function handleHLSError(
    data
) {

    let message =
        "No se pudo reproducir este canal.";


    if (
        data.type ===
        Hls.ErrorTypes.NETWORK_ERROR
    ) {

        message =
            "Error de conexión con el canal.";

    }


    if (
        data.type ===
        Hls.ErrorTypes.MEDIA_ERROR
    ) {

        message =
            "El formato del stream no pudo reproducirse.";

    }


    showPlayerError(
        message
    );

}


/* =========================================================
   ERROR DEL REPRODUCTOR
========================================================= */

function showPlayerError(
    message
) {

    removePlayerError();


    const error =
        document.createElement(
            "div"
        );


    error.className =
        "player-error";


    error.textContent =
        message;


    document
        .querySelector(
            ".player-box"
        )
        .appendChild(
            error
        );

}


function removePlayerError() {

    const error =
        document.querySelector(
            ".player-error"
        );


    if (error) {

        error.remove();

    }

}


/* =========================================================
   BUSCADOR DE CANALES
========================================================= */

if (channelSearch) {

    channelSearch.addEventListener(
        "input",
        function() {

            const search =
                this.value
                    .toLowerCase()
                    .trim();


            const results =
                channels.filter(
                    channel => {

                        const name =
                            channel.name
                                .toLowerCase();

                        const category =
                            channel.category
                                .toLowerCase();


                        return (
                            name.includes(
                                search
                            ) ||
                            category.includes(
                                search
                            )
                        );

                    }
                );


            renderTV(
                results
            );

        }
    );

}


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

                const input =
                    document.getElementById(
                        "globalSearch"
                    );


                if (input) {

                    input.focus();

                }

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


/* =========================================================
   CERRAR MODALES
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
   INICIAR NETVISION
========================================================= */

async function initializeNETVISION() {

    console.log(
        "================================"
    );

    console.log(
        "NETVISION iniciado"
    );

    console.log(
        "Cargando canales..."
    );

    console.log(
        "================================"
    );


    await loadM3U();

}


initializeNETVISION();
