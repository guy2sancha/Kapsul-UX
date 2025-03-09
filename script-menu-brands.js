document.addEventListener("DOMContentLoaded", function () {
    const menuItems = document.querySelectorAll(".menu-item");
    const mainImage = document.getElementById("main-image");
    let timeoutId = null; // Pour gérer le délai avant de revenir à l'image active

    // Définir l'image de base depuis le menu actif
    const activeItem = document.querySelector(".menu-item.active");
    const defaultImage = activeItem ? activeItem.getAttribute("data-image") : "";

    if (defaultImage) {
        mainImage.src = defaultImage; // Mettre l'image par défaut
    }

    menuItems.forEach(item => {
        item.addEventListener("mouseover", function () {
            const newImage = this.getAttribute("data-image");
            if (newImage && mainImage.src !== newImage) { 
                clearTimeout(timeoutId); // Annuler le retour à l'image active si on survole un autre élément
                mainImage.style.transition = "opacity 0.8s ease-in-out"; 
                mainImage.style.opacity = 0;
                setTimeout(() => {
                    mainImage.src = newImage;
                    mainImage.style.opacity = 1;
                }, 400);
            }
        });

        item.addEventListener("mouseout", function () {
            // Met un délai avant de remettre l'image du menu actif
            timeoutId = setTimeout(() => {
                if (mainImage.src !== defaultImage) { 
                    mainImage.style.transition = "opacity 0.5s ease-in-out"; 
                    mainImage.style.opacity = 0;
                    setTimeout(() => {
                        mainImage.src = defaultImage;
                        mainImage.style.opacity = 1;
                    }, 400);
                }
            }, 1500); // Délai de 1.5 secondes avant de revenir à l'image du menu actif
        });
    });
});
