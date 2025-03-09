/* ===================================================
   MAPPING LANGUE -> DEVISE
   =================================================== */
const languageToCurrency = {
    fr: "EUR", ja: "JPY", ko: "KRW", es: "EUR", th: "THB",
    pt: "EUR", de: "EUR", nl: "EUR", pl: "EUR", it: "EUR",
    ar: "USD", vi: "USD", "zh-cn": "CNY", "zh-tw": "TWD"
};

document.addEventListener("DOMContentLoaded", async () => {
    detectBrowserLanguage();
    initializeLanguageSelector();
    await initializeCurrencySelector();
    updateMenu();
    highlightActiveLink();
    setupLogoToggle();
    setupProfileMenu();
});

/* ===================================================
   A) GESTION DES DEVISES
   =================================================== */
async function fetchExchangeRates() {
    const cachedRates = sessionStorage.getItem("exchangeRates");
    if (cachedRates) return JSON.parse(cachedRates);

    try {
        const response = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
        const data = await response.json();
        sessionStorage.setItem("exchangeRates", JSON.stringify(data.rates));
        return data.rates;
    } catch (err) {
        console.error("Erreur lors de la récupération des taux de change", err);
        return { USD: 1, EUR: 0.91, GBP: 0.76, JPY: 135, KRW: 1300, TWD: 30, CNY: 6.90 };
    }
}

async function initializeCurrencySelector() {
    const rates = await fetchExchangeRates();
    const currencySelector = document.getElementById("currencySelector");
    if (!currencySelector) return;

    const currentLang = getCurrentLang();
    const forcedCurrency = languageToCurrency[currentLang] || "USD";
    currencySelector.value = forcedCurrency;

    convertAllPrices(forcedCurrency, rates);

    currencySelector.addEventListener("change", function () {
        convertAllPrices(this.value, rates);
    });
}

function convertAllPrices(selectedCurrency, rates) {
    const currencySymbols = { USD: "$", EUR: "€", GBP: "£", JPY: "¥", KRW: "₩", TWD: "NT$", CNY: "¥" };
    const symbol = currencySymbols[selectedCurrency] || selectedCurrency;
    const rate = rates[selectedCurrency] || 1;

    document.querySelectorAll("[data-price]").forEach(item => {
        const basePrice = parseFloat(item.dataset.price) || 0;
        item.textContent = `${(basePrice * rate).toFixed(2)} ${symbol}`;
    });
}

/* ===================================================
   B) GESTION DE LA LANGUE
   =================================================== */
function detectBrowserLanguage() {
    if (localStorage.getItem("preferredLang") || sessionStorage.getItem("alreadyRedirected")) return;

    if (window.location.pathname === "/") {
        const supportedLangs = Object.keys(languageToCurrency);
        const browserLang = navigator.language.slice(0, 2).toLowerCase();

        sessionStorage.setItem("alreadyRedirected", "true");
        if (supportedLangs.includes(browserLang)) {
            window.location.href = `/${browserLang}`;
        }
    }
}

function initializeLanguageSelector() {
    const supportedLangs = Object.keys(languageToCurrency);
    const languageSelector = document.getElementById("languageSelector");
    if (!languageSelector) return;

    const currentLang = getCurrentLang();
    languageSelector.value = currentLang;

    languageSelector.addEventListener("change", function () {
        localStorage.setItem("preferredLang", this.value);
        window.location.href = this.value === "en" ? "/" : `/${this.value}`;
    });
}

function getCurrentLang() {
    const lang = window.location.pathname.split("/")[1];
    return languageToCurrency[lang] ? lang : "en";
}

/* ===================================================
   C) GESTION DU MENU (LOGIN/LOGOUT)
   =================================================== */
function updateMenu() {
    const isLoggedIn = localStorage.getItem("userToken") !== null;
    document.getElementById("loggedOutMenu")?.classList.toggle("hidden", isLoggedIn);
    document.getElementById("loggedInMenu")?.classList.toggle("hidden", !isLoggedIn);
}

function logoutUser() {
    localStorage.removeItem("userToken");
    updateMenu();
    location.reload();
}

/* ===================================================
   D) PROFIL (MENU DÉROULANT)
   =================================================== */
function setupProfileMenu() {
    const profileMenu = document.getElementById("profileMenu");
    if (!profileMenu) return;

    document.addEventListener("click", event => {
        if (!profileMenu.contains(event.target)) {
            profileMenu.classList.remove("show");
        }
    });
}

/* ===================================================
   E) SURLIGNER LE LIEN ACTIF
   =================================================== */
function highlightActiveLink() {
    const currentUrl = window.location.pathname.toLowerCase();
    const highlightRules = [
        { keyword: "marketplace", text: "MARKET" },
        { keyword: "brands", text: "BRANDS" },
        { keyword: "retailers", text: "SHOPS" },
        { keyword: "map", text: "MAP" }
    ];

    document.querySelectorAll(".nav-links a").forEach(link => {
        const linkText = link.textContent.trim().toUpperCase();
        const linkHref = new URL(link.href, window.location.origin).pathname.toLowerCase();

        if (currentUrl === linkHref || currentUrl.startsWith(linkHref)) {
            link.classList.add("active-tab");
        } else {
            highlightRules.forEach(rule => {
                if (currentUrl.includes(rule.keyword) && linkText.includes(rule.text)) {
                    link.classList.add("active-tab");
                }
            });
        }
    });
}

/* ===================================================
   F) LOGO LOTTIE (SCROLL + CLIQUE = SMOOTH SCROLL)
   =================================================== */
function setupLogoToggle() {
    const logoContainer = document.querySelector(".logo-container");
    if (!logoContainer) return;

    const defaultHTML = logoContainer.innerHTML;
    const lottieHTML = `
        <dotlottie-player id="lottieLogo" src="https://lottie.host/.../eIDivJz09E.lottie"
            background="transparent" speed="1" style="width:120px;height:60px;" loop autoplay>
        </dotlottie-player>
    `;
    let isLottieVisible = false;
    let scrollTimeout;

    function onScroll() {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            if (window.scrollY > 400) {
                if (!isLottieVisible) {
                    logoContainer.innerHTML = lottieHTML;
                    isLottieVisible = true;
                    setupLottieClick();
                }
            } else if (isLottieVisible) {
                logoContainer.innerHTML = defaultHTML;
                isLottieVisible = false;
            }
        }, 100);
    }

    function setupLottieClick() {
        document.getElementById("lottieLogo")?.addEventListener("click", () => {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }

    window.addEventListener("scroll", onScroll);
}
