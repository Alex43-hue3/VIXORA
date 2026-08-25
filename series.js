/* =========================================================
   NETVISION
   SERIES ANIMADAS
   VERSIÓN AISLADA DE TV
========================================================= */

"use strict";


/* =========================================================
   CONFIGURACIÓN
========================================================= */

const SERIES_M3U =
    "dibujos-animados.m3u";


/* =========================================================
   VARIABLES
========================================================= */

let seriesItems = [];

let seriesGroups = {};

let currentSeries = null;

let seriesPlayer = null;


/*
 * IMPORTANTE:
 *
 * Este archivo NO hace:
 *
 * document.addEventListener("DOMContentLoaded"...)
 *
 * porque no queremos que interfiera con TV.
 *
 * Las series solamente se cargan cuando:
 *
 * loadAnimatedSeries()
 *
 * sea llamada desde tu menú.
 */


/* =========================================================
   CARGAR SERIES
========================================================= */

async function loadAnimatedSeries() {

    console.log(
        "NETVISION - Cargando Series..."
    );


    try {

        const response =
            await fetch(
                SERIES_M3U,
                {
                    cache: "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                "No se pudo cargar dibujos-animados.m3u. HTTP " +
                response.status
            );

        }


        const text =
            await response.text();


        if (
            !text ||
            text.trim().length === 0
        ) {

            throw new Error(
                "La lista M3U está vacía."
            );

        }


        console.log(
            "NETVISION - M3U cargado correctamente"
        );


        seriesItems =
            parseSeriesM3U(
                text
            );


        console.log(
            "NETVISION - Episodios:",
            seriesItems.length
        );


        organizeSeries();


        renderSeriesPage();


    } catch (error) {

        console.error(
            "NETVISION - Error Series:",
            error
        );


        renderSeriesError(
            error.message
        );

    }

}


/* =========================================================
   PARSEAR M3U
========================================================= */

function parseSeriesM3U(
    text
) {

    const lines =
        text
            .split(/\r?\n/)
            .map(
                line =>
                    line.trim()
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


        /*
         * Obtener título
         */

        let title =
            "";


        const comma =
            line.indexOf(
                ","
            );


        if (
            comma !== -1
        ) {

            title =
                line
                    .substring(
                        comma + 1
                    )
                    .trim();

        }


        /*
         * Obtener URL
         */

        let url =
            "";


        for (
            let j = i + 1;
            j < lines.length;
            j++
        ) {

            if (
                !lines[j]
            ) {

                continue;

            }


            if (
                lines[j].startsWith(
                    "#"
                )
            ) {

                continue;

            }


            url =
                lines[j];

            break;

        }


        if (!url) {

            continue;

        }


        /*
         * Atributos
         */

        const logo =
            getSeriesAttribute(
                line,
                "tvg-logo"
            );


        const group =
            getSeriesAttribute(
                line,
                "group-title"
            ) ||
            "Series animadas";


        const tvgName =
            getSeriesAttribute(
                line,
                "tvg-name"
            );


        items.push({

            title:
                title ||
                tvgName ||
                "Episodio",

            logo:
                logo,

            group:
                group,

            url:
                url

        });

    }


    return items;

}


/* =========================================================
   OBTENER ATRIBUTO M3U
========================================================= */

function getSeriesAttribute(
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


    if (
        match &&
        match[1]
    ) {

        return match[1];

    }


    return "";

}


/* =========================================================
   ORGANIZAR
========================================================= */

function organizeSeries() {

    seriesGroups = {};


    seriesItems.forEach(
        episode => {

            const group =
                episode.group ||
                "Series animadas";


            if (
                !seriesGroups[group]
            ) {

                seriesGroups[group] = [];

            }


            seriesGroups[group].push(
                episode
            );

        }
    );


    console.log(
        "NETVISION - Categorías Series:",
        Object.keys(
            seriesGroups
        )
    );

}


/* =========================================================
   RENDER PRINCIPAL
========================================================= */

