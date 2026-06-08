document.addEventListener("DOMContentLoaded", async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.id) {
        window.location.href = "/auth/login";
        return;
    }

    await loadRequests(user.id, "ACTIVE");

    const filter = document.getElementById("statusFilter");
    if (filter) {
        filter.addEventListener("change", async (e) => {
            await loadRequests(user.id, e.target.value);
        });
    }
});

async function loadRequests(ownerId, filterStatus = "ACTIVE") {
    try {
        const response = await fetch(`/rentals/owner-list/${ownerId}`);
        if (!response.ok) throw new Error("Erro ao buscar solicitações");

        let rentals = await response.json();

        if (filterStatus === "ACTIVE") {
            rentals = rentals.filter(r => ["PENDING", "PAID", "RETURNED", "LATE_RETURNED"].includes(r.status));
        } else if (filterStatus === "HISTORY") {
            rentals = rentals.filter(r => ["FINALIZED", "CANCELLED"].includes(r.status));
        }

        const mappedRentals = rentals.map(r => ({
            rentalId: r.rentalId,
            toolId: r.toolId,
            toolName: r.toolName,
            toolImage: r.toolImage || '/images/default-tool.png',
            renterName: r.renterName,
            ownerName: r.ownerName,
            status: r.status,
            startDate: r.startDate,
            endDate: r.endDate,
            totalValue: r.totalValue,
            message: r.message || null
        }));

        renderStats(mappedRentals);
        renderRequests(mappedRentals);

    } catch (err) {
        console.error(err);
        document.getElementById("requestsGrid").innerHTML = `<p class="empty-message">Erro ao carregar solicitações.</p>`;
    }
}

function renderStats(rentals) {
    document.getElementById("totalRentals").textContent = rentals.length;
    const totalSpent = rentals.reduce((sum, r) => sum + (r.totalValue || 0), 0);
    document.getElementById("totalSpent").textContent = formatCurrency(totalSpent);
}

function renderRequests(rentals) {
    const container = document.getElementById("requestsGrid");
    if (!container) return;

    if (!rentals.length) {
        container.innerHTML = `<div class="empty-message">Nenhuma solicitação encontrada para este filtro.</div>`;
        return;
    }

    container.innerHTML = rentals.map(r => {
        const statusText = translateStatus(r.status);
        const imageUrl = r.toolImage || "/images/default-tool.png";
        let footerButtons = "";

        if (r.status === "RETURNED" || r.status === "LATE_RETURNED") {
            footerButtons = `
                <button type="button" class="rental-action-btn approve full" onclick="finalizeRental(${r.rentalId})">
                    <span class="action-icon">✓</span>
                    Confirmar e finalizar
                </button>`;
        } else if (r.status === "PENDING" || r.status === "PAID") {
            footerButtons = `
                <button type="button" class="rental-action-btn reject" onclick="rejectRental(${r.rentalId})">
                    <span class="action-icon">×</span>
                    Recusar
                </button>
                <button type="button" class="rental-action-btn approve" onclick="approveRental(${r.rentalId})">
                    <span class="action-icon">✓</span>
                    Aceitar
                </button>
            `;
        }

        const footerHtml = footerButtons
            ? `<div class="rental-request-actions">${footerButtons}</div>`
            : `<div class="rental-request-actions muted">Nenhuma ação disponível para este status.</div>`;

        const messageHtml = r.message
            ? `<p class="request-message"><strong>Mensagem:</strong> ${escapeHtml(r.message)}</p>`
            : "";

        return `
            <article class="rental-card rental-request-card">
                <div class="rental-image-container request-image-container">
                    <img
                        src="${escapeHtml(imageUrl)}"
                        class="rental-image request-image"
                        alt="${escapeHtml(r.toolName || 'Ferramenta')}"
                        loading="lazy"
                        onerror="this.onerror=null;this.src='/images/default-tool.png';this.classList.add('image-fallback');"
                    >
                    <span class="badge status-badge ${getStatusBadgeClass(r.status)}">
                        ${escapeHtml(statusText)}
                    </span>
                </div>

                <div class="rental-content request-content">
                    <div class="request-main-info">
                        <h3 class="rental-title request-title">${escapeHtml(r.toolName || 'Ferramenta sem nome')}</h3>
                        <p class="request-date">Pedido em ${formatDate(r.startDate)}</p>

                        <div class="request-info-grid">
                            <div class="request-info-item">
                                <span>Locatário</span>
                                <strong>${escapeHtml(r.renterName || 'Não informado')}</strong>
                            </div>
                            <div class="request-info-item">
                                <span>Valor total</span>
                                <strong>${formatCurrency(r.totalValue)}</strong>
                            </div>
                        </div>

                        ${messageHtml}
                    </div>

                    ${footerHtml}
                </div>
            </article>
        `;
    }).join("");
}

function getActiveFilter() {
    return document.getElementById("statusFilter")?.value || "ACTIVE";
}

async function approveRental(rentalId) {
    const user = JSON.parse(localStorage.getItem("user"));
    try {
        const response = await fetch(`/rentals/${rentalId}/approval`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ownerId: user.id, approved: true })
        });

        if (!response.ok) throw new Error(await response.text());
        await loadRequests(user.id, getActiveFilter());
    } catch (err) {
        console.error(err);
        alert("Erro ao aprovar o aluguel.");
    }
}

async function rejectRental(rentalId) {
    const user = JSON.parse(localStorage.getItem("user"));
    try {
        const response = await fetch(`/rentals/${rentalId}/approval`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ownerId: user.id, approved: false })
        });

        if (!response.ok) throw new Error(await response.text());
        await loadRequests(user.id, getActiveFilter());
    } catch (err) {
        console.error(err);
        alert("Erro ao recusar o aluguel.");
    }
}

async function finalizeRental(rentalId) {
    const user = JSON.parse(localStorage.getItem("user"));
    try {
        const response = await fetch(`/rentals/${rentalId}/finalize`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ownerId: user.id })
        });

        if (!response.ok) throw new Error(await response.text());
        await loadRequests(user.id, getActiveFilter());
    } catch (err) {
        console.error(err);
        alert("Erro de rede ao finalizar a locação");
    }
}

function translateStatus(status) {
    const map = {
        PENDING: "Pendente",
        ACCEPTED: "Aceito",
        PAID: "Aguardando aceitação",
        IN_USE: "Em andamento",
        RETURNED: "Devolvido (Aguardando Confirmação)",
        LATE_RETURNED: "Devolvido com Atraso",
        FINALIZED: "Finalizado",
        CANCELLED: "Recusado"
    };
    return map[status] || status;
}

function getStatusBadgeClass(status) {
    const map = {
        PENDING: "badge-pending",
        ACCEPTED: "badge-accepted",
        PAID: "badge-waiting",
        IN_USE: "badge-active",
        RETURNED: "badge-waiting",
        LATE_RETURNED: "badge-rejected",
        FINALIZED: "badge-finished",
        CANCELLED: "badge-rejected"
    };
    return map[status] || "badge-default";
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatDate(date) {
    if (!date) return "-";
    return new Date(date + "T00:00:00").toLocaleDateString("pt-BR");
}

function formatCurrency(value) {
    return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}