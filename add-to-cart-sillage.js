// Expose globally for Softr
window.initializeLocalCartSystem = function () {
  try {
    console.log("🛒 Initializing local cart system...");

    const buttons = document.querySelectorAll(".custom-add-to-cart-button");
    if (!buttons.length) {
      console.log("⚠️ No buttons found, waiting for DOM via observer...");
      return;
    }

    buttons.forEach(button => {
      if (!button || button.dataset.listenerAdded === "true") return;

      const productID = button.getAttribute("data-product-id");
      if (!productID) {
        console.warn("⛔ Missing data-product-id on button:", button);
        return;
      }

      const maxQuantity = parseInt(button.getAttribute("data-quantity")) || 1;

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

window.openLocalCartModal = function (button, productID, maxQuantity) {
  const existingModal = document.getElementById("cart-modal");
  if (existingModal) existingModal.remove();

  const modalHTML = `
    <div id="cart-modal" class="cart-modal-overlay">
      <div class="cart-modal-content">
        <h2>Add to Cart</h2>
        <p>📦 Available quantity: ${maxQuantity}<br>🆔 Product ID: ${productID}</p>
        <label for="cart-quantity">Quantity (max ${maxQuantity}):</label>
        <input type="number" id="cart-quantity" min="1" max="${maxQuantity}" value="1">
        <div class="cart-modal-actions">
          <button id="submit-cart" class="confirm">Confirm</button>
          <button id="close-cart" class="cancel">Cancel</button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", modalHTML);

  const quantityInput = document.getElementById("cart-quantity");
  const submitButton = document.getElementById("submit-cart");
  const closeButton = document.getElementById("close-cart");

  if (submitButton) {
    submitButton.addEventListener("click", () => {
      const quantity = parseInt(quantityInput.value, 10);
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
  }

  if (closeButton) {
    closeButton.addEventListener("click", () => {
      document.getElementById("cart-modal")?.remove();
    });
  }
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
    quantity
  };

  try {
    localStorage.setItem("localCart", JSON.stringify(cart));
    console.log("🛒 Cart updated:", cart);
  } catch (err) {
    console.error("❌ Failed to write to localStorage:", err);
  }
};

// SPA navigation observer
(function () {
  let lastUrl = location.href;

  function reinitCartSystem() {
    console.log("🔁 Checking for cart re-init...");
    setTimeout(() => {
      if (window.initializeLocalCartSystem) {
        window.initializeLocalCartSystem();
      } else {
        console.warn("⚠️ initializeLocalCartSystem not available yet.");
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

// Local DOM observer to wait for delayed button rendering (Softr + Airtable HTML)
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
