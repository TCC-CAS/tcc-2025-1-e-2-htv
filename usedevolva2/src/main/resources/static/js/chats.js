let currentUser = null;
let currentChatId = null;
let currentChats = [];

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

    await loadChats();

    const params = new URLSearchParams(window.location.search);
    const chatIdFromUrl = params.get("chatId");

    if (chatIdFromUrl) {
        await openChat(Number(chatIdFromUrl));
    }
});

async function loadChats() {
    const list = document.getElementById("chatsList");

    try {
        list.innerHTML = `<p class="chats-loading">Carregando conversas...</p>`;

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

        document.getElementById("chatEmptyState").classList.add("hidden");
        document.getElementById("chatConversation").classList.remove("hidden");

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

        return `
            <div class="chat-message ${messageClass}">
                <div class="chat-message-text">${escapeHtml(message.message)}</div>
                <div class="chat-message-time">${formatChatDateTime(message.createdAt)}</div>
            </div>
        `;
    }).join("");

    container.scrollTop = container.scrollHeight;
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