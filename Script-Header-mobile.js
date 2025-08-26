// Script-Header-mobile.js
(function () {
  function initMobileHeader() {
    const burger = document.getElementById("burgerMenu");
    const drawer = document.getElementById("mobileDrawer");
    const closeBtn = drawer ? drawer.querySelector(".close-btn") : null;

    if (!burger || !drawer || !closeBtn) return false; // HTML pas encore là

    // évite les doublons si ré-initialisé
    burger.onclick = () => drawer.classList.add("open");
    closeBtn.onclick = () => drawer.classList.remove("open");

    drawer.querySelectorAll(".accordion-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        btn.parentElement.classList.toggle("open");
      });
    });
    return true;
  }

  // expose sur window
  window.initMobileHeader = initMobileHeader;
})();
