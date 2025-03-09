document.addEventListener("DOMContentLoaded", function () {
    const menuItems = document.querySelectorAll(".menu-item");
    const mainImage = document.getElementById("main-image");

    // Définir l'image de base depuis le menu actif
    const activeItem = document.querySelector(".menu-item.active");
    const defaultImage = activeItem ? activeItem.getAttribute("data-image") : "";

    if (defaultImage) {
      mainImage.src = defaultImage; // Mettre l'image par défaut
    }

    menuItems.forEach(item => {
      item.addEventListener("mouseover", function () {
        const newImage = this.getAttribute("data-image");
        if (newImage) {
          mainImage.style.transition = "opacity 0.8s ease-in-out"; // Ralentir l'effet
          mainImage.style.opacity = 0;
          setTimeout(() => {
            mainImage.src = newImage;
            mainImage.style.opacity = 1;
          }, 400); // Délais légèrement augmenté
        }
      });

      item.addEventListener("mouseout", function () {
        // Revenir à l'image de base lorsqu'on sort du hover
        mainImage.style.transition = "opacity 0.8s ease-in-out"; // Ralentir l'effet
        mainImage.style.opacity = 0;
        setTimeout(() => {
          mainImage.src = defaultImage;
          mainImage.style.opacity = 1;
        }, 400); // Délais légèrement augmenté
      });
    });
  });