function renderSeriesPage() {

    const container =
        document.getElementById(
            "animatedSeries"
        );


    /*
     * MUY IMPORTANTE:
     *
     * Si el contenedor no existe,
     * NO creamos nada en body.
     *
     * Esto evita modificar TV.
     */

    if (!container) {

        console.warn(
            "NETVISION - No existe #animatedSeries"
        );

        return;

    }


    const groups =
        Object.keys(
            seriesGroups
        );


    if (
        groups.length === 0
    ) {

        renderSeriesError(
            "No se encontraron series en la lista M3U."
        );

        return;

    }


    container.innerHTML = `

        <div
            class="netvision-series-header"
        >

            <div>

                <span
                    class="netvision-series-kicker"
                >
                    NETVISION
                </span>


                <h2>
                    Series animadas
                </h2>


                <p>
                    Series y episodios disponibles
                </p>

            </div>

        </div>


        <div
            class="netvision-series-categories"
            id="seriesCategories"
        >

            ${groups.map(
                (
                    group,
                    index
                ) => `

                    <button
                        type="button"
                        class="
                            netvision-series-category
                            ${
                                index === 0
                                    ? "active"
                                    : ""
                            }
                        "
                        data-series-group="${escapeSeriesAttr(
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
            class="netvision-series-content"
        >

        </div>

    `;


    /*
     * Eventos categorías
     */

    const buttons =
        container.querySelectorAll(
            ".netvision-series-category"
        );


    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    buttons.forEach(
                        item => {

                            item.classList.remove(
                                "active"
                            );

                        }
                    );


                    button.classList.add(
                        "active"
                    );


                    renderSeriesGroup(
                        button.dataset
                            .seriesGroup
                    );

                }
            );

        }
    );


    renderSeriesGroup(
        groups[0]
    );


    injectSeriesStyles();

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

        <div
            class="netvision-series-group-header"
        >

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
            class="netvision-series-grid"
        >

            ${episodes.map(
                (
                    episode,
                    index
                ) => `

                    <article
                        class="netvision-series-card"
                        data-series-index="${index}"
                    >

                        <div
                            class="netvision-series-poster"
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
                                                netvision-series-empty
                                            "
                                        >

                                            📺

                                        </div>

                                    `
                            }


                            <div
                                class="
                                    netvision-series-play
                                "
                            >

                                ▶

                            </div>

                        </div>


                        <div
                            class="netvision-series-info"
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

                `
            ).join("")}

        </div>

    `;


    /*
     * Eventos episodios
     */

    container
        .querySelectorAll(
            ".netvision-series-card"
        )
        .forEach(
            card => {

                card.addEventListener(
                    "click",
                    () => {

                        const index =
                            Number(
                                card.dataset
                                    .seriesIndex
                            );


                        const episode =
                            episodes[index];


                        openSeriesEpisode(
                            episode
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


    if (!episode.url) {

        console.warn(
            "NETVISION - Episodio sin URL"
        );

        return;

    }


    currentSeries =
        episode;


    console.log(
        "NETVISION - Reproduciendo:",
        episode.title
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

    /*
     * El reproductor SOLO se crea cuando
     * el usuario selecciona un episodio.
     */

    let player =
        document.getElementById(
            "netvisionSeriesPlayer"
        );


    if (player) {

        return player;

    }


    player =
        document.createElement(
            "div"
        );


    player.id =
        "netvisionSeriesPlayer";


    player.className =
        "netvision-series-player";


    player.innerHTML = `

        <div
            class="netvision-series-player-header"
        >

            <div>

                <span>
                    NETVISION
                </span>


                <strong
                    id="netvisionSeriesPlayerTitle"
                >
                    Episodio
                </strong>

            </div>


            <button
                type="button"
                id="netvisionSeriesPlayerClose"
                aria-label="Cerrar"
            >

                ×

            </button>

        </div>


        <div
            class="netvision-series-video-container"
        >

            <video
                id="netvisionSeriesVideo"
                controls
                playsinline
                preload="metadata"
            ></video>

        </div>

    `;


    document.body.appendChild(
        player
    );


    injectSeriesPlayerStyles();


    const close =
        document.getElementById(
            "netvisionSeriesPlayerClose"
        );


    if (close) {

        close.addEventListener(
            "click",
            closeSeriesPlayer
        );

    }


    return player;

}


/* =========================================================
   REPRODUCIR MP4
========================================================= */

function openSeriesPlayer(
    url,
    title
) {

    const player =
        createSeriesPlayer();


    const video =
        document.getElementById(
            "netvisionSeriesVideo"
        );


    const titleElement =
        document.getElementById(
            "netvisionSeriesPlayerTitle"
        );


    if (!video) {

        return;

    }


    if (titleElement) {

        titleElement.textContent =
            title ||
            "Episodio";

    }


    /*
     * Detener reproducción anterior
     */

    video.pause();


    video.removeAttribute(
        "src"
    );


    video.load();


    /*
     * Nueva URL
     */

    video.src =
        url;


    player.classList.add(
        "active"
    );


    /*
     * Intentar reproducir
     */

    video.addEventListener(
        "loadedmetadata",
        () => {

            video
                .play()
                .catch(
                    error => {

                        console.warn(
                            "NETVISION - Autoplay bloqueado:",
                            error
                        );

                    }
                );

        },
        {
            once: true
        }
    );


    video.addEventListener(
        "error",
        () => {

            console.error(
                "NETVISION - Error reproduciendo:",
                url
            );

        },
        {
            once: true
        }
    );

}


/* =========================================================
   CERRAR REPRODUCTOR
========================================================= */

function closeSeriesPlayer() {

    const video =
        document.getElementById(
            "netvisionSeriesVideo"
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
            "netvisionSeriesPlayer"
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

function renderSeriesError(
    message
) {

    const container =
        document.getElementById(
            "animatedSeries"
        );


    if (!container) {

        return;

    }


    container.innerHTML = `

        <div
            class="netvision-series-error"
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
                    "No se pudo leer la lista."
                )}
            </p>

        </div>

    `;

}


/* =========================================================
   ESTILOS DE SERIES
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

            width: 100%;

            box-sizing: border-box;

        }


        .netvision-series-header {

            margin-bottom: 20px;

        }


        .netvision-series-kicker {

            font-size: 11px;

            letter-spacing: 2px;

            opacity: .55;

        }


        .netvision-series-header h2 {

            margin: 5px 0;

        }


        .netvision-series-header p {

            margin: 0;

            opacity: .6;

        }


        .netvision-series-categories {

            display: flex;

            gap: 10px;

            overflow-x: auto;

            padding-bottom: 12px;

            scrollbar-width: thin;

        }


        .netvision-series-category {

            flex: 0 0 auto;

            padding: 10px 15px;

            border: 1px solid
                rgba(
                    255,
                    255,
                    255,
                    .12
                );

            border-radius: 10px;

            background:
                rgba(
                    255,
                    255,
                    255,
                    .05
                );

            color: inherit;

            cursor: pointer;

        }


        .netvision-series-category.active {

            background:
                rgba(
                    255,
                    255,
                    255,
                    .15
                );

        }


        .netvision-series-group-header {

            display: flex;

            align-items: center;

            justify-content: space-between;

            margin: 20px 0 15px;

        }


        .netvision-series-group-header h3 {

            margin: 0;

        }


        .netvision-series-group-header span {

            opacity: .55;

            font-size: 13px;

        }


        .netvision-series-grid {

            display: grid;

            grid-template-columns:
                repeat(
                    auto-fill,
                    minmax(
                        160px,
                        1fr
                    )
                );

            gap: 18px;

        }


        .netvision-series-card {

            cursor: pointer;

            min-width: 0;

        }


        .netvision-series-poster {

            position: relative;

            aspect-ratio: 2 / 3;

            overflow: hidden;

            border-radius: 12px;

            background:
                rgba(
                    255,
                    255,
                    255,
                    .05
                );

        }


        .netvision-series-poster img {

            width: 100%;

            height: 100%;

            object-fit: cover;

            display: block;

        }


        .netvision-series-empty {

            width: 100%;

            height: 100%;

            display: flex;

            align-items: center;

            justify-content: center;

            font-size: 40px;

        }


        .netvision-series-play {

            position: absolute;

            inset: 0;

            display: flex;

            align-items: center;

            justify-content: center;

            background:
                rgba(
                    0,
                    0,
                    0,
                    .35
                );

            opacity: 0;

            transition:
                opacity .2s;

            font-size: 40px;

        }


        .netvision-series-card:hover
        .netvision-series-play {

            opacity: 1;

        }


        .netvision-series-info {

            padding: 8px 2px;

        }


        .netvision-series-info h4 {

            margin: 0 0 5px;

            font-size: 14px;

            line-height: 1.3;

        }


        .netvision-series-info span {

            font-size: 12px;

            opacity: .55;

        }


        .netvision-series-error {

            text-align: center;

            padding: 50px 20px;

        }

    `;


    document.head.appendChild(
        style
    );

}


