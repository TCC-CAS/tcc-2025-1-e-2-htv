document.addEventListener("DOMContentLoaded", async () => {
    const savedUser = JSON.parse(localStorage.getItem("user"));
    console.log("Saved user from localStorage:", savedUser);

    if (!savedUser || !savedUser.id) {
        window.location.href = "/auth/login";
        return;
    }

    if (typeof initAddressModal === "function") {
        initAddressModal(savedUser.id, async () => {
            await loadAddressManager(savedUser.id);
        });
    } else {
        alert("Erro: Recarregue a página e tente novamente.");
        return;
    }

    createAddressManagerModal();

    const openProfileAddressModalBtn = document.getElementById("openProfileAddressModalBtn");
    if (openProfileAddressModalBtn) {
        openProfileAddressModalBtn.addEventListener("click", async () => {
            await openAddressManager(savedUser.id);
        });
    }

    const profileLogoutBtn = document.getElementById("profileLogoutBtn");
    if (profileLogoutBtn) {
        profileLogoutBtn.addEventListener("click", () => {
            localStorage.removeItem("user");
            localStorage.removeItem("pendingPaymentId");
            window.location.href = "/auth/login";
        });
    }

    try {
        const response = await fetch(`/users/${savedUser.id}`);
        console.log("Resposta do fetch /users/:id:", response);

        if (!response.ok) {
            throw new Error("Erro ao buscar dados do usuário.");
        }

        const user = await response.json();
        console.log("Usuário retornado do backend:", user);

        document.getElementById("profileName").textContent = user.nomeCompleto || "Usuário";
        document.getElementById("profileEmail").textContent = user.email || "---";
        document.getElementById("profilePhone").textContent = user.telefone || "---";

        const currentPlan = document.getElementById("currentPlan");
        if (currentPlan) {
            currentPlan.textContent = user.plano || "FREE";
        }

        const planMessage = document.querySelector(".plan-card p");
        const planButton = document.getElementById("openPlansModalBtn");

        if (user.plano && user.plano !== "FREE") {
            const hoje = new Date();
            const expiracao = user.planExpiresAt ? new Date(user.planExpiresAt + "T00:00:00") : null;

            if (expiracao && expiracao < hoje) {
                planMessage.textContent = `Seu plano ${user.plano} expirou em ${expiracao.toLocaleDateString()}. Renove para continuar aproveitando os recursos.`;
                planButton.textContent = "Renovar Plano";
            } else if (expiracao) {
                planMessage.textContent = `Você está no plano ${user.plano}. Expira em ${expiracao.toLocaleDateString()}. Aproveite os recursos disponíveis!`;
                planButton.textContent = "Atualizar Plano";
            } else {
                planMessage.textContent = `Você está no plano ${user.plano}. Aproveite os recursos disponíveis!`;
                planButton.textContent = "Atualizar Plano";
            }
        }

        const plansModal = document.getElementById("plansModal");
        const openPlansModalBtn = document.getElementById("openPlansModalBtn");
        const closePlansModalBtn = document.getElementById("closePlansModalBtn");

        if (openPlansModalBtn && plansModal) {
            openPlansModalBtn.addEventListener("click", () => {
                plansModal.classList.add("active");
            });
        }

        if (closePlansModalBtn && plansModal) {
            closePlansModalBtn.addEventListener("click", () => {
                plansModal.classList.remove("active");
            });
        }

        if (plansModal) {
            plansModal.addEventListener("click", (event) => {
                if (event.target.id === "plansModal") {
                    plansModal.classList.remove("active");
                }
            });
        }

        renderProfileAvatar(user);
        renderProfileAvatar(user);
        setupProfilePhotoUpload(user);

        localStorage.setItem("user", JSON.stringify(user));
        console.log("LocalStorage atualizado com os dados do usuário:", localStorage.getItem("user"));

    } catch (error) {
        console.error("Erro ao carregar dados do perfil:", error);
        alert("Não foi possível carregar os dados do perfil.");
    }
});

