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
        const response = await fetch(`/rentals/renter-list/${ownerId}`);

        if (!response.ok) {
            throw new Error("Erro ao buscar solicitações");
        }

        const rentals = await response.json();

        renderRequests(rentals);

    } catch (err) {
        console.error(err);
    }
}

function renderRequests(rentals) {

    const container = document.getElementById("requestsGrid");

    if (!rentals.length) {

        container.innerHTML = `
            <div class="empty-message">
                Nenhuma solicitação encontrada.
            </div>
        `;

        return;
    }

    container.innerHTML = rentals.map(rental => `

        <article class="request-card">

            <div class="card-header">
                <div>
                    <h3>${rental.toolName}</h3>
                    <span class="date">
                        Pedido em ${formatDate(rental.createdAt)}
                    </span>
                </div>

                <span class="badge ${getBadgeClass(rental.status)}">
                    ${translateStatus(rental.status)}
                </span>
            </div>

            <div class="card-body">

                <div class="info-line">
                    <strong>Solicitante:</strong>
                    <span>${rental.renterName}</span>
                </div>

                <div class="info-line">
                    <strong>Período:</strong>
                    <span>${formatDate(rental.startDate)} até ${formatDate(rental.endDate)}</span>
                </div>

                <div class="info-line">
                    <strong>Valor estimado:</strong>
                    <span>${formatCurrency(rental.totalValue)}</span>
                </div>

                ${rental.message ? `
                    <div class="requester-msg">
                        "${rental.message}"
                    </div>
                ` : ""}

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
            <button class="btn btn-reject"
                onclick="rejectRental(${rental.id})">
                Recusar
            </button>

            <button class="btn btn-approve"
                onclick="approveRental(${rental.id})">
                Aprovar
            </button>
        `;
    }

    if (rental.status === "ACCEPTED") {

        return `
            <button class="btn btn-outline btn-full" disabled>
                Aguardando pagamento
            </button>
        `;
    }

    if (rental.status === "PAID") {

        return `
            <button class="btn btn-outline btn-full">
                Ver aluguel ativo
            </button>
        `;
    }

    return `
        <button class="btn btn-outline btn-full">
            Ver detalhes
        </button>
    `;
}

async function approveRental(id) {

    const user = JSON.parse(localStorage.getItem("user"));

    await fetch(`/rentals/${id}/approval`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            ownerId: user.id,
            approved: true
        })
    });

    await loadRequests(user.id);
}

async function rejectRental(id) {

    const user = JSON.parse(localStorage.getItem("user"));

    await fetch(`/rentals/${id}/approval`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            ownerId: user.id,
            approved: false
        })
    });

    await loadRequests(user.id);
}

function translateStatus(status) {

    return {
        PENDING: "Solicitação enviada",
        ACCEPTED: "Aceito pelo dono",
        AWAITING_PAYMENT: "Pagamento aprovado",
        PAID: "Pago",
        IN_USE: "Em uso",
        RETURNED: "Devolvido",
        REJECTED: "Recusado",
        CANCELLED: "Cancelado"
    }[status] || status;
}

function getBadgeClass(status) {

    switch (status) {

        case "PENDING":
            return "pending";

        case "ACCEPTED":
            return "approved";

        case "REJECTED":
            return "rejected";

        case "PAID":
        case "IN_USE":
            return "active";

        default:
            return "pending";
    }
}

function formatDate(date) {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("pt-BR");
}

function formatCurrency(value) {
    return Number(value || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}
