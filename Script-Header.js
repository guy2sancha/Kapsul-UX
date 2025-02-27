document.addEventListener("DOMContentLoaded", async function () {
        detectBrowserLanguage();
        initializeLanguageSelector();
        initializeCurrencySelector();
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

    async function initializeCurrencySelector() {
        let rates = await fetchExchangeRates();

        // Ajout des symboles correspondants
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

        currencySelector.addEventListener("change", function () {
            let selected = this.value;
            let symbol = currencySymbols[selected] || selected;

            document.querySelectorAll("[data-price]").forEach((item) => {
                let basePrice = parseFloat(item.getAttribute("data-price"));
                let converted = Math.round(basePrice * (rates[selected] || 1));
                item.textContent = `${converted} ${symbol}`;
            });

            localStorage.setItem("userPreferredCurrency", selected);
        });

        // Restaurer la préférence de l'utilisateur s'il y en a une
        let storedCurrency = localStorage.getItem("userPreferredCurrency");
        if (storedCurrency) {
            currencySelector.value = storedCurrency;
            // Déclenche manuellement l'événement "change" pour mettre à jour les prix
            currencySelector.dispatchEvent(new Event("change"));
        }
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

        // Si aucune préférence n'est stockée
        if (!storedLang) {
            let defaultLang = supportedLangs.includes(browserLang) ? browserLang : "en";
            localStorage.setItem("userPreferredLanguage", defaultLang);
            // Si l'URL ne contient pas déjà une langue supportée
            if (!supportedLangs.includes(currentLang)) {
                let newPath = (defaultLang === "en") ? "/" : `/${defaultLang}${window.location.pathname}`;
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
            let newPath = (selectedLang === "en") ? trimmedPath : `/${selectedLang}${trimmedPath}`;
            localStorage.setItem("userPreferredLanguage", selectedLang);
            window.location.href = newPath;
        });
    }

    /* =====================
       3) Gestion du panier
       ===================== */
    function handleCartClick() {
        let isLoggedIn = (localStorage.getItem("userToken") !== null);
        if (isLoggedIn) {
            window.location.href = "/cart";
        } else {
            showModal("cartModal");
        }
    }

    /* =====================
       4) Gestion des modales
       ===================== */
    function showModal(modalId) {
        let modal = document.getElementById(modalId);
        modal.style.display = "flex";

        // Fermer la modal si on clique hors contenu
        modal.addEventListener("click", function (e) {
            if (e.target === modal) {
                closeModal(modalId);
            }
        });
    }
    function closeModal(modalId) {
        document.getElementById(modalId).style.display = "none";
    }

    /* =====================
       5) Mise à jour du menu (login / logout + icône)
       ===================== */
    function updateMenu() {
        let isLoggedIn = (localStorage.getItem("userToken") !== null);

        // Afficher/Masquer les liens "loggedOutMenu" et "loggedInMenu"
        document.getElementById("loggedOutMenu").style.display = isLoggedIn ? "none" : "block";
        document.getElementById("loggedInMenu").style.display = isLoggedIn ? "block" : "none";

        // Changer le lien du panier selon la connexion
        let cartLink = document.querySelector(".cart-container a");
        if (isLoggedIn) {
            cartLink.href = "/cart";
            cartLink.removeAttribute("onclick");
        } else {
            cartLink.href = "#";
            cartLink.setAttribute("onclick", "showModal('cartModal')");
        }

        // Changer l'icône utilisateur (fa-user -> fa-user-check) si connecté
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
        // Suppression du token
        localStorage.removeItem("userToken");
        updateMenu();
        window.location.reload();
    }

    /* =====================
       6) Profil (menu déroulant)
       ===================== */
    function setupProfileMenu() {
        let profileMenu = document.getElementById("profileMenu");

        // Ferme le menu quand on clique en dehors
        document.addEventListener("click", function(event) {
            if (!profileMenu.contains(event.target)) {
                profileMenu.classList.remove("show");
            }
        });
    }

    // Fonction déclenchée par onclick sur le bouton profil
    function toggleMenu(event) {
        event.stopPropagation();
        let menu = document.getElementById("profileMenu");
        menu.classList.toggle("show");
    }

    /* =====================
       7) Surligner le lien actif
       ===================== */
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

    /* =====================
       8) Gestion du logo (animation Lottie au scroll)
       ===================== */
    function setupLogoToggle() {
        const logoContainer = document.querySelector(".logo-container");
        const defaultHTML = logoContainer.innerHTML;
        // Lottie que l'on veut afficher après un certain scroll :
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
            // Si on scrolle plus de 400px, on remplace le logo
            if (window.scrollY > 400) {
                if (!isLottieVisible) {
                    logoContainer.innerHTML = lottieHTML;
                    isLottieVisible = true;
                    setupLottieClick();
                }
            } else {
                // Si on remonte, on revient au logo par défaut
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
