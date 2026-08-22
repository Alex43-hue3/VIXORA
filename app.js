/* =========================================================
   NETVISION - APP.JS
   TV EN VIVO + HLS + BUSCADOR + PERFIL + RESPONSIVE
========================================================= */

"use strict";

const M3U_FILE = "./canales.m3u";

let channels = [];
let currentChannel = null;
let currentCategory = null;
let hls = null;

let videoPlayer;
let playerPlaceholder;

document.addEventListener("DOMContentLoaded", init);

function init() {
    cacheElements();
    setupNavigation();
    setupSearch();
    setupProfile();
    setupModal();
    loadM3U();
}

function cacheElements() {
    videoPlayer = document.getElementById("videoPlayer");
    playerPlaceholder = document.getElementById("playerPlaceholder");
}

function $(id) {
    return document.getElementById(id);
}

/* =========================================================
   NAVEGACIÓN
========================================================= */

function setupNavigation() {
    document.querySelectorAll("[data-page]").forEach(button => {
        button.addEventListener("click", event => {
            event.preventDefault();

            const page = button.dataset.page;
            if (!page) return;

            showPage(page);
        });
    });

    const mobileMenuBtn = $("mobileMenuBtn");
    const mainNav = $("mainNav");

    if (mobileMenuBtn && mainNav) {
        mobileMenuBtn.addEventListener("click", event => {
            event.stopPropagation();
            mainNav.classList.toggle("open");
        });

        document.addEventListener("click", event => {
            if (!mainNav.contains(event.target) &&
                event.target !== mobileMenuBtn) {
                mainNav.classList.remove("open");
            }
        });
    }
}

function showPage(page) {
    document.querySelectorAll(".page").forEach(section => {
        section.classList.toggle(
            "active-page",
            section.id === `page-${page}`
        );
    });

    document.querySelectorAll(".nav-link").forEach(link => {
        link.classList.toggle(
            "active",
            link.dataset.page === page
        );
    });

    const mainNav = $("mainNav");
    if (mainNav) mainNav.classList.remove("open");

    if (page !== "tv") {
        stopTV();
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

/* =========================================================
   BUSCADOR
========================================================= */

function setupSearch() {
    const searchBtn = $("searchBtn");
    const searchOverlay = $("searchOverlay");
    const closeSearch = $("closeSearch");
    const globalSearch = $("globalSearch");

    if (!searchBtn || !searchOverlay) {
        console.warn("NETVISION: no se encontró el botón de búsqueda.");
        return;
    }

    searchBtn.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();

        searchOverlay.classList.add("show");

        if (globalSearch) {
            globalSearch.value = "";
            renderSearchResults("");
            setTimeout(() => globalSearch.focus(), 50);
        }
    });

    if (closeSearch) {
        closeSearch.addEventListener("click", () => {
            searchOverlay.classList.remove("show");
        });
    }

    searchOverlay.addEventListener("click", event => {
        if (event.target === searchOverlay) {
            searchOverlay.classList.remove("show");
        }
    });

    if (globalSearch) {
        globalSearch.addEventListener("input", () => {
            renderSearchResults(globalSearch.value);
        });

        globalSearch.addEventListener("keydown", event => {
            if (event.key === "Escape") {
                searchOverlay.classList.remove("show");
            }

            if (event.key === "Enter") {
                const result = findChannel(globalSearch.value);
                if (result) openChannel(result);
            }
        });
    }
}

