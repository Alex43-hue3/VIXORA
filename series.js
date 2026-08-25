/* =========================================================
   NETVISION - SERIES ANIMADAS
========================================================= */

const SERIES_M3U =
    "dibujos-animados.m3u";

let seriesItems = [];
let seriesGroups = {};
let currentSeries = null;
let seriesVideo = null;


/* =========================================================
   INICIAR
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        console.log(
            "NETVISION - series.js iniciado"
        );

        loadAnimatedSeries();

    }
);


/* =========================================================
   CARGAR M3U
========================================================= */

async function loadAnimatedSeries() {

    try {

        console.log(
            "Cargando:",
            SERIES_M3U
        );

        const response =
            await fetch(
                SERIES_M3U,
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

        console.log(
            "M3U cargado correctamente"
        );

        seriesItems =
            parseM3U(text);

        console.log(
            "Episodios encontrados:",
            seriesItems.length
        );

        organizeSeries();

        renderSeries();

    } catch (error) {

        console.error(
            "NETVISION - ERROR M3U:",
            error
        );

        showSeriesError(
            error.message
        );

    }
}


/* =========================================================
   PARSEAR M3U
========================================================= */

function parseM3U(text) {

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

    const items = [];

    for (
        let i = 0;
        i < lines.length;
        i++
    ) {

        const line =
            lines[i];

        if (
            !line.startsWith(
                "#EXTINF"
            )
        ) {

            continue;
        }


        const info =
            line.substring(
                line.indexOf(",") + 1
            );


        const url =
            lines[i + 1] &&
            !lines[i + 1].startsWith("#")
                ? lines[i + 1]
                : "";


        if (!url) {

            continue;
        }


        const title =
            info.trim();


        const logo =
            getM3UAttribute(
                line,
                "tvg-logo"
            );


        const group =
            getM3UAttribute(
                line,
                "group-title"
            ) ||
            "Series animadas";


        const tvgName =
            getM3UAttribute(
                line,
                "tvg-name"
            );


        items.push({

            title:
                title ||
                tvgName ||
                "Episodio",

            logo:

                logo ||
                "",

            group:

                group,

            url:

                url,

            raw:

                line

        });

    }

    return items;
}


/* =========================================================
   ATRIBUTOS M3U
========================================================= */

function getM3UAttribute(
    line,
    attribute
) {

    const regex =
        new RegExp(
            attribute +
            '="([^"]*)"',
            "i"
        );

    const match =
        line.match(
            regex
        );

    return match
        ? match[1]
        : "";
}


/* =========================================================
   ORGANIZAR SERIES
========================================================= */

function organizeSeries() {

    seriesGroups = {};


    seriesItems.forEach(
        item => {

            const group =
                item.group ||
                "Series animadas";


            if (
                !seriesGroups[group]
            ) {

                seriesGroups[group] = [];

            }


            seriesGroups[group].push(
                item
            );

        }
    );


    console.log(
        "Series organizadas:",
        seriesGroups
    );
}


/* =========================================================
   CONTENEDOR
========================================================= */

function getSeriesContainer() {

    let container =
        document.getElementById(
            "animatedSeries"
        );


    if (!container) {

        container =
            document.createElement(
                "section"
            );

        container.id =
            "animatedSeries";

        container.className =
            "netvision-series-section";


        const moviesGrid =
            document.getElementById(
                "moviesGrid"
            );


        if (moviesGrid) {

            moviesGrid.parentNode.insertBefore(
                container,
                moviesGrid.nextSibling
            );

        } else {

            document.body.appendChild(
                container
            );

        }

    }

    return container;
}


/* =========================================================
   MOSTRAR SERIES
========================================================= */

function renderSeries() {

    const container =
        getSeriesContainer();


    const groups =
        Object.keys(
            seriesGroups
        );


    if (
        groups.length === 0
    ) {

        showSeriesError(
            "No se encontraron series."
        );

        return;
    }


    container.innerHTML = `

        <div class="series-header">

            <div>

                <span class="series-kicker">
                    NETVISION
                </span>

                <h2>
                    Series animadas
                </h2>

                <p>
                    Disfruta tus series y episodios.
                </p>

            </div>

        </div>


        <div
            class="series-categories"
            id="seriesCategories"
        >

            ${groups.map(
                (group, index) => `

                    <button
                        type="button"
                        class="
                            series-category-btn
                            ${
                                index === 0
                                    ? "active"
                                    : ""
                            }
                        "
                        data-group="${escapeSeriesAttr(
                            group
                        )}"
                    >

                        ${escapeSeriesHTML(
                            group
                        )}

                    </button>

                `
            ).join("")}

        </div>


        <div
            id="seriesContent"
            class="series-content"
        >
        </div>

    `;


    const buttons =
        container.querySelectorAll(
            ".series-category-btn"
        );


    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    buttons.forEach(
                        b =>
                            b.classList.remove(
                                "active"
                            )
                    );


                    button.classList.add(
                        "active"
                    );


                    renderSeriesGroup(
                        button.dataset.group
                    );

                }
            );

        }
    );


    renderSeriesGroup(
        groups[0]
    );
}


