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

    let allTools = [];
    let currentSearchTerm = "";

    if (!resultsGrid || !searchSummary) {
        return;
    }

    loadParamsFromUrl();
    loadTools();

    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener("click", () => {
            updateUrlFromFilters();
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

            if (headerSearchInput) {
                headerSearchInput.value = "";
            }

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

            const response = await fetch("/tools");

            if (!response.ok) {
                throw new Error("Erro ao buscar ferramentas.");
            }

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

        const filteredTools = allTools.filter((tool) => {
            const nome = normalizeText(tool.nome);
            const descricao = normalizeText(tool.descricao);
            const toolCategoria = normalizeText(tool.categoria);
            const toolEstado = normalizeText(tool.estadoConservacao);
            const valorDiaria = Number(tool.valorDiaria || 0);

            const matchBusca =
                !busca ||
                nome.includes(busca) ||
                descricao.includes(busca);

            const matchCategoria =
                !categoria ||
                toolCategoria === categoria;

            const matchEstado =
                !estadoConservacao ||
                toolEstado === estadoConservacao;

            const matchValorMinimo =
                valorMinimo === null ||
                valorDiaria >= valorMinimo;

            const matchValorMaximo =
                valorMaximo === null ||
                valorDiaria <= valorMaximo;

            return (
                matchBusca &&
                matchCategoria &&
                matchEstado &&
                matchValorMinimo &&
                matchValorMaximo
            );
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

            const card = document.createElement("article");
            card.className = "tool-card";

            card.innerHTML = `
                <div class="tool-image-wrapper">
                    <img 
                        src="${imageUrl}" 
                        alt="${escapeHtml(tool.nome || "Imagem da ferramenta")}" 
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
                        ${formatCurrency(tool.valorDiaria)} <span>/dia</span>
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
            console.error("Erro ao buscar imagem:", error);
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
        const params = new URLSearchParams();

        const busca = currentSearchTerm.trim();
        const categoria = categoriaSelect.value;
        const estadoConservacao = estadoConservacaoSelect.value;
        const valorMinimo = valorMinimoInput.value;
        const valorMaximo = valorMaximoInput.value;

        if (busca) params.append("busca", busca);
        if (categoria) params.append("categoria", categoria);
        if (estadoConservacao) params.append("estadoConservacao", estadoConservacao);
        if (valorMinimo) params.append("valorMinimo", valorMinimo);
        if (valorMaximo) params.append("valorMaximo", valorMaximo);

        const queryString = params.toString();

        window.history.pushState(
            {},
            "",
            queryString ? `/tools/tools-list?${queryString}` : "/tools/tools-list"
        );
    }

    function loadParamsFromUrl() {
        const params = new URLSearchParams(window.location.search);

        const busca = params.get("busca");
        const categoria = params.get("categoria");
        const estadoConservacao = params.get("estadoConservacao");
        const valorMinimo = params.get("valorMinimo");
        const valorMaximo = params.get("valorMaximo");

        if (busca) {
            currentSearchTerm = busca;

            if (headerSearchInput) {
                headerSearchInput.value = busca;
            }
        }

        if (categoria) categoriaSelect.value = categoria;
        if (estadoConservacao) estadoConservacaoSelect.value = estadoConservacao;
        if (valorMinimo) valorMinimoInput.value = valorMinimo;
        if (valorMaximo) valorMaximoInput.value = valorMaximo;
    }

    function normalizeText(value) {
        if (!value) return "";

        return String(value)
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim();
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

        const normalized = normalizeText(category);

        return categories[normalized] || category;
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