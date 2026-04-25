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


const carouselTrack = document.querySelector(".carousel-track");
const carouselImages = document.querySelectorAll(".carousel-track img");
const prevCarouselBtn = document.querySelector(".carousel-btn.prev");
const nextCarouselBtn = document.querySelector(".carousel-btn.next");
const carouselDots = document.querySelectorAll(".carousel-dots .dot");

let carouselIndex = 0;

function updateCarousel() {
  if (!carouselTrack || carouselImages.length === 0) return;

  carouselTrack.style.transform = `translateX(-${carouselIndex * 100}%)`;

  carouselDots.forEach((dot, index) => {
    dot.classList.toggle("active", index === carouselIndex);
  });
}

if (carouselTrack && carouselImages.length > 0) {
  if (nextCarouselBtn) {
    nextCarouselBtn.addEventListener("click", () => {
      carouselIndex = (carouselIndex + 1) % carouselImages.length;
      updateCarousel();
    });
  }

  if (prevCarouselBtn) {
    prevCarouselBtn.addEventListener("click", () => {
      carouselIndex =
        (carouselIndex - 1 + carouselImages.length) % carouselImages.length;
      updateCarousel();
    });
  }

  carouselDots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      carouselIndex = index;
      updateCarousel();
    });
  });

  setInterval(() => {
    carouselIndex = (carouselIndex + 1) % carouselImages.length;
    updateCarousel();
  }, 5000);
}