/* =========================================================
   MOSTRAR GRUPO
========================================================= */

function renderSeriesGroup(
    group
) {

    const container =
        document.getElementById(
            "seriesContent"
        );


    if (!container) {

        return;
    }


    const episodes =
        seriesGroups[group] ||
        [];


    container.innerHTML = `

        <div class="series-group-title">

            <h3>
                ${escapeSeriesHTML(
                    group
                )}
            </h3>

            <span>
                ${episodes.length}
                episodios
            </span>

        </div>


        <div
            class="series-grid"
        >

            ${episodes.map(
                (episode, index) => {

                    return `

                        <article
                            class="series-card"
                            data-index="${index}"
                        >

                            <div
                                class="series-card-poster"
                            >

                                ${
                                    episode.logo
                                        ? `
                                            <img
                                                src="${escapeSeriesAttr(
                                                    episode.logo
                                                )}"
                                                alt="${escapeSeriesAttr(
                                                    episode.title
                                                )}"
                                                loading="lazy"
                                            >
                                        `
                                        : `
                                            <div
                                                class="
                                                    series-poster-empty
                                                "
                                            >
                                                📺
                                            </div>
                                        `
                                }


                                <div
                                    class="
                                        series-play-overlay
                                    "
                                >

                                    ▶

                                </div>

                            </div>


                            <div
                                class="series-card-info"
                            >

                                <h4>
                                    ${escapeSeriesHTML(
                                        episode.title
                                    )}
                                </h4>

                                <span>
                                    ${escapeSeriesHTML(
                                        group
                                    )}
                                </span>

                            </div>

                        </article>

                    `;

                }
            ).join("")}

        </div>

    `;


    container
        .querySelectorAll(
            ".series-card"
        )
        .forEach(
            card => {

                card.addEventListener(
                    "click",
                    () => {

                        const index =
                            Number(
                                card.dataset.index
                            );

                        openSeriesEpisode(
                            episodes[index]
                        );

                    }
                );

            }
        );
}


/* =========================================================
   ABRIR EPISODIO
========================================================= */

function openSeriesEpisode(
    episode
) {

    if (!episode) {

        return;
    }


    currentSeries =
        episode;


    console.log(
        "NETVISION - EPISODIO:",
        episode
    );


    openSeriesPlayer(
        episode.url,
        episode.title
    );
}


/* =========================================================
   CREAR REPRODUCTOR
========================================================= */

