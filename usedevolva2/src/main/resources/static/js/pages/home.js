document.addEventListener("DOMContentLoaded", async () => {
    setupHomeLocationFilters();

    await applyInitialHomeLocationWithFallback();

    await loadFeaturedTools();

    setupToolsMapModal();
});

let homeToolsLoadSequence = 0;

async function loadFeaturedTools() {
    const container = document.getElementById("featuredToolsContainer");
    if (!container) return;

    const currentLoadSequence = ++homeToolsLoadSequence;
    container.innerHTML = "<p>Carregando ferramentas...</p>";

    const isCurrentLoad = () => currentLoadSequence === homeToolsLoadSequence;

    try {
        const user = JSON.parse(localStorage.getItem("user"));
        let favoriteIds = [];

        if (user && user.id) {
            try {
                const favResponse = await fetch(`/favorites/user/${user.id}`);
                if (!isCurrentLoad()) return;

                if (favResponse.ok) {
                    const favs = await favResponse.json();
                    if (!isCurrentLoad()) return;
                    favoriteIds = favs.map(f => f.id);
                }
            } catch (err) {
                if (!isCurrentLoad()) return;
                console.error("Erro ao carregar favoritos do usuário:", err);
            }
        }

        const response = await fetch("/tools");
        if (!isCurrentLoad()) return;
        if (!response.ok) throw new Error("Erro ao buscar ferramentas.");

        let tools = await response.json();
        if (!isCurrentLoad()) return;

        tools = filterToolsByHomeLocation(tools);

        const uniqueTools = [];
        const renderedToolIds = new Set();

        for (const tool of tools || []) {
            const toolKey = String(tool.id || "").trim();
            if (!toolKey || renderedToolIds.has(toolKey)) continue;

            renderedToolIds.add(toolKey);
            uniqueTools.push(tool);
        }

        if (uniqueTools.length === 0) {
            container.innerHTML = "<p>Nenhuma ferramenta disponível para a localização selecionada.</p>";
            return;
        }

        uniqueTools.sort((a, b) => {
            const aIsOuro = a.ownerPlano === "OURO" ? 1 : 0;
            const bIsOuro = b.ownerPlano === "OURO" ? 1 : 0;
            return bIsOuro - aIsOuro; // Ouro primeiro
        });

        const fragment = document.createDocumentFragment();
        const featuredTools = uniqueTools.slice(0, 15);

        for (const tool of featuredTools) {
            const imageUrl = await getMainImage(tool.id);
            if (!isCurrentLoad()) return;

            const isFavorited = favoriteIds.includes(tool.id);

            const localizacaoFormatada = formatToolNeighborhoodCityState(tool);

            const card = document.createElement("article");
            card.className = "tool-card";
            card.dataset.toolId = tool.id;
            card.setAttribute("role", "link");
            card.setAttribute("tabindex", "0");
            card.setAttribute("aria-label", `Ver detalhes de ${tool.nome || "ferramenta"}`);

            card.addEventListener("click", () => {
                window.location.href = `/tools/page/${tool.id}`;
            });

            card.addEventListener("keydown", (event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    window.location.href = `/tools/page/${tool.id}`;
                }
            });

            card.innerHTML = `
                <div class="tool-image-wrapper" style="position: relative;">
                    <img 
                        src="${imageUrl}" 
                        alt="${tool.nome || "Imagem da ferramenta"}" 
                        class="tool-image"
                    >
                    
                    ${tool.ownerPlano === 'OURO' ? `
                        <span class="badge-ouro" style="position: absolute; top: 10px; left: 10px; background: #fbbf24; color: #000; font-weight: bold; font-size: 11px; padding: 4px 8px; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.2); z-index: 10; display: flex; align-items: center; gap: 4px;">
                            ⭐ Destaque
                        </span>
                    ` : ''}

                    <button 
                        type="button" 
                        class="btn-card-favorite ${isFavorited ? 'active' : ''}" 
                        data-tool-id="${tool.id}"
                        aria-label="${isFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}"
                        style="position: absolute; top: 10px; right: 10px; background: rgba(255,255,255,0.85); border: none; border-radius: 50%; width: 36px; height: 36px; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 10; transition: transform 0.2s;"
                    >
                        <svg width="20" height="20" fill="${isFavorited ? '#e02424' : 'none'}" stroke="${isFavorited ? '#e02424' : 'currentColor'}" viewBox="0 0 24 24" stroke-width="2">
                            <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                        </svg>
                    </button>
                </div>

                <div class="tool-info">
                    <h3>${tool.nome || "Ferramenta"}</h3>
                    <p>Categoria: ${formatCategory(tool.categoria)}</p>
                    <p><strong>${formatCurrency(tool.valorDiaria)}</strong> / dia</p>
                    <p>📍 ${localizacaoFormatada}</p> <a 
                        href="/tools/page/${tool.id}" 
                        class="btn-details" 
                        aria-label="Ver detalhes de ${tool.nome || "ferramenta"}"
                    >
                        Ver detalhes
                    </a>
                </div>
            `;

            const favBtn = card.querySelector(".btn-card-favorite");
            favBtn.addEventListener("click", async (e) => {
                e.stopPropagation();
                await toggleFavoriteFromCard(favBtn, tool.id);
            });

            fragment.appendChild(card);
        }

        if (!isCurrentLoad()) return;
        container.replaceChildren(fragment);

    } catch (error) {
        if (!isCurrentLoad()) return;
        console.error(error);
        container.innerHTML = "<p>Não foi possível carregar as ferramentas em destaque.</p>";
    }
}

