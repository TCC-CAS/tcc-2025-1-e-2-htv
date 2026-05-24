document.addEventListener("DOMContentLoaded", async () => {
    await loadFeaturedTools();
    setupNearbyMapButton();
});

async function loadFeaturedTools() {
    const container = document.getElementById("featuredToolsContainer");
    if (!container) return;

    try {
        const user = JSON.parse(localStorage.getItem("user"));
        let favoriteIds = [];

        if (user && user.id) {
            try {
                const favResponse = await fetch(`/favorites/user/${user.id}`);
                if (favResponse.ok) {
                    const favs = await favResponse.json();
                    favoriteIds = favs.map(f => f.id);
                }
            } catch (err) {
                console.error("Erro ao carregar favoritos do usuário:", err);
            }
        }

        const response = await fetch("/tools");
        if (!response.ok) throw new Error("Erro ao buscar ferramentas.");

        let tools = await response.json();
        if (!tools || tools.length === 0) {
            container.innerHTML = "<p>Nenhuma ferramenta disponível no momento.</p>";
            return;
        }

        tools.sort((a, b) => {
            const aIsOuro = a.ownerPlano === "OURO" ? 1 : 0;
            const bIsOuro = b.ownerPlano === "OURO" ? 1 : 0;
            return bIsOuro - aIsOuro; // Ouro primeiro
        });

        container.innerHTML = "";
        const featuredTools = tools.slice(0, 15);

        for (const tool of featuredTools) {
            const imageUrl = await getMainImage(tool.id);
            const isFavorited = favoriteIds.includes(tool.id);

            const localizacaoFormatada = (tool.cidade && tool.estado)
                ? `${tool.cidade} - ${tool.estado.toUpperCase()}`
                : "Localização não informada";

            const card = document.createElement("article");
            card.className = "tool-card";
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

            container.appendChild(card);
        }

    } catch (error) {
        console.error(error);
        container.innerHTML = "<p>Não foi possível carregar as ferramentas em destaque.</p>";
    }
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

let nearbyMap = null;
let nearbyMapMarkersLayer = null;
let nearbyMapLoaded = false;

const NEARBY_RADIUS_KM = 10;

function setupNearbyMapButton() {
    const openMapBtn = document.getElementById("openNearbyMapBtn");
    const refreshMapBtn = document.getElementById("refreshNearbyMapBtn");

    if (openMapBtn) {
        openMapBtn.addEventListener("click", async () => {
            const mapSection = document.getElementById("nearbyMapSection");

            if (mapSection) {
                mapSection.classList.remove("hidden");
                mapSection.scrollIntoView({ behavior: "smooth", block: "start" });
            }

            await loadNearbyToolsMap();
        });
    }

    if (refreshMapBtn) {
        refreshMapBtn.addEventListener("click", async () => {
            await loadNearbyToolsMap(true);
        });
    }
}

async function loadNearbyToolsMap(forceReload = false) {
    const message = document.getElementById("nearbyMapMessage");
    const list = document.getElementById("nearbyToolsList");

    if (nearbyMapLoaded && !forceReload) {
        setTimeout(() => {
            if (nearbyMap) {
                nearbyMap.invalidateSize();
            }
        }, 250);
        return;
    }

    const user = JSON.parse(localStorage.getItem("user"));

    if (!user || !user.id) {
        message.textContent = "Entre na sua conta para buscar ferramentas próximas ao seu endereço principal.";
        list.innerHTML = "";
        return;
    }

    try {
        message.textContent = "Solicitando sua localização pelo navegador...";
        list.innerHTML = "";

        const userLocation = await getBrowserLocation();

        if (!userLocation) {
            message.textContent = "Não foi possível acessar sua localização. Permita o acesso à localização no navegador e tente novamente.";
            return;
        }

        message.textContent = "Buscando ferramentas próximas da sua localização atual...";

        const response = await fetch("/tools");

        if (!response.ok) {
            throw new Error("Erro ao buscar ferramentas.");
        }

        const tools = await response.json();

        const nearbyTools = [];

        for (const tool of tools) {
            if (!tool.ativo || !tool.disponivel) {
                continue;
            }

            if (Number(tool.ownerId) === Number(user.id)) {
                continue;
            }

            const toolAddressText = buildToolAddressText(tool);

            if (!toolAddressText) {
                continue;
            }

            const toolLocation = await geocodeAddress(toolAddressText);

            if (!toolLocation) {
                continue;
            }

            const distanceKm = calculateDistanceKm(
                userLocation.lat,
                userLocation.lon,
                toolLocation.lat,
                toolLocation.lon
            );

            if (distanceKm <= NEARBY_RADIUS_KM) {
                nearbyTools.push({
                    ...tool,
                    distanceKm,
                    lat: toolLocation.lat,
                    lon: toolLocation.lon
                });
            }
        }

        nearbyTools.sort((a, b) => a.distanceKm - b.distanceKm);

        renderNearbyMap(userLocation, nearbyTools);
        renderNearbyToolsList(nearbyTools);

        if (nearbyTools.length === 0) {
            message.textContent = `Nenhuma ferramenta encontrada em um raio de ${NEARBY_RADIUS_KM} km da sua localização atual.`;
        } else {
            message.textContent = `${nearbyTools.length} ferramenta(s) encontrada(s) em até ${NEARBY_RADIUS_KM} km.`;
        }

        nearbyMapLoaded = true;

    } catch (error) {
        console.error(error);
        message.textContent = "Não foi possível carregar o mapa de ferramentas próximas.";
    }
}

function buildToolAddressText(tool) {
    const cep = formatCepForMap(tool.cep);

    const fullAddress = [
        tool.logradouro,
        tool.numero,
        tool.bairro,
        tool.cidade,
        tool.estado,
        cep,
        "Brasil"
    ]
        .filter(Boolean)
        .join(", ");

    const streetWithNumber = [
        tool.logradouro,
        tool.numero,
        tool.cidade,
        tool.estado,
        "Brasil"
    ]
        .filter(Boolean)
        .join(", ");

    const streetWithoutNumber = [
        tool.logradouro,
        tool.bairro,
        tool.cidade,
        tool.estado,
        "Brasil"
    ]
        .filter(Boolean)
        .join(", ");

    const cepOnly = cep ? `${cep}, Brasil` : "";

    if (cepOnly) return cepOnly;
    if (fullAddress) return fullAddress;
    if (streetWithNumber) return streetWithNumber;
    if (streetWithoutNumber) return streetWithoutNumber;

    return tool.localizacao ? `${tool.localizacao}, Brasil` : null;
}

async function geocodeAddress(addressText) {
    if (!addressText) return null;

    const cacheKey = `geo:${addressText}`;
    const cached = sessionStorage.getItem(cacheKey);

    if (cached) {
        return JSON.parse(cached);
    }

    const attempts = buildGeocodeAttempts(addressText);

    for (const attempt of attempts) {
        const location = await geocodeAddressOnce(attempt);

        if (location) {
            sessionStorage.setItem(cacheKey, JSON.stringify(location));
            return location;
        }

        await wait(450);
    }

    return null;
}

function buildGeocodeAttempts(addressText) {
    const cleaned = String(addressText || "")
        .replace(/\s+/g, " ")
        .trim();

    const parts = cleaned
        .split(",")
        .map(part => part.trim())
        .filter(Boolean);

    const attempts = [];

    if (cleaned) attempts.push(cleaned);

    const cepMatch = cleaned.match(/\d{5}-?\d{3}/);
    if (cepMatch) {
        attempts.push(`${cepMatch[0]}, Brasil`);
    }

    if (parts.length >= 4) {
        attempts.push(parts.slice(-4).join(", "));
    }

    if (parts.length >= 3) {
        attempts.push(parts.slice(-3).join(", "));
    }

    if (parts.length >= 2) {
        attempts.push(parts.slice(-2).join(", "));
    }

    return [...new Set(attempts)];
}

async function geocodeAddressOnce(addressText) {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");
    url.searchParams.set("countrycodes", "br");
    url.searchParams.set("q", addressText);

    console.log("Tentando geocodificar:", addressText);

    try {
        const response = await fetch(url.toString(), {
            headers: {
                "Accept": "application/json"
            }
        });

        if (!response.ok) {
            return null;
        }

        const data = await response.json();

        if (!data || data.length === 0) {
            return null;
        }

        return {
            lat: Number(data[0].lat),
            lon: Number(data[0].lon)
        };

    } catch (error) {
        console.error("Erro ao geocodificar endereço:", error);
        return null;
    }
}

function renderNearbyMap(userLocation, nearbyTools) {
    const mapElement = document.getElementById("nearbyToolsMap");

    if (!mapElement) return;

    if (!nearbyMap) {
        nearbyMap = L.map("nearbyToolsMap").setView(
            [userLocation.lat, userLocation.lon],
            13
        );

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: "&copy; OpenStreetMap"
        }).addTo(nearbyMap);

        nearbyMapMarkersLayer = L.layerGroup().addTo(nearbyMap);
    }

    nearbyMapMarkersLayer.clearLayers();

    nearbyMap.setView([userLocation.lat, userLocation.lon], 13);

    L.marker([userLocation.lat, userLocation.lon])
        .addTo(nearbyMapMarkersLayer)
        .bindPopup(`
        <strong>Sua localização atual</strong><br>
        Localização informada pelo navegador
    `);

    L.circle([userLocation.lat, userLocation.lon], {
        radius: NEARBY_RADIUS_KM * 1000,
        color: "#5b4bb7",
        fillColor: "#5b4bb7",
        fillOpacity: 0.08
    }).addTo(nearbyMapMarkersLayer);

    nearbyTools.forEach((tool, index) => {
        const marker = L.marker([tool.lat, tool.lon], {
            icon: createNearbyToolIcon(index + 1)
        })
            .addTo(nearbyMapMarkersLayer)
            .bindPopup(`
            <strong>${escapeHtmlHome(tool.nome || "Ferramenta")}</strong><br>
            ${formatCurrency(tool.valorDiaria)} / dia<br>
            ${tool.distanceKm.toFixed(1)} km de distância<br>
            <a href="/tools/page/${tool.id}">Ver ferramenta</a>
        `);

        marker.on("click", () => {
            highlightNearbyTool(tool.id);
        });
    });

    const points = [
        [userLocation.lat, userLocation.lon],
        ...nearbyTools.map(tool => [tool.lat, tool.lon])
    ];

    if (points.length > 1) {
        nearbyMap.fitBounds(points, {
            padding: [40, 40],
            maxZoom: 14
        });
    }

    setTimeout(() => {
        nearbyMap.invalidateSize();
    }, 250);
}

