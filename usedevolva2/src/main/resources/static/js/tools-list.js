document.addEventListener("DOMContentLoaded", () => {
    const resultsGrid = document.getElementById("resultsGrid");
    const searchSummary = document.getElementById("searchSummary");

    const buscaInput = document.getElementById("busca");
    const categoriaSelect = document.getElementById("categoria");
    const estadoConservacaoSelect = document.getElementById("estadoConservacao");
    const valorMinimoInput = document.getElementById("valorMinimo");
    const valorMaximoInput = document.getElementById("valorMaximo");

    const applyFiltersBtn = document.getElementById("applyFiltersBtn");
    const clearFiltersBtn = document.getElementById("clearFiltersBtn");

    const headerSearchForm = document.getElementById("headerSearchForm");
    const headerSearchInput = document.getElementById("headerSearchInput");

    if (!resultsGrid || !searchSummary) {
        return;
    }

    loadParamsFromUrl();
    loadTools();

    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener("click", () => {
            updateUrlFromFilters();
            loadTools();
        });
    }

    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener("click", () => {
            buscaInput.value = "";
            categoriaSelect.value = "";
            estadoConservacaoSelect.value = "";
            valorMinimoInput.value = "";
            valorMaximoInput.value = "";

            if (headerSearchInput) {
                headerSearchInput.value = "";
            }

            window.history.pushState({}, "", "/tools/tools-list");
            loadTools();
        });
    }

    if (headerSearchForm && headerSearchInput) {
        headerSearchForm.addEventListener("submit", (event) => {
            event.preventDefault();

            buscaInput.value = headerSearchInput.value.trim();

            updateUrlFromFilters();
            loadTools();
        });
    }

    async function loadTools() {
        try {
            setLoadingState();

            const queryString = buildQueryString();
            const response = await fetch(`/tools/search${queryString}`);

            if (!response.ok) {
                throw new Error("Erro ao buscar ferramentas.");
            }

            const tools = await response.json();

            await renderTools(tools);
            updateSummary(tools.length);

        } catch (error) {
            console.error("Erro na busca de ferramentas:", error);
            renderError();
        }
    }

    function buildQueryString() {
        const params = new URLSearchParams();

        const busca = buscaInput.value.trim();
        const categoria = categoriaSelect.value;
        const estadoConservacao = estadoConservacaoSelect.value;
        const valorMinimo = valorMinimoInput.value;
        const valorMaximo = valorMaximoInput.value;

        if (busca) params.append("busca", busca);
        if (categoria) params.append("categoria", categoria);
        if (estadoConservacao) params.append("estadoConservacao", estadoConservacao);
        if (valorMinimo) params.append("valorMinimo", valorMinimo);
        if (valorMaximo) params.append("valorMaximo", valorMaximo);

        params.append("disponivel", "true");

        const queryString = params.toString();

        return queryString ? `?${queryString}` : "";
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
            const valorFormatado = formatCurrency(tool.valorDiaria);

            const card = document.createElement("article");
            card.className = "tool-card";

            card.innerHTML = `
                <div class="tool-image-wrapper">
                    <img 
                        src="${imageUrl}" 
                        alt="${escapeHtml(tool.nome || "Ferramenta")}" 
                        class="tool-image"
                    >
                </div>

                <div class="tool-info">
                    <span class="tool-category">
                        ${escapeHtml(formatCategory(tool.categoria))}
                    </span>

                    <a href="/tools/page/${tool.id}" class="tool-name">
                        ${escapeHtml(tool.nome || "Ferramenta sem nome")}
                    </a>

                    <p class="tool-description">
                        ${escapeHtml(limitText(tool.descricao || "Sem descrição disponível.", 90))}
                    </p>

                    <div class="tool-price">
                        ${valorFormatado} <span>/dia</span>
                    </div>

                    <div class="tool-meta">
                        <span>📍 ${escapeHtml(tool.localizacao || "Localização não informada")}</span>
                        <span class="status-available">Disponível</span>
                    </div>
                </div>
            `;

            resultsGrid.appendChild(card);
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

            return mainImage.filePath || "https://placehold.co/400x300/EAEAEA/676767?text=Sem+Imagem";

        } catch (error) {
            console.error("Erro ao buscar imagem da ferramenta:", error);
            return "https://placehold.co/400x300/EAEAEA/676767?text=Sem+Imagem";
        }
    }

    function updateSummary(total) {
        const termo = buscaInput.value.trim();
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
        resultsGrid.innerHTML = `
            <div class="loading-message">
                Carregando ferramentas...
            </div>
        `;

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
        const queryString = buildQueryString();
        window.history.pushState({}, "", `/tools/tools-list${queryString}`);
    }

    function loadParamsFromUrl() {
        const params = new URLSearchParams(window.location.search);

        const busca = params.get("busca");
        const categoria = params.get("categoria");
        const estadoConservacao = params.get("estadoConservacao");
        const valorMinimo = params.get("valorMinimo");
        const valorMaximo = params.get("valorMaximo");

        if (busca) {
            buscaInput.value = busca;

            if (headerSearchInput) {
                headerSearchInput.value = busca;
            }
        }

        if (categoria) categoriaSelect.value = categoria;
        if (estadoConservacao) estadoConservacaoSelect.value = estadoConservacao;
        if (valorMinimo) valorMinimoInput.value = valorMinimo;
        if (valorMaximo) valorMaximoInput.value = valorMaximo;
    }

    function formatCurrency(value) {
        if (value === null || value === undefined || value === "") {
            return "R$ 0,00";
        }

        return Number(value).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });
    }

    function formatCategory(category) {
        if (!category) return "Não informada";

        const categories = {
            construcao: "Construção",
            construção: "Construção",
            jardinagem: "Jardinagem",
            eletrica: "Elétrica",
            elétrica: "Elétrica",
            limpeza: "Limpeza",
            marcenaria: "Marcenaria",
            outros: "Outros"
        };

        return categories[String(category).toLowerCase()] || category;
    }

    function limitText(text, maxLength) {
        if (!text) return "";

        if (text.length <= maxLength) {
            return text;
        }

        return text.substring(0, maxLength) + "...";
    }

    function escapeHtml(value) {
        if (value === null || value === undefined) {
            return "";
        }

        return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }
});