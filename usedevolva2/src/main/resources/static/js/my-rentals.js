document.addEventListener("DOMContentLoaded", async () => {

    const user =
        JSON.parse(localStorage.getItem("user"));

    if (!user || !user.id) {

        window.location.href = "/auth/login";
        return;
    }

    await loadRentals(user.id);
});

async function loadRentals(userId) {

    try {

        const response = await fetch(
            `/rentals/renter-list/${userId}`
        );

        const rentals = await response.json();

        renderStats(rentals);

        renderRentals(rentals);

    } catch (error) {

        console.error(error);
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
            <p>Nenhum aluguel encontrado.</p>
        `;

        return;
    }

    container.innerHTML = rentals.map(rental => `

        <article class="rental-card">

            <div class="rental-header">

                <div class="rental-title-group">

                    <h3>${rental.toolName}</h3>

                    <p>
                        Proprietário:
                        ${rental.ownerName}
                    </p>

                </div>

                <span class="badge ${getBadgeClass(rental.status)}">
                    ${translateStatus(rental.status)}
                </span>

            </div>

            <div class="rental-body">

                ${
        rental.toolImage
            ? `
                        <img
                            src="${rental.toolImage}"
                            class="rental-image"
                            alt="${rental.toolName}"
                        >
                        `
            : ""
    }

                <div class="info-block">

                    <span class="info-label">
                        Período
                    </span>

                    <span class="info-value">
                        ${formatDate(rental.startDate)}
                        até
                        ${formatDate(rental.endDate)}
                    </span>

                </div>

                <div class="info-block">

                    <span class="info-label">
                        Valor
                    </span>

                    <span class="price-value">
                        ${formatCurrency(rental.totalValue)}
                    </span>

                </div>

            </div>

            <div class="rental-actions">

                <a
                    href="/rentals/${rental.rentalId}"
                    class="btn-outline"
                >
                    Ver aluguel
                </a>

            </div>

        </article>

    `).join("");
}

function translateStatus(status) {

    const map = {

        PENDING: "Pendente",

        AWAITING_PAYMENT: "Aguardando Pagamento",

        PAID: "Pago",

        IN_USE: "Em Uso",

        RETURNED: "Devolvido",

        LATE_RETURNED: "Devolvido com atraso",

        REJECTED: "Recusado",

        CANCELLED: "Cancelado"
    };

    return map[status] || status;
}

function getBadgeClass(status) {

    switch (status) {

        case "IN_USE":
            return "active";

        case "RETURNED":
            return "done";

        case "PENDING":
        case "AWAITING_PAYMENT":
            return "pending";

        default:
            return "";
    }
}

function formatDate(date) {

    return new Date(date + "T00:00:00")
        .toLocaleDateString("pt-BR");
}

function formatCurrency(value) {

    return Number(value).toLocaleString("pt-BR", {

        style: "currency",

        currency: "BRL"
    });
}