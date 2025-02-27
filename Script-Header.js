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

/* =====================
   1) Gestion des devises
   ===================== */
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
            NZD: 1.57
        };
    }
}

async function initializeCurrencySelector() {
    let rates = await fetchExchangeRates();
    let currencySelector = document.getElementById("currencySelector");
    let currencySymbols = {
        USD: "$", EUR: "€", GBP: "£", JPY: "¥", KRW: "₩", TWD: "NT$", SGD: "S$",
        THB: "฿", AUD: "A$", HKD: "HK$", CAD: "C$", NZD: "NZ$"
    };
    
    let storedCurrency = localStorage.getItem("userPreferredCurrency");
    if (!storedCurrency) {
        storedCurrency = currencySelector.options[0].value; // Sélectionne la première devise
        localStorage.setItem("userPreferredCurrency", storedCurrency);
    }
    
    currencySelector.value = storedCurrency;
    
    function updatePrices() {
        let selected = currencySelector.value;
        let symbol = currencySymbols[selected] || selected;

        document.querySelectorAll("[data-price]").forEach((item) => {
            let basePrice = parseFloat(item.getAttribute("data-price"));
            let converted = Math.round(basePrice * (rates[selected] || 1));
                        let formattedPrice = converted.toLocaleString(); // Ajoute le séparateur de milliers
            item.textContent = `${converted} ${symbol}`;
        });
        localStorage.setItem("userPreferredCurrency", selected);
    }

    currencySelector.addEventListener("change", updatePrices);
    updatePrices(); // Met à jour les prix dès le chargement
}

/* =====================
   2) Gestion de la langue
   ===================== */
function detectBrowserLanguage() {
    let pathParts = window.location.pathname.split("/");
    let currentLang = pathParts[1];
    let supportedLangs = ["fr", "ja"];
    let browserLang = navigator.language.slice(0, 2);
    let storedLang = localStorage.getItem("userPreferredLanguage");

    if (!storedLang) {
        let defaultLang = supportedLangs.includes(browserLang) ? browserLang : "en";
        localStorage.setItem("userPreferredLanguage", defaultLang);
        if (!supportedLangs.includes(currentLang)) {
            let newPath = defaultLang === "en" ? "/" : `/${defaultLang}${window.location.pathname}`;
            window.location.href = newPath;
        }
    }
}

function initializeLanguageSelector() {
    let pathParts = window.location.pathname.split("/");
    let currentLang = pathParts[1];
    let supportedLangs = ["fr", "ja"];
    let languageSelector = document.getElementById("languageSelector");

    languageSelector.value = supportedLangs.includes(currentLang) ? currentLang : "en";

    languageSelector.addEventListener("change", function () {
        let selectedLang = this.value;
        let trimmedPath = window.location.pathname.replace(/^\/(fr|ja)/, "") || "/";
        let newPath = selectedLang === "en" ? trimmedPath : `/${selectedLang}${trimmedPath}`;
        localStorage.setItem("userPreferredLanguage", selectedLang);
        window.location.href = newPath;
    });
}

/* =====================
   3) Mise à jour du menu (login / logout + icône)
   ===================== */
function updateMenu() {
    let isLoggedIn = localStorage.getItem("userToken") !== null;
    document.getElementById("loggedOutMenu").style.display = isLoggedIn ? "none" : "block";
    document.getElementById("loggedInMenu").style.display = isLoggedIn ? "block" : "none";
    
    let cartLink = document.querySelector(".cart-container a");
    cartLink.href = isLoggedIn ? "/cart" : "#";
    cartLink.onclick = isLoggedIn ? null : () => showModal("cartModal");
}

/* =====================
   4) Gestion des modales
   ===================== */
function showModal(modalId) {
    let modal = document.getElementById(modalId);
    modal.style.display = "flex";
    modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(modalId); });
}
function closeModal(modalId) {
    document.getElementById(modalId).style.display = "none";
}

/* =====================
   5) Surligner le lien actif
   ===================== */
function highlightActiveLink() {
    document.querySelectorAll(".nav-links a").forEach((link) => {
        link.classList.toggle("active-tab", link.href === window.location.href);
    });
}

/* =====================
   6) Gestion du logo (animation Lottie au scroll)
   ===================== */
function setupLogoToggle() {
    const logoContainer = document.querySelector(".logo-container");
    const defaultHTML = logoContainer.innerHTML;
    const lottieHTML = `
        <dotlottie-player id="lottieLogo" src="https://lottie.host/1ecc6b7b-5a9e-45fb-ac0e-22c42783669b/eIDivJz09E.lottie" 
        background="transparent" speed="1" style="width:120px;height:60px;" loop autoplay></dotlottie-player>`;

    let isLottieVisible = false;

    window.addEventListener("scroll", function () {
        if (window.scrollY > 400 && !isLottieVisible) {
            logoContainer.innerHTML = lottieHTML;
            isLottieVisible = true;
            setupLottieClick();
        } else if (window.scrollY <= 400 && isLottieVisible) {
            logoContainer.innerHTML = defaultHTML;
            isLottieVisible = false;
        }
    });
}

function setupLottieClick() {
    document.getElementById("lottieLogo")?.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });
}