function formatToolNeighborhoodCityState(tool) {
    const bairro = String(tool.bairro || "").trim();
    const cidade = String(tool.cidade || "").trim();
    const estado = String(tool.estado || "").trim().toUpperCase();

    if (bairro && cidade && estado) {
        return `${bairro} - ${cidade} - ${estado}`;
    }

    if (bairro && cidade) {
        return `${bairro} - ${cidade}`;
    }

    if (bairro && estado) {
        return `${bairro} - ${estado}`;
    }

    if (bairro) {
        return bairro;
    }

    if (cidade && estado) {
        return `${cidade} - ${estado}`;
    }

    if (cidade || estado) {
        return cidade || estado;
    }

    return "Localização não informada";
}

async function toggleFavoriteFromCard(button, toolId) {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.id) {
        showToast("Você precisa estar logado para favoritar ferramentas.");
        return;
    }

    const isCurrentlyFavorite = button.classList.contains("active");
    const method = isCurrentlyFavorite ? "DELETE" : "POST";
    const url = `/favorites?userId=${user.id}&toolId=${toolId}`;

    try {
        button.style.transform = "scale(0.8)";
        const response = await fetch(url, { method: method });

        if (!response.ok) throw new Error();

        if (isCurrentlyFavorite) {
            button.classList.remove("active");
            button.querySelector("svg").setAttribute("fill", "none");
            button.querySelector("svg").setAttribute("stroke", "currentColor");
            showToast("Removido dos favoritos.");
        } else {
            button.classList.add("active");
            button.querySelector("svg").setAttribute("fill", "#e02424");
            button.querySelector("svg").setAttribute("stroke", "#e02424");
            showToast("Adicionado aos favoritos!");
        }
    } catch (err) {
        console.error(err);
        showToast("Erro ao processar favorito. Tente novamente.");
    } finally {
        button.style.transform = "scale(1)";
    }
}

async function getMainImage(toolId) {
    try {
        const response = await fetch(`/tools/${toolId}/images`);

        if (!response.ok) {
            return "https://placehold.co/400x300/EAEAEA/676767?text=Sem+Imagem";
        }

        const images = await response.json();

        if (!images || images.length === 0) {
            return "https://placehold.co/400x300/EAEAEA/676767?text=Sem+Imagem";
        }

        const mainImage = images.find(image => image.principal) || images[0];

        return mainImage.filePath;

    } catch (error) {
        console.error(error);
        return "https://placehold.co/400x300/EAEAEA/676767?text=Sem+Imagem";
    }
}

function formatCurrency(value) {
    return Number(value || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function formatCategory(category) {
    if (!category) return "Não informada";

    const categories = {
        construcao: "Construção",
        jardinagem: "Jardinagem",
        eletrica: "Elétrica",
        limpeza: "Limpeza",
        marcenaria: "Marcenaria",
        outros: "Outros"
    };

    return categories[category] || category;
}

document.addEventListener("DOMContentLoaded", () => {
    handleAnnounceButton();
});

function handleAnnounceButton() {
    const btn = document.getElementById("announceBtn");

    if (!btn) return;

    btn.addEventListener("click", (event) => {
        event.preventDefault();

        const user = JSON.parse(localStorage.getItem("user"));

        if (user && user.id) {
            window.location.href = "/users/create-tool";
        } else {
            window.location.href = "/auth/register";
        }
    });
}


function calculateDistanceKm(lat1, lon1, lat2, lon2) {
    const earthRadiusKm = 6371;

    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const firstLat = toRadians(lat1);
    const secondLat = toRadians(lat2);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(firstLat) * Math.cos(secondLat) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return earthRadiusKm * c;
}

function toRadians(value) {
    return value * Math.PI / 180;
}


function getBrowserLocation() {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            resolve(null);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    lat: position.coords.latitude,
                    lon: position.coords.longitude
                });
            },
            (error) => {
                console.error("Erro ao obter localização do navegador:", error);
                resolve(null);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000
            }
        );
    });
}

function setupHomeLocationFilters() {
    const modeSelect = document.getElementById("homeLocalizacaoModo");
    const estadoSelect = document.getElementById("homeFiltroEstado");
    const cidadeInput = document.getElementById("homeFiltroCidade");
    const applyBtn = document.getElementById("homeApplyLocationBtn");

    if (!modeSelect) return;

    function updateVisibility() {
        const mode = modeSelect.value;

        if (estadoSelect) {
            estadoSelect.style.display = mode === "brasil" ? "none" : "block";
        }

        if (cidadeInput) {
            cidadeInput.style.display = mode === "cidade" ? "block" : "none";
        }

        if (mode === "brasil") {
            if (estadoSelect) estadoSelect.value = "";
            if (cidadeInput) cidadeInput.value = "";
        }

        if (mode === "estado") {
            if (cidadeInput) cidadeInput.value = "";
        }

        updateHomeLocationText();
    }

    modeSelect.addEventListener("change", async () => {
        updateVisibility();
        saveCurrentHomeLocation();
        await loadFeaturedTools();
    });

    if (estadoSelect) {
        estadoSelect.addEventListener("change", async () => {
            updateHomeLocationText();
            saveCurrentHomeLocation();

            if (modeSelect.value === "estado") {
                await loadFeaturedTools();
            }
        });
    }

    if (applyBtn) {
        applyBtn.addEventListener("click", async () => {
            updateHomeLocationText();
            saveCurrentHomeLocation();
            await loadFeaturedTools();
        });
    }

    updateVisibility();
}

function filterToolsByHomeLocation(tools) {
    const mode = document.getElementById("homeLocalizacaoModo")?.value || "brasil";
    const estadoFiltro = normalizeHomeText(document.getElementById("homeFiltroEstado")?.value || "");
    const cidadeFiltro = normalizeHomeText(document.getElementById("homeFiltroCidade")?.value || "");

    if (mode === "brasil") {
        return tools;
    }

    return tools.filter((tool) => {
        const toolEstado = normalizeHomeText(tool.estado);
        const toolCidade = normalizeHomeText(tool.cidade);
        const toolLocalizacao = normalizeHomeText(tool.localizacao);

        if (mode === "estado") {
            return (
                !estadoFiltro ||
                toolEstado === estadoFiltro ||
                toolLocalizacao.includes(estadoFiltro)
            );
        }

        if (mode === "cidade") {
            const matchEstado =
                !estadoFiltro ||
                toolEstado === estadoFiltro ||
                toolLocalizacao.includes(estadoFiltro);

            const matchCidade =
                !cidadeFiltro ||
                toolCidade.includes(cidadeFiltro) ||
                toolLocalizacao.includes(cidadeFiltro);

            return matchEstado && matchCidade;
        }

        return true;
    });
}

