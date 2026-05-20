document.addEventListener("DOMContentLoaded", async () => {
    const savedUser = JSON.parse(localStorage.getItem("user"));
    console.log("Saved user from localStorage:", savedUser);

    if (!savedUser || !savedUser.id) {
        window.location.href = "/auth/login";
        return;
    }

    if (typeof initAddressModal === "function") {
        initAddressModal(savedUser.id, () => {
            console.log("Endereço salvo com sucesso.");
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

        const planMessage = document.getElementById("planMessage");
        const planButton = document.getElementById("planButton");

        if (user.plano && user.plano !== "FREE") {
            const hoje = new Date();
            const expiracao = user.planExpiresAt ? new Date(user.planExpiresAt) : null;

            console.log("Plano:", user.plano, "Expiração:", user.planExpiresAt);

            if (expiracao && expiracao < hoje) {
                planMessage.textContent = `Seu plano ${user.plano} expirou. Renove para continuar aproveitando os recursos.`;
                planButton.textContent = "Renovar Plano";
                console.log("Plano expirado. Botão e mensagem atualizados.");
            } else {
                planMessage.textContent = `Você está no plano ${user.plano}. Aproveite os recursos disponíveis!`;
                planButton.textContent = "Atualizar Plano";
                console.log("Plano ativo. Botão e mensagem atualizados.");
            }
        } else {
            planMessage.textContent = "Escolha um plano para liberar mais recursos na plataforma.";
            planButton.textContent = "Ver Planos";
            console.log("Plano FREE. Botão e mensagem padrão.");
        }

        const initials = getInitials(user.nomeCompleto);
        document.getElementById("profileAvatar").textContent = initials;

        localStorage.setItem("user", JSON.stringify(user));
        console.log("LocalStorage atualizado com os dados do usuário:", localStorage.getItem("user"));

    } catch (error) {
        console.error("Erro ao carregar dados do perfil:", error);
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