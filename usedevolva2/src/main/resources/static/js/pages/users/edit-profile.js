document.addEventListener("DOMContentLoaded", async () => {
    const savedUser = JSON.parse(localStorage.getItem("user"));

    if (!savedUser || !savedUser.id) {
        window.location.href = "/auth/login";
        return;
    }

    const avatar = document.getElementById("editProfileAvatar");
    const form = document.getElementById("editProfileForm");
    const photoInput = document.getElementById("profilePhotoInput");
    const savePhotoBtn = document.getElementById("saveProfilePhotoBtn");
    const removePhotoBtn = document.getElementById("removeProfilePhotoBtn");
    const telefoneInput = document.getElementById("telefone");

    telefoneInput?.addEventListener("input", () => {
        telefoneInput.value = aplicarMascaraTelefone(telefoneInput.value);
        limparErroTelefone();
    });

    let currentUser = savedUser;
    let selectedPhotoFile = null;

    try {
        const response = await fetch(`/users/${savedUser.id}`);

        if (!response.ok) {
            throw new Error("Não foi possível carregar seus dados.");
        }

        currentUser = await response.json();
        localStorage.setItem("user", JSON.stringify(currentUser));
        fillProfileForm(currentUser);
        renderEditProfileAvatar(avatar, currentUser);
        updateRemovePhotoButton(removePhotoBtn, currentUser);
    } catch (error) {
        showEditProfileToast(error.message || "Erro ao carregar o perfil.", "error");
        fillProfileForm(savedUser);
        renderEditProfileAvatar(avatar, savedUser);
        updateRemovePhotoButton(removePhotoBtn, savedUser);
    }

    photoInput?.addEventListener("change", () => {
        selectedPhotoFile = photoInput.files && photoInput.files[0] ? photoInput.files[0] : null;

        if (!selectedPhotoFile) {
            savePhotoBtn.disabled = true;
            renderEditProfileAvatar(avatar, currentUser);
            return;
        }

        if (!selectedPhotoFile.type.startsWith("image/")) {
            showEditProfileToast("Selecione um arquivo de imagem.", "error");
            photoInput.value = "";
            selectedPhotoFile = null;
            savePhotoBtn.disabled = true;
            return;
        }

        if (selectedPhotoFile.size > 5 * 1024 * 1024) {
            showEditProfileToast("A imagem deve ter no máximo 5 MB.", "error");
            photoInput.value = "";
            selectedPhotoFile = null;
            savePhotoBtn.disabled = true;
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            avatar.innerHTML = `<img src="${reader.result}" alt="Prévia da foto de perfil">`;
        };
        reader.readAsDataURL(selectedPhotoFile);
        savePhotoBtn.disabled = false;
    });

    savePhotoBtn?.addEventListener("click", async () => {
        if (!selectedPhotoFile) return;

        const formData = new FormData();
        formData.append("file", selectedPhotoFile);

        try {
            savePhotoBtn.disabled = true;
            savePhotoBtn.textContent = "Salvando...";

            const response = await fetch(`/users/${currentUser.id}/profile-photo`, {
                method: "POST",
                body: formData
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || "Erro ao salvar a foto de perfil.");
            }

            currentUser = await response.json();
            localStorage.setItem("user", JSON.stringify(currentUser));
            renderEditProfileAvatar(avatar, currentUser);
            updateRemovePhotoButton(removePhotoBtn, currentUser);
            selectedPhotoFile = null;
            photoInput.value = "";
            showEditProfileToast("Foto de perfil atualizada com sucesso.", "success");
        } catch (error) {
            showEditProfileToast(error.message || "Não foi possível salvar a foto.", "error");
            savePhotoBtn.disabled = false;
        } finally {
            savePhotoBtn.textContent = "Salvar foto";
        }
    });

    removePhotoBtn?.addEventListener("click", async () => {
        if (!currentUser || !currentUser.id || !currentUser.profileImageUrl) {
            return;
        }

        const confirmed = window.confirm("Remover sua foto de perfil?");
        if (!confirmed) {
            return;
        }

        try {
            removePhotoBtn.disabled = true;
            removePhotoBtn.textContent = "Removendo...";

            const response = await fetch(`/users/${currentUser.id}/profile-photo`, {
                method: "DELETE"
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || "Erro ao remover a foto de perfil.");
            }

            currentUser = await response.json();
            localStorage.setItem("user", JSON.stringify(currentUser));
            selectedPhotoFile = null;
            photoInput.value = "";
            savePhotoBtn.disabled = true;
            renderEditProfileAvatar(avatar, currentUser);
            updateRemovePhotoButton(removePhotoBtn, currentUser);
            showEditProfileToast("Foto de perfil removida com sucesso.", "success");
        } catch (error) {
            showEditProfileToast(error.message || "Não foi possível remover a foto.", "error");
            updateRemovePhotoButton(removePhotoBtn, currentUser);
        } finally {
            removePhotoBtn.textContent = "Remover foto";
        }
    });

    form?.addEventListener("submit", async (event) => {
        event.preventDefault();

        const payload = {
            nomeCompleto: document.getElementById("nomeCompleto").value.trim(),
            email: document.getElementById("email").value.trim(),
            telefone: document.getElementById("telefone").value.trim(),
            senhaAtual: document.getElementById("senhaAtual").value,
            novaSenha: document.getElementById("novaSenha").value
        };

        if (!payload.nomeCompleto || !payload.email || !payload.telefone) {
            showEditProfileToast("Preencha nome, e-mail e telefone.", "error");
            return;
        }

        if (!validarTelefone(payload.telefone)) {
            mostrarErroTelefone("Informe um telefone celular válido com DDD, totalizando 11 números.");
            showEditProfileToast("Corrija o telefone antes de salvar.", "error");
            return;
        }

        if (payload.novaSenha && payload.novaSenha.length < 8) {
            showEditProfileToast("A nova senha deve ter no mínimo 8 caracteres.", "error");
            return;
        }

        if (payload.novaSenha && !payload.senhaAtual) {
            showEditProfileToast("Informe a senha atual para trocar a senha.", "error");
            return;
        }

        if (!payload.novaSenha) {
            payload.senhaAtual = null;
            payload.novaSenha = null;
        }

        const saveProfileBtn = document.getElementById("saveProfileBtn");

        try {
            saveProfileBtn.disabled = true;
            saveProfileBtn.textContent = "Salvando...";

            const response = await fetch(`/users/${currentUser.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || "Erro ao salvar o perfil.");
            }

            currentUser = await response.json();
            localStorage.setItem("user", JSON.stringify(currentUser));
            fillProfileForm(currentUser);
            document.getElementById("senhaAtual").value = "";
            document.getElementById("novaSenha").value = "";
            showEditProfileToast("Perfil atualizado com sucesso.", "success");
        } catch (error) {
            showEditProfileToast(error.message || "Não foi possível salvar o perfil.", "error");
        } finally {
            saveProfileBtn.disabled = false;
            saveProfileBtn.textContent = "Salvar alterações";
        }
    });
});

function fillProfileForm(user) {
    document.getElementById("nomeCompleto").value = user.nomeCompleto || "";
    document.getElementById("email").value = user.email || "";
    document.getElementById("telefone").value = aplicarMascaraTelefone(user.telefone || "");
}

function renderEditProfileAvatar(avatarElement, user) {
    if (!avatarElement) return;

    if (user.profileImageUrl) {
        avatarElement.innerHTML = `<img src="${user.profileImageUrl}" alt="Foto de perfil">`;
        return;
    }

    avatarElement.textContent = getEditProfileInitials(user.nomeCompleto);
}

function updateRemovePhotoButton(button, user) {
    if (!button) return;

    button.disabled = !(user && user.profileImageUrl);
}

function getEditProfileInitials(name) {
    if (!name) return "--";

    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
        return parts[0].substring(0, 2).toUpperCase();
    }

    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function showEditProfileToast(message, type = "success") {
    let toastContainer = document.getElementById("editProfileToastContainer");

    if (!toastContainer) {
        toastContainer = document.createElement("div");
        toastContainer.id = "editProfileToastContainer";
        toastContainer.className = "edit-profile-toast-container";
        document.body.appendChild(toastContainer);
    }

    const toast = document.createElement("div");
    toast.className = `edit-profile-toast ${type}`;
    toast.textContent = message;

    toastContainer.appendChild(toast);

    setTimeout(() => toast.classList.add("show"), 10);

    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 250);
    }, 3000);
}


function aplicarMascaraTelefone(value) {
    value = String(value || "").replace(/\D/g, "").slice(0, 11);

    return value
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2");
}

function validarTelefone(telefone) {
    return String(telefone || "").replace(/\D/g, "").length === 11;
}

function mostrarErroTelefone(texto) {
    const errorElement = document.getElementById("telefoneError");
    const inputElement = document.getElementById("telefone");

    if (errorElement) errorElement.textContent = texto;
    if (inputElement) inputElement.classList.add("input-error");
}

function limparErroTelefone() {
    const errorElement = document.getElementById("telefoneError");
    const inputElement = document.getElementById("telefone");

    if (errorElement) errorElement.textContent = "";
    if (inputElement) inputElement.classList.remove("input-error");
}
