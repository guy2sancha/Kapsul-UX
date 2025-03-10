/* ===================================================
   MAPPING LANGUE -> DEVISE
   =================================================== */
let languageToCurrency = {
    fr: "EUR",
    ja: "JPY",
    ko: "KRW",
    es: "EUR",
    th: "THB",
    pt: "EUR",
    de: "EUR",
    nl: "EUR",
    pl: "EUR",
    it: "EUR",
    ar: "USD",
    vi: "USD",
    "zh-cn": "CNY",
    "zh-tw": "TWD"
};

document.addEventListener("DOMContentLoaded", async function () {
    
    // 2) Initialise le sélecteur de langue
    initializeLanguageSelector();

    // 3) Initialise le sélecteur de devise
    await initializeCurrencySelector();

    // 4) Mise à jour du menu (login/logout) avec JWT
    updateMenu();

    // 5) Surligne le lien actif
    highlightActiveLink();

    // 6) Logo Lottie (scroll + clic)
    setupLogoToggle();

    // 7) Menu profil (clic extérieur pour fermer)
    setupProfileMenu();
});

/* ===================================================
   VÉRIFICATION JWT
   =================================================== */

function checkJWT() {
    const token = localStorage.getItem("jwtToken");
    if (!token) return false;

    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const isExpired = (payload.exp * 1000) < Date.now();
        return !isExpired;
    } catch (err) {
        console.error("JWT invalide", err);
        return false;
    }
}

/* ===================================================
   MISE À JOUR DU MENU (login/logout)
   =================================================== */

function updateMenu() {
    let isLoggedIn = checkJWT();

    let loggedOutMenu = document.getElementById("loggedOutMenu");
    let loggedInMenu = document.getElementById("loggedInMenu");
    
    if (loggedOutMenu && loggedInMenu) {
        loggedOutMenu.style.display = isLoggedIn ? "none" : "block";
        loggedInMenu.style.display = isLoggedIn ? "block" : "none";
    }

    let cartLink = document.querySelector(".cart-container a");
    if (cartLink) {
        if (isLoggedIn) {
            cartLink.href = "/cart";
            cartLink.removeAttribute("onclick");
        } else {
            cartLink.href = "#";
            cartLink.setAttribute("onclick", "showModal('cartModal')");
        }
    }

    let userIcon = document.getElementById("profileIcon");
    if (userIcon) {
        if (isLoggedIn) {
            userIcon.classList.remove("fa-user");
            userIcon.classList.add("fa-user-check");
        } else {
            userIcon.classList.remove("fa-user-check");
            userIcon.classList.add("fa-user");
        }
    }
}

/* ===================================================
   LOGOUT
   =================================================== */

function logoutUser() {
    localStorage.removeItem("jwtToken"); // Supprimer le JWT
    updateMenu();
    window.location.reload();
}

/* ===================================================
   GESTION DU PANIER
   =================================================== */

function handleCartClick() {
    if (checkJWT()) {
        window.location.href = "/cart";
    } else {
        showModal("cartModal");
    }
}

/* ===================================================
   AJOUT DU JWT DANS LES REQUÊTES API
   =================================================== */

async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem("jwtToken");
    if (!token) {
        throw new Error("Aucun token trouvé. L'utilisateur doit se reconnecter.");
    }

    options.headers = {
        ...options.headers,
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
    };

    const response = await fetch(url, options);
    if (!response.ok) {
        throw new Error(`Erreur API: ${response.statusText}`);
    }
    return await response.json();
}

/* ===================================================
   HIGHLIGHT DU LIEN ACTIF
   =================================================== */

function highlightActiveLink() {
    let links = document.querySelectorAll(".nav-links a");
    let currentPath = window.location.pathname;

    let pageMappings = {
        "/all-the-brands": "brands",
        "/japanese-brands": "brands",
        "/korean-brands": "brands",
        "/taiwanese-brands": "brands",
        "/vietnamese-brands": "brands",
        "/australian-brands": "brands",
        "/french-brands": "brands",
        "/italian-brands": "brands",
        "/german-brands": "brands",
        "/swedish-brands": "brands",
        "/united-states-brands": "brands",
        "/united-kingdom-brands": "brands",

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

    let activeCategory = pageMappings[currentPath];

    links.forEach((link) => {
        let linkHref = new URL(link.href, window.location.origin).pathname;

        if (pageMappings[linkHref] === activeCategory) {
            link.classList.add("active-tab");
            console.log("Lien actif détecté :", linkHref);
        } else {
            link.classList.remove("active-tab");
        }
    });

    console.log("URL actuelle:", currentPath);
    console.log("Catégorie active détectée:", activeCategory);
}

// Exécute après chargement complet
document.addEventListener("DOMContentLoaded", function () {
    setTimeout(highlightActiveLink, 100);
});

/* ===================================================
   GESTION DU PROFIL (menu déroulant)
   =================================================== */

function setupProfileMenu() {
    let profileMenu = document.getElementById("profileMenu");
    if (!profileMenu) return;

    document.addEventListener("click", function(event) {
        if (!profileMenu.contains(event.target)) {
            profileMenu.classList.remove("show");
        }
    });
}

function toggleMenu(event) {
    event.stopPropagation();
    let menu = document.getElementById("profileMenu");
    if (menu) {
        menu.classList.toggle("show");
    }
}

/* ===================================================
   GESTION DU LOGO LOTTIE (SCROLL + CLIQUE)
   =================================================== */

function setupLogoToggle() {
    const logoContainer = document.querySelector(".logo-container");
    if (!logoContainer) return;

    const defaultHTML = logoContainer.innerHTML;
    const lottieHTML = `
        <dotlottie-player
            id="lottieLogo"
            src="https://lottie.host/1ecc6b7b-5a9e-45fb-ac0e-22c42783669b/eIDivJz09E.lottie"
            background="transparent"
            speed="1"
            style="width:120px;height:60px;"
            loop
            autoplay>
        </dotlottie-player>
    `;
    let isLottieVisible = false;

    function onScroll() {
        if (window.scrollY > 400) {
            if (!isLottieVisible) {
                logoContainer.innerHTML = lottieHTML;
                isLottieVisible = true;
                setupLottieClick();
            }
        } else {
            if (isLottieVisible) {
                logoContainer.innerHTML = defaultHTML;
                isLottieVisible = false;
            }
        }
    }
    window.addEventListener("scroll", onScroll);
}

function setupLottieClick() {
    const lottieLogo = document.getElementById("lottieLogo");
    if (lottieLogo) {
        lottieLogo.addEventListener("click", function () {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }
}
