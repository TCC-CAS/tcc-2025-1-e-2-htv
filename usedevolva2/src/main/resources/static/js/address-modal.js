let addressModalUserId = null;
let addressModalCallback = null;

function initAddressModal(userId, onSavedCallback) {
    addressModalUserId = userId;
    addressModalCallback = onSavedCallback;

    if (document.getElementById("addressModalOverlay")) return;

    const modal = document.createElement("div");
    modal.id = "addressModalOverlay";
    modal.className = "address-modal-overlay";

    modal.innerHTML = `
        <div class="address-modal">
            <div class="address-modal-header">
                <div>
                    <h3>Adicionar endereço</h3>
                    <p>Informe o CEP para preencher o endereço automaticamente.</p>
                </div>
                <button type="button" class="address-modal-close" id="closeAddressModalBtn">×</button>
            </div>

            <form id="addressModalForm">
                <div class="form-row">
                    <div class="form-group">
                        <label for="addressNome">Nome do endereço</label>
                        <input type="text" id="addressNome" placeholder="Ex: Casa, Trabalho, Galpão" />
                    </div>

                    <div class="form-group">
                        <label for="addressCep">CEP</label>
                        <input type="text" id="addressCep" placeholder="00000-000" maxlength="9" required />
                    </div>
                </div>

                <div class="form-group">
                    <label for="addressLogradouro">Endereço</label>
                    <input type="text" id="addressLogradouro" class="address-auto-filled" readonly required />
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="addressNumero">Número</label>
                        <input type="text" id="addressNumero" required />
                    </div>

                    <div class="form-group">
                        <label for="addressComplemento">Complemento</label>
                        <input type="text" id="addressComplemento" />
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="addressBairro">Bairro</label>
                        <input type="text" id="addressBairro" class="address-auto-filled" readonly required />
                    </div>

                    <div class="form-group">
                        <label for="addressCidade">Cidade</label>
                        <input type="text" id="addressCidade" class="address-auto-filled" readonly required />
                    </div>

                    <div class="form-group">
                        <label for="addressEstado">UF</label>
                        <input type="text" id="addressEstado" class="address-auto-filled" maxlength="2" readonly required />
                    </div>
                </div>

                <label class="checkbox-line">
                    <input type="checkbox" id="addressPrincipal" />
                    Definir como endereço principal
                </label>

                <p id="addressModalMessage" class="address-modal-message"></p>

                <div class="form-actions">
                    <button type="button" class="btn btn-outline" id="cancelAddressModalBtn">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Salvar endereço</button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    document.getElementById("closeAddressModalBtn").addEventListener("click", closeAddressModal);
    document.getElementById("cancelAddressModalBtn").addEventListener("click", closeAddressModal);

    document.getElementById("addressCep").addEventListener("input", (event) => {
        event.target.value = maskCep(event.target.value);

        if (event.target.value.replace(/\D/g, "").length < 8) {
            clearAutoAddressFields();
        }
    });

    document.getElementById("addressCep").addEventListener("blur", buscarCepModal);

    document.getElementById("addressModalForm").addEventListener("submit", salvarEnderecoModal);
}

function openAddressModal() {
    const modal = document.getElementById("addressModalOverlay");
    if (modal) {
        modal.classList.add("active");
    }
}

function closeAddressModal() {
    const modal = document.getElementById("addressModalOverlay");
    if (modal) {
        modal.classList.remove("active");
    }
}

async function buscarCepModal() {
    const cepInput = document.getElementById("addressCep");
    const message = document.getElementById("addressModalMessage");

    const cep = cepInput.value.replace(/\D/g, "");

    if (cep.length !== 8) {
        message.textContent = "Informe um CEP válido.";
        message.className = "address-modal-message error";
        return;
    }

    try {
        message.textContent = "Buscando CEP...";
        message.className = "address-modal-message loading";

        const response = await fetch(`/cep/${cep}`);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || "CEP não encontrado.");
        }

        const data = await response.json();

        clearAutoAddressFields();

        document.getElementById("addressLogradouro").value = data.logradouro || "";
        document.getElementById("addressComplemento").value = data.complemento || "";
        document.getElementById("addressBairro").value = data.bairro || "";
        document.getElementById("addressCidade").value = data.localidade || "";
        document.getElementById("addressEstado").value = data.uf || "";

        message.textContent = "CEP encontrado.";
        message.className = "address-modal-message success";

    } catch (error) {
        console.error(error);
        clearAutoAddressFields();
        message.textContent = "Não foi possível buscar o CEP.";
        message.className = "address-modal-message error";
    }
}

async function salvarEnderecoModal(event) {
    event.preventDefault();

    const message = document.getElementById("addressModalMessage");

    if (!addressModalUserId) {
        message.textContent = "Usuário não identificado.";
        message.className = "address-modal-message error";
        return;
    }

    const payload = {
        nomeIdentificacao: document.getElementById("addressNome").value.trim(),
        cep: document.getElementById("addressCep").value.replace(/\D/g, ""),
        logradouro: document.getElementById("addressLogradouro").value.trim(),
        numero: document.getElementById("addressNumero").value.trim(),
        complemento: document.getElementById("addressComplemento").value.trim(),
        bairro: document.getElementById("addressBairro").value.trim(),
        cidade: document.getElementById("addressCidade").value.trim(),
        estado: document.getElementById("addressEstado").value.trim().toUpperCase(),
        principal: document.getElementById("addressPrincipal").checked
    };

    try {
        message.textContent = "Salvando endereço...";
        message.className = "address-modal-message loading";

        const response = await fetch(`/users/${addressModalUserId}/addresses`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || "Erro ao salvar endereço.");
        }

        const savedAddress = await response.json();

        message.textContent = "Endereço salvo com sucesso.";
        message.className = "address-modal-message success";

        document.getElementById("addressModalForm").reset();

        if (typeof addressModalCallback === "function") {
            addressModalCallback(savedAddress);
        }

        setTimeout(() => {
            closeAddressModal();
        }, 800);

    } catch (error) {
        console.error(error);
        message.textContent = error.message || "Erro ao salvar endereço.";
        message.className = "address-modal-message error";
    }
}

function maskCep(value) {
    return value
        .replace(/\D/g, "")
        .slice(0, 8)
        .replace(/(\d{5})(\d)/, "$1-$2");
}

function formatAddressLabel(address) {
    const nome = address.nomeIdentificacao ? `${address.nomeIdentificacao} - ` : "";
    return `${nome}${address.logradouro}, ${address.numero} - ${address.bairro}, ${address.cidade} - ${address.estado}`;
}

function clearAutoAddressFields() {
    [
        "addressLogradouro",
        "addressComplemento",
        "addressBairro",
        "addressCidade",
        "addressEstado"
    ].forEach((fieldId) => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.value = "";
        }
    });
}