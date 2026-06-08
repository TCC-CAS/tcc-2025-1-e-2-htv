document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
        syncPaymentNow();
    }, 5000);
});

async function getPendingPaymentId() {
    const localPaymentId = localStorage.getItem("pendingPaymentId");

    if (localPaymentId) {
        return localPaymentId;
    }

    const userJson = localStorage.getItem("user");

    if (!userJson) {
        return null;
    }

    const user = JSON.parse(userJson);

    const response = await fetch(`/payments/user/${user.id}/pending`);
    const result = await response.json();

    if (result.success) {
        return result.transactionId;
    }

    return null;
}

async function syncPaymentNow() {
    const statusMessage = document.getElementById("paymentStatusMessage");

    try {
        const transactionId = await getPendingPaymentId();

        console.log("Pagamento pendente encontrado:", transactionId);

        if (!transactionId) {
            statusMessage.textContent = "Nenhum pagamento pendente foi encontrado.";
            return;
        }

        statusMessage.textContent = "Consultando status do pagamento...";

        const response = await fetch(`/payments/${transactionId}/sync`);
        const result = await response.json();

        console.log("Resultado da sincronização:", result);

        if (!result.success) {
            statusMessage.textContent = "Não foi possível verificar o pagamento.";
            return;
        }

        if (String(result.status).toUpperCase() === "PAID") {
            localStorage.removeItem("pendingPaymentId");

            const userJson = localStorage.getItem("user");

            if (userJson) {
                const user = JSON.parse(userJson);
                user.plano = result.plano;
                localStorage.setItem("user", JSON.stringify(user));
            }

            statusMessage.textContent = "Plano atualizado com sucesso! Redirecionando...";

            setTimeout(() => {
                window.location.href = "/users/profile";
            }, 2000);

            return;
        }

        statusMessage.textContent = `Pagamento encontrado, mas ainda está como: ${result.status}`;

    } catch (error) {
        console.error(error);
        statusMessage.textContent = "Erro ao verificar pagamento.";
    }
}