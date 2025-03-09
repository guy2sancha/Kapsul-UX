document.addEventListener("DOMContentLoaded", function () {
    const menuItems = document.querySelectorAll(".menu-item");
    const mainImage = document.getElementById("main-image");
    let timeoutId = null;
    let hoverActive = false; // Pour suivre si la souris est sur un menu
    let currentImage = ""; // Évite les changements inutiles

    // Définir l'image de base depuis le menu actif
    const activeItem = document.querySelector(".menu-item.active");
    const defaultImage = activeItem ? activeItem.getAttribute("data-image") : "";

    if (defaultImage) {
        mainImage.src = defaultImage;
        currentImage = defaultImage;
    }

    menuItems.forEach(item => {
        item.addEventListener("mouseover", function () {
            const newImage = this.getAttribute("data-image");
            if (newImage && currentImage !== newImage) { 
                clearTimeout(timeoutId); // Annule le retour à l'image active
                hoverActive = true; // Indique que la souris est sur un menu
                currentImage = newImage;
                mainImage.style.transition = "opacity 0.8s ease-in-out"; 
                mainImage.style.opacity = 0;
                setTimeout(() => {
                    mainImage.src = newImage;
                    mainImage.style.opacity = 1;
                }, 400);
            }
        });

        item.addEventListener("mouseout", function () {
            // Vérifie si la souris n'est plus sur aucun menu après 1.5s
            timeoutId = setTimeout(() => {
                if (!hoverActive && currentImage !== defaultImage) { 
                    mainImage.style.transition = "opacity 1.5s ease-in-out"; 
                    mainImage.style.opacity = 0;
                    setTimeout(() => {
                        mainImage.src = defaultImage;
                        mainImage.style.opacity = 1;
                        currentImage = defaultImage;
                    }, 400);
                }
            }, 1500);
        });
    });

    // Vérifie si la souris quitte complètement le menu
    document.getElementById("menu-marketplace-container").addEventListener("mouseleave", function () {
        hoverActive = false;
    });

    document.getElementById("menu-marketplace-container").addEventListener("mouseenter", function () {
        hoverActive = true;
        clearTimeout(timeoutId); // Annule la restauration immédiate
    });
});
