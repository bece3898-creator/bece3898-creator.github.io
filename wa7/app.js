/* =============================
   Utilities & State
============================= */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const state = {
  prefs: {
    highContrast: JSON.parse(localStorage.getItem('pref_highContrast') || 'false'),
    reduceMotion: JSON.parse(localStorage.getItem('pref_reduceMotion') || 'false'),
    saved: new Set(JSON.parse(localStorage.getItem('savedItems') || '[]')),
  }
};

function savePrefs() {
  localStorage.setItem('pref_highContrast', JSON.stringify(state.prefs.highContrast));
  localStorage.setItem('pref_reduceMotion', JSON.stringify(state.prefs.reduceMotion));
}
function persistSaved() {
  localStorage.setItem('savedItems', JSON.stringify(Array.from(state.prefs.saved)));
}
function applyPrefs() {
  document.documentElement.classList.toggle('hc', state.prefs.highContrast);
  document.documentElement.classList.toggle('motion', !state.prefs.reduceMotion);
}

/* =============================
   Prefs UI (mirrored controls)
============================= */
function initPrefsUI() {
  const pairs = [
    { key: 'highContrast', btn: $('#contrastToggle'), mirrorBtn: $('#contrastToggle2'), type: 'button' },
    { key: 'reduceMotion', btn: $('#reduceMotionToggle'), mirrorBtn: $('#reduceMotionToggle2'), type: 'checkbox' },
  ];

  pairs.forEach(({ key, btn, mirrorBtn, type }) => {
    const setUI = (val) => {
      [btn, mirrorBtn].forEach(el => {
        if (!el) return;
        if (type === 'button') el.setAttribute('aria-pressed', String(!!val));
        else el.checked = !!val;
      });
    };
    const toggle = () => {
      state.prefs[key] = !state.prefs[key];
      applyPrefs();
      savePrefs();
      setUI(state.prefs[key]);
    };

    [btn, mirrorBtn].forEach(el => {
      if (!el) return;
      if (type === 'button') el.addEventListener('click', toggle);
      else el.addEventListener('change', toggle);
    });

    // Initialize UI to current state
    setUI(state.prefs[key]);
  });
}

/* =============================
   Spotlight cards (Home)
============================= */
function initSpotlightCards() {
  $$('.spotlight .card').forEach(card => {
    card.addEventListener('click', (e) => {
      const t = e.target;
      if (!(t instanceof HTMLElement)) return;

      if (t.dataset.action === 'details') {
        const controls = t.getAttribute('aria-controls');
        const expanded = t.getAttribute('aria-expanded') === 'true';
        const details = controls ? document.getElementById(controls) : null;
        if (details) {
          details.hidden = expanded;
          t.setAttribute('aria-expanded', String(!expanded));
        }
      }

      if (t.dataset.action === 'save') {
        const id = t.dataset.id;
        if (id) {
          if (state.prefs.saved.has(id)) state.prefs.saved.delete(id);
          else state.prefs.saved.add(id);
          persistSaved();
          t.textContent = state.prefs.saved.has(id) ? 'Saved' : 'Save';
        }
      }
    });

    // Keyboard: Enter toggles details
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const btn = $('[data-action="details"]', card);
        if (btn) btn.click();
      }
    });

    // Initialize save button text
    const saveBtn = $('[data-action="save"]', card);
    if (saveBtn && saveBtn.dataset.id) {
      saveBtn.textContent = state.prefs.saved.has(saveBtn.dataset.id) ? 'Saved' : 'Save';
    }
  });
}

/* =============================
   Listings page data & filter
============================= */
const MOCK_DATA = [
  { id: 'c1', title: 'Winter Coat (M)', cat: 'outerwear', size: 'M', price: 35, img: 'images/coat.jpg', details: 'Condition: Excellent. Pickup at UMC.' },
  { id: 'c2', title: 'Leather Boots (9)', cat: 'shoes', size: 'M', price: 20, img: 'images/boots.jpg', details: 'Toe scuffs. Pickup at Norlin.' },
  { id: 'c3', title: 'CU Hoodie (L)', cat: 'tops', size: 'L', price: 15, img: 'images/hoodie.jpg', details: 'Cozy fleece. East Campus.' },
  { id: 'c4', title: 'Black Jeans (S)', cat: 'bottoms', size: 'S', price: 12, img: 'images/jeans.jpg', details: 'Skinny fit. UMC.' },
  { id: 'c5', title: 'Puffer Jacket (XS)', cat: 'outerwear', size: 'XS', price: 28, img: 'images/puffer.jpg', details: 'Very warm. Williams Village.' },
];