async function applyInitialHomeLocationWithFallback() {
    const savedLocation = getSavedHomeLocation();

    if (savedLocation && savedLocation.source === "manual") {
        applySavedHomeLocation(savedLocation);
        return;
    }

    if (savedLocation && savedLocation.source === "address") {
        applySavedHomeLocation(savedLocation);
        return;
    }

    const ipLocation = await getHomeLocationByIp();

    if (ipLocation && isBrazilHomeLocation(ipLocation)) {
        const location = {
            mode: "cidade",
            cidade: ipLocation.cidade,
            estado: ipLocation.estado,
            source: "ip"
        };

        applyHomeLocationToFilters(location);
        saveHomeLocation(location);

        return;
    }

    const mainAddress = await getHomeMainBrazilianAddress();

    if (mainAddress) {
        const location = {
            mode: "cidade",
            cidade: mainAddress.cidade,
            estado: mainAddress.estado,
            source: "address"
        };

        applyHomeLocationToFilters(location);
        saveHomeLocation(location);

        return;
    }

    const brazilLocation = {
        mode: "brasil",
        cidade: "",
        estado: "",
        source: "brasil"
    };

    applyHomeBrazilWideFilter();
    saveHomeLocation(brazilLocation);
}

async function getHomeLocationByIp() {
    try {
        const response = await fetch("https://ipapi.co/json/");

        if (!response.ok) {
            return null;
        }

        const data = await response.json();

        return {
            pais: data.country_code,
            cidade: data.city,
            estado: data.region_code
        };

    } catch (error) {
        console.warn("Não foi possível obter localização por IP:", error);
        return null;
    }
}

function isBrazilHomeLocation(location) {
    if (!location) return false;

    const pais = String(location.pais || "").toUpperCase();
    const cidade = String(location.cidade || "").trim();
    const estado = String(location.estado || "").trim().toUpperCase();

    return pais === "BR" && cidade.length > 0 && estado.length === 2;
}

async function getHomeMainBrazilianAddress() {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user || !user.id) {
        return null;
    }

    try {
        const response = await fetch(`/users/${user.id}/addresses`);

        if (!response.ok) {
            return null;
        }

        const addresses = await response.json();

        if (!addresses || addresses.length === 0) {
            return null;
        }

        const mainAddress =
            addresses.find(address => address.principal) ||
            addresses[0];

        if (!mainAddress) {
            return null;
        }

        const estado = String(mainAddress.estado || "").trim().toUpperCase();
        const cidade = String(mainAddress.cidade || "").trim();

        if (!cidade || estado.length !== 2) {
            return null;
        }

        return {
            cidade,
            estado
        };

    } catch (error) {
        console.warn("Não foi possível carregar endereço principal:", error);
        return null;
    }
}

function applyHomeLocationToFilters(location) {
    const modeSelect = document.getElementById("homeLocalizacaoModo");
    const estadoSelect = document.getElementById("homeFiltroEstado");
    const cidadeInput = document.getElementById("homeFiltroCidade");

    if (!location) {
        applyHomeBrazilWideFilter();
        return;
    }

    const mode = location.mode || "cidade";

    if (modeSelect) {
        modeSelect.value = mode;
    }

    if (estadoSelect) {
        estadoSelect.value = location.estado ? String(location.estado).toUpperCase() : "";
    }

    if (cidadeInput) {
        cidadeInput.value = location.cidade || "";
    }

    setupHomeLocationFilters();
    updateHomeLocationText();
}

function applyHomeBrazilWideFilter() {
    const modeSelect = document.getElementById("homeLocalizacaoModo");
    const estadoSelect = document.getElementById("homeFiltroEstado");
    const cidadeInput = document.getElementById("homeFiltroCidade");

    if (modeSelect) {
        modeSelect.value = "brasil";
    }

    if (estadoSelect) {
        estadoSelect.value = "";
    }

    if (cidadeInput) {
        cidadeInput.value = "";
    }

    setupHomeLocationFilters();
    updateHomeLocationText();
}

function updateHomeLocationText() {
    const text = document.getElementById("homeLocalizacaoDetectadaTexto");
    const subtitle = document.getElementById("featuredToolsSubtitle");

    const mode = document.getElementById("homeLocalizacaoModo")?.value || "brasil";
    const estado = document.getElementById("homeFiltroEstado")?.value || "";
    const cidade = document.getElementById("homeFiltroCidade")?.value.trim() || "";

    if (!text) return;

    if (mode === "brasil") {
        text.textContent = "Mostrando ferramentas em todo o Brasil.";

        if (subtitle) {
            subtitle.textContent = "As ferramentas mais procuradas no país.";
        }

        return;
    }

    if (mode === "estado") {
        text.textContent = estado
            ? `Mostrando ferramentas em ${estado}.`
            : "Selecione um estado.";

        if (subtitle) {
            subtitle.textContent = "As ferramentas mais procuradas no estado selecionado.";
        }

        return;
    }

    if (mode === "cidade") {
        if (cidade && estado) {
            text.textContent = `Mostrando ferramentas em ${cidade} - ${estado}.`;
        } else if (estado) {
            text.textContent = `Mostrando ferramentas no estado ${estado}.`;
        } else {
            text.textContent = "Informe uma cidade e/ou estado.";
        }

        if (subtitle) {
            subtitle.textContent = "As ferramentas mais procuradas na região selecionada.";
        }
    }
}

