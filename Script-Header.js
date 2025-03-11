/* ===================================================
   🔹 MAPPING LANGUE -> DEVISE
   =================================================== */
let languageToCurrency = {
    fr: "EUR", ja: "JPY", ko: "KRW", es: "EUR",
    th: "THB", pt: "EUR", de: "EUR", nl: "EUR",
    pl: "EUR", it: "EUR", ar: "USD", vi: "USD",
    "zh-cn": "CNY", "zh-tw": "TWD"
};

// 🔹 Forcer l'affichage du bon menu immédiatement
if (document.readyState !== "loading") {
    forceMenuDisplay();
} else {
    document.addEventListener("DOMContentLoaded", forceMenuDisplay);
}

document.addEventListener("DOMContentLoaded", function () {
    updateMenu();
    setupProfileMenu();
    initializeLanguageSelector();
    highlightActiveLink();
    setupLogoToggle();
    initializeCurrencySelector().catch(console.error);
});

/* ===================================================
   🔹 GESTION DU MENU UTILISATEUR
   =================================================== */
function forceMenuDisplay() {
    let isLoggedIn = localStorage.getItem("jwtToken") !== null;
    let css = isLoggedIn
        ? "#loggedOutMenu { display: none !important; } #loggedInMenu { display: block !important; }"
        : "#loggedOutMenu { display: block !important; } #loggedInMenu { display: none !important; }";
    let styleTag = document.createElement("style");
    styleTag.innerHTML = css;
    document.head.appendChild(styleTag);
}

function updateMenu() {
    let isLoggedIn = localStorage.getItem("jwtToken") !== null;
    document.getElementById("loggedOutMenu")?.style.setProperty("display", isLoggedIn ? "none" : "block", "important");
    document.getElementById("loggedInMenu")?.style.setProperty("display", isLoggedIn ? "block" : "none", "important");

    let cartLink = document.querySelector(".cart-container a");
    if (cartLink) {
        cartLink.href = isLoggedIn ? "/cart" : "#";
        if (!isLoggedIn) cartLink.setAttribute("onclick", "event.preventDefault(); showModal('cartModal');");
    }

    let userIcon = document.getElementById("profileIcon");
    if (userIcon) {
        userIcon.classList.remove("fa-user", "fa-user-check");
        userIcon.classList.add(isLoggedIn ? "fa-user-check" : "fa-user");
    }
}

/* ===================================================
   🔹 GESTION DE LA DÉCONNEXION UTILISATEUR
   =================================================== */
function logoutUser() {
    ["jwtToken", "userToken"].forEach(token => {
        localStorage.removeItem(token);
        sessionStorage.removeItem(token);
    });

    updateMenu();
    window.location.href = "/sign-in"; // Redirection après déconnexion
}

/* ===================================================
   🔹 GESTION DES DEVISES (AVEC MISE EN CACHE)
   =================================================== */
async function fetchExchangeRates() {
    let cachedRates = sessionStorage.getItem("exchangeRates");
    if (cachedRates) return JSON.parse(cachedRates);

    try {
        let response = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
        if (!response.ok) throw new Error("Impossible de récupérer les taux.");
        let data = await response.json();
        sessionStorage.setItem("exchangeRates", JSON.stringify(data.rates)); // Mise en cache
        return data.rates;
    } catch (err) {
        console.error("⚠️ Erreur taux de change:", err);
        return { USD: 1, EUR: 0.91, GBP: 0.76, JPY: 135, KRW: 1300 };
    }
}

async function initializeCurrencySelector() {
    let rates = await fetchExchangeRates();
    let currencySymbols = { USD: "$", EUR: "€", GBP: "£", JPY: "¥", KRW: "₩", CNY: "¥" };
    let currencySelector = document.getElementById("currencySelector");
    if (!currencySelector) return;

    let forcedCurrency = languageToCurrency[getCurrentLang()] || "USD";
    currencySelector.value = forcedCurrency;
    convertAllPrices(forcedCurrency, rates, currencySymbols);

    currencySelector.addEventListener("change", function () {
        convertAllPrices(this.value, rates, currencySymbols);
    });
}

function convertAllPrices(selectedCurrency, rates, currencySymbols) {
    let symbol = currencySymbols[selectedCurrency] || selectedCurrency;
    let rate = rates[selectedCurrency] || 1;
    document.querySelectorAll("[data-price]").forEach(item => {
        let basePrice = parseFloat(item.getAttribute("data-price")) || 0;
        let formatted = (basePrice * rate).toFixed(2);
        item.textContent = `${formatted} ${symbol}`;
    });
}

/* ===================================================
   🔹 GESTION DU SÉLECTEUR DE LANGUE
   =================================================== */
function initializeLanguageSelector() {
    let languageSelector = document.getElementById("languageSelector");
    if (!languageSelector) return;

    let activeLang = getCurrentLang();
    languageSelector.value = activeLang;
    languageSelector.addEventListener("change", function () {
        let selectedLang = this.value;
        let newPath = selectedLang === "en" ? "/" : `/${selectedLang}`;
        window.location.href = newPath;
    });
}

function getCurrentLang() {
    let supportedLangs = ["fr", "ja", "ko", "es", "th", "pt", "de", "nl", "pl", "it", "ar", "vi", "zh-cn", "zh-tw"];
    let pathParts = window.location.pathname.split("/");
    return supportedLangs.includes(pathParts[1]) ? pathParts[1] : "en";
}

/* ===================================================
   🔹 SURLIGNER LE LIEN ACTIF
   =================================================== */
function highlightActiveLink() {
    let links = document.querySelectorAll(".nav-links a");
    let currentPath = window.location.pathname;
    let pageMappings = {
        "/all-the-brands": "brands", "/shop-details": "shops", "/map": "map",
        "/marketplace": "market", "/store-locator": "map"
    };

    let activeCategory = Object.keys(pageMappings).find(key => currentPath.startsWith(key)) ? pageMappings[currentPath] : null;
    links.forEach(link => link.classList.toggle("active-tab", pageMappings[new URL(link.href).pathname] === activeCategory));
}

/* ===================================================
   🔹 LOGO LOTTIE (ANIMATION AU SCROLL)
   =================================================== */
function setupLogoToggle() {
    const logoContainer = document.querySelector(".logo-container");
    if (!logoContainer) return;

    const lottieHTML = `
        <dotlottie-player id="lottieLogo" src="https://lottie.host/1ecc6b7b-5a9e-45fb-ac0e-22c42783669b/eIDivJz09E.lottie"
            background="transparent" speed="1" style="width:120px;height:60px;" loop autoplay>
        </dotlottie-player>`;

    let isLottieVisible = false;
    window.addEventListener("scroll", function () {
        if (window.scrollY > 400 && !isLottieVisible) {
            logoContainer.innerHTML = lottieHTML;
            isLottieVisible = true;
        } else if (window.scrollY <= 400 && isLottieVisible) {
            logoContainer.innerHTML = "";
            isLottieVisible = false;
        }
    });
}
