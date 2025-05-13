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

// 🔹 Exécuter immédiatement avant même que le DOM soit chargé
forceMenuDisplay();

document.addEventListener("DOMContentLoaded", function () {
    // Vérification secondaire après chargement du DOM pour éviter les erreurs
    updateMenu();
    setupProfileMenu();
    initializeLanguageSelector();
    highlightActiveLink();
    setupLogoToggle();
    initializeCurrencySelector().catch(console.error);
});

/** 🔥 Fonction qui force immédiatement l'affichage du bon menu sans attendre */
function forceMenuDisplay() {
    let isLoggedIn = (localStorage.getItem("jwtToken") !== null);

    // On applique directement les styles via JS pour éviter le repaint après chargement du DOM
    let css = isLoggedIn
        ? "#loggedOutMenu { display: none !important; } #loggedInMenu { display: block !important; }"
        : "#loggedOutMenu { display: block !important; } #loggedInMenu { display: none !important; }";

    let styleTag = document.createElement("style");
    styleTag.innerHTML = css;
    document.head.appendChild(styleTag);
}



/* ===================================================
   A) GESTION DES DEVISES (AVEC MISE EN CACHE)
   =================================================== */
async function fetchExchangeRates() {
    let cachedRates = sessionStorage.getItem("exchangeRates");
    if (cachedRates) {
        return JSON.parse(cachedRates);
    }

    try {
        let response = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
        let data = await response.json();
        sessionStorage.setItem("exchangeRates", JSON.stringify(data.rates)); // Mise en cache
        return data.rates;
    } catch (err) {
        console.error("Erreur lors de la récupération des taux de change", err);
        return {
            USD: 1,
            EUR: 0.91,
            GBP: 0.76,
            JPY: 135,
            KRW: 1300,
            TWD: 30,
            SGD: 1.35,
            THB: 33,
            AUD: 1.45,
            HKD: 7.85,
            CAD: 1.36,
            NZD: 1.57,
            CNY: 6.90
        };
    }
}

async function initializeCurrencySelector() {
    let rates = await fetchExchangeRates();

    let currencySymbols = {
        USD: "$",
        EUR: "€",
        GBP: "£",
        JPY: "¥",
        KRW: "₩",
        TWD: "NT$",
        SGD: "S$",
        THB: "฿",
        AUD: "A$",
        HKD: "HK$",
        CAD: "C$",
        NZD: "NZ$",
        CNY: "¥"
    };

    let currencySelector = document.getElementById("currencySelector");
    if (!currencySelector) return;

    // Devise forcée par la langue
    let currentLang = getCurrentLang();
    let forcedCurrency = languageToCurrency[currentLang] || "USD";
    currencySelector.value = forcedCurrency;

    // Conversion initiale
    convertAllPrices(forcedCurrency, rates, currencySymbols);

    // Conversion au changement
    currencySelector.addEventListener("change", function () {
        convertAllPrices(this.value, rates, currencySymbols);
    });
}

function convertAllPrices(selectedCurrency, rates, currencySymbols) {
    let symbol = currencySymbols[selectedCurrency] || selectedCurrency;
    let rate = rates[selectedCurrency] || 1;

    document.querySelectorAll("[data-price]").forEach((item) => {
        let basePrice = parseFloat(item.getAttribute("data-price")) || 0;
        let converted = basePrice * rate;
        let rounded = Math.round(converted);

        let formatted = rounded.toLocaleString("en-US", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        });

        item.textContent = `${formatted} ${symbol}`;
    });
}

/* ===================================================
   B) GESTION DE LA LANGUE
   =================================================== */

/**
 * Initialise le sélecteur de langue (#languageSelector).
 */
function initializeLanguageSelector() {
    let supportedLangs = [
        "fr", "ja", "ko", "es", "th", 
        "pt", "de", "nl", "pl", "it", 
        "ar", "vi", "zh-cn", "zh-tw"
    ];

    let languageSelector = document.getElementById("languageSelector");
    if (!languageSelector) return;

    // Langue actuelle depuis l'URL
    let pathParts = window.location.pathname.split("/");
    let currentLang = pathParts[1]; 
    let activeLang = supportedLangs.includes(currentLang) ? currentLang : "en";
    languageSelector.value = activeLang;

    languageSelector.addEventListener("change", function () {
        let selectedLang = this.value;

        // Retire l'ancienne langue si présente
        let trimmedPath = window.location.pathname.replace(
            /^\/(fr|ja|ko|es|th|pt|de|nl|pl|it|ar|vi|zh\-cn|zh\-tw)/,
            ""
        ) || "/";

        // Construit la nouvelle URL
        let newPath = (selectedLang === "en")
            ? trimmedPath // => on reste sur "/" ou "/xxxx" sans préfixe
            : `/${selectedLang}${trimmedPath}`;

        // Redirige
        window.location.href = newPath;
    });
}

