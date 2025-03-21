document.addEventListener("DOMContentLoaded", async function () {
    let mobileHeader = document.getElementById("mobileHeader");
    let lastScrollY = window.scrollY;
    let isHidden = false;

    // 1) Au scroll, hide/show le header
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

    // 2) Initialiser le sélecteur de langue (sans détection automatique)
    initializeLanguageSelectorMobile();

    // 3) Gestion devise
    await initializeCurrencySelector(); // important: on attend la réponse fetch

    // 4) Mise à jour menu (connecté ou pas)
    updateMenu();

    // 5) Bouton user -> dropdown
    document.getElementById("loginButton").addEventListener("click", function(event) {
        event.stopPropagation();
        toggleMenu();
    });

    // 6) Clic global -> fermer le dropdown
    document.addEventListener("click", function(event) {
        let menu = document.getElementById("profileMenu");
        if (!menu.contains(event.target)) {
            menu.classList.remove("show");
        }
    });

    // 7) Bouton cart -> vérifie login ou ouvre modal
    document.getElementById("cartButton").addEventListener("click", handleCartClick);
});

/* =====================
   handleCartClick
   ===================== */
function handleCartClick() {
    let isLoggedIn = (localStorage.getItem("userToken") !== null);
    if (isLoggedIn) {
        // Rediriger vers la page /cart
        window.location.href = "/cart";
    } else {
        // Ouvrir la modale
        showModal("cartModal");
    }
}

/* =====================
   1) fetchExchangeRates
   ===================== */
async function fetchExchangeRates() {
    try {
        let response = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
        let data = await response.json();
        return data.rates;
    } catch (err) {
        console.error("Erreur lors de la récupération des taux de change", err);
        // Valeurs par défaut si l'API échoue :
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

/* =====================
   2) initializeCurrencySelector
   ===================== */
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
        NZD: "NZ$"
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
   3) initializeLanguageSelectorMobile
   ===================== */
function initializeLanguageSelectorMobile() {
    let pathSegments = window.location.pathname.split('/');
    let currentLang = pathSegments[1];

    let supportedLanguages = [
      "fr", "ja", "ko", "es", "th", "pt", "de", 
      "nl", "pl", "it", "ar", "vi", "zh-cn", "zh-tw"
    ];

    let languageSelector = document.getElementById("languageSelector");
    if (!languageSelector) return;

    languageSelector.value = supportedLanguages.includes(currentLang) ? currentLang : "en";

    languageSelector.addEventListener("change", function () {
        let selectedLang = this.value;
        let regexLangs = /^\/(fr|ja|ko|es|th|pt|de|nl|pl|it|ar|vi|zh\-cn|zh\-tw)/;
        let newPath = window.location.pathname.replace(regexLangs, '');

        localStorage.setItem("userPreferredLanguage", selectedLang);

        if (selectedLang === "en") {
            window.location.href = newPath || "/";
        } else {
            window.location.href = `/${selectedLang}${newPath}`;
        }
    });
}

/* =====================
   Fonctions diverses
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
function showModal(id) {
    let modal = document.getElementById(id);
    if (modal) {
        modal.style.display = 'flex';
    }
}
function closeModal(id) {
    let modal = document.getElementById(id);
    if (modal) {
        modal.style.display = 'none';
    }
}
