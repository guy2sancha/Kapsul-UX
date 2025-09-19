// Opencircle-newsletter.js

// Attendre qu'un élément existe dans le DOM (utile quand le HTML est injecté dynamiquement)
function waitFor(selector, { timeout = 8000, interval = 50 } = {}) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    (function check() {
      const el = document.querySelector(selector);
      if (el) return resolve(el);
      if (Date.now() - start >= timeout) return reject(new Error(`waitFor timeout: ${selector}`));
      setTimeout(check, interval);
    })();
  });
}

// Helpers modal
function openModal() {
  const modal = document.getElementById('signupModal');
  if (!modal) return;
  modal.style.display = 'flex';
  document.documentElement.classList.add('has-modal');
}

function closeModal() {
  const modal = document.getElementById('signupModal');
  if (!modal) return;
  modal.style.display = 'none';
  document.documentElement.classList.remove('has-modal');
}

(async function init() {
  try {
    // 1) S'assurer que le HTML injecté est là
    await waitFor('#signupModal');
    await waitFor('#newsletterForm');

    // 2) Délégation d’événements (marche même si le HTML est remplacé par innerHTML)
    document.addEventListener('click', (e) => {
      // Ouvrir (bouton "S’inscrire")
      const openBtn = e.target.closest('#openModal');
      if (openBtn) {
        e.preventDefault();
        openModal();
        return;
      }

      // Fermer (bouton X)
      const closeBtn = e.target.closest('#closeModal');
      if (closeBtn) {
        e.preventDefault();
        closeModal();
        return;
      }

      // Fermer (clic hors carte)
      const modal = document.getElementById('signupModal');
      if (modal && e.target === modal) {
        closeModal();
      }
    });

    // Escape pour fermer
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });

    // 3) Soumission du formulaire
    const form = document.getElementById('newsletterForm');
    const WEBHOOK = 'https://hook.eu2.make.com/pr7auku6tnewoergph4knl5sx2ir6l8n';

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Récupérer les champs s’ils existent (défensif)
      const firstNameEl = document.getElementById('firstName');
      const lastNameEl  = document.getElementById('lastName');
      const emailEl     = document.getElementById('email');
      const countryEl   = document.getElementById('country'); // optionnel dans ton HTML
      const interestEls = document.querySelectorAll('input[name="interests"]:checked');

      const firstName = firstNameEl ? firstNameEl.value : '';
      const lastName  = lastNameEl  ? lastNameEl.value  : '';
      const email     = emailEl     ? emailEl.value.trim() : '';
      const country   = countryEl   ? countryEl.value   : '';
      const interests = interestEls.length
        ? Array.from(interestEls).map(el => el.value).join(', ')
        : '';

      if (!email) { alert('Please enter your email.'); return; }

      try {
        const res = await fetch(WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ firstName, lastName, email, country, interests })
        });
        if (!res.ok) throw new Error('Network error');

        alert("Thank you for joining Open Circle.\n\nWe've sent you a confirmation email.");
        closeModal();
        form.reset();
      } catch (err) {
        console.error(err);
        alert('There was a problem. Please try again later.');
      }
    });

    // (Optionnel) Log utile en dev
    // console.log('[newsletter] JS initialisé et listeners posés.');
  } catch (err) {
    console.error('[newsletter] Init error:', err);
  }
})();