/* =========================================================
   ESTILOS DEL REPRODUCTOR
========================================================= */

function injectSeriesPlayerStyles() {

    if (
        document.getElementById(
            "netvisionSeriesPlayerStyles"
        )
    ) {

        return;

    }


    const style =
        document.createElement(
            "style"
        );


    style.id =
        "netvisionSeriesPlayerStyles";


    style.textContent = `

        .netvision-series-player {

            position: fixed;

            inset: 0;

            z-index: 999999;

            display: none;

            flex-direction: column;

            background: #000;

        }


        .netvision-series-player.active {

            display: flex;

        }


        .netvision-series-player-header {

            min-height: 60px;

            display: flex;

            align-items: center;

            justify-content: space-between;

            padding: 10px 18px;

            box-sizing: border-box;

            background:
                rgba(
                    10,
                    10,
                    10,
                    .96
                );

            color: #fff;

        }


        .netvision-series-player-header div {

            display: flex;

            flex-direction: column;

            gap: 3px;

            min-width: 0;

        }


        .netvision-series-player-header span {

            font-size: 10px;

            letter-spacing: 2px;

            opacity: .55;

        }


        .netvision-series-player-header strong {

            font-size: 15px;

            white-space: nowrap;

            overflow: hidden;

            text-overflow: ellipsis;

            max-width: 75vw;

        }


        .netvision-series-player-header button {

            width: 42px;

            height: 42px;

            border: 0;

            border-radius: 50%;

            background:
                rgba(
                    255,
                    255,
                    255,
                    .1
                );

            color: #fff;

            font-size: 28px;

            cursor: pointer;

            flex-shrink: 0;

        }


        .netvision-series-video-container {

            flex: 1;

            min-height: 0;

            display: flex;

            align-items: center;

            justify-content: center;

            background: #000;

        }


        .netvision-series-video-container video {

            width: 100%;

            height: 100%;

            object-fit: contain;

        }


        @media (
            max-width: 700px
        ) {

            .netvision-series-grid {

                grid-template-columns:
                    repeat(
                        2,
                        minmax(
                            0,
                            1fr
                        )
                    );

                gap: 12px;

            }


            .netvision-series-player-header {

                min-height: 54px;

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