function renderSearchResults(value) {
    const container = $("searchResults");
    if (!container) return;

    const term = String(value || "").trim().toLowerCase();

    if (!term) {
        container.innerHTML = `
            <div class="search-empty">
                Escribe el nombre de una película, serie o canal.
            </div>
        `;
        return;
    }

    const channelResults = channels.filter(channel => {
        const name = cleanName(channel.name).toLowerCase();
        const category = String(channel.category || "").toLowerCase();

        return name.includes(term) || category.includes(term);
    });

    if (!channelResults.length) {
        container.innerHTML = `
            <div class="search-empty">
                No encontramos canales para
                "<strong>${escapeHTML(value)}</strong>".
            </div>
        `;
        return;
    }

    container.innerHTML = "";

    channelResults.forEach(channel => {
        const item = document.createElement("button");
        item.type = "button";
        item.className = "search-result-item";

        item.innerHTML = `
            <span class="search-result-logo">
                ${
                    channel.logo
                    ? `<img src="${escapeAttribute(channel.logo)}"
                            alt="${escapeAttribute(channel.name)}"
                            loading="lazy">`
                    : "📺"
                }
            </span>

            <span class="search-result-info">
                <strong>${escapeHTML(cleanName(channel.name))}</strong>
                <small>${escapeHTML(channel.category)} · EN VIVO</small>
            </span>

            <span class="search-result-arrow">›</span>
        `;

        item.addEventListener("click", () => {
            openChannel(channel);
        });

        container.appendChild(item);
    });
}

function findChannel(value) {
    const term = String(value || "").trim().toLowerCase();
    if (!term) return null;

    return channels.find(channel => {
        const name = cleanName(channel.name).toLowerCase();
        const category = String(channel.category || "").toLowerCase();

        return name.includes(term) || category.includes(term);
    }) || null;
}

/* =========================================================
   PERFIL
========================================================= */

function setupProfile() {
    const profileBtn = $("profileBtn");
    const profileMenu = $("profileMenu");

    if (!profileBtn || !profileMenu) {
        console.warn("NETVISION: no se encontró el perfil.");
        return;
    }

    profileBtn.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();

        profileMenu.classList.toggle("show");
    });

    profileMenu.addEventListener("click", event => {
        if (event.target === profileMenu) {
            profileMenu.classList.remove("show");
        }
    });

    const card = profileMenu.querySelector(".profile-card");

    if (card && !card.querySelector(".profile-close-btn")) {
        const close = document.createElement("button");
        close.type = "button";
        close.className = "close-btn profile-close-btn";
        close.setAttribute("aria-label", "Cerrar perfil");
        close.textContent = "×";

        close.addEventListener("click", () => {
            profileMenu.classList.remove("show");
        });

        card.prepend(close);
    }

    document.addEventListener("click", event => {
        if (!profileMenu.contains(event.target) &&
            event.target !== profileBtn) {
            profileMenu.classList.remove("show");
        }
    });
}

/* =========================================================
   MODAL
========================================================= */

function setupModal() {
    const modal = $("contentModal");
    const close = $("closeContent");

    if (!modal) return;

    if (close) {
        close.addEventListener("click", () => {
            modal.classList.remove("show");
        });
    }

    modal.addEventListener("click", event => {
        if (event.target === modal) {
            modal.classList.remove("show");
        }
    });
}

/* =========================================================
   M3U
========================================================= */