function createSeriesPlayer() {

    let player =
        document.getElementById(
            "seriesPlayer"
        );


    if (player) {

        return player;
    }


    player =
        document.createElement(
            "div"
        );


    player.id =
        "seriesPlayer";


    player.className =
        "netvision-series-player";


    player.innerHTML = `

        <div
            class="series-player-top"
        >

            <div>

                <span>
                    NETVISION
                </span>

                <strong
                    id="seriesPlayerTitle"
                >
                    Episodio
                </strong>

            </div>


            <button
                type="button"
                id="seriesPlayerClose"
                aria-label="Cerrar reproductor"
            >

                ×

            </button>

        </div>


        <div
            class="series-player-video"
        >

            <video
                id="seriesVideo"
                controls
                playsinline
                preload="metadata"
            ></video>

        </div>

    `;


    document.body.appendChild(
        player
    );


    const close =
        document.getElementById(
            "seriesPlayerClose"
        );


    if (close) {

        close.addEventListener(
            "click",
            closeSeriesPlayer
        );

    }


    injectSeriesStyles();


    return player;
}


/* =========================================================
   REPRODUCIR
========================================================= */

function openSeriesPlayer(
    url,
    title
) {

    if (!url) {

        return;
    }


    const player =
        createSeriesPlayer();


    const video =
        document.getElementById(
            "seriesVideo"
        );


    const playerTitle =
        document.getElementById(
            "seriesPlayerTitle"
        );


    if (!video) {

        return;
    }


    if (playerTitle) {

        playerTitle.textContent =
            title ||
            "Episodio";
    }


    video.pause();


    video.removeAttribute(
        "src"
    );


    video.load();


    video.src =
        url;


    player.classList.add(
        "active"
    );


    video.addEventListener(
        "loadedmetadata",
        () => {

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

}


/* =========================================================
   CERRAR
========================================================= */

function closeSeriesPlayer() {

    const video =
        document.getElementById(
            "seriesVideo"
        );


    if (video) {

        video.pause();

        video.removeAttribute(
            "src"
        );

        video.load();

    }


    const player =
        document.getElementById(
            "seriesPlayer"
        );


    if (player) {

        player.classList.remove(
            "active"
        );

    }


    currentSeries =
        null;
}


/* =========================================================
   ERROR
========================================================= */

function showSeriesError(
    message
) {

    const container =
        getSeriesContainer();


    container.innerHTML = `

        <div
            class="series-error"
        >

            <div>
                ⚠️
            </div>

            <h3>
                No se pudieron cargar
                las series
            </h3>

            <p>
                ${escapeSeriesHTML(
                    message ||
                    "Comprueba que exista data/dibujos-animados.m3u"
                )}
            </p>

        </div>

    `;
}


/* =========================================================
   ESTILOS
========================================================= */

function injectSeriesStyles() {

    if (
        document.getElementById(
            "netvisionSeriesStyles"
        )
    ) {

        return;
    }


    const style =
        document.createElement(
            "style"
        );


    style.id =
        "netvisionSeriesStyles";


    style.textContent = `

        .netvision-series-section {

            width:
                100%;

            margin:
                35px auto;

            padding:
                0 20px;

            box-sizing:
                border-box;

        }


        .series-header {

            margin-bottom:
                20px;

        }


        .series-kicker {

            font-size:
                12px;

            opacity:
                .65;

            letter-spacing:
                2px;

        }


        .series-header h2 {

            margin:
                5px 0;

        }


        .series-header p {

            margin:
                0;

            opacity:
                .65;

        }


        .series-categories {

            display:
                flex;

            gap:
                10px;

            overflow-x:
                auto;

            padding-bottom:
                10px;

            scrollbar-width:
                thin;

        }


        .series-category-btn {

            flex:
                0 0 auto;

            border:
                1px solid
                rgba(
                    255,
                    255,
                    255,
                    .15
                );

            background:
                rgba(
                    255,
                    255,
                    255,
                    .06
                );

            color:
                inherit;

            border-radius:
                10px;

            padding:
                10px 16px;

            cursor:
                pointer;

        }


        .series-category-btn.active {

            background:
                rgba(
                    255,
                    255,
                    255,
                    .15
                );

        }


        .series-group-title {

            display:
                flex;

            align-items:
                center;

            justify-content:
                space-between;

            gap:
                20px;

            margin:
                20px 0 15px;

        }


        .series-group-title h3 {

            margin:
                0;

        }


        .series-group-title span {

            opacity:
                .6;

            font-size:
                13px;

        }


        .series-grid {

            display:
                grid;

            grid-template-columns:
                repeat(
                    auto-fill,
                    minmax(
                        160px,
                        1fr
                    )
                );

            gap:
                18px;

        }


        .series-card {

            cursor:
                pointer;

            min-width:
                0;

        }


        .series-card-poster {

            position:
                relative;

            aspect-ratio:
                2 / 3;

            background:
                rgba(
                    255,
                    255,
                    255,
                    .05
                );

            border-radius:
                12px;

            overflow:
                hidden;

        }


        .series-card-poster img {

            width:
                100%;

            height:
                100%;

            object-fit:
                cover;

            display:
                block;

        }


        .series-poster-empty {

            width:
                100%;

            height:
                100%;

            display:
                flex;

            align-items:
                center;

            justify-content:
                center;

            font-size:
                40px;

        }


        .series-play-overlay {

            position:
                absolute;

            inset:
                0;

            display:
                flex;

            align-items:
                center;

            justify-content:
                center;

            background:
                rgba(
                    0,
                    0,
                    0,
                    .35
                );

            opacity:
                0;

            transition:
                opacity .2s;

            font-size:
                42px;

        }


        .series-card:hover
        .series-play-overlay {

            opacity:
                1;

        }


        .series-card-info {

            padding:
                8px 2px;

        }


        .series-card-info h4 {

            margin:
                0 0 5px;

            font-size:
                14px;

            line-height:
                1.3;

        }


        .series-card-info span {

            font-size:
                12px;

            opacity:
                .55;

        }


        .series-error {

            text-align:
                center;

            padding:
                50px 20px;

        }


        /* =================================================
           REPRODUCTOR
        ================================================= */

        .netvision-series-player {

            position:
                fixed;

            inset:
                0;

            z-index:
                100000;

            display:
                none;

            flex-direction:
                column;

            background:
                #000;

        }


        .netvision-series-player.active {

            display:
                flex;

        }


        .series-player-top {

            min-height:
                60px;

            display:
                flex;

            align-items:
                center;

            justify-content:
                space-between;

            padding:
                10px 18px;

            box-sizing:
                border-box;

            background:
                rgba(
                    10,
                    10,
                    10,
                    .96
                );

            color:
                #fff;

        }


        .series-player-top div {

            display:
                flex;

            flex-direction:
                column;

            gap:
                3px;

        }


        .series-player-top span {

            font-size:
                10px;

            opacity:
                .55;

            letter-spacing:
                2px;

        }


        .series-player-top strong {

            font-size:
                15px;

        }


        .series-player-top button {

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
                    .1
                );

            color:
                #fff;

            font-size:
                28px;

            cursor:
                pointer;

        }


        .series-player-video {

            flex:
                1;

            min-height:
                0;

            display:
                flex;

            align-items:
                center;

            justify-content:
                center;

            background:
                #000;

        }


        .series-player-video video {

            width:
                100%;

            height:
                100%;

            object-fit:
                contain;

        }


        @media (
            max-width: 700px
        ) {

            .netvision-series-section {

                padding:
                    0 12px;

            }


            .series-grid {

                grid-template-columns:
                    repeat(
                        2,
                        minmax(
                            0,
                            1fr
                        )
                    );

                gap:
                    12px;

            }


            .series-card-info h4 {

                font-size:
                    13px;

            }


            .series-player-top {

                min-height:
                    54px;

                padding:
                    8px 12px;

            }

        }

    `;


    document.head.appendChild(
        style
    );
}


/* =========================================================
   UTILIDADES
========================================================= */

function escapeSeriesHTML(
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


function escapeSeriesAttr(
    value
) {

    return escapeSeriesHTML(
        value
    );

}


/* =========================================================
   EXPORTAR
========================================================= */

window.loadAnimatedSeries =
    loadAnimatedSeries;

window.openSeriesEpisode =
    openSeriesEpisode;

window.closeSeriesPlayer =
    closeSeriesPlayer;
