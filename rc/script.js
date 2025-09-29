// Year in footer
document.getElementById('year').textContent = new Date().getFullYear();

// Mobile nav
const toggle = document.querySelector('.nav-toggle');
const nav = document.getElementById('primary-nav');
if (toggle) {
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
}

// Waitlist forms (demo only)
function handleWaitlist(form) {
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = form.querySelector('input[type="email"]');
    const msg = form.querySelector('.form-msg');
    if (!email?.value) return;
    msg.textContent = 'Thanks — we’ll email you when the pilot opens.';
    form.reset();
  });
}
handleWaitlist(document.getElementById('waitlist-form'));
handleWaitlist(document.getElementById('waitlist-form-2'));

// Press modal
const modal = document.getElementById('press-modal');
const pressLinks = document.querySelectorAll('.press-link, .footer-press');
const closeBtns = document.querySelectorAll('.close-modal');

pressLinks.forEach(el => {
  el.addEventListener('click', () => {
    if (typeof modal.showModal === 'function') {
      modal.showModal();
    } else {
      location.hash = '#press';
    }
  });
});

closeBtns.forEach(btn => {
  btn.addEventListener('click', () => modal.close());
});

modal?.addEventListener('cancel', (e) => {
  e.preventDefault();
  modal.close();
});