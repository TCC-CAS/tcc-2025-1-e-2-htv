document.addEventListener("DOMContentLoaded", async () => {
    const form = document.getElementById("createToolForm");
    const message = document.querySelector(".form-message");
    const fotosInput = document.getElementById("fotos");
    const previewContainer = document.getElementById("imagePreviewContainer");
    const addressSelect = document.getElementById("addressId");
    const openAddressModalBtn = document.getElementById("openAddressModalBtn");

    let selectedFiles = [];

    if (!form) return;

    const savedUser = JSON.parse(localStorage.getItem("user"));

    if (savedUser && savedUser.id) {
        initAddressModal(savedUser.id, async (savedAddress) => {
            await loadUserAddresses(savedUser.id, savedAddress.id);
        });

        await loadUserAddresses(savedUser.id);
    }

    if (openAddressModalBtn) {
        openAddressModalBtn.addEventListener("click", () => {
            openAddressModal();
        });
    }

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

    async function loadUserAddresses(userId, selectedAddressId = null) {
        const addressSelect = document.getElementById("addressId");

        if (!addressSelect) return;

        try {
            addressSelect.innerHTML = `<option value="">Carregando endereços...</option>`;

            const response = await fetch(`/users/${userId}/addresses`);

            if (!response.ok) {
                throw new Error("Erro ao carregar endereços.");
            }

            const addresses = await response.json();

            if (!addresses || addresses.length === 0) {
                addressSelect.innerHTML = `<option value="">Nenhum endereço cadastrado</option>`;
                return;
            }

            addressSelect.innerHTML = `<option value="">Selecione um endereço</option>`;

            addresses.forEach((address) => {
                const option = document.createElement("option");
                option.value = address.id;
                option.textContent = formatAddressLabel(address);

                if (selectedAddressId && Number(selectedAddressId) === Number(address.id)) {
                    option.selected = true;
                }

                addressSelect.appendChild(option);
            });

        } catch (error) {
            console.error(error);
            addressSelect.innerHTML = `<option value="">Erro ao carregar endereços</option>`;
        }
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

            addressId: Number(document.getElementById("addressId").value),
            localizacao: "",
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
            !toolData.addressId ||
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
                new Blob([JSON.stringify(toolData)], {type: "application/json"})
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

