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
                bottomBar.style.backgroundColor = 'rgba(255, 255, 1)';
                bottomBar.style.boxShadow = '0px -4px 10px rgba(0, 0, 0, 0.1)';
            }
        } else {
            bottomBar.style.backgroundColor = 'rgba(255, 255, 255, 1)';
            bottomBar.style.boxShadow = '0px -4px 10px rgba(0, 0, 0, 0.1)';
        }
        lastScrollY = currentScrollY;
    });

    // Ajout du comportement de surbrillance du lien actif
    function highlightActiveLink() {
        let links = document.querySelectorAll(".bottom-bar a");
        let currentPath = normalizePath(window.location.pathname); // Chemin actuel sans préfixe de langue

        let pageMappings = {
            "/all-the-brands": "brands",
            "/american-brands": "brands",
            "/european-brands": "brands",
            "/african-brands": "brands",
            "/middle-eastern-brands": "brands",
            "/south-asian-brands": "brands",
            "/east-asian-brands": "brands",
            "/oceanian-brands": "brands",

            "/brand-details": "brands",
            "/shop-details": "shops",
            "/all-the-retailers": "shops",
            "/tokyo": "shops",
            "/seoul": "shops",
            "/taipei": "shops",
            "/hong-kong": "shops",
            "/paris": "shops",
            "/new-york": "shops",
            "/london": "shops",
            "/amsterdam": "shops",
            "/melbourne": "shops",

            "/map": "map",
            "/store-locator": "map",
            "/marketplace": "market",
            "/marketplace-women": "market",
            "/marketplace-men": "market"
        };

        // Identifier la catégorie active
        let activeCategory = Object.keys(pageMappings).find(key => currentPath.startsWith(key)) 
                            ? pageMappings[currentPath.startsWith("/brand-details") ? "/brand-details" : 
                                            currentPath.startsWith("/shop-details") ? "/shop-details" : currentPath]
                            : pageMappings[currentPath];

        links.forEach((link) => {
            let linkHref = normalizePath(new URL(link.href, window.location.origin).pathname);

            if (pageMappings[linkHref] === activeCategory) {
                link.classList.add("active-tab");
            } else {
                link.classList.remove("active-tab");
            }
        });
    }

    // Fonction pour normaliser les chemins en supprimant le préfixe de langue
    function normalizePath(path) {
        return path.replace(/^\/(fr|ja|ko|es|th|pt|de|nl|pl|it|ar|vi|zh\-cn|zh\-tw)(\/|$)/, "/"); // Supprime le préfixe de langue
    }

    // Gestion du clic sur les liens de la bottom-bar pour scroller en haut
    document.querySelectorAll(".bottom-bar a").forEach(link => {
        link.addEventListener("click", function (event) {
            const linkPath = normalizePath(new URL(link.href).pathname);
            const currentPath = normalizePath(window.location.pathname);

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

    // Exécuter la mise en surbrillance après chargement
    setTimeout(highlightActiveLink, 100);
});
