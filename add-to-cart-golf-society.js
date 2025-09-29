<script>
/* ============================================================
   JAPAN GOLF SOCIETY — Selection (LocalStorage)
   - Event delegation (no init)
   - Modal fields: Quantity, Loft, Available Shaft
   - Key = productID::loft::shaft
   ============================================================ */

/* ---------- Storage helpers ---------- */
const JGS_STORE_KEY = 'localCart';
function jgsReadBag(){ try{return JSON.parse(localStorage.getItem(JGS_STORE_KEY))||{};}catch{return{};} }
function jgsWriteBag(b){ try{ localStorage.setItem(JGS_STORE_KEY, JSON.stringify(b)); }catch(e){ console.error(e);} }

/* ---------- Key builder ---------- */
function jgsKey(productID, loft, shaft){
  const L = (loft||'').toString().trim();
  const S = (shaft||'').toString().trim();
  return [productID, L, S].filter(Boolean).join('::');
}

/* ---------- Utils ---------- */
function jgsToInt(v, def=1){ const n=parseInt(v,10); return Number.isFinite(n)&&n>0?n:def; }
function jgsParseList(s){
  if(!s) return [];
  return String(s).split(',').map(x=>x.trim()).filter(Boolean);
}

/* ---------- Modal UI ---------- */
function jgsEnsureModalStyles(){
  if(document.getElementById('jgs-modal-style')) return;
  const css = `
  /* Overlay */
  #jgs-cart-modal{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.6);z-index:10000}
  /* Box */
  .jgs-modal{background:#fff;border-radius:12px;padding:24px;width:min(90vw,440px);font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,Arial;box-shadow:0 10px 30px rgba(0,0,0,.25);position:relative;text-align:center}
  .jgs-modal h2{margin:0 0 8px;font-size:22px;font-weight:800;color:#0b1428}
  .jgs-modal p{margin:0 0 14px;color:#516077}
  .jgs-label{display:block;text-align:left;margin:12px 0 6px;font-weight:700}
  .jgs-input{width:100%;padding:12px;border:1px solid #d1d5db;border-radius:8px;font-size:15px}
  .jgs-pill{width:100%;padding:12px;border:1px dashed #d1d5db;border-radius:8px;background:#fafafa;font-size:15px;text-align:center}
  .jgs-btn{width:100%;padding:12px;border:0;border-radius:8px;font-weight:800;cursor:pointer}
  .jgs-btn--dark{background:#081326;color:#fff;margin-top:14px}
  .jgs-btn--light{background:#f3f4f6;color:#0b1428;margin-top:10px}
  .jgs-close{position:absolute;top:10px;right:10px;width:32px;height:32px;border:0;background:#fff;border-radius:8px;cursor:pointer;font-size:18px}
  .custom-add-to-cart-button.in-cart{background:#081326!important;color:#fff!important;border-color:#081326!important;cursor:default}
  /* Toast */
  #jgs-toast{position:fixed;left:0;right:0;bottom:-140px;display:flex;justify-content:center;pointer-events:none;transition:bottom .25s ease;z-index:10001}
  #jgs-toast.show{bottom:18px}
  #jgs-toast .card{pointer-events:auto;display:grid;grid-template-columns:56px 1fr auto 32px;gap:12px;align-items:center;background:#0b1428;color:#fff;border-radius:14px;padding:12px;box-shadow:0 15px 40px rgba(0,0,0,.28);width:min(94vw,680px)}
  #jgs-toast .img{width:56px;height:56px;border-radius:10px;background:#fff;background-size:cover;background-position:center}
  #jgs-toast strong{font-weight:900;display:block}
  #jgs-toast span{opacity:.85;font-size:.92rem}
  #jgs-toast .cta{background:#fff;color:#0b1428;text-decoration:none;font-weight:900;padding:10px 12px;border-radius:10px;white-space:nowrap}
  #jgs-toast .x{width:32px;height:32px;border:0;background:transparent;color:#fff;font-size:20px;cursor:pointer}
  `;
  const el = document.createElement('style');
  el.id='jgs-modal-style';
  el.textContent = css;
  document.head.appendChild(el);
}

