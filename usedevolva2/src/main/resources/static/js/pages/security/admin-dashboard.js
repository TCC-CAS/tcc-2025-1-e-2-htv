document.addEventListener("DOMContentLoaded", function () {
    const adminData = JSON.parse(localStorage.getItem("admin"));

    if (!adminData || !adminData.id) {
        alert("Acesso não autorizado. Por favor, faça login.");
        window.location.href = "/admin";
        return;
    }

    const adminSpan = document.querySelector("header div[style] span");
    if (adminSpan) {
        adminSpan.textContent = `Olá, ${adminData.nome}`;
    }

    const tableBody = document.querySelector("#reportsTable tbody");
    const selectAll = document.getElementById('selectAll');
    const bulkActions = document.getElementById('bulkActions');

    fetchReports();

    async function fetchReports() {
        try {
            const response = await fetch("/reports/admin/list", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "X-Admin-Id": adminData.id
                }
            });
            if (!response.ok) {
                throw new Error("Erro ao carregar a lista de denúncias.");
            }

            const reports = await response.json();
            renderTable(reports);

        } catch (error) {
            console.error(error);
            tableBody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:var(--danger);">Não foi possível carregar as denúncias.</td></tr>`;
        }
    }

    function renderTable(reports) {
        tableBody.innerHTML = "";

        const pendentesCount = reports.filter(r => r.status === 'PENDING').length;
        const contadorSpan = document.querySelector(".card-header span");
        if (contadorSpan) {
            contadorSpan.textContent = `${pendentesCount} Pendentes`;
        }

        if (reports.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="9" style="text-align:center;">Nenhuma denúncia registrada no sistema.</td></tr>`;
            return;
        }

        reports.forEach(report => {
            const tr = document.createElement("tr");

            if (report.status !== "PENDING") {
                tr.style.opacity = "0.6";
            }

            const isPending = report.status === "PENDING";
            const statusBadgeClass = report.status === "PENDING" ? "badge-pendente" : "badge-resolvido";
            const statusText = report.status === "PENDING" ? "Pendente" : "Resolvido";

            const nomeDenunciado = report.reportedUserName || report.reportedName || "N/A";
            const nomeDenunciante = report.reporterName || "N/A";

            tr.innerHTML = `
                <td><input type="checkbox" class="row-checkbox" ${!isPending ? 'disabled' : ''}></td>
                <td>${getPriorityBadge(report.reason)}</td>
                <td><span class="badge badge-tipo-user">👤 Utilizador</span></td>
                <td>
                    <a href="#" class="preview-link" style="text-decoration: none; color: inherit;">
                        <strong>#R-${report.id}</strong> <br>
                        <span style="font-size: 0.8rem; color: var(--cor-texto-medio);">
                            Locação: #${report.rentalId || 'N/A'}
                        </span><br>
                        <span style="font-size: 0.75rem; color: #888; display: block; margin-top: 2px;">
                            📅 ${formatDateTime(report.createdAt)}
                        </span>
                    </a>
                </td>
                <td><strong>${mapReason(report.reason)}</strong></td>
                <td>
                    <div class="clickable-entity" data-role="reporter">
                        <div class="avatar">${getInitials(nomeDenunciante)}</div>
                        <span>${nomeDenunciante}</span>
                    </div>
                </td>
                <td>
                    <div class="clickable-entity" data-role="reported">
                        <div class="avatar" style="background: var(--danger-bg); color: var(--danger);">${getInitials(nomeDenunciado)}</div>
                        <span>${nomeDenunciado}</span>
                    </div>
                </td>
                <td><span class="badge ${statusBadgeClass}">${statusText}</span></td>
                <td style="display: flex; gap: 4px;">
                ${isPending ? `

<button class="btn-action btn-outline"
        data-id="${report.id}"
        data-action="DISMISS"
        style="padding: 6px; border:1px solid #ccc; border-radius:4px; background:none; cursor:pointer;"
        title="Ignorar denúncia">
    ✅
</button>

<button class="btn-action btn-danger"
        data-id="${report.id}"
        data-action="BLOCK_USER"
        style="padding: 6px; border:none; border-radius:4px; cursor:pointer;"
        title="Bloquear usuário">
    👤🚫
</button>

${report.toolId ? `
<button class="btn-action"
        data-id="${report.id}"
        data-action="DISABLE_TOOL"
        style="padding: 6px; border:none; border-radius:4px; cursor:pointer; background:#6f42c1; color:white;"
        title="Desativar ferramenta">
    🛠️❌
</button>
` : ''}

` : '-'}
                </td>
            `;

            tr.querySelector('[data-role="reported"]').addEventListener("click", () => {
                loadInvestigationPanel(report, "ALVO (DENUNCIADO)", nomeDenunciado);
            });
            tr.querySelector('[data-role="reporter"]').addEventListener("click", () => {
                loadInvestigationPanel(report, "DENUNCIANTE", nomeDenunciante);
            });

            if (isPending) {
                tr.querySelectorAll(".btn-action").forEach(btn => {
                    btn.addEventListener("click", async function(e) {
                        e.stopPropagation();
                        const id = this.getAttribute("data-id");
                        const action = this.getAttribute("data-action");
                        await handleResolveReport(id, action);
                    });
                });
            }

            tableBody.appendChild(tr);
        });

        bindCheckboxEvents();
    }

    async function loadInvestigationPanel(report, roleTitle, targetName) {
        const panel = document.getElementById('investigationPanel');
        if (!panel) return;

        panel.style.opacity = '0';

        let toolImageHtml = "";
        if (report.toolId) {
            try {
                const imgResponse = await fetch(`/tools/${report.toolId}/images`);
                if (imgResponse.ok) {
                    const images = await imgResponse.json();
                    if (images && images.length > 0) {
                        const mainImg = images.find(i => i.principal) || images[0];

                        toolImageHtml = `
                            <div class="timeline-item structural" style="margin-bottom: 12px; padding: 12px; background: #f8f9fa; border-left: 4px solid #6c757d; border-radius: 4px;">
                                <strong style="color: #495057;">🛠️ Ferramenta Alvo: <span style="font-weight:normal;">${report.toolName || 'N/A'} (ID #${report.toolId})</span></strong>
                                <div style="margin-top: 8px; text-align: center; background: #fff; border: 1px solid #dee2e6; padding: 8px; border-radius: 4px;">
                                    <img src="${mainImg.filePath}" alt="Imagem da Ferramenta" style="max-width: 100%; max-height: 200px; object-fit: contain; border-radius: 4px; display: block; margin: 0 auto;">
                                </div>
                            </div>
                        `;
                    }
                }
            } catch (err) {
                console.error("Erro ao buscar as imagens da ferramenta para o relatório: ", err);
            }
        }

        setTimeout(() => {
            document.getElementById('invName').innerText = targetName;
            document.getElementById('invId').innerText = `Contexto Denúncia: #R-${report.id}`;
            document.getElementById('invSubtitle').innerText = `${roleTitle} • Enviado em: ${formatDateTime(report.createdAt)}`;

            const avatarEl = document.getElementById('invAvatar');
            if (avatarEl) {
                avatarEl.innerText = getInitials(targetName);
                avatarEl.className = 'avatar';
            }

            const typeBadge = document.getElementById('invTypeBadge');
            if (typeBadge) {
                typeBadge.style.display = 'inline-flex';
                typeBadge.className = 'badge badge-tipo-user';
                typeBadge.innerText = `👤 Motivo: ${mapReason(report.reason)}`;
            }

            document.getElementById('metricLabel').innerText = "Status do Caso";
            document.getElementById('metricText').innerText = report.status;

            const metricBar = document.getElementById('metricBar');
            if (metricBar) {
                metricBar.style.width = report.status === "PENDING" ? "50%" : "100%";
                metricBar.style.background = report.status === "PENDING" ? "var(--warning)" : "var(--success)";
            }

            document.getElementById('invTimeline').innerHTML = `
                ${toolImageHtml}
                
                ${report.reportedMessages ? `
                    <div class="timeline-item" style="margin-bottom: 12px; padding: 10px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
                        <strong style="color: #856404;">💬 Mensagens Denunciadas no Chat:</strong><br>
                        <p style="font-style: italic; margin-top: 5px; white-space: pre-wrap; color: #856404;">"${report.reportedMessages}"</p>
                    </div>
                ` : ''}
                
                <div class="timeline-item danger">
                    <strong>📝 Relato Adicional do Denunciante:</strong><br>
                    <p style="margin-top: 5px; white-space: pre-wrap;">"${report.description || 'Sem descrição fornecida.'}"</p>
                </div>
            `;

            const actionsContainer = document.getElementById('invActions');
            if (actionsContainer) {
                if (report.status === "PENDING") {
                    actionsContainer.innerHTML = `

<button class="btn btn-outline"
        id="paneDismiss"
        style="width: 100%; border-color: var(--warning); color: var(--warning);">
    🗑️ Ignorar Denúncia
</button>

<button class="btn btn-danger"
        id="paneBlock"
        style="width: 100%;">
    👤🚫 Bloquear Usuário
</button>

${report.toolId ? `
<button class="btn"
        id="paneTool"
        style="width: 100%; background:#6f42c1; color:white;">
    🛠️❌ Desativar Ferramenta
</button>
` : ''}

`;

                    document.getElementById("paneDismiss")
                        .addEventListener("click", () =>
                            handleResolveReport(report.id, "DISMISS")
                        );

                    document.getElementById("paneBlock")
                        .addEventListener("click", () =>
                            handleResolveReport(report.id, "BLOCK_USER")
                        );

                    if (report.toolId) {
                        document.getElementById("paneTool")
                            .addEventListener("click", () =>
                                handleResolveReport(report.id, "DISABLE_TOOL")
                            );
                    }                } else {
                    actionsContainer.innerHTML = `<p style="color:var(--cor-texto-medio); font-style:italic;">Esta denúncia já foi encerrada.</p>`;
                }
            }

            panel.style.opacity = '1';
            const invSection = document.getElementById('investigationSection');
            if (invSection) {
                invSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 300);
    }

    async function handleResolveReport(reportId, action) {

        const actionLabels = {
            DISMISS: "ignorar esta denúncia",
            BLOCK_USER: "BLOQUEAR este usuário",
            DISABLE_TOOL: "DESATIVAR esta ferramenta"
        };

        const confirmar = confirm(
            `Tem certeza que deseja ${actionLabels[action]}?`
        );

        if (!confirmar) return;

        try {

            const response = await fetch(
                `/reports/admin/${reportId}/resolve?action=${action}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "X-Admin-Id": adminData.id
                    }
                }
            );

            if (!response.ok) {
                throw new Error("Falha ao atualizar denúncia.");
            }

            alert("Ação aplicada com sucesso!");

            fetchReports();

            const panel = document.getElementById('investigationPanel');

            if (panel) {
                panel.style.opacity = '0';
            }

            document.getElementById('invName').innerText = "Selecione um item";

        } catch (error) {
            alert(error.message);
        }
    }

    function formatDateTime(dateStr) {
        if (!dateStr) return "Data indisponível";
        const date = new Date(dateStr);
        return date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
    }

    function getPriorityBadge(reason) {
        switch (reason) {
            case "NAO_DEVOLVEU":
            case "ITEM_DEFEITUOSO":
                return `<span class="badge badge-alta" style="background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;">🔴 Alta</span>`;
            case "AVARIA_PRODUTO":
            case "COMPORTAMENTO_INADEQUADO":
                return `<span class="badge badge-media" style="background: #fff3cd; color: #856404; border: 1px solid #ffeeba;">🟡 Média</span>`;
            case "SPAM":
            default:
                return `<span class="badge badge-baixa" style="background: #cce5ff; color: #004085; border: 1px solid #b8daff;">🔵 Baixa</span>`;
        }
    }

    function getInitials(name) {
        if (!name || name === "N/A") return "--";
        const parts = name.trim().split(" ");
        if (parts.length > 1 && parts[1]) return (parts[0][0] + parts[1][0]).toUpperCase();
        return name.substring(0, 2).toUpperCase();
    }

    function mapReason(reason) {
        const reasons = {
            "COMPORTAMENTO_INADEQUADO": "Comportamento Inadequado",
            "AVARIA_PRODUTO": "Avaria na Ferramenta",
            "NAO_DEVOLVEU": "Não Devolução do Item",
            "ITEM_DEFEITUOSO": "Item Defeituoso / Perigoso",
            "SPAM": "Spam Comercial / Anúncio Falso",
            "CONTEUDO_INADEQUADO": "Nome ou Foto Inadequada da Ferramenta",
            "PRODUTO_PROIBIDO": "Produto Proibido ou Ilegal",
            "FRAUDE_GOLPE": "Suspeita de Fraude / Golpe",
            "CATEGORIA_INCORRETA": "Categoria Incorreta",
            "PERFIL_INADEQUADO": "Perfil Inadequado (Nome/Foto)"
        };
        return reasons[reason] || reason;
    }
    function bindCheckboxEvents() {
        const rowCheckboxes = document.querySelectorAll('.row-checkbox:not([disabled])');

        if (selectAll) selectAll.checked = false;
        if (bulkActions) bulkActions.classList.remove('active');

        if (selectAll) {
            selectAll.onclick = (e) => {
                rowCheckboxes.forEach(cb => {
                    cb.checked = e.target.checked;
                    cb.closest('tr').classList.toggle('selected', e.target.checked);
                });
                if (bulkActions) bulkActions.classList.toggle('active', Array.from(rowCheckboxes).some(c => c.checked));
            };
        }

        rowCheckboxes.forEach(cb => {
            cb.onchange = () => {
                cb.closest('tr').classList.toggle('selected', cb.checked);
                if (selectAll) selectAll.checked = Array.from(rowCheckboxes).every(c => c.checked);
                if (bulkActions) bulkActions.classList.toggle('active', Array.from(rowCheckboxes).some(c => c.checked));
            };
        });
    }

    const bulkIgnoreBtn = document.getElementById("bulkIgnoreBtn");
    if (bulkIgnoreBtn) {
        bulkIgnoreBtn.addEventListener("click", async () => {
            const selectedCheckboxes = document.querySelectorAll(".row-checkbox:checked");
            if (selectedCheckboxes.length === 0) return;

            if (confirm(`Deseja ignorar as ${selectedCheckboxes.length} denúncias selecionadas?`)) {
                alert("Ações de arquivamento em massa aplicadas!");
                fetchReports();
            }
        });
    }

    const bulkSanctionBtn = document.getElementById("bulkSanctionBtn");
    if (bulkSanctionBtn) {
        bulkSanctionBtn.addEventListener("click", async () => {
            const selectedCheckboxes = document.querySelectorAll(".row-checkbox:checked");
            if (selectedCheckboxes.length === 0) return;

            if (confirm(`Deseja sancionar os alvos das ${selectedCheckboxes.length} denúncias selecionadas?`)) {
                alert("Sancionamento em lote aplicado aos utilizadores!");
                fetchReports();
            }
        });
    }
});