/** Renvoie la langue courante de l’URL ou "en" */
function getCurrentLang() {
    let supportedLangs = [
        "fr", "ja", "ko", "es", "th", 
        "pt", "de", "nl", "pl", "it", 
        "ar", "vi", "zh-cn", "zh-tw"
    ];
    let pathParts = window.location.pathname.split("/");
    let currentLang = pathParts[1];
    return supportedLangs.includes(currentLang) ? currentLang : "en";
}
/* ===================================================
   C) GESTION DU PANIER
   =================================================== */
function handleCartClick() {
    let isLoggedIn = (localStorage.getItem("jwtToken") !== null);
    if (isLoggedIn) {
        window.location.href = "/cart";
    } else {
        showModal("cartModal");
    }
}

/* ===================================================
   D) GESTION DES MODALES
   =================================================== */
function showModal(modalId) {
    let modal = document.getElementById(modalId);
    if (!modal) return;

    modal.style.display = "flex";
    modal.addEventListener("click", function (e) {
        if (e.target === modal) {
            closeModal(modalId);
        }
    });
}

function closeModal(modalId) {
    let modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = "none";
    }
}

/** 🔄 Fonction mise à jour du menu après `DOMContentLoaded` */
function updateMenu() {
    let isLoggedIn = (localStorage.getItem("jwtToken") !== null);
    console.log("État connecté:", isLoggedIn); // Vérification console

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
            cartLink.setAttribute("onclick", "event.preventDefault(); showModal('cartModal');");
        }
    }

    let userIcon = document.getElementById("profileIcon");
    if (userIcon) {
        userIcon.classList.remove("fa-user", "fa-user-check");
        userIcon.classList.add(isLoggedIn ? "fa-user-check" : "fa-user");
    }
}

/** 🚪 Fonction de déconnexion */
function logoutUser() {
    ["jwtToken", "userToken"].forEach(token => {
        localStorage.removeItem(token);
        sessionStorage.removeItem(token);
    });

    updateMenu();
    window.location.reload();
}


/* ===================================================
   F) PROFIL (menu déroulant)
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
   G) SURLIGNER LE LIEN ACTIF
   =================================================== */
function highlightActiveLink() {
    let links = document.querySelectorAll(".nav-links a");
    let currentPath = window.location.pathname;

    // 📌 Groupement des pages sous une seule clé
    let pageMappings = {
        "/all-the-brands": "brands",
        "/american-brands": "brands",
        "/european-brands": "brands",
        "/african-brands": "brands",
        "/middle-eastern-brands": "brands",
        "/south-asian-brands": "brands",
        "/east-asian-brands": "brands",
        "/oceanian-brands": "brands",
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
        "/marketplace-men": "market",

        "/collections": "collections",
        "/agenda": "agenda",
        "/consignement": "consignement"
    };

    // ✅ Cas spécial pour la homepage : aucun lien actif
    if (currentPath === "/") {
        links.forEach((link) => {
            link.classList.remove("active-tab");
        });
        console.log("🏠 Page d’accueil : aucun lien actif.");
        return;
    }

    // ✅ Déterminer la catégorie active
    let activeCategory = Object.keys(pageMappings).find(key => currentPath.startsWith(key))
        ? pageMappings[
              currentPath.startsWith("/brand-details") ? "/brand-details" :
              currentPath.startsWith("/shop-details") ? "/shop-details" :
              currentPath
          ]
        : pageMappings[currentPath];

    links.forEach((link) => {
        let linkHref = new URL(link.href, window.location.origin).pathname;

        if (activeCategory && pageMappings[linkHref] === activeCategory) {
            link.classList.add("active-tab");
            console.log("✅ Lien actif détecté :", linkHref);
        } else {
            link.classList.remove("active-tab");
        }
    });

    console.log("🌍 URL actuelle:", currentPath);
    console.log("📌 Catégorie active détectée:", activeCategory);
}

// Exécute après chargement complet
document.addEventListener("DOMContentLoaded", function () {
    setTimeout(highlightActiveLink, 100);
});

/* ===================================================
   H) LOGO LOTTIE (SCROLL + CLIQUE = SMOOTH SCROLL)
   =================================================== */
function setupLogoToggle() {
    const logoContainer = document.querySelector(".logo-container");
    if (!logoContainer) return;

    const defaultHTML = logoContainer.innerHTML;
    const lottieHTML = `
        <dotlottie-player
            id="lottieLogo"
            src="https://lottie.host/2d5caa0a-5b45-4859-a709-aead7a62c2d8/HhS1fhZGQy.lottie"
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
                setupLottieClick(); // Scroll top au clic
            }
        } else {
            if (isLottieVisible) {
                logoContainer.innerHTML = defaultHTML;
                isLottieVisible = false;
                // Pour ajouter un clic "scroll top" sur le logo statique, vous pouvez faire :
                // document.querySelector(".logo-container img")?.addEventListener("click", () => {
                //     window.scrollTo({ top: 0, behavior: "smooth" });
                // });
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
