document.addEventListener("DOMContentLoaded", async () => {
    const user = JSON.parse(localStorage.getItem("user"));

    // Se o usuário não estiver logado, redireciona para o login
    if (!user || !user.id) {
        showToast("Você precisa estar logado para ver seus favoritos.");
        window.location.href = "/auth/login";
        return;
    }

    await loadFavorites(user.id);
});

async function loadFavorites(userId) {
    const grid = document.querySelector(".favorites-grid");
    const countContainer = document.querySelector(".favorite-count");

    if (!grid || !countContainer) return;

    try {
        grid.innerHTML = `<div class="loading-message">Carregando seus favoritos...</div>`;

        const response = await fetch(`/favorites/user/${userId}`);
        if (!response.ok) throw new Error("Erro ao carregar favoritos.");

        const tools = await response.json();

        // Atualiza o contador no topo da tela
        countContainer.textContent = tools.length === 1
            ? "1 Ferramenta salva"
            : `${tools.length} Ferramentas salvas`;

        if (!tools || tools.length === 0) {
            grid.innerHTML = `
                <div class="empty-results" style="grid-column: 1/-1; text-align: center; padding: 3rem 1rem;">
                    <h2>Sua lista está vazia</h2>
                    <p>Explore as ferramentas disponíveis e clique no coração para salvá-las aqui!</p>
                    <a href="/tools/tools-list" class="btn-primary" style="display: inline-block; margin-top: 1rem; text-decoration: none;">Buscar Ferramentas</a>
                </div>
            `;
            return;
        }

        grid.innerHTML = ""; // Limpa o loading

        for (const tool of tools) {
            const imageUrl = await getMainImage(tool.id);
            const card = document.createElement("article");
            card.className = "tool-card";
            card.setAttribute("data-id", tool.id);

            // Verifica disponibilidade
            const isAvailable = tool.disponivel && !tool.bloqueadaTemporariamente;
            const badgeClass = isAvailable ? "available" : "unavailable";
            const badgeText = isAvailable ? "Disponível" : "Indisponível";

            card.innerHTML = `
                <div class="card-image-wrapper">
                    <img src="${imageUrl}" alt="${escapeHtml(tool.nome)}" class="tool-image" loading="lazy">
                    <span class="badge ${badgeClass}">${badgeText}</span>
                </div>
                
                <div class="card-content">
                    <div class="card-header">
                        <h3>${escapeHtml(tool.nome)}</h3>
                        <div class="price-box">
                            <p class="price">${formatCurrency(tool.valorDiaria)}</p>
                            <span class="price-suffix">/ dia</span>
                        </div>
                    </div>
                    
                    <div class="card-details">
                        <span class="detail-item">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>
                            ${escapeHtml(formatCategory(tool.categoria))}
                        </span>
                        <span class="detail-item">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                            ${escapeHtml(tool.cidade || "Localização não informada")}
                        </span>
                    </div>

                    <div class="card-actions">
                        <a href="/tools/page/${tool.id}" class="btn-primary">Ver Detalhes</a>
                        <button class="btn-remove" onclick="handleRemoveFavorite(${tool.id})">
                            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            Remover dos favoritos
                        </button>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        }

    } catch (error) {
        console.error(error);
        grid.innerHTML = `<div class="error-message">Não foi possível carregar seus favoritos no momento.</div>`;
    }
}

async function handleRemoveFavorite(toolId) {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.id) return;

    try {
        const response = await fetch(`/favorites?userId=${user.id}&toolId=${toolId}`, {
            method: "DELETE"
        });

        if (!response.ok) throw new Error();

        showToast("Ferramenta removida dos favoritos.", "success");

        await loadFavorites(user.id);

    } catch (error) {
        console.error(error);
        showToast("Não foi possível remover a ferramenta dos favoritos.");
    }
}

async function getMainImage(toolId) {
    try {
        const response = await fetch(`/tools/${toolId}/images`);
        if (!response.ok) return "/assets/tool-placeholder.svg";

        const images = await response.json();
        if (!images || images.length === 0) return "/assets/tool-placeholder.svg";

        const mainImage = images.find(image => image.principal) || images[0];
        return mainImage.filePath || "/assets/tool-placeholder.svg";
    } catch (error) {
        return "/assets/tool-placeholder.svg";
    }
}

function formatCurrency(value) {
    return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
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
    return categories[category.toLowerCase().trim()] || category;
}

function escapeHtml(value) {
    if (!value) return "";
    return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}