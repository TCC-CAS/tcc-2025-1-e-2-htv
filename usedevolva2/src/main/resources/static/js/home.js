document.addEventListener("DOMContentLoaded", async () => {
    await loadFeaturedTools();
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