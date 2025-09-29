<script>
/* ============================================================
   ADD-TO-SELECTION (LocalStorage) — Vanilla JS
   - Modal fields: Quantity, Loft, Available Shaft
   - Compatible avec ton système existant
   ============================================================ */

function getCart() {
  try { return JSON.parse(localStorage.getItem("localCart")) || {}; }
  catch { return {}; }
}
function setCart(cart) {
  try { localStorage.setItem("localCart", JSON.stringify(cart)); }
  catch (e) { console.error("Failed to write localCart:", e); }
}

/* Build a stable key from product + loft + shaft */
function cartKey(productID, loft, shaft) {
  const L = (loft || "").toString().trim();
  const S = (shaft || "").toString().trim();
  return [productID, L, S].filter(Boolean).join("::");
}

/* ---------------------------
   Open modal (Quantity + Loft + Shaft)
--------------------------- */
window.openLocalCartModal = function (button, productID) {
  document.getElementById("cart-modal")?.remove();

  const loftOptions = (button.getAttribute("data-loft") || "")
    .split(",").map(s => s.trim()).filter(Boolean);
  const shaftOptions = (button.getAttribute("data-available-shaft") || "")
    .split(",").map(s => s.trim()).filter(Boolean);

  const cart = getCart();
  const already = Object.keys(cart).some(k => k.startsWith(productID));

  const qtyField = `
    <label for="cart-quantity" class="cart-label">Quantity</label>
    <input type="number" id="cart-quantity" class="cart-input" min="1" value="1">
  `;

  const loftField = loftOptions.length
    ? `<label for="cart-loft" class="cart-label">Loft</label>
       <select id="cart-loft" class="cart-input">
         ${loftOptions.map(o => `<option value="${o}">${o}°</option>`).join("")}
       </select>`
    : `<label for="cart-loft-free" class="cart-label">Loft</label>
       <input id="cart-loft-free" class="cart-input" placeholder="e.g. 52°">`;

  const shaftField = shaftOptions.length
    ? `<label for="cart-shaft" class="cart-label">Available Shaft</label>
       <select id="cart-shaft" class="cart-input">
         ${shaftOptions.map(s => `<option value="${s}">${s}</option>`).join("")}
       </select>`
    : `<label for="cart-shaft-free" class="cart-label">Available Shaft</label>
       <input id="cart-shaft-free" class="cart-input" placeholder="Type or paste shaft">`;

  const modalHTML = `
    <div id="cart-modal" aria-modal="true" role="dialog">
      <div class="cart-modal-content">
        <button type="button" class="cart-close" aria-label="Close">×</button>
        <h2 class="cart-title">Add to My Selection</h2>
        <p class="cart-sub">Choose your options below.</p>
        ${already ? `<p class="cart-note">This item is already in your selection.</p>` : ""}
        ${qtyField}
        ${loftField}
        ${shaftField}
        <button id="submit-cart" class="confirm">Confirm</button>
        <button id="close-cart" class="cancel">Cancel</button>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML("beforeend", modalHTML);
  ensureMinimalModalStyle();

  const modal = document.getElementById("cart-modal");
  const closeModal = () => { modal.remove(); document.removeEventListener("keydown", escHandler); };
  const escHandler = (e) => { if (e.key === "Escape") closeModal(); };

  document.addEventListener("keydown", escHandler);
  modal.querySelector(".cart-close").addEventListener("click", closeModal);
  modal.querySelector("#close-cart").addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });

  modal.querySelector("#submit-cart").addEventListener("click", () => {
    const qty = parseInt(document.getElementById("cart-quantity")?.value, 10) || 1;

    const chosenLoft = document.getElementById("cart-loft")?.value ||
                       document.getElementById("cart-loft-free")?.value || "";
    const chosenShaft = document.getElementById("cart-shaft")?.value ||
                        document.getElementById("cart-shaft-free")?.value || "";

    window.addToLocalCart(button, productID, qty, chosenLoft, chosenShaft);

    const liveButton = document.querySelector(`.custom-add-to-cart-button[data-product-id="${productID}"]`);
    if (liveButton) { liveButton.textContent = "✔︎ In your selection"; liveButton.classList.add("in-cart"); }

    closeModal();
  });
};

/* ---------------------------
   Save to localStorage
--------------------------- */
window.addToLocalCart = function (button, productID, quantity, chosenLoft = "", chosenShaft = "") {
  const cart = getCart();

  const name = button.getAttribute("data-name") || "";
  const price = button.getAttribute("data-price") || "";
  const image = button.getAttribute("data-image") || "";
  const condition = button.getAttribute("data-condition") || "";
  const seller = button.getAttribute("data-sold-by") || "";
  const category = button.getAttribute("data-main-category") || "";

  const loft = (chosenLoft || "").trim();
  const shaft = (chosenShaft || "").trim();

  const key = cartKey(productID, loft, shaft);
  if (cart[key]) {
    cart[key].quantity = Math.min((cart[key].quantity || 0) + quantity, 999);
  } else {
    cart[key] = {
      id: key,
      base_id: productID,
      name, price, image, condition, seller, category,
      loft, shaft, quantity
    };
  }
  setCart(cart);

  if (window.CartUI && typeof window.CartUI.onAdded === 'function') {
    const added = cart[key];
    window.CartUI.onAdded({ id: added?.id || productID, name, image });
  }
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

    const inCart = Object.keys(cart).some((k) => k.startsWith(productID));
    if (inCart) { button.textContent = "✔︎ In your selection"; button.classList.add("in-cart"); }

    button.addEventListener("click", (e) => {
      e.preventDefault();
      window.openLocalCartModal(button, productID);
    });

    button.dataset.listenerAdded = "true";
  });
};

// Boot + observers
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
   Minimal modal styles
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
    #cart-modal .cart-label { display: block; text-align: left; margin: 12px 0 6px; font-weight: 700; }
    #cart-modal .cart-input { width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 15px; }
    #cart-modal .confirm { width: 100%; margin-top: 14px; padding: 12px; border: 0; border-radius: 8px; background: #081326; color: #fff; font-weight: 800; cursor: pointer; }
    #cart-modal .cancel  { width: 100%; margin-top: 10px; padding: 12px; border: 0; border-radius: 8px; background: #f3f4f6; color: #0b1428; font-weight: 700; cursor: pointer; }
    #cart-modal .cart-close { position: absolute; top: 10px; right: 10px; width: 32px; height: 32px; border: 0; background: #fff; border-radius: 8px; cursor: pointer; font-size: 18px; }
  `;
  document.head.appendChild(style);
}

