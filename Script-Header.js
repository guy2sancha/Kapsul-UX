
/**
 * Objet associant chaque langue à une devise par défaut.
 * Ajuste comme tu veux (ex: "zh-cn": "CNY" si ton API gère CNY).
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
    "zh-cn": "CNY", // si ton API gère CNY
    "zh-tw": "TWD"
};

// Quand le DOM est prêt, on lance tout
document.addEventListener("DOMContentLoaded", async function () {
    // 1) Détection automatique de la langue et redirection si besoin
    detectBrowserLanguage();

    // 2) Sélecteur de langue (et forçage de devise selon la langue choisie)
    initializeLanguageSelector();

    // 3) Gestion des devises (récupère les taux et met à jour les prix data-price)
    await initializeCurrencySelector(); 

    // 4) Mise à jour du menu (login vs logout, icône user, etc.)
    updateMenu();

    // 5) Surligne le lien actif dans le menu (desktop)
    highlightActiveLink();

    // 6) Logo Lottie (affiché au scroll, clique pour remonter)
    setupLogoToggle();
    setupLottieClick();

    // 7) Profil (menu déroulant) + clic extérieur pour fermer
    setupProfileMenu();
});

/* ===================================================
   1) GESTION DES DEVISES
   =================================================== */

/**
 * Récupération des taux de change depuis l'API
 */
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
            NZD: 1.57,
            CNY: 6.90
        };
    }
}

/**
 * Initialise le sélecteur de devises (currencySelector) et convertit les prix
 */
async function initializeCurrencySelector() {
    let rates = await fetchExchangeRates();

    // Symboles associés aux devises
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
    if (!currencySelector) return; // Si pas de select, on quitte

    currencySelector.addEventListener("change", function () {
        let selected = this.value;
        let symbol = currencySymbols[selected] || selected;

        // Convertit tous les [data-price] en USD vers la devise choisie
        document.querySelectorAll("[data-price]").forEach((item) => {
            let basePrice = parseFloat(item.getAttribute("data-price")); // prix en USD
            let rate = rates[selected] || 1;
            let converted = Math.round(basePrice * rate);
            item.textContent = `${converted} ${symbol}`;
        });

        // Stocke la préférence en localStorage
        localStorage.setItem("userPreferredCurrency", selected);
    });

    // Restaurer la préférence de l'utilisateur s'il y en a une
    let storedCurrency = localStorage.getItem("userPreferredCurrency");
    if (storedCurrency) {
        currencySelector.value = storedCurrency;
        // On déclenche manuellement l'événement "change"
        currencySelector.dispatchEvent(new Event("change"));
    }
}

/* ---------------------------------------------------
   Forcer la devise en fonction de la langue
   --------------------------------------------------- */
function setCurrencyByLang(lang) {
    let defaultCurrency = languageToCurrency[lang] || "USD";
    let currencySelector = document.getElementById("currencySelector");
    if (!currencySelector) return;

    // On force la valeur du select
    currencySelector.value = defaultCurrency;
    // On déclenche "change" pour mettre à jour les prix
    currencySelector.dispatchEvent(new Event("change"));
}

/* ===================================================
   2) GESTION DE LA LANGUE
   =================================================== */

/**
 * Détection auto de la langue (URL vs. browser vs. localStorage).
 * Si l'URL n'a pas de langue supportée et userPreferredLanguage != 'en', on redirige.
 */
function detectBrowserLanguage() {
    let pathParts = window.location.pathname.split("/");
    let currentLang = pathParts[1];

    let supportedLangs = [
        "fr", "ja", "ko", "es", "th", "pt", "de", 
        "nl", "pl", "it", "ar", "vi", "zh-cn", "zh-tw"
    ];

    let browserLang = navigator.language.slice(0, 2).toLowerCase();
    let storedLang = localStorage.getItem("userPreferredLanguage");

    // Si pas de préférence stockée, on choisit la langue par défaut
    if (!storedLang) {
        let defaultLang = supportedLangs.includes(browserLang) ? browserLang : "en";
        localStorage.setItem("userPreferredLanguage", defaultLang);

        // Si l'URL n'a pas déjà une langue, on redirige
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

    // Si la langue actuelle est supportée, on l'utilise, sinon 'en'
    let activeLang = supportedLangs.includes(currentLang) ? currentLang : "en";
    languageSelector.value = activeLang;

    // Forcer la devise en fonction de la langue détectée
    setCurrencyByLang(activeLang);

    // Au changement de langue :
    languageSelector.addEventListener("change", function () {
        let selectedLang = this.value;

        // On enlève le segment /fr|/ja etc. si présent
        let trimmedPath = window.location.pathname.replace(
            /^\/(fr|ja|ko|es|th|pt|de|nl|pl|it|ar|vi|zh\-cn|zh\-tw)/, 
            ""
        ) || "/";

        let newPath = (selectedLang === "en") 
          ? trimmedPath 
          : `/${selectedLang}${trimmedPath}`;

        localStorage.setItem("userPreferredLanguage", selectedLang);

        // Forcer la devise associée à la langue CHOISIE
        setCurrencyByLang(selectedLang);

        // Redirection
        window.location.href = newPath;
    });
}

/* ===================================================
   3) GESTION DU PANIER
   =================================================== */

/**
 * Si l'utilisateur est connecté, on va sur /cart
 * Sinon, on ouvre la modale de login
 */
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

/**
 * Ouvre la modale et écoute le clic en dehors pour la fermer
 */
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

/**
 * Ferme la modale
 */
function closeModal(modalId) {
    let modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = "none";
    }
}

/* ===================================================
   5) MISE À JOUR DU MENU
   =================================================== */

/**
 * Met à jour le menu (boutons connectés vs déconnectés)
 * Gère aussi l'icône user si besoin
 */
function updateMenu() {
    let isLoggedIn = (localStorage.getItem("userToken") !== null);

    // loggedOutMenu / loggedInMenu
    let loggedOutMenu = document.getElementById("loggedOutMenu");
    let loggedInMenu = document.getElementById("loggedInMenu");
    if (loggedOutMenu && loggedInMenu) {
        loggedOutMenu.style.display = isLoggedIn ? "none" : "block";
        loggedInMenu.style.display = isLoggedIn ? "block" : "none";
    }

    // Si tu as un lien direct pour le panier dans le menu desktop par ex:
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

/**
 * Déconnecte l'utilisateur
 */
function logoutUser() {
    localStorage.removeItem("userToken");
    updateMenu();
    window.location.reload();
}

/* ===================================================
   6) PROFIL (menu déroulant)
   =================================================== */

/**
 * Menu profil : ferme si on clique en dehors
 */
function setupProfileMenu() {
    let profileMenu = document.getElementById("profileMenu");
    if (!profileMenu) return;

    document.addEventListener("click", function(event) {
        if (!profileMenu.contains(event.target)) {
            profileMenu.classList.remove("show");
        }
    });
}

/**
 * Ouvre/ferme le menu utilisateur (onclick sur le bouton user)
 */
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

/**
 * Ajoute la classe .active-tab sur le lien correspondant à la page courante
 */
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

/**
 * Au scroll > 400px, on remplace le logo par un Lottie.
 * Clic sur le Lottie = remonter en haut (smooth).
 */
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

/**
 * Quand on clique sur le Lottie, on remonte en haut
 */
function setupLottieClick() {
    const lottieLogo = document.getElementById("lottieLogo");
    if (lottieLogo) {
        lottieLogo.addEventListener("click", function () {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }
}