function renderNearbyToolsList(tools) {
    const list = document.getElementById("nearbyToolsList");

    if (!list) return;

    if (!tools || tools.length === 0) {
        list.innerHTML = "";
        return;
    }

    list.innerHTML = tools.map((tool, index) => `
        <article class="nearby-tool-item" data-tool-id="${tool.id}">
            <div class="nearby-tool-index">${index + 1}</div>

            <div class="nearby-tool-content">
                <h3>${escapeHtmlHome(tool.nome || "Ferramenta")}</h3>
                <p>${formatCurrency(tool.valorDiaria)} / dia</p>
                <p>📍 ${tool.distanceKm.toFixed(1)} km de distância</p>
            </div>

            <a href="/tools/page/${tool.id}" class="btn-details">
                Ver detalhes
            </a>
        </article>
    `).join("");
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

function wait(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

function escapeHtmlHome(value) {
    return String(value || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function formatCepForMap(cep) {
    const onlyNumbers = String(cep || "").replace(/\D/g, "");

    if (onlyNumbers.length !== 8) {
        return cep || "";
    }

    return onlyNumbers.replace(/(\d{5})(\d{3})/, "$1-$2");
}

function createNearbyToolIcon(number) {
    return L.divIcon({
        className: "nearby-tool-map-marker",
        html: `<span>${number}</span>`,
        iconSize: [34, 34],
        iconAnchor: [17, 34],
        popupAnchor: [0, -34]
    });
}

function highlightNearbyTool(toolId) {
    document.querySelectorAll(".nearby-tool-item").forEach(item => {
        item.classList.remove("active");
    });

    const item = document.querySelector(`.nearby-tool-item[data-tool-id="${toolId}"]`);

    if (item) {
        item.classList.add("active");
        item.scrollIntoView({
            behavior: "smooth",
            block: "nearest"
        });
    }
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