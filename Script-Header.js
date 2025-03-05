
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
    // 1) Détection ou redirection langue (si on est sur "/")
    detectBrowserLanguage();

    // 2) Initialise le sélecteur de langue
    initializeLanguageSelector();

    // 3) Initialise le sélecteur de devise (pas de localStorage)
    await initializeCurrencySelector();

    // 4) Mise à jour du menu (login/logout)
    updateMenu();

    // 5) Surligne le lien actif
    highlightActiveLink();

    // 6) Logo Lottie (scroll + clic)
    setupLogoToggle();
    setupLottieClick();

    // 7) Menu profil (clic extérieur pour fermer)
    setupProfileMenu();
});

/* ===================================================
   A) GESTION DES DEVISES (SANS localStorage)
   =================================================== */

/**
 * Récupère les taux de change depuis l'API
 */
async function fetchExchangeRates() {
    try {
        let response = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
        let data = await response.json();
        return data.rates;
    } catch (err) {
        console.error("Erreur lors de la récupération des taux de change", err);
        // Valeurs fallback si l'API est indisponible :
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

/**
 * Initialise le <select id="currencySelector">
 * - On force la devise selon la langue
 * - On convertit immédiatement les [data-price]
 * - On écoute "change" pour permettre de changer la devise dynamiquement (non persistant)
 */
async function initializeCurrencySelector() {
    let rates = await fetchExchangeRates();

    // Symboles
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

    // 1) Détermine la langue courante
    let currentLang = getCurrentLang();
    // 2) Devise par défaut pour cette langue
    let forcedCurrency = languageToCurrency[currentLang] || "USD";

    // 3) On assigne la devise forcée
    currencySelector.value = forcedCurrency;

    // 4) Convertit tout de suite les [data-price]
    convertAllPrices(forcedCurrency, rates, currencySymbols);

    // 5) Si l'utilisateur change la devise, on reconvertit
    currencySelector.addEventListener("change", function () {
        let selected = this.value;
        convertAllPrices(selected, rates, currencySymbols);
    });
}

/**
 * Convertit tous les [data-price] (en USD) vers selectedCurrency.
 * Ajoute un séparateur de milliers par Regex.
 */
function convertAllPrices(selectedCurrency, rates, currencySymbols) {
    let symbol = currencySymbols[selectedCurrency] || selectedCurrency;
    let rate = rates[selectedCurrency] || 1;

    document.querySelectorAll("[data-price]").forEach((item) => {
        let basePrice = parseFloat(item.getAttribute("data-price"));
        let converted = Math.round(basePrice * rate);

        let splitted = converted
          .toString()
          .replace(/\B(?=(\d{3})+(?!\d))/g, ",");

        console.log("[DEBUG] base=", basePrice, " => splitted=", splitted);

        item.textContent = `${splitted} ${symbol}`;
    });
}

/* ===================================================
   B) GESTION DE LA LANGUE
   =================================================== */

/**
 * Regarde si l'URL contient déjà une langue supportée.
 * Si NON, on est sur "/", on redirige vers la langue du navigateur (ou "en").
 */
function detectBrowserLanguage() {
    let pathParts = window.location.pathname.split("/");
    let currentLang = pathParts[1];

    let supportedLangs = [
        "fr", "ja", "ko", "es", "th", 
        "pt", "de", "nl", "pl", "it", 
        "ar", "vi", "zh-cn", "zh-tw"
    ];
    let browserLang = navigator.language.slice(0, 2).toLowerCase();

    let isLangURL = supportedLangs.includes(currentLang);

    // Si pas de langue dans l'URL -> on est sur "/"
    if (!isLangURL) {
        let defaultLang = (supportedLangs.includes(browserLang)) ? browserLang : "en";
        if (defaultLang !== "en") {
            let newPath = `/${defaultLang}${window.location.pathname}`;
            window.location.href = newPath;
        }
    }
}

/**
 * Initialise le sélecteur de langue (#languageSelector)
 */
function initializeLanguageSelector() {
    let pathParts = window.location.pathname.split("/");
    let currentLang = pathParts[1];

    let supportedLangs = [
        "fr", "ja", "ko", "es", "th", 
        "pt", "de", "nl", "pl", "it", 
        "ar", "vi", "zh-cn", "zh-tw"
    ];

    let languageSelector = document.getElementById("languageSelector");
    if (!languageSelector) return;

    let activeLang = supportedLangs.includes(currentLang) ? currentLang : "en";
    languageSelector.value = activeLang;

    // Au changement, on reconstruit l'URL
    languageSelector.addEventListener("change", function () {
        let selectedLang = this.value;
        let trimmedPath = window.location.pathname.replace(
            /^\/(fr|ja|ko|es|th|pt|de|nl|pl|it|ar|vi|zh\-cn|zh\-tw)/,
            ""
        ) || "/";
        let newPath = (selectedLang === "en")
            ? trimmedPath
            : `/${selectedLang}${trimmedPath}`;
        window.location.href = newPath;
    });
}

/** Renvoie la langue courante de l’URL ou "en" */
function getCurrentLang() {
    let pathParts = window.location.pathname.split("/");
    let currentLang = pathParts[1];
    let supportedLangs = [
        "fr", "ja", "ko", "es", "th", 
        "pt", "de", "nl", "pl", "it", 
        "ar", "vi", "zh-cn", "zh-tw"
    ];
    return supportedLangs.includes(currentLang) ? currentLang : "en";
}

/* ===================================================
   C) GESTION DU PANIER
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

/* ===================================================
   E) MISE À JOUR DU MENU (login/logout)
   =================================================== */
function updateMenu() {
    let isLoggedIn = (localStorage.getItem("userToken") !== null);

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

function logoutUser() {
    localStorage.removeItem("userToken");
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
    links.forEach((link) => {
        if (link.href === window.location.href) {
            link.classList.add("active-tab");
        } else {
            link.classList.remove("active-tab");
        }
    });
}

/* ===================================================
   H) LOGO LOTTIE (SCROLL)
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
