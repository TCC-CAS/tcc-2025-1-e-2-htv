document.addEventListener("DOMContentLoaded", async () => {
    const savedUser = JSON.parse(localStorage.getItem("user"));

    if (!savedUser || !savedUser.id) {
        window.location.href = "/auth/login";
        return;
    }

    if (typeof initAddressModal === "function") {
        initAddressModal(savedUser.id, () => {
            alert("Endereço salvo com sucesso.");
        });
    } else {
        alert("Erro: arquivo address-modal.js não foi carregado.");
        return;
    }

    const openProfileAddressModalBtn = document.getElementById("openProfileAddressModalBtn");

    if (openProfileAddressModalBtn) {
        openProfileAddressModalBtn.addEventListener("click", () => {
            openAddressModal();
        });
    }

    try {
        const response = await fetch(`/users/${savedUser.id}`);

        if (!response.ok) {
            throw new Error("Erro ao buscar dados do usuário.");
        }

        const user = await response.json();

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
            const expiracao = user.planExpiresAt ? new Date(user.planExpiresAt) : null;

            if (expiracao && expiracao < hoje) {
                planMessage.textContent = `Seu plano ${user.plano} expirou. Renove para continuar aproveitando os recursos.`;
                planButton.textContent = "Renovar Plano";
            } else {
                planMessage.textContent = `Você está no plano ${user.plano}. Aproveite os recursos disponíveis!`;
                planButton.textContent = "Atualizar Plano";
            }
        } else {
            planMessage.textContent = "Escolha um plano para liberar mais recursos na plataforma.";
            planButton.textContent = "Ver Planos";
        }


        const initials = getInitials(user.nomeCompleto);
        document.getElementById("profileAvatar").textContent = initials;

        localStorage.setItem("user", JSON.stringify(user));

    } catch (error) {
        console.error(error);
        alert("Não foi possível carregar os dados do perfil.");
    }
});

function getInitials(name) {
    if (!name) return "--";

    const parts = name.trim().split(" ");

    if (parts.length === 1) {
        return parts[0].substring(0, 2).toUpperCase();
    }

    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}