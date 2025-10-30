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
  localStorage.setItem('savedItems', JSON.stringify([...state.prefs.saved]));
  updateSavedBadge();
}
function applyPrefs() {
  document.documentElement.classList.toggle('hc', state.prefs.highContrast);
  // We apply a helper class only when motion is allowed (so transitions can exist)
  document.documentElement.classList.toggle('motion', !state.prefs.reduceMotion);
}

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
      announce(`${key === 'highContrast' ? 'High contrast' : 'Reduced motion'} ${state.prefs[key] ? 'on' : 'off'}.`);
    };

    [btn, mirrorBtn].forEach(el => {
      if (!el) return;
      if (type === 'button') el.addEventListener('click', toggle);
      else el.addEventListener('change', toggle);
    });

    setUI(state.prefs[key]);
  });
}


function announce(msg) {
  const live = $('#live');
  if (!live) return;
  live.textContent = '';
  requestAnimationFrame(() => (live.textContent = msg));
}

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
          if (!expanded) details.focus();
        }
      }

      if (t.dataset.action === 'save') {
        const id = t.dataset.id;
        if (id) {
          if (state.prefs.saved.has(id)) state.prefs.saved.delete(id);
          else state.prefs.saved.add(id);
          persistSaved();
          t.textContent = state.prefs.saved.has(id) ? 'Saved' : 'Save';
          announce(state.prefs.saved.has(id) ? 'Item saved.' : 'Item removed from saved.');
          renderSavedSection(); // keep Saved up to date on home
        }
      }
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const btn = $('[data-action="details"]', card);
        if (btn) btn.click();
      }
    });

    const saveBtn = $('[data-action="save"]', card);
    if (saveBtn?.dataset.id) {
      saveBtn.textContent = state.prefs.saved.has(saveBtn.dataset.id) ? 'Saved' : 'Save';
    }
  });
}

const MOCK_DATA = [
  { id: 'c1', title: 'Winter Coat (M)', cat: 'outerwear', size: 'M', price: 35, img: 'images/coat.jpg', w: 640, h: 480, details: 'Condition: Excellent. Pickup at UMC.' },
  { id: 'c2', title: 'Leather Boots (9)', cat: 'shoes', size: 'M', price: 20, img: 'images/boots.jpg', w: 640, h: 480, details: 'Toe scuffs. Pickup at Norlin.' },
  { id: 'c3', title: 'CU Hoodie (L)', cat: 'tops', size: 'L', price: 15, img: 'images/hoodie.jpg', w: 640, h: 480, details: 'Cozy fleece. East Campus.' },
  { id: 'c4', title: 'Black Jeans (S)', cat: 'bottoms', size: 'S', price: 12, img: 'images/jeans.jpg', w: 640, h: 480, details: 'Skinny fit. UMC.' },
  { id: 'c5', title: 'Puffer Jacket (XS)', cat: 'outerwear', size: 'XS', price: 28, img: 'images/puffer.jpg', w: 640, h: 480, details: 'Very warm. Williams Village.' },
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

function cardImageHTML(item) {
  const src = item.img;
  const src2x = item.img.replace('.jpg', '@2x.jpg');
  return `
    <img
      src="${src}"
      srcset="${src} 1x, ${src2x} 2x"
      alt="${item.title}"
      width="${item.w}" height="${item.h}"
      loading="lazy"
      decoding="async"
    />
  `;
}

function renderResults(items, root = document) {
  const grid = $('#resultsGrid', root);
  const status = $('#resultsStatus', root);
  if (!grid || !status) return;

  grid.innerHTML = '';
  if (!items.length) {
    grid.innerHTML = `<p>${grid.dataset.emptyMsg || 'No results.'}</p>`;
    status.textContent = '0 results.';
    return;
  }

  const frag = document.createDocumentFragment();
  items.forEach(item => {
    const article = document.createElement('article');
    article.className = 'card';
    article.tabIndex = 0;
    article.innerHTML = `
      ${cardImageHTML(item)}
      <div class="card-body">
        <h3>${item.title}</h3>
        <p class="meta">${item.cat} · ${item.size} · $${item.price}</p>
        <div class="actions">
          <button class="btn btn-small" data-action="save" data-id="${item.id}">${state.prefs.saved.has(item.id) ? 'Saved' : 'Save'}</button>
          <button class="btn btn-small" data-action="details" aria-expanded="false" aria-controls="${item.id}-details">Details</button>
        </div>
        <div class="details" id="${item.id}-details" hidden tabindex="-1">${item.details}</div>
      </div>
    `;

    article.addEventListener('click', (e) => {
      const t = e.target;
      if (!(t instanceof HTMLElement)) return;

      if (t.dataset.action === 'save') {
        if (state.prefs.saved.has(item.id)) state.prefs.saved.delete(item.id);
        else state.prefs.saved.add(item.id);
        persistSaved();
        t.textContent = state.prefs.saved.has(item.id) ? 'Saved' : 'Save';
        renderSavedSection(); 
      }
      if (t.dataset.action === 'details') {
        const details = document.getElementById(`${item.id}-details`);
        const expanded = t.getAttribute('aria-expanded') === 'true';
        if (details) {
          details.hidden = expanded;
          t.setAttribute('aria-expanded', String(!expanded));
          if (!expanded) details.focus();
        }
      }
    });

    article.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') article.querySelector('[data-action="details"]')?.click();
    });

    frag.appendChild(article);
  });

  grid.appendChild(frag);
  status.textContent = `${items.length} result${items.length === 1 ? '' : 's'} loaded.`;
}


