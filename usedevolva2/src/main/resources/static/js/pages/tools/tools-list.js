document.addEventListener("DOMContentLoaded", () => {
    const resultsGrid = document.getElementById("resultsGrid");
    const searchSummary = document.getElementById("searchSummary");

    const categoriaSelect = document.getElementById("categoria");
    const estadoConservacaoSelect = document.getElementById("estadoConservacao");
    const valorMinimoInput = document.getElementById("valorMinimo");
    const valorMaximoInput = document.getElementById("valorMaximo");

    const applyFiltersBtn = document.getElementById("applyFiltersBtn");
    const clearFiltersBtn = document.getElementById("clearFiltersBtn");

    const headerSearchForm = document.getElementById("headerSearchForm");
    const headerSearchInput = document.getElementById("headerSearchInput");
    const ordenacaoSelect = document.getElementById("ordenacao");

    let userFavoriteIds = [];
    let allTools = [];
    let currentSearchTerm = "";

    if (!resultsGrid || !searchSummary) return;

    loadParamsFromUrl();
    loadTools();

    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener("click", () => {
            updateUrlFromFilters();
            applyFilters();
        });
    }

    if (ordenacaoSelect) {
        ordenacaoSelect.addEventListener("change", () => {
            applyFilters();
        });
    }

    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener("click", () => {
            currentSearchTerm = "";
            categoriaSelect.value = "";
            estadoConservacaoSelect.value = "";
            valorMinimoInput.value = "";
            valorMaximoInput.value = "";
            ordenacaoSelect.value = "recente";

            if (headerSearchInput) headerSearchInput.value = "";

            window.history.pushState({}, "", "/tools/tools-list");
            applyFilters();
        });
    }

    if (headerSearchForm && headerSearchInput) {
        headerSearchForm.addEventListener("submit", (event) => {
            event.preventDefault();
            currentSearchTerm = headerSearchInput.value.trim();
            updateUrlFromFilters();
            applyFilters();
        });
    }

    async function loadTools() {
        try {
            setLoadingState();
            const user = JSON.parse(localStorage.getItem("user"));
            if (user && user.id) {
                try {
                    const favResponse = await fetch(`/favorites/user/${user.id}`);
                    if (favResponse.ok) {
                        const favs = await favResponse.json();
                        userFavoriteIds = favs.map(f => f.id);
                    }
                } catch (e) {
                    console.error("Erro ao carregar favoritos", e);
                }
            }

            const response = await fetch("/tools");
            if (!response.ok) throw new Error("Erro ao buscar ferramentas.");

            allTools = await response.json();
            applyFilters();
        } catch (error) {
            console.error("Erro ao carregar ferramentas:", error);
            renderError();
        }
    }

    function applyFilters() {
        const busca = normalizeText(currentSearchTerm);
        const categoria = normalizeText(categoriaSelect.value);
        const estadoConservacao = normalizeText(estadoConservacaoSelect.value);
        const valorMinimo = valorMinimoInput.value ? Number(valorMinimoInput.value) : null;
        const valorMaximo = valorMaximoInput.value ? Number(valorMaximoInput.value) : null;

        let filteredTools = allTools.filter((tool) => {
            const nome = normalizeText(tool.nome);
            const descricao = normalizeText(tool.descricao);
            const toolCategoria = normalizeText(tool.categoria);
            const toolEstadoConservacao = normalizeText(tool.estadoConservacao);
            const valorDiaria = Number(tool.valorDiaria || 0);

            const matchBusca = !busca || nome.includes(busca) || descricao.includes(busca);
            const matchCategoria = !categoria || toolCategoria === categoria;
            const matchEstadoConservacao = !estadoConservacao || toolEstadoConservacao === estadoConservacao;
            const matchValorMinimo = valorMinimo === null || valorDiaria >= valorMinimo;
            const matchValorMaximo = valorMaximo === null || valorDiaria <= valorMaximo;

            return matchBusca && matchCategoria && matchEstadoConservacao && matchValorMinimo && matchValorMaximo;
        });

        // ORDENAÇÃO: Usuários Ouro sempre no topo independentemente do filtro selecionado
        filteredTools.sort((a, b) => {
            const aIsOuro = a.ownerPlano === "OURO" ? 1 : 0;
            const bIsOuro = b.ownerPlano === "OURO" ? 1 : 0;

            if (aIsOuro !== bIsOuro) {
                return bIsOuro - aIsOuro; // Ouro sobe
            }

            // Critério de desempate secundário baseado no select
            const ordemTipo = ordenacaoSelect.value;
            if (ordemTipo === "precoAsc") {
                return Number(a.valorDiaria) - Number(b.valorDiaria);
            } else if (ordemTipo === "precoDesc") {
                return Number(b.valorDiaria) - Number(a.valorDiaria);
            } else if (ordemTipo === "recente") {
                // Ordena por dataDisponibilidade ou usa o ID decrescente como fallback
                const dataA = a.dataDisponibilidade ? new Date(a.dataDisponibilidade) : (a.id || 0);
                const dataB = b.dataDisponibilidade ? new Date(b.dataDisponibilidade) : (b.id || 0);
                return dataB - dataA;
            }
            return 0;
        });

        renderTools(filteredTools);
        updateSummary(filteredTools.length);
    }

    async function renderTools(tools) {
        resultsGrid.innerHTML = "";

        if (!tools || tools.length === 0) {
            resultsGrid.innerHTML = `
                <div class="empty-results">
                    <h2>Nenhuma ferramenta encontrada</h2>
                    <p>Tente alterar os filtros ou buscar por outro termo.</p>
                </div>
            `;
            return;
        }

        for (const tool of tools) {
            const imageUrl = await getMainImage(tool.id);
            const isFavorited = userFavoriteIds.includes(tool.id);

            // CORREÇÃO DA LOCALIZAÇÃO: Monta a string dinamicamente usando cidade e estado do objeto
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
                    <img src="${imageUrl}" alt="${escapeHtml(tool.nome || "Imagem da ferramenta")}" class="tool-image">
                    
                    ${tool.ownerPlano === 'OURO' ? `
                        <span class="badge-ouro" style="position: absolute; top: 10px; left: 10px; background: #fbbf24; color: #000; font-weight: bold; font-size: 11px; padding: 4px 8px; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.2); z-index: 10; display: flex; align-items: center; gap: 4px;">
                            ⭐ Destaque
                        </span>
                    ` : ''}

                    <button type="button" class="btn-card-favorite ${isFavorited ? 'active' : ''}" data-tool-id="${tool.id}" style="position: absolute; top: 10px; right: 10px; background: rgba(255,255,255,0.85); border: none; border-radius: 50%; width: 36px; height: 36px; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 10;">
                        <svg width="20" height="20" fill="${isFavorited ? '#e02424' : 'none'}" stroke="${isFavorited ? '#e02424' : 'currentColor'}" viewBox="0 0 24 24" stroke-width="2">
                            <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                        </svg>
                    </button>
                </div>

                <div class="tool-info">
                    <span class="tool-category">${escapeHtml(formatCategory(tool.categoria))}</span>
                    <a href="/tools/page/${tool.id}" class="tool-name">${escapeHtml(tool.nome || "Ferramenta sem nome")}</a>
                    <p class="tool-description">${escapeHtml(limitText(tool.descricao || "Sem descrição disponível.", 90))}</p>
                    <div class="tool-price">${formatCurrency(tool.valorDiaria)} <span>/dia</span></div>
                    <div class="tool-meta">
                        <span>📍 ${escapeHtml(localizacaoFormatada)}</span>
                        <span class="status-available">Disponível</span>
                    </div>
                </div>
            `;

            const favBtn = card.querySelector(".btn-card-favorite");
            favBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                toggleFavoriteListCard(favBtn, tool.id);
            });

            resultsGrid.appendChild(card);
        }
    }

    async function getMainImage(toolId) {
        try {
            const response = await fetch(`/tools/${toolId}/images`);
            if (!response.ok) return "https://placehold.co/400x300/EAEAEA/676767?text=Sem+Imagem";
            const images = await response.json();
            if (!images || images.length === 0) return "https://placehold.co/400x300/EAEAEA/676767?text=Sem+Imagem";
            const mainImage = images.find(image => image.principal) || images[0];
            return mainImage.filePath || "https://placehold.co/400x300/EAEAEA/676767?text=Sem+Imagem";
        } catch (error) {
            return "https://placehold.co/400x300/EAEAEA/676767?text=Sem+Imagem";
        }
    }

    function updateSummary(total) {
        const termo = currentSearchTerm.trim();
        const categoriaTexto = categoriaSelect.options[categoriaSelect.selectedIndex]?.text || "Todas as categorias";
        if (termo && categoriaSelect.value) {
            searchSummary.textContent = `${total} resultado(s) para "${termo}" em ${categoriaTexto}.`;
            return;
        }
        if (termo) {
            searchSummary.textContent = `${total} resultado(s) para "${termo}".`;
            return;
        }
        if (categoriaSelect.value) {
            searchSummary.textContent = `${total} ferramenta(s) encontradas em ${categoriaTexto}.`;
            return;
        }
        searchSummary.textContent = `${total} ferramenta(s) disponíveis encontradas.`;
    }

    function setLoadingState() {
        resultsGrid.innerHTML = `<div class="loading-message">Carregando ferramentas...</div>`;
        searchSummary.textContent = "Buscando ferramentas disponíveis...";
    }

    function renderError() {
        resultsGrid.innerHTML = `
            <div class="empty-results">
                <h2>Não foi possível carregar as ferramentas</h2>
                <p>Verifique se o backend está rodando e tente novamente.</p>
            </div>
        `;
        searchSummary.textContent = "Erro ao carregar resultados.";
    }

    function updateUrlFromFilters() {
        const params = new URLSearchParams();
        const busca = currentSearchTerm.trim();
        const categoria = categoriaSelect.value;
        const estadoConservacao = estadoConservacaoSelect.value;
        const valorMinimo = valorMinimoInput.value;
        const valorMaximo = valorMaximoInput.value;
        const ordenacao = ordenacaoSelect.value;

        if (busca) params.append("busca", busca);
        if (categoria) params.append("categoria", categoria);
        if (estadoConservacao) params.append("estadoConservacao", estadoConservacao);
        if (valorMinimo) params.append("valorMinimo", valorMinimo);
        if (valorMaximo) params.append("valorMaximo", valorMaximo);
        if (ordenacao) params.append("ordenacao", ordenacao);

        const queryString = params.toString();
        window.history.pushState({}, "", queryString ? `/tools/tools-list?${queryString}` : "/tools/tools-list");
    }

    function loadParamsFromUrl() {
        const params = new URLSearchParams(window.location.search);
        const busca = params.get("busca");
        const categoria = params.get("categoria");
        const estadoConservacao = params.get("estadoConservacao");
        const valorMinimo = params.get("valorMinimo");
        const valorMaximo = params.get("valorMaximo");
        const ordenacao = params.get("ordenacao");

        if (busca) {
            currentSearchTerm = busca;
            if (headerSearchInput) headerSearchInput.value = busca;
        }
        if (categoria) categoriaSelect.value = categoria;
        if (estadoConservacao) estadoConservacaoSelect.value = estadoConservacao;
        if (valorMinimo) valorMinimoInput.value = valorMinimo;
        if (valorMaximo) valorMaximoInput.value = valorMaximo;
        if (ordenacao) ordenacaoSelect.value = ordenacao;
    }

    function normalizeText(value) {
        if (!value) return "";
        return String(value).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    }

    function formatCurrency(value) {
        return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    }

    function formatCategory(category) {
        if (!category) return "Não informada";
        const categories = {
            construcao: "Construção", jardinagem: "Jardinagem", eletrica: "Elétrica",
            limpeza: "Limpeza", marcenaria: "Marcenaria", outros: "Outros"
        };
        return categories[normalizeText(category)] || category;
    }

    function limitText(text, maxLength) {
        if (!text) return "";
        return text.length <= maxLength ? text : text.substring(0, maxLength) + "...";
    }

    function escapeHtml(value) {
        if (!value) return "";
        return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
    }

    async function toggleFavoriteListCard(button, toolId) {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user || !user.id) {
            alert("Você precisa estar logado para favoritar ferramentas.");
            return;
        }
        const isCurrentlyFavorite = button.classList.contains("active");
        const method = isCurrentlyFavorite ? "DELETE" : "POST";
        try {
            button.style.transform = "scale(0.8)";
            const response = await fetch(`/favorites?userId=${user.id}&toolId=${toolId}`, { method });
            if (!response.ok) throw new Error();

            if (isCurrentlyFavorite) {
                button.classList.remove("active");
                button.querySelector("svg").setAttribute("fill", "none");
                button.querySelector("svg").setAttribute("stroke", "currentColor");
                userFavoriteIds = userFavoriteIds.filter(id => id !== toolId);
            } else {
                button.classList.add("active");
                button.querySelector("svg").setAttribute("fill", "#e02424");
                button.querySelector("svg").setAttribute("stroke", "#e02424");
                userFavoriteIds.push(toolId);
            }
        } catch (err) {
            alert("Erro ao atualizar favoritos.");
        } finally {
            button.style.transform = "scale(1)";
        }
    }
});