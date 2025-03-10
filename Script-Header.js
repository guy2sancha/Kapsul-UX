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
   VÉRIFICATION JWT
   =================================================== */
function checkJWT() {
    const token = localStorage.getItem("jwtToken");
    if (!token) return false;

    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload.exp * 1000 > Date.now();
    } catch (err) {
        console.error("JWT invalide", err);
        return false;
    }
}

/* ===================================================
   MISE À JOUR DU MENU (LOGIN/LOGOUT)
   =================================================== */
function updateMenu() {
    let isLoggedIn = checkJWT();
    let loggedOutMenu = document.getElementById("loggedOutMenu");
    let loggedInMenu = document.getElementById("loggedInMenu");

    if (loggedOutMenu && loggedInMenu) {
        loggedOutMenu.style.display = isLoggedIn ? "none" : "block";
        loggedInMenu.style.display = isLoggedIn ? "block" : "none";
    }

    let userIcon = document.getElementById("profileIcon");
    if (userIcon) {
        userIcon.classList.toggle("fa-user-check", isLoggedIn);
        userIcon.classList.toggle("fa-user", !isLoggedIn);
    }
}

/* ===================================================
   LOGOUT
   =================================================== */
function logoutUser() {
    localStorage.removeItem("jwtToken");
    updateMenu();
    window.location.reload();
}

/* ===================================================
   GESTION DU PANIER
   =================================================== */
function handleCartClick() {
    if (checkJWT()) {
        window.location.href = "/cart";
    } else {
        showModal("cartModal");
    }
}

/* ===================================================
   AJOUT DU JWT DANS LES REQUÊTES API
   =================================================== */
async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem("jwtToken");
    if (!token) throw new Error("Aucun token trouvé. L'utilisateur doit se reconnecter.");

    options.headers = {
        ...options.headers,
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
    };

    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`Erreur API: ${response.statusText}`);
    return await response.json();
}

/* ===================================================
   GESTION DES MODALES
   =================================================== */
function showModal(modalId) {
    let modal = document.getElementById(modalId);
    if (!modal) return;
    modal.style.display = "flex";
    modal.addEventListener("click", (e) => e.target === modal && closeModal(modalId));
}

function closeModal(modalId) {
    let modal = document.getElementById(modalId);
    if (modal) modal.style.display = "none";
}

/* ===================================================
   GESTION DU PROFIL (MENU DÉROULANT)
   =================================================== */
function setupProfileMenu() {
    let profileMenu = document.getElementById("profileMenu");
    if (!profileMenu) return;
    document.addEventListener("click", (event) => {
        if (!profileMenu.contains(event.target)) {
            profileMenu.classList.remove("show");
        }
    });
}

function toggleMenu(event) {
    event.stopPropagation();
    let menu = document.getElementById("profileMenu");
    if (menu) menu.classList.toggle("show");
}

/* ===================================================
   GESTION DU LOGO LOTTIE (SCROLL + CLIQUE)
   =================================================== */
function setupLogoToggle() {
    const logoContainer = document.querySelector(".logo-container");
    if (!logoContainer) return;

    const defaultHTML = logoContainer.innerHTML;
    const lottieHTML = `<dotlottie-player id="lottieLogo" src="https://lottie.host/1ecc6b7b-5a9e-45fb-ac0e-22c42783669b/eIDivJz09E.lottie" background="transparent" speed="1" style="width:120px;height:60px;" loop autoplay></dotlottie-player>`;
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
        lottieLogo.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
    }
}
