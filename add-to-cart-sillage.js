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
    const maxQuantity = parseInt(button.getAttribute("data-quantity")) || 1;

    if (window.isOfferReserved(productID)) {
      window.markOfferAsAdded(productID);
      return;
    }

    if (!button.dataset.listenerAdded) {
      console.log("🎯 Attaching click handler to:", productID);
      button.addEventListener("click", (event) => {
        event.preventDefault();
        window.openLocalCartModal(button, productID, maxQuantity);
      });
      button.dataset.listenerAdded = "true";
    }
  });
};

window.openLocalCartModal = function (button, productID, maxQuantity) {
  const existingModal = document.getElementById("cart-modal");
  if (existingModal) existingModal.remove();

  const modalHTML = `
    <div id="cart-modal" class="cart-modal-overlay">
      <div class="cart-modal-content">
        <h2>Ajouter au panier</h2>
        <p>📦 Quantité dispo : ${maxQuantity}<br>🆔 Produit : ${productID}</p>
        <label for="cart-quantity">Quantité (max ${maxQuantity}) :</label>
        <input type="number" id="cart-quantity" min="1" max="${maxQuantity}" value="1">
        <button id="submit-cart" class="confirm">Confirmer</button>
        <button id="close-cart" class="cancel">Annuler</button>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", modalHTML);

  document.getElementById("submit-cart").addEventListener("click", () => {
    const quantity = parseInt(document.getElementById("cart-quantity").value, 10);
    if (quantity < 1 || quantity > maxQuantity) {
      alert(`Quantité invalide.`);
      return;
    }
    window.addToLocalCart(button, productID, quantity);
    window.markOfferAsAdded(productID);
    document.getElementById("cart-modal").remove();
  });

  document.getElementById("close-cart").addEventListener("click", () => {
    document.getElementById("cart-modal").remove();
  });
};

window.addToLocalCart = function (button, productID, quantity) {
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
    quantity,
    addedAt: Date.now()
  };

  localStorage.setItem("localCart", JSON.stringify(cart));
  console.log("🛒 Panier mis à jour :", cart);
};

window.isOfferReserved = function (productID) {
  const cart = JSON.parse(localStorage.getItem("localCart")) || {};
  const entry = cart[productID];
  if (!entry) return false;

  const elapsed = Date.now() - entry.addedAt;
  return elapsed < 15 * 60 * 1000; // 15 min
};

window.markOfferAsAdded = function (productID) {
  const buttons = document.querySelectorAll(`[data-product-id='${productID}']`);
  buttons.forEach(btn => {
    btn.textContent = "Ajouté";
    btn.disabled = true;
    btn.classList.add("in-cart");
    btn.title = "Réservé 15 minutes";
  });
};

// Observer + Timeout
function waitAndObserveCartButtons() {
  window.initializeLocalCartSystem(); // init

  const observer = new MutationObserver(() => {
    window.initializeLocalCartSystem(); // relance après modif du DOM
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

// DOM ready
document.addEventListener("DOMContentLoaded", waitAndObserveCartButtons);
