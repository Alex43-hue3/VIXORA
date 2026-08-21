/* =========================================================
   NETVISION
   TV EN VIVO - M3U / M3U8 + HLS.JS
========================================================= */


/* =========================================================
   CONFIGURACIÓN
========================================================= */

const M3U_FILE = "./canales.m3u";


/* =========================================================
   VARIABLES GLOBALES
========================================================= */

let channels = [];

let currentChannel = null;

let selectedCategory = null;

let hls = null;


/* =========================================================
   ELEMENTOS DEL DOM
========================================================= */

const videoPlayer =
    document.getElementById("videoPlayer");

const playerPlaceholder =
    document.getElementById("playerPlaceholder");

const selectedChannelName =
    document.getElementById("selectedChannelName");

const selectedChannelCategory =
    document.getElementById(
        "selectedChannelCategory"
    );

const currentChannelLogo =
    document.getElementById(
        "currentChannelLogo"
    );

const tvCategories =
    document.getElementById(
        "tvCategories"
    );

const selectedCategoryTitle =
    document.getElementById(
        "selectedCategoryTitle"
    );

const selectedCategoryCount =
    document.getElementById(
        "selectedCategoryCount"
    );

const selectedCategoryChannels =
    document.getElementById(
        "selectedCategoryChannels"
    );


/* =========================================================
   INICIO
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        console.log(
            "NETVISION iniciado"
        );

        loadM3U();

    }
);


/* =========================================================
   CARGAR LISTA M3U
========================================================= */

async function loadM3U() {

    try {

        console.log(
            "Cargando:",
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


        const m3uText =
            await response.text();


        channels =
            parseM3U(
                m3uText
            );


        console.log(
            "Canales encontrados:",
            channels.length
        );


        if (
            channels.length === 0
        ) {

            showError(
                "La lista M3U está vacía."
            );

            return;

        }


        renderTV(
            channels
        );


    } catch (error) {

        console.error(
            "Error cargando M3U:",
            error
        );


        showError(
            "No se pudo cargar la lista. " +
            "Verifica que exista canales.m3u."
        );

    }

}


/* =========================================================
   PARSEAR M3U
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
            .filter(
                line =>
                    line.length > 0
            );


    const result = [];


    for (
        let i = 0;
        i < lines.length;
        i++
    ) {

        const line =
            lines[i];


        /*
           Buscar EXTINF
        */

        if (
            !line.startsWith(
                "#EXTINF:"
            )
        ) {

            continue;

        }


        /*
           Información del canal
        */

        const info =
            line.substring(
                8
            );


        /*
           Nombre del canal
        */

        const commaIndex =
            info.indexOf(",");


        let attributes = "";

        let channelName = "";


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
                ).trim();

        } else {

            attributes =
                info;

        }


        /*
           URL del canal
        */

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


        /*
           Extraer atributos
        */

        const logo =
            getAttribute(
                attributes,
                "tvg-logo"
            );


        const groupTitle =
            getAttribute(
                attributes,
                "group-title"
            );


        const tvgId =
            getAttribute(
                attributes,
                "tvg-id"
            );


        /*
           Crear canal
        */

        result.push({

            id:
                tvgId ||
                createId(
                    channelName
                ),

            name:
                channelName ||
                "Canal sin nombre",

            url:
                url,

            logo:
                logo || "",

            category:
                groupTitle ||
                "Otros"

        });

    }


    return result;

}


/* =========================================================
   EXTRAER ATRIBUTO M3U
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
   CREAR ID
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
            ""
        );

}


/* =========================================================
   RENDERIZAR TV
========================================================= */

