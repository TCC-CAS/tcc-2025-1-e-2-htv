const loginForm = document.querySelector(".login-form");
const formMessage = document.querySelector(".form-message");

loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    formMessage.textContent = "";

    const email = document.getElementById("loginEmail").value;
    const senha = document.getElementById("loginSenha").value;

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
            const error = await response.text();
            throw new Error(error);
        }

        const user = await response.json();

        // (Opcional) salvar sessão
        localStorage.setItem("user", JSON.stringify(user));

        formMessage.textContent = "Login realizado com sucesso!";

        // 🔥 REDIRECIONAMENTO
        setTimeout(() => {
            window.location.href = "/home";
        }, 1000);

    } catch (error) {
        formMessage.textContent = "E-mail ou senha inválidos.";
        console.error(error);
    }
});