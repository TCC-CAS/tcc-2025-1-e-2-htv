document.addEventListener("DOMContentLoaded", function () {
    const adminData = JSON.parse(localStorage.getItem("admin"));

    const adminModal = document.getElementById("addAdminModal");
    const openAdminModalBtn = document.getElementById("openAddAdminBtn");
    const closeAdminModalBtn = document.getElementById("closeAdminModal");
    const addAdminForm = document.getElementById("addAdminForm");

    if (openAdminModalBtn && adminModal && closeAdminModalBtn) {
        openAdminModalBtn.addEventListener("click", () => {
            adminModal.style.display = "flex";
        });

        const fecharModalAdmin = () => {
            adminModal.style.display = "none";
            if (addAdminForm) addAdminForm.reset();
        };

        closeAdminModalBtn.addEventListener("click", fecharModalAdmin);

        window.addEventListener("click", (e) => {
            if (e.target === adminModal) {
                fecharModalAdmin();
            }
        });
    }

    if (addAdminForm) {
        addAdminForm.addEventListener("submit", async function (e) {
            e.preventDefault();

            if (!adminData || !adminData.id) {
                alert("Sessão expirada. Faça login novamente.");
                window.location.href = "/admin";
                return;
            }

            const nome = document.getElementById("newAdminName").value;
            const email = document.getElementById("newAdminEmail").value;
            const senha = document.getElementById("newAdminPassword").value;

            const submitBtn = this.querySelector("button[type='submit']");
            if (submitBtn) submitBtn.disabled = true;

            try {
                const response = await fetch("/security/admin/create", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-Admin-Id": adminData.id
                    },
                    body: JSON.stringify({
                        nome: nome,
                        email: email,
                        senha: senha,
                        ativo: true
                    })
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(errorText || "Erro ao registrar o novo administrador.");
                }

                alert("🎉 Novo administrador cadastrado com sucesso!");

                adminModal.style.display = "none";
                addAdminForm.reset();

            } catch (error) {
                console.error("Erro:", error);
                alert(error.message);
            } finally {
                if (submitBtn) submitBtn.disabled = false;
            }
        });
    }
});