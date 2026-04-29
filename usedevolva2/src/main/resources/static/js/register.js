const form = document.getElementById("registerForm");
const message = document.querySelector(".form-message");

form.addEventListener("submit", async function (event) {
    event.preventDefault();

    message.textContent = "";

    const senha = document.getElementById("senha").value;
    const confirmarSenha = document.getElementById("confirmarSenha").value;

    if (senha !== confirmarSenha) {
        message.textContent = "As senhas não conferem.";
        return;
    }

    const userData = {
        nomeCompleto: document.getElementById("nome").value,
        documento: document.getElementById("cpf").value,
        telefone: document.getElementById("telefone").value,
        dataNascimento: document.getElementById("dataNascimento").value,
        email: document.getElementById("email").value,
        senha: senha,
        aceitouTermosUso: document.getElementById("aceitouTermosUso").checked,
        aceitouPoliticaPrivacidade: document.getElementById("aceitouPoliticaPrivacidade").checked
    };

    try {
        const response = await fetch("/users", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(userData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || "Erro ao criar conta.");
        }

        message.textContent = "Conta criada com sucesso! Redirecionando para o login...";

        setTimeout(() => {
            window.location.href = "login.html";
        }, 1500);

    } catch (error) {
        message.textContent = "Não foi possível criar a conta. Verifique os dados informados.";
        console.error(error);
    }
});