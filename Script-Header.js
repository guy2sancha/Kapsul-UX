/* ===================================================
   MAPPING LANGUE -> DEVISE
   =================================================== */
let languageToCurrency = {
    fr: "EUR", ja: "JPY", ko: "KRW", es: "EUR", th: "THB",
    pt: "EUR", de: "EUR", nl: "EUR", pl: "EUR", it: "EUR",
    ar: "USD", vi: "USD", "zh-cn": "CNY", "zh-tw": "TWD"
};

document.addEventListener("DOMContentLoaded", async function () {
    initializeLanguageSelector();
    await initializeCurrencySelector();
    updateMenu();
    highlightActiveLink();
    setupLogoToggle();
    setupProfileMenu();
});

/* ===================================================
   A) GESTION DES DEVISES (AVEC MISE EN CACHE)
   =================================================== */
async function fetchExchangeRates() {
    let cachedRates = sessionStorage.getItem("exchangeRates");
    if (cachedRates) return JSON.parse(cachedRates);

    try {
        let response = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
        let data = await response.json();
        sessionStorage.setItem("exchangeRates", JSON.stringify(data.rates));
        return data.rates;
    } catch (err) {
        console.error("Erreur lors de la récupération des taux de change", err);
        return { USD: 1, EUR: 0.91, GBP: 0.76, JPY: 135, KRW: 1300, CNY: 6.90 };
    }
}

async function initializeCurrencySelector() {
    let rates = await fetchExchangeRates();
    let currencySymbols = { USD: "$", EUR: "€", GBP: "£", JPY: "¥", KRW: "₩", CNY: "¥" };

    let currencySelector = document.getElementById("currencySelector");
    if (!currencySelector) return;

    let savedCurrency = localStorage.getItem("selectedCurrency");
    let forcedCurrency = languageToCurrency[getCurrentLang()] || "USD";
    let initialCurrency = savedCurrency || forcedCurrency;

    currencySelector.value = initialCurrency;
    convertAllPrices(initialCurrency, rates, currencySymbols);

    currencySelector.addEventListener("change", function () {
        localStorage.setItem("selectedCurrency", this.value);
        convertAllPrices(this.value, rates, currencySymbols);
    });
}

function convertAllPrices(selectedCurrency, rates, currencySymbols) {
    let symbol = currencySymbols[selectedCurrency] || selectedCurrency;
    let rate = rates[selectedCurrency] || 1;

    document.querySelectorAll("[data-price]").forEach((item) => {
        let basePrice = parseFloat(item.getAttribute("data-price")) || 0;
        let formatted = (basePrice * rate).toLocaleString("en-US", {
            minimumFractionDigits: 0, maximumFractionDigits: 2
        });
        item.textContent = `${formatted} ${symbol}`;
    });
}

/* ===================================================
   B) GESTION DE LA LANGUE (SANS RECHARGER LA PAGE)
   =================================================== */
function initializeLanguageSelector() {
    let supportedLangs = ["fr", "ja", "ko", "es", "th", "pt", "de", "nl", "pl", "it", "ar", "vi", "zh-cn", "zh-tw"];
    let languageSelector = document.getElementById("languageSelector");
    if (!languageSelector) return;

    let pathParts = window.location.pathname.split("/");
    let activeLang = supportedLangs.includes(pathParts[1]) ? pathParts[1] : "en";
    languageSelector.value = activeLang;

    languageSelector.addEventListener("change", function () {
        let selectedLang = this.value;
        let trimmedPath = window.location.pathname.replace(/^\/(fr|ja|ko|es|th|pt|de|nl|pl|it|ar|vi|zh-cn|zh-tw)/, "") || "/";
        let newPath = selectedLang === "en" ? trimmedPath : `/${selectedLang}${trimmedPath}`;
        history.pushState(null, "", newPath);
        location.reload(); // Recharge uniquement après changement de langue
    });
}

function getCurrentLang() {
    let supportedLangs = ["fr", "ja", "ko", "es", "th", "pt", "de", "nl", "pl", "it", "ar", "vi", "zh-cn", "zh-tw"];
    let currentLang = window.location.pathname.split("/")[1];
    return supportedLangs.includes(currentLang) ? currentLang : "en";
}

/* ===================================================
   C) GESTION DU PANIER
   =================================================== */
function handleCartClick() {
    isUserLoggedIn() ? window.location.href = "/cart" : showModal("cartModal");
}

/* ===================================================
   D) GESTION DES MODALES
   =================================================== */
function showModal(modalId) {
    let modal = document.getElementById(modalId);
    if (!modal) return;
    modal.style.display = "flex";
    modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(modalId); });
}

function closeModal(modalId) {
    let modal = document.getElementById(modalId);
    if (modal) modal.style.display = "none";
}

/* ===================================================
   E) OPTIMISATION DU MENU (NE PAS RECHARGER)
   =================================================== */
function isUserLoggedIn() {
    let token = localStorage.getItem("jwtToken");
    return token !== null;
}

function updateMenu() {
    let isLoggedIn = isUserLoggedIn();
    document.getElementById("loggedOutMenu")?.style.display = isLoggedIn ? "none" : "block";
    document.getElementById("loggedInMenu")?.style.display = isLoggedIn ? "block" : "none";
    
    let cartLink = document.querySelector(".cart-container a");
    if (cartLink) {
        cartLink.href = isLoggedIn ? "/cart" : "#";
        if (!isLoggedIn) cartLink.setAttribute("onclick", "showModal('cartModal')");
    }

    let userIcon = document.getElementById("profileIcon");
    if (userIcon) {
        userIcon.classList.toggle("fa-user-check", isLoggedIn);
        userIcon.classList.toggle("fa-user", !isLoggedIn);
    }
}

function logoutUser() {
    localStorage.removeItem("jwtToken");
    location.reload();
}

/* ===================================================
   F) PROFIL (menu déroulant)
   =================================================== */
function setupProfileMenu() {
    let profileMenu = document.getElementById("profileMenu");
    if (!profileMenu) return;
    document.addEventListener("click", (event) => {
        if (!profileMenu.contains(event.target)) profileMenu.classList.remove("show");
    });
}

/* ===================================================
   G) SURLIGNER LE LIEN ACTIF
   =================================================== */
function highlightActiveLink() {
    let links = document.querySelectorAll(".nav-links a");
    let currentPath = window.location.pathname;
    links.forEach((link) => {
        let linkHref = new URL(link.href, window.location.origin).pathname;
        link.classList.toggle("active-tab", linkHref === currentPath);
    });
}

/* ===================================================
   H) LOGO LOTTIE (SCROLL + CLIQUE = SMOOTH SCROLL)
   =================================================== */
function setupLogoToggle() {
    const logoContainer = document.querySelector(".logo-container");
    if (!logoContainer) return;

    let isLottieVisible = false;
    window.addEventListener("scroll", () => {
        let shouldShow = window.scrollY > 400;
        if (shouldShow !== isLottieVisible) {
            logoContainer.classList.toggle("lottie-visible", shouldShow);
            isLottieVisible = shouldShow;
        }
    });
}
