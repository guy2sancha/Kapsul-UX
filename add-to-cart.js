// ============================
//  CART SYSTEM (LocalStorage)
// ============================

// Initialise le système local de panier
window.initializeLocalCartSystem = function () {
  try {
    console.log("🛒 Initializing local cart system...");

    const buttons = document.querySelectorAll(".custom-add-to-cart-button:not([disabled])");
    const cart = JSON.parse(localStorage.getItem("localCart")) || {};

    buttons.forEach(button => {
      if (!button || button.dataset.listenerAdded === "true") return;

      const productID = button.getAttribute("data-product-id");
      if (!productID) return;

      const quantityOrSizes = button.getAttribute("data-quantity") || "1";

      // Si déjà dans le panier → on marque le bouton
      if (cart[productID]) {
        button.textContent = "In Cart";
        button.classList.add("in-cart");
      }

      // Click → ouvre le modal
      button.addEventListener("click", (event) => {
        event.preventDefault();
        window.openLocalCartModal(button, productID, quantityOrSizes);
      });

      button.dataset.listenerAdded = "true";
    });
  } catch (err) {
    console.error("❌ Error in initializeLocalCartSystem:", err);
  }
};

// Ouvre le modal "Add to Cart"
window.openLocalCartModal = function (button, productID, quantityOrSizes) {
  // Supprime ancien modal si existe
  document.getElementById("cart-modal")?.remove();

  const cart = JSON.parse(localStorage.getItem("localCart")) || {};
  const isInCart = !!cart[productID];

  const inCartMessage = isInCart
    ? `<p class="cart-in-cart-msg">Already in your cart</p>`
    : "";

  // Si data-quantity est une liste → tailles
  let inputField = "";
  if (isNaN(quantityOrSizes)) {
    const options = String(quantityOrSizes)
      .split(",")
      .map(v => `<option value="${v.trim()}">${v.trim()}</option>`)
      .join("");
    inputField = `
      <label for="cart-size">Choose Size:</label>
      <select id="cart-size">${options}</select>
    `;
  } else {
    const maxQ = parseInt(quantityOrSizes, 10) || 1;
    inputField = `
      <label for="cart-quantity">Quantity (max ${maxQ}):</label>
      <input type="number" id="cart-quantity" min="1" max="${maxQ}" value="1">
    `;
  }

  const modalHTML = `
    <div id="cart-modal" class="cart-modal-overlay" aria-modal="true" role="dialog">
      <div class="cart-modal-content" role="document">
        <button class="cart-close" type="button" aria-label="Close">×</button>
        <h2>Add to Cart</h2>
        ${inCartMessage}
        ${inputField}
        <div class="cart-modal-actions">
          <button id="submit-cart" class="confirm">Confirm</button>
          <button id="close-cart" class="cancel">Cancel</button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", modalHTML);

  const modal = document.getElementById("cart-modal");

  requestAnimationFrame(() => modal.classList.add("show"));

  // Confirm
  document.getElementById("submit-cart").addEventListener("click", () => {
    let chosenValue;

    if (isNaN(quantityOrSizes)) {
      chosenValue = document.getElementById("cart-size").value;
    } else {
      const maxQ = parseInt(quantityOrSizes, 10) || 1;
      const quantity = parseInt(document.getElementById("cart-quantity").value, 10);
      if (isNaN(quantity) || quantity < 1 || quantity > maxQ) {
        alert("Invalid quantity.");
        return;
      }
      chosenValue = quantity;
    }

    window.addToLocalCart(button, productID, chosenValue);

    const liveButton = document.querySelector(`.custom-add-to-cart-button[data-product-id="${productID}"]`);
    if (liveButton) {
      liveButton.textContent = "In Cart";
      liveButton.classList.add("in-cart");
    }

    closeModal();
  });

  // Cancel / Close
  function closeModal() {
    modal.classList.remove("show");
    setTimeout(() => modal.remove(), 200);
  }
  document.getElementById("close-cart").addEventListener("click", closeModal);
  modal.querySelector(".cart-close")?.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });

  // Escape key
  document.addEventListener("keydown", function esc(e) {
    if (e.key === "Escape") {
      closeModal();
      document.removeEventListener("keydown", esc);
    }
  });
};

// Sauvegarde dans localStorage
window.addToLocalCart = function (button, productID, chosenValue) {
  let cart = JSON.parse(localStorage.getItem("localCart")) || {};

  const name = button.getAttribute("data-name") || "";
  const price = button.getAttribute("data-price") || "";
  const image = button.getAttribute("data-image") || "";
  const size = isNaN(chosenValue) ? chosenValue : (button.getAttribute("data-size") || "");
  const condition = button.getAttribute("data-condition") || "";
  const seller = button.getAttribute("data-sold-by") || "";
  const freeShipping = button.getAttribute("data-free-shipping") === "true";
  const quantity = isNaN(chosenValue) ? 1 : chosenValue;

  cart[productID] = {
    id: productID,
    name,
    price,
    image,
    size,
    condition,
    seller,
    freeShipping,
    quantity
  };

  try {
    localStorage.setItem("localCart", JSON.stringify(cart));
    console.log("🛒 Cart updated:", cart);
  } catch (err) {
    console.error("❌ Failed to write to localStorage:", err);
  }
};

// Auto-init (SPA + Softr delay)
(function () {
  let lastUrl = location.href;

  function reinitCartSystem() {
    console.log("🔁 Reinit cart system...");
    setTimeout(() => window.initializeLocalCartSystem(), 500);
  }

  reinitCartSystem();

  const observer = new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      reinitCartSystem();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  const btnObserver = new MutationObserver(() => window.initializeLocalCartSystem());
  btnObserver.observe(document.body, { childList: true, subtree: true });

  setTimeout(() => window.initializeLocalCartSystem(), 1000);
})();