function jgsShowToast({name, image, ctaHref='/request'}={}){
  let host = document.getElementById('jgs-toast');
  if(!host){
    host = document.createElement('div');
    host.id='jgs-toast';
    host.innerHTML = `
      <div class="card">
        <div class="img" id="jgs-toast-img" aria-hidden="true"></div>
        <div class="txt">
          <strong>Added to your selection</strong>
          <span id="jgs-toast-sub">Saved successfully</span>
        </div>
        <a class="cta" id="jgs-toast-cta" href="/request">Open selection</a>
        <button class="x" id="jgs-toast-x" aria-label="Close">×</button>
      </div>`;
    document.body.appendChild(host);
    document.getElementById('jgs-toast-x').addEventListener('click', ()=> host.classList.remove('show'));
  }
  const img = document.getElementById('jgs-toast-img');
  const sub = document.getElementById('jgs-toast-sub');
  const cta = document.getElementById('jgs-toast-cta');
  img.style.backgroundImage = image ? `url("${image}")` : 'none';
  sub.textContent = name ? name : 'Saved successfully';
  if (ctaHref) cta.href = ctaHref;
  host.classList.add('show');
  clearTimeout(host._t);
  host._t = setTimeout(()=> host.classList.remove('show'), 3200);
}

function jgsCloseModal(){
  const m = document.getElementById('jgs-cart-modal');
  if(m){ m.remove(); document.removeEventListener('keydown', jgsEscHandler); }
}
function jgsEscHandler(e){ if(e.key==='Escape') jgsCloseModal(); }

function jgsOpenModal(button, productID){
  jgsEnsureModalStyles();

  const loftAttr = button.getAttribute('data-loft') || '';
  const shaftAttr = button.getAttribute('data-available-shaft') || '';
  const loftOptions = jgsParseList(loftAttr);     // supports "50,52,54"
  const shaftOptions = jgsParseList(shaftAttr);   // supports list or empty

  const bag = jgsReadBag();
  const already = Object.keys(bag).some(k=>k.startsWith(productID));

  let loftField='';
  if(loftOptions.length>1){
    loftField = `
      <label class="jgs-label" for="jgs-loft">Loft</label>
      <select id="jgs-loft" class="jgs-input">
        ${loftOptions.map(l=>`<option value="${l}">${l}°</option>`).join('')}
      </select>`;
  } else if (loftOptions.length===1){
    loftField = `
      <label class="jgs-label">Loft</label>
      <div id="jgs-loft-pill" class="jgs-pill">${loftOptions[0]}°</div>`;
  } else {
    loftField = `
      <label class="jgs-label" for="jgs-loft-free">Loft</label>
      <input id="jgs-loft-free" class="jgs-input" placeholder="e.g. 52°">`;
  }

  let shaftField='';
  if(shaftOptions.length){
    shaftField = `
      <label class="jgs-label" for="jgs-shaft">Available Shaft</label>
      <select id="jgs-shaft" class="jgs-input">
        ${shaftOptions.map(s=>`<option value="${s}">${s}</option>`).join('')}
      </select>`;
  } else {
    shaftField = `
      <label class="jgs-label" for="jgs-shaft-free">Available Shaft</label>
      <input id="jgs-shaft-free" class="jgs-input" placeholder="Type or paste shaft">`;
  }

  const html = `
    <div id="jgs-cart-modal" role="dialog" aria-modal="true">
      <div class="jgs-modal" role="document">
        <button class="jgs-close" aria-label="Close">×</button>
        <h2>Add to My Selection</h2>
        <p>Choose your options below.</p>
        ${already?`<p class="jgs-note" style="margin:0 0 8px;color:#0b1428;font-weight:700">This product already exists in your selection</p>`:''}
        <label class="jgs-label" for="jgs-qty">Quantity</label>
        <input id="jgs-qty" class="jgs-input" type="number" min="1" value="1">
        ${loftField}
        ${shaftField}
        <button class="jgs-btn jgs-btn--dark" id="jgs-confirm">Confirm</button>
        <button class="jgs-btn jgs-btn--light" id="jgs-cancel">Cancel</button>
      </div>
    </div>`;
  document.body.insertAdjacentHTML('beforeend', html);

  const modal = document.getElementById('jgs-cart-modal');
  const confirmBtn = document.getElementById('jgs-confirm');
  const cancelBtn = document.getElementById('jgs-cancel');
  const closeBtn = modal.querySelector('.jgs-close');

  const resolveLoft = ()=>{
    if(document.getElementById('jgs-loft')) return document.getElementById('jgs-loft').value.trim();
    if(document.getElementById('jgs-loft-pill')) return (loftOptions[0]||'').toString();
    if(document.getElementById('jgs-loft-free')) return document.getElementById('jgs-loft-free').value.trim();
    return '';
    };
  const resolveShaft = ()=>{
    if(document.getElementById('jgs-shaft')) return document.getElementById('jgs-shaft').value.trim();
    if(document.getElementById('jgs-shaft-free')) return document.getElementById('jgs-shaft-free').value.trim();
    return '';
  };

  function onConfirm(){
    const qty = jgsToInt(document.getElementById('jgs-qty')?.value, 1);
    const loft = resolveLoft();
    const shaft = resolveShaft();
    jgsAddToSelection(button, productID, qty, loft, shaft);
    button.textContent = "✔︎ In your selection";
    button.classList.add("in-cart");
    jgsCloseModal();
  }

  document.addEventListener('keydown', jgsEscHandler);
  confirmBtn.addEventListener('click', onConfirm);
  cancelBtn.addEventListener('click', jgsCloseModal);
  closeBtn.addEventListener('click', jgsCloseModal);
  modal.addEventListener('click', (e)=>{ if(e.target===modal) jgsCloseModal(); });
}

