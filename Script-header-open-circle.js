// 🔹 Exécuter immédiatement avant même que le DOM soit chargé
document.addEventListener("DOMContentLoaded", function () {
    initializeLanguageSelector();
    setupLogoToggle();
});

/* ===================================================
   GESTION DE LA LANGUE
   =================================================== */
function initializeLanguageSelector() {
    let supportedLangs = [
        "fr", "ja", "ko", "es", "th",
        "pt", "de", "nl", "pl", "it",
        "ar", "vi", "zh-cn", "zh-tw"
    ];

    let languageSelector = document.getElementById("languageSelector");
    if (!languageSelector) return;

    let pathParts = window.location.pathname.split("/");
    let currentLang = pathParts[1]; 
    let activeLang = supportedLangs.includes(currentLang) ? currentLang : "en";
    languageSelector.value = activeLang;

    languageSelector.addEventListener("change", function () {
        let selectedLang = this.value;
        let trimmedPath = window.location.pathname.replace(
            /^\/(fr|ja|ko|es|th|pt|de|nl|pl|it|ar|vi|zh\-cn|zh\-tw)/,
            ""
        ) || "/";

        let newPath = (selectedLang === "en")
            ? trimmedPath
            : `/${selectedLang}${trimmedPath}`;

        window.location.href = newPath;
    });
}

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
   LOGO LOTTIE (SCROLL + CLIQUE = SMOOTH SCROLL)
   =================================================== */
function setupLogoToggle() {
    const logoContainer = document.querySelector(".logo-container");
    if (!logoContainer) return;

    const defaultHTML = logoContainer.innerHTML;
    const lottieHTML = `
        <dotlottie-player
            id="lottieLogo"
            src="https://lottie.host/31017af0-4df6-438a-9f84-25d9c01338ec/SzHeMQZ98h.lottie"
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
