document.addEventListener("DOMContentLoaded", async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.id) {
        window.location.href = "/auth/login";
        return;
    }

    await loadRequests(user.id);
    setupFilters();
});

async function loadRequests(ownerId) {
    try {
        const response = await fetch(`/rentals/owner-list/${ownerId}`);
        if (!response.ok) throw new Error("Erro ao buscar solicitações");

        let rentals = await response.json();

        // Filtra apenas pendentes ou pagos para aceitar/recusar
        rentals = rentals.filter(r => r.status === "PENDING" || r.status === "PAID");

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

function setupFilters() {
    const container = document.createElement("div");
    container.classList.add("filters-bar");
    container.innerHTML = `
        <label for="statusFilter">Filtrar por status:</label>
        <select id="statusFilter">
            <option value="ALL">Todos</option>
            <option value="PENDING">Pendentes</option>
            <option value="PAID">Aguardando aceitação</option>
            <option value="IN_USE">Em andamento</option>
            <option value="RETURNED">Finalizados</option>
        </select>
    `;
    document.querySelector("main").insertBefore(container, document.getElementById("requestsGrid"));

    document.getElementById("statusFilter").addEventListener("change", async (e) => {
        const user = JSON.parse(localStorage.getItem("user"));
        await loadFilteredRequests(user.id, e.target.value);
    });
}

async function loadFilteredRequests(ownerId, filterStatus) {
    const response = await fetch(`/rentals/owner-list/${ownerId}`);
    let rentals = await response.json();

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
}

function renderStats(rentals) {
    document.getElementById("totalRentals").textContent = rentals.length;
    const totalSpent = rentals.reduce((sum, r) => sum + (r.totalValue || 0), 0);
    document.getElementById("totalSpent").textContent = formatCurrency(totalSpent);
}

function renderActions(rental) {
    if (rental.status === "PENDING" || rental.status === "PAID") {
        return `
            <button class="btn btn-reject" onclick="rejectRental(${rental.rentalId})">Recusar</button>
            <button class="btn btn-approve" onclick="approveRental(${rental.rentalId})">Aceitar</button>
        `;
    }
    return `<button class="btn btn-outline btn-full" disabled>Em andamento</button>`;
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