/* ---------- Add to selection ---------- */
function jgsAddToSelection(button, productID, quantity, loft, shaft){
  const bag = jgsReadBag();

  const name = button.getAttribute('data-name') || '';
  const price = button.getAttribute('data-price') || '';
  const image = button.getAttribute('data-image') || '';
  const condition = button.getAttribute('data-condition') || '';
  const seller = button.getAttribute('data-sold-by') || '';
  const category = button.getAttribute('data-main-category') || '';
  const fallbackLoft = button.getAttribute('data-loft') || '';
  const finalLoft = (loft || fallbackLoft || '').toString().trim();
  const finalShaft = (shaft || '').toString().trim();

  const key = jgsKey(productID, finalLoft, finalShaft);

  if (bag[key]) {
    bag[key].quantity = Math.min((bag[key].quantity||0) + quantity, 999);
  } else {
    bag[key] = {
      id: key,
      base_id: productID,
      name, price, image, condition, seller, category,
      loft: finalLoft, shaft: finalShaft,
      quantity
    };
  }
  jgsWriteBag(bag);

  jgsShowToast({ name, image, ctaHref: '/request' });
}

/* ---------- Event delegation (no init required) ---------- */
document.addEventListener('click', function(e){
  const btn = e.target.closest('.custom-add-to-cart-button');
  if(!btn) return;

  let productID = btn.getAttribute('data-product-id');
  if(!productID){
    productID = 'auto-' + (btn.id || (Date.now()+'-'+Math.floor(Math.random()*1e6)));
    btn.setAttribute('data-product-id', productID);
    console.warn('[JGS] data-product-id missing, assigned:', productID);
  }
  e.preventDefault();
  jgsOpenModal(btn, productID);
});

/* ---------- Mark existing buttons as "in selection" ---------- */
function jgsMarkButtons(){
  const bag = jgsReadBag();
  const ids = new Set(Object.keys(bag).map(k => k.split('::')[0]));
  document.querySelectorAll('.custom-add-to-cart-button').forEach(btn=>{
    const id = btn.getAttribute('data-product-id');
    if(id && ids.has(id)){
      btn.textContent = "✔︎ In your selection";
      btn.classList.add('in-cart');
    }
  });
}
document.addEventListener('DOMContentLoaded', jgsMarkButtons);
const jgsObs = new MutationObserver(jgsMarkButtons);
jgsObs.observe(document.body, {childList:true, subtree:true});
</script>
