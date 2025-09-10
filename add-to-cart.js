/* ============================================================
   ADD-TO-CART (LocalStorage) — Vanilla JS
   - No "max" text in modal label
   - Cancel button without border
   - Sizes list OR numeric quantity
   - Works with dynamic DOM (Softr/Airtable)
   ============================================================ */

function getCart() {
  try { return JSON.parse(localStorage.getItem("localCart")) || {}; }
  catch { return {}; }
}
function setCart(cart) {
  try { localStorage.setItem("localCart", JSON.stringify(cart)); }
  catch (e) { console.error("Failed to write localCart:", e); }
}
function cartKey(productID, size) {
  const s = (size || "").trim();
  return s ? `${productID}::${s}` : productID;
}

/** "S, M, L" -> {type:'sizes', sizes:[...], max:99} ; "3" -> {type:'qty', max:3} */
function parseQuantityOrSizes(val) {
  if (val == null) return { type: "qty", max: 1 };
  const str = String(val).trim();
  if (isNaN(str)) {
    const sizes = str.split(",").map(s => s.trim()).filter(Boolean);
    return { type: "sizes", sizes, max: 99 }; // plus d’affichage, mais on limite à 99 par sécurité
  }
  const max = parseInt(str, 10);
  return { type: "qty", max: Number.isFinite(max) && max > 0 ? max : 1 };
}

/* ---------------------------
   Open modal
--------------------------- */
window.openLocalCartModal = function (button, productID, quantityOrSizes) {
  document.getElementById("cart-modal")?.remove();

  const parsed = parseQuantityOrSizes(quantityOrSizes);
  const cart = getCart();
  const already = Object.keys(cart).some(k => k.startsWith(productID));

  const sizeField = parsed.type === "sizes"
    ? (() => {
        const opts = parsed.sizes.map(s => `<option value="${s}">${s}</option>`).join("");
        return `
          <label for="cart-size" class="cart-label">Size</label>
          <select id="cart-size" class="cart-input">${opts}</select>
        `;
      })()
    : "";

  const qtyMax = parsed.max; // pas affiché dans l’UI, juste appliqué en validation
  const qtyField = `
    <label for="cart-quantity" class="cart-label">Quantity</label>
    <input type="number" id="cart-quantity" class="cart-input" min="1" ${Number.isFinite(qtyMax) ? `max="${qtyMax}"` : ""} value="1">
  `;

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
  ensureMinimalModalStyle(); // styles fallback (inclut cancel sans bordure)

  const modal = document.getElementById("cart-modal");
  const closeModal = () => { modal.remove(); document.removeEventListener("keydown", escHandler); };
  const escHandler = (e) => { if (e.key === "Escape") closeModal(); };

  document.addEventListener("keydown", escHandler);
  modal.querySelector(".cart-close").addEventListener("click", closeModal);
  modal.querySelector("#close-cart").addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });

  modal.querySelector("#submit-cart").addEventListener("click", () => {
    const qty = parseInt(document.getElementById("cart-quantity").value, 10);
    if (!Number.isFinite(qty) || qty < 1 || (Number.isFinite(qtyMax) && qty > qtyMax)) {
      alert("Invalid quantity."); // pas d’affichage de la valeur max
      return;
    }
    let chosenSize = "";
    if (parsed.type === "sizes") {
      chosenSize = (document.getElementById("cart-size")?.value || "").trim();
      if (!chosenSize) { alert("Please choose a size."); return; }
      button.setAttribute("data-size", chosenSize);
    }

    window.addToLocalCart(button, productID, qty, chosenSize);

    const liveButton = document.querySelector(`.custom-add-to-cart-button[data-product-id="${productID}"]`);
    if (liveButton) { liveButton.textContent = "In Cart"; liveButton.classList.add("in-cart"); }

    closeModal();
  });
};

