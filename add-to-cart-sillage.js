// --- Panier local : initialisation des boutons ---
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
      button.addEventListener("click", (e) => {
        e.preventDefault();
        window.openLocalCartModal(button, productID, maxQuantity);
      });
      button.dataset.listenerAdded = "true";
    }
  });
};

// --- Fenêtre de confirmation ---
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
      alert("Quantité invalide.");
      return;
    }
    window.addToLocalCart(button, productID, quantity);
    window.markOfferAsAdded(productID);
    alert("✅ Vous avez la priorité sur ce produit pendant 15 minutes.");
    document.getElementById("cart-modal").remove();
  });

  document.getElementById("close-cart").addEventListener("click", () => {
    document.getElementById("cart-modal").remove();
  });
};

// --- Ajout au localStorage ---
window.addToLocalCart = function (button, productID, quantity) {
  const cart = JSON.parse(localStorage.getItem("localCart")) || {};

  const data = {
    id: productID,
    name: button.getAttribute("data-name") || "",
    price: button.getAttribute("data-price") || "",
    image: button.getAttribute("data-image") || "",
    size: button.getAttribute("data-size") || "",
    condition: button.getAttribute("data-condition") || "",
    seller: button.getAttribute("data-sold-by") || "",
    freeShipping: button.getAttribute("data-free-shipping") === "true",
    quantity,
    addedAt: Date.now()
  };

  cart[productID] = data;
  localStorage.setItem("localCart", JSON.stringify(cart));
  console.log("🛒 Panier mis à jour :", cart);
};

// --- Vérifie si offre est réservée (moins de 15 min) ---
window.isOfferReserved = function (productID) {
  const cart = JSON.parse(localStorage.getItem("localCart")) || {};
  const entry = cart[productID];
  if (!entry) return false;

  const elapsed = Date.now() - entry.addedAt;
  return elapsed < 15 * 60 * 1000;
};

// --- Marque une offre comme "Ajoutée" ---
window.markOfferAsAdded = function (productID) {
  const buttons = document.querySelectorAll(`[data-product-id='${productID}']`);
  buttons.forEach(btn => {
    btn.textContent = "Ajouté";
    btn.disabled = true;
    btn.classList.add("in-cart");
    btn.title = "Réservé 15 minutes";
  });
};

// --- Observer DOM (1 seule détection) ---
function waitAndObserveCartButtons() {
  const observer = new MutationObserver((mutations, obs) => {
    window.initializeLocalCartSystem();

    if (document.querySelector(".custom-add-to-cart-button")) {
      obs.disconnect(); // ⛔️ Stopper une fois les boutons détectés
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Init immédiate + relance après timeout
  window.initializeLocalCartSystem();
  setTimeout(() => {
    console.log("⏳ Relance forcée après timeout...");
    window.initializeLocalCartSystem();
  }, 1500);
}

// --- Démarrage ---
document.addEventListener("DOMContentLoaded", waitAndObserveCartButtons);
