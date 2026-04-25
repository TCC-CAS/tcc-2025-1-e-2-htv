const registerForm = document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const senha = document.getElementById("senha").value;
        const confirmarSenha = document.getElementById("confirmarSenha").value;

        if (senha !== confirmarSenha) {
            alert("As senhas não são iguais.");
            return;
        }

        const userData = {
            nomeCompleto: document.getElementById("nome").value.trim(),
            documento: document.getElementById("cpf").value.trim(),
            telefone: document.getElementById("telefone").value.trim(),
            dataNascimento: document.getElementById("dataNascimento").value,
            email: document.getElementById("email").value.trim(),
            senha: senha,
            aceitouTermosUso: document.getElementById("aceitouTermosUso").checked,
            aceitouPoliticaPrivacidade: document.getElementById("aceitouPoliticaPrivacidade").checked
        };

        try {
            const user = await apiRequest("/users", "POST", userData);

            alert("Conta criada com sucesso!");
            console.log(user);

            window.location.href = "login.html";

        } catch (error) {
            alert(error.message);
        }
    });
}