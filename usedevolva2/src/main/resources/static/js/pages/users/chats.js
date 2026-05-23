let currentUser = null;
let currentChatId = null;
let currentChats = [];
let chatsAutoRefreshInterval = null;
let isRefreshingChat = false;
let lastRenderedMessageSignature = "";
let currentChatDetails = null;
let isReportModeActive = false;

document.addEventListener("DOMContentLoaded", async () => {
    currentUser = JSON.parse(localStorage.getItem("user"));

    if (!currentUser || !currentUser.id) {
        window.location.href = "/auth/login";
        return;
    }

    const form = document.getElementById("chatMessageForm");
    const input = document.getElementById("chatMessageInput");

    if (form) {
        form.addEventListener("submit", async (event) => {
            event.preventDefault();

            const message = input.value.trim();

            if (!message || !currentChatId) return;

            await sendChatMessage(currentChatId, message);
            input.value = "";
        });
    }


    const reportModal = document.getElementById("reportModal");
    const btnReportChat = document.getElementById("btnReportChat");
    const btnCloseReportModal = document.getElementById("btnCloseReportModal");
    const btnCancelReport = document.getElementById("btnCancelReport");
    const reportForm = document.getElementById("reportForm");

    if (btnReportChat) {
        btnReportChat.addEventListener("click", () => {
            if (!currentChatDetails) return;

            if (!isReportModeActive) {
                isReportModeActive = true;
                btnReportChat.innerText = "✨ Confirmar Seleção";
                btnReportChat.className = "btn btn-primary";

                // Força re-renderização das mensagens aplicando os Checkboxes na tela
                lastRenderedMessageSignature = "";
                renderMessages(currentChatDetails.messages || []);
            } else {
                // Segunda etapa: Se o modo já estava ativo, abre o Modal de preenchimento
                if (reportModal) reportModal.classList.add("active");
            }
        });
    }

    function resetReportMode() {
        isReportModeActive = false;
        if (reportModal) reportModal.classList.remove("active");
        if (reportForm) reportForm.reset();

        const evidencePreview = document.getElementById("reportedMessagesEvidence");
        if (evidencePreview) evidencePreview.innerText = "Nenhuma mensagem selecionada.";

        if (btnReportChat) {
            btnReportChat.innerText = "⚠️ Denunciar";
            btnReportChat.className = "btn btn-danger";
        }

        if (currentChatDetails) {
            lastRenderedMessageSignature = "";
            renderMessages(currentChatDetails.messages || []);
        }
    }

    if (btnCloseReportModal) btnCloseReportModal.addEventListener("click", resetReportMode);
    if (btnCancelReport) btnCancelReport.addEventListener("click", resetReportMode);

    if (reportForm) {
        reportForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const targetType = document.getElementById("reportTargetType").value;
            const reason = document.getElementById("reportReason").value;
            const descriptionInput = document.getElementById("reportDescription").value;

            const selectedEvidences = Array.from(document.querySelectorAll(".report-checkbox:checked"))
                .map(cb => cb.getAttribute("data-msg-text"))
                .join("\n");

            const reportPayload = {
                reporterId: currentUser.id,
                reportedUserId: targetType === "USER"
                    ? (Number(currentUser.id) === Number(currentChatDetails.ownerId) ? currentChatDetails.renterId : currentChatDetails.ownerId)
                    : null,
                rentalId: currentChatDetails.rentalId || null,
                toolId: targetType === "TOOL" ? currentChatDetails.toolId : null,
                reason: reason,
                description: descriptionInput,
                reportedMessages: selectedEvidences || null
            };

            try {
                const response = await fetch("/reports/create", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(reportPayload)
                });

                if (!response.ok) {
                    throw new Error("Erro de processing no servidor ao salvar relatório.");
                }

                alert("Sua denúncia foi enviada com sucesso para nossa equipe de moderação. Obrigado!");
                resetReportMode();

            } catch (error) {
                console.error(error);
                alert("Não foi possível processar o envio da sua denúncia. Tente novamente.");
            }
        });
    }

    if (input) {
        input.addEventListener("keydown", async (event) => {
            if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();

                const message = input.value.trim();

                if (!message || !currentChatId) {
                    return;
                }

                await sendChatMessage(currentChatId, message);
                input.value = "";
            }
        });
    }

    await loadChats();

    const params = new URLSearchParams(window.location.search);
    const chatIdFromUrl = params.get("chatId");

    if (chatIdFromUrl) {
        await openChat(Number(chatIdFromUrl));
    }

    startChatsAutoRefresh();
});

