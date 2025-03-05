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
    console.log("[DEBUG] DOMContentLoaded START");

    // 1) Langue
    detectBrowserLanguage();

    // 2) Sélecteur de langue
    initializeLanguageSelector();

    // 3) Récupère et applique les devises
    await initializeCurrencySelector(); 

    // 4) updateMenu
    updateMenu();

    // 5) highlight
    highlightActiveLink();

    // 6) Lottie
    setupLogoToggle();
    setupLottieClick();

    // 7) Profil
    setupProfileMenu();

    console.log("[DEBUG] DOMContentLoaded END");
});

/* ========== GESTION DES DEVISES ========== */

async function fetchExchangeRates() {
    console.log("[DEBUG] fetchExchangeRates called");
    try {
        let response = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
        let data = await response.json();
        console.log("[DEBUG] Rates fetched", data.rates);
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
    if (!currencySelector) {
        console.warn("[DEBUG] No currencySelector found in DOM");
        return;
    }

    // Écouteur "change"
    currencySelector.addEventListener("change", function () {
        let selected = this.value;
        console.log("[DEBUG] currencySelector changed =>", selected);
        localStorage.setItem("userPreferredCurrency", selected);
        convertAllPrices(selected, rates, currencySymbols);
    });

    // On récupère la langue courante
    let currentLang = getCurrentLang();
    let forcedCurrency = languageToCurrency[currentLang] || "USD";
    console.log("[DEBUG] Lang =>", currentLang, ", forcedCurrency =>", forcedCurrency);

    // On regarde si l’utilisateur avait déjà sélectionné une devise
    let storedCurrency = localStorage.getItem("userPreferredCurrency");
    console.log("[DEBUG] storedCurrency in localStorage =>", storedCurrency);

    let finalCurrency = storedCurrency || forcedCurrency;
    console.log("[DEBUG] finalCurrency =>", finalCurrency);

    // On met finalCurrency dans le <select>
    currencySelector.value = finalCurrency;

    // On déclenche le "change" pour recalculer
    console.log("[DEBUG] Dispatching 'change' event for finalCurrency =>", finalCurrency);
    currencySelector.dispatchEvent(new Event("change"));
}

/**
 * Convertit tous les [data-price] en fonction de la devise
 */
function convertAllPrices(selectedCurrency, rates, currencySymbols) {
    console.log("[DEBUG] convertAllPrices =>", selectedCurrency);
    let symbol = currencySymbols[selectedCurrency] || selectedCurrency;
    let rate = rates[selectedCurrency] || 1;

    let items = document.querySelectorAll("[data-price]");
    console.log("[DEBUG] Found", items.length, "items with [data-price]");

    items.forEach((item) => {
        let basePrice = parseFloat(item.getAttribute("data-price")); 
        if (isNaN(basePrice)) {
            console.warn("[DEBUG] data-price is not a number on item =>", item);
            return;
        }
        let converted = Math.round(basePrice * rate);
        item.textContent = `${converted} ${symbol}`;
        console.log("[DEBUG] Convert =>", basePrice, "USD =>", converted, symbol);
    });
}

/* ========== GESTION DE LA LANGUE ========== */
function detectBrowserLanguage() {
    console.log("[DEBUG] detectBrowserLanguage called");

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
            console.log("[DEBUG] Redirect to =>", newPath);
            window.location.href = newPath;
        }
    }
}

function initializeLanguageSelector() {
    console.log("[DEBUG] initializeLanguageSelector called");
    let pathParts = window.location.pathname.split("/");
    let currentLang = pathParts[1];

    let supportedLangs = [
        "fr", "ja", "ko", "es", "th", "pt", "de",
        "nl", "pl", "it", "ar", "vi", "zh-cn", "zh-tw"
    ];

    let languageSelector = document.getElementById("languageSelector");
    if (!languageSelector) {
        console.warn("[DEBUG] No languageSelector found in DOM");
        return;
    }

    let activeLang = supportedLangs.includes(currentLang) ? currentLang : "en";
    languageSelector.value = activeLang;

    // Changement de langue => redirection
    languageSelector.addEventListener("change", function () {
        let selectedLang = this.value;
        let trimmedPath = window.location.pathname.replace(
            /^\/(fr|ja|ko|es|th|pt|de|nl|pl|it|ar|vi|zh\-cn|zh\-tw)/,
            ""
        ) || "/";
        let newPath = (selectedLang === "en")
            ? trimmedPath
            : `/${selectedLang}${trimmedPath}`;

        localStorage.setItem("userPreferredLanguage", selectedLang);
        console.log("[DEBUG] Language changed =>", selectedLang, ", redirect =>", newPath);
        window.location.href = newPath;
    });
}

function getCurrentLang() {
    let pathParts = window.location.pathname.split("/");
    let currentLang = pathParts[1];

    let supportedLangs = [
        "fr", "ja", "ko", "es", "th", "pt", "de",
        "nl", "pl", "it", "ar", "vi", "zh-cn", "zh-tw"
    ];
    return supportedLangs.includes(currentLang) ? currentLang : "en";
}

/* ========== GESTION DU PANIER, MENUS, ETC. ========== */

function handleCartClick() {
    let isLoggedIn = (localStorage.getItem("userToken") !== null);
    if (isLoggedIn) {
        window.location.href = "/cart";
    } else {
        showModal("cartModal");
    }
}

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
