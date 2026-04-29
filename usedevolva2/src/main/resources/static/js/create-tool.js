document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("createToolForm");
    const message = document.querySelector(".form-message");
    const fotosInput = document.getElementById("fotos");
    const previewContainer = document.getElementById("imagePreviewContainer");

    if (!form) return;


    if (fotosInput && previewContainer) {
        fotosInput.addEventListener("change", () => {
            previewContainer.innerHTML = "";

            const files = Array.from(fotosInput.files);

            files.forEach((file) => {
                if (!file.type.startsWith("image/")) return;

                const reader = new FileReader();

                reader.onload = (event) => {
                    const previewItem = document.createElement("div");
                    previewItem.classList.add("image-preview-item");

                    previewItem.innerHTML = `
                        <img src="${event.target.result}" alt="Prévia da imagem">
                    `;

                    previewContainer.appendChild(previewItem);
                };

                reader.readAsDataURL(file);
            });
        });
    }


    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const user = JSON.parse(localStorage.getItem("user"));

        if (!user || !user.id) {
            window.location.href = "/auth/login";
            return;
        }

        message.textContent = "";

        const quantidadeFotos = fotosInput?.files?.length || 0;

        const toolData = {
            nome: document.getElementById("nomeFerramenta").value.trim(),
            categoria: document.getElementById("categoria").value,
            estadoConservacao: document.getElementById("estadoConservacao").value,
            valorDiaria: Number(document.getElementById("valorDiaria").value),
            descricao: document.getElementById("descricao").value.trim(),
            quantidadeFotos: quantidadeFotos
        };


        if (!toolData.nome || !toolData.categoria || !toolData.estadoConservacao || !toolData.valorDiaria || !toolData.descricao) {
            message.textContent = "Preencha todos os campos obrigatórios.";
            return;
        }

        if (quantidadeFotos < 1) {
            message.textContent = "Adicione pelo menos uma foto da ferramenta.";
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

            for (const file of fotosInput.files) {
                formData.append("files", file);
            }

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