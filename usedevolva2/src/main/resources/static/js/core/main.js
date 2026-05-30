// ==========================
// USE&DEVOLVA - INTERAÇÕES GERAIS
// ==========================

(function () {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  function setupHeaderSearch() {
    const searchForm = document.getElementById("headerSearchForm") || document.getElementById("searchForm");
    const searchInput = document.getElementById("headerSearchInput") || document.getElementById("searchInput");

    if (!searchForm || !searchInput) return;

    searchForm.addEventListener("submit", function (event) {
      const termo = searchInput.value.trim();

      if (!termo) {
        event.preventDefault();
        alert("Digite o nome de uma ferramenta para buscar.");
      }
    });
  }

  function setupMobileMenu() {
    const toggle = document.querySelector(".mobile-menu-toggle");
    const header = document.querySelector("header");

    if (!toggle || !header) return;

    toggle.addEventListener("click", () => {
      const isOpen = header.classList.toggle("menu-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
      document.body.classList.toggle("mobile-menu-open", isOpen);
    });

    header.querySelectorAll("nav a, .user-area a").forEach((link) => {
      link.addEventListener("click", () => {
        header.classList.remove("menu-open");
        document.body.classList.remove("mobile-menu-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  function setupCepButtons() {
    const cepButtons = document.querySelectorAll(
      ".detail-cep-small button, .detail-cep-large button, .location-box__input button, .cep-check button"
    );

    cepButtons.forEach((button) => {
      button.addEventListener("click", function (event) {
        const container = button.parentElement;
        const input = container?.querySelector("input");

        if (!input) return;

        const cep = input.value.trim();

        if (!cep) {
          event.preventDefault();
          alert("Digite um CEP para consultar a localização.");
        }
      });
    });
  }

  function setupCarousel() {
    const carouselTrack = document.querySelector(".carousel-track");
    const carouselImages = document.querySelectorAll(".carousel-track img");
    const prevCarouselBtn = document.querySelector(".carousel-btn.prev");
    const nextCarouselBtn = document.querySelector(".carousel-btn.next");
    const carouselDots = document.querySelectorAll(".carousel-dots .dot");

    if (!carouselTrack || carouselImages.length === 0) return;

    let carouselIndex = 0;

    function updateCarousel() {
      carouselTrack.style.transform = `translateX(-${carouselIndex * 100}%)`;
      carouselDots.forEach((dot, index) => dot.classList.toggle("active", index === carouselIndex));
    }

    function nextCarouselSlide() {
      carouselIndex = (carouselIndex + 1) % carouselImages.length;
      updateCarousel();
    }

    function prevCarouselSlide() {
      carouselIndex = (carouselIndex - 1 + carouselImages.length) % carouselImages.length;
      updateCarousel();
    }

    nextCarouselBtn?.addEventListener("click", nextCarouselSlide);
    prevCarouselBtn?.addEventListener("click", prevCarouselSlide);

    carouselDots.forEach((dot, index) => {
      dot.addEventListener("click", () => {
        carouselIndex = index;
        updateCarousel();
      });
    });

    setInterval(nextCarouselSlide, 5000);
  }

  function setupAccessibility() {
    const contrastBtn = document.getElementById("contrastBtn");
    const fontBtn = document.getElementById("fontBtn");
    const audioBtn = document.getElementById("audioBtn");

    if (localStorage.getItem("createContrastPref") === "true") {
      document.body.classList.add("high-contrast", "create-high-contrast");
    }

    contrastBtn?.addEventListener("click", () => {
      document.body.classList.toggle("high-contrast");
      document.body.classList.toggle("create-high-contrast");
      const isEnabled = document.body.classList.contains("high-contrast") || document.body.classList.contains("create-high-contrast");
      localStorage.setItem("createContrastPref", String(isEnabled));
    });

    fontBtn?.addEventListener("click", () => {
      const current = Number(document.documentElement.dataset.fontScale || "100");
      const next = current >= 130 ? 100 : current + 10;
      document.documentElement.dataset.fontScale = String(next);
      document.documentElement.style.fontSize = `${next}%`;
      document.body.classList.toggle("large-font", next > 100);
    });

    audioBtn?.addEventListener("click", () => {
      if (!window.speechSynthesis) return;

      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        return;
      }

      const mainContent = document.querySelector("main") || document.body;
      const text = mainContent.innerText?.replace(/\s+/g, " ").trim();
      const content = text || `Página ${document.title || "Use e Devolva"}`;
      const utterance = new SpeechSynthesisUtterance(content.slice(0, 3500));
      utterance.lang = "pt-BR";
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    });
  }

  function setupUserArea() {
    const userArea = document.querySelector(".user-area");
    if (!userArea) return;

    let user = null;
    try {
      user = JSON.parse(localStorage.getItem("user"));
    } catch (error) {
      localStorage.removeItem("user");
    }

    if (!user?.id) return;

    userArea.innerHTML = `
      <div class="user-menu">
        <a href="/users/profile" class="profile-trigger" aria-label="Abrir perfil">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
        </a>
        <div class="dropdown-content">
          <a href="/users/my-rentals">Meus aluguéis</a>
          <a href="/users/my-tools">Minhas ferramentas</a>
          <a href="/favorites">Favoritos</a>
        </div>
      </div>
      <a href="#" id="logoutBtn" class="logout-btn" aria-label="Sair da conta">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
      </a>
    `;

    document.getElementById("logoutBtn")?.addEventListener("click", (event) => {
      event.preventDefault();
      localStorage.removeItem("user");
      window.location.href = "/auth/login";
    });
  }

  ready(() => {
    setupHeaderSearch();
    setupMobileMenu();
    setupCepButtons();
    setupCarousel();
    setupAccessibility();
    setupUserArea();
  });
})();