function qsParam(name, url = window.location.href) {
  try {
    const u = new URL(url, window.location.origin);
    return u.searchParams.get(name) || '';
  } catch {
    return '';
  }
}

function filterData(root = document) {
  const q = (qsParam('q') || $('#search', root)?.value || '').toLowerCase();
  const cat = qsParam('cat') || $('#category', root)?.value || '';
  const size = qsParam('size') || $('#size', root)?.value || '';

  return MOCK_DATA.filter(item => {
    const matchQ = q ? item.title.toLowerCase().includes(q) : true;
    const matchCat = cat ? item.cat === cat : true;
    const matchSize = size ? item.size === size : true;
    return matchQ && matchCat && matchSize;
  });
}

function renderResults(items, root = document) {
  const grid = $('#resultsGrid', root);
  const tpl = $('#cardTpl', root);
  const status = $('#resultsStatus', root);
  if (!grid || !tpl || !status) return;

  grid.innerHTML = '';
  if (!items.length) {
    grid.innerHTML = `<p>${grid.dataset.emptyMsg || 'No results.'}</p>`;
    status.textContent = '0 results.';
    return;
  }

  const frag = document.createDocumentFragment();
  items.forEach(item => {
    const node = tpl.content.cloneNode(true);
    const img = node.querySelector('img');
    const h3 = node.querySelector('h3');
    const meta = node.querySelector('.meta');
    const details = node.querySelector('.details');
    const saveBtn = node.querySelector('[data-action="save"]');
    const detailsBtn = node.querySelector('[data-action="details"]');

    img.src = item.img; img.alt = item.title;
    h3.textContent = item.title;
    meta.textContent = `${item.cat} · ${item.size} · $${item.price}`;
    details.textContent = item.details;
    details.id = item.id + '-details';
    detailsBtn.setAttribute('aria-controls', details.id);

    // Save button
    saveBtn.addEventListener('click', () => {
      if (state.prefs.saved.has(item.id)) state.prefs.saved.delete(item.id);
      else state.prefs.saved.add(item.id);
      persistSaved();
      saveBtn.textContent = state.prefs.saved.has(item.id) ? 'Saved' : 'Save';
    });
    saveBtn.textContent = state.prefs.saved.has(item.id) ? 'Saved' : 'Save';

    // Details button
    detailsBtn.addEventListener('click', () => {
      const expanded = detailsBtn.getAttribute('aria-expanded') === 'true';
      details.hidden = expanded;
      detailsBtn.setAttribute('aria-expanded', String(!expanded));
    });

    frag.appendChild(node);
  });

  grid.appendChild(frag);
  status.textContent = `${items.length} result${items.length === 1 ? '' : 's'} loaded.`;
}

function initListingsPage() {
  const grid = $('#resultsGrid');
  if (!grid) return; // not on listings page

  // Initial render (works even when navigated with GET params)
  renderResults(filterData(document), document);

  // Live filtering
  const form = $('#filterForm');
  if (form) {
    form.addEventListener('input', (e) => {
      if (!(e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement)) return;
      renderResults(filterData(document), document);
    });
  }
}

/* =============================
   Events loader (Home)
============================= */
async function loadEvents() {
  const list = $('#eventsList');
  const loading = $('#eventsLoading');
  const err = $('#eventsError');
  if (!list || !loading || !err) return; // not on home

  loading.hidden = false;
  try {
    // Simulated delay; replace with real fetch if available
    await new Promise(r => setTimeout(r, 400));
    const events = [
      { when: 'Fri 7pm', what: 'UMC Courtyard Swap' },
      { when: 'Sat 11am', what: 'East Campus Pop-up' },
    ];
    list.innerHTML = events.map(e => `<li><strong>${e.when}:</strong> ${e.what}</li>`).join('');
    err.hidden = true;
  } catch {
    err.hidden = false;
  } finally {
    loading.hidden = true;
  }
}

/* =============================
   Init
============================= */
function initFooterYear() {
  const y = $('#year');
  if (y) y.textContent = String(new Date().getFullYear());
}

function ready(fn){
  if (document.readyState !== 'loading') fn();
  else document.addEventListener('DOMContentLoaded', fn);
}

ready(() => {
  applyPrefs();
  initPrefsUI();
  initSpotlightCards();
  initListingsPage();
  loadEvents();
  initFooterYear();
});