async function loadChats(showLoading = true) {
    const list = document.getElementById("chatsList");

    try {
        if (showLoading && (!currentChats || currentChats.length === 0)) {
            list.innerHTML = `<p class="chats-loading">Carregando conversas...</p>`;
        }

        const response = await fetch(`/chats/user/${currentUser.id}`);

        if (!response.ok) {
            throw new Error("Erro ao carregar conversas.");
        }

        currentChats = await response.json();

        if (!currentChats || currentChats.length === 0) {
            list.innerHTML = `<p class="chats-empty">Você ainda não possui conversas.</p>`;
            return;
        }

        list.innerHTML = currentChats.map(chat => {
            const initials = getInitials(chat.otherUserName || "U");
            const activeClass = Number(chat.id) === Number(currentChatId) ? "active" : "";
            const unreadBadge = chat.unreadCount > 0
                ? `<span class="chat-list-unread">${chat.unreadCount}</span>`
                : "";

            return `
                <button type="button" class="chat-list-item ${activeClass}" data-chat-id="${chat.id}">
                    <div class="chat-list-avatar">${initials}</div>

                    <div class="chat-list-body">
                        <div class="chat-list-title-row">
                            <span class="chat-list-title">${chat.otherUserName || "Usuário"}</span>
                            <span class="chat-list-time">${formatChatDate(chat.updatedAt)}</span>
                        </div>

                        <div class="chat-list-tool">${chat.toolName || "Ferramenta"}</div>
                        <div class="chat-list-last">${chat.lastMessage || ""}</div>
                        ${unreadBadge}
                    </div>
                </button>
            `;
        }).join("");

        document.querySelectorAll(".chat-list-item").forEach(button => {
            button.addEventListener("click", async () => {
                const chatId = Number(button.dataset.chatId);
                await openChat(chatId);
            });
        });

    } catch (error) {
        console.error(error);
        list.innerHTML = `<p class="chats-empty">Não foi possível carregar suas conversas.</p>`;
    }
}

async function openChat(chatId) {
    try {
        currentChatId = chatId;

        document.querySelectorAll(".chat-list-item").forEach(item => {
            item.classList.toggle("active", Number(item.dataset.chatId) === Number(chatId));
        });

        const response = await fetch(`/chats/${chatId}?userId=${currentUser.id}`);

        if (!response.ok) {
            throw new Error("Erro ao abrir conversa.");
        }

        const chat = await response.json();
        currentChatDetails = chat;

        document.getElementById("chatEmptyState").classList.add("hidden");
        document.getElementById("chatConversation").classList.remove("hidden");

        const btnReport = document.getElementById("btnReportChat");
        if (btnReport) btnReport.style.display = "block";

        document.getElementById("chatTitle").textContent = chat.otherUserName || "Chat";

        const subtitle = document.getElementById("chatSubtitle");

        if (chat.toolId && chat.toolName) {
            subtitle.innerHTML = `
        Ferramenta:
        <a href="/tools/page/${chat.toolId}" class="chat-tool-link">
            ${escapeHtml(chat.toolName)}
        </a>
    `;
        } else {
            subtitle.textContent = "";
        }

        renderMessages(chat.messages || []);

        await loadChats();

        const newUrl = `/users/chats?chatId=${chatId}`;
        window.history.replaceState({}, "", newUrl);

    } catch (error) {
        console.error(error);
        alert("Não foi possível abrir a conversa.");
    }
}