function normalizeHomeText(value) {
    if (!value) return "";

    return String(value)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

function saveHomeLocation(location) {
    if (!location) return;

    localStorage.setItem("homeSelectedLocation", JSON.stringify({
        mode: location.mode || "brasil",
        estado: location.estado || "",
        cidade: location.cidade || "",
        source: location.source || "manual"
    }));
}

function getSavedHomeLocation() {
    try {
        const raw = localStorage.getItem("homeSelectedLocation");

        if (!raw) {
            return null;
        }

        const location = JSON.parse(raw);

        if (!location || !location.mode) {
            return null;
        }

        return location;

    } catch (error) {
        console.warn("Erro ao ler localização salva da home:", error);
        return null;
    }
}

function applySavedHomeLocation(location) {
    if (!location || location.mode === "brasil") {
        applyHomeBrazilWideFilter();
        return;
    }

    applyHomeLocationToFilters(location);
}

function saveCurrentHomeLocation() {
    const mode = document.getElementById("homeLocalizacaoModo")?.value || "brasil";
    const estado = document.getElementById("homeFiltroEstado")?.value || "";
    const cidade = document.getElementById("homeFiltroCidade")?.value.trim() || "";

    saveHomeLocation({
        mode,
        estado,
        cidade,
        source: "manual"
    });
}

let toolsMapInstance = null;
let toolsMapMarkersLayer = null;
let toolsMapLoaded = false;
let toolsMapAllGroups = [];
let toolsMapUserLocation = null;
let toolsMapLocationSource = null;
let toolsMapManualLocation = null;
let toolsMapRadiusKm = 10;

const TOOLS_MAP_MIN_RADIUS_KM = 5;
const TOOLS_MAP_MAX_RADIUS_KM = 30;
const TOOLS_MAP_RADIUS_STEP_KM = 5;
const TOOLS_MAP_CLUSTER_DISTANCE_KM = 2;

function setupToolsMapModal() {
    const openBtn = document.getElementById("openToolsMapBtn");
    const closeBtn = document.getElementById("closeToolsMapBtn");
    const modal = document.getElementById("toolsMapModal");
    const minusBtn = document.getElementById("toolsMapRadiusMinus");
    const plusBtn = document.getElementById("toolsMapRadiusPlus");
    const addressForm = document.getElementById("toolsMapAddressForm");
    const addressInput = document.getElementById("toolsMapAddressInput");

    if (!openBtn || !closeBtn || !modal) {
        return;
    }

    openBtn.addEventListener("click", async () => {
        openToolsMapModal();

        await loadToolsMap(true);
    });

    closeBtn.addEventListener("click", closeToolsMapModal);

    modal.addEventListener("click", (event) => {
        if (event.target.id === "toolsMapModal") {
            closeToolsMapModal();
        }
    });

    if (minusBtn) {
        minusBtn.addEventListener("click", () => {
            updateToolsMapRadius(-TOOLS_MAP_RADIUS_STEP_KM);
        });
    }

    if (plusBtn) {
        plusBtn.addEventListener("click", () => {
            updateToolsMapRadius(TOOLS_MAP_RADIUS_STEP_KM);
        });
    }

    if (addressForm) {
        addressForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            await applyToolsMapAddressSearch(addressInput?.value || "");
        });
    }

    updateToolsMapRadiusLabel();
}

function openToolsMapModal() {
    const modal = document.getElementById("toolsMapModal");

    if (!modal) return;

    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");

    setTimeout(() => {
        if (toolsMapInstance) {
            toolsMapInstance.invalidateSize();
        }
    }, 150);
}

function closeToolsMapModal() {
    const modal = document.getElementById("toolsMapModal");

    if (!modal) return;

    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
}

function updateToolsMapRadius(delta) {
    toolsMapRadiusKm = Math.min(
        TOOLS_MAP_MAX_RADIUS_KM,
        Math.max(TOOLS_MAP_MIN_RADIUS_KM, toolsMapRadiusKm + delta)
    );

    updateToolsMapRadiusLabel();

    if (toolsMapLoaded) {
        renderToolsMapGroups(getToolsMapGroupsInsideRadius());
    }
}

function updateToolsMapRadiusLabel() {
    const label = document.getElementById("toolsMapRadiusValue");
    const minusBtn = document.getElementById("toolsMapRadiusMinus");
    const plusBtn = document.getElementById("toolsMapRadiusPlus");

    if (label) {
        label.textContent = `${toolsMapRadiusKm} km`;
    }

    if (minusBtn) {
        minusBtn.disabled = toolsMapRadiusKm <= TOOLS_MAP_MIN_RADIUS_KM;
    }

    if (plusBtn) {
        plusBtn.disabled = toolsMapRadiusKm >= TOOLS_MAP_MAX_RADIUS_KM;
    }
}