/* ---------------------------
   Save to localStorage
--------------------------- */
window.addToLocalCart = function (button, productID, quantity, chosenSize = "") {
  const cart = getCart();

  const name = button.getAttribute("data-name") || "";
  const price = button.getAttribute("data-price") || "";
  const image = button.getAttribute("data-image") || "";
  const size = chosenSize || button.getAttribute("data-size") || "";
  const condition = button.getAttribute("data-condition") || "";
  const seller = button.getAttribute("data-sold-by") || "";
  const freeShipping = button.getAttribute("data-free-shipping") === "true";

  const key = cartKey(productID, size);
  if (cart[key]) {
    cart[key].quantity = Math.min((cart[key].quantity || 0) + quantity, 999);
  } else {
    cart[key] = {
      id: key,
      base_id: productID,
      name, price, image, size, condition, seller, freeShipping,
      quantity
    };
  }
  setCart(cart);
};

/* ---------------------------
   Init (buttons + observers)
--------------------------- */
window.initializeLocalCartSystem = function () {
  const buttons = document.querySelectorAll(".custom-add-to-cart-button:not([disabled])");
  const cart = getCart();

  buttons.forEach((button) => {
    if (!button || button.dataset.listenerAdded === "true") return;

    const productID = button.getAttribute("data-product-id");
    if (!productID) return;

    const qAttr = button.getAttribute("data-quantity");
    const parsed = parseQuantityOrSizes(qAttr);

    // Marquer “In Cart” si déjà présent (peu importe la taille)
    const inCart = Object.keys(cart).some((k) => k.startsWith(productID));
    if (inCart) { button.textContent = "In Cart"; button.classList.add("in-cart"); }

    button.addEventListener("click", (e) => {
      e.preventDefault();
      window.openLocalCartModal(button, productID, qAttr || parsed.max || 1);
    });

    button.dataset.listenerAdded = "true";
  });
};

// Boot + observers (DOM + SPA URL)
(function bootstrapCart() {
  setTimeout(() => window.initializeLocalCartSystem(), 400);

  const domObs = new MutationObserver(() => window.initializeLocalCartSystem());
  domObs.observe(document.body, { childList: true, subtree: true });

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
   Fallback styles (if your CSS isn't loaded)
   - Cancel button without border
--------------------------- */
function ensureMinimalModalStyle() {
  if (document.getElementById("cart-modal-fallback-style")) return;
  const style = document.createElement("style");
  style.id = "cart-modal-fallback-style";
  style.textContent = `
    #cart-modal { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center;
      background: rgba(0,0,0,.6); z-index: 10000; }
    #cart-modal .cart-modal-content {
      background: #fff; border-radius: 12px; padding: 24px; width: min(90vw, 420px);
      font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial;
      text-align: center; position: relative; box-shadow: 0 10px 30px rgba(0,0,0,.25);
    }
    #cart-modal .cart-title { margin: 0 0 6px; font-size: 22px; font-weight: 800; color: #0b1428; }
    #cart-modal .cart-sub { margin: 0 0 14px; color: #516077; }
    #cart-modal .cart-note { margin: 0 0 8px; color: #0b1428; font-weight: 700; }
    #cart-modal .cart-label { display: block; text-align: left; margin: 12px 0 6px; font-weight: 700; }
    #cart-modal .cart-input { width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 15px; text-align: center; }
    #cart-modal .confirm { width: 100%; margin-top: 14px; padding: 12px; border: 0; border-radius: 8px; background: #081326; color: #fff; font-weight: 800; cursor: pointer; }
    #cart-modal .cancel  { width: 100%; margin-top: 10px; padding: 12px; border: 0; border-radius: 8px; background: #f3f4f6; color: #0b1428; font-weight: 700; cursor: pointer; }
    #cart-modal .cart-close { position: absolute; top: 10px; right: 10px; width: 32px; height: 32px; border: 1px solid #e5e7eb; background: #fff; border-radius: 8px; cursor: pointer; font-size: 18px; }
  `;
  document.head.appendChild(style);
}
