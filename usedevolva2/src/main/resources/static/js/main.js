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

document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const userArea = document.querySelector(".user-area");

  if (!userArea) return;

  if (user && user.id) {
    userArea.innerHTML = `
            <a href="/users/profile">Meu perfil</a>
            <a href="/rentals/my-rentals">Meus aluguéis</a>
            <a href="/users/my-tools">Minhas ferramentas</a>
            <a href="/tools/favorites">❤️</a>
            <a href="#" id="logoutBtn">Sair</a>
        `;

    const logoutBtn = document.getElementById("logoutBtn");

    logoutBtn.addEventListener("click", (event) => {
      event.preventDefault();
      localStorage.removeItem("user");
      window.location.href = "/auth/login";
    });
  } else {
    userArea.innerHTML = `
            <a href="/auth/login" class="btn-login">Entrar</a>
            <a href="/auth/register" class="btn-register">Criar conta</a>
        `;
  }
});

function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast-message";
  toast.textContent = message;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("show");
  }, 50);

  setTimeout(() => {
    toast.classList.remove("show");
    toast.classList.add("hide");
  }, 3000);

  setTimeout(() => {
    toast.remove();
  }, 3400);
}

document.addEventListener('DOMContentLoaded', () => {
  // 1. Alternar Alto Contraste
  const contrastBtn = document.getElementById('contrastBtn');
  contrastBtn?.addEventListener('click', () => {
    // Aplica a classe "create-high-contrast" no body
    document.body.classList.toggle('create-high-contrast');
    
    const isEnabled = document.body.classList.contains('create-high-contrast');
    localStorage.setItem('createContrastPref', isEnabled);
  });

  // 2. Gerenciar Tamanho da Fonte
  const fontBtn = document.getElementById('fontBtn');
  let currentScale = 100;

  fontBtn?.addEventListener('click', () => {
    currentScale += 10;
    if (currentScale > 150) currentScale = 100; // Reseta ao chegar no limite
    
    document.documentElement.style.fontSize = `${currentScale}%`;
  });

  // 3. Função "Ouvir Tela" (Text-to-Speech)
  const audioBtn = document.getElementById('audioBtn');
  audioBtn?.addEventListener('click', () => {
    // Seleciona o conteúdo principal para ler
    const content = document.querySelector('.register-page').innerText;
    
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(content);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.0;
    
    window.speechSynthesis.speak(utterance);
  });

  // Persistência: Verifica se o usuário já usava alto contraste antes
  if (localStorage.getItem('createContrastPref') === 'true') {
    document.body.classList.add('create-high-contrast');
  }
});