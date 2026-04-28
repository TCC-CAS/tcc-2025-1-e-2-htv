// ==========================
// BUSCA
// ==========================

const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");

if (searchForm && searchInput) {
  searchForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const termo = searchInput.value.trim();

    if (!termo) {
      alert("Digite o nome de uma ferramenta para buscar.");
      return;
    }

    alert(`Buscando por: ${termo}`);
  });
}

// ==========================
// DETALHE DA FERRAMENTA
// ==========================

const cepButtons = document.querySelectorAll(
  ".detail-cep-small button, .detail-cep-large button, .location-box__input button, .cep-check button"
);

if (cepButtons.length > 0) {
  cepButtons.forEach((button) => {
    button.addEventListener("click", function (event) {
      event.preventDefault();

      const container = button.parentElement;
      const input = container.querySelector("input");

      if (!input) return;

      const cep = input.value.trim();

      if (!cep) {
        alert("Digite um CEP para consultar a localização.");
        return;
      }

      alert(`Consultando localização para o CEP: ${cep}`);
    });
  });
}

const rentButton = document.querySelector(".detail-rent-button, .tool-detail__button");

if (rentButton) {
  rentButton.addEventListener("click", function (event) {
    event.preventDefault();

    alert("Solicitação de aluguel iniciada. Faça login ou crie uma conta para continuar.");
    window.location.href = "login.html";
  });
}

// ==========================
// CARROSSEL DE FERRAMENTAS
// ==========================

const carouselTrack = document.querySelector(".carousel-track");
const carouselImages = document.querySelectorAll(".carousel-track img");
const prevCarouselBtn = document.querySelector(".carousel-btn.prev");
const nextCarouselBtn = document.querySelector(".carousel-btn.next");
const carouselDots = document.querySelectorAll(".carousel-dots .dot");

let carouselIndex = 0;
let carouselInterval;

function updateCarousel() {
  if (!carouselTrack || carouselImages.length === 0) return;

  carouselTrack.style.transform = `translateX(-${carouselIndex * 100}%)`;

  carouselDots.forEach((dot, index) => {
    dot.classList.toggle("active", index === carouselIndex);
  });
}

function nextCarouselSlide() {
  if (carouselImages.length === 0) return;
  carouselIndex = (carouselIndex + 1) % carouselImages.length;
  updateCarousel();
}

function prevCarouselSlide() {
  if (carouselImages.length === 0) return;
  carouselIndex = (carouselIndex - 1 + carouselImages.length) % carouselImages.length;
  updateCarousel();
}

if (carouselTrack && carouselImages.length > 0) {
  if (nextCarouselBtn) {
    nextCarouselBtn.addEventListener("click", nextCarouselSlide);
  }

  if (prevCarouselBtn) {
    prevCarouselBtn.addEventListener("click", prevCarouselSlide);
  }

  carouselDots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      carouselIndex = index;
      updateCarousel();
    });
  });

  carouselInterval = setInterval(nextCarouselSlide, 5000);
}

// ==========================
// LOGIN
// ==========================

const loginForm = document.querySelector(".login-form");

if (loginForm) {
  const loginEmail = document.getElementById("loginEmail");
  const loginSenha = document.getElementById("loginSenha");
  const formMessage = document.querySelector(".form-message");

  loginForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const email = loginEmail ? loginEmail.value.trim() : "";
    const senha = loginSenha ? loginSenha.value.trim() : "";

    if (formMessage) {
      formMessage.textContent = "";
    }

    if (!email || !senha) {
      if (formMessage) {
        formMessage.textContent = "Preencha e-mail e senha para continuar.";
      } else {
        alert("Preencha e-mail e senha para continuar.");
      }
      return;
    }

    if (!email.includes("@")) {
      if (formMessage) {
        formMessage.textContent = "Digite um e-mail válido.";
      } else {
        alert("Digite um e-mail válido.");
      }
      return;
    }

    alert("Login realizado com sucesso!");
    window.location.href = "index.html";
  });
}

// ==========================
// ACESSIBILIDADE
// ==========================

const contrastBtn = document.getElementById("contrastBtn");
const fontBtn = document.getElementById("fontBtn");
const audioBtn = document.getElementById("audioBtn");

if (contrastBtn) {
  contrastBtn.addEventListener("click", () => {
    document.body.classList.toggle("high-contrast");
  });
}

if (fontBtn) {
  fontBtn.addEventListener("click", () => {
    document.body.classList.toggle("large-font");
  });
}

if (audioBtn) {
  audioBtn.addEventListener("click", () => {
    const texto = `
      Tela de login da plataforma Use e Devolva.
      Informe seu e-mail e senha para acessar sua conta.
      Você também pode marcar lembrar de mim, recuperar sua senha ou criar uma nova conta.
    `;

    const fala = new SpeechSynthesisUtterance(texto);
    fala.lang = "pt-BR";
    fala.rate = 0.9;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(fala);
  });
}


if (audioBtn) {
  audioBtn.addEventListener("click", () => {
    const pageTitle = document.title || "Use e Devolva";

    const texto = `
      Página ${pageTitle}.
      Esta página apresenta ferramentas disponíveis para aluguel,
      permite buscar ferramentas, navegar por categorias,
      visualizar ferramentas em destaque e acessar a criação de conta.
    `;

    const fala = new SpeechSynthesisUtterance(texto);
    fala.lang = "pt-BR";
    fala.rate = 0.9;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(fala);
  });
}