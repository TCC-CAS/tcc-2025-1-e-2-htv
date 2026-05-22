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
            const response = await fetch("/users/login", {
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
                throw new Error("Login inválido.");
            }

            const user = await response.json();

            localStorage.setItem("user", JSON.stringify(user));

            window.location.href = "/home";

        } catch (error) {
            formMessage.textContent = "E-mail ou senha inválidos.";
            console.error(error);
        }
    });
}