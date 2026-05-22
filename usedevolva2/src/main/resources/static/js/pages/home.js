document.addEventListener("DOMContentLoaded", async () => {
    await loadFeaturedTools();
    setupNearbyMapButton();
});

async function loadFeaturedTools() {
    const container = document.getElementById("featuredToolsContainer");

    try {
        const response = await fetch("/tools");

        if (!response.ok) {
            throw new Error("Erro ao buscar ferramentas.");
        }

        const tools = await response.json();

        if (!tools || tools.length === 0) {
            container.innerHTML = "<p>Nenhuma ferramenta disponível no momento.</p>";
            return;
        }

        container.innerHTML = "";

        const featuredTools = tools.slice(0, 15);

        for (const tool of featuredTools) {
            const imageUrl = await getMainImage(tool.id);

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
                <img 
                    src="${imageUrl}" 
                    alt="${tool.nome || "Imagem da ferramenta"}" 
                    class="tool-image"
                >

                <div class="tool-info">
                    <h3>${tool.nome || "Ferramenta"}</h3>
                    <p>Categoria: ${formatCategory(tool.categoria)}</p>
                    <p><strong>${formatCurrency(tool.valorDiaria)}</strong> / dia</p>
                    <p>📍 ${tool.localizacao || "Localização não informada"}</p>

                    <a 
                        href="/tools/page/${tool.id}" 
                        class="btn-details" 
                        aria-label="Ver detalhes de ${tool.nome || "ferramenta"}"
                    >
                        Ver detalhes
                    </a>
                </div>
            `;

            container.appendChild(card);
        }

    } catch (error) {
        console.error(error);
        container.innerHTML = "<p>Não foi possível carregar as ferramentas em destaque.</p>";
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
        message.textContent = "Carregando seu endereço principal...";
        list.innerHTML = "";

        const mainAddress = await getUserMainAddress(user.id);

        if (!mainAddress) {
            message.textContent = "Você ainda não possui endereço principal cadastrado. Cadastre um endereço no perfil.";
            return;
        }

        const userAddressText = buildAddressText(mainAddress);

        message.textContent = "Localizando seu endereço no mapa...";

        const userLocation = await geocodeAddress(userAddressText);

        if (!userLocation) {
            message.textContent = "Não foi possível localizar seu endereço principal no mapa.";
            return;
        }

        message.textContent = "Buscando ferramentas próximas...";

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

        renderNearbyMap(userLocation, nearbyTools, mainAddress);
        renderNearbyToolsList(nearbyTools);

        if (nearbyTools.length === 0) {
            message.textContent = `Nenhuma ferramenta encontrada em um raio de ${NEARBY_RADIUS_KM} km do seu endereço principal.`;
        } else {
            message.textContent = `${nearbyTools.length} ferramenta(s) encontrada(s) em até ${NEARBY_RADIUS_KM} km.`;
        }

        nearbyMapLoaded = true;

    } catch (error) {
        console.error(error);
        message.textContent = "Não foi possível carregar o mapa de ferramentas próximas.";
    }
}

async function getUserMainAddress(userId) {
    const response = await fetch(`/users/${userId}/addresses`);

    if (!response.ok) {
        throw new Error("Erro ao buscar endereços do usuário.");
    }

    const addresses = await response.json();

    if (!addresses || addresses.length === 0) {
        return null;
    }

    return addresses.find(address => address.principal) || addresses[0];
}

function buildAddressText(address) {
    return [
        address.logradouro,
        address.numero,
        address.bairro,
        address.cidade,
        address.estado,
        address.cep,
        "Brasil"
    ]
        .filter(Boolean)
        .join(", ");
}

function buildToolAddressText(tool) {
    const addressParts = [
        tool.logradouro,
        tool.numero,
        tool.bairro,
        tool.cidade,
        tool.estado,
        tool.cep,
        "Brasil"
    ].filter(Boolean);

    if (addressParts.length > 2) {
        return addressParts.join(", ");
    }

    return tool.localizacao ? `${tool.localizacao}, Brasil` : null;
}

async function geocodeAddress(addressText) {
    const cacheKey = `geo:${addressText}`;
    const cached = sessionStorage.getItem(cacheKey);

    if (cached) {
        return JSON.parse(cached);
    }

    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");
    url.searchParams.set("q", addressText);

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

    const location = {
        lat: Number(data[0].lat),
        lon: Number(data[0].lon)
    };

    sessionStorage.setItem(cacheKey, JSON.stringify(location));

    await wait(350);

    return location;
}

function renderNearbyMap(userLocation, nearbyTools, mainAddress) {
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
            <strong>Seu endereço principal</strong><br>
            ${escapeHtmlHome(mainAddress.nomeIdentificacao || "Endereço principal")}
        `);

    L.circle([userLocation.lat, userLocation.lon], {
        radius: NEARBY_RADIUS_KM * 1000,
        color: "#5b4bb7",
        fillColor: "#5b4bb7",
        fillOpacity: 0.08
    }).addTo(nearbyMapMarkersLayer);

    nearbyTools.forEach(tool => {
        L.marker([tool.lat, tool.lon])
            .addTo(nearbyMapMarkersLayer)
            .bindPopup(`
                <strong>${escapeHtmlHome(tool.nome || "Ferramenta")}</strong><br>
                ${formatCurrency(tool.valorDiaria)} / dia<br>
                ${tool.distanceKm.toFixed(1)} km de distância<br>
                <a href="/tools/page/${tool.id}">Ver ferramenta</a>
            `);
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

    list.innerHTML = tools.map(tool => `
        <article class="nearby-tool-item">
            <div>
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