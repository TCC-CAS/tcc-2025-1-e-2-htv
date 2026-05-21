document.addEventListener("DOMContentLoaded", async () => {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user || !user.id) {
        window.location.href = "/auth/login";
        return;
    }

    await loadRequests(user.id);
});

async function loadRequests(ownerId) {
    try {
        const response = await fetch(`/rentals/owner-list/${ownerId}`);
        if (!response.ok) throw new Error("Erro ao buscar solicitações");

        const rentals = await response.json();

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
    if (!rentals.length) {
        container.innerHTML = `<div class="empty-message">Nenhuma solicitação encontrada.</div>`;
        return;
    }

    container.innerHTML = rentals.map(rental => `
        <article class="request-card">
            <div class="card-header">
                <div>
                    <h3>${rental.toolName}</h3>
                    <span class="date">Pedido em ${formatDate(rental.startDate)}</span>
                </div>
                <span class="badge ${getStatusBadgeClass(rental.status)}">${translateStatus(rental.status)}</span>
            </div>

            <div class="card-body">
                <div class="rental-image-container">
                    <img src="${rental.toolImage}" class="rental-image" alt="${rental.toolName}">
                </div>
                <div class="info-line"><strong>Solicitante:</strong> ${rental.renterName}</div>
                <div class="info-line"><strong>Período:</strong> ${formatDate(rental.startDate)} até ${formatDate(rental.endDate)}</div>
                <div class="info-line"><strong>Valor estimado:</strong> ${formatCurrency(rental.totalValue)}</div>
                ${rental.message ? `<div class="requester-msg">"${rental.message}"</div>` : ""}
            </div>

            <div class="card-footer">
                ${renderActions(rental)}
            </div>
        </article>
    `).join("");
}

function renderActions(rental) {
    if (rental.status === "PENDING") {
        return `
            <button class="btn btn-reject" onclick="rejectRental(${rental.rentalId})">Recusar</button>
            <button class="btn btn-approve" onclick="approveRental(${rental.rentalId})">Aprovar</button>
        `;
    }
    if (rental.status === "ACCEPTED") {
        return `<button class="btn btn-outline btn-full" disabled>Aguardando pagamento</button>`;
    }
    if (rental.status === "PAID") {
        return `<button class="btn btn-outline btn-full">Ver aluguel ativo</button>`;
    }
    return `<button class="btn btn-outline btn-full">Ver detalhes</button>`;
}

async function approveRental(rentalId) {
    const user = JSON.parse(localStorage.getItem("user"));
    await fetch(`/rentals/${rentalId}/approval`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerId: user.id, approved: true })
    });
    await loadRequests(user.id);
}

async function rejectRental(rentalId) {
    const user = JSON.parse(localStorage.getItem("user"));
    await fetch(`/rentals/${rentalId}/approval`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerId: user.id, approved: false })
    });
    await loadRequests(user.id);
}

function translateStatus(status) {
    const map = {
        PENDING: "Pendente",
        ACCEPTED: "Aceito pelo dono",
        AWAITING_PAYMENT: "Aguardando pagamento",
        PAID: "Pago",
        IN_USE: "Em uso",
        RETURNED: "Devolvido",
        LATE_RETURNED: "Devolvido com atraso",
        REJECTED: "Recusado",
        CANCELLED: "Cancelado"
    };
    return map[status] || status;
}

function getStatusBadgeClass(status) {
    const map = {
        PENDING: "badge-pending",
        ACCEPTED: "badge-accepted",
        AWAITING_PAYMENT: "badge-waiting",
        PAID: "badge-paid",
        IN_USE: "badge-active",
        RETURNED: "badge-finished",
        LATE_RETURNED: "badge-late",
        REJECTED: "badge-rejected",
        CANCELLED: "badge-cancelled"
    };
    return map[status] || "badge-default";
}

function formatDate(date) {
    if (!date) return "-";
    return new Date(date + "T00:00:00").toLocaleDateString("pt-BR");
}

function formatCurrency(value) {
    return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}