async function loadToolsMap(forceReload = false) {
    const sideTitle = document.getElementById("toolsMapSideTitle");
    const sideList = document.getElementById("toolsMapSideList");
    const locationStatus = document.getElementById("toolsMapLocationStatus");

    if (sideTitle) {
        sideTitle.textContent = "Carregando ferramentas...";
    }

    if (sideList) {
        sideList.innerHTML = `<p class="tools-map-empty">Montando mapa...</p>`;
    }

    if (locationStatus) {
        locationStatus.textContent = "Solicitando sua localização...";
    }

    initToolsMap();

    if (toolsMapLoaded && !forceReload) {
        renderToolsMapGroups(getToolsMapGroupsInsideRadius());
        return;
    }

    try {
        const baseLocation = await resolveToolsMapBaseLocation();

        if (!baseLocation) {
            toolsMapUserLocation = null;
            toolsMapLocationSource = null;
            toolsMapLoaded = false;

            if (locationStatus) {
                locationStatus.textContent =
                    "Localização não informada. Digite um endereço no campo acima para buscar no mapa.";
            }

            if (sideTitle) {
                sideTitle.textContent = "Digite um endereço";
            }

            if (sideList) {
                sideList.innerHTML = `
                    <p class="tools-map-empty">
                        Permita o acesso à localização ou digite um endereço no campo acima
                        para visualizar ferramentas próximas no mapa.
                    </p>
                `;
            }

            toolsMapInstance.setView([-14.235, -51.9253], 4);
            toolsMapMarkersLayer.clearLayers();

            return;
        }

        toolsMapUserLocation = baseLocation;
        toolsMapLocationSource = baseLocation.source;

        if (locationStatus) {
            locationStatus.textContent = buildToolsMapLocationStatusText(baseLocation);
        }

        const response = await fetch("/tools");

        if (!response.ok) {
            throw new Error("Erro ao buscar ferramentas.");
        }

        const tools = await response.json();

        const availableTools = (tools || []).filter(tool => {
            return tool && tool.disponivel !== false && tool.ativo !== false;
        });

        const groups = groupToolsByLocation(availableTools);
        const geocodedGroups = await geocodeToolGroups(groups);
        const clusteredGroups = clusterToolsMapGroups(geocodedGroups);

        toolsMapAllGroups = clusteredGroups
            .map(group => ({
                ...group,
                distanceKm: calculateDistanceKm(
                    baseLocation.lat,
                    baseLocation.lon,
                    group.lat,
                    group.lon
                )
            }))
            .sort((a, b) => a.distanceKm - b.distanceKm);

        toolsMapLoaded = true;

        renderToolsMapGroups(getToolsMapGroupsInsideRadius());

    } catch (error) {
        console.error(error);

        if (locationStatus) {
            locationStatus.textContent = "Não foi possível carregar o mapa.";
        }

        if (sideTitle) {
            sideTitle.textContent = "Erro ao carregar mapa";
        }

        if (sideList) {
            sideList.innerHTML = `
                <p class="tools-map-empty">
                    Não foi possível carregar as ferramentas no mapa.
                </p>
            `;
        }
    }
}

async function resolveToolsMapBaseLocation() {
    if (toolsMapManualLocation) {
        return toolsMapManualLocation;
    }

    const browserLocation = await getBrowserLocation();

    if (browserLocation) {
        return {
            ...browserLocation,
            source: "browser"
        };
    }

    return null;
}

async function applyToolsMapAddressSearch(rawAddress) {
    const address = String(rawAddress || "").trim();
    const sideTitle = document.getElementById("toolsMapSideTitle");
    const sideList = document.getElementById("toolsMapSideList");
    const locationStatus = document.getElementById("toolsMapLocationStatus");
    const searchBtn = document.getElementById("toolsMapAddressSearchBtn");

    if (!address) {
        if (locationStatus) {
            locationStatus.textContent = "Digite um endereço, bairro, cidade ou CEP para buscar no mapa.";
        }
        return;
    }

    if (searchBtn) {
        searchBtn.disabled = true;
        searchBtn.textContent = "Buscando...";
    }

    if (locationStatus) {
        locationStatus.textContent = `Buscando endereço: ${address}`;
    }

    if (sideTitle) {
        sideTitle.textContent = "Buscando endereço...";
    }

    if (sideList) {
        sideList.innerHTML = `<p class="tools-map-empty">Localizando o endereço informado no mapa...</p>`;
    }

    try {
        const coordinates = await getCoordinatesForLocation(address);

        if (!coordinates) {
            if (locationStatus) {
                locationStatus.textContent = "Não encontramos esse endereço. Confira a digitação e tente novamente.";
            }

            if (sideTitle) {
                sideTitle.textContent = "Endereço não encontrado";
            }

            if (sideList) {
                sideList.innerHTML = `
                    <p class="tools-map-empty">
                        Não foi possível localizar o endereço informado. Tente incluir cidade, estado ou CEP.
                    </p>
                `;
            }
            return;
        }

        toolsMapManualLocation = {
            lat: coordinates.lat,
            lon: coordinates.lon,
            source: "manual",
            label: address
        };
        toolsMapLoaded = false;

        await loadToolsMap(true);

    } catch (error) {
        console.warn("Erro ao buscar endereço no mapa:", error);

        if (locationStatus) {
            locationStatus.textContent = "Erro ao buscar o endereço. Tente novamente.";
        }
    } finally {
        if (searchBtn) {
            searchBtn.disabled = false;
            searchBtn.textContent = "Buscar no mapa";
        }
    }
}

async function getMainAddressLocationForToolsMap() {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user || !user.id) {
        return null;
    }

    try {
        const response = await fetch(`/users/${user.id}/addresses`);

        if (!response.ok) {
            return null;
        }

        const addresses = await response.json();

        if (!addresses || addresses.length === 0) {
            return null;
        }

        const mainAddress =
            addresses.find(address => address.principal) ||
            addresses[0];

        if (!mainAddress) {
            return null;
        }

        const addressText = buildAddressTextFromSavedAddress(mainAddress);

        if (!addressText) {
            return null;
        }

        const location = await getCoordinatesForLocation(addressText);

        if (!location) {
            return null;
        }

        return {
            lat: location.lat,
            lon: location.lon,
            cidade: mainAddress.cidade,
            estado: mainAddress.estado
        };

    } catch (error) {
        console.warn("Não foi possível carregar endereço principal para o mapa:", error);
        return null;
    }
}

function buildAddressTextFromSavedAddress(address) {
    const bairro = String(address.bairro || "").trim();
    const cidade = String(address.cidade || "").trim();
    const estado = String(address.estado || "").trim();

    if (bairro && cidade && estado) {
        return `${bairro}, ${cidade}, ${estado}, Brasil`;
    }

    if (cidade && estado) {
        return `${cidade}, ${estado}, Brasil`;
    }

    return "";
}

