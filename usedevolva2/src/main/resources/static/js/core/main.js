(() => {
  "use strict";

  const STORAGE_KEYS = {
    contrast: "useDevolvaAccessibilityContrast",
    zoom: "useDevolvaAccessibilityZoom",
    audio: "useDevolvaAccessibilityAudio",
  };

  const ZOOM_MIN = 90;
  const ZOOM_MAX = 120;
  const ZOOM_STEP = 10;
  const ZOOM_DEFAULT = 100;

  const CAROUSEL_DELAY = 5000;
  let carouselTimer = null;
  let carouselProgressTimer = null;
  let carouselStartedAt = 0;
  let lastSpokenSelection = "";
  let selectionTimer = null;

  const getPageName = () => {
    const heading = document.querySelector("h1, [aria-labelledby] h1");
    const title = (heading?.textContent || document.title || "Use e Devolva").trim();
    return title.replace(/\s+/g, " ");
  };

  const clampZoom = (value) => {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) return ZOOM_DEFAULT;
    return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, parsed));
  };

  const getCurrentZoom = () => clampZoom(localStorage.getItem(STORAGE_KEYS.zoom) || ZOOM_DEFAULT);

  const setCurrentZoom = (value) => {
    const zoom = clampZoom(value);
    localStorage.setItem(STORAGE_KEYS.zoom, String(zoom));
    applyAccessibilityState();
  };

  const getFirstFilledValue = (source, keys) => {
    if (!source || typeof source !== "object") return "";
    for (const key of keys) {
      const value = source[key];
      if (typeof value === "string" && value.trim()) return value.trim();
    }
    return "";
  };

  const escapeHtml = (value) => String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

  const speak = (text, options = {}) => {
    if (!text || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text.trim());
    utterance.lang = "pt-BR";
    utterance.rate = options.rate || 0.95;
    utterance.pitch = options.pitch || 1;
    window.speechSynthesis.speak(utterance);
  };

  const updateButtonState = (button, enabled, activeLabel, inactiveLabel) => {
    if (!button) return;
    button.classList.toggle("is-active", Boolean(enabled));
    button.setAttribute("aria-pressed", enabled ? "true" : "false");
    if (activeLabel && inactiveLabel) {
      button.setAttribute("aria-label", enabled ? activeLabel : inactiveLabel);
      button.setAttribute("title", enabled ? activeLabel : inactiveLabel);
    }
  };

  const applyAccessibilityState = () => {
    const contrastEnabled = localStorage.getItem(STORAGE_KEYS.contrast) === "true";
    const zoom = getCurrentZoom();
    const audioEnabled = localStorage.getItem(STORAGE_KEYS.audio) === "true";

    document.body.classList.toggle("high-contrast", contrastEnabled);
    document.body.classList.toggle("create-high-contrast", contrastEnabled);
    document.body.classList.remove("large-font");
    document.documentElement.classList.remove("large-font");
    document.documentElement.style.setProperty("--accessibility-zoom", `${zoom / 100}`);
    document.documentElement.dataset.accessibilityZoom = String(zoom);

    updateButtonState(
      document.getElementById("contrastBtn"),
      contrastEnabled,
      "Desativar alto contraste",
      "Ativar alto contraste"
    );

    const decreaseBtn = document.getElementById("zoomDecreaseBtn");
    const increaseBtn = document.getElementById("zoomIncreaseBtn");
    const legacyFontBtn = document.getElementById("fontBtn");

    if (decreaseBtn) {
      decreaseBtn.disabled = zoom <= ZOOM_MIN;
      decreaseBtn.setAttribute("aria-label", `Diminuir zoom da página. Zoom atual ${zoom}%`);
      decreaseBtn.setAttribute("title", `Diminuir zoom (${zoom}%)`);
    }

    if (increaseBtn) {
      increaseBtn.disabled = zoom >= ZOOM_MAX;
      increaseBtn.setAttribute("aria-label", `Aumentar zoom da página. Zoom atual ${zoom}%`);
      increaseBtn.setAttribute("title", `Aumentar zoom (${zoom}%)`);
    }

    if (legacyFontBtn) {
      legacyFontBtn.setAttribute("aria-label", `Aumentar zoom da página. Zoom atual ${zoom}%`);
      legacyFontBtn.setAttribute("title", `Aumentar zoom (${zoom}%)`);
      legacyFontBtn.classList.toggle("is-active", zoom > ZOOM_DEFAULT);
      legacyFontBtn.setAttribute("aria-pressed", zoom > ZOOM_DEFAULT ? "true" : "false");
    }

    updateButtonState(
      document.getElementById("audioBtn"),
      audioEnabled,
      "Desativar acessibilidade de fala",
      "Ativar acessibilidade de fala"
    );
  };

  const getSelectedText = () => {
    const selection = window.getSelection?.();
    const text = selection ? selection.toString().trim() : "";
    return text.replace(/\s+/g, " ");
  };

  const speakSelectedText = () => {
    if (localStorage.getItem(STORAGE_KEYS.audio) !== "true") return;

    const selectedText = getSelectedText();
    if (!selectedText || selectedText.length < 2 || selectedText === lastSpokenSelection) return;

    lastSpokenSelection = selectedText;
    speak(selectedText);
  };

  const scheduleSelectionSpeech = () => {
    clearTimeout(selectionTimer);
    selectionTimer = setTimeout(speakSelectedText, 350);
  };

  const initAccessibility = () => {
    const contrastBtn = document.getElementById("contrastBtn");
    const zoomDecreaseBtn = document.getElementById("zoomDecreaseBtn");
    const zoomIncreaseBtn = document.getElementById("zoomIncreaseBtn");
    const legacyFontBtn = document.getElementById("fontBtn");
    const audioBtn = document.getElementById("audioBtn");

    applyAccessibilityState();

    contrastBtn?.addEventListener("click", () => {
      const enabled = localStorage.getItem(STORAGE_KEYS.contrast) !== "true";
      localStorage.setItem(STORAGE_KEYS.contrast, String(enabled));
      applyAccessibilityState();
    });

    zoomDecreaseBtn?.addEventListener("click", () => {
      setCurrentZoom(getCurrentZoom() - ZOOM_STEP);
    });

    zoomIncreaseBtn?.addEventListener("click", () => {
      setCurrentZoom(getCurrentZoom() + ZOOM_STEP);
    });

    legacyFontBtn?.addEventListener("click", () => {
      const current = getCurrentZoom();
      setCurrentZoom(current >= ZOOM_MAX ? ZOOM_DEFAULT : current + ZOOM_STEP);
    });

    audioBtn?.addEventListener("click", () => {
      const enabled = localStorage.getItem(STORAGE_KEYS.audio) !== "true";
      localStorage.setItem(STORAGE_KEYS.audio, String(enabled));
      lastSpokenSelection = "";
      applyAccessibilityState();

      if (enabled) {
        speak(`Acessibilidade de áudio ativada. Página ${getPageName()}. Selecione um texto para ouvir.`);
      } else {
        speak("Acessibilidade de fala desativada.");
      }
    });

    document.addEventListener("selectionchange", scheduleSelectionSpeech);
    document.addEventListener("mouseup", scheduleSelectionSpeech);
    document.addEventListener("keyup", scheduleSelectionSpeech);
  };

  const initHeader = () => {
    const header = document.querySelector(".site-header");
    const menuToggle = document.getElementById("headerMenuToggle");
    const userArea = document.querySelector(".user-area");
    const searchForm = document.getElementById("headerSearchForm");
    const searchInput = document.getElementById("headerSearchInput");

    menuToggle?.addEventListener("click", () => {
      const isOpen = header?.classList.toggle("is-menu-open") || false;
      menuToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    searchForm?.addEventListener("submit", (event) => {
      if (!searchInput) return;
      const term = searchInput.value.trim();
      if (!term) {
        event.preventDefault();
        searchInput.focus();
      }
    });

    if (!userArea) return;

    let user = null;
    try {
      user = JSON.parse(localStorage.getItem("user") || "null");
    } catch (error) {
      localStorage.removeItem("user");
    }

    if (user && user.id) {
      const initials = (user.nome || user.nomeCompleto || user.name || user.email || "U")
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join("") || "U";

      const profileImageUrl = getFirstFilledValue(user, [
        "profileImageUrl",
        "fotoPerfil",
        "fotoPerfilUrl",
        "photoUrl",
        "avatarUrl",
        "imagemPerfil",
        "imagemPerfilUrl"
      ]);

      const avatarHtml = profileImageUrl
        ? `<span class="profile-avatar has-image" aria-hidden="true"><img src="${escapeHtml(profileImageUrl)}" alt=""></span>`
        : `<span class="profile-avatar" aria-hidden="true">${escapeHtml(initials)}</span>`;

      userArea.innerHTML = `
        <div class="user-menu">
          <button type="button" class="profile-trigger" aria-label="Abrir menu do usuário" aria-expanded="false">
            ${avatarHtml}
          </button>
          <div class="dropdown-content" role="menu">
            <a href="/users/profile" role="menuitem">Meu perfil</a>
            <a href="/users/my-rentals" role="menuitem">Meus aluguéis</a>
            <a href="/users/my-tools" role="menuitem">Minhas ferramentas</a>
            <a href="/users/favorites" role="menuitem">Favoritos</a>
          </div>
        </div>
        <a href="#" id="logoutBtn" class="logout-btn" aria-label="Sair da conta">Sair</a>
      `;

      const profileTrigger = userArea.querySelector(".profile-trigger");
      const userMenu = userArea.querySelector(".user-menu");

      profileTrigger?.addEventListener("click", () => {
        const isOpen = userMenu?.classList.toggle("is-open") || false;
        profileTrigger.setAttribute("aria-expanded", isOpen ? "true" : "false");
      });

      document.addEventListener("click", (event) => {
        if (!userMenu || userMenu.contains(event.target)) return;
        userMenu.classList.remove("is-open");
        profileTrigger?.setAttribute("aria-expanded", "false");
      });

      document.getElementById("logoutBtn")?.addEventListener("click", (event) => {
        event.preventDefault();
        localStorage.removeItem("user");
        window.location.href = "/auth/login";
      });
    }
  };

  const initCarousel = () => {
    const carousel = document.querySelector(".carousel");
    const track = document.querySelector(".carousel-track");
    const slides = Array.from(document.querySelectorAll(".carousel-track img"));
    const prevBtn = document.querySelector(".carousel-btn.prev");
    const nextBtn = document.querySelector(".carousel-btn.next");
    const dots = Array.from(document.querySelectorAll(".carousel-dots .dot"));
    const progress = document.querySelector(".carousel-progress-bar");
    const titleEl = document.getElementById("homeHeroTitle");
    const textEl = document.getElementById("homeHeroText");

    if (!carousel || !track || slides.length === 0) return;

    const slideTexts = slides.map((slide) => ({
      title: slide.dataset.title || "Encontre ferramentas próximas",
      text: slide.dataset.text || "Use a busca por localização para encontrar ferramentas disponíveis perto de você.",
    }));

    let index = 0;

    const updateProgress = () => {
      if (!progress) return;
      const elapsed = Date.now() - carouselStartedAt;
      const percentage = Math.min((elapsed / CAROUSEL_DELAY) * 100, 100);
      progress.style.width = `${percentage}%`;
    };

    const stopCarousel = () => {
      clearInterval(carouselTimer);
      clearInterval(carouselProgressTimer);
    };

    const startCarousel = () => {
      stopCarousel();
      carouselStartedAt = Date.now();
      if (progress) progress.style.width = "0%";
      carouselProgressTimer = setInterval(updateProgress, 80);
      carouselTimer = setInterval(() => goToSlide(index + 1, false), CAROUSEL_DELAY);
    };

    const goToSlide = (nextIndex, resetTimer = true) => {
      index = (nextIndex + slides.length) % slides.length;
      track.style.transform = `translateX(-${index * 100}%)`;

      dots.forEach((dot, dotIndex) => {
        const active = dotIndex === index;
        dot.classList.toggle("active", active);
        dot.setAttribute("aria-current", active ? "true" : "false");
      });

      if (titleEl && slideTexts[index]) titleEl.textContent = slideTexts[index].title;
      if (textEl && slideTexts[index]) textEl.textContent = slideTexts[index].text;

      if (resetTimer) startCarousel();
      else {
        carouselStartedAt = Date.now();
        if (progress) progress.style.width = "0%";
      }
    };

    prevBtn?.addEventListener("click", () => goToSlide(index - 1, true));
    nextBtn?.addEventListener("click", () => goToSlide(index + 1, true));
    dots.forEach((dot, dotIndex) => dot.addEventListener("click", () => goToSlide(dotIndex, true)));

    carousel.addEventListener("mouseenter", stopCarousel);
    carousel.addEventListener("mouseleave", startCarousel);
    carousel.addEventListener("focusin", stopCarousel);
    carousel.addEventListener("focusout", startCarousel);

    goToSlide(0, false);
    startCarousel();
  };

  const initLegacyHelpers = () => {
    const cepButtons = document.querySelectorAll(
      ".detail-cep-small button, .detail-cep-large button, .location-box__input button, .cep-check button"
    );

    cepButtons.forEach((button) => {
      button.addEventListener("click", (event) => {
        const container = button.parentElement;
        const input = container?.querySelector("input");
        if (!input || input.value.trim()) return;
        event.preventDefault();
        input.focus();
      });
    });
  };

  document.addEventListener("DOMContentLoaded", () => {
    initAccessibility();
    initHeader();
    initCarousel();
    initLegacyHelpers();
  });
})();
