// Expose globally for Softr
window.initializeLocalCartSystem = function () {
  console.log("🛒 Initializing local cart system...");

  const buttons = document.querySelectorAll(".custom-add-to-cart-button");

  if (!buttons.length) {
    console.log("⚠️ No buttons found. Watching DOM for changes...");
    return;
  }

  const cart = JSON.parse(localStorage.getItem("localCart")) || {};

  buttons.forEach(originalButton => {
    const productID = originalButton.getAttribute("data-product-id");
    const maxQuantity = parseInt(originalButton.getAttribute("data-quantity")) || 1;

    // Clone to remove any old listeners
    const button = originalButton.cloneNode(true);
    originalButton.replaceWith(button);

    // Update appearance if already in cart
    if (cart[productID]) {
      button.textContent = "In Cart";
      button.classList.add("in-cart");
    }

    // Add click handler
    button.addEventListener("click", (event) => {
      event.preventDefault();
      window.openLocalCartModal(button, productID, maxQuantity);
    });
  });
};

window.openLocalCartModal = function (button, productID, maxQuantity) {
  // Remove any existing modal
  const existingModal = document.getElementById("cart-modal");
  if (existingModal) existingModal.remove();

  const cart = JSON.parse(localStorage.getItem("localCart")) || {};
  const existingQuantity = cart[productID]?.quantity || 1;

  const modalHTML = `
    <div id="cart-modal" class="cart-modal-overlay">
      <div class="cart-modal-content">
        <h2>${cart[productID] ? "Update Cart Quantity" : "Add to Cart"}</h2>
        <p>🆔 Product ID: ${productID}<br>📦 Available: ${maxQuantity}</p>
        <label for="cart-quantity">Quantity (max ${maxQuantity}):</label>
        <input type="number" id="cart-quantity" min="1" max="${maxQuantity}" value="${existingQuantity}">
        <div class="cart-modal-actions">
          <button id="submit-cart" class="confirm">Confirm</button>
          <button id="close-cart" class="cancel">Cancel</button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", modalHTML);

  // Confirm add to cart
  document.getElementById("submit-cart").addEventListener("click", () => {
    const quantity = parseInt(document.getElementById("cart-quantity").value, 10);

    if (quantity < 1 || quantity > maxQuantity) {
      alert("Invalid quantity selected.");
      return;
    }

    window.addToLocalCart(button, productID, quantity);
    button.textContent = "In Cart";
    button.classList.add("in-cart");
    document.getElementById("cart-modal").remove();
  });

  // Close modal
  document.getElementById("close-cart").addEventListener("click", () => {
    document.getElementById("cart-modal").remove();
  });
};

window.addToLocalCart = function (button, productID, quantity) {
  let cart = JSON.parse(localStorage.getItem("localCart")) || {};

  const productData = {
    id: productID,
    name: button.getAttribute("data-name") || "",
    price: button.getAttribute("data-price") || "",
    image: button.getAttribute("data-image") || "",
    size: button.getAttribute("data-size") || "",
    condition: button.getAttribute("data-condition") || "",
    seller: button.getAttribute("data-sold-by") || "",
    freeShipping: button.getAttribute("data-free-shipping") === "true",
    quantity
  };

  cart[productID] = productData;
  localStorage.setItem("localCart", JSON.stringify(cart));
  console.log("🛒 Cart updated:", cart);
};

// Watch the DOM and re-initialize as needed
function waitAndObserveCartButtons() {
  window.initializeLocalCartSystem();

  const observer = new MutationObserver(() => {
    window.initializeLocalCartSystem();
  });

  observer.observe(document.body, { childList: true, subtree: true });

  setTimeout(() => {
    console.log("⏳ Forcing cart init after timeout...");
    window.initializeLocalCartSystem();
  }, 1500);
}

// Run when DOM is ready
document.addEventListener("DOMContentLoaded", waitAndObserveCartButtons);