function buildToolsMapLocationStatusText(location) {
    if (!location) {
        return "Localização não encontrada. Digite um endereço para buscar no mapa.";
    }

    if (location.source === "browser") {
        return `Usando sua localização atual. Raio de ${toolsMapRadiusKm} km.`;
    }

    if (location.source === "manual") {
        return `Usando o endereço pesquisado${location.label ? `: ${location.label}` : ""}. Raio de ${toolsMapRadiusKm} km.`;
    }

    return `Raio de ${toolsMapRadiusKm} km.`;
}

function getToolsMapGroupsInsideRadius() {
    return toolsMapAllGroups.filter(group => group.distanceKm <= toolsMapRadiusKm);
}

function initToolsMap() {
    if (toolsMapInstance) {
        return;
    }

    toolsMapInstance = L.map("toolsMap", {
        scrollWheelZoom: true
    }).setView([-14.235, -51.9253], 4);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap"
    }).addTo(toolsMapInstance);

    toolsMapMarkersLayer = L.layerGroup().addTo(toolsMapInstance);
}

function groupToolsByLocation(tools) {
    const map = new Map();

    tools.forEach(tool => {
        const key = buildToolLocationKey(tool);

        if (!key) return;

        if (!map.has(key)) {
            map.set(key, {
                key,
                label: buildToolLocationLabel(tool),
                query: buildToolGeocodeQuery(tool),
                tools: []
            });
        }

        map.get(key).tools.push(tool);
    });

    return Array.from(map.values());
}

function buildToolLocationKey(tool) {
    const query = buildToolGeocodeQuery(tool);

    if (!query) {
        return "";
    }

    return normalizeHomeText(query);
}

function buildToolLocationLabel(tool) {
    const bairro = String(tool.bairro || "").trim();
    const cidade = String(tool.cidade || "").trim();
    const estado = String(tool.estado || "").trim();

    if (bairro) {
        const suffix = [cidade, estado].filter(Boolean).join(" - ");
        return suffix ? `${bairro} - ${suffix}` : bairro;
    }

    if (cidade || estado) {
        return [cidade, estado].filter(Boolean).join(" - ");
    }

    return "Localização aproximada";
}

function buildToolGeocodeQuery(tool) {
    const logradouro = String(tool.logradouro || "").trim();
    const numero = String(tool.numero || "").trim();
    const bairro = String(tool.bairro || "").trim();
    const cidade = String(tool.cidade || "").trim();
    const estado = String(tool.estado || "").trim();
    const cep = String(tool.cep || "").replace(/\D/g, "");
    const localizacao = String(tool.localizacao || "").trim();

    if (logradouro && numero && cidade && estado) {
        return [
            `${logradouro}, ${numero}`,
            bairro,
            cidade,
            estado,
            "Brasil"
        ].filter(Boolean).join(", ");
    }

    if (logradouro && cidade && estado) {
        return [
            logradouro,
            bairro,
            cidade,
            estado,
            "Brasil"
        ].filter(Boolean).join(", ");
    }

    if (localizacao && cidade && estado) {
        return `${localizacao}, ${cidade}, ${estado}, Brasil`;
    }

    if (bairro && cidade && estado) {
        return `${bairro}, ${cidade}, ${estado}, Brasil`;
    }

    if (cep.length === 8) {
        return `${cep}, Brasil`;
    }

    return "";
}

function clusterToolsMapGroups(groups) {
    const clusters = [];

    groups.forEach(group => {
        const existingCluster = clusters.find(cluster => {
            const distanceKm = calculateDistanceKm(
                cluster.lat,
                cluster.lon,
                group.lat,
                group.lon
            );

            return distanceKm <= TOOLS_MAP_CLUSTER_DISTANCE_KM;
        });

        if (!existingCluster) {
            clusters.push({
                ...group,
                isClusteredRegion: false
            });
            return;
        }

        const currentToolsCount = existingCluster.tools.length;
        const newToolsCount = group.tools.length;
        const totalToolsCount = currentToolsCount + newToolsCount;

        existingCluster.lat = (
            (existingCluster.lat * currentToolsCount) +
            (group.lat * newToolsCount)
        ) / totalToolsCount;

        existingCluster.lon = (
            (existingCluster.lon * currentToolsCount) +
            (group.lon * newToolsCount)
        ) / totalToolsCount;

        existingCluster.tools.push(...group.tools);
        existingCluster.isClusteredRegion = true;
        existingCluster.label = buildNearbyRegionLabel(existingCluster.tools);
    });

    return clusters;
}

function buildNearbyRegionLabel(tools) {
    const bairros = uniqueToolLocationValues(tools, "bairro");
    const cidades = uniqueToolLocationValues(tools, "cidade");
    const estados = uniqueToolLocationValues(tools, "estado");

    const bairrosText = bairros.length > 0
        ? bairros.slice(0, 4).join(" • ") + (bairros.length > 4 ? "..." : "")
        : "locais próximos";

    const locationSuffix = [];

    if (cidades.length === 1) {
        locationSuffix.push(cidades[0]);
    }

    if (estados.length === 1) {
        locationSuffix.push(estados[0]);
    }

    return `Região próxima: ${bairrosText}${locationSuffix.length > 0 ? ` - ${locationSuffix.join(" - ")}` : ""}`;
}

function uniqueToolLocationValues(tools, fieldName) {
    const values = [];
    const seen = new Set();

    tools.forEach(tool => {
        const value = String(tool[fieldName] || "").trim();
        const key = normalizeHomeText(value);

        if (!value || seen.has(key)) {
            return;
        }

        seen.add(key);
        values.push(value);
    });

    return values;
}

