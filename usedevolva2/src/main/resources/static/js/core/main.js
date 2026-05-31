(() => {
  "use strict";

  const STORAGE_KEYS = {
    contrast: "useDevolvaAccessibilityContrast",
    audio: "useDevolvaAccessibilityAudio",
    zoom: "useDevolvaAccessibilityZoom",
    oldLargeFont: "useDevolvaAccessibilityLargeFont",
  };

  const ZOOM = {
    min: 90,
    max: 120,
    step: 10,
    defaultValue: 100,
  };

  const CAROUSEL_DELAY = 5000;
  let carouselTimer = null;
  let carouselProgressTimer = null;
  let carouselStartedAt = 0;
  let lastSpokenSelection = "";
  let selectionTimer = null;

  const escapeHtml = (value = "") => String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  const getPageName = () => {
    const heading = document.querySelector("h1");
    const title = (heading?.textContent || document.title || "Use&Devolva").trim();
    return title.replace(/\s+/g, " ");
  };

  const speak = (text, options = {}) => {
    if (!text || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.trim());
    utterance.lang = "pt-BR";
    utterance.rate = options.rate || 0.95;
    utterance.pitch = options.pitch || 1;
    window.speechSynthesis.speak(utterance);
  };

  const readBoolean = (key) => localStorage.getItem(key) === "true";

  const getZoomValue = () => {
    const stored = Number(localStorage.getItem(STORAGE_KEYS.zoom));
    if (Number.isFinite(stored)) {
      return Math.min(Math.max(stored, ZOOM.min), ZOOM.max);
    }

    if (readBoolean(STORAGE_KEYS.oldLargeFont)) {
      localStorage.removeItem(STORAGE_KEYS.oldLargeFont);
      return 110;
    }

    return ZOOM.defaultValue;
  };

  const setZoomValue = (value) => {
    const nextValue = Math.min(Math.max(value, ZOOM.min), ZOOM.max);
    localStorage.setItem(STORAGE_KEYS.zoom, String(nextValue));
    applyAccessibilityState();
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
    const contrastEnabled = readBoolean(STORAGE_KEYS.contrast);
    const audioEnabled = readBoolean(STORAGE_KEYS.audio);
    const zoomValue = getZoomValue();

    document.body.classList.toggle("high-contrast", contrastEnabled);
    document.body.classList.toggle("create-high-contrast", contrastEnabled);
    document.documentElement.classList.toggle("high-contrast", contrastEnabled);

    document.documentElement.dataset.accessibilityZoom = String(zoomValue);
    document.documentElement.style.setProperty("--accessibility-zoom", `${zoomValue}%`);
    document.body.style.zoom = `${zoomValue}%`;

    updateButtonState(
      document.getElementById("contrastBtn"),
      contrastEnabled,
      "Desativar alto contraste",
      "Ativar alto contraste"
    );

    updateButtonState(
      document.getElementById("audioBtn"),
      audioEnabled,
      "Desativar acessibilidade de fala",
      "Ativar acessibilidade de fala"
    );

    const zoomOutBtn = document.getElementById("zoomOutBtn");
    const zoomInBtn = document.getElementById("zoomInBtn");
    const oldFontBtn = document.getElementById("fontBtn");

    if (zoomOutBtn) {
      zoomOutBtn.disabled = zoomValue <= ZOOM.min;
      zoomOutBtn.setAttribute("aria-label", `Diminuir zoom. Zoom atual ${zoomValue}%`);
      zoomOutBtn.setAttribute("title", `Diminuir zoom (${zoomValue}%)`);
    }

    if (zoomInBtn) {
      zoomInBtn.disabled = zoomValue >= ZOOM.max;
      zoomInBtn.setAttribute("aria-label", `Aumentar zoom. Zoom atual ${zoomValue}%`);
      zoomInBtn.setAttribute("title", `Aumentar zoom (${zoomValue}%)`);
    }

    updateButtonState(
      oldFontBtn,
      zoomValue > ZOOM.defaultValue,
      "Reduzir zoom da página",
      "Aumentar zoom da página"
    );
  };

  const getSelectedText = () => {
    const selection = window.getSelection?.();
    const text = selection ? selection.toString().trim() : "";
    return text.replace(/\s+/g, " ");
  };

  const speakSelectedText = () => {
    if (!readBoolean(STORAGE_KEYS.audio)) return;

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
    const zoomOutBtn = document.getElementById("zoomOutBtn");
    const zoomInBtn = document.getElementById("zoomInBtn");
    const oldFontBtn = document.getElementById("fontBtn");
    const audioBtn = document.getElementById("audioBtn");

    applyAccessibilityState();

    contrastBtn?.addEventListener("click", () => {
      const enabled = !readBoolean(STORAGE_KEYS.contrast);
      localStorage.setItem(STORAGE_KEYS.contrast, String(enabled));
      applyAccessibilityState();
    });

    zoomOutBtn?.addEventListener("click", () => {
      setZoomValue(getZoomValue() - ZOOM.step);
    });

    zoomInBtn?.addEventListener("click", () => {
      setZoomValue(getZoomValue() + ZOOM.step);
    });

    oldFontBtn?.addEventListener("click", () => {
      const current = getZoomValue();
      setZoomValue(current >= 110 ? ZOOM.defaultValue : current + ZOOM.step);
    });

    audioBtn?.addEventListener("click", () => {
      const enabled = !readBoolean(STORAGE_KEYS.audio);
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

  const getInitials = (user) => {
    const name = user?.nomeCompleto || user?.nome || user?.name || user?.email || "U";
    return String(name)
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "U";
  };

  const getProfileImageUrl = (user) => {
    return user?.profileImageUrl || user?.fotoPerfil || user?.photoUrl || user?.avatarUrl || user?.imagemPerfil || "";
  };

  const renderProfileAvatar = (user) => {
    const profileImageUrl = getProfileImageUrl(user);
    const safeInitials = escapeHtml(getInitials(user));

    if (profileImageUrl) {
      return `
        <span class="profile-avatar has-image" aria-hidden="true">
          <img src="${escapeHtml(profileImageUrl)}" alt="" loading="lazy" onerror="this.closest('.profile-avatar').classList.remove('has-image'); this.remove(); this.closest('.profile-avatar').textContent='${safeInitials}';">
        </span>`;
    }

    return `<span class="profile-avatar" aria-hidden="true">${safeInitials}</span>`;
  };

  const initHeader = () => {
    const header = document.querySelector(".site-header");
    const menuToggle = document.getElementById("headerMenuToggle");
    const userArea = document.querySelector(".user-area");
    const searchForm = document.getElementById("headerSearchForm");
    const searchInput = document.getElementById("headerSearchInput");
    const dropdownTrigger = document.querySelector(".dropdown-trigger");
    const categoryDropdown = dropdownTrigger?.closest(".dropdown");
    const mobileHeaderQuery = window.matchMedia("(max-width: 1160px)");

    const closeCategoryDropdown = () => {
      categoryDropdown?.classList.remove("is-open");
      dropdownTrigger?.setAttribute("aria-expanded", "false");
    };

    const openCategoryDropdown = () => {
      categoryDropdown?.classList.add("is-open");
      dropdownTrigger?.setAttribute("aria-expanded", "true");
    };

    const closeHeaderMenu = () => {
      header?.classList.remove("is-menu-open");
      menuToggle?.setAttribute("aria-expanded", "false");
      closeCategoryDropdown();
    };

    closeCategoryDropdown();

    menuToggle?.addEventListener("click", () => {
      const isOpen = header?.classList.toggle("is-menu-open") || false;
      menuToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      closeCategoryDropdown();
    });

    dropdownTrigger?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      if (categoryDropdown?.classList.contains("is-open")) {
        closeCategoryDropdown();
      } else {
        openCategoryDropdown();
      }
    });

    mobileHeaderQuery.addEventListener?.("change", closeCategoryDropdown);

    document.addEventListener("click", (event) => {
      if (!categoryDropdown || categoryDropdown.contains(event.target)) return;
      closeCategoryDropdown();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeCategoryDropdown();
        closeHeaderMenu();
      }
    });

    document.querySelectorAll(".main-header-nav a").forEach((link) => {
      link.addEventListener("click", () => {
        if (mobileHeaderQuery.matches) {
          closeHeaderMenu();
        } else {
          closeCategoryDropdown();
        }
      });
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

    userArea.classList.toggle("is-authenticated", Boolean(user && user.id));

    if (user && user.id) {
      const displayName = user.nomeCompleto || user.nome || user.name || "Usuário";
      userArea.innerHTML = `
        <div class="user-menu">
          <button type="button" class="profile-trigger" aria-label="Abrir menu de ${escapeHtml(displayName)}" aria-expanded="false" aria-controls="userDropdownMenu">
            ${renderProfileAvatar(user)}
          </button>
          <div id="userDropdownMenu" class="dropdown-content" role="menu">
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

      const closeUserMenu = () => {
        userMenu?.classList.remove("is-open");
        profileTrigger?.setAttribute("aria-expanded", "false");
      };

      profileTrigger?.addEventListener("click", (event) => {
        event.stopPropagation();
        const isOpen = userMenu?.classList.toggle("is-open") || false;
        profileTrigger.setAttribute("aria-expanded", isOpen ? "true" : "false");
      });

      document.addEventListener("click", (event) => {
        if (!userMenu || userMenu.contains(event.target)) return;
        closeUserMenu();
      });

      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") closeUserMenu();
      });

      userMenu?.querySelectorAll(".dropdown-content a").forEach((link) => {
        link.addEventListener("click", closeUserMenu);
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
