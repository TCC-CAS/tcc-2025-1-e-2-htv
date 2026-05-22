let currentTool = null;
let currentToolId = null;

document.addEventListener("DOMContentLoaded", async () => {
    currentToolId = Number(TOOL_ID);

    await loadTool();
    await loadImages();

    const dataInicio = document.getElementById("dataInicio");
    const dataFim = document.getElementById("dataFim");
    const reservationForm = document.getElementById("reservationForm");
    const startToolChatBtn = document.getElementById("startToolChatBtn");

    if (startToolChatBtn) {
        startToolChatBtn.addEventListener("click", startToolChat);
    }

    if (dataInicio) dataInicio.addEventListener("change", updateBookingSummary);
    if (dataFim) dataFim.addEventListener("change", updateBookingSummary);

    if (reservationForm) {

        reservationForm.addEventListener("submit", async (event) => {

            event.preventDefault();

            try {
                const user = JSON.parse(localStorage.getItem("user"));

                if (currentTool && user && Number(currentTool.ownerId) === Number(user.id)) {
                    showToast("Você não pode alugar sua própria ferramenta.");
                    return;
                }

                const dataInicio =
                    document.getElementById("dataInicio").value;

                const dataFim =
                    document.getElementById("dataFim").value;

                const obs =
                    document.getElementById("obs").value;

                if (!dataInicio || !dataFim) {
                    showToast("Preencha as datas.");
                    return;
                }

                if (!user || !user.id) {
                    showToast("Você precisa estar logado.");
                    return;
                }

                const response = await fetch("/tool-payments/create", {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        toolId: TOOL_ID,
                        userId: user.id,
                        startDate: dataInicio,
                        endDate: dataFim,
                        message: obs
                    })
                });

                const data = await response.json();

                if (!response.ok || !data.success) {

                    console.error(data);

                    showToast(
                        data.message ||
                        "Erro ao criar pagamento."
                    );

                    return;
                }

                localStorage.setItem(
                    "toolPaymentData",
                    JSON.stringify(data)
                );

                showPixModal(data);

            } catch (error) {

                console.error(error);

                showToast(
                    "Erro ao processar solicitação."
                );
            }
        });
    }
});

async function loadTool() {
    try {
        const response = await fetch(`/tools/${TOOL_ID}`);

        if (!response.ok) {
            throw new Error("Erro ao buscar ferramenta.");
        }

        const tool = await response.json();
        currentTool = tool;

        applyOwnerToolRestrictions();

        document.getElementById("breadcrumbToolName").textContent = tool.nome || "Ferramenta";
        document.getElementById("toolName").textContent = tool.nome || "Ferramenta";
        document.getElementById("toolCategory").textContent = (tool.categoria || "Categoria").toUpperCase();
        document.getElementById("toolLocation").textContent = `Disponível em ${tool.localizacao || "localização não informada"}`;
        document.getElementById("toolDescription").textContent = tool.descricao || "Descrição não informada.";
        document.getElementById("toolCondition").textContent = tool.estadoConservacao || "Estado não informado.";
        document.getElementById("toolObservations").textContent = tool.observacoes || "Nenhuma observação informada.";
        document.getElementById("toolAvailability").textContent = formatAvailability(tool);
        document.getElementById("toolPrice").textContent = formatCurrency(tool.valorDiaria || 0);

        await loadOwner(tool.ownerId);

    } catch (error) {
        console.error(error);
        showToast("Não foi possível carregar a ferramenta.");
    }
}

