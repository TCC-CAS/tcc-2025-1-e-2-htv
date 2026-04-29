const form = document.getElementById("registerForm");
const message = document.querySelector(".form-message");
const cpfInput = document.getElementById("cpf");
const telefoneInput = document.getElementById("telefone");
const nomeInput = document.getElementById("nome");
const dataNascimentoInput = document.getElementById("dataNascimento");
const emailInput = document.getElementById("email");
const senhaInput = document.getElementById("senha");
const confirmarSenhaInput = document.getElementById("confirmarSenha");
const termosInput = document.getElementById("aceitouTermosUso");
const privacidadeInput = document.getElementById("aceitouPoliticaPrivacidade");

cpfInput.addEventListener("input", () => {
    cpfInput.value = aplicarMascaraCPF(cpfInput.value);
});

telefoneInput.addEventListener("input", () => {
    telefoneInput.value = aplicarMascaraTelefone(telefoneInput.value);
});

form.addEventListener("submit", async function (event) {
    event.preventDefault();

    limparErros();
    message.textContent = "";

    const nome = nomeInput.value.trim();
    const cpf = cpfInput.value.trim();
    const telefone = telefoneInput.value.trim();
    const dataNascimento = dataNascimentoInput.value;
    const email = emailInput.value.trim();
    const senha = senhaInput.value;
    const confirmarSenha = confirmarSenhaInput.value;
    const aceitouTermos = termosInput.checked;
    const aceitouPrivacidade = privacidadeInput.checked;

    let formValido = true;

    if (!nome) {
        mostrarErro("nome", "Informe seu nome completo.");
        formValido = false;
    } else if (nome.split(" ").length < 2) {
        mostrarErro("nome", "Informe nome e sobrenome.");
        formValido = false;
    }

    if (!validarCPF(cpf)) {
        mostrarErro("cpf", "Informe um CPF válido.");
        formValido = false;
    }

    if (!validarTelefone(telefone)) {
        mostrarErro("telefone", "Informe um telefone válido com DDD.");
        formValido = false;
    }

    if (!dataNascimento) {
        mostrarErro("dataNascimento", "Informe sua data de nascimento.");
        formValido = false;
    } else if (!validarIdade(dataNascimento)) {
        mostrarErro("dataNascimento", "Você precisa ter pelo menos 18 anos.");
        formValido = false;
    }

    if (!validarEmail(email)) {
        mostrarErro("email", "Informe um e-mail válido.");
        formValido = false;
    }

    if (!senha || senha.length < 8) {
        mostrarErro("senha", "A senha deve ter no mínimo 8 caracteres.");
        formValido = false;
    }

    if (!confirmarSenha) {
        mostrarErro("confirmarSenha", "Confirme sua senha.");
        formValido = false;
    } else if (senha !== confirmarSenha) {
        mostrarErro("confirmarSenha", "As senhas não conferem.");
        formValido = false;
    }

    if (!aceitouTermos || !aceitouPrivacidade) {
        mostrarErro("termos", "Você precisa aceitar os termos e a política de privacidade.");
        formValido = false;
    }

    if (!formValido) {
        message.textContent = "Corrija os campos destacados antes de continuar.";
        return;
    }

    const userData = {
        nomeCompleto: nome,
        documento: cpf,
        telefone: telefone,
        dataNascimento: dataNascimento,
        email: email,
        senha: senha,
        aceitouTermosUso: aceitouTermos,
        aceitouPoliticaPrivacidade: aceitouPrivacidade
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

            if (errorText.toLowerCase().includes("email")) {
                mostrarErro("email", "Este e-mail já está cadastrado ou é inválido.");
            } else if (errorText.toLowerCase().includes("cpf") || errorText.toLowerCase().includes("documento")) {
                mostrarErro("cpf", "Este CPF já está cadastrado ou é inválido.");
            } else {
                message.textContent = "Não foi possível criar a conta. Verifique os dados informados.";
            }

            throw new Error(errorText || "Erro ao criar conta.");
        }

        showToast("Conta criada com sucesso!");

        setTimeout(() => {
            window.location.href = "/auth/login";
        }, 1500);

    } catch (error) {
        console.error(error);

        if (!message.textContent) {
            message.textContent = "Não foi possível criar a conta. Verifique os dados informados.";
        }
    }
});

function mostrarErro(campo, texto) {
    const errorElement = document.getElementById(`${campo}Error`);
    const inputElement = document.getElementById(campo);

    if (errorElement) {
        errorElement.textContent = texto;
    }

    if (inputElement) {
        inputElement.classList.add("input-error");
    }
}

function limparErros() {
    document.querySelectorAll(".field-error").forEach(error => {
        error.textContent = "";
    });

    document.querySelectorAll(".input-error").forEach(input => {
        input.classList.remove("input-error");
    });
}

function aplicarMascaraCPF(value) {
    return value
        .replace(/\D/g, "")
        .slice(0, 11)
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function aplicarMascaraTelefone(value) {
    value = value.replace(/\D/g, "").slice(0, 11);

    if (value.length <= 10) {
        return value
            .replace(/(\d{2})(\d)/, "($1) $2")
            .replace(/(\d{4})(\d)/, "$1-$2");
    }

    return value
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2");
}

function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    return regex.test(email);
}

function validarTelefone(telefone) {
    const somenteNumeros = telefone.replace(/\D/g, "");
    return somenteNumeros.length === 10 || somenteNumeros.length === 11;
}

function validarIdade(dataNascimento) {
    const hoje = new Date();
    const nascimento = new Date(dataNascimento + "T00:00:00");

    if (nascimento > hoje) return false;

    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mes = hoje.getMonth() - nascimento.getMonth();

    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
        idade--;
    }

    return idade >= 18;
}

function validarCPF(cpf) {
    cpf = cpf.replace(/[^\d]+/g, "");

    if (cpf.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cpf)) return false;

    let soma = 0;
    let resto;

    for (let i = 1; i <= 9; i++) {
        soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    }

    resto = (soma * 10) % 11;

    if (resto === 10 || resto === 11) {
        resto = 0;
    }

    if (resto !== parseInt(cpf.substring(9, 10))) {
        return false;
    }

    soma = 0;

    for (let i = 1; i <= 10; i++) {
        soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    }

    resto = (soma * 10) % 11;

    if (resto === 10 || resto === 11) {
        resto = 0;
    }

    return resto === parseInt(cpf.substring(10, 11));
}

cpfInput.addEventListener("input", () => {
    let value = cpfInput.value.replace(/\D/g, "");

    value = value.slice(0, 11);

    value = value
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");

    cpfInput.value = value;
});

telefoneInput.addEventListener("input", () => {
    let value = telefoneInput.value.replace(/\D/g, "");

    value = value.slice(0, 11);

    if (value.length <= 10) {
        value = value
            .replace(/(\d{2})(\d)/, "($1) $2")
            .replace(/(\d{4})(\d)/, "$1-$2");
    } else {
        value = value
            .replace(/(\d{2})(\d)/, "($1) $2")
            .replace(/(\d{5})(\d)/, "$1-$2");
    }

    telefoneInput.value = value;
});