function renderSavedSection() {
  const wrap = $('#savedSection');
  if (!wrap) return;

  const savedIds = [...state.prefs.saved];
  if (!savedIds.length) {
    wrap.innerHTML = `<p>No saved items yet. Use “Save” to bookmark listings.</p>`;
    return;
  }

  const items = MOCK_DATA.filter(i => savedIds.includes(i.id));
  const list = items.map(i => `
    <li>
      <a href="resources.html?q=${encodeURIComponent(i.title)}" class="saved-link">${i.title}</a>
      <button class="btn btn-small" data-unsave="${i.id}" aria-label="Remove ${i.title} from saved">Remove</button>
    </li>
  `).join('');

  wrap.innerHTML = `<ul class="saved-list">${list}</ul>`;

  $$('[data-unsave]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-unsave');
      state.prefs.saved.delete(id);
      persistSaved();
      renderSavedSection();
      $$('#resultsGrid [data-action="save"]').forEach(b => {
        if (b.dataset.id === id) b.textContent = 'Save';
      });
    });
  });
}

function updateSavedBadge() {
  const badge = $('#savedCount');
  if (badge) badge.textContent = String(state.prefs.saved.size);
}

function initListingsPage() {
  const grid = $('#resultsGrid');
  if (!grid) return;

  const q = qsParam('q'), cat = qsParam('cat'), size = qsParam('size');
  if ($('#search')) $('#search').value = q || '';
  if ($('#category')) $('#category').value = cat || '';
  if ($('#size')) $('#size').value = size || '';

  renderResults(filterData(document), document);

  const form = $('#filterForm');
  if (form) {
    form.addEventListener('input', (e) => {
      if (!(e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement)) return;
      renderResults(filterData(document), document);
      const params = new URLSearchParams(new FormData(form)).toString();
      const url = params ? `resources.html?${params}` : 'resources.html';
      history.replaceState(null, '', url);
    });
  }
}


async function loadEvents() {
  const list = $('#eventsList');
  const loading = $('#eventsLoading');
  const err = $('#eventsError');
  if (!list || !loading || !err) return;

  loading.hidden = false;
  try {
    const res = await fetch('events.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error('Network');
    const events = await res.json(); 
    if (!Array.isArray(events)) throw new Error('Malformed');

    list.innerHTML = events.map(e => `<li><strong>${e.when}:</strong> ${e.what}</li>`).join('');
    err.hidden = true;
  } catch {
    err.hidden = false;
    list.innerHTML = '';
  } finally {
    loading.hidden = true;
  }
}

function initFooterYear() {
  const y = $('#year');
  if (y) y.textContent = String(new Date().getFullYear());
}

function ready(fn) {
  if (document.readyState !== 'loading') fn();
  else document.addEventListener('DOMContentLoaded', fn);
}

ready(() => {
  applyPrefs();
  initPrefsUI();
  initSpotlightCards();
  initListingsPage();
  renderSavedSection();
  loadEvents();
  initFooterYear();
  updateSavedBadge();
});