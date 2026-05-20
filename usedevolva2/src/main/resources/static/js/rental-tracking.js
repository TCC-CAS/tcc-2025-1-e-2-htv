document.addEventListener("DOMContentLoaded", async () => {

    const rentalId = getRentalIdFromUrl();

    if (!rentalId) {

        alert("Aluguel não encontrado");

        return;
    }

    await loadRental(rentalId);
});

function getRentalIdFromUrl() {

    const pathParts =
        window.location.pathname.split("/");

    return pathParts[pathParts.length - 1];
}

async function loadRental(rentalId) {

    try {

        const user =
            JSON.parse(localStorage.getItem("user"));

        const response = await fetch(
            `/rentals/${rentalId}/details?userId=${user.id}`
        );

        if (!response.ok) {

            throw new Error(
                "Erro ao carregar aluguel"
            );
        }

        const rental = await response.json();

        renderRental(rental);

        updateProgress(rental.status);

    } catch (error) {

        console.error(error);
    }
}

function renderRental(rental) {

    document.getElementById("toolName")
        .textContent = rental.toolName;

    document.getElementById("ownerName")
        .textContent = rental.ownerName;

    document.getElementById("rentalPeriod")
        .textContent =
        `${formatDate(rental.startDate)} até ${formatDate(rental.endDate)}`;

    document.getElementById("paymentValue")
        .textContent =
        formatCurrency(rental.totalValue);

    document.getElementById("statusTexto")
        .textContent =
        translateStatus(rental.status);
}

function updateProgress(status) {

    const steps = document.querySelectorAll(".etapa");

    const completed = getCompletedSteps(status);

    steps.forEach((step, index) => {
        step.classList.toggle("ativa", index < completed);
    });

    const progress = document.getElementById("linhaProgresso");

    const percentage =
        ((completed - 1) / (steps.length - 1)) * 100;

    progress.style.width = `${percentage}%`;
}

function translateStatus(status) {

    const map = {

        PENDING: "Solicitação enviada",

        ACCEPTED: "Aceito pelo dono",

        AWAITING_PAYMENT: "Aguardando Pagamento",

        PAID: "Pagamento confirmado",

        IN_USE: "Em Uso",

        RETURNED: "Devolvido",

        LATE_RETURNED: "Devolvido com atraso",

        REJECTED: "Recusado",

        CANCELLED: "Cancelado"
    };

    return map[status] || status;
}

function formatDate(date) {

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

const FLOW = [
    "PENDING",
    "ACCEPTED",
    "AWAITING_PAYMENT",
    "PAID",
    "IN_USE",
    "RETURNED",
    "LATE_RETURNED"
];

function getCompletedSteps(status) {

    const index = FLOW.indexOf(status);

    return index === -1 ? 0 : index + 1;
}

