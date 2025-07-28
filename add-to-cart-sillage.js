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

      const maxQuantity = parseInt(button.getAttribute("data-quantity")) || 1;

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
window.openLocalCartModal = function (button, productID, maxQuantity) {
  const existingModal = document.getElementById("cart-modal");
  if (existingModal) existingModal.remove();

  const cart = JSON.parse(localStorage.getItem("localCart")) || {};
  const isInCart = !!cart[productID];

  const inCartMessage = isInCart
    ? `<p style="color: #28a745; font-weight: bold; margin-bottom: 10px;">✔️ In your cart</p>`
    : "";

  const modalHTML = `
    <div id="cart-modal" class="cart-modal-overlay" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 9999;">
      <div class="cart-modal-content" style="background: white; padding: 30px; border-radius: 8px; width: 90%; max-width: 400px; text-align: center;">
        <h2>Add to Cart</h2>
        ${inCartMessage}
        <label for="cart-quantity" style="display: block; margin: 15px 0 5px;">Quantity (max ${maxQuantity}):</label>
        <input type="number" id="cart-quantity" min="1" max="${maxQuantity}" value="1" style="width: 60px; padding: 5px; text-align: center;">
        <div class="cart-modal-actions" style="margin-top: 20px; display: flex; gap: 10px; justify-content: center;">
          <button id="submit-cart" class="confirm" style="padding: 10px 20px; background: #081326; color: white; border: none; border-radius: 4px; cursor: pointer;">Confirm</button>
          <button id="close-cart" class="cancel" style="padding: 10px 20px; border: 1px solid #ccc; border-radius: 4px; background: white; cursor: pointer;">Cancel</button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", modalHTML);

  document.getElementById("submit-cart").addEventListener("click", () => {
    const quantity = parseInt(document.getElementById("cart-quantity").value, 10);
    if (isNaN(quantity) || quantity < 1 || quantity > maxQuantity) {
      alert("Invalid quantity.");
      return;
    }

    window.addToLocalCart(button, productID, quantity);

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
