document.addEventListener("DOMContentLoaded", () => {
    const statusMessage = document.getElementById("paymentStatusMessage");

    if (statusMessage) {
        statusMessage.textContent = "Verificando pagamento em 30 segundos...";
    }

    setTimeout(() => {
        syncPaymentNow();
    }, 30000);
});

async function syncPaymentNow() {
    const statusMessage = document.getElementById("paymentStatusMessage");
    const transactionId = localStorage.getItem("pendingPaymentId");

    if (!transactionId) {
        if (statusMessage) {
            statusMessage.textContent = "Nenhum pagamento pendente foi encontrado.";
        }
        return;
    }

    try {
        if (statusMessage) {
            statusMessage.textContent = "Consultando status do pagamento...";
        }

        const response = await fetch(`/payments/${transactionId}/sync`);
        const result = await response.json();

        if (!result.success) {
            console.error(result);

            if (statusMessage) {
                statusMessage.textContent = "Não foi possível verificar o pagamento agora.";
            }

            return;
        }

        if (result.status === "PAID") {
            localStorage.removeItem("pendingPaymentId");

            const userJson = localStorage.getItem("user");

            if (userJson) {
                const user = JSON.parse(userJson);
                user.plano = result.plano;
                localStorage.setItem("user", JSON.stringify(user));
            }

            if (statusMessage) {
                statusMessage.textContent = "Plano atualizado com sucesso! Redirecionando...";
            }

            setTimeout(() => {
                window.location.href = "/users/profile";
            }, 2000);

            return;
        }

        if (statusMessage) {
            statusMessage.textContent = `Pagamento encontrado, mas ainda está como: ${result.status}`;
        }

    } catch (error) {
        console.error(error);

        if (statusMessage) {
            statusMessage.textContent = "Erro ao verificar pagamento.";
        }
    }
}