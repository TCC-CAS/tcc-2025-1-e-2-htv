let currentTool = null;
const CURRENT_USER_ID = JSON.parse(localStorage.getItem("user")).id;

document.addEventListener("DOMContentLoaded", async () => {
    const reservationForm = document.getElementById("reservationForm");
    const dataInicio = document.getElementById("dataInicio");
    const dataFim = document.getElementById("dataFim");
    const obs = document.getElementById("obs");

    reservationForm?.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (!CURRENT_USER_ID) {
            alert("Faça login para reservar a ferramenta.");
            return;
        }

        const dataInicioVal = dataInicio.value;
        const dataFimVal = dataFim.value;

        if (!dataInicioVal || !dataFimVal) {
            alert("Selecione datas válidas para a reserva.");
            return;
        }

        try {
            // Chama diretamente o checkout da ferramenta
            const checkoutResponse = await fetch(
                `/payments/tool-checkout?rentalId=0&toolId=${TOOL_ID}&tenantId=${CURRENT_USER_ID}`,
                { method: "POST" }
            );

            const checkoutData = await checkoutResponse.json();

            if (checkoutData.success) {
                // Redireciona para a AbacatePay
                window.location.href = checkoutData.data.url;
            } else {
                console.error(checkoutData);
                alert("Erro ao criar checkout: " + (checkoutData.message || "verifique o console"));
            }
        } catch (error) {
            console.error(error);
            alert("Erro ao processar a reserva.");
        }
    });
});

async function loadTool() {
    try {
        const response = await fetch(`/tools/${TOOL_ID}`);
        if (!response.ok) throw new Error("Erro ao buscar ferramenta.");

        const tool = await response.json();
        currentTool = tool;

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
            ${thumbnails.length > 0 ? `<div class="tool-thumbs" id="toolThumbs"></div>` : ""}
        `;

        const thumbs = document.getElementById("toolThumbs");
        if (thumbs) {
            thumbnails.forEach(image => {
                const button = document.createElement("button");
                button.type = "button";
                button.className = "tool-thumb-btn";
                button.innerHTML = `<img src="${image.filePath}" alt="Miniatura da ferramenta">`;
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
        if (!response.ok) throw new Error("Erro ao buscar proprietário.");

        const owner = await response.json();
        const ownerName = owner.nomeCompleto || owner.nome || owner.email || "Proprietário da ferramenta";
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

    const dataInicioVal = document.getElementById("dataInicio").value;
    const dataFimVal = document.getElementById("dataFim").value;

    if (!dataInicioVal || !dataFimVal) {
        document.getElementById("dailySummary").textContent = "0 diárias";
        document.getElementById("baseValue").textContent = formatCurrency(0);
        document.getElementById("serviceFee").textContent = formatCurrency(0);
        document.getElementById("totalValue").textContent = formatCurrency(0);
        return;
    }

    const start = new Date(dataInicioVal + "T00:00:00");
    const end = new Date(dataFimVal + "T00:00:00");
    if (end < start) {
        showToast("A data de devolução não pode ser anterior à data de início.");
        return;
    }

    const totalDays = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
    const dailyRate = Number(currentTool.valorDiaria || 0);
    const base = dailyRate * totalDays;
    const serviceFee = base * 0.07;
    const total = base + serviceFee;

    document.getElementById("dailySummary").textContent = totalDays === 1 ? "1 diária" : `${totalDays} diárias`;
    document.getElementById("baseValue").textContent = formatCurrency(base);
    document.getElementById("serviceFee").textContent = formatCurrency(serviceFee);
    document.getElementById("totalValue").textContent = formatCurrency(total);
}

function formatAvailability(tool) {
    const hasStart = !!tool.dataInicioDisponibilidade;
    const hasEnd = !!tool.dataFimDisponibilidade;
    if (!hasStart && !hasEnd) return "Disponibilidade não informada.";
    if (hasStart && !hasEnd) return `Disponível a partir de ${formatDate(tool.dataInicioDisponibilidade)}.`;
    if (!hasStart && hasEnd) return `Disponível até ${formatDate(tool.dataFimDisponibilidade)}.`;
    return `Disponível de ${formatDate(tool.dataInicioDisponibilidade)} até ${formatDate(tool.dataFimDisponibilidade)}.`;
}

function formatDate(dateString) {
    return new Date(dateString + "T00:00:00").toLocaleDateString("pt-BR");
}

function formatCurrency(value) {
    return Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function getInitials(name) {
    return name.split(" ").filter(Boolean).slice(0, 2).map(part => part[0]).join("").toUpperCase();
}

function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "toast-message";
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add("show"), 50);
    setTimeout(() => toast.classList.remove("show"), 3000);
    setTimeout(() => toast.remove(), 3400);
}