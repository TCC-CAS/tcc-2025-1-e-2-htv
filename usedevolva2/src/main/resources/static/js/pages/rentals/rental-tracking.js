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
        const user = JSON.parse(localStorage.getItem("user"));
        const response = await fetch(
            `/rentals/${rentalId}/details?userId=${user.id}`
        );

        if (!response.ok) {
            throw new Error("Erro ao carregar aluguel");
        }

        const rental = await response.json();

        renderRental(rental);
        updateProgress(rental.status);

        renderActionButtons(rental, user.id);

    } catch (error) {
        console.error(error);
    }
}

async function handleAction(endpoint, bodyData) {
    try {
        const response = await fetch(endpoint, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(bodyData)
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(text || "Erro ao processar a ação.");
        }

        window.location.reload();
    } catch (error) {
        console.error(error);
        alert("Erro: " + error.message);
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
        (completed / steps.length) * 100;

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
    "PAID",
    "ACCEPTED",
    "IN_USE",
    "RETURNED",
    "FINALIZED"
];

function getCompletedSteps(status) {
    if (status === "LATE_RETURNED") status = "RETURNED";
    if (status === "AWAITING_PAYMENT") status = "PENDING";

    const index = FLOW.indexOf(status);
    return index === -1 ? 0 : index + 1;
}

function renderActionButtons(rental, currentUserId) {
    const container = document.getElementById("containerAcoes");
    if (!container) return;
    container.innerHTML = "";

    const idLocacao = rental.rentalId || rental.id;

    const chatBtn = document.createElement("button");
    chatBtn.className = "btn-pagamento btn-rental-chat";
    chatBtn.textContent = "Abrir chat da locação";
    chatBtn.type = "button";
    chatBtn.onclick = () => openRentalChat(idLocacao);

    container.appendChild(chatBtn);

    if (rental.status === "ACCEPTED" && rental.isRenter) {
        const startBtn = document.createElement("button");
        startBtn.className = "btn-pagamento";
        startBtn.textContent = "Confirmar Retirada da Ferramenta";
        startBtn.type = "button";

startBtn.onclick = () => handleAction(`/rentals/${idLocacao}/start`, { ownerId: rental.ownerId });
        container.appendChild(startBtn);

        const cancelHelpBtn = document.createElement("button");
        cancelHelpBtn.className = "btn-pagamento btn-cancelar-locacao";
        cancelHelpBtn.textContent = "Preciso de ajuda / Cancelar locação";
        cancelHelpBtn.type = "button";

        cancelHelpBtn.onclick = async () => {
            const confirmCancel = confirm(
                "Você só deve cancelar se não conseguiu combinar local ou horário de retirada com o dono da ferramenta. Deseja continuar?"
            );

            if (!confirmCancel) return;

            const reason = prompt(
                "Descreva brevemente o motivo do cancelamento:",
                "Não consegui combinar local ou horário de retirada com o proprietário."
            );

            if (reason === null) return;

            await handleAction(`/rentals/${idLocacao}/cancel-accepted`, {
                renterId: currentUserId,
                reason: reason
            });
        };

        container.appendChild(cancelHelpBtn);

}


    else if (rental.status === "IN_USE" && rental.isRenter) {
        const btn = document.createElement("button");
        btn.className = "btn-pagamento";
        btn.textContent = "Marcar como Devolvido";
        const hoje = new Date().toISOString().split('T')[0];

        btn.onclick = () => handleAction(`/rentals/${idLocacao}/return`, { renterId: currentUserId, actualReturnDate: hoje });
        container.appendChild(btn);
    }

}

async function openRentalChat(rentalId) {
    try {
        const response = await fetch(`/chats/rentals/${rentalId}/start`, {
            method: "POST"
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || "Erro ao abrir chat da locação.");
        }

        const chat = await response.json();

        window.location.href = `/users/chats?chatId=${chat.id}`;

    } catch (error) {
        console.error(error);
        alert(error.message || "Não foi possível abrir o chat da locação.");
    }
}