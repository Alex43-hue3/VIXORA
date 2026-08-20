const fileInput = document.getElementById("m3uFile");
const m3uUrl = document.getElementById("m3uUrl");
const loadUrlButton = document.getElementById("loadUrl");

const channelList = document.getElementById("channelList");
const channelCount = document.getElementById("channelCount");
const searchInput = document.getElementById("search");

const videoPlayer = document.getElementById("videoPlayer");
const playerMessage = document.getElementById("playerMessage");

let channels = [];
let currentChannel = null;
let hls = null;


// ========================================
// CARGAR ARCHIVO M3U
// ========================================

fileInput.addEventListener("change", function () {

    const file = this.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (event) {

        const content = event.target.result;

        channels = parseM3U(content);

        displayChannels(channels);

    };

    reader.readAsText(file);

});


// ========================================
// CARGAR M3U DESDE URL
// ========================================

loadUrlButton.addEventListener("click", async function () {

    const url = m3uUrl.value.trim();

    if (!url) {

        alert("Pega una URL M3U.");

        return;
    }

    try {

        loadUrlButton.textContent = "Cargando...";
        loadUrlButton.disabled = true;

        const response = await fetch(url);

        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );

        }

        const content = await response.text();

        channels = parseM3U(content);

        displayChannels(channels);

    } catch (error) {

        console.error(error);

        alert(
            "No se pudo cargar la lista M3U.\n\n" +
            "El servidor puede estar bloqueando la solicitud " +
            "por CORS o la URL puede no ser válida."
        );

    } finally {

        loadUrlButton.textContent = "Cargar URL";
        loadUrlButton.disabled = false;

    }

});


// ========================================
// PARSER M3U
// ========================================

function parseM3U(content) {

    const lines = content
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line !== "");

    const result = [];

    for (let i = 0; i < lines.length; i++) {

        const line = lines[i];

        if (!line.startsWith("#EXTINF")) {
            continue;
        }

        const commaPosition = line.lastIndexOf(",");

        let name = "Canal sin nombre";

        if (commaPosition !== -1) {

            name = line
                .substring(commaPosition + 1)
                .trim();

        }

        // Buscar logo
        let logo = "";

        const logoMatch = line.match(
            /tvg-logo="([^"]*)"/i
        );

        if (logoMatch) {

            logo = logoMatch[1];

        }

        // Buscar URL
        let url = "";

        for (
            let j = i + 1;
            j < lines.length;
            j++
        ) {

            if (!lines[j].startsWith("#")) {

                url = lines[j];

                i = j;

                break;
            }

        }

        if (!url) continue;

        result.push({

            name: name,
            logo: logo,
            url: url

        });

    }

    return result;
}


// ========================================
// MOSTRAR CANALES
// ========================================

function displayChannels(list) {

    channelList.innerHTML = "";

    channelCount.textContent =
        `${list.length} canal${list.length === 1 ? "" : "es"}`;

    if (list.length === 0) {

        channelList.innerHTML = `
            <div class="empty">
                No se encontraron canales.
            </div>
        `;

        return;
    }

    list.forEach((channel) => {

        const element =
            document.createElement("div");

        element.className = "channel";

        element.innerHTML = `

            ${
                channel.logo

                ? `
                    <img
                        src="${channel.logo}"
                        alt=""
                        onerror="this.style.display='none'"
                    >
                `

                : `
                    <div
                        style="
                            width:40px;
                            height:40px;
                        "
                    ></div>
                `
            }

            <div class="channel-name">
                ${escapeHTML(channel.name)}
            </div>

        `;

        element.addEventListener(
            "click",
            function () {

                playChannel(channel);

                document
                    .querySelectorAll(".channel")
                    .forEach(item =>
                        item.classList.remove("active")
                    );

                element.classList.add("active");

            }
        );

        channelList.appendChild(element);

    });

}


// ========================================
// REPRODUCIR CANAL
// ========================================

function playChannel(channel) {

    currentChannel = channel;

    console.log(
        "Reproduciendo:",
        channel.name
    );

    console.log(
        "URL:",
        channel.url
    );

    playerMessage.style.display = "none";

    // Detener HLS anterior
    if (hls) {

        hls.destroy();

        hls = null;

    }

    // Limpiar reproductor
    videoPlayer.pause();

    videoPlayer.removeAttribute("src");

    videoPlayer.load();


    const url = channel.url.toLowerCase();


    // ====================================
    // HLS
    // ====================================

    if (
        url.includes(".m3u8") ||
        url.includes("m3u8")
    ) {

        playHLS(channel.url);

        return;
    }


    // ====================================
    // VIDEO NORMAL
    // ====================================

    videoPlayer.src = channel.url;

    videoPlayer.load();

    videoPlayer.play().catch(error => {

        console.log(
            "Reproducción automática bloqueada:",
            error
        );

    });

}


// ========================================
// REPRODUCIR HLS
// ========================================

function playHLS(url) {

    console.log(
        "Intentando reproducir HLS..."
    );


    // Navegadores con HLS nativo
    if (
        videoPlayer.canPlayType(
            "application/vnd.apple.mpegurl"
        )
    ) {

        console.log(
            "Usando HLS nativo del navegador."
        );

        videoPlayer.src = url;

        videoPlayer.addEventListener(
            "loadedmetadata",
            function () {

                videoPlayer.play().catch(error => {

                    console.log(
                        "Autoplay bloqueado:",
                        error
                    );

                });

            },
            {
                once: true
            }
        );

        return;
    }


    // HLS.js
    if (Hls.isSupported()) {

        console.log(
            "Usando HLS.js."
        );

        hls = new Hls({

            enableWorker: true,

            lowLatencyMode: true,

            backBufferLength: 90

        });


        hls.loadSource(url);

        hls.attachMedia(videoPlayer);


        hls.on(
            Hls.Events.MANIFEST_PARSED,
            function () {

                console.log(
                    "HLS cargado correctamente."
                );

                videoPlayer
                    .play()
                    .catch(error => {

                        console.log(
                            "Autoplay bloqueado:",
                            error
                        );

                    });

            }
        );


        hls.on(
            Hls.Events.ERROR,
            function (
                event,
                data
            ) {

                console.error(
                    "Error HLS:",
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
                                "Error de red. Intentando recuperar..."
                            );

                            hls.startLoad();

                            break;


                        case Hls.ErrorTypes.MEDIA_ERROR:

                            console.log(
                                "Error de medios. Intentando recuperar..."
                            );

                            hls.recoverMediaError();

                            break;


                        default:

                            console.log(
                                "Error fatal de HLS."
                            );

                            hls.destroy();

                            break;

                        }

                    }

                }

            );

        return;
    }


    // ====================================
    // NO SOPORTADO
    // ====================================

    alert(
        "Este navegador no puede reproducir este formato HLS."
    );

}


// ========================================
// BUSCADOR
// ========================================

searchInput.addEventListener(
    "input",
    function () {

        const text =
            this.value.toLowerCase();

        const filtered =
            channels.filter(channel =>
                channel.name
                    .toLowerCase()
                    .includes(text)
            );

        displayChannels(filtered);

    }
);


// ========================================
// LIMPIAR HLS AL SALIR
// ========================================

window.addEventListener(
    "beforeunload",
    function () {

        if (hls) {

            hls.destroy();

        }

    }
);


// ========================================
// SEGURIDAD BÁSICA
// ========================================

function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
}
