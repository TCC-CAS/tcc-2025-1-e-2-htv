const API_URL = "http://localhost:8080";

async function apiRequest(endpoint, method = "GET", body = null) {
    const options = {
        method: method,
        headers: {
            "Content-Type": "application/json"
        }
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_URL}${endpoint}`, options);

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Erro na requisição.");
    }

    return response.json();
}