async function loadM3U() {
    try {
        const response = await fetch(M3U_FILE, {
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const text = await response.text();
        channels = parseM3U(text);

        console.log(`NETVISION: ${channels.length} canales cargados.`);

        if (!channels.length) {
            showTVMessage("La lista M3U está vacía.");
            return;
        }

        renderCategories();
        renderHomeChannels();

    } catch (error) {
        console.error("NETVISION M3U:", error);
        showTVMessage(
            "No se pudo cargar canales.m3u. Verifica que esté en la misma carpeta que index.html."
        );
    }
}

function parseM3U(text) {
    const lines = text
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean);

    const result = [];

    for (let i = 0; i < lines.length; i++) {
        if (!lines[i].startsWith("#EXTINF:")) continue;

        const info = lines[i].substring(8);
        const comma = info.indexOf(",");

        const attrs = comma >= 0 ? info.substring(0, comma) : info;
        const name = comma >= 0
            ? info.substring(comma + 1).trim()
            : "Canal sin nombre";

        let url = "";

        for (let j = i + 1; j < lines.length; j++) {
            if (!lines[j].startsWith("#")) {
                url = lines[j];
                break;
            }
        }

        if (!url) continue;

        result.push({
            id: getAttr(attrs, "tvg-id") || slug(name),
            name,
            url,
            logo: getAttr(attrs, "tvg-logo"),
            category: getAttr(attrs, "group-title") || "Otros"
        });
    }

    return result;
}

function getAttr(text, attr) {
    const regex = new RegExp(`${attr}="([^"]*)"`, "i");
    const match = text.match(regex);
    return match ? match[1] : "";
}

/* =========================================================
   CATEGORÍAS
========================================================= */

function renderCategories() {
    const container = $("tvCategories");
    if (!container) return;

    const categories = [...new Set(
        channels.map(channel => channel.category || "Otros")
    )];

    container.innerHTML = "";

    categories.forEach(category => {
        const button = document.createElement("button");

        button.type = "button";
        button.className = "tv-category-button";
        button.dataset.category = category;

        button.innerHTML = `
            <span class="category-icon">${categoryIcon(category)}</span>
            <span class="category-name">${escapeHTML(category)}</span>
            <span class="category-arrow">›</span>
        `;

        button.addEventListener("click", () => {
            selectCategory(category);
        });

        container.appendChild(button);
    });

    if (categories.length) {
        selectCategory(currentCategory || categories[0]);
    }
}

function selectCategory(category) {
    currentCategory = category;

    document.querySelectorAll(".tv-category-button").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.category === category
        );
    });

    const list = channels.filter(
        channel => channel.category === category
    );

    renderSelectedChannels(category, list);
}

function renderSelectedChannels(category, list) {
    const title = $("selectedCategoryTitle");
    const count = $("selectedCategoryCount");
    const container = $("selectedCategoryChannels");

    if (!container) return;

    if (title) {
        title.innerHTML = `
            ${categoryIcon(category)}
            CANALES DE:
            <span>${escapeHTML(category)}</span>
        `;
    }

    if (count) {
        count.textContent =
            `${list.length} ${list.length === 1 ? "canal" : "canales"}`;
    }

    container.innerHTML = "";

    list.forEach(channel => {
        container.appendChild(createChannelCard(channel));
    });
}

function createChannelCard(channel) {
    const card = document.createElement("article");

    card.className = "channel-card";
    card.tabIndex = 0;

    card.innerHTML = `
        <div class="channel-logo">
            ${
                channel.logo
                ? `<img src="${escapeAttribute(channel.logo)}"
                        alt="${escapeAttribute(channel.name)}"
                        loading="lazy">`
                : `<span>TV</span>`
            }
        </div>

        <div class="channel-card-info">
            <div class="channel-name">
                ${escapeHTML(cleanName(channel.name))}
            </div>

            <div class="channel-meta">
                ● EN VIVO
            </div>
        </div>
    `;

    card.addEventListener("click", () => {
        openChannel(channel);
    });

    card.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openChannel(channel);
        }
    });

    return card;
}

/* =========================================================
   ABRIR / REPRODUCIR CANAL
========================================================= */

function openChannel(channel) {
    if (!channel) return;

    const searchOverlay = $("searchOverlay");
    if (searchOverlay) searchOverlay.classList.remove("show");

    showPage("tv");

    currentChannel = channel;

    if (channel.category) {
        selectCategory(channel.category);
    }

    const name = $("selectedChannelName");
    const category = $("selectedChannelCategory");
    const logo = $("currentChannelLogo");

    if (name) name.textContent = cleanName(channel.name);
    if (category) category.textContent = `${channel.category} · EN VIVO`;

    if (logo) {
        logo.innerHTML = channel.logo
            ? `<img src="${escapeAttribute(channel.logo)}"
                    alt="${escapeAttribute(channel.name)}">`
            : "TV";
    }

    playStream(channel.url);

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

function playStream(url) {
    if (!videoPlayer) return;

    destroyHLS();

    videoPlayer.pause();
    videoPlayer.removeAttribute("src");
    videoPlayer.load();

    if (window.Hls && Hls.isSupported()) {
        hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90
        });

        hls.loadSource(url);
        hls.attachMedia(videoPlayer);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
            videoPlayer.play().catch(() => {});
            hidePlaceholder();
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
            console.error("HLS:", data);

            if (!data.fatal) return;

            if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                hls.startLoad();
            } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                hls.recoverMediaError();
            } else {
                showPlayerError();
                destroyHLS();
            }
        });

        return;
    }

    if (videoPlayer.canPlayType("application/vnd.apple.mpegurl")) {
        videoPlayer.src = url;

        videoPlayer.addEventListener("loadedmetadata", () => {
            videoPlayer.play().catch(() => {});
            hidePlaceholder();
        }, { once: true });

        return;
    }

    showPlayerError();
}

