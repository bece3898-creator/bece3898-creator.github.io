/* =============================
const size = qsParam('size') || $('#size', root)?.value || '';

const out = MOCK_DATA.filter(item => {
const matchQ = q ? item.title.toLowerCase().includes(q) : true;
const matchCat = cat ? item.cat === cat : true;
const matchSize = size ? item.size === size : true;
return matchQ && matchCat && matchSize;
});
return out;
}

function initListingsPage() {
const root = document;
const grid = $('#resultsGrid', root);
if (!grid) return; // Only on listings page

// Initial render using query params (works with/without JS)
renderResults(filterData(root), root);

// Live filtering: input/change events
const form = $('#filterForm', root);
if (form) {
form.addEventListener('input', (e) => {
if (!(e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement)) return;
renderResults(filterData(root), root);
});
}
}

/* =============================
Feature 3: Events loader (fetch with error handling)
Progressive enhancement: noscript fallback link
============================= */
async function loadEvents() {
const list = $('#eventsList');
const loading = $('#eventsLoading');
const err = $('#eventsError');
if (!list || !loading || !err) return; // Only on homepage

loading.hidden = false;
try {
// Fake a small delayed load; replace with real endpoint if available
await new Promise(r => setTimeout(r, 400));
const events = [
{ when: 'Fri 7pm', what: 'UMC Courtyard Swap' },
{ when: 'Sat 11am', what: 'East Campus Pop-up' },
];
list.innerHTML = events.map(e => `<li><strong>${e.when}:</strong> ${e.what}</li>`).join('');
err.hidden = true;
} catch (e) {
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