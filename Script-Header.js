
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
    detectBrowserLanguage();
    initializeLanguageSelector();
    await initializeCurrencySelector();
    updateMenu();
    highlightActiveLink();
    setupLogoToggle();
    setupLottieClick();
    setupProfileMenu();
});

/* ========================
   GESTION DES DEVISES
   (sans localStorage)
   ======================== */
async function fetchExchangeRates() {
    try {
        let response = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
        let data = await response.json();
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

    // 1) Devise par défaut selon la langue
    let currentLang = getCurrentLang();
    let forcedCurrency = languageToCurrency[currentLang] || "USD";

    // 2) On affecte cette valeur au <select>
    currencySelector.value = forcedCurrency;

    // 3) On fait la conversion
    convertAllPrices(forcedCurrency, rates, currencySymbols);

    // 4) Si l'utilisateur change de devise, on reconvertit
    currencySelector.addEventListener("change", function () {
        let selected = this.value;
        convertAllPrices(selected, rates, currencySymbols);
    });
}

function convertAllPrices(selectedCurrency, rates, currencySymbols) {
    let symbol = currencySymbols[selectedCurrency] || selectedCurrency;
    let rate = rates[selectedCurrency] || 1;

    document.querySelectorAll("[data-price]").forEach((item) => {
        let basePrice = parseFloat(item.getAttribute("data-price"));
        let converted = Math.round(basePrice * rate);

        // Ajout d'un séparateur de milliers
        let formattedNumber = new Intl.NumberFormat("en-US").format(converted);

        item.textContent = `${formattedNumber} ${symbol}`;
    });
}

/* ========================
   GESTION DE LA LANGUE
   ======================== */
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

    if (!isLangURL) {
        let defaultLang = (supportedLangs.includes(browserLang)) ? browserLang : "en";
        if (defaultLang !== "en") {
            let newPath = `/${defaultLang}${window.location.pathname}`;
            window.location.href = newPath;
        }
    }
}

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

/* ========================
   GESTION DU PANIER
   ======================== */
function handleCartClick() {
    let isLoggedIn = (localStorage.getItem("userToken") !== null);
    if (isLoggedIn) {
        window.location.href = "/cart";
    } else {
        showModal("cartModal");
    }
}

/* ========================
   GESTION DES MODALES
   ======================== */
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

/* ========================
   MISE À JOUR DU MENU
   ======================== */
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

/* ========================
   PROFIL (menu déroulant)
   ======================== */
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

/* ========================
   SURLIGNER LE LIEN ACTIF
   ======================== */
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

/* ========================
   LOGO LOTTIE (SCROLL)
   ======================== */
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