function stopTV() {
    currentChannel = null;
    destroyHLS();

    if (videoPlayer) {
        videoPlayer.pause();
        videoPlayer.removeAttribute("src");
        videoPlayer.load();
    }

    const name = $("selectedChannelName");
    const category = $("selectedChannelCategory");
    const logo = $("currentChannelLogo");

    if (name) name.textContent = "Ningún canal seleccionado";
    if (category) category.textContent = "Selecciona un canal";
    if (logo) logo.textContent = "TV";

    showPlaceholder();
}

function destroyHLS() {
    if (!hls) return;

    try {
        hls.stopLoad();
    } catch {}

    try {
        hls.detachMedia();
    } catch {}

    try {
        hls.destroy();
    } catch {}

    hls = null;
}

function hidePlaceholder() {
    if (playerPlaceholder) {
        playerPlaceholder.classList.add("hidden");
    }
}

function showPlaceholder() {
    if (playerPlaceholder) {
        playerPlaceholder.classList.remove("hidden");
    }
}

function showPlayerError() {
    if (!playerPlaceholder) return;

    playerPlaceholder.classList.remove("hidden");

    playerPlaceholder.innerHTML = `
        <div class="player-icon">⚠</div>
        <h3>No se pudo reproducir</h3>
        <p>El canal no está disponible en este momento.</p>
    `;
}

function showTVMessage(message) {
    const container = $("tvCategories");
    if (!container) return;

    container.innerHTML = `
        <div style="padding:12px;color:#ff7580;">
            ⚠️ ${escapeHTML(message)}
        </div>
    `;
}

/* =========================================================
   INICIO - CANALES
========================================================= */

function renderHomeChannels() {
    const popular = $("homePopularChannels");
    const newest = $("homeNewChannels");

    if (popular) {
        popular.innerHTML = "";

        channels.slice(0, 8).forEach(channel => {
            popular.appendChild(createHomeChannelCard(channel));
        });
    }

    if (newest) {
        newest.innerHTML = "";

        channels.slice(-8).reverse().forEach(channel => {
            newest.appendChild(createHomeChannelCard(channel));
        });
    }
}

function createHomeChannelCard(channel) {
    const card = createChannelCard(channel);

    return card;
}

/* =========================================================
   ICONOS DE CATEGORÍA
========================================================= */

function categoryIcon(category) {
    const name = String(category || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    if (name.includes("musica") || name.includes("music")) return "🎵";
    if (name.includes("noticia") || name.includes("news")) return "📰";
    if (name.includes("pelicula") || name.includes("movie")) return "🎬";
    if (name.includes("entretenimiento")) return "🎭";
    if (name.includes("deporte") || name.includes("sport")) return "⚽";
    if (name.includes("caricatura") || name.includes("kids")) return "🎨";
    if (name.includes("anime")) return "🍥";
    if (name.includes("relig")) return "✝️";
    if (name.includes("document") || name.includes("curiosity")) return "🔬";
    if (name.includes("infantil")) return "🧸";

    return "📺";
}

/* =========================================================
   UTILIDADES
========================================================= */

function cleanName(name) {
    return String(name || "Canal")
        .replace(/\s*\[[^\]]*\]\s*/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function slug(value) {
    return String(value || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function escapeAttribute(value) {
    return escapeHTML(value);
}

window.addEventListener("beforeunload", stopTV);