async function geocodeToolGroups(groups) {
    const result = [];

    for (const group of groups) {
        const coordinates = await getCoordinatesForLocation(group.query);

        if (coordinates) {
            result.push({
                ...group,
                lat: coordinates.lat,
                lon: coordinates.lon
            });
        }

        await wait(250);
    }

    return result;
}

async function getCoordinatesForLocation(query) {
    if (!query) {
        return null;
    }

    const cacheKey = `mapGeocode:${normalizeHomeText(query)}`;
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
        try {
            return JSON.parse(cached);
        } catch (error) {
            localStorage.removeItem(cacheKey);
        }
    }

    const queriesToTry = buildGeocodeAttempts(query);
    const cep = extractBrazilianCep(query);

    if (cep) {
        const viaCepAddress = await getAddressByCep(cep);

        if (viaCepAddress) {
            queriesToTry.unshift(...buildGeocodeAttempts(viaCepAddress));
        }
    }

    for (const currentQuery of [...new Set(queriesToTry)]) {
        try {
            const url =
                "https://nominatim.openstreetmap.org/search" +
                `?format=json&limit=1&addressdetails=1&countrycodes=br&q=${encodeURIComponent(currentQuery)}`;

            const response = await fetch(url, {
                headers: {
                    "Accept": "application/json"
                }
            });

            if (!response.ok) {
                continue;
            }

            const data = await response.json();

            if (!data || data.length === 0) {
                continue;
            }

            const coordinates = {
                lat: Number(data[0].lat),
                lon: Number(data[0].lon)
            };

            localStorage.setItem(cacheKey, JSON.stringify(coordinates));

            return coordinates;

        } catch (error) {
            console.warn("Erro ao geocodificar localização:", currentQuery, error);
        }

        await wait(250);
    }

    return null;
}

function extractBrazilianCep(value) {
    const digits = String(value || "").replace(/\D/g, "");

    return digits.length === 8 ? digits : "";
}

async function getAddressByCep(cep) {
    const cleanCep = extractBrazilianCep(cep);

    if (!cleanCep) {
        return "";
    }

    const cacheKey = `cepAddress:${cleanCep}`;
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
        return cached;
    }

    try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);

        if (!response.ok) {
            return "";
        }

        const data = await response.json();

        if (!data || data.erro) {
            return "";
        }

        const addressText = buildAddressTextFromViaCep(data);

        if (addressText) {
            localStorage.setItem(cacheKey, addressText);
        }

        return addressText;

    } catch (error) {
        console.warn("Erro ao buscar CEP no ViaCEP:", error);
        return "";
    }
}

function buildAddressTextFromViaCep(data) {
    const logradouro = String(data.logradouro || "").trim();
    const bairro = String(data.bairro || "").trim();
    const cidade = String(data.localidade || "").trim();
    const estado = String(data.uf || "").trim();

    if (!cidade || !estado) {
        return "";
    }

    return [
        logradouro,
        bairro,
        cidade,
        estado,
        "Brasil"
    ].filter(Boolean).join(", ");
}

function buildGeocodeAttempts(query) {
    const cleanQuery = String(query || "").trim();

    if (!cleanQuery) {
        return [];
    }

    const attempts = [cleanQuery];

    const onlyNumbers = cleanQuery.replace(/\D/g, "");

    if (onlyNumbers.length === 8) {
        attempts.push(`${onlyNumbers.substring(0, 5)}-${onlyNumbers.substring(5)}, Brasil`);
        return [...new Set(attempts)];
    }

    const parts = cleanQuery
        .split(",")
        .map(part => part.trim())
        .filter(Boolean);

    const brasilIndex = parts.findIndex(part => normalizeHomeText(part) === "brasil");
    const usableParts = brasilIndex >= 0 ? parts.slice(0, brasilIndex) : parts;

    const estado = usableParts.length >= 1 ? usableParts[usableParts.length - 1] : "";
    const cidade = usableParts.length >= 2 ? usableParts[usableParts.length - 2] : "";
    const bairro = usableParts.length >= 3 ? usableParts[usableParts.length - 3] : "";
    const endereco = usableParts.length >= 4 ? usableParts.slice(0, usableParts.length - 3).join(", ") : "";

    const cepMatch = cleanQuery.match(/\b\d{5}-?\d{3}\b/);

    if (cepMatch) {
        attempts.push(`${cepMatch[0]}, Brasil`);
    }

    if (endereco && bairro && cidade && estado) {
        attempts.push(`${endereco}, ${bairro}, ${cidade} - ${estado}, Brasil`);
        attempts.push(`${endereco}, ${cidade}, ${estado}, Brasil`);
        attempts.push(`${endereco.replace(/,?\s*n[ºo]?\s*\d+$/i, "")}, ${bairro}, ${cidade}, ${estado}, Brasil`);
    }

    if (bairro && cidade && estado) {
        attempts.push(`${bairro}, ${cidade}, ${estado}, Brasil`);
        attempts.push(`${bairro}, ${cidade} - ${estado}, Brasil`);
        attempts.push(`Bairro ${bairro}, ${cidade}, ${estado}, Brasil`);

        const simplifiedBairro = simplifyBrazilianNeighborhoodName(bairro);

        if (simplifiedBairro && simplifiedBairro !== bairro) {
            attempts.push(`${simplifiedBairro}, ${cidade}, ${estado}, Brasil`);
            attempts.push(`${simplifiedBairro}, ${cidade}, Brasil`);
        }

        attempts.push(`${cidade}, ${estado}, Brasil`);
    } else if (cidade && estado) {
        attempts.push(`${cidade}, ${estado}, Brasil`);
    }

    return [...new Set(attempts)];
}

function simplifyBrazilianNeighborhoodName(value) {
    return String(value || "")
        .replace(/^vila\s+/i, "")
        .replace(/^jardim\s+/i, "")
        .replace(/^jd\.?\s+/i, "")
        .replace(/^parque\s+/i, "")
        .trim();
}

