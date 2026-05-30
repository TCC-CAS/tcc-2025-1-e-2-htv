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
const carouselTrack = document.querySelector(".carousel-track");
const carouselImages = document.querySelectorAll(".carousel-track img");
const prevCarouselBtn = document.querySelector(".carousel-btn.prev");
const nextCarouselBtn = document.querySelector(".carousel-btn.next");
const carouselDots = document.querySelectorAll(".carousel-dots .dot");
const carouselTitle = document.getElementById("homeHeroTitle");
const carouselDescription = document.getElementById("homeHeroDescription");
const carouselProgressBar = document.querySelector(".carousel-progress-bar");

const carouselSlides = [
  {
    title: "Encontre ferramentas próximas",
    description:
      "Use a busca por localização para encontrar ferramentas disponíveis perto de você ou em uma região escolhida no mapa.",
  },
  {
    title: "Alugue só quando precisar",
    description:
      "Compare opções, veja detalhes dos itens e encontre ferramentas para uso rápido sem precisar comprar equipamentos novos.",
  },
  {
    title: "Compartilhe suas ferramentas",
    description:
      "Cadastre itens parados, alcance pessoas próximas e acompanhe seus anúncios pela plataforma Use&Devolva.",
  },
];

let carouselIndex = 0;
let carouselTimerStartedAt = 0;
let carouselAnimationFrame = null;
const carouselDuration = 5000;

function updateCarouselText() {
  const currentSlide = carouselSlides[carouselIndex] || carouselSlides[0];

  if (!currentSlide) return;

  [carouselTitle, carouselDescription].forEach((element) => {
    if (!element) return;
    element.classList.remove("is-changing");
    void element.offsetWidth;
    element.classList.add("is-changing");
  });

  if (carouselTitle) carouselTitle.textContent = currentSlide.title;
  if (carouselDescription) carouselDescription.textContent = currentSlide.description;
}

function updateCarousel() {
  if (!carouselTrack || carouselImages.length === 0) return;

  carouselTrack.style.transform = `translateX(-${carouselIndex * 100}%)`;
  updateCarouselText();

  carouselDots.forEach((dot, index) => {
    const isActive = index === carouselIndex;
    dot.classList.toggle("active", isActive);
    if (isActive) {
      dot.setAttribute("aria-current", "true");
    } else {
      dot.removeAttribute("aria-current");
    }
  });
}

function resetCarouselTimer() {
  carouselTimerStartedAt = performance.now();

  if (carouselProgressBar) {
    carouselProgressBar.style.width = "0%";
  }
}

function goToCarouselSlide(index, resetTimer = true) {
  if (carouselImages.length === 0) return;

  carouselIndex = (index + carouselImages.length) % carouselImages.length;
  updateCarousel();

  if (resetTimer) {
    resetCarouselTimer();
  }
}

function nextCarouselSlide(resetTimer = true) {
  goToCarouselSlide(carouselIndex + 1, resetTimer);
}

function prevCarouselSlide() {
  goToCarouselSlide(carouselIndex - 1, true);
}

function animateCarouselTimer(now) {
  if (!carouselTrack || carouselImages.length === 0) return;

  if (!carouselTimerStartedAt) {
    resetCarouselTimer();
  }

  const elapsed = now - carouselTimerStartedAt;
  const progress = Math.min((elapsed / carouselDuration) * 100, 100);

  if (carouselProgressBar) {
    carouselProgressBar.style.width = `${progress}%`;
  }

  if (elapsed >= carouselDuration) {
    nextCarouselSlide(false);
    resetCarouselTimer();
  }

  carouselAnimationFrame = requestAnimationFrame(animateCarouselTimer);
}

if (carouselTrack && carouselImages.length > 0) {
  updateCarousel();
  resetCarouselTimer();

  if (nextCarouselBtn) {
    nextCarouselBtn.addEventListener("click", () => nextCarouselSlide(true));
  }

  if (prevCarouselBtn) {
    prevCarouselBtn.addEventListener("click", prevCarouselSlide);
  }

  carouselDots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      goToCarouselSlide(index, true);
    });
  });

  carouselAnimationFrame = requestAnimationFrame(animateCarouselTimer);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && carouselAnimationFrame) {
      cancelAnimationFrame(carouselAnimationFrame);
      carouselAnimationFrame = null;
      return;
    }

    if (!document.hidden && !carouselAnimationFrame) {
      resetCarouselTimer();
      carouselAnimationFrame = requestAnimationFrame(animateCarouselTimer);
    }
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

document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const userArea = document.querySelector(".user-area");

  if (!userArea) return;

  if (user && user.id) {
    userArea.innerHTML = `
        <div class="user-menu">
            <a href="/users/profile" class="profile-trigger">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            </a>
            
            <div class="dropdown-content">
                <a href="/users/my-rentals">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                    Meus aluguéis
                </a>
                <a href="/users/my-tools">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>
                    Minhas ferramentas
                </a>
                <a href="/favorites">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                    Favoritos
                </a>
            </div>
        </div>

        <a href="#" id="logoutBtn" class="logout-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
        </a>
    `;

    document.getElementById("logoutBtn").addEventListener("click", (event) => {
      event.preventDefault();
      localStorage.removeItem("user");
      window.location.href = "/auth/login";
    });
  }


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
});

  document.addEventListener('DOMContentLoaded', () => {
    // 1. Alternar Alto Contraste
    const contrastBtn = document.getElementById('contrastBtn');
    contrastBtn?.addEventListener('click', () => {
      // Aplica a classe "create-high-contrast" no body
      document.body.classList.toggle('create-high-contrast');

      const isEnabled = document.body.classList.contains('create-high-contrast');
      localStorage.setItem('createContrastPref', isEnabled);
    });

    const fontBtn = document.getElementById('fontBtn');
    let currentScale = 100;

    fontBtn?.addEventListener('click', () => {
      currentScale += 10;
      if (currentScale > 150) currentScale = 100;

      document.documentElement.style.fontSize = `${currentScale}%`;
    });

    const audioBtn = document.getElementById('audioBtn');
    audioBtn?.addEventListener('click', () => {
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

    if (localStorage.getItem('createContrastPref') === 'true') {
      document.body.classList.add('create-high-contrast');
    }
  });

