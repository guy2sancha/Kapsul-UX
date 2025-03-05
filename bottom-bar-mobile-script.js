document.addEventListener("DOMContentLoaded", function () {
    const bottomBar = document.querySelector(".bottom-bar");
    let lastScrollY = window.scrollY;

    // Gestion de la transparence de la barre en fonction du scroll
    window.addEventListener("scroll", () => {
        const currentScrollY = window.scrollY;
        if (currentScrollY > 50) {
            if (currentScrollY > lastScrollY) {
                bottomBar.style.backgroundColor = `rgba(255, 255, 255, ${Math.max(0.4, 1 - currentScrollY / 300)})`;
                bottomBar.style.boxShadow = 'none';
            } else {
                bottomBar.style.backgroundColor = 'rgba(255, 255, 255, 1)';
                bottomBar.style.boxShadow = '0px -4px 10px rgba(0, 0, 0, 0.1)';
            }
        } else {
            bottomBar.style.backgroundColor = 'rgba(255, 255, 255, 1)';
            bottomBar.style.boxShadow = '0px -4px 10px rgba(0, 0, 0, 0.1)';
        }
        lastScrollY = currentScrollY;
    });

    // Gestion du clic sur les liens de la bottom-bar
    document.querySelectorAll(".bottom-bar a").forEach(link => {
        link.addEventListener("click", function (event) {
            const linkPath = normalizePath(new URL(link.href).pathname);
            const currentPath = normalizePath(window.location.pathname);

            // Si le lien correspond à la page actuelle, scroller vers le haut
            if (linkPath === currentPath) {
                event.preventDefault();
                smoothScrollToTop();
            }
        });
    });

    // Fonction de scroll fluide vers le haut
    function smoothScrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }

    // Fonction pour normaliser les chemins en supprimant le préfixe de langue
    function normalizePath(path) {
        return path.replace(/^\/(fr|ja|ko|es|th|pt|de|nl|pl|it|ar|vi|zh\-cn|zh\-tw)(\/|$)/, "/"); // Supprime le préfixe de langue
    }
});
