document.addEventListener("DOMContentLoaded", async () => {

    const user =
        JSON.parse(localStorage.getItem("user"));

    if (!user || !user.id) {

        window.location.href = "/auth/login";
        return;
    }

    // Inicializa trazendo apenas os aluguéis Ativos por padrão
    await loadRentals(user.id, "ACTIVE");

    // Escuta a mudança do filtro que você adicionou no HTML
    const filter = document.getElementById("statusFilter");
    if (filter) {
        filter.addEventListener("change", async (e) => {
            await loadRentals(user.id, e.target.value);
        });
    }
});

async function loadRentals(userId, filterStatus = "ACTIVE") {

    try {

        const response = await fetch(
            `/rentals/renter-list/${userId}`
        );

        if (!response.ok) {

            throw new Error("Erro ao carregar alugueis");
        }

        let rentals = await response.json();

        // APLICAÇÃO DOS FILTROS NA PERSPECTIVA DE QUEM SOLICITOU
        if (filterStatus === "ACTIVE") {
            rentals = rentals.filter(r =>
                ["PENDING", "AWAITING_PAYMENT", "ACCEPTED", "PAID", "IN_USE", "RETURNED", "LATE_RETURNED"].includes(r.status)
            );
        } else if (filterStatus === "HISTORY") {
            rentals = rentals.filter(r =>
                ["FINALIZED", "REJECTED", "CANCELLED"].includes(r.status)
            );
        }
        // Se for "ALL", ele ignora os blocos acima e mantém a lista completa vinda do banco

        renderStats(rentals);

        renderRentals(rentals);

    } catch (error) {

        console.error(error);

        document.getElementById("rentalsList").innerHTML = `
            <p class="empty-message">
                Erro ao carregar alugueis.
            </p>
        `;
    }
}

function renderStats(rentals) {

    document.getElementById("totalRentals")
        .textContent = rentals.length;

    const totalSpent = rentals.reduce((sum, rental) => {

        return sum + (rental.totalValue || 0);

    }, 0);

    document.getElementById("totalSpent")
        .textContent = formatCurrency(totalSpent);
}

function renderRentals(rentals) {

    const container =
        document.getElementById("rentalsList");

    if (!rentals.length) {

        container.innerHTML = `
            <div class="empty-rentals">

                <h3>
                    Nenhum aluguel encontrado
                </h3>

                <p>
                    Nenhum registro corresponde ao filtro selecionado.
                </p>

            </div>
        `;

        return;
    }

    container.innerHTML = rentals.map(rental => `

    <article class="rental-card">

        <div class="rental-image-container">

            <img
                src="${rental.toolImage || '/assets/tool-placeholder.svg'}"
                class="rental-image"
                alt="${rental.toolName}"
                loading="lazy"
                onerror="this.onerror=null;this.src='/assets/tool-placeholder.svg';"
            >

            <span class="badge ${getStatusBadgeClass(rental.status)}">
    ${translateStatus(rental.status)}
</span>

        </div>

        <div class="rental-content">

            <h3 class="rental-title">
                ${rental.toolName}
            </h3>

            <p class="rental-owner">
                Proprietário:
                ${rental.ownerName}
            </p>

            <div class="rental-details">

                <div class="detail-item">

                    <span class="detail-label">
                        Período
                    </span>

                    <span class="detail-value">
                        ${formatDate(rental.startDate)}
                        até
                        ${formatDate(rental.endDate)}
                    </span>

                </div>

                <div class="detail-item">

                    <span class="detail-label">
                        Valor
                    </span>

                    <span class="price-value">
                        ${formatCurrency(rental.totalValue)}
                    </span>

                </div>

            </div>

        </div>

        <div class="rental-footer">

            <a
                href="/rentals/tracking/${rental.rentalId}"
                class="btn-view"
            >
                Ver aluguel
            </a>

        </div>

    </article>

`).join("");
}

function renderImage(rental) {

    if (!rental.toolImage) {

        return `
            <div class="rental-image-placeholder">

                Sem imagem

            </div>
        `;
    }

    return `
        <img
            src="${rental.toolImage}"
            class="rental-image"
            alt="${rental.toolName}"
        >
    `;
}

function translateStatus(status) {

    const map = {
        PENDING: "Pendente",
        AWAITING_PAYMENT: "Aguardando Pagamento",
        ACCEPTED: "Aceito (Retirada Pendente)",
        PAID: "Pago (Aguardando Retirada)",
        IN_USE: "Em Uso",
        RETURNED: "Devolvido (Aguardando Confirmação)",
        LATE_RETURNED: "Devolvido com atraso",
        FINALIZED: "Finalizado",
        REJECTED: "Recusado pelo Proprietário",
        CANCELLED: "Cancelado"
    };

    return map[status] || status;
}

function formatDate(date) {

    if (!date) {

        return "-";
    }

    return new Date(date + "T00:00:00")
        .toLocaleDateString("pt-BR");
}

function formatCurrency(value) {

    return Number(value || 0)
        .toLocaleString("pt-BR", {

            style: "currency",

            currency: "BRL"
        });
}

function getStatusBadgeClass(status) {

    const map = {
        PENDING: "badge-pending",
        AWAITING_PAYMENT: "badge-waiting",
        ACCEPTED: "badge-accepted",
        PAID: "badge-paid",
        IN_USE: "badge-active",
        RETURNED: "badge-finished",
        LATE_RETURNED: "badge-late",
        FINALIZED: "badge-finished",
        REJECTED: "badge-rejected",
        CANCELLED: "badge-cancelled"
    };

    return map[status] || "badge-default";
}