/* =========================================================
   Cart UI feedback (toast + drawer)
========================================================= */
(function(){
  window.CartUI = window.CartUI || {};
  CartUI.MODE = CartUI.MODE || 'toast';

  function mountOnce(){
    if (document.getElementById('oc-toast')) return;
    const wrap = document.createElement('div');
    wrap.innerHTML = `
      <!-- TOAST -->
      <div id="oc-toast"><div class="oc-toast-card">
        <div class="oc-toast-img" id="oc-toast-img"></div>
        <div class="oc-toast-text"><strong id="oc-toast-title">Added</strong>
        <span id="oc-toast-sub">Item saved.</span></div>
        <a href="/request" class="oc-toast-cta">Open selection</a>
        <button class="oc-toast-x" id="oc-toast-close">×</button>
      </div></div>
      <!-- DRAWER -->
      <div id="oc-drawer" aria-hidden="true">
        <div class="oc-drawer-backdrop" id="oc-drawer-close"></div>
        <aside class="oc-drawer-panel">
          <header class="oc-drawer-head">
            <h3>Selection</h3><button id="oc-drawer-x">×</button>
          </header>
          <div class="oc-drawer-body" id="oc-drawer-body"></div>
          <footer class="oc-drawer-foot">
            <div class="oc-drawer-row"><span>Items</span><strong id="oc-drawer-sub">0</strong></div>
            <a href="/request" class="oc-drawer-cta">Open selection</a>
          </footer>
        </aside>
      </div>`;
    document.body.appendChild(wrap);
    document.getElementById('oc-toast-close').addEventListener('click', hideToast);
    document.getElementById('oc-drawer-close').addEventListener('click', closeDrawer);
    document.getElementById('oc-drawer-x').addEventListener('click', closeDrawer);
  }

  function getBag(){ try{ return JSON.parse(localStorage.getItem('localCart')) || {}; }catch{ return {}; } }

  let toastTimer;
  function showToast({name,image}){ mountOnce();
    const el = document.getElementById('oc-toast'); const img=document.getElementById('oc-toast-img');
    document.getElementById('oc-toast-title').textContent='Added to your selection';
    document.getElementById('oc-toast-sub').textContent=name||'Saved successfully';
    img.style.backgroundImage=image?`url("${image}")`:'none';
    clearTimeout(toastTimer); el.classList.add('show'); toastTimer=setTimeout(hideToast,3200);
  }
  function hideToast(){ document.getElementById('oc-toast')?.classList.remove('show'); }

  function openDrawer({highlightId}={}){ mountOnce();
    const drawer=document.getElementById('oc-drawer'); const body=document.getElementById('oc-drawer-body');
    const subEl=document.getElementById('oc-drawer-sub'); const items=Object.values(getBag());
    let count=0;
    body.innerHTML=items.map(it=>{
      count += (parseInt(it.quantity,10)||1);
      return `<div class="oc-dl"${highlightId&&it.id===highlightId?' data-hl="1"':''}>
        <img src="${it.image||''}" class="oc-dl-img"><div class="oc-dl-meta">
        <strong>${it.name||''}</strong>
        <div class="oc-dl-sub">
          ${it.loft?`<span class="oc-dl-chip">Loft: ${it.loft}°</span>`:''}
          ${it.shaft?`<span class="oc-dl-chip">${it.shaft}</span>`:''}
          ${it.seller?`<span class="oc-dl-chip">${it.seller}</span>`:''}
        </div><div class="oc-dl-row"><span>Qty: ${it.quantity||1}</span></div>
      </div></div>`; }).join('');
    subEl.textContent=count.toString();
    drawer.setAttribute('aria-hidden','false'); requestAnimationFrame(()=>drawer.classList.add('open'));
  }
  function closeDrawer(){ const drawer=document.getElementById('oc-drawer'); if(!drawer)return;
    drawer.classList.remove('open'); setTimeout(()=>drawer.setAttribute('aria-hidden','true'),200); }

  CartUI.onAdded=function({id,name,image}){ if(CartUI.MODE==='drawer')openDrawer({highlightId:id}); else showToast({name,image}); };
})();
</script>
