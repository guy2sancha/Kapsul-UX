<script>
/* ============================================================
   1. HELPERS — stockage LocalStorage + format prix en €
============================================================ */
const CART_KEY = "localCart";

function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || {}; }
  catch { return {}; }
}
function setCart(cart) {
  try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); }
  catch (e) { console.error("Erreur sauvegarde panier:", e); }
}
function cartKey(productID, size) {
  const s = (size || "").trim();
  return s ? `${productID}::${s}` : productID;
}
function parseEUR(v){
  if (typeof v === 'number' && isFinite(v)) return v;
  const n = String(v||'').replace(/[^\d.-]/g,'');
  const f = parseFloat(n);
  return isFinite(f) ? f : 0;
}
function formatEUR(n){
  try{ return new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR'}).format(n||0); }
  catch{ return (n||0).toLocaleString('fr-FR') + ' €'; }
}

/* ============================================================
   2. ADD TO CART — bouton + modal
============================================================ */
function parseQuantityOrSizes(val) {
  if (!val) return { type: "qty", max: 1 };
  const str = String(val).trim();
  if (isNaN(str)) {
    const sizes = str.split(",").map(s => s.trim()).filter(Boolean);
    return { type: "sizes", sizes, max: 99 };
  }
  const max = parseInt(str, 10);
  return { type: "qty", max: Number.isFinite(max) && max > 0 ? max : 1 };
}

window.openLocalCartModal = function (button, productID, quantityOrSizes) {
  document.getElementById("cart-modal")?.remove();
  const parsed = parseQuantityOrSizes(quantityOrSizes);

  const sizeField = parsed.type === "sizes"
    ? `<label for="cart-size" class="cart-label">Taille</label>
       <select id="cart-size" class="cart-input">
         ${parsed.sizes.map(s => `<option value="${s}">${s}</option>`).join("")}
       </select>`
    : "";

  const modalHTML = `
    <div id="cart-modal">
      <div class="cart-modal-content">
        <button type="button" class="cart-close">×</button>
        <h2>Ajouter au panier</h2>
        ${sizeField}
        <label for="cart-quantity" class="cart-label">Quantité</label>
        <input type="number" id="cart-quantity" value="1" min="1" max="${parsed.max}">
        <button id="submit-cart" class="confirm">Confirmer</button>
        <button id="close-cart" class="cancel">Annuler</button>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML("beforeend", modalHTML);

  const modal = document.getElementById("cart-modal");
  function close(){ modal.remove(); }
  modal.querySelector(".cart-close").addEventListener("click", close);
  modal.querySelector("#close-cart").addEventListener("click", close);

  modal.querySelector("#submit-cart").addEventListener("click", () => {
    const qty = parseInt(document.getElementById("cart-quantity").value, 10);
    if (!qty || qty < 1) return alert("Quantité invalide.");
    let size = "";
    if (parsed.type === "sizes") {
      size = document.getElementById("cart-size").value;
      if (!size) return alert("Choisissez une taille.");
    }
    addToCart(button, productID, qty, size);
    close();
  });
};

function addToCart(button, productID, qty, size="") {
  const cart = getCart();
  const key = cartKey(productID, size);
  if (cart[key]) {
    cart[key].quantity = Math.min((cart[key].quantity || 0) + qty, 999);
  } else {
    cart[key] = {
      id: key,
      base_id: productID,
      name: button.dataset.name || "",
      price: button.dataset.price || "0",
      image: button.dataset.image || "",
      size: size,
      seller: button.dataset.soldBy || "",
      quantity: qty
    };
  }
  setCart(cart);

  // Feedback UI
  if (window.CartUI?.onAdded) {
    window.CartUI.onAdded(cart[key]);
  }
}

window.initializeLocalCartSystem = function () {
  document.querySelectorAll(".custom-add-to-cart-button").forEach(btn => {
    if (btn.dataset.listenerAdded) return;
    const productID = btn.dataset.productId;
    const qAttr = btn.dataset.quantity;
    btn.addEventListener("click", e => {
      e.preventDefault();
      openLocalCartModal(btn, productID, qAttr);
    });
    btn.dataset.listenerAdded = "true";
  });
};

document.addEventListener("DOMContentLoaded", () => {
  initializeLocalCartSystem();
});

/* ============================================================
   3. UI FEEDBACK — Toast + Drawer
============================================================ */
(function(){
  window.CartUI = window.CartUI || {};
  CartUI.MODE = "drawer"; // ← change ici "toast" ou "drawer"

  function mountOnce(){
    if(document.getElementById("oc-toast")) return;
    document.body.insertAdjacentHTML("beforeend", `
      <div id="oc-toast"><div class="oc-toast-card">
        <div id="oc-toast-img"></div>
        <div><strong id="oc-toast-title">Ajouté au panier</strong><br><span id="oc-toast-sub"></span></div>
        <a href="/cart">Voir le panier</a>
      </div></div>
      <div id="oc-drawer" aria-hidden="true">
        <div id="oc-drawer-backdrop"></div>
        <aside class="oc-drawer-panel">
          <h3>Mon panier</h3>
          <div id="oc-drawer-body"></div>
          <div class="oc-drawer-foot">Sous-total: <strong id="oc-drawer-sub">0 €</strong></div>
          <a href="/cart" class="btn">Passer au paiement</a>
        </aside>
      </div>
    `);
    document.getElementById("oc-drawer-backdrop").addEventListener("click", closeDrawer);
  }

  function showToast({name,image}){
    mountOnce();
    const t = document.getElementById("oc-toast");
    document.getElementById("oc-toast-title").textContent = "Ajouté au panier";
    document.getElementById("oc-toast-sub").textContent = name;
    document.getElementById("oc-toast-img").style.backgroundImage = `url(${image})`;
    t.classList.add("show");
    setTimeout(()=> t.classList.remove("show"), 3000);
  }

  function openDrawer(){
    mountOnce();
    const cart = Object.values(getCart());
    const body = document.getElementById("oc-drawer-body");
    const subEl = document.getElementById("oc-drawer-sub");
    let subtotal = 0;
    body.innerHTML = cart.map(it=>{
      const line = parseEUR(it.price) * (it.quantity||1);
      subtotal += line;
      return `<div><strong>${it.name}</strong> x${it.quantity} — ${formatEUR(line)}</div>`;
    }).join("");
    subEl.textContent = formatEUR(subtotal);
    document.getElementById("oc-drawer").setAttribute("aria-hidden","false");
  }
  function closeDrawer(){
    document.getElementById("oc-drawer").setAttribute("aria-hidden","true");
  }

  CartUI.onAdded = function(item){
    if(CartUI.MODE==="drawer"){ openDrawer(); }
    else{ showToast(item); }
  };
})();
</script>
