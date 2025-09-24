<script>
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
          <label for="cart-size" class="cart-label">Taille</label>
          <select id="cart-size" class="cart-input">${opts}</select>
        `;
      })()
    : "";

  const qtyMax = parsed.max; // pas affiché dans l’UI, juste appliqué en validation
  const qtyField = `
    <label for="cart-quantity" class="cart-label">Quantité</label>
    <input type="number" id="cart-quantity" class="cart-input" min="1" ${Number.isFinite(qtyMax) ? `max="${qtyMax}"` : ""} value="1">
  `;

  const modalHTML = `
    <div id="cart-modal" aria-modal="true" role="dialog">
      <div class="cart-modal-content" role="document">
        <button type="button" class="cart-close" aria-label="Close">×</button>
        <h2 class="cart-title">Ajouter au panier</h2>
        <p class="cart-sub">Choisissez votre produit et la quantité</p>
        ${already ? `<p class="cart-note">Ce produit est dans votre panier</p>` : ""}
        ${sizeField}
        ${qtyField}
        <button id="submit-cart" class="confirm">Confirmer</button>
        <button id="close-cart" class="cancel">Annuler</button>
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
      alert("Quantité Invalide"); // pas d’affichage de la valeur max
      return;
    }
    let chosenSize = "";
    if (parsed.type === "sizes") {
      chosenSize = (document.getElementById("cart-size")?.value || "").trim();
      if (!chosenSize) { alert("Choisissez votre produit"); return; }
      button.setAttribute("data-size", chosenSize);
    }

    window.addToLocalCart(button, productID, qty, chosenSize);

    const liveButton = document.querySelector(`.custom-add-to-cart-button[data-product-id="${productID}"]`);
    if (liveButton) { liveButton.textContent = "✔︎ Déjà dans votre panier"; liveButton.classList.add("in-cart"); }

    closeModal();
  });
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
    if (inCart) { button.textContent = "✔︎ Déjà dans votre panier"; button.classList.add("in-cart"); }

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
    #cart-modal .cart-close { position: absolute; top: 10px; right: 10px; width: 32px; height: 32px; border: 0px solid #e5e7eb; background: #fff; border-radius: 8px; cursor: pointer; font-size: 18px; }
  `;
  document.head.appendChild(style);
}


/* =========================================================
   Cart UI feedback (toast + drawer) — plug & play
   Usage: window.CartUI.MODE = 'toast' | 'drawer'
          → appelé automatiquement depuis addToLocalCart()
========================================================= */
(function(){
  // Choisis ton mode ici:
  window.CartUI = window.CartUI || {};
  CartUI.MODE = CartUI.MODE || 'toast'; // 'toast' ou 'drawer'

  // -- Montage des containers uniques
  function mountOnce(){
    if (document.getElementById('oc-toast')) return;

    const wrap = document.createElement('div');
    wrap.innerHTML = `
      <!-- TOAST -->
      <div id="oc-toast" aria-live="polite" aria-atomic="true">
        <div class="oc-toast-card">
          <div class="oc-toast-img" id="oc-toast-img" aria-hidden="true"></div>
          <div class="oc-toast-text">
            <strong id="oc-toast-title">Ajouté au panier</strong>
            <span id="oc-toast-sub">Produit ajouté avec succès.</span>
          </div>
          <a href="/cart" class="oc-toast-cta">Voir le panier</a>
          <button class="oc-toast-x" id="oc-toast-close" aria-label="Close">×</button>
        </div>
      </div>

      <!-- DRAWER -->
      <div id="oc-drawer" aria-hidden="true">
        <div class="oc-drawer-backdrop" id="oc-drawer-close"></div>
        <aside class="oc-drawer-panel" role="dialog" aria-modal="true" aria-labelledby="oc-drawer-title">
          <header class="oc-drawer-head">
            <h3 id="oc-drawer-title">Ajouté au panier</h3>
            <button class="oc-drawer-x" id="oc-drawer-x" aria-label="Close">×</button>
          </header>
          <div class="oc-drawer-body" id="oc-drawer-body"></div>
          <footer class="oc-drawer-foot">
            <div class="oc-drawer-row"><span>Sous-total</span><strong id="oc-drawer-sub">€0</strong></div>
            <a href="/cart" class="oc-drawer-cta">Checkout</a>
          </footer>
        </aside>
      </div>
    `;
    document.body.appendChild(wrap);

    // close handlers
    document.getElementById('oc-toast-close').addEventListener('click', hideToast);
    document.getElementById('oc-drawer-close').addEventListener('click', closeDrawer);
    document.getElementById('oc-drawer-x').addEventListener('click', closeDrawer);
    document.addEventListener('keydown', (e)=>{ if(e.key==='Escape'){ hideToast(); closeDrawer(); }});
  }

  // -- Helpers
  function formatJPY(n){
    try{
      return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })
        .format(n || 0);
    }catch{
      return (n || 0).toLocaleString('fr-FR') + ' €';
    }
  }

  function parseJPY(v){
    // Accepte "1 234,56 €", "1,234.56", "1234.56", etc.
    if (typeof v === 'number' && isFinite(v)) return v;
    const s = String(v || '')
      .replace(/\s/g, '')          // espaces fines/insécables
      .replace('€','')             // symbole €
      .replace(/\./g, '')          // séparateur milliers éventuel
      .replace(',', '.');          // décimales FR -> point
    const f = parseFloat(s);
    return isFinite(f) ? f : 0;
  }

  function getCart(){
    try{ return JSON.parse(localStorage.getItem('localCart')) || {}; }
    catch{ return {}; }
  }

  // -- Toast API
  let toastTimer;
  function showToast({name,image}){
    mountOnce();
    const el = document.getElementById('oc-toast');
    const img = document.getElementById('oc-toast-img');
    const title = document.getElementById('oc-toast-title');
    const sub = document.getElementById('oc-toast-sub');

    title.textContent = 'Produit ajouté à votre panier';
    sub.textContent = name ? name : 'Ajouté avec succès';
    img.style.backgroundImage = image ? `url("${image}")` : 'none';

    clearTimeout(toastTimer);
    el.classList.add('show');
    toastTimer = setTimeout(hideToast, 3200);
  }
  function hideToast(){
    const el = document.getElementById('oc-toast');
    el && el.classList.remove('show');
  }

  // -- Drawer API
  function openDrawer({highlightId}={}){
    mountOnce();
    const drawer = document.getElementById('oc-drawer');
    const body = document.getElementById('oc-drawer-body');
    const subEl = document.getElementById('oc-drawer-sub');

    // Build from cart
    const items = Object.values(getCart());
    let subtotal = 0;
    body.innerHTML = items.map(it=>{
      const unit = parseJPY(it.price);
      const line = unit * (parseInt(it.quantity,10) || 1);
      subtotal += line;
      const hl = highlightId && it.id === highlightId ? ' data-hl="1"' : '';
      return `
        <div class="oc-dl"${hl}>
          <img src="${it.image||''}" alt="" class="oc-dl-img">
          <div class="oc-dl-meta">
            <strong class="oc-dl-title">${it.name||''}</strong>
            <div class="oc-dl-sub">
              ${it.size ? `<span class="oc-dl-chip">Size: ${it.size}</span>` : ``}
              ${it.seller ? `<span class="oc-dl-chip">${it.seller}</span>` : ``}
            </div>
            <div class="oc-dl-row">
              <span>Qté: ${it.quantity||1}</span>
              <strong>${formatJPY(line)}</strong>
            </div>
          </div>
        </div>
      `;
    }).join('');
    subEl.textContent = formatJPY(subtotal);

    drawer.setAttribute('aria-hidden','false');
    requestAnimationFrame(()=> drawer.classList.add('open'));
  }
  function closeDrawer(){
    const drawer = document.getElementById('oc-drawer');
    if(!drawer) return;
    drawer.classList.remove('open');
    setTimeout(()=> drawer.setAttribute('aria-hidden','true'), 200);
  }

  // -- Hook appelé depuis addToLocalCart()
  CartUI.onAdded = function({id,name,image}){
    if (CartUI.MODE === 'drawer') {
      openDrawer({highlightId:id});
    } else {
      showToast({name,image});
    }
  };

  // Expose pour tests
  CartUI.showToast = showToast;
  CartUI.openDrawer = openDrawer;
  CartUI.closeDrawer = closeDrawer;
})();

/* =================================================================
   Helpers pour lire des data-* en nombre / bool (logistique)
================================================================= */
function toNumber(v, dflt = 0){
  if (typeof v === 'number' && isFinite(v)) return v;
  const s = String(v ?? '').trim().replace(',', '.');
  const f = parseFloat(s);
  return isFinite(f) ? f : dflt;
}
function readNumAttr(el, ...names){
  for (const n of names){
    const v = el.getAttribute(n);
    if (v != null && String(v).trim() !== '') return toNumber(v, 0);
  }
  return 0;
}
function readBoolAttr(el, ...names){
  for (const n of names){
    const v = el.getAttribute(n);
    if (v != null){
      const s = String(v).trim().toLowerCase();
      return s === 'true' || s === '1' || s === 'yes';
    }
  }
  return false;
}

/* ---------------------------
   Save to localStorage (MODIFIÉ)
   - capture poids/dimensions/flags (fragile, lithium)
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

  // NOUVEAU : champs logistiques depuis data-* (avec fallback)
  const weightKg = readNumAttr(button, "data-weight-kg", "data-weight");
  const L = readNumAttr(button, "data-l-cm", "data-length");
  const W = readNumAttr(button, "data-w-cm", "data-width");
  const H = readNumAttr(button, "data-h-cm", "data-height");
  const fragile = readBoolAttr(button, "data-fragile");
  const lithium = readBoolAttr(button, "data-lithium");

  const key = cartKey(productID, size);
  if (cart[key]) {
    cart[key].quantity = Math.min((cart[key].quantity || 0) + quantity, 999);
    // Met à jour les champs logistiques si fournis
    if (weightKg) cart[key].weightKg = weightKg;
    if (L) cart[key].L = L;
    if (W) cart[key].W = W;
    if (H) cart[key].H = H;
    if (button.hasAttribute("data-fragile")) cart[key].fragile = fragile;
    if (button.hasAttribute("data-lithium")) cart[key].lithium = lithium;
  } else {
    cart[key] = {
      id: key,
      base_id: productID,
      name, price, image, size, condition, seller, freeShipping,
      quantity,
      // Logistique stockée dès la création
      weightKg, L, W, H, fragile, lithium
    };
  }
  setCart(cart);

  // 👇 feedback automatique (toast ou drawer selon CartUI.MODE)
  if (window.CartUI && typeof window.CartUI.onAdded === 'function') {
    const added = cart[key];
    window.CartUI.onAdded({ id: added?.id || productID, name, image });
  }
};
</script>
