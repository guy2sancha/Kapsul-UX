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
            if (newImage && mainImage.src !== newImage) { // Vérifier si l'image change réellement
                mainImage.style.transition = "opacity 0.8s ease-in-out"; 
                mainImage.style.opacity = 0;
                setTimeout(() => {
                    mainImage.src = newImage;
                    requestAnimationFrame(() => { mainImage.style.opacity = 1; });
                }, 400);
            }
        });

        item.addEventListener("mouseout", function () {
            if (mainImage.src !== defaultImage) { // Vérifier si l'image par défaut est différente
                mainImage.style.transition = "opacity 1.5s ease-in-out"; 
                mainImage.style.opacity = 0;
                setTimeout(() => {
                    mainImage.src = defaultImage;
                    requestAnimationFrame(() => { mainImage.style.opacity = 1; });
                }, 400);
            }
        });
    });
});
