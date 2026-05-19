document.addEventListener("DOMContentLoaded", () => {
    const statusMessage = document.getElementById("paymentStatusMessage");

    if (statusMessage) {
        statusMessage.textContent = "Verificando pagamento em alguns segundos...";
    }

    setTimeout(() => {
        syncPaymentNow();
    }, 5000);
});

async function getPendingPaymentId() {
    const fromLocalStorage = localStorage.getItem("pendingPaymentId");

    if (fromLocalStorage) {
        return fromLocalStorage;
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
    const transactionId = await getPendingPaymentId();

    console.log("Transaction ID encontrado:", transactionId);

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

        console.log("Resultado da sincronização:", result);

        if (!result.success) {
            if (statusMessage) {
                statusMessage.textContent = "Não foi possível verificar o pagamento agora.";
            }
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