async function loadImages() {
    const container = document.getElementById("imageGallery");

    try {
        const response = await fetch(`/tools/${TOOL_ID}/images`);

        if (!response.ok) {
            container.innerHTML = "<p>Sem imagens</p>";
            return;
        }

        let images = await response.json();

        if (!images || images.length === 0) {
            container.innerHTML = "<p>Sem imagens</p>";
            return;
        }

        images.sort((a, b) => Number(b.principal) - Number(a.principal));

        const mainImage = images[0];
        const thumbnails = images.slice(1);

        container.innerHTML = `
            <div class="tool-main-image">
                <img id="selectedToolImage" src="${mainImage.filePath}" alt="Imagem principal da ferramenta">
            </div>

            ${
            thumbnails.length > 0
                ? `<div class="tool-thumbs" id="toolThumbs"></div>`
                : ""
        }
        `;

        const thumbs = document.getElementById("toolThumbs");

        if (thumbs) {
            thumbnails.forEach(image => {
                const button = document.createElement("button");
                button.type = "button";
                button.className = "tool-thumb-btn";

                button.innerHTML = `
                    <img src="${image.filePath}" alt="Miniatura da ferramenta">
                `;

                button.addEventListener("click", () => {
                    document.getElementById("selectedToolImage").src = image.filePath;
                });

                thumbs.appendChild(button);
            });
        }

    } catch (error) {
        console.error(error);
        container.innerHTML = "<p>Erro ao carregar imagens</p>";
    }
}

async function loadOwner(ownerId) {
    if (!ownerId) return;

    try {
        const response = await fetch(`/users/${ownerId}`);

        if (!response.ok) {
            throw new Error("Erro ao buscar proprietário.");
        }

        const owner = await response.json();

        const ownerName =
            owner.nomeCompleto ||
            owner.nome ||
            owner.email ||
            "Proprietário da ferramenta";

        document.getElementById("ownerName").textContent = ownerName;
        document.getElementById("ownerAvatar").textContent = getInitials(ownerName);

    } catch (error) {
        console.error(error);
        document.getElementById("ownerName").textContent = "Proprietário não identificado";
        document.getElementById("ownerAvatar").textContent = "U";
    }
}

function updateBookingSummary() {
    if (!currentTool) return;

    const dataInicio = document.getElementById("dataInicio").value;
    const dataFim = document.getElementById("dataFim").value;

    if (!dataInicio || !dataFim) {
        document.getElementById("dailySummary").textContent = "0 diárias";
        document.getElementById("baseValue").textContent = formatCurrency(0);
        document.getElementById("serviceFee").textContent = formatCurrency(0);
        document.getElementById("totalValue").textContent = formatCurrency(0);
        return;
    }

    const start = new Date(dataInicio + "T00:00:00");
    const end = new Date(dataFim + "T00:00:00");

    if (end < start) {
        showToast("A data de devolução não pode ser anterior à data de início.");
        return;
    }

    const millisecondsPerDay = 1000 * 60 * 60 * 24;
    const totalDays = Math.floor((end - start) / millisecondsPerDay) + 1;

    const dailyRate = Number(currentTool.valorDiaria || 0);
    const base = dailyRate * totalDays;
    const serviceFee = base * 0.07;
    const total = base + serviceFee;

    document.getElementById("dailySummary").textContent =
        totalDays === 1 ? "1 diária" : `${totalDays} diárias`;

    document.getElementById("baseValue").textContent = formatCurrency(base);
    document.getElementById("serviceFee").textContent = formatCurrency(serviceFee);
    document.getElementById("totalValue").textContent = formatCurrency(total);
}

function formatAvailability(tool) {
    const hasStart = !!tool.dataInicioDisponibilidade;
    const hasEnd = !!tool.dataFimDisponibilidade;

    if (!hasStart && !hasEnd) {
        return "Disponibilidade não informada.";
    }

    if (hasStart && !hasEnd) {
        return `Disponível a partir de ${formatDate(tool.dataInicioDisponibilidade)}.`;
    }

    if (!hasStart && hasEnd) {
        return `Disponível até ${formatDate(tool.dataFimDisponibilidade)}.`;
    }

    return `Disponível de ${formatDate(tool.dataInicioDisponibilidade)} até ${formatDate(tool.dataFimDisponibilidade)}.`;
}

function formatDate(dateString) {
    const date = new Date(dateString + "T00:00:00");
    return date.toLocaleDateString("pt-BR");
}

function formatCurrency(value) {
    return Number(value).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function getInitials(name) {
    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part[0])
        .join("")
        .toUpperCase();
}

