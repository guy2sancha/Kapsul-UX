// ============================================================
// LOCAL CART SYSTEM
// ============================================================

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

      const maxQuantity = button.getAttribute("data-quantity") || 1;

      // Marque déjà les produits en panier
      if (cart[productID]) {
        button.textContent = "In Cart";
        button.classList.add("in-cart");
      }

      button.addEventListener("click", (event) => {
        event.preventDefault();
        window.openLocalCartModal(button, productID, maxQuantity);
      });

      button.dataset.listenerAdded = "true";
    });
  } catch (err) {
    console.error("❌ Error in initializeLocalCartSystem:", err);
  }
};

// Ouvre le modal "Add to Cart"
window.openLocalCartModal = function (button, productID, quantityOrSizes) {
  const existingModal = document.getElementById("cart-modal");
  if (existingModal) existingModal.remove();

  const cart = JSON.parse(localStorage.getItem("localCart")) || {};
  const isInCart = !!cart[productID];

  const inCartMessage = isInCart
    ? `<p class="cart-in-cart-msg">Already in your cart</p>`
    : "";

  let inputField = "";

  // Vérifie si c'est une liste (tailles) ou un nombre
  if (isNaN(quantityOrSizes)) {
    const options = quantityOrSizes
      .split(",")
      .map(v => `<option value="${v.trim()}">${v.trim()}</option>`)
      .join("");
    inputField = `
      <label for="cart-size">Choose Size:</label>
      <select id="cart-size">${options}</select>
    `;
  } else {
    inputField = `
      <label for="cart-quantity">Quantity (max ${quantityOrSizes}):</label>
      <input type="number" id="cart-quantity" min="1" max="${quantityOrSizes}" value="1">
    `;
  }

  const modalHTML = `
    <div id="cart-modal" class="cart-modal-overlay">
      <div class="cart-modal-content">
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

  document.getElementById("submit-cart").addEventListener("click", () => {
    let chosenValue;

    if (isNaN(quantityOrSizes)) {
      chosenValue = document.getElementById("cart-size").value;
    } else {
      const quantity = parseInt(document.getElementById("cart-quantity").value, 10);
      if (isNaN(quantity) || quantity < 1 || quantity > parseInt(quantityOrSizes, 10)) {
        alert("Invalid quantity.");
        return;
      }
      chosenValue = quantity;
    }

    window.addToLocalCart(button, productID, chosenValue);

    const liveButton = document.querySelector(`.custom-add-to-cart-button[data-product-id="${productID}"]`);
    if (liveButton && liveButton.classList) {
      liveButton.textContent = "In Cart";
      liveButton.classList.add("in-cart");
    }

    document.getElementById("cart-modal")?.remove();
  });

  document.getElementById("close-cart").addEventListener("click", () => {
    document.getElementById("cart-modal")?.remove();
  });
};

// Sauvegarde les infos dans le localStorage
window.addToLocalCart = function (button, productID, chosenValue) {
  let cart = JSON.parse(localStorage.getItem("localCart")) || {};

  const name = button.getAttribute("data-name") || "";
  const price = button.getAttribute("data-price") || "";
  const image = button.getAttribute("data-image") || "";
  const size = isNaN(button.getAttribute("data-quantity")) ? chosenValue : "";
  const condition = button.getAttribute("data-condition") || "";
  const seller = button.getAttribute("data-sold-by") || "";
  const freeShipping = button.getAttribute("data-free-shipping") === "true";
  const quantity = !isNaN(button.getAttribute("data-quantity")) ? chosenValue : 1;

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

// Réinitialisation sur navigation SPA
(function () {
  let lastUrl = location.href;

  function reinitCartSystem() {
    console.log("🔁 Checking for cart re-init...");
    setTimeout(() => {
      if (window.initializeLocalCartSystem) {
        window.initializeLocalCartSystem();
      }
    }, 600);
  }

  reinitCartSystem();

  const observer = new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      console.log("🌐 URL change detected, re-initializing cart system...");
      reinitCartSystem();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
})();

// Observation DOM (Softr / Airtable rendering delay)
(function observeCartButtons() {
  const observer = new MutationObserver(() => {
    window.initializeLocalCartSystem();
  });

  observer.observe(document.body, { childList: true, subtree: true });

  setTimeout(() => {
    console.log("⏳ Forcing cart init after timeout...");
    window.initializeLocalCartSystem();
  }, 1000);
})();
