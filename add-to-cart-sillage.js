// Global exposure for Softr
window.initializeLocalCartSystem = function () {
  console.log("🛒 Initializing local cart system...");

  const buttons = document.querySelectorAll(".custom-add-to-cart-button");
  if (!buttons.length) {
    console.log("⚠️ No buttons found. Waiting for DOM via observer...");
    return;
  }

  const cart = JSON.parse(localStorage.getItem("localCart")) || {};

  buttons.forEach(button => {
    const productID = button.getAttribute("data-product-id");
    const maxQuantity = parseInt(button.getAttribute("data-quantity")) || 1;

    // Reflect state from localStorage
    if (cart[productID]) {
      button.textContent = "In your cart";
      button.classList.add("in-cart");
    }

    // Only attach event listener once
    if (!button.dataset.listenerAdded) {
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

  const cart = JSON.parse(localStorage.getItem("localCart")) || {};
  const isInCart = cart[productID] ? true : false;
  const currentQuantity = isInCart ? cart[productID].quantity : 1;

  const modalHTML = `
    <div id="cart-modal" class="cart-modal-overlay">
      <div class="cart-modal-content">
        <h2>${isInCart ? "Update Quantity" : "Add to Cart"}</h2>
        <p>📦 Available quantity: ${maxQuantity}<br>🆔 Product ID: ${productID}</p>
        <label for="cart-quantity">Quantity (max ${maxQuantity}):</label>
        <input type="number" id="cart-quantity" min="1" max="${maxQuantity}" value="${currentQuantity}">
        <div class="cart-modal-actions">
          <button id="submit-cart" class="confirm">Confirm</button>
          <button id="close-cart" class="cancel">Cancel</button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", modalHTML);

  document.getElementById("submit-cart").addEventListener("click", () => {
    const quantity = parseInt(document.getElementById("cart-quantity").value, 10);
    if (quantity < 1 || quantity > maxQuantity) {
      alert("Invalid quantity.");
      return;
    }
    window.addToLocalCart(button, productID, quantity);
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
    quantity
  };

  localStorage.setItem("localCart", JSON.stringify(cart));
  console.log("🛒 Cart updated:", cart);

  // Update button UI
  button.textContent = "In your cart";
  button.classList.add("in-cart");
};

// Auto-init and DOM observer
function waitAndObserveCartButtons() {
  window.initializeLocalCartSystem();

  const observer = new MutationObserver(() => {
    window.initializeLocalCartSystem();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  setTimeout(() => {
    console.log("⏳ Forced re-initialization after timeout...");
    window.initializeLocalCartSystem();
  }, 1500);
}

document.addEventListener("DOMContentLoaded", waitAndObserveCartButtons);
