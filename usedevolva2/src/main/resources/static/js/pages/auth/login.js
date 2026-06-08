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

                const errorText = await response.text();

                throw new Error(errorText || "Login inválido.");
            }

            const user = await response.json();

            localStorage.setItem("user", JSON.stringify(user));

            window.location.href = "/home";

        } catch (error) {

            formMessage.textContent = error.message;

            if (error.message.includes("bloqueada")) {

                formMessage.style.background = "#fff3cd";
                formMessage.style.color = "#856404";
                formMessage.style.border = "1px solid #ffeeba";
                formMessage.style.padding = "12px";
                formMessage.style.borderRadius = "8px";

            } else {

                formMessage.style.background = "transparent";
                formMessage.style.color = "#dc3545";
                formMessage.style.border = "none";
                formMessage.style.padding = "0";
            }            console.error(error);
        }
    });
}


const recoveryForm = document.getElementById('recoveryForm');

if (recoveryForm) {
    recoveryForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const emailInput = document.getElementById('email');
        const messageEl = document.getElementById('recoveryMessage');

        if (!emailInput || !messageEl) {
            console.error("Elementos do formulário de recuperação não foram localizados no HTML.");
            return;
        }

        const email = emailInput.value.trim();

        if (!email) {
            messageEl.style.color = '#dc3545';
            messageEl.textContent = 'Informe o e-mail cadastrado.';
            return;
        }

        try {
            messageEl.style.color = '#6c757d';
            messageEl.textContent = 'Processando requisição...';

            const response = await fetch('/auth/request-recovery', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json, text/plain, */*'
                },
                body: JSON.stringify({ email: email })
            });

            const responseText = await response.text();

            if (response.ok) {
                messageEl.style.color = '#28a745'; // Verde de sucesso
                messageEl.textContent = 'Verifique sua caixa de entrada, enviamos o link de recuperação!';
            } else {
                throw new Error(responseText || 'E-mail não encontrado ou erro no servidor.');
            }
        } catch (err) {
            messageEl.style.color = '#dc3545';
            messageEl.textContent = err.message;
        }
    });
}
