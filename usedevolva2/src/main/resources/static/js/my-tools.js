document.addEventListener("DOMContentLoaded", async () => {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user || !user.id) {
        window.location.href = "/auth/login";
        return;
    }

    try {
        const response = await fetch(`/tools/owner/${user.id}`);

        if (!response.ok) {
            throw new Error("Erro ao buscar ferramentas.");
        }

        const tools = await response.json();

        renderStats(tools);
        await renderTools(tools, user.id);

    } catch (error) {
        console.error(error);
        alert("Não foi possível carregar suas ferramentas.");
    }
});

function renderStats(tools) {
    const total = tools.length;
    const disponiveis = tools.filter(tool => tool.disponivel && !tool.bloqueadaTemporariamente).length;
    const bloqueadas = tools.filter(tool => tool.bloqueadaTemporariamente).length;
    const alugadas = tools.filter(tool => !tool.disponivel && !tool.bloqueadaTemporariamente).length;

    document.getElementById("totalTools").textContent = total;
    document.getElementById("availableTools").textContent = disponiveis;
    document.getElementById("rentedTools").textContent = alugadas;
    document.getElementById("blockedTools").textContent = bloqueadas;
}

async function renderTools(tools, ownerId) {
    const container = document.getElementById("toolsContainer");

    container.innerHTML = "";

    if (!tools || tools.length === 0) {
        container.innerHTML = `
            <p>Você ainda não cadastrou nenhuma ferramenta.</p>
        `;
        return;
    }

    for (const tool of tools) {
        const images = await fetchToolImages(tool.id);
        const mainImage = images.length > 0 ? images[0].filePath : null;
        const status = getToolStatus(tool);

        container.innerHTML += `
            <article class="tool-card">
                <div class="tool-image-container">
                    ${
            mainImage
                ? `<img src="${mainImage}" alt="${tool.nome}" class="tool-image">`
                : `<div class="tool-image-placeholder">Sem imagem</div>`
        }

                    <span class="tool-badge ${status.className}">
                        ${status.label}
                    </span>
                </div>

                <div class="tool-info">
                    <div class="tool-category">${tool.categoria || "Sem categoria"}</div>

                    <h3 class="tool-title">${tool.nome}</h3>

                    <div class="tool-details">
                        <div class="detail-item">
                            <strong>Estado</strong>
                            <span>${tool.estadoConservacao || "Não informado"}</span>
                        </div>

                        <div class="detail-item">
                            <strong>Disponibilidade</strong>
                            <span>${status.label}</span>
                        </div>
                    </div>

                    <div class="price-tag">
                        R$ ${formatMoney(tool.valorDiaria)} <span>/ dia</span>
                    </div>
                </div>

                <div class="tool-actions">
                    <button class="action-btn" title="Ver Anúncio Público" onclick="viewTool(${tool.id})">
                        Ver
                    </button>

                    <button class="action-btn" title="Editar" onclick="editTool(${tool.id})">
                        Editar
                    </button>

                    <button class="action-btn" title="Bloquear ou reativar" onclick="toggleBlockTool(${tool.id}, ${ownerId}, ${!tool.bloqueadaTemporariamente})">
                        ${tool.bloqueadaTemporariamente ? "Reativar" : "Bloquear"}
                    </button>

                    <button class="action-btn danger" title="Excluir" onclick="deleteTool(${tool.id}, ${ownerId})">
                        Excluir
                    </button>
                </div>
            </article>
        `;
    }
}

async function fetchToolImages(toolId) {
    try {
        const response = await fetch(`/tools/${toolId}/images`);

        if (!response.ok) {
            return [];
        }

        return await response.json();

    } catch (error) {
        console.error(error);
        return [];
    }
}

function getToolStatus(tool) {
    if (tool.bloqueadaTemporariamente) {
        return {
            label: "Bloqueada",
            className: "badge-blocked"
        };
    }

    if (!tool.disponivel) {
        return {
            label: "Em uso",
            className: "badge-rented"
        };
    }

    return {
        label: "Disponível",
        className: "badge-available"
    };
}

function formatMoney(value) {
    return Number(value || 0).toFixed(2).replace(".", ",");
}

async function toggleBlockTool(toolId, ownerId, blockValue) {
    try {
        const response = await fetch(`/tools/${toolId}/owner/${ownerId}/block`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                bloqueadaTemporariamente: blockValue
            })
        });

        if (!response.ok) {
            throw new Error("Erro ao alterar status.");
        }

        window.location.reload();

    } catch (error) {
        console.error(error);
        alert("Não foi possível alterar o status da ferramenta.");
    }
}

async function deleteTool(toolId, ownerId) {
    const confirmDelete = confirm("Tem certeza que deseja excluir esta ferramenta?");

    if (!confirmDelete) return;

    try {
        const response = await fetch(`/tools/${toolId}/owner/${ownerId}`, {
            method: "DELETE"
        });

        if (!response.ok) {
            throw new Error("Erro ao excluir ferramenta.");
        }

        window.location.reload();

    } catch (error) {
        console.error(error);
        alert("Não foi possível excluir a ferramenta.");
    }
}

function viewTool(toolId) {
    window.location.href = `/tools/${toolId}`;
}

function editTool(toolId) {
    window.location.href = `/users/edit-tool/${toolId}`;
}