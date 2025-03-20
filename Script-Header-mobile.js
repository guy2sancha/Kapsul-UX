document.addEventListener("DOMContentLoaded", async function () {
    let mobileHeader = document.getElementById("mobileHeader");
    let lastScrollY = window.scrollY;
    let isHidden = false;

    // 1️⃣ Hide/Show du header mobile au scroll
    window.addEventListener("scroll", function () {
        let currentScrollY = window.scrollY;
        if (currentScrollY > 50) {
            if (currentScrollY > lastScrollY && !isHidden) {
                mobileHeader.style.transform = "translateY(-100%)";
                isHidden = true;
            } else if (currentScrollY < lastScrollY && isHidden) {
                mobileHeader.style.transform = "translateY(0)";
                isHidden = false;
            }
        } else {
            mobileHeader.style.transform = "translateY(0)";
            isHidden = false;
        }
        lastScrollY = currentScrollY;
    });

    // 2️⃣ Détection et initialisation de la langue
    detectBrowserLanguageMobile();
    initializeLanguageSelectorMobile();

    // 3️⃣ Initialisation de la gestion des devises
    await initializeCurrencySelector();

    // 4️⃣ Mise à jour de l'affichage du menu utilisateur
    updateMenu();

    // 5️⃣ Gestion du menu utilisateur (dropdown)
    let loginButton = document.getElementById("loginButton");
    if (loginButton) {
        loginButton.addEventListener("click", function (event) {
            event.stopPropagation();
            toggleMenu();
        });
    }

    // 6️⃣ Fermer le dropdown utilisateur au clic extérieur
    document.addEventListener("click", function (event) {
        let menu = document.getElementById("profileMenu");
        if (menu && !menu.contains(event.target)) {
            menu.classList.remove("show");
        }
    });

    // 7️⃣ Gestion du panier (redirige ou ouvre une modale)
    let cartButton = document.getElementById("cartButton");
    if (cartButton) {
        cartButton.addEventListener("click", handleCartClick);
    }

    // 8️⃣ Activation automatique du lien actif dans la bottom-bar
    highlightActiveLink();
});

/* =====================
   1️⃣ handleCartClick - Gestion du bouton panier
   ===================== */
function handleCartClick() {
    let isLoggedIn = localStorage.getItem("userToken") !== null;
    if (isLoggedIn) {
        window.location.href = "/cart";
    } else {
        showModal("cartModal");
    }
}

/* =====================
   2️⃣ fetchExchangeRates - Récupération des taux de change
   ===================== */
async function fetchExchangeRates() {
    try {
        let response = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
        let data = await response.json();
        return data.rates;
    } catch (err) {
        console.error("❌ Erreur API taux de change :", err);
        return {
            USD: 1, EUR: 0.91, GBP: 0.76, JPY: 135, KRW: 1300, TWD: 30, SGD: 1.35,
            THB: 33, AUD: 1.45, HKD: 7.85, CAD: 1.36, NZD: 1.57
        };
    }
}

/* =====================
   3️⃣ initializeCurrencySelector - Initialisation du sélecteur de devise
   ===================== */
async function initializeCurrencySelector() {
    let rates = await fetchExchangeRates();
    let currencySymbols = {
        USD: "$", EUR: "€", GBP: "£", JPY: "¥", KRW: "₩", TWD: "NT$", SGD: "S$", 
        THB: "฿", AUD: "A$", HKD: "HK$", CAD: "C$", NZD: "NZ$"
    };

    let currencySelector = document.getElementById("currencySelector");
    if (!currencySelector) return;

    currencySelector.addEventListener("change", function () {
        let selected = this.value;
        let symbol = currencySymbols[selected] || selected;

        document.querySelectorAll("[data-price]").forEach((item) => {
            let basePrice = parseFloat(item.getAttribute("data-price"));
            let rate = rates[selected] || 1;
            let converted = Math.round(basePrice * rate);
            item.textContent = `${converted} ${symbol}`;
        });

        localStorage.setItem("userPreferredCurrency", selected);
    });

    let storedCurrency = localStorage.getItem("userPreferredCurrency");
    if (storedCurrency) {
        currencySelector.value = storedCurrency;
        currencySelector.dispatchEvent(new Event("change"));
    }
}

/* =====================
   4️⃣ Détection et initialisation de la langue
   ===================== */
function detectBrowserLanguageMobile() {
    let pathSegments = window.location.pathname.split('/');
    let currentLang = pathSegments[1];
    
    let supportedLanguages = ["fr", "ja", "ko", "es", "th", "pt", "de", "nl", "pl", "it", "ar", "vi", "zh-cn", "zh-tw"];
    let browserLang = navigator.language.slice(0, 2).toLowerCase();
    let storedLang = localStorage.getItem("userPreferredLanguage");

    if (!supportedLanguages.includes(currentLang)) {
        let preferredLang = storedLang || (supportedLanguages.includes(browserLang) ? browserLang : "en");
        localStorage.setItem("userPreferredLanguage", preferredLang);

        if (currentLang !== preferredLang && preferredLang !== "en") {
            window.location.assign(`/${preferredLang}${window.location.pathname}`);
        }
    }
}

function initializeLanguageSelectorMobile() {
    let languageSelector = document.getElementById("languageSelector");
    if (!languageSelector) return;

    let currentLang = window.location.pathname.split('/')[1];
    let supportedLanguages = ["fr", "ja", "ko", "es", "th", "pt", "de", "nl", "pl", "it", "ar", "vi", "zh-cn", "zh-tw"];

    languageSelector.value = supportedLanguages.includes(currentLang) ? currentLang : "en";
    languageSelector.addEventListener("change", function () {
        let selectedLang = this.value;
        let newPath = window.location.pathname.replace(/^\/(fr|ja|ko|es|th|pt|de|nl|pl|it|ar|vi|zh\-cn|zh\-tw)/, '');

        localStorage.setItem("userPreferredLanguage", selectedLang);
        window.location.href = selectedLang === "en" ? newPath || "/" : `/${selectedLang}${newPath}`;
    });
}

/* =====================
   5️⃣ Menu utilisateur & Authentification
   ===================== */
function checkLoginStatus() {
    return localStorage.getItem("userToken") !== null;
}

function updateMenu() {
    let isLoggedIn = checkLoginStatus();
    document.getElementById("loggedOutMenu").style.display = isLoggedIn ? "none" : "block";
    document.getElementById("loggedInMenu").style.display = isLoggedIn ? "block" : "none";
}

function logoutUser() {
    localStorage.removeItem("userToken");
    updateMenu();
    window.location.reload();
}

function toggleMenu() {
    document.getElementById("profileMenu").classList.toggle("show");
}

/* =====================
   6️⃣ Bottom-bar : Mettre en surbrillance l'onglet actif
   ===================== */
function highlightActiveLink() {
    let links = document.querySelectorAll(".bottom-bar a");
    let currentPath = window.location.pathname;

    links.forEach(link => {
        let linkHref = new URL(link.href, window.location.origin).pathname;
        link.classList.toggle("active-tab", linkHref === currentPath);
    });
}
