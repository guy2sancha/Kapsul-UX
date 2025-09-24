<script>
/* ============================================================
   ADD-TO-CART (LocalStorage) — Vanilla JS (FR + EUR)
   - Tous les libellés en français
   - Sous-total affiché en € (EUR)
   - Pas d'affichage du "max" dans l'UI
   - Bouton Annuler sans bordure (fallback CSS inclus)
   - Compatible DOM dynamique (Softr/Airtable)
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
    return { type: "sizes", sizes, max: 99 }; // limite soft à 99
  }
  const max = parseInt(str, 10);
  return { type: "qty", max: Number.isFinite(max) && max > 0 ? max : 1 };
}

/* ---------------------------
   Ouvrir la modale
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

  const qtyMax = parsed.max; // utilisé uniquement en validation
  const qtyField = `
    <label for="cart-quantity" class="cart-label">Quantité</label>
    <input type="number" id="cart-quantity" class="cart-input" min="1" ${Number.isFinite(qtyMax) ? `max="${qtyMax}"` : ""} value="1">
  `;

  const modalHTML = `
    <div id="cart-modal" aria-modal="true" role="dialog">
      <div class="cart-modal-content" role="document">
        <button type="button" class="cart-close" aria-label="Fermer">×</button>
        <h2 class="cart-title">Ajouter au panier</h2>
        <p class="cart-sub">Choisissez votre produit et la quantité</p>
        ${already ? `<p class="cart-note">Ce produit est déjà dans votre panier</p>` : ""}
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
      alert("Quantité invalide.");
      return;
    }
    let chosenSize = "";
    if (parsed.type === "sizes") {
      chosenSize = (document.getElementById("cart-size")?.value || "").trim();
      if (!chosenSize) { alert("Veuillez choisir une taille."); return; }
      button.setAttribute("data-size", chosenSize);
    }

    window.addToLocalCart(button, productID, qty, chosenSize);

    const liveButton = document.querySelector(`.custom-add-to-cart-button[data-product-id="${productID}"]`);
    if (liveButton) { liveButton.textContent = "Dans le panier"; liveButton.classList.add("in-cart"); }

    closeModal();
  });
};

/* ---------------------------
   Sauvegarde localStorage
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

  // Feedback (toast ou tiroir)
  if (window.CartUI && typeof window.CartUI.onAdded === 'function') {
    const added = cart[key];
    window.CartUI.onAdded({ id: added?.id || productID, name, image });
  }
};

/* ---------------------------
   Init (boutons + observers)
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

    // Marquer “Déjà dans votre panier” si présent (peu importe la taille)
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
   Fallback styles (si ton CSS global ne charge pas)
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
    #cart-modal .cart-close { position: absolute; top: 10px; right: 10px; width: 32px; height: 32px; border: 0; background: #fff; border-radius: 8px; cursor: pointer; font-size: 18px; }
  `;
  document.head.appendChild(style);
}


/* =========================================================
   Cart UI feedback (toast + drawer) — FR + EUR
   Usage: window.CartUI.MODE = 'toast' | 'drawer'
========================================================= */
(function(){
  // Choisir le mode par défaut :
  window.CartUI = window.CartUI || {};
  CartUI.MODE = CartUI.MODE || 'toast'; // 'toast' ou 'drawer'

  // -- Montage unique des containers
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
          <button class="oc-toast-x" id="oc-toast-close" aria-label="Fermer">×</button>
        </div>
      </div>

      <!-- DRAWER -->
      <div id="oc-drawer" aria-hidden="true">
        <div class="oc-drawer-backdrop" id="oc-drawer-close"></div>
        <aside class="oc-drawer-panel" role="dialog" aria-modal="true" aria-labelledby="oc-drawer-title">
          <header class="oc-drawer-head">
            <h3 id="oc-drawer-title">Ajouté au panier</h3>
            <button class="oc-drawer-x" id="oc-drawer-x" aria-label="Fermer">×</button>
          </header>
          <div class="oc-drawer-body" id="oc-drawer-body"></div>
          <footer class="oc-drawer-foot">
            <div class="oc-drawer-row"><span>Sous-total</span><strong id="oc-drawer-sub">0 €</strong></div>
            <a href="/cart" class="oc-drawer-cta">Passer au paiement</a>
          </footer>
        </aside>
      </div>
    `;
    document.body.appendChild(wrap);

    // handlers fermeture
    document.getElementById('oc-toast-close').addEventListener('click', hideToast);
    document.getElementById('oc-drawer-close').addEventListener('click', closeDrawer);
    document.getElementById('oc-drawer-x').addEventListener('click', closeDrawer);
    document.addEventListener('keydown', (e)=>{ if(e.key==='Escape'){ hideToast(); closeDrawer(); }});
  }

  // -- Helpers EUR
  function formatEUR(n){
    try{ return new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR'}).format(n||0); }
    catch{ return (n||0).toLocaleString('fr-FR') + ' €'; }
  }
  // Tolère "12,34 €" ou "12.34€"
  function parseEUR(v){
    if (typeof v === 'number' && isFinite(v)) return v;
    const s = String(v||'').trim()
      .replace(/\s/g,'')
      .replace('€','')
      .replace(/\./g,'')       // milliers
      .replace(',', '.');      // décimales
    const f = parseFloat(s);
    return isFinite(f) ? f : 0;
  }
  function getCartLS(){
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

    // Build depuis le panier
    const items = Object.values(getCartLS());
    let subtotal = 0;
    body.innerHTML = items.map(it=>{
      const unit = parseEUR(it.price);
      const line = unit * (parseInt(it.quantity,10) || 1);
      subtotal += line;
      const hl = highlightId && it.id === highlightId ? ' data-hl="1"' : '';
      return `
        <div class="oc-dl"${hl}>
          <img src="${it.image||''}" alt="" class="oc-dl-img">
          <div class="oc-dl-meta">
            <strong class="oc-dl-title">${it.name||''}</strong>
            <div class="oc-dl-sub">
              ${it.size ? `<span class="oc-dl-chip">Taille : ${it.size}</span>` : ``}
              ${it.seller ? `<span class="oc-dl-chip">${it.seller}</span>` : ``}
            </div>
            <div class="oc-dl-row">
              <span>Qté : ${it.quantity||1}</span>
              <strong>${formatEUR(line)}</strong>
            </div>
          </div>
        </div>
      `;
    }).join('');
    subEl.textContent = formatEUR(subtotal);

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
</script>
