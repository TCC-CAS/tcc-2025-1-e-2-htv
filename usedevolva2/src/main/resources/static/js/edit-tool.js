document.addEventListener("DOMContentLoaded", async () => {
    const form = document.getElementById("editToolForm");
    const message = document.querySelector(".form-message");
    const fotosInput = document.getElementById("fotos");
    const currentImagesContainer = document.getElementById("currentImagesContainer");
    const newImagesPreviewContainer = document.getElementById("newImagesPreviewContainer");

    const user = JSON.parse(localStorage.getItem("user"));

    if (!user || !user.id) {
        window.location.href = "/auth/login";
        return;
    }

    if (!form) return;

    let selectedFiles = [];

    await loadToolData();
    await loadToolImages();

    if (fotosInput && newImagesPreviewContainer) {
        fotosInput.addEventListener("change", () => {
            const newFiles = Array.from(fotosInput.files);

            newFiles.forEach(file => {
                if (!file.type.startsWith("image/")) return;

                if (selectedFiles.length >= 10) {
                    message.textContent = "Você pode adicionar no máximo 10 novas fotos por vez.";
                    return;
                }

                selectedFiles.push(file);
            });

            fotosInput.value = "";
            renderNewImagesPreview();
        });
    }

    newImagesPreviewContainer.addEventListener("click", (event) => {
        if (event.target.classList.contains("remove-preview-btn")) {
            const index = Number(event.target.dataset.index);
            selectedFiles.splice(index, 1);
            renderNewImagesPreview();
        }
    });

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        message.textContent = "";

        const toolData = {
            nome: document.getElementById("nomeFerramenta").value.trim(),
            categoria: document.getElementById("categoria").value,
            estadoConservacao: document.getElementById("estadoConservacao").value,
            valorDiaria: Number(document.getElementById("valorDiaria").value),
            descricao: document.getElementById("descricao").value.trim(),
            quantidadeFotos: 1
        };

        if (!toolData.nome || !toolData.categoria || !toolData.estadoConservacao || !toolData.valorDiaria || !toolData.descricao) {
            message.textContent = "Preencha todos os campos obrigatórios.";
            return;
        }

        try {
            const response = await fetch(`/tools/${TOOL_ID}/owner/${user.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(toolData)
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(error);
            }

            if (selectedFiles.length > 0) {
                const formData = new FormData();

                selectedFiles.forEach(file => {
                    formData.append("files", file);
                });

                const imageResponse = await fetch(`/tools/${TOOL_ID}/owner/${user.id}/images`, {
                    method: "POST",
                    body: formData
                });

                if (!imageResponse.ok) {
                    throw new Error("Dados salvos, mas houve erro ao enviar novas imagens.");
                }
            }

            showToast("Ferramenta atualizada com sucesso!");

            setTimeout(() => {
                window.location.href = "/users/my-tools";
            }, 2500);

        } catch (error) {
            console.error(error);
            message.textContent = "Não foi possível atualizar a ferramenta.";
        }
    });

    async function loadToolData() {
        try {
            const response = await fetch(`/tools/${TOOL_ID}`);

            if (!response.ok) {
                throw new Error("Ferramenta não encontrada.");
            }

            const tool = await response.json();

            if (tool.ownerId !== user.id) {
                alert("Você não tem permissão para editar esta ferramenta.");
                window.location.href = "/users/my-tools";
                return;
            }

            document.getElementById("nomeFerramenta").value = tool.nome || "";
            document.getElementById("categoria").value = tool.categoria || "";
            document.getElementById("estadoConservacao").value = tool.estadoConservacao || "";
            document.getElementById("valorDiaria").value = tool.valorDiaria || "";
            document.getElementById("descricao").value = tool.descricao || "";

        } catch (error) {
            console.error(error);
            alert("Não foi possível carregar os dados da ferramenta.");
            window.location.href = "/users/my-tools";
        }
    }

    async function loadToolImages() {
        try {
            const response = await fetch(`/tools/${TOOL_ID}/images`);

            if (!response.ok) {
                currentImagesContainer.innerHTML = "<p>Nenhuma imagem cadastrada.</p>";
                return;
            }

            const images = await response.json();

            if (!images || images.length === 0) {
                currentImagesContainer.innerHTML = "<p>Nenhuma imagem cadastrada.</p>";
                return;
            }

            currentImagesContainer.innerHTML = "";

            images.forEach(image => {
                currentImagesContainer.innerHTML += `
                    <div class="photo-item">
                        <img src="${image.filePath}" alt="Imagem da ferramenta">
                    </div>
                `;
            });

        } catch (error) {
            console.error(error);
            currentImagesContainer.innerHTML = "<p>Não foi possível carregar as imagens.</p>";
        }
    }

    function renderNewImagesPreview() {
        newImagesPreviewContainer.innerHTML = "";

        selectedFiles.forEach((file, index) => {
            const reader = new FileReader();

            reader.onload = (event) => {
                const previewItem = document.createElement("div");
                previewItem.classList.add("image-preview-item");

                previewItem.innerHTML = `
                    <img src="${event.target.result}" alt="Nova imagem selecionada">
                    <button type="button" class="remove-preview-btn" data-index="${index}">×</button>
                `;

                newImagesPreviewContainer.appendChild(previewItem);
            };

            reader.readAsDataURL(file);
        });
    }
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
    }, 2500);

    setTimeout(() => {
        toast.remove();
    }, 2900);
}