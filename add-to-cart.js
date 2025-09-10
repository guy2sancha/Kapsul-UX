/* ============================================================
   ADD-TO-CART (LocalStorage) — Vanilla JS
   - Handles size lists or numeric max quantities
   - Modal in English
   - Works with dynamic DOM (Softr/Airtable)
   ============================================================ */

/* ---------------------------
   Utilities
--------------------------- */
function getCart() {
  try {
    return JSON.parse(localStorage.getItem("localCart")) || {};
  } catch {
    return {};
  }
}
function setCart(cart) {
  try {
    localStorage.setItem("localCart", JSON.stringify(cart));
  } catch (e) {
    console.error("Failed to write localCart:", e);
  }
}

/** Build a stable key so a same product can exist with different sizes */
function cartKey(productID, size) {
  const s = (size || "").trim();
  return s ? `${productID}::${s}` : productID;
}

/** Parse data-quantity: "S, M, L" -> {type:'sizes', sizes:[...]} ; "3" -> {type:'qty', max:3} */
function parseQuantityOrSizes(val) {
  if (val == null) return { type: "qty", max: 1 };
  const str = String(val).trim();

  // If it contains a non-digit (and commas), treat as sizes
  if (isNaN(str)) {
    const sizes = str
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    return { type: "sizes", sizes, max: 10 }; // default max per add when using sizes
  }

  const max = parseInt(str, 10);
  return { type: "qty", max: Number.isFinite(max) && max > 0 ? max : 1 };
}

