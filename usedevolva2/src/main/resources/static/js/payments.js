const plansModal = document.getElementById("plansModal");
const openPlansModalBtn = document.getElementById("openPlansModalBtn");
const closePlansModalBtn = document.getElementById("closePlansModalBtn");

openPlansModalBtn?.addEventListener("click", () => {
    plansModal.classList.add("active");
});

closePlansModalBtn?.addEventListener("click", () => {
    plansModal.classList.remove("active");
});

plansModal?.addEventListener("click", (event) => {
    if (event.target === plansModal) {
        plansModal.classList.remove("active");
    }
});

async function createCheckout(plano) {
    try {
        const userId = localStorage.getItem("userId");

        if (!userId) {
            alert("Usuário não encontrado. Faça login novamente.");
            return;
        }

        const response = await fetch("/payments/checkout", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                userId: Number(userId),
                plano: plano
            })
        });

        const result = await response.json();

        if (!result.success) {
            console.error(result);
            alert("Erro ao criar pagamento.");
            return;
        }

        window.location.href = result.data.url;

    } catch (error) {
        console.error(error);
        alert("Erro inesperado ao iniciar pagamento.");
    }
}