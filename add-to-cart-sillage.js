// Expose globalement pour Softr
window.initializeLocalCartSystem = function () {
  console.log("🛒 Initialisation du panier local...");

  const buttons = document.querySelectorAll(".custom-add-to-cart-button");
  if (!buttons.length) {
    console.log("⚠️ Aucun bouton détecté, attente du DOM via observer...");
    return;
  }

  buttons.forEach(button => {
    const productID = button.getAttribute("data-product-id");

    if (!productID) return;

    // Vérifie si une priorité de 15 minutes est active
    if (window.isOfferReserved(productID)) {
      window.markOfferAsAdded(productID);
    }

    if (!button.dataset.listenerAdded) {
      console.log("🎯 Attaching click handler to:", productID);
      button.addEventListener("click", (event) => {
        event.preventDefault();
        window.addToLocalCart(button, productID);
        window.markOfferAsAdded(productID);
        alert("⏳ You have priority to buy this product for the next 15 minutes");
      });
      button.dataset.listenerAdded = "true";
    }
  });
};

// Ajoute au panier local
window.addToLocalCart = function (button, productID) {
  let cart = JSON.parse(localStorage.getItem("localCart")) || {};

  const name = button.getAttribute("data-name") || "";
  const price = button.getAttribute("data-price") || "";
  const image = button.getAttribute("data-image") || "";
  const size = button.getAttribute("data-size") || "";
  const condition = button.getAttribute("data-condition") || "";
  const seller = button.getAttribute("data-sold-by") || "";
  const freeShipping = button.getAttribute("data-free-shipping") === "true";

  cart[productID] = {
    id: productID,
    name,
    price,
    image,
    size,
    condition,
    seller,
    freeShipping,
    quantity: 1,
    addedAt: Date.now() // ⏱️ 15min priority
  };

  localStorage.setItem("localCart", JSON.stringify(cart));
  console.log("✅ Panier mis à jour :", cart);
};

// Vérifie si l'offre est dans la fenêtre de priorité
window.isOfferReserved = function (productID) {
  const cart = JSON.parse(localStorage.getItem("localCart")) || {};
  const entry = cart[productID];
  if (!entry) return false;

  const elapsed = Date.now() - entry.addedAt;
  return elapsed < 15 * 60 * 1000; // < 15 minutes
};

// UI feedback (change bouton)
window.markOfferAsAdded = function (productID) {
  const buttons = document.querySelectorAll(`[data-product-id='${productID}']`);
  buttons.forEach(btn => {
    btn.textContent = "Ajouté";
    btn.classList.add("in-cart");
    btn.title = "Réservé 15 minutes";
  });
};

// DOM observer pour Softr
function waitAndObserveCartButtons() {
  window.initializeLocalCartSystem(); // 1ère init

  const observer = new MutationObserver(() => {
    window.initializeLocalCartSystem(); // recheck DOM
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  setTimeout(() => {
    console.log("⏳ Relance forcée après timeout...");
    window.initializeLocalCartSystem();
  }, 1500);
}

// Ready
document.addEventListener("DOMContentLoaded", waitAndObserveCartButtons);