/* ---------------------------
   Core: open modal
--------------------------- */
window.openLocalCartModal = function openLocalCartModal(button, productID, quantityOrSizes) {
  // Remove existing modal if any
  document.getElementById("cart-modal")?.remove();

  const parsed = parseQuantityOrSizes(quantityOrSizes);
  const cart = getCart();

  // If an item exists (any size), show a small note
  const already = Object.keys(cart).some((k) => k.startsWith(productID));

  // Build fields
  const sizeField =
    parsed.type === "sizes"
      ? (() => {
          const opts = parsed.sizes
            .map((s) => `<option value="${s}">${s}</option>`)
            .join("");
          return `
            <label for="cart-size" class="cart-label">Size</label>
            <select id="cart-size" class="cart-input">${opts}</select>
          `;
        })()
      : "";

  const qtyMax = parsed.max;
  const qtyField = `
    <label for="cart-quantity" class="cart-label">Quantity (max ${qtyMax})</label>
    <input type="number" id="cart-quantity" class="cart-input" min="1" max="${qtyMax}" value="1">
  `;

  // Modal HTML structure (no inline layout except minimal fallback)
  const modalHTML = `
    <div id="cart-modal" aria-modal="true" role="dialog">
      <div class="cart-modal-content" role="document">
        <button type="button" class="cart-close" aria-label="Close">×</button>
        <h2 class="cart-title">Add to cart</h2>
        <p class="cart-sub">Choose your size and quantity</p>
        ${already ? `<p class="cart-note">Already in your cart</p>` : ""}
        ${sizeField}
        ${qtyField}
        <button id="submit-cart" class="confirm">Confirm</button>
        <button id="close-cart" class="cancel">Cancel</button>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", modalHTML);

  // Minimal fallback style if your CSS isn't loaded (keeps you safe)
  ensureMinimalModalStyle();

  const modal = document.getElementById("cart-modal");
  const closeBtn = modal.querySelector(".cart-close");
  const cancelBtn = modal.querySelector("#close-cart");
  const submitBtn = modal.querySelector("#submit-cart");

  function closeModal() {
    modal.remove();
    document.removeEventListener("keydown", escHandler);
  }
  function escHandler(e) {
    if (e.key === "Escape") closeModal();
  }
  document.addEventListener("keydown", escHandler);
  closeBtn.addEventListener("click", closeModal);
  cancelBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  submitBtn.addEventListener("click", () => {
    const qty = parseInt(document.getElementById("cart-quantity").value, 10);
    if (!Number.isFinite(qty) || qty < 1 || qty > qtyMax) {
      alert("Invalid quantity.");
      return;
    }

    let chosenSize = "";
    if (parsed.type === "sizes") {
      chosenSize = (document.getElementById("cart-size")?.value || "").trim();
      if (!chosenSize) {
        alert("Please choose a size.");
        return;
      }
      // Store the chosen size back on the button so it’s captured in attributes too
      button.setAttribute("data-size", chosenSize);
    }

    window.addToLocalCart(button, productID, qty, chosenSize);

    // Reflect on the live button (same productID, any size)
    const liveButton = document.querySelector(`.custom-add-to-cart-button[data-product-id="${productID}"]`);
    if (liveButton) {
      liveButton.textContent = "In Cart";
      liveButton.classList.add("in-cart");
    }

    closeModal();
  });
};

/* ---------------------------
   Core: write into localStorage
--------------------------- */
window.addToLocalCart = function addToLocalCart(button, productID, quantity, chosenSize = "") {
  const cart = getCart();

  // Read attributes from the button (Airtable-fed)
  const name = button.getAttribute("data-name") || "";
  const price = button.getAttribute("data-price") || ""; // keep as string; parse price later if needed
  const image = button.getAttribute("data-image") || "";
  // priority to chosenSize when present
  const size = chosenSize || button.getAttribute("data-size") || "";
  const condition = button.getAttribute("data-condition") || "";
  const seller = button.getAttribute("data-sold-by") || "";
  const freeShipping = button.getAttribute("data-free-shipping") === "true";

  const key = cartKey(productID, size);

  if (cart[key]) {
    // If same key (same product + same size), bump quantity but clamp to a sane max (99)
    const nextQty = Math.min((cart[key].quantity || 0) + quantity, 99);
    cart[key].quantity = nextQty;
  } else {
    cart[key] = {
      id: key,             // unique per product+size
      base_id: productID,  // original product id
      name,
      price,
      image,
      size,
      condition,
      seller,
      freeShipping,
      quantity
    };
  }

  setCart(cart);
};

/* ---------------------------
   Init & observers (SPA/Dynamic)
--------------------------- */
window.initializeLocalCartSystem = function initializeLocalCartSystem() {
  const buttons = document.querySelectorAll(".custom-add-to-cart-button:not([disabled])");
  const cart = getCart();

  buttons.forEach((button) => {
    if (!button || button.dataset.listenerAdded === "true") return;

    const productID = button.getAttribute("data-product-id");
    if (!productID) return;

    const qAttr = button.getAttribute("data-quantity"); // may be "3" or "S, M, L"
    const parsed = parseQuantityOrSizes(qAttr);

    // If any variant of this product is in the cart, show "In Cart"
    const inCart = Object.keys(cart).some((k) => k.startsWith(productID));
    if (inCart) {
      button.textContent = "In Cart";
      button.classList.add("in-cart");
    }

    button.addEventListener("click", (e) => {
      e.preventDefault();
      window.openLocalCartModal(button, productID, qAttr || parsed.max || 1);
    });

    button.dataset.listenerAdded = "true";
  });
};

// Run once + watch DOM & URL changes
(function bootstrapCart() {
  // Initial (delay for Softr/Airtable rendering)
  setTimeout(() => window.initializeLocalCartSystem(), 400);

  // Re-init on DOM changes
  const domObs = new MutationObserver(() => window.initializeLocalCartSystem());
  domObs.observe(document.body, { childList: true, subtree: true });

  // Re-init on SPA URL changes
  let lastUrl = location.href;
  const urlObs = new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      setTimeout(() => window.initializeLocalCartSystem(), 400);
    }
  });
  urlObs.observe(document.body, { childList: true, subtree: true });
})();

/* ---------------------------
   Minimal fallback style (optional but safe)
   If your CSS is already loaded for #cart-modal & .cart-modal-content,
   you can remove this function.
--------------------------- */
function ensureMinimalModalStyle() {
  if (document.getElementById("cart-modal-fallback-style")) return;
  const style = document.createElement("style");
  style.id = "cart-modal-fallback-style";
  style.textContent = `
    #cart-modal {
      position: fixed; inset: 0;
      display: flex; align-items: center; justify-content: center;
      background: rgba(0,0,0,.6); z-index: 10000;
    }
    #cart-modal .cart-modal-content {
      background: #fff; border-radius: 12px; padding: 24px; width: min(90vw, 420px);
      font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial;
      text-align: center; position: relative; box-shadow: 0 10px 30px rgba(0,0,0,.25);
    }
    #cart-modal .cart-title { margin: 0 0 6px; font-size: 22px; font-weight: 800; color: #0b1428; }
    #cart-modal .cart-sub { margin: 0 0 14px; color: #516077; }
    #cart-modal .cart-note { margin: 0 0 8px; color: #0b1428; font-weight: 700; }
    #cart-modal .cart-label { display: block; text-align: left; margin: 12px 0 6px; font-weight: 700; }
    #cart-modal .cart-input {
      width: 100%; padding: 12px; border: 1px solid #ccc; border-radius: 8px; font-size: 15px; text-align: center;
    }
    #cart-modal .confirm {
      width: 100%; margin-top: 14px; padding: 12px; border: 0; border-radius: 8px; background: #081326; color: #fff; font-weight: 800; cursor: pointer;
    }
    #cart-modal .cancel {
      width: 100%; margin-top: 10px; padding: 12px; border: 1px solid #ddd; border-radius: 8px; background: #f3f4f6; color: #0b1428; font-weight: 700; cursor: pointer;
    }
    #cart-modal .cart-close {
      position: absolute; top: 10px; right: 10px; width: 32px; height: 32px;
      border: 1px solid #ddd; background: #fff; border-radius: 8px; cursor: pointer; font-size: 18px;
    }
  `;
  document.head.appendChild(style);
}
