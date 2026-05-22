const loginForm = document.querySelector(".login-form");
const formMessage = document.querySelector(".form-message");

if (loginForm) {
    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        formMessage.textContent = "";

        const email = document.getElementById("loginEmail").value.trim();
        const senha = document.getElementById("loginSenha").value.trim();

        if (!email || !senha) {
            formMessage.textContent = "Preencha e-mail e senha.";
            return;
        }

        try {
            const response = await fetch("/security/admin/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: email,
                    senha: senha
                })
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || "Login inválido.");
            }

            const admin = await response.json();

            localStorage.setItem("admin", JSON.stringify(admin));

            window.location.href = "/admin/dashboard";

        } catch (error) {
            formMessage.textContent = error.message || "E-mail ou senha inválidos.";
            console.error(error);
        }
    });
}