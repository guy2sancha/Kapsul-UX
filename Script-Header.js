
/* ===================================================
   MAPPING LANGUE -> DEVISE
   =================================================== */
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
    // 1) Détection / redirection langue
    detectBrowserLanguage();

    // 2) Initialise le sélecteur de langue
    initializeLanguageSelector();

    // 3) Initialise le sélecteur de devise
    await initializeCurrencySelector();

    // 4) Mise à jour du menu (login/logout)
    updateMenu();

    // 5) Surligne le lien actif
    highlightActiveLink();

    // 6) Logo Lottie (scroll + clic)
    setupLogoToggle();

    // 7) Menu profil (clic extérieur pour fermer)
    setupProfileMenu();
});

/* ===================================================
   A) GESTION DES DEVISES
   =================================================== */
async function fetchExchangeRates() {
    try {
        let response = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
        let data = await response.json();
        return data.rates;
    } catch (err) {
        console.error("Erreur lors de la récupération des taux de change", err);
        // Valeurs fallback
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

    // Devise forcée par la langue
    let currentLang = getCurrentLang();
    let forcedCurrency = languageToCurrency[currentLang] || "USD";
    currencySelector.value = forcedCurrency;

    // Conversion initiale
    convertAllPrices(forcedCurrency, rates, currencySymbols);

    // Conversion au changement
    currencySelector.addEventListener("change", function () {
        convertAllPrices(this.value, rates, currencySymbols);
    });
}

function convertAllPrices(selectedCurrency, rates, currencySymbols) {
    let symbol = currencySymbols[selectedCurrency] || selectedCurrency;
    let rate = rates[selectedCurrency] || 1;

    document.querySelectorAll("[data-price]").forEach((item) => {
        let basePrice = parseFloat(item.getAttribute("data-price")) || 0;
        let converted = basePrice * rate;
        let rounded = Math.round(converted);

        let formatted = rounded.toLocaleString("en-US", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        });

        item.textContent = `${formatted} ${symbol}`;
    });
}

/* ===================================================
   B) GESTION DE LA LANGUE
   =================================================== */

/**
 * - Si l'utilisateur a déjà un preferredLang => pas de redirection auto
 * - Sinon, si on n'a pas déjà redirigé dans cette session => on redirige (si le nav est supporté)
 *   et on met "alreadyRedirected" dans sessionStorage
 * - "/" = anglais par défaut
 */
function detectBrowserLanguage() {
    // 1) Si l'utilisateur a déjà choisi une langue manuellement (localStorage)
    let userPreferred = localStorage.getItem("preferredLang");
    if (userPreferred) {
        // Pas de redirection auto, on respecte son choix
        return;
    }

    // 2) Vérifie si on a déjà fait une redirection automatique cette session
    let alreadyRedirected = sessionStorage.getItem("alreadyRedirected");
    if (alreadyRedirected) {
        // On a déjà redirigé une fois cette session, on ne refait rien
        return;
    }

    // 3) Si on est sur la racine "/", on détecte la langue du navigateur
    if (window.location.pathname === "/") {
        const supportedLangs = [
            "fr", "ja", "ko", "es", "th", 
            "pt", "de", "nl", "pl", "it", 
            "ar", "vi", "zh-cn", "zh-tw"
        ];
        let browserLang = navigator.language.slice(0, 2).toLowerCase();

        // On marque qu'on a redirigé cette session (même si on ne redirige pas, pour ne pas re-tester)
        sessionStorage.setItem("alreadyRedirected", "true");

        // Si la langue du navigateur est supportée
        if (supportedLangs.includes(browserLang)) {
            // Redirige vers /xx
            window.location.href = `/${browserLang}`;
        }
        // Sinon on reste sur "/", qui est EN
    }
}

/**
 * Initialise le sélecteur de langue (#languageSelector).
 * Stocke la préférence de langue quand l'utilisateur change (dans localStorage).
 */
