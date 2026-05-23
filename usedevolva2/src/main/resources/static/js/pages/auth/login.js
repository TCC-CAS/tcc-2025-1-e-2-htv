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

document.querySelector('.auth-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const messageEl = document.querySelector('.form-message');

    try {
        const response = await fetch('/auth/request-recovery', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        if (response.ok) {
            messageEl.style.color = 'green';
            messageEl.textContent = 'Verifique sua caixa de entrada, enviamos o link de recuperação!';
        } else {
            throw new Error("E-mail não encontrado ou erro no servidor.");
        }
    } catch (err) {
        messageEl.style.color = 'red';
        messageEl.textContent = err.message;
    }
});
