document.addEventListener("DOMContentLoaded", async () => {
    const savedUser = JSON.parse(localStorage.getItem("user"));

    if (!savedUser || !savedUser.id) {
        window.location.href = "/auth/login";
        return;
    }

    try {
        const userResponse = await fetch(`/users/${savedUser.id}`);
        if (!userResponse.ok) throw new Error("Erro ao buscar dados do usuário.");
        const user = await userResponse.json();

        localStorage.setItem("user", JSON.stringify(user));

        const toolsResponse = await fetch(`/tools/owner/${user.id}`);
        if (!toolsResponse.ok) throw new Error("Erro ao carregar ferramentas.");
        const tools = await toolsResponse.json();

        renderStats(tools);
        await renderTools(tools, user.id);

        const activeToolsCount = tools.filter(tool => tool.ativo).length;
        const plano = user.plano || "FREE";
        let limite = 3;
        if (plano === "PRATA") limite = 30;
        if (plano === "OURO") limite = 100;

        const currentPlanEl = document.getElementById("currentPlan");
        if (currentPlanEl) {
            currentPlanEl.textContent = plano;
        }

        const counterEl = document.getElementById("toolsCounter");
        if (counterEl) {
            counterEl.textContent = `${activeToolsCount}/${limite}`;
        }

        if (activeToolsCount > limite) {
            mostrarAvisoLimiteExcedido(activeToolsCount, limite, plano);
        }

    } catch (error) {
        console.error("Erro ao carregar a página de ferramentas:", error);
    }
});

