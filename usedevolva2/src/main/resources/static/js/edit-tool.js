document.addEventListener("DOMContentLoaded", async () => {
    const form = document.getElementById("editToolForm");
    const message = document.querySelector(".form-message");
    const fotosInput = document.getElementById("fotos");
    const currentImagesContainer = document.getElementById("currentImagesContainer");
    const newImagesPreviewContainer = document.getElementById("newImagesPreviewContainer");
    const addressSelect = document.getElementById("addressId");
    const openAddressModalBtn = document.getElementById("openAddressModalBtn");

    const user = JSON.parse(localStorage.getItem("user"));

    if (!user || !user.id) {
        window.location.href = "/auth/login";
        return;
    }

    if (!form) return;

    if (user && user.id) {
        initAddressModal(user.id, async (savedAddress) => {
            await loadUserAddresses(user.id, savedAddress.id);
        });
    }

    if (openAddressModalBtn) {
        openAddressModalBtn.addEventListener("click", () => {
            openAddressModal();
        });
    }

    let selectedFiles = [];

    await loadToolData();
    await loadToolImages();

    if (fotosInput && newImagesPreviewContainer) {
        fotosInput.addEventListener("change", () => {
            const newFiles = Array.from(fotosInput.files);

            newFiles.forEach(file => {
                if (!file.type.startsWith("image/")) return;

                if (selectedFiles.length >= 5) {
                    message.textContent = "Você pode adicionar no máximo 5 novas fotos por vez.";
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

    currentImagesContainer.addEventListener("click", async (event) => {
        const removeButton = event.target.closest(".btn-remove-photo");
        const mainButton = event.target.closest(".btn-set-main-photo");

        if (removeButton) {
            const imageId = removeButton.dataset.imageId;
            await deleteExistingImage(imageId, removeButton);
        }

        if (mainButton) {
            const imageId = mainButton.dataset.imageId;
            await setMainImage(imageId);
        }
    });

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        message.textContent = "";

        const currentImagesCount = currentImagesContainer.querySelectorAll(".photo-item").length;
        const totalImages = currentImagesCount + selectedFiles.length;

        const addressSelect = document.getElementById("addressId");
        const selectedAddressId = addressSelect.value ? Number(addressSelect.value) : null;

        const toolData = {
            nome: document.getElementById("nomeFerramenta").value.trim(),
            categoria: document.getElementById("categoria").value,
            estadoConservacao: document.getElementById("estadoConservacao").value,
            valorDiaria: Number(document.getElementById("valorDiaria").value),
            descricao: document.getElementById("descricao").value.trim(),
            quantidadeFotos: totalImages,
            addressId: selectedAddressId,
            localizacao: addressSelect.selectedOptions[0]?.textContent?.trim() || "",
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

        if (totalImages < 1) {
            message.textContent = "A ferramenta precisa ter pelo menos uma imagem.";
            return;
        }

        if (totalImages > 5) {
            message.textContent = "A ferramenta pode ter no máximo 5 imagens no total.";
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
            await loadUserAddresses(user.id, tool.addressId || null);
            document.getElementById("dataInicioDisponibilidade").value = tool.dataInicioDisponibilidade || "";
            document.getElementById("dataFimDisponibilidade").value = tool.dataFimDisponibilidade || "";
            document.getElementById("observacoes").value = tool.observacoes || "";

        } catch (error) {
            console.error(error);
            alert("Não foi possível carregar os dados da ferramenta.");
            window.location.href = "/users/my-tools";
        }
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
                const photoItem = document.createElement("div");
                photoItem.classList.add("photo-item");
                photoItem.dataset.imageId = image.id;

                if (image.principal) {
                    photoItem.classList.add("main-image");
                }

                photoItem.innerHTML = `
    <img src="${image.filePath}" alt="Imagem da ferramenta">

    <button
        type="button"
        class="btn-remove-photo"
        data-image-id="${image.id}"
        aria-label="Remover imagem"
        title="Remover imagem"
    >
        ×
    </button>

    ${
                    image.principal
                        ? `<span class="main-image-badge">Imagem principal</span>`
                        : `<button
                    type="button"
                    class="btn-set-main-photo"
                    data-image-id="${image.id}"
                >
                    Tornar principal
               </button>`
                }
`;

                currentImagesContainer.appendChild(photoItem);
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

async function deleteExistingImage(imageId, buttonElement) {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user || !user.id) {
        window.location.href = "/auth/login";
        return;
    }
    const currentImagesContainer = document.getElementById("currentImagesContainer");
    const totalImages = currentImagesContainer.querySelectorAll(".photo-item").length;

    if (totalImages <= 1) {
        showToast("A ferramenta precisa ter pelo menos uma imagem cadastrada.");
        return;
    }
    const confirmDelete = confirm( "Essa imagem será removida permanentemente agora, mesmo que você não salve as alterações da ferramenta. Deseja continuar?");

    if (!confirmDelete) return;

    try {
        const response = await fetch(`/tools/images/${imageId}/owner/${user.id}`, {
            method: "DELETE"
        });

        if (!response.ok) {
            throw new Error("Erro ao remover imagem.");
        }

        const photoItem = buttonElement.closest(".photo-item");

        if (photoItem) {
            photoItem.remove();
        }

        const currentImagesContainer = document.getElementById("currentImagesContainer");

        if (!currentImagesContainer.querySelector(".photo-item")) {
            currentImagesContainer.innerHTML = "<p>Nenhuma imagem cadastrada.</p>";
        }

        showToast("Imagem removida com sucesso!");

    } catch (error) {
        console.error(error);
        showToast("Não foi possível remover a imagem.");
    }
}

async function setMainImage(imageId) {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user || !user.id) {
        window.location.href = "/auth/login";
        return;
    }

    try {
        const response = await fetch(`/tools/images/${imageId}/owner/${user.id}/main`, {
            method: "PATCH"
        });

        if (!response.ok) {
            throw new Error("Erro ao definir imagem principal.");
        }

        await reloadImagesAfterMainChange();

        showToast("Imagem principal atualizada!");

    } catch (error) {
        console.error(error);
        showToast("Não foi possível definir a imagem principal.");
    }
}

async function reloadImagesAfterMainChange() {
    const currentImagesContainer = document.getElementById("currentImagesContainer");

    try {
        const response = await fetch(`/tools/${TOOL_ID}/images`);

        if (!response.ok) return;

        const images = await response.json();

        currentImagesContainer.innerHTML = "";

        images.forEach(image => {
            const photoItem = document.createElement("div");
            photoItem.classList.add("photo-item");
            photoItem.dataset.imageId = image.id;

            if (image.principal) {
                photoItem.classList.add("main-image");
            }

            photoItem.innerHTML = `
                <img src="${image.filePath}" alt="Imagem da ferramenta">

                <button
                    type="button"
                    class="btn-remove-photo"
                    data-image-id="${image.id}"
                    aria-label="Remover imagem"
                    title="Remover imagem"
                >
                    ×
                </button>

                ${
                image.principal
                    ? `<span class="main-image-badge">Imagem principal</span>`
                    : `<button
                                type="button"
                                class="btn-set-main-photo"
                                data-image-id="${image.id}"
                            >
                                Tornar principal
                           </button>`
            }
            `;

            currentImagesContainer.appendChild(photoItem);
        });

    } catch (error) {
        console.error(error);
    }
}