function renderToolsMapGroups(groups) {
    const sideTitle = document.getElementById("toolsMapSideTitle");
    const sideList = document.getElementById("toolsMapSideList");
    const locationStatus = document.getElementById("toolsMapLocationStatus");

    if (!toolsMapInstance || !toolsMapMarkersLayer) {
        return;
    }

    toolsMapMarkersLayer.clearLayers();

    if (toolsMapUserLocation) {
        L.marker([toolsMapUserLocation.lat, toolsMapUserLocation.lon], {
            icon: createToolsMapUserIcon()
        })
            .addTo(toolsMapMarkersLayer)
            .bindPopup(getToolsMapUserPopupText());

        L.circle([toolsMapUserLocation.lat, toolsMapUserLocation.lon], {
            radius: toolsMapRadiusKm * 1000,
            color: "#5b4bb7",
            fillColor: "#5b4bb7",
            fillOpacity: 0.08
        }).addTo(toolsMapMarkersLayer);
    }

    if (locationStatus && toolsMapUserLocation) {
        locationStatus.textContent = buildToolsMapLocationStatusText(toolsMapUserLocation);
    }

    if (!groups || groups.length === 0) {
        if (sideTitle) {
            sideTitle.textContent = "Nenhuma ferramenta próxima";
        }

        if (sideList) {
            sideList.innerHTML = `
                <p class="tools-map-empty">
                    Nenhuma ferramenta encontrada em um raio de ${toolsMapRadiusKm} km.
                    Use o botão + para aumentar o raio até 30 km.
                </p>
            `;
        }

        if (toolsMapUserLocation) {
            toolsMapInstance.setView([toolsMapUserLocation.lat, toolsMapUserLocation.lon], 13);
        } else {
            toolsMapInstance.setView([-14.235, -51.9253], 4);
        }

        return;
    }

    const bounds = [];

    if (toolsMapUserLocation) {
        bounds.push([toolsMapUserLocation.lat, toolsMapUserLocation.lon]);
    }

    groups.forEach(group => {
        const marker = L.marker([group.lat, group.lon], {
            icon: createToolsMapIcon(group.tools.length)
        });

        marker.on("click", () => {
            showToolsMapSideList(group);
        });

        marker.addTo(toolsMapMarkersLayer);
        bounds.push([group.lat, group.lon]);
    });

    if (bounds.length > 0) {
        toolsMapInstance.fitBounds(bounds, {
            padding: [40, 40],
            maxZoom: 14
        });
    }

    if (sideTitle) {
        sideTitle.textContent = "Selecione um ponto no mapa";
    }

    if (sideList) {
        const totalTools = groups.reduce((sum, group) => sum + group.tools.length, 0);

        sideList.innerHTML = `
            <p class="tools-map-empty">
                ${formatToolsMapToolsCount(totalTools)} em ${formatToolsMapLocationsCount(groups.length)}
                dentro de ${toolsMapRadiusKm} km.
                Clique em um ponto no mapa.
            </p>
        `;
    }
}


function formatToolsMapToolsCount(count) {
    return count === 1 ? "1 ferramenta" : `${count} ferramentas`;
}

function formatToolsMapLocationsCount(count) {
    return count === 1 ? "1 local" : `${count} locais`;
}

function getToolsMapUserPopupText() {
    if (toolsMapLocationSource === "manual") {
        return "Endereço pesquisado";
    }

    if (toolsMapLocationSource === "address") {
        return "Seu endereço padrão";
    }

    return "Sua localização atual";
}

function createToolsMapIcon(count) {
    const isMultiple = count > 1;

    return L.divIcon({
        className: "",
        html: `
            <div class="tools-map-marker-clean ${isMultiple ? "multiple" : "single"}">
                ${isMultiple ? count : "📍"}
            </div>
        `,
        iconSize: [42, 42],
        iconAnchor: [21, 42],
        popupAnchor: [0, -42]
    });
}

function createToolsMapUserIcon() {
    return L.divIcon({
        className: "",
        html: `<div class="tools-map-user-marker">Você</div>`,
        iconSize: [54, 32],
        iconAnchor: [27, 16],
        popupAnchor: [0, -16]
    });
}

async function showToolsMapSideList(group) {
    const sideTitle = document.getElementById("toolsMapSideTitle");
    const sideList = document.getElementById("toolsMapSideList");

    if (!sideTitle || !sideList) {
        return;
    }

    sideTitle.textContent =
        group.tools.length === 1
            ? "1 ferramenta neste local"
            : `${group.tools.length} ferramentas neste local`;

    const toolsWithImages = await Promise.all(
        group.tools.map(async tool => {
            const imageUrl = await getMainImage(tool.id);
            return {
                ...tool,
                imageUrl
            };
        })
    );

    sideList.innerHTML = `
        <p class="tools-map-location">
            ${escapeHomeHtml(group.label)}
            ${typeof group.distanceKm === "number"
        ? `<br><strong>${group.distanceKm.toFixed(1)} km de distância</strong>`
        : ""}
        </p>

        ${toolsWithImages.map(tool => `
            <button type="button" class="tools-map-tool" data-tool-id="${tool.id}">
                <img src="${tool.imageUrl}" alt="${escapeHomeHtml(tool.nome || "Ferramenta")}">

                <span>
                    <strong>${escapeHomeHtml(tool.nome || "Ferramenta")}</strong>
                    <small>${formatCategory(tool.categoria)} • ${formatCurrency(tool.valorDiaria)} / dia</small>
                </span>
            </button>
        `).join("")}
    `;

    sideList.querySelectorAll(".tools-map-tool").forEach(button => {
        button.addEventListener("click", () => {
            const toolId = button.dataset.toolId;
            window.location.href = `/tools/page/${toolId}`;
        });
    });
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function escapeHomeHtml(value) {
    return String(value || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}