const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");

searchForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const termo = searchInput.value.trim();

  if (!termo) {
    alert("Digite o nome de uma ferramenta para buscar.");
    return;
  }

  alert(`Buscando por: ${termo}`);
});

// ==========================
// 📍 DETALHE DA FERRAMENTA
// ==========================
const cepButtons = document.querySelectorAll(".location-box__input button, .cep-check button");

if (cepButtons.length > 0) {
  cepButtons.forEach((button) => {
    button.addEventListener("click", function (event) {
      event.preventDefault();

      const container = button.parentElement;
      const input = container.querySelector("input");
      const cep = input.value.trim();

      if (!cep) {
        alert("Digite um CEP para consultar a localização.");
        return;
      }

      alert(`Consultando localização para o CEP: ${cep}`);
    });
  });
}

const rentButton = document.querySelector(".tool-detail__button");

if (rentButton) {
  rentButton.addEventListener("click", function (event) {
    event.preventDefault();

    alert("Solicitação de aluguel iniciada. Faça login ou crie uma conta para continuar.");
    window.location.href = "login.html";
  });
}

