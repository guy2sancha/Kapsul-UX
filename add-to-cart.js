<script>
/* ============================================================
   ADD-TO-CART — Open Circle (Vanilla JS, localStorage)
   - Modal tailles/quantité (sans "max" visible)
   - Bouton Annuler sans bordure
   - Gère tailles (S,M,L) OU stock num. (ex: "3")
   - Récupère poids/dimensions/flags via data-*
   - UI feedback: toast (par défaut) ou drawer
   - Auto styles fallback
   ============================================================ */

/* ---------- Storage ---------- */
function getCart(){ try{ return JSON.parse(localStorage.getItem('localCart')) || {}; }catch{ return {}; } }
function setCart(cart){
  try{
    localStorage.setItem('localCart', JSON.stringify(cart));
    // notifier le reste du site (panier, header…)
    window.dispatchEvent(new StorageEvent('storage', { key:'localCart', newValue: JSON.stringify(cart) }));
  }catch(e){ console.error('localCart write error:', e); }
}
function cartKey(productID, size){ const s=(size||'').trim(); return s ? `${productID}::${s}` : productID; }

/* ---------- Parsers / helpers ---------- */
function parseQuantityOrSizes(val){
  if (val == null) return { type:'qty', max:1 };
  const str = String(val).trim();
  if (str === '') return { type:'qty', max:1 };
  if (isNaN(str)){
    const sizes = str.split(',').map(s=>s.trim()).filter(Boolean);
    return { type:'sizes', sizes, max:99 };
  }
  const max = parseInt(str,10);
  return { type:'qty', max: Number.isFinite(max)&&max>0 ? max : 1 };
}
function readNumAttr(el, ...names){
  for(const n of names){
    if (el.hasAttribute(n)){
      const raw = el.getAttribute(n);
      if (raw==='' || raw==null) continue;
      const s = String(raw).replace(/\s/g,'').replace('€','').replace(/\./g,'').replace(',', '.');
      const f = parseFloat(s);
      if (Number.isFinite(f)) return f;
    }
  }
  return 0;
}
function readBoolAttr(el, name){
  if (!el.hasAttribute(name)) return false;
  const v = (el.getAttribute(name)||'').toLowerCase().trim();
  return v==='true' || v==='1' || v==='yes';
}
function formatEUR(n){
  try{ return new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR'}).format(n||0); }
  catch{ return (n||0).toLocaleString('fr-FR') + ' €'; }
}
function parseEUR(v){
  if (typeof v==='number' && isFinite(v)) return v;
  const s = String(v||'').replace(/\s/g,'').replace('€','').replace(/\./g,'').replace(',', '.');
  const f = parseFloat(s);
  return isFinite(f) ? f : 0;
}

/* ---------- Modal ---------- */
window.openLocalCartModal = function(button, productID, quantityOrSizes){
  document.getElementById('cart-modal')?.remove();

  const parsed = parseQuantityOrSizes(quantityOrSizes);
  const cart = getCart();
  const already = Object.keys(cart).some(k=>k.startsWith(productID));

  const sizeField = parsed.type==='sizes'
    ? `<label for="cart-size" class="cart-label">Taille</label>
       <select id="cart-size" class="cart-input">
         ${parsed.sizes.map(s=>`<option value="${s}">${s}</option>`).join('')}
       </select>`
    : '';

  const qtyMax = parsed.max;
  const qtyField = `
    <label for="cart-quantity" class="cart-label">Quantité</label>
    <input type="number" id="cart-quantity" class="cart-input" min="1" ${Number.isFinite(qtyMax)?`max="${qtyMax}"`:''} value="1">
  `;

  const modalHTML = `
    <div id="cart-modal" aria-modal="true" role="dialog">
      <div class="cart-modal-content" role="document">
        <button type="button" class="cart-close" aria-label="Close">×</button>
        <h2 class="cart-title">Ajouter au panier</h2>
        <p class="cart-sub">Choisissez votre produit et la quantité</p>
        ${already ? `<p class="cart-note">Ce produit est dans votre panier</p>` : ``}
        ${sizeField}
        ${qtyField}
        <button id="submit-cart" class="confirm">Confirmer</button>
        <button id="close-cart" class="cancel">Annuler</button>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  ensureMinimalStyles(); // injecte styles si absents

  const modal = document.getElementById('cart-modal');
  const closeModal = () => { modal.remove(); document.removeEventListener('keydown', onEsc); };
  const onEsc = e => { if (e.key==='Escape') closeModal(); };

  document.addEventListener('keydown', onEsc);
  modal.querySelector('.cart-close').addEventListener('click', closeModal);
  modal.querySelector('#close-cart').addEventListener('click', closeModal);
  modal.addEventListener('click', e=>{ if (e.target===modal) closeModal(); });

  modal.querySelector('#submit-cart').addEventListener('click', ()=>{
    const qty = parseInt(document.getElementById('cart-quantity').value,10);
    if (!Number.isFinite(qty) || qty<1 || (Number.isFinite(qtyMax) && qty>qtyMax)){
      alert('Quantité invalide'); return;
    }
    let chosenSize = '';
    if (parsed.type==='sizes'){
      chosenSize = (document.getElementById('cart-size')?.value || '').trim();
      if (!chosenSize){ alert('Choisissez votre produit'); return; }
      button.setAttribute('data-size', chosenSize);
    }
    window.addToLocalCart(button, productID, qty, chosenSize);

    // feedback sur le bouton source (si unique par produit)
    const liveBtn = document.querySelector(`.custom-add-to-cart-button[data-product-id="${productID}"]`);
    if (liveBtn){ liveBtn.textContent='✔︎ Déjà dans votre panier'; liveBtn.classList.add('in-cart'); }

    closeModal();
  });
};

/* ---------- AJOUT AU PANIER ---------- */
window.addToLocalCart = function(button, productID, quantity, chosenSize=''){
  if (!button || !productID){ console.error('addToLocalCart: missing args'); return; }

  const cart = getCart();

  // Infos produit
  const name = button.getAttribute('data-name') || '';
  const price = button.getAttribute('data-price') || '';
  const image = button.getAttribute('data-image') || '';
  const size = chosenSize || button.getAttribute('data-size') || '';
  const condition = button.getAttribute('data-condition') || '';
  const seller = button.getAttribute('data-sold-by') || '';
  const freeShipping = (button.getAttribute('data-free-shipping')||'').toLowerCase()==='true';

  // Logistique (optionnel)
  const weightKg = readNumAttr(button, 'data-weight-kg','data-weight');
  const L = readNumAttr(button, 'data-l-cm','data-length');
  const W = readNumAttr(button, 'data-w-cm','data-width');
  const H = readNumAttr(button, 'data-h-cm','data-height');
  const fragile = readBoolAttr(button, 'data-fragile');
  const lithium = readBoolAttr(button, 'data-lithium');

  const key = cartKey(productID, size);
  const safeQty = Math.max(1, parseInt(quantity,10) || 1);

  if (cart[key]){
    cart[key].quantity = Math.min((cart[key].quantity||0) + safeQty, 999);
    if (weightKg) cart[key].weightKg = weightKg;
    if (L) cart[key].L = L;
    if (W) cart[key].W = W;
    if (H) cart[key].H = H;
    if (button.hasAttribute('data-fragile')) cart[key].fragile = fragile;
    if (button.hasAttribute('data-lithium')) cart[key].lithium = lithium;
  }else{
    cart[key] = {
      id: key,
      base_id: productID,
      name, price, image, size, condition, seller, freeShipping,
      quantity: safeQty,
      weightKg, L, W, H, fragile, lithium
    };
  }

  setCart(cart);

  // UI feedback
  if (window.CartUI && typeof window.CartUI.onAdded==='function'){
    window.CartUI.onAdded({ id:key, name, image });
  }
};

/* ---------- Init + Observers (DOM + route SPA) ---------- */
window.initializeLocalCartSystem = function(){
  const buttons = document.querySelectorAll('.custom-add-to-cart-button:not([data-listener-added])');
  const cart = getCart();

  buttons.forEach((button)=>{
    const productID = button.getAttribute('data-product-id');
    if (!productID) return;

    // label "déjà dans le panier" si n'importe quelle taille existe
    const inCart = Object.keys(cart).some(k=>k.startsWith(productID));
    if (inCart){ button.textContent='✔︎ Déjà dans votre panier'; button.classList.add('in-cart'); }

    const qAttr = button.getAttribute('data-quantity');
    button.addEventListener('click', (e)=>{
      e.preventDefault();
      const parsed = parseQuantityOrSizes(qAttr);
      window.openLocalCartModal(button, productID, qAttr || parsed.max || 1);
    });

    button.dataset.listenerAdded = 'true';
  });
};

(function bootstrap(){
  // léger délai si Softr/Airtable hydrate après
  setTimeout(()=>window.initializeLocalCartSystem(), 350);

  const domObs = new MutationObserver(()=> window.initializeLocalCartSystem());
  domObs.observe(document.body, { childList:true, subtree:true });

  // Sur changement d'URL (SPA)
  let last = location.href;
  const urlObs = new MutationObserver(()=>{
    if (location.href !== last){
      last = location.href;
      setTimeout(()=>window.initializeLocalCartSystem(), 350);
    }
  });
  urlObs.observe(document.body, { childList:true, subtree:true });
})();

/* ---------- UI: Toast & Drawer (choisir le mode) ---------- */
(function(){
  window.CartUI = window.CartUI || {};
  CartUI.MODE = CartUI.MODE || 'toast'; // 'toast' ou 'drawer'

  function ensureUIContainers(){
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

    // listeners close
    document.getElementById('oc-toast-close').addEventListener('click', hideToast);
    document.getElementById('oc-drawer-close').addEventListener('click', closeDrawer);
    document.getElementById('oc-drawer-x').addEventListener('click', closeDrawer);

    // esc global
    document.addEventListener('keydown', (e)=>{ if(e.key==='Escape'){ hideToast(); closeDrawer(); }});

    ensureMinimalStyles();
  }

  /* ----- Toast ----- */
  let toastTimer;
  function showToast({name,image}){
    ensureUIContainers();
    const el = document.getElementById('oc-toast');
    document.getElementById('oc-toast-title').textContent = 'Produit ajouté à votre panier';
    document.getElementById('oc-toast-sub').textContent = name || 'Ajouté avec succès';
    const img = document.getElementById('oc-toast-img');
    img.style.backgroundImage = image ? `url("${image}")` : 'none';

    clearTimeout(toastTimer);
    el.classList.add('show');
    toastTimer = setTimeout(hideToast, 3200);
  }
  function hideToast(){ document.getElementById('oc-toast')?.classList.remove('show'); }

  /* ----- Drawer ----- */
  function openDrawer({highlightId}={}){
    ensureUIContainers();
    const drawer = document.getElementById('oc-drawer');
    const body = document.getElementById('oc-drawer-body');
    const subEl = document.getElementById('oc-drawer-sub');

    const items = Object.values(getCart());
    let subtotal = 0;
    body.innerHTML = items.map(it=>{
      const unit = parseEUR(it.price);
      const line = unit * (parseInt(it.quantity,10)||1);
      subtotal += line;
      const hl = highlightId && it.id===highlightId ? ' data-hl="1"' : '';
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
    if (!drawer) return;
    drawer.classList.remove('open');
    setTimeout(()=> drawer.setAttribute('aria-hidden','true'), 200);
  }

  // Hook public
  CartUI.onAdded = function({id,name,image}){
    if (CartUI.MODE==='drawer') openDrawer({highlightId:id});
    else showToast({name,image});
  };

  // Expose pour debug si besoin
  CartUI.showToast = showToast; CartUI.hideToast = hideToast;
  CartUI.openDrawer = openDrawer; CartUI.closeDrawer = closeDrawer;
})();

/* ---------- Styles fallback auto (modal + toast + drawer) ---------- */
function ensureMinimalStyles(){
  if (document.getElementById('oc-addtocart-fallback-style')) return;
  const css = `
  /* Modal */
  #cart-modal{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.6);z-index:10000}
  #cart-modal .cart-modal-content{background:#fff;border-radius:12px;padding:24px;width:min(90vw,420px);font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,Arial;text-align:center;position:relative;box-shadow:0 10px 30px rgba(0,0,0,.25)}
  #cart-modal .cart-title{margin:0 0 6px;font-size:22px;font-weight:800;color:#0b1428}
  #cart-modal .cart-sub{margin:0 0 14px;color:#516077}
  #cart-modal .cart-note{margin:0 0 8px;color:#0b1428;font-weight:700}
  #cart-modal .cart-label{display:block;text-align:left;margin:12px 0 6px;font-weight:700}
  #cart-modal .cart-input{width:100%;padding:12px;border:1px solid #d1d5db;border-radius:8px;font-size:15px;text-align:center}
  #cart-modal .confirm{width:100%;margin-top:14px;padding:12px;border:0;border-radius:8px;background:#081326;color:#fff;font-weight:800;cursor:pointer}
  #cart-modal .cancel{width:100%;margin-top:10px;padding:12px;border:0;border-radius:8px;background:#f3f4f6;color:#0b1428;font-weight:700;cursor:pointer}
  #cart-modal .cart-close{position:absolute;top:10px;right:10px;width:32px;height:32px;border:0;background:#fff;border-radius:8px;cursor:pointer;font-size:18px}

  /* Toast */
  #oc-toast{position:fixed;right:16px;bottom:16px;transform:translateY(20px);opacity:0;pointer-events:none;transition:.25s ease;z-index:10000}
  #oc-toast.show{transform:translateY(0);opacity:1;pointer-events:auto}
  #oc-toast .oc-toast-card{display:flex;gap:12px;align-items:center;background:#0b1428;color:#fff;border-radius:12px;padding:12px 12px 12px 12px;min-width:280px;box-shadow:0 10px 30px rgba(0,0,0,.25)}
  #oc-toast .oc-toast-img{width:48px;height:48px;border-radius:8px;background:#111;background-size:cover;background-position:center}
  #oc-toast .oc-toast-text{flex:1}
  #oc-toast .oc-toast-cta{color:#fff;background:#bc012c;padding:8px 10px;border-radius:8px;font-weight:800;text-decoration:none}
  #oc-toast .oc-toast-x{margin-left:6px;background:transparent;border:0;color:#fff;font-size:18px;cursor:pointer}

  /* Drawer */
  #oc-drawer{position:fixed;inset:0;z-index:10000}
  #oc-drawer[aria-hidden="true"]{display:none}
  #oc-drawer .oc-drawer-backdrop{position:absolute;inset:0;background:rgba(0,0,0,.45);opacity:0;transition:.2s}
  #oc-drawer .oc-drawer-panel{position:absolute;top:0;right:0;height:100%;width:min(92vw,420px);background:#fff;transform:translateX(100%);transition:.2s;border-top-left-radius:14px;border-bottom-left-radius:14px;display:flex;flex-direction:column}
  #oc-drawer.open .oc-drawer-backdrop{opacity:1}
  #oc-drawer.open .oc-drawer-panel{transform:translateX(0)}
  .oc-drawer-head{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid #eceff3}
  .oc-drawer-body{padding:10px 16px;flex:1;overflow:auto}
  .oc-drawer-foot{padding:14px 16px;border-top:1px solid #eceff3}
  .oc-drawer-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
  .oc-drawer-cta{display:block;background:#0b1428;color:#fff;text-align:center;padding:12px;border-radius:10px;font-weight:800;text-decoration:none}
  .oc-drawer-x{background:transparent;border:0;font-size:18px;cursor:pointer}
  .oc-dl{display:flex;gap:10px;padding:10px 0;border-bottom:1px dashed #eceff3}
  .oc-dl-img{width:64px;height:64px;border-radius:10px;object-fit:cover;background:#f1f3f7}
  .oc-dl-meta{flex:1}
  .oc-dl-title{display:block}
  .oc-dl-sub{display:flex;gap:6px;flex-wrap:wrap;margin:4px 0}
  .oc-dl-chip{background:#eef2f7;border:1px solid #eceff3;border-radius:999px;padding:2px 8px;font-size:12px}
  .oc-dl-row{display:flex;align-items:center;justify-content:space-between}
  `;
  const style = document.createElement('style');
  style.id = 'oc-addtocart-fallback-style';
  style.textContent = css;
  document.head.appendChild(style);
}
</script>