function initializeLanguageSelector() {
    let supportedLangs = [
        "fr", "ja", "ko", "es", "th", 
        "pt", "de", "nl", "pl", "it", 
        "ar", "vi", "zh-cn", "zh-tw"
    ];

    let languageSelector = document.getElementById("languageSelector");
    if (!languageSelector) return;

    // Langue actuelle depuis l'URL
    let pathParts = window.location.pathname.split("/");
    let currentLang = pathParts[1]; 
    let activeLang = supportedLangs.includes(currentLang) ? currentLang : "en";
    languageSelector.value = activeLang;

    languageSelector.addEventListener("change", function () {
        let selectedLang = this.value;

        // Stocke le choix de l'utilisateur en localStorage
        localStorage.setItem("preferredLang", selectedLang);

        // Retire l'ancienne langue si présente
        let trimmedPath = window.location.pathname.replace(
            /^\/(fr|ja|ko|es|th|pt|de|nl|pl|it|ar|vi|zh\-cn|zh\-tw)/,
            ""
        ) || "/";

        // Construit la nouvelle URL
        let newPath = (selectedLang === "en")
            ? trimmedPath // => on reste sur "/" ou "/xxxx" sans préfixe
            : `/${selectedLang}${trimmedPath}`;

        // Redirige
        window.location.href = newPath;
    });
}

/** Renvoie la langue courante de l’URL ou "en" */
function getCurrentLang() {
    let supportedLangs = [
        "fr", "ja", "ko", "es", "th", 
        "pt", "de", "nl", "pl", "it", 
        "ar", "vi", "zh-cn", "zh-tw"
    ];
    let pathParts = window.location.pathname.split("/");
    let currentLang = pathParts[1];
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
    let currentUrl = window.location.pathname.toLowerCase(); // Prend uniquement le chemin (sans domaine)

    console.log("🔍 URL actuelle :", currentUrl); // DEBUG

    let highlightRules = [
        { keyword: "marketplace", targetText: ["MARKET"] },
        { keyword: "brands", targetText: ["BRANDS"] }, // Détection dynamique
        { keyword: "retailers", targetText: ["SHOPS"] },
        { keyword: "map", targetText: ["MAP"] }
    ];

    links.forEach((link) => {
        let linkText = link.textContent.trim().toUpperCase(); // Normalisation du texte affiché
        let linkHref = new URL(link.href, window.location.origin).pathname.toLowerCase(); // Normalisation de href

        console.log(`➡ Vérification du lien: ${linkText} (${linkHref})`); // DEBUG

        // Retire la classe "active-tab" avant de tester
        link.classList.remove("active-tab");

        // 1️⃣ Vérifie si l'URL actuelle correspond directement au href du lien
        if (currentUrl === linkHref || currentUrl.startsWith(linkHref)) {
            console.log(`✅ Match direct : ${linkText}`);
            link.classList.add("active-tab");
        }

        // 2️⃣ Vérifie les mots-clés définis dans highlightRules
        highlightRules.forEach(rule => {
            if (currentUrl.includes(rule.keyword) && rule.targetText.includes(linkText)) {
                console.log(`✅ Match par mot-clé : ${linkText} contient ${rule.keyword}`);
                link.classList.add("active-tab");
            }
        });

        // 3️⃣ Vérifie si un mot du href du lien contient une règle définie
        highlightRules.forEach(rule => {
            if (linkHref.includes(rule.keyword) && rule.targetText.includes(linkText)) {
                console.log(`✅ Match indirect : ${linkText} pour ${rule.keyword}`);
                link.classList.add("active-tab");
            }
        });
    });

    console.log("🚀 Surlignement terminé !"); // DEBUG
}

// Exécute la fonction après le chargement de la page
document.addEventListener("DOMContentLoaded", highlightActiveLink);



/* ===================================================
   H) LOGO LOTTIE (SCROLL + CLIQUE = SMOOTH SCROLL)
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
                setupLottieClick(); // Scroll top au clic
            }
        } else {
            if (isLottieVisible) {
                logoContainer.innerHTML = defaultHTML;
                isLottieVisible = false;
                // Pour ajouter un clic "scroll top" sur le logo statique, vous pouvez faire :
                // document.querySelector(".logo-container img")?.addEventListener("click", () => {
                //     window.scrollTo({ top: 0, behavior: "smooth" });
                // });
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