function renderStats(tools) {
    const total = tools.length;
    const disponiveis = tools.filter(tool => tool.disponivel && !tool.bloqueadaTemporariamente).length;
    const bloqueadas = tools.filter(tool => tool.bloqueadaTemporariamente).length;
    const alugadas = tools.filter(tool => !tool.disponivel && !tool.bloqueadaTemporariamente).length;

    const user = JSON.parse(localStorage.getItem("user"));
    const planoUsuario = user?.plano || "FREE";
    const limitePlano = getToolLimitByPlan(planoUsuario);

    const totalToolsEl = document.getElementById("totalTools");
    const planLimitEl = document.getElementById("planLimit");

    totalToolsEl.textContent = total;
    planLimitEl.textContent = ` / ${limitePlano}`;

    const antigoAvisoInline = document.getElementById("inlineLimitWarning");
    if (antigoAvisoInline) antigoAvisoInline.remove();

    if (total > limitePlano) {
        totalToolsEl.style.color = "#DC2626";
        planLimitEl.style.color = "#DC2626";

        const avisoInline = document.createElement("span");
        avisoInline.id = "inlineLimitWarning";
        avisoInline.style.color = "#DC2626";
        avisoInline.style.fontSize = "0.85rem";
        avisoInline.style.fontWeight = "bold";
        avisoInline.style.marginLeft = "8px";
        avisoInline.textContent = "⚠️ Limite Excedido (Anúncios ocultados no Marketplace)";

        planLimitEl.after(avisoInline);
    } else {
        totalToolsEl.style.color = "";
        planLimitEl.style.color = "";
    }

    const planBadge = document.getElementById("planBadge");
    if (planBadge) {
        planBadge.textContent = `Plano: ${planoUsuario}`;
        if (planoUsuario === "OURO") planBadge.style.color = "#D97706";
        else if (planoUsuario === "PRATA") planBadge.style.color = "#4B5563";
        else planBadge.style.color = "#2563EB";
    }

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

        const avisoModeracaoHtml = tool.moderada
            ? `
            <div style="
                margin-top: 12px;
                padding: 12px;
                background: #FEF2F2;
                border: 1px solid #FCA5A5;
                border-left: 5px solid #DC2626;
                border-radius: 8px;
                color: #991B1B;
            ">
                <strong style="display:block; margin-bottom:6px;">
                    🚫 Ferramenta desativada pela moderação
                </strong>

                <span style="font-size:0.9rem;">
                    Motivo: ${tool.motivoModeracao || "Violação das políticas da plataforma."}
                </span>

                ${
                tool.moderadaEm
                    ? `
                        <div style="margin-top:6px; font-size:0.8rem; opacity:0.8;">
                            ${new Date(tool.moderadaEm).toLocaleString('pt-BR')}
                        </div>
                        `
                    : ''
            }
            </div>
            `
            : "";

        const avisoExpiradoHtml = status.expirada
            ? `
            <div style="
                margin-top: 12px;
                padding: 8px 12px;
                background-color: #FEF2F2;
                border: 1px solid #FEE2E2;
                border-radius: 6px;
                color: #DC2626;
                font-size: 0.85rem;
                font-weight: 500;
                display: flex;
                align-items: center;
                gap: 6px;
            ">
                ⚠️ A data de disponibilidade passou. Você precisa editar este anúncio.
            </div>
            `
            : "";

        container.innerHTML += `
            <article class="tool-card" ${status.expirada ? 'style="border-color: #FCA5A5;"' : ''}>

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

                    <div class="tool-category">
                        ${tool.categoria || "Sem categoria"}
                    </div>

                    <h3 class="tool-title">
                        ${tool.nome}
                    </h3>

                    <div class="tool-details">

                        <div class="detail-item">
                            <strong>Estado</strong>
                            <span>${tool.estadoConservacao || "Não informado"}</span>
                        </div>

                        <div class="detail-item">
                            <strong>Disponibilidade</strong>
                            <span ${status.expirada ? 'style="color: #DC2626; font-weight: bold;"' : ''}>
                                ${status.label}
                            </span>
                        </div>

                    </div>

                    ${avisoExpiradoHtml}

                    ${avisoModeracaoHtml}

                    <div class="price-tag" style="margin-top: 12px;">
                        R$ ${formatMoney(tool.valorDiaria)}
                        <span>/ dia</span>
                    </div>

                </div>

                <div class="tool-actions">

                    <button class="action-btn"
                            title="Ver Anúncio Público"
                            onclick="viewTool(${tool.id})">
                        Ver
                    </button>

                    <button class="action-btn"
                            title="Editar"
                            onclick="editTool(${tool.id})"
                            ${status.expirada ? 'style="background-color: #DC2626; color: white;"' : ''}>
                        Editar
                    </button>

                    <button class="action-btn"
                            title="Bloquear ou reativar"
                            onclick="toggleBlockTool(${tool.id}, ${ownerId}, ${!tool.bloqueadaTemporariamente})"
                            ${tool.moderada ? 'disabled' : ''}>
                        ${tool.bloqueadaTemporariamente ? "Reativar" : "Bloquear"}
                    </button>

                    <button class="action-btn danger"
                            title="Excluir"
                            onclick="deleteTool(${tool.id}, ${ownerId})"
                            ${tool.moderada ? 'disabled' : ''}>
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

    if (tool.moderada) {
        return {
            label: "Desativada pela Moderação",
            className: "badge-blocked"
        };
    }

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

    if (tool.dataFimDisponibilidade) {
        const dataExpiracao = new Date(tool.dataFimDisponibilidade);
        const hoje = new Date();

        hoje.setHours(0, 0, 0, 0);
        dataExpiracao.setHours(0, 0, 0, 0);

        if (dataExpiracao < hoje) {
            return {
                label: "Expirada",
                className: "badge-expired",
                expirada: true
            };
        }
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
            const errorText = await response.text();
            throw new Error(errorText || "Erro ao alterar status.");
        }

        window.location.reload();

    } catch (error) {
        console.error(error);
        alert(error.message || "Não foi possível alterar o status da ferramenta.");
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
    window.location.href = `/tools/page/${toolId}`;
}

function editTool(toolId) {
    window.location.href = `/users/edit-tool/${toolId}`;
}

function getToolLimitByPlan(plano) {
    switch (plano) {
        case "FREE": return 3;
        case "PRATA": return 30;
        case "OURO": return 100;
        default: return 0;
    }
}

function mostrarAvisoLimiteExcedido(ativas, limite, plano) {
    const container = document.getElementById("warningContainer") || document.body;

    if (document.getElementById("limitAlertBanner")) return;

    const alertBanner = document.createElement("div");
    alertBanner.id = "limitAlertBanner";
    alertBanner.className = "alert-banner danger";
    alertBanner.innerHTML = `
        <div class="alert-content">
            <strong>⚠️ Atenção: Limite do plano excedido!</strong>
            <p>Você possui <strong>${ativas}</strong> ferramentas ativas, mas o seu plano <strong>${plano}</strong> permite apenas <strong>${limite}</strong>. Desative ou exclua alguma ferramenta para voltar ao limite do seu plano.</p>
        </div>
    `;

    container.prepend(alertBanner);
}
