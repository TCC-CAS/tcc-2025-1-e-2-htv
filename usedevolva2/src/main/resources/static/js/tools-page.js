let currentTool = null;

document.addEventListener("DOMContentLoaded", async () => {
    await loadTool();
    await loadImages();

    const dataInicio = document.getElementById("dataInicio");
    const dataFim = document.getElementById("dataFim");
    const reservationForm = document.getElementById("reservationForm");

    if (dataInicio) dataInicio.addEventListener("change", updateBookingSummary);
    if (dataFim) dataFim.addEventListener("change", updateBookingSummary);

    if (reservationForm) {
        reservationForm.addEventListener("submit", (event) => {
            event.preventDefault();
            showToast("Solicitação de empréstimo ainda será implementada.");
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