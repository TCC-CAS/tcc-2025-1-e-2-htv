document.addEventListener("DOMContentLoaded", async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.id) {
        window.location.href = "/auth/login";
        return;
    }

    await loadRequests(user.id);

    const filter = document.getElementById("statusFilter");
    if (filter) {
        filter.addEventListener("change", async (e) => {
            await loadRequests(user.id, e.target.value);
        });
    }
});

async function loadRequests(ownerId, filterStatus = "ALL") {
    try {
        const response = await fetch(`/rentals/owner-list/${ownerId}`);
        if (!response.ok) throw new Error("Erro ao buscar solicitações");

        let rentals = await response.json();

//
        rentals = rentals.filter(r => r.status === "PENDING" || r.status === "PAID" || r.status === "RETURNED" || r.status === "LATE_RETURNED");

        if (filterStatus !== "ALL") {
            rentals = rentals.filter(r => r.status === filterStatus);
        }

        const mappedRentals = rentals.map(r => ({
            rentalId: r.rentalId,
            toolId: r.toolId,
            toolName: r.toolName,
            toolImage: r.toolImage || '/images/default-tool.png',
            renterName: r.renterName,
            ownerName: r.ownerName,
            status: r.status,
            startDate: r.startDate,
            endDate: r.endDate,
            totalValue: r.totalValue,
            message: r.message || null
        }));

        renderStats(mappedRentals);
        renderRequests(mappedRentals);

    } catch (err) {
        console.error(err);
        document.getElementById("requestsGrid").innerHTML = `<p class="empty-message">Erro ao carregar solicitações.</p>`;
    }
}

function renderStats(rentals) {
    document.getElementById("totalRentals").textContent = rentals.length;
    const totalSpent = rentals.reduce((sum, r) => sum + (r.totalValue || 0), 0);
    document.getElementById("totalSpent").textContent = formatCurrency(totalSpent);
}

function renderRequests(rentals) {
    const container = document.getElementById("requestsGrid");
    if (!rentals.length) {
        container.innerHTML = `<div class="empty-message">Nenhuma solicitação encontrada.</div>`;
        return;
    }

    container.innerHTML = rentals.map(r => {
        let footerButtons = "";

        // Se o locatário já devolveu, exibe o botão de finalizar contrato
        if (r.status === "RETURNED" || r.status === "LATE_RETURNED") {
            footerButtons = `
                <button class="btn btn-approve" style="width: 100%;" onclick="finalizeRental(${r.rentalId})">
                    Confirmar e Finalizar Locação
                </button>`;
        } else {
            footerButtons = `
                <button class="btn btn-reject" onclick="rejectRental(${r.rentalId})">Recusar</button>
                <button class="btn btn-approve" onclick="approveRental(${r.rentalId})">Aceitar</button>
            `;
        }

        return `
            <article class="request-card">
                <div class="card-header">
                    <div>
                        <h3>${r.toolName}</h3>
                        <span class="date">Pedido em ${formatDate(r.startDate)}</span>
                    </div>
                    <span class="badge ${getStatusBadgeClass(r.status)}">${translateStatus(r.status)}</span>
                </div>
                <div class="card-body">
                    </div>
                <div class="card-footer">
                    ${footerButtons}
                </div>
            </article>
        `;
    }).join("");
}

async function approveRental(rentalId) {
    const user = JSON.parse(localStorage.getItem("user"));
    try {
        const response = await fetch(`/rentals/${rentalId}/approval`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ownerId: user.id, approved: true })
        });

        if (!response.ok) {
            const text = await response.text();
            console.error("Erro ao aprovar:", text);
            alert("Erro ao aprovar o aluguel. Veja o console.");
            return;
        }

        await loadRequests(user.id);
    } catch (err) {
        console.error(err);
        alert("Erro de rede ao aprovar o aluguel");
    }
}

async function rejectRental(rentalId) {
    const user = JSON.parse(localStorage.getItem("user"));
    try {
        const response = await fetch(`/rentals/${rentalId}/approval`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ownerId: user.id, approved: false })
        });

        if (!response.ok) {
            const text = await response.text();
            console.error("Erro ao recusar:", text);
            alert("Erro ao recusar o aluguel. Veja o console.");
            return;
        }

        await loadRequests(user.id);
    } catch (err) {
        console.error(err);
        alert("Erro de rede ao recusar o aluguel");
    }
}

function translateStatus(status) {
    const map = {
        PENDING: "Pendente",
        ACCEPTED: "Aceito",
        PAID: "Aguardando aceitação",
        IN_USE: "Em andamento",
        RETURNED: "Devolvido (Aguardando Confirmação)",
        LATE_RETURNED: "Devolvido com Atraso",
        FINALIZED: "Finalizado",
        CANCELLED: "Recusado"
    };
    return map[status] || status;
}

function getStatusBadgeClass(status) {
    const map = {
        PENDING: "badge-pending",
        ACCEPTED: "badge-accepted",
        PAID: "badge-waiting",
        IN_USE: "badge-active",
        RETURNED: "badge-waiting",
        LATE_RETURNED: "badge-rejected",
        FINALIZED: "badge-finished",
        CANCELLED: "badge-rejected"
    };
    return map[status] || "badge-default";
}

function formatDate(date) {
    if (!date) return "-";
    return new Date(date + "T00:00:00").toLocaleDateString("pt-BR");
}

function formatCurrency(value) {
    return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

async function finalizeRental(rentalId) {
    const user = JSON.parse(localStorage.getItem("user"));
    try {
        const response = await fetch(`/rentals/${rentalId}/finalize`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ownerId: user.id })
        });

        if (!response.ok) {
            const text = await response.text();
            console.error("Erro ao finalizar:", text);
            alert("Erro ao finalizar a locação.");
            return;
        }

        await loadRequests(user.id);
    } catch (err) {
        console.error(err);
        alert("Erro de rede ao finalizar a locação");
    }
}