function setupProfilePhotoUpload(user) {
    const button = document.getElementById("profilePhotoBtn");
    const input = document.getElementById("profilePhotoInput");

    if (!button || !input || button.dataset.initialized === "true") {
        return;
    }

    button.dataset.initialized = "true";

    button.addEventListener("click", () => {
        input.click();
    });

    input.addEventListener("change", async () => {
        const file = input.files && input.files[0] ? input.files[0] : null;

        if (!file) return;

        if (!file.type.startsWith("image/")) {
            showProfileToast("Selecione um arquivo de imagem.", "error");
            input.value = "";
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            showProfileToast("A imagem deve ter no máximo 5 MB.", "error");
            input.value = "";
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        try {
            button.classList.add("loading");
            button.disabled = true;

            const response = await fetch(`/users/${user.id}/profile-photo`, {
                method: "POST",
                body: formData
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || "Erro ao salvar a foto de perfil.");
            }

            const updatedUser = await response.json();
            localStorage.setItem("user", JSON.stringify(updatedUser));
            renderProfileAvatar(updatedUser);
            showProfileToast("Foto de perfil atualizada com sucesso.", "success");
        } catch (error) {
            console.error(error);
            showProfileToast(error.message || "Não foi possível atualizar a foto.", "error");
        } finally {
            button.classList.remove("loading");
            button.disabled = false;
            input.value = "";
        }
    });
}

function renderProfileAvatar(user) {
    const avatar = document.getElementById("profileAvatar");

    if (!avatar) return;

    if (user.profileImageUrl) {
        avatar.innerHTML = `<img src="${user.profileImageUrl}" alt="Foto de perfil">`;
        return;
    }

    avatar.textContent = getInitials(user.nomeCompleto);
}

function getInitials(name) {
    if (!name) return "--";

    const parts = name.trim().split(" ");
    if (parts.length === 1) {
        return parts[0].substring(0, 2).toUpperCase();
    }

    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

let selectedMainAddressId = null;
let currentProfileUserId = null;
let currentAddresses = [];

function createAddressManagerModal() {
    if (document.getElementById("addressManagerOverlay")) return;

    const modal = document.createElement("div");
    modal.id = "addressManagerOverlay";
    modal.className = "address-manager-overlay";

    modal.innerHTML = `
        <div class="address-manager-modal">
            <div class="address-manager-header">
                <h2>Escolha um endereço principal</h2>
                <button type="button" class="address-manager-close" id="closeAddressManagerBtn">×</button>
            </div>

            <div id="addressManagerList" class="address-manager-list">
                <p>Carregando endereços...</p>
            </div>

            <div class="address-manager-actions">
                <button type="button" class="btn btn-primary" id="confirmMainAddressBtn">
                    Confirmar
                </button>

                <button type="button" class="btn btn-outline" id="createNewAddressBtn">
                    Criar novo
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    document.getElementById("closeAddressManagerBtn").addEventListener("click", closeAddressManager);

    modal.addEventListener("click", (event) => {
        if (event.target.id === "addressManagerOverlay") {
            closeAddressManager();
        }
    });

    document.getElementById("confirmMainAddressBtn").addEventListener("click", async () => {
        await confirmMainAddress();
    });

    document.getElementById("createNewAddressBtn").addEventListener("click", () => {
        closeAddressManager();
        openAddressModal();
    });
}

async function openAddressManager(userId) {
    currentProfileUserId = userId;
    await loadAddressManager(userId);

    const modal = document.getElementById("addressManagerOverlay");
    if (modal) {
        modal.classList.add("active");
    }
}

function closeAddressManager() {
    const modal = document.getElementById("addressManagerOverlay");
    if (modal) {
        modal.classList.remove("active");
    }
}

async function loadAddressManager(userId) {
    const list = document.getElementById("addressManagerList");
    if (!list) return;

    try {
        list.innerHTML = `<p>Carregando endereços...</p>`;

        const response = await fetch(`/users/${userId}/addresses`);

        if (!response.ok) {
            throw new Error("Erro ao carregar endereços.");
        }

        const addresses = await response.json();
        currentAddresses = addresses || [];

        if (!currentAddresses.length) {
            selectedMainAddressId = null;

            list.innerHTML = `
                <div class="address-empty-state">
                    <p>Nenhum endereço cadastrado.</p>
                    <small>Clique em "Criar novo" para cadastrar seu primeiro endereço.</small>
                </div>
            `;

            return;
        }

        const mainAddress = currentAddresses.find(address => address.principal);
        selectedMainAddressId = mainAddress ? mainAddress.id : currentAddresses[0].id;

        list.innerHTML = currentAddresses.map(address => {
            const checked = Number(selectedMainAddressId) === Number(address.id) ? "checked" : "";
            const cep = address.cep ? formatCepProfile(address.cep) : "---";
            const addressName = address.nomeIdentificacao || "Endereço";
            const addressLine = `${address.logradouro || ""} ${address.numero || ""}`.trim();
            const subtitle = `${addressLine} - ${address.cidade || ""}, CEP: ${cep}`;

            return `
                <div class="address-manager-item">
                    <label class="address-manager-radio-area">
                        <input 
                            type="radio" 
                            name="profileMainAddress" 
                            value="${address.id}" 
                            ${checked}
                        />

                        <div class="address-manager-text">
                            <strong>${addressName}</strong>
                            <span>${subtitle}</span>
                            ${address.principal ? `<small>Endereço principal</small>` : ""}
                        </div>
                    </label>

                    <div class="address-manager-item-actions">
                        <button 
                            type="button" 
                            class="address-manager-icon-btn" 
                            title="Editar endereço"
                            data-action="edit"
                            data-address-id="${address.id}"
                        >
                            ✎
                        </button>

                        <button 
                            type="button" 
                            class="address-manager-icon-btn danger" 
                            title="Excluir endereço"
                            data-action="delete"
                            data-address-id="${address.id}"
                        >
                            ×
                        </button>
                    </div>
                </div>
            `;
        }).join("");

        document.querySelectorAll("input[name='profileMainAddress']").forEach((radio) => {
            radio.addEventListener("change", (event) => {
                selectedMainAddressId = Number(event.target.value);
            });
        });

        document.querySelectorAll(".address-manager-icon-btn").forEach((button) => {
            button.addEventListener("click", async () => {
                const addressId = Number(button.dataset.addressId);
                const action = button.dataset.action;

                if (action === "edit") {
                    await editProfileAddress(addressId);
                }

                if (action === "delete") {
                    await deleteProfileAddress(addressId);
                }
            });
        });

    } catch (error) {
        console.error(error);
        list.innerHTML = `<p>Não foi possível carregar os endereços.</p>`;
    }
}

async function confirmMainAddress() {
    if (!currentProfileUserId || !selectedMainAddressId) {
        showProfileToast("Selecione um endereço.", "error");
        return;
    }

    try {
        const response = await fetch(`/users/${currentProfileUserId}/addresses/${selectedMainAddressId}/main`, {
            method: "PATCH"
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || "Erro ao definir endereço principal.");
        }

        await loadAddressManager(currentProfileUserId);
        showProfileToast("Endereço principal atualizado com sucesso.", "success");
        closeAddressManager();

    } catch (error) {
        console.error(error);
        showProfileToast(error.message || "Não foi possível atualizar o endereço principal.", "error");
    }
}

async function editProfileAddress(addressId) {
    const address = currentAddresses.find(item => Number(item.id) === Number(addressId));

    if (!address) {
        showProfileToast("Endereço não encontrado.", "error");
        return;
    }

    closeAddressManager();
    openAddressModal(address);
}

async function deleteProfileAddress(addressId) {
    if (!currentProfileUserId) return;

    const confirmed = confirm("Tem certeza que deseja excluir este endereço?");
    if (!confirmed) return;

    try {
        const response = await fetch(`/users/${currentProfileUserId}/addresses/${addressId}`, {
            method: "DELETE"
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || "Erro ao excluir endereço.");
        }

        await loadAddressManager(currentProfileUserId);

    } catch (error) {
        console.error(error);
        showProfileToast(error.message || "Não foi possível excluir o endereço.", "error");
    }
}

function formatCepProfile(value) {
    return String(value || "")
        .replace(/\D/g, "")
        .replace(/(\d{5})(\d{3})/, "$1-$2");
}

function showProfileToast(message, type = "success") {
    let toastContainer = document.getElementById("profileToastContainer");

    if (!toastContainer) {
        toastContainer = document.createElement("div");
        toastContainer.id = "profileToastContainer";
        toastContainer.className = "profile-toast-container";
        document.body.appendChild(toastContainer);
    }

    const toast = document.createElement("div");
    toast.className = `profile-toast ${type}`;
    toast.textContent = message;

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.classList.add("show");
    }, 10);

    setTimeout(() => {
        toast.classList.remove("show");

        setTimeout(() => {
            toast.remove();
        }, 250);
    }, 3000);
}