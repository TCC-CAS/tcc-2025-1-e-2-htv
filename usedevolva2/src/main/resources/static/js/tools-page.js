let currentTool = null;
const CURRENT_USER_ID = JSON.parse(localStorage.getItem("user"))?.id;

document.addEventListener("DOMContentLoaded", async () => {
    await loadTool();
    await loadImages();

    const reservationForm = document.getElementById("reservationForm");
    const dataInicio = document.getElementById("dataInicio");
    const dataFim = document.getElementById("dataFim");

    if (reservationForm) {
        reservationForm.addEventListener("submit", async (event) => {
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

            const start = new Date(dataInicioVal + "T00:00:00");
            const end = new Date(dataFimVal + "T00:00:00");
            if (end < start) {
                alert("A data de devolução não pode ser anterior à data de início.");
                return;
            }

            const totalDays = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
            const dailyRate = parseFloat(currentTool.valorDiaria || 0);
            const totalAmount = dailyRate * totalDays * 1.07;

            try {
                const checkoutResponse = await fetch(
                    `/payments/tool-checkout?toolId=${TOOL_ID}&days=${totalDays}&totalAmount=${totalAmount}&tenantId=${CURRENT_USER_ID}`,
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
            } catch (err) {
                console.error(err);
                alert("Erro ao processar a reserva.");
            }
        });
    }
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