document.addEventListener("DOMContentLoaded", async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.id) {
        window.location.href = "/auth/login";
        return;
    }

    await loadRequests(user.id);

    const filter = document.getElementById("statusFilter");
    if (filter) {
        filter.addEventListener("change", async (e) => {
            await loadRequests(user.id, e.target.value);
        });
    }
});

async function loadRequests(ownerId, filterStatus = "ALL") {
    try {
        const response = await fetch(`/rentals/owner-list/${ownerId}`);
        if (!response.ok) throw new Error("Erro ao buscar solicitações");

        let rentals = await response.json();

        rentals = rentals.filter(r => r.status === "PENDING" || r.status === "PAID");

        // Aplica filtro do dropdown
        if (filterStatus !== "ALL") {
            rentals = rentals.filter(r => r.status === filterStatus);
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
    if (!rentals.length) {
        container.innerHTML = `<div class="empty-message">Nenhuma solicitação encontrada.</div>`;
        return;
    }

    container.innerHTML = rentals.map(r => `
        <article class="request-card">
            <div class="card-header">
                <div>
                    <h3>${r.toolName}</h3>
                    <span class="date">Pedido em ${formatDate(r.startDate)}</span>
                </div>
                <span class="badge ${getStatusBadgeClass(r.status)}">${translateStatus(r.status)}</span>
            </div>

            <div class="card-body">
                <div class="rental-image-container">
                    <img src="${r.toolImage}" class="rental-image" alt="${r.toolName}">
                </div>
                <div class="info-line"><strong>Solicitante:</strong> ${r.renterName}</div>
                <div class="info-line"><strong>Período:</strong> ${formatDate(r.startDate)} até ${formatDate(r.endDate)}</div>
                <div class="info-line"><strong>Valor estimado:</strong> ${formatCurrency(r.totalValue)}</div>
                ${r.message ? `<div class="requester-msg">"${r.message}"</div>` : ""}
            </div>

            <div class="card-footer">
                <button class="btn btn-reject" onclick="rejectRental(${r.rentalId})">Recusar</button>
                <button class="btn btn-approve" onclick="approveRental(${r.rentalId})">Aceitar</button>
            </div>
        </article>
    `).join("");
}

async function approveRental(rentalId) {
    const user = JSON.parse(localStorage.getItem("user"));
    try {
        const response = await fetch(`/rentals/${rentalId}/approval`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ownerId: user.id, approved: true })
        });

        if (!response.ok) {
            const text = await response.text();
            console.error("Erro ao aprovar:", text);
            alert("Erro ao aprovar o aluguel. Veja o console.");
            return;
        }

        await loadRequests(user.id);
    } catch (err) {
        console.error(err);
        alert("Erro de rede ao aprovar o aluguel");
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

        if (!response.ok) {
            const text = await response.text();
            console.error("Erro ao recusar:", text);
            alert("Erro ao recusar o aluguel. Veja o console.");
            return;
        }

        await loadRequests(user.id);
    } catch (err) {
        console.error(err);
        alert("Erro de rede ao recusar o aluguel");
    }
}

// Funções utilitárias
function translateStatus(status) {
    const map = {
        PENDING: "Pendente",
        ACCEPTED: "Aceito",
        PAID: "Aguardando aceitação",
        IN_USE: "Em andamento",
        RETURNED: "Finalizado",
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
        RETURNED: "badge-finished",
        CANCELLED: "badge-rejected"
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