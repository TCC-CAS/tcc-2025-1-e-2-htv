document.addEventListener("DOMContentLoaded", () => {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user || !user.id) {
        return;
    }

    createFloatingChatButton();
    loadUnreadChatCount(user.id);

    setInterval(() => {
        loadUnreadChatCount(user.id);
    }, 30000);
});

function createFloatingChatButton() {
    if (document.getElementById("floatingChatButton")) {
        return;
    }

    const button = document.createElement("button");
    button.type = "button";
    button.id = "floatingChatButton";
    button.className = "floating-chat-button";
    button.title = "Abrir chats";

    button.innerHTML = `
        <span class="floating-chat-unread-dot" id="floatingChatUnreadDot"></span>
        <span class="floating-chat-icon">💬</span>
    `;

    button.addEventListener("click", () => {
        window.location.href = "/users/chats";
    });

    document.body.appendChild(button);
}

async function loadUnreadChatCount(userId) {
    const dot = document.getElementById("floatingChatUnreadDot");

    if (!dot) return;

    try {
        const response = await fetch(`/chats/user/${userId}/unread-count`);

        if (!response.ok) {
            throw new Error("Erro ao buscar mensagens não lidas.");
        }

        const data = await response.json();
        const unreadCount = Number(data.unreadCount || 0);

        if (unreadCount > 0) {
            dot.classList.add("active");
        } else {
            dot.classList.remove("active");
        }

    } catch (error) {
        console.error(error);
        dot.classList.remove("active");
    }
}