function renderTV(
    filteredChannels = channels
) {

    if (!tvCategories) {

        console.error(
            "No existe #tvCategories"
        );

        return;

    }


    tvCategories.innerHTML = "";


    /*
       Obtener categorías únicas
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


    /*
       Crear botones
    */

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
                () => {

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
        categories.length > 0
    ) {

        let categoryToSelect =
            categories[0];


        if (
            selectedCategory &&
            categories.includes(
                selectedCategory
            )
        ) {

            categoryToSelect =
                selectedCategory;

        }


        selectCategory(
            categoryToSelect
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


    /*
       Activar botón
    */

    const buttons =
        document.querySelectorAll(
            ".tv-category-button"
        );


    buttons.forEach(
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


    /*
       Mostrar canales
    */

    renderSelectedCategory(
        category,
        categoryChannels
    );

}


/* =========================================================
   MOSTRAR CANALES DE CATEGORÍA
========================================================= */

function renderSelectedCategory(
    category,
    categoryChannels
) {

    if (
        !selectedCategoryChannels
    ) {

        return;

    }


    /*
       Título
    */

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


    /*
       Contador
    */

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


    /*
       Limpiar
    */

    selectedCategoryChannels.innerHTML =
        "";


    /*
       Crear tarjetas
    */

    categoryChannels.forEach(
        channel => {

            const card =
                createChannelCard(
                    channel
                );


            selectedCategoryChannels.appendChild(
                card
            );

        }
    );

}


/* =========================================================
   CREAR TARJETA DE CANAL
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


    /*
       Logo
    */

    let logoHTML = "";


    if (
        channel.logo
    ) {

        logoHTML = `

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

        `;

    } else {

        logoHTML = `

            <span class="default-channel-logo">

                TV

            </span>

        `;

    }


    /*
       HTML
    */

    card.innerHTML = `

        <div class="channel-logo">

            ${logoHTML}

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


    /*
       Click
    */

    card.addEventListener(
        "click",
        () => {

            selectChannel(
                channel
            );

        }
    );


    /*
       Teclado
    */

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
        "NETVISION → Canal:",
        channel.name
    );


    /*
       Nombre
    */

    if (
        selectedChannelName
    ) {

        selectedChannelName.textContent =
            cleanChannelName(
                channel.name
            );

    }


    /*
       Categoría
    */

    if (
        selectedChannelCategory
    ) {

        selectedChannelCategory.textContent =
            `${channel.category} · EN VIVO`;

    }


    /*
       Logo
    */

    if (
        currentChannelLogo
    ) {

        if (
            channel.logo
        ) {

            currentChannelLogo.innerHTML = `

                <img
                    src="${escapeAttribute(
                        channel.logo
                    )}"
                    alt="${escapeAttribute(
                        channel.name
                    )}"
                >

            `;

        } else {

            currentChannelLogo.innerHTML = `

                <span>
                    TV
                </span>

            `;

        }

    }


    /*
       Ocultar mensaje inicial
    */

    if (
        playerPlaceholder
    ) {

        playerPlaceholder.classList.add(
            "hidden"
        );

    }


    /*
       Reproducir
    */

    playStream(
        channel.url
    );

}


/* =========================================================
   REPRODUCIR STREAM
========================================================= */

function playStream(
    url
) {

    if (
        !videoPlayer
    ) {

        console.error(
            "No existe #videoPlayer"
        );

        return;

    }


    console.log(
        "Reproduciendo:",
        url
    );


    /*
       Destruir HLS anterior
    */

    if (
        hls
    ) {

        hls.destroy();

        hls =
            null;

    }


    /*
       Limpiar video
    */

    videoPlayer.pause();

    videoPlayer.removeAttribute(
        "src"
    );

    videoPlayer.load();


    /*
       HLS.js disponible
    */

    if (
        typeof Hls !==
        "undefined" &&
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

                console.log(
                    "HLS cargado correctamente"
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
            (
                event,
                data
            ) => {

                console.error(
                    "HLS Error:",
                    data
                );


                if (
                    data.fatal
                ) {

                    switch (
                        data.type
                    ) {

                        case Hls.ErrorTypes.NETWORK_ERROR:

                            console.log(
                                "Intentando recuperar conexión..."
                            );


                            hls.startLoad();

                            break;


                        case Hls.ErrorTypes.MEDIA_ERROR:

                            console.log(
                                "Intentando recuperar reproducción..."
                            );


                            hls.recoverMediaError();

                            break;


                        default:

                            hls.destroy();

                            hls =
                                null;

                            showPlayerError();

                            break;

                    }

                }

            }
        );


        return;

    }


    /*
       HLS nativo
       Safari / algunos dispositivos
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
                                "Autoplay bloqueado:",
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


    /*
       No soportado
    */

    console.error(
        "Este navegador no soporta HLS."
    );


    showPlayerError();

}


/* =========================================================
   ERROR DEL REPRODUCTOR
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
   ERROR GENERAL
========================================================= */

function showError(
    message
) {

    console.error(
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

                ⚠️ ${escapeHTML(
                    message
                )}

            </div>

        `;

    }

}


/* =========================================================
   ICONOS DE CATEGORÍAS
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
    ) {

        return "✝️";

    }


    if (
        name.includes(
            "anime"
        )
    ) {

        return "🍥";

    }


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
    ) {

        return "🎨";

    }


    if (
        name.includes(
            "deporte"
        ) ||
        name.includes(
            "sport"
        )
    ) {

        return "⚽";

    }


    if (
        name.includes(
            "curiosity"
        ) ||
        name.includes(
            "document"
        )
    ) {

        return "🔬";

    }


    if (
        name.includes(
            "noticia"
        ) ||
        name.includes(
            "news"
        )
    ) {

        return "📰";

    }


    if (
        name.includes(
            "musica"
        ) ||
        name.includes(
            "music"
        )
    ) {

        return "🎵";

    }


    if (
        name.includes(
            "pelicula"
        ) ||
        name.includes(
            "movie"
        )
    ) {

        return "🎬";

    }


    return "📺";

}


/* =========================================================
   LIMPIAR NOMBRE DEL CANAL
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
   ESCAPAR HTML
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


/* =========================================================
   ESCAPAR ATRIBUTOS
========================================================= */

function escapeAttribute(
    value
) {

    return escapeHTML(
        value
    );

}


/* =========================================================
   LIMPIEZA AL SALIR
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
