document.addEventListener("DOMContentLoaded", async () => {
    const savedUser = JSON.parse(localStorage.getItem("user"));

    if (!savedUser || !savedUser.id) {
        window.location.href = "/auth/login";
        return;
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