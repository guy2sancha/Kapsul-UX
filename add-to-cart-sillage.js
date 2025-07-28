// === INIT CART SYSTEM ===
window.initializeLocalCartSystem = function () {
  console.log("🛒 Initializing local cart system...");

  const buttons = document.querySelectorAll(".custom-add-to-cart-button");
  const cart = JSON.parse(localStorage.getItem("localCart")) || {};

  buttons.forEach(button => {
    const productID = button.getAttribute("data-product-id");
    const maxQuantity = parseInt(button.getAttribute("data-quantity")) || 1;

    // Reflect state from localStorage
    if (cart[productID]) {
      button.textContent = "In your cart";
      button.classList.add("in-cart");
    } else {
      button.textContent = "Add to Cart";
      button.classList.remove("in-cart");
    }

    // Attach click event once
    if (!button.dataset.listenerAdded) {
      button.addEventListener("click", (e) => {
        e.preventDefault();
        window.openLocalCartModal(button, productID, maxQuantity);
      });
      button.dataset.listenerAdded = "true";
    }
  });
};

// === MODAL LOGIC ===
window.openLocalCartModal = function (button, productID, maxQuantity) {
  // Remove existing modal
  const existingModal = document.getElementById("cart-modal");
  if (existingModal) existingModal.remove();

  const cart = JSON.parse(localStorage.getItem("localCart")) || {};
  const currentQty = cart[productID]?.quantity || 1;

  const modalHTML = `
    <div id="cart-modal" class="cart-modal-overlay">
      <div class="cart-modal-content">
        <h2>${cart[productID] ? "Update Quantity" : "Add to Cart"}</h2>
        <p><strong>Available:</strong> ${maxQuantity}</p>
        <p><strong>Product ID:</strong> ${productID}</p>
        <label for="cart-quantity">Quantity (max ${maxQuantity}):</label>
        <input type="number" id="cart-quantity" min="1" max="${maxQuantity}" value="${currentQty}">
        <div class="cart-modal-actions">
          <button id="submit-cart">Confirm</button>
          <button id="close-cart">Cancel</button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", modalHTML);

  // Confirm
  document.getElementById("submit-cart").addEventListener("click", () => {
    const qty = parseInt(document.getElementById("cart-quantity").value);
    if (qty < 1 || qty > maxQuantity) {
      alert("Invalid quantity");
      return;
    }
    window.addToLocalCart(button, productID, qty);
    document.getElementById("cart-modal").remove();
  });

  // Cancel
  document.getElementById("close-cart").addEventListener("click", () => {
    document.getElementById("cart-modal").remove();
  });
};

// === ADD TO LOCAL STORAGE ===
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

  // Update UI
  button.textContent = "In your cart";
  button.classList.add("in-cart");

  console.log("🛒 Cart updated:", cart);
};

// === OBSERVER + TIMEOUT ===
function waitAndObserveCartButtons() {
  window.initializeLocalCartSystem();

  const observer = new MutationObserver(() => {
    window.initializeLocalCartSystem();
  });

  observer.observe(document.body, { childList: true, subtree: true });

  setTimeout(() => {
    console.log("⏳ Fallback initialization...");
    window.initializeLocalCartSystem();
  }, 1500);
}

document.addEventListener("DOMContentLoaded", waitAndObserveCartButtons);
