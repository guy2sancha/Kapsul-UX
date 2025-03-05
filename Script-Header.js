
/**
 * Objet associant chaque langue à une devise par défaut.
 * Ajuste comme tu veux (ex: "zh-cn": "CNY" si l'API gère CNY, etc.).
 */
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
    ar: "USD",   // ou autre
    vi: "USD",
    "zh-cn": "CNY",
    "zh-tw": "TWD"
};

document.addEventListener("DOMContentLoaded", async function () {
    // 1) Détecte automatiquement la langue (URL / browser / localStorage)
    detectBrowserLanguage();

    // 2) Initialise le sélecteur de langue
    initializeLanguageSelector();

    // 3) Initialise les devises (récupère les taux + setSelect + conversion)
    await initializeCurrencySelector(); 

    // 4) Met à jour l’interface utilisateur (menu log in/out, etc.)
    updateMenu();

    // 5) Surligne le lien actif
    highlightActiveLink();

    // 6) Logo Lottie : animation + scroll top
    setupLogoToggle();
    setupLottieClick();

    // 7) Menu profil (fermeture au clic extérieur)
    setupProfileMenu();
});

/* ===================================================
   1) GESTION DES DEVISES
   =================================================== */
async function fetchExchangeRates() {
    try {
        let response = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
        let data = await response.json();
        return data.rates;
    } catch (err) {
        console.error("Erreur lors de la récupération des taux de change", err);
        // Taux par défaut si l'API échoue
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

    // 1) On accroche l'event "change"
    currencySelector.addEventListener("change", function () {
        let selected = this.value;
        localStorage.setItem("userPreferredCurrency", selected);
        convertAllPrices(selected, rates, currencySymbols);
    });

    // 2) On regarde si l’utilisateur a déjà choisi une devise
    let storedCurrency = localStorage.getItem("userPreferredCurrency");

    // 3) On détermine la devise forcée par la langue (s’il n’y a pas de préférence user)
    let currentLang = getCurrentLang();
    let forcedCurrency = languageToCurrency[currentLang] || "USD";
    // => finalCurrency = la devise du user si existante, sinon forcedCurrency
    let finalCurrency = storedCurrency || forcedCurrency;

    // 4) On set la value du <select>
    currencySelector.value = finalCurrency;

    // 5) On déclenche manuellement le "change" pour recalculer immédiatement
    currencySelector.dispatchEvent(new Event("change"));
}

/** 
 * Convertit tous les [data-price] (en USD) vers la devise "selectedCurrency".
 */
function convertAllPrices(selectedCurrency, rates, currencySymbols) {
    let symbol = currencySymbols[selectedCurrency] || selectedCurrency;
    let rate = rates[selectedCurrency] || 1;

    document.querySelectorAll("[data-price]").forEach((item) => {
        let basePrice = parseFloat(item.getAttribute("data-price")); // base USD
        let converted = Math.round(basePrice * rate);
        item.textContent = `${converted} ${symbol}`;
    });
}

/* ===================================================
   2) GESTION DE LA LANGUE
   =================================================== */
function detectBrowserLanguage() {
    let pathParts = window.location.pathname.split("/");
    let currentLang = pathParts[1];

    let supportedLangs = [
        "fr", "ja", "ko", "es", "th", "pt", "de", 
        "nl", "pl", "it", "ar", "vi", "zh-cn", "zh-tw"
    ];

    let browserLang = navigator.language.slice(0, 2).toLowerCase();
    let storedLang = localStorage.getItem("userPreferredLanguage");

    if (!storedLang) {
        let defaultLang = supportedLangs.includes(browserLang) ? browserLang : "en";
        localStorage.setItem("userPreferredLanguage", defaultLang);

        if (!supportedLangs.includes(currentLang)) {
            let newPath = (defaultLang === "en") 
              ? "/" 
              : `/${defaultLang}${window.location.pathname}`;
            window.location.href = newPath;
        }
    }
}

/**
 * Initialise le sélecteur de langue + applique la devise correspondante
 */
function initializeLanguageSelector() {
    let pathParts = window.location.pathname.split("/");
    let currentLang = pathParts[1];

    let supportedLangs = [
        "fr", "ja", "ko", "es", "th", "pt", "de", 
        "nl", "pl", "it", "ar", "vi", "zh-cn", "zh-tw"
    ];

    let languageSelector = document.getElementById("languageSelector");
    if (!languageSelector) return;

    let activeLang = supportedLangs.includes(currentLang) ? currentLang : "en";
    languageSelector.value = activeLang;

    // Quand on change de langue
    languageSelector.addEventListener("change", function () {
        let selectedLang = this.value;
        // on enlève les éventuels /fr /ja etc.
        let trimmedPath = window.location.pathname.replace(
            /^\/(fr|ja|ko|es|th|pt|de|nl|pl|it|ar|vi|zh\-cn|zh\-tw)/, 
            ""
        ) || "/";
        let newPath = (selectedLang === "en") 
          ? trimmedPath 
          : `/${selectedLang}${trimmedPath}`;

        localStorage.setItem("userPreferredLanguage", selectedLang);

        // On redirige => la logique de devise se fera au rechargement
        window.location.href = newPath;
    });
}

/**
 * Raccourci pour connaître la langue courante depuis l’URL.
 */
function getCurrentLang() {
    let pathParts = window.location.pathname.split("/");
    let currentLang = pathParts[1];
    let supportedLangs = [
        "fr", "ja", "ko", "es", "th", "pt", "de", 
        "nl", "pl", "it", "ar", "vi", "zh-cn", "zh-tw"
    ];
    return supportedLangs.includes(currentLang) ? currentLang : "en";
}

/* ===================================================
   3) GESTION DU PANIER
   =================================================== */
function handleCartClick() {
    let isLoggedIn = (localStorage.getItem("userToken") !== null);
    if (isLoggedIn) {
        window.location.href = "/cart";
    } else {
        showModal("cartModal");
    }
}

/* ===================================================
   4) GESTION DES MODALES
   =================================================== */
function showModal(modalId) {
    let modal = document.getElementById(modalId);
    if (!modal) return;

    modal.style.display = "flex";

    // Fermer la modal si on clique hors du contenu
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

/* ===================================================
   5) MISE À JOUR DU MENU (LOGIN / LOGOUT)
   =================================================== */
function updateMenu() {
    let isLoggedIn = (localStorage.getItem("userToken") !== null);

    // loggedOutMenu / loggedInMenu
    let loggedOutMenu = document.getElementById("loggedOutMenu");
    let loggedInMenu = document.getElementById("loggedInMenu");
    if (loggedOutMenu && loggedInMenu) {
        loggedOutMenu.style.display = isLoggedIn ? "none" : "block";
        loggedInMenu.style.display = isLoggedIn ? "block" : "none";
    }

    // Ex. si le panier est un lien direct
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

    // Changer l'icône user si tu as #profileIcon
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

function logoutUser() {
    localStorage.removeItem("userToken");
    updateMenu();
    window.location.reload();
}

/* ===================================================
   6) PROFIL (menu déroulant)
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
   7) SURLIGNER LE LIEN ACTIF
   =================================================== */
function highlightActiveLink() {
    let links = document.querySelectorAll(".nav-links a");
    links.forEach((link) => {
        if (link.href === window.location.href) {
            link.classList.add("active-tab");
        } else {
            link.classList.remove("active-tab");
        }
    });
}

/* ===================================================
   8) GESTION DU LOGO (LOTTIE AU SCROLL)
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
