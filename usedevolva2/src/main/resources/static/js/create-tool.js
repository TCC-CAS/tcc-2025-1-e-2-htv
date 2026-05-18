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

                if (selectedFiles.length >= 5) {
                    message.textContent = "Você pode adicionar no máximo 5 fotos.";
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
        const submitButton = form.querySelector("button[type='submit']");

        if (!user || !user.id) {
            window.location.href = "/auth/login";
            return;
        }

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
            showToast("Preencha todos os campos obrigatórios.", "error");
            return;
        }

        if (quantidadeFotos < 1) {
            showToast("Adicione pelo menos uma foto da ferramenta.", "error");
            fotosInput.focus();
            return;
        }

        if (quantidadeFotos > 5) {
            showToast("Você pode adicionar no máximo 5 fotos.", "error");
            return;
        }

        try {
            showToast("Criando ferramenta, aguarde...", "loading");

            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = "Criando...";
            }

            const formData = new FormData();

            formData.append(
                "tool",
                new Blob([JSON.stringify(toolData)], { type: "application/json" })
            );

            selectedFiles.forEach((file) => {
                formData.append("files", file);
            });

            const response = await fetch(`/tools/owner/${user.id}`, {
                method: "POST",
                body: formData
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || "Erro ao cadastrar ferramenta.");
            }

            showToast("Ferramenta cadastrada com sucesso!", "success");

            setTimeout(() => {
                window.location.href = "/users/profile";
            }, 3000);

        } catch (error) {
            console.error(error);

            showToast(
                "Erro: " + (error.message || "Não foi possível cadastrar a ferramenta."),
                "error"
            );

            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = "Criar ferramenta";
            }
        }
    });
});

function showToast(message, type = "success") {
    const existingToast = document.querySelector(".toast-message");

    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement("div");
    toast.className = `toast-message toast-${type}`;
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add("show");
    }, 50);

    if (type !== "loading") {
        setTimeout(() => {
            toast.classList.remove("show");
            toast.classList.add("hide");
        }, 3000);

        setTimeout(() => {
            toast.remove();
        }, 3400);
    }
}