function showPixModal(data) {

    const modal =
        document.getElementById("pixModal");

    modal.classList.remove("hidden");

    document.getElementById("pixQrImage").src =
        data.pixQrCodeBase64;

    document.getElementById("pixCode").value =
        data.pixQrCode;

    localStorage.setItem(
        "lastToolPayment",
        JSON.stringify(data)
    );
}

function closePixModal() {

    document
        .getElementById("pixModal")
        .classList.add("hidden");
}

document.addEventListener("click", async (event) => {

    if (event.target.id === "copyPixCodeBtn") {

        const code =
            document.getElementById("pixCode").value;

        await navigator.clipboard.writeText(code);

        showToast("Código Pix copiado!");
    }
});

document.addEventListener("click", (event) => {

    if (
        event.target.id === "closePixModal"
    ) {

        closePixModal();
    }
});

document.addEventListener("click", async (event) => {

    if (
        event.target.id !== "checkPaymentBtn"
    ) return;

    try {

        const paymentData =
            JSON.parse(
                localStorage.getItem(
                    "lastToolPayment"
                )
            );

        if (!paymentData) {

            showToast(
                "Pagamento não encontrado."
            );

            return;
        }

        const response = await fetch(
            `/tool-payments/check/${paymentData.paymentId}`
        );

        const data = await response.json();

        if (!data.success) {

            showToast(
                "Pagamento ainda pendente."
            );

            return;
        }

        if (
            data.status !== "PAID"
        ) {

            showToast(
                "Pagamento ainda não aprovado."
            );

            return;
        }

        showToast(
            "Pagamento aprovado!"
        );

        setTimeout(() => {

            window.location.href =
                "/rentals";

        }, 1500);

    } catch (error) {

        console.error(error);

        showToast(
            "Erro ao verificar pagamento."
        );
    }
});

async function startToolChat() {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user || !user.id) {
        showToast("Você precisa estar logado para iniciar uma conversa.");
        window.location.href = "/auth/login";
        return;
    }

    if (!currentToolId) {
        showToast("Ferramenta não encontrada para iniciar o chat.");
        return;
    }

    if (currentTool && Number(currentTool.ownerId) === Number(user.id)) {
        showToast("Você não pode iniciar chat com sua própria ferramenta.");
        return;
    }

    const button = document.getElementById("startToolChatBtn");
    const originalText = button ? button.textContent : "";

    try {
        if (button) {
            button.disabled = true;
            button.textContent = "Abrindo chat...";
        }

        const response = await fetch(`/chats/tools/${currentToolId}/start?userId=${user.id}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: "Olá! Tenho interesse nesta ferramenta e gostaria de conversar sobre a locação."
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || "Erro ao iniciar chat.");
        }

        const chat = await response.json();

        window.location.href = `/users/chats?chatId=${chat.id}`;

    } catch (error) {
        console.error(error);
        showToast(error.message || "Não foi possível iniciar o chat.");

        if (button) {
            button.disabled = false;
            button.textContent = originalText;
        }
    }
}

function applyOwnerToolRestrictions() {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user || !user.id || !currentTool || !currentTool.ownerId) {
        return;
    }

    const isOwner = Number(currentTool.ownerId) === Number(user.id);

    if (!isOwner) {
        return;
    }

    const startToolChatBtn = document.getElementById("startToolChatBtn");
    const reservationForm = document.getElementById("reservationForm");
    const rentSubmitBtn = reservationForm
        ? reservationForm.querySelector("button[type='submit']")
        : null;

    const warningMessage = "Você não pode alugar ou iniciar chat com sua própria ferramenta.";

    if (startToolChatBtn) {
        startToolChatBtn.disabled = true;
        startToolChatBtn.title = warningMessage;
        startToolChatBtn.classList.add("disabled-owner-action");
    }

    if (rentSubmitBtn) {
        rentSubmitBtn.disabled = true;
        rentSubmitBtn.title = warningMessage;
        rentSubmitBtn.classList.add("disabled-owner-action");
    }
}