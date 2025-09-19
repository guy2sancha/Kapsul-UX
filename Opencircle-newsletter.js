<script>
(() => {
  const openBtn  = document.getElementById('openModal');
  const modal    = document.getElementById('signupModal');
  const closeBtn = document.getElementById('closeModal');
  const form     = document.getElementById('newsletterForm');
  const WEBHOOK  = 'https://hook.eu2.make.com/pr7auku6tnewoergph4knl5sx2ir6l8n';

  function openModal(){
    modal.style.display = 'flex';
    document.documentElement.classList.add('has-modal');
  }
  function closeModal(){
    modal.style.display = 'none';
    document.documentElement.classList.remove('has-modal');
  }

  openBtn.addEventListener('click', e => { e.preventDefault(); openModal(); });
  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const firstName = document.getElementById('firstName').value || '';
    const lastName  = document.getElementById('lastName').value  || '';
    const email     = document.getElementById('email').value?.trim();
    const country   = document.getElementById('country').value   || '';
    const interests = Array.from(document.querySelectorAll('input[name="interests"]:checked'))
                      .map(el => el.value).join(', ');

    if (!email) { alert('Please enter your email.'); return; }

    try{
      const res = await fetch(WEBHOOK, {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ firstName, lastName, email, country, interests })
      });
      if(!res.ok) throw new Error('Network error');
      alert("Thank you for joining Open Circle.\n\nWe've sent you a confirmation email.");
      closeModal();
      form.reset();
    }catch(err){
      console.error(err);
      alert('There was a problem. Please try again later.');
    }
  });
})();
</script>
