document.addEventListener("DOMContentLoaded", function () {
    // 1. VERIFICAÇÃO DE SEGURANÇA LOCAL
    const adminData = JSON.parse(localStorage.getItem("admin"));

    // Se não houver dados de admin logado, chuta o intruso de volta pro login secreto
    if (!adminData || !adminData.id) {
        alert("Acesso não autorizado. Por favor, faça login.");
        window.location.href = "/admin";
        return;
    }

    // Atualiza o cabeçalho com o nome do admin logado dinamicamente
    document.querySelector("header div style span").textContent = `Olá, ${adminData.nome}`;

    // Captura os elementos da tabela
    const tableBody = document.querySelector("#reportsTable tbody");
    const selectAll = document.getElementById('selectAll');
    const bulkActions = document.getElementById('bulkActions');

    // Inicializa a listagem de denúncias
    fetchReports();

    // 2. FUNÇÃO PARA BUSCAR AS DENÚNCIAS DO BACKEND
    async function fetchReports() {
        try {
            const response = await fetch("/reports/admin/list", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "X-Admin-Id": adminData.id // Enviando o Header que nosso interceptor exige!
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

    // 3. RENDERIZAÇÃO DINÂMICA DA TABELA
    function renderTable(reports) {
        tableBody.innerHTML = ""; // Limpa os mocks estáticos do HTML

        // Atualiza o contador de pendentes
        const pendentesCount = reports.filter(r => r.status === 'PENDING').length;
        document.querySelector(".card-header span").textContent = `${pendentesCount} Pendentes`;

        if (reports.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="9" style="text-align:center;">Nenhuma denúncia registrada no sistema.</td></tr>`;
            return;
        }

        reports.forEach(report => {
            const tr = document.createElement("tr");

            // Aplica opacidade reduzida se já estiver resolvido/arquivado
            if (report.status !== "PENDING") {
                tr.style.opacity = "0.6";
            }

            // Tradução visual e classes de badge com base no motivo da denúncia
            const isPending = report.status === "PENDING";
            const statusBadgeClass = report.status === "PENDING" ? "badge-pendente" : "badge-resolvido";
            const statusText = report.status === "PENDING" ? "Pendente" : "Resolvido";

            tr.innerHTML = `
                <td><input type="checkbox" class="row-checkbox" ${!isPending ? 'disabled' : ''}></td>
                <td><span class="badge badge-alta">🔴 Alta</span></td>
                <td><span class="badge badge-tipo-user">👤 Utilizador</span></td>
                <td>
                    <a href="#" class="preview-link">
                        #R-${report.id} <br>
                        <span style="font-size: 0.8rem; font-weight: normal; color: var(--cor-texto-medio);">
                            Locação: #${report.rentalId || 'N/A'}
                        </span>
                    </a>
                </td>
                <td><strong>${mapReason(report.reason)}</strong></td>
                <td>
                    <div class="clickable-entity" data-role="reporter">
                        <div class="avatar">${getInitials(report.reporterName)}</div>
                        <span>${report.reporterName}</span>
                    </div>
                </td>
                <td>
                    <div class="clickable-entity" data-role="reported">
                        <div class="avatar" style="background: var(--danger-bg); color: var(--danger);">${getInitials(report.reportedUserName)}</div>
                        <span>${report.reportedUserName}</span>
                    </div>
                </td>
                <td><span class="badge ${statusBadgeClass}">${statusText}</span></td>
                <td style="display: flex; gap: 4px;">
                    ${isPending ? `
                        <button class="btn-action btn-outline" data-id="${report.id}" data-action="DISMISS" style="padding: 6px; border:1px solid #ccc; border-radius:4px; background:none; cursor:pointer;" title="Ignorar / Manter">✅</button>
                        <button class="btn-action btn-danger" data-id="${report.id}" data-action="RESOLVE" style="padding: 6px; border:none; border-radius:4px; cursor:pointer;" title="Sancionar / Resolver">🚫</button>
                    ` : '-'}
                </td>
            `;

            // Vincula o evento de clique nos blocos de usuários para abrir o Modo Investigação
            tr.querySelector('[data-role="reported"]').addEventListener("click", () => {
                loadInvestigationPanel(report, "ALVO (DENUNCIADO)", report.reportedUserName);
            });
            tr.querySelector('[data-role="reporter"]').addEventListener("click", () => {
                loadInvestigationPanel(report, "DENUNCIANTE", report.reporterName);
            });

            // Vincula ações dos botões de ação direta na linha (Aprovar/Recusar denúncia)
            if (isPending) {
                tr.querySelectorAll(".btn-action").forEach(btn => {
                    btn.addEventListener("click", async function() {
                        const id = this.getAttribute("data-id");
                        const action = this.getAttribute("data-action");
                        await handleResolveReport(id, action);
                    });
                });
            }

            tableBody.appendChild(tr);
        });

        // Eventos de checkboxes de massa reconstruídos dinamicamente
        bindCheckboxEvents();
    }

    // 4. MODO INVESTIGAÇÃO DINÂMICO (RODAPÉ)
    function loadInvestigationPanel(report, roleTitle, targetName) {
        const panel = document.getElementById('investigationPanel');
        panel.style.opacity = '0';

        setTimeout(() => {
            document.getElementById('invName').innerText = targetName;
            document.getElementById('invId').innerText = `Contexto Denúncia: #R-${report.id}`;
            document.getElementById('invSubtitle').innerText = `${roleTitle} • Aberto em: ${new Date(report.createdAt).toLocaleDateString('pt-BR')}`;

            const avatarEl = document.getElementById('invAvatar');
            avatarEl.innerText = getInitials(targetName);
            avatarEl.className = 'avatar';

            const typeBadge = document.getElementById('invTypeBadge');
            typeBadge.style.display = 'inline-flex';
            typeBadge.className = 'badge badge-tipo-user';
            typeBadge.innerText = `👤 Contexto: ${mapReason(report.reason)}`;

            document.getElementById('metricLabel').innerText = "Status do Caso";
            document.getElementById('metricText').innerText = report.status;

            const metricBar = document.getElementById('metricBar');
            metricBar.style.width = report.status === "PENDING" ? "50%" : "100%";
            metricBar.style.background = report.status === "PENDING" ? "var(--warning)" : "var(--success)";

            // Insere a descrição real digitada pelo usuário na denúncia dentro da timeline
            document.getElementById('invTimeline').innerHTML = `
                <div class="timeline-item danger">
                    <strong>Relato do Denunciante:</strong><br>
                    "${report.description}"
                </div>
            `;

            // Botões de ação do painel inferior
            const actionsContainer = document.getElementById('invActions');
            if (report.status === "PENDING") {
                actionsContainer.innerHTML = `
                    <button class="btn btn-outline" id="paneDismiss" style="width: 100%; border-color: var(--warning); color: var(--warning);">🗑️ Ignorar Denúncia</button>
                    <button class="btn btn-danger" id="paneResolve" style="width: 100%;">🚫 Aplicar Sanção (Resolver)</button>
                `;

                document.getElementById("paneDismiss").addEventListener("click", () => handleResolveReport(report.id, "DISMISS"));
                document.getElementById("paneResolve").addEventListener("click", () => handleResolveReport(report.id, "RESOLVE"));
            } else {
                actionsContainer.innerHTML = `<p style="color:var(--cor-texto-medio); font-style:italic;">Esta denúncia já foi encerrada.</p>`;
            }

            panel.style.opacity = '1';
            document.getElementById('investigationSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
    }

    // 5. ENVIAR RESOLUÇÃO PARA O BACKEND
    async function handleResolveReport(reportId, action) {
        const confirmar = confirm(`Tem certeza que deseja aplicar a ação [${action === 'RESOLVE' ? 'SANCIONAR' : 'IGNORAR'}] para esta denúncia?`);
        if (!confirmar) return;

        try {
            const response = await fetch(`/reports/admin/${reportId}/resolve?action=${action}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "X-Admin-Id": adminData.id
                }
            });

            if (!response.ok) throw new Error("Falha ao atualizar denúncia.");

            alert("Denúncia atualizada com sucesso!");
            fetchReports(); // Recarrega a tabela limpa atualizada

            // Reseta o painel de investigação inferior
            document.getElementById('investigationPanel').style.opacity = '0';
            document.getElementById('invName').innerText = "Selecione um item";
        } catch (error) {
            alert(error.message);
        }
    }

    // FUNÇÕES AUXILIARES / TRADUÇÕES
    function getInitials(name) {
        if (!name) return "--";
        const parts = name.split(" ");
        if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
        return name.substring(0, 2).toUpperCase();
    }

    function mapReason(reason) {
        const reasons = {
            "COMPORTAMENTO_INADEQUADO": "Comportamento Inadequado",
            "AVARIA_PRODUTO": "Avaria na Ferramenta",
            "NAO_DEVOLVEU": "Não Devolução do Item",
            "ITEM_DEFEITUOSO": "Item Defeituoso / Perigoso",
            "SPAM": "Spam Comercial / Anúncio Falso"
        };
        return reasons[reason] || reason;
    }

    function bindCheckboxEvents() {
        const rowCheckboxes = document.querySelectorAll('.row-checkbox:not([disabled])');

        selectAll.checked = false;
        bulkActions.classList.remove('active');

        selectAll.onclick = (e) => {
            rowCheckboxes.forEach(cb => {
                cb.checked = e.target.checked;
                cb.closest('tr').classList.toggle('selected', e.target.checked);
            });
            bulkActions.classList.toggle('active', Array.from(rowCheckboxes).some(c => c.checked));
        };

        rowCheckboxes.forEach(cb => {
            cb.onchange = () => {
                cb.closest('tr').classList.toggle('selected', cb.checked);
                selectAll.checked = Array.from(rowCheckboxes).every(c => c.checked);
                bulkActions.classList.toggle('active', Array.from(rowCheckboxes).some(c => c.checked));
            };
        });
    }
});