function renderMessages(messages) {
    const container = document.getElementById("chatMessages");

    const newSignature = messages
        .map(message => `${message.id}-${message.readByRecipient}`)
        .join("|");

    if (newSignature === lastRenderedMessageSignature && !isReportModeActive) {
        return;
    }

    const wasNearBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight < 120;

    lastRenderedMessageSignature = newSignature;

    if (!messages.length) {
        container.innerHTML = `
            <div class="chat-empty-messages">
                Nenhuma mensagem ainda. Envie a primeira mensagem.
            </div>
        `;
        return;
    }

    container.innerHTML = messages.map(message => {
        const isSent = Number(message.senderId) === Number(currentUser.id);
        const messageClass = message.automaticMessage
            ? "automatic"
            : isSent ? "sent" : "received";

        const canReport = !isSent && !message.automaticMessage;
        const showCheckboxClass = (isReportModeActive && canReport) ? "active" : "";

        return `
            <div class="chat-message-wrapper ${isSent ? 'sent' : ''}">
                ${canReport ? `
                    <input type="checkbox" class="report-checkbox ${showCheckboxClass}" data-msg-text="${escapeHtml(message.message)}" value="${message.id}">
                ` : `
                    <div class="report-checkbox-spacer ${isReportModeActive ? 'active' : ''}"></div>
                `}
                <div class="chat-message ${messageClass}">
                    <div class="chat-message-text">${escapeHtml(message.message)}</div>
                    <div class="chat-message-time">${formatChatDateTime(message.createdAt)}</div>
                </div>
            </div>
        `;
    }).join("");

    if (wasNearBottom) {
        container.scrollTop = container.scrollHeight;
    }

    if (isReportModeActive) {
        document.querySelectorAll(".report-checkbox").forEach(cb => {
            cb.addEventListener("change", updateEvidencePreview);
        });
    }
}

function updateEvidencePreview() {
    const checked = document.querySelectorAll(".report-checkbox:checked");
    const previewContainer = document.getElementById("reportedMessagesEvidence");

    if (checked.length === 0) {
        previewContainer.innerHTML = "Nenhuma mensagem selecionada.";
        return;
    }

    previewContainer.innerHTML = Array.from(checked)
        .map(cb => `• "${cb.getAttribute("data-msg-text")}"`)
        .join("<br>");
}

async function sendChatMessage(chatId, message) {
    try {
        const response = await fetch(`/chats/${chatId}/messages`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                senderId: currentUser.id,
                message
            })
        });

        if (!response.ok) {
            throw new Error("Erro ao enviar mensagem.");
        }

        await openChat(chatId);

    } catch (error) {
        console.error(error);
        alert("Não foi possível enviar a mensagem.");
    }
}

function getInitials(name) {
    return String(name || "")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part[0].toUpperCase())
        .join("");
}

function formatChatDate(value) {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit"
    });
}

function formatChatDateTime(value) {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function escapeHtml(value) {
    return String(value || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function startChatsAutoRefresh() {
    if (chatsAutoRefreshInterval) {
        clearInterval(chatsAutoRefreshInterval);
    }

    chatsAutoRefreshInterval = setInterval(async () => {
        if (document.hidden || !currentUser || !currentUser.id || isReportModeActive) {
            return;
        }

        await refreshChatsSilently();
    }, 1500);
}

async function refreshChatsSilently() {
    if (isRefreshingChat || isReportModeActive) { // Trava de segurança dupla
        return;
    }

    isRefreshingChat = true;

    try {
        await loadChats(false);

        if (currentChatId) {
            await refreshCurrentChatSilently(currentChatId);
        }

        if (typeof window.refreshFloatingChatUnreadCount === "function") {
            window.refreshFloatingChatUnreadCount();
        }

    } catch (error) {
        console.error("Erro ao atualizar chats automaticamente:", error);
    } finally {
        isRefreshingChat = false;
    }
}

async function refreshCurrentChatSilently(chatId) {
    const response = await fetch(`/chats/${chatId}?userId=${currentUser.id}`);

    if (!response.ok) {
        return;
    }

    const chat = await response.json();

    document.getElementById("chatTitle").textContent = chat.otherUserName || "Chat";

    const subtitle = document.getElementById("chatSubtitle");

    if (chat.toolId && chat.toolName) {
        subtitle.innerHTML = `
            Ferramenta:
            <a href="/tools/page/${chat.toolId}" class="chat-tool-link">
                ${escapeHtml(chat.toolName)}
            </a>
        `;
    } else {
        subtitle.textContent = "";
    }

    renderMessages(chat.messages || []);
}