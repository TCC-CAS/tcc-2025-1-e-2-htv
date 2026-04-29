document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("createToolForm");
    const message = document.querySelector(".form-message");
    const fotosInput = document.getElementById("fotos");
    const previewContainer = document.getElementById("imagePreviewContainer");

    let selectedFiles = [];

    if (!form) return;

    if (fotosInput && previewContainer) {
        fotosInput.addEventListener("change", () => {
            const newFiles = Array.from(fotosInput.files);

            newFiles.forEach((file) => {
                if (!file.type.startsWith("image/")) return;

                if (selectedFiles.length >= 10) {
                    message.textContent = "Você pode adicionar no máximo 10 fotos.";
                    return;
                }

                selectedFiles.push(file);
            });

            fotosInput.value = "";
            renderPreviews();
        });
    }

    function renderPreviews() {
        previewContainer.innerHTML = "";

        selectedFiles.forEach((file, index) => {
            const reader = new FileReader();

            reader.onload = (event) => {
                const previewItem = document.createElement("div");
                previewItem.classList.add("image-preview-item");

                previewItem.innerHTML = `
                    <img src="${event.target.result}" alt="Prévia da imagem">
                    <button type="button" class="remove-preview-btn" data-index="${index}">×</button>
                `;

                previewContainer.appendChild(previewItem);
            };

            reader.readAsDataURL(file);
        });
    }

    previewContainer.addEventListener("click", (event) => {
        if (event.target.classList.contains("remove-preview-btn")) {
            const index = Number(event.target.dataset.index);
            selectedFiles.splice(index, 1);
            renderPreviews();
        }
    });

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const user = JSON.parse(localStorage.getItem("user"));

        if (!user || !user.id) {
            window.location.href = "/auth/login";
            return;
        }

        message.textContent = "";

        const quantidadeFotos = selectedFiles.length;

        const toolData = {
            nome: document.getElementById("nomeFerramenta").value.trim(),
            categoria: document.getElementById("categoria").value,
            estadoConservacao: document.getElementById("estadoConservacao").value,
            valorDiaria: Number(document.getElementById("valorDiaria").value),
            descricao: document.getElementById("descricao").value.trim(),
            quantidadeFotos: quantidadeFotos,

            localizacao: document.getElementById("localizacao").value.trim(),
            dataInicioDisponibilidade: document.getElementById("dataInicioDisponibilidade").value,
            dataFimDisponibilidade: document.getElementById("dataFimDisponibilidade").value || null,
            observacoes: document.getElementById("observacoes").value.trim()
        };

        if (
            !toolData.nome ||
            !toolData.categoria ||
            !toolData.estadoConservacao ||
            !toolData.valorDiaria ||
            !toolData.descricao ||
            !toolData.localizacao ||
            !toolData.dataInicioDisponibilidade
        ) {
            message.textContent = "Preencha todos os campos obrigatórios.";
            return;
        }

        if (quantidadeFotos < 1) {
            message.textContent = "Adicione pelo menos uma foto da ferramenta.";
            fotosInput.focus();
            return;
        }

        if (quantidadeFotos > 10) {
            message.textContent = "Você pode adicionar no máximo 10 fotos.";
            return;
        }

        try {
            const response = await fetch(`/tools/owner/${user.id}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(toolData)
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(error);
            }

            const createdTool = await response.json();

            const formData = new FormData();

            selectedFiles.forEach((file) => {
                formData.append("files", file);
            });

            const imageResponse = await fetch(`/tools/${createdTool.id}/owner/${user.id}/images`, {
                method: "POST",
                body: formData
            });

            if (!imageResponse.ok) {
                throw new Error("Ferramenta criada, mas erro ao enviar imagens.");
            }

            showToast("Ferramenta cadastrada com sucesso!");

            setTimeout(() => {
                window.location.href = "/users/profile";
            }, 3000);

        } catch (error) {
            console.error(error);
            message.textContent = "Não foi possível cadastrar a ferramenta. Verifique os dados.";
        }
    });
});

function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "toast-message";
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add("show");
    }, 50);

    setTimeout(() => {
        toast.classList.remove("show");
        toast.classList.add("hide");
    }, 3000);

    setTimeout(() => {
        toast.remove();
    }, 3400);
}

