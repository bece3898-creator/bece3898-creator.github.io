const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const state = {
  prefs: {
    highContrast: JSON.parse(localStorage.getItem("pref_highContrast") || "false"),
    reduceMotion: JSON.parse(localStorage.getItem("pref_reduceMotion") || "false")
  },
  saved: new Set(JSON.parse(localStorage.getItem("savedItems") || "[]"))
};

function announce(msg) {
  const live = $("#live");
  if (live) {
    live.textContent = msg;
  }
}

const DATA = [
  {
    id: "c1",
    title: "Winter Coat (M)",
    cat: "outerwear",
    size: "M",
    price: 35,
    details: "Excellent condition. Pickup at UMC!"
  },
  {
    id: "c2",
    title: "Leather Boots (9)",
    cat: "shoes",
    size: "9",
    price: 20,
    details: "Toe scuffs, but who cares. Pickup at Norlin Library."
  }
];

function savePrefs() {
  localStorage.setItem("pref_highContrast", JSON.stringify(state.prefs.highContrast));
  localStorage.setItem("pref_reduceMotion", JSON.stringify(state.prefs.reduceMotion));
}

function saveSaved() {
  localStorage.setItem("savedItems", JSON.stringify([...state.saved]));
  updateSavedCount();
}

function applyPrefs() {
  if (state.prefs.highContrast) {
    document.body.classList.add("hc");
  } else {
    document.body.classList.remove("hc");
  }
}

function initPrefsUI() {
  const contrastButtons = [$("#contrastToggle"), $("#contrastToggle2")];
  contrastButtons.forEach(btn => {
    if (!btn) return;
    btn.setAttribute("aria-pressed", state.prefs.highContrast ? "true" : "false");
    btn.addEventListener("click", () => {
      state.prefs.highContrast = !state.prefs.highContrast;
      btn.setAttribute("aria-pressed", state.prefs.highContrast ? "true" : "false");
      applyPrefs();
      savePrefs();
      announce("High contrast " + (state.prefs.highContrast ? "on" : "off"));
      contrastButtons.forEach(other => {
        if (other && other !== btn) {
          other.setAttribute("aria-pressed", state.prefs.highContrast ? "true" : "false");
        }
      });
    });
  });

  const motionChecks = [$("#reduceMotionToggle"), $("#reduceMotionToggle2")];
  motionChecks.forEach(box => {
    if (!box) return;
    box.checked = !!state.prefs.reduceMotion;
    box.addEventListener("change", () => {
      state.prefs.reduceMotion = box.checked;
      savePrefs();
    });
  });

  applyPrefs();
}

function getParam(name) {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get(name) || "";
  } catch {
    return "";
  }
}

function renderCards(container, items, statusEl) {
  if (!container) return;
  container.innerHTML = "";

  items.forEach(item => {
    const card = document.createElement("article");
    card.className = "card";
    card.tabIndex = 0;

    const title = document.createElement("h3");
    title.textContent = item.title;
    card.appendChild(title);

    const meta = document.createElement("p");
    meta.textContent = item.cat + " · " + item.size + " · $" + item.price;
    card.appendChild(meta);

    const buttons = document.createElement("div");
    buttons.className = "card-buttons";

    const saveBtn = document.createElement("button");
    saveBtn.textContent = state.saved.has(item.id) ? "Saved" : "Save";
    saveBtn.dataset.id = item.id;
    saveBtn.className = "save-btn";
    saveBtn.setAttribute("aria-pressed", state.saved.has(item.id) ? "true" : "false");
    buttons.appendChild(saveBtn);

    const detailsBtn = document.createElement("button");
    detailsBtn.textContent = "Details";
    detailsBtn.className = "details-btn";
    buttons.appendChild(detailsBtn);

    const details = document.createElement("div");
    details.className = "details";
    details.hidden = true;
    details.textContent = item.details;

    card.appendChild(buttons);
    card.appendChild(details);

    saveBtn.addEventListener("click", () => {
      toggleSave(item.id);
    });

    detailsBtn.addEventListener("click", () => {
      details.hidden = !details.hidden;
    });

    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        detailsBtn.click();
      }
    });

    container.appendChild(card);
  });

  if (statusEl) {
    statusEl.textContent = items.length + " result" + (items.length === 1 ? "" : "s");
    announce(statusEl.textContent);
  }

  updateSaveButtons();
}

function filterData(q, cat, size) {
  const query = (q || "").toLowerCase();
  const category = cat || "";
  const s = size || "";

  return DATA.filter(item => {
    const matchQ = query ? item.title.toLowerCase().includes(query) : true;
    const matchCat = category ? item.cat === category : true;
    const matchSize = s ? item.size === s : true;
    return matchQ && matchCat && matchSize;
  });
}

function toggleSave(id) {
  if (state.saved.has(id)) {
    state.saved.delete(id);
    announce("Item removed from saved.");
  } else {
    state.saved.add(id);
    announce("Item saved.");
  }
  saveSaved();
  updateSaveButtons();
  renderSavedSection();
}

function updateSaveButtons() {
  $$(".save-btn").forEach(btn => {
    const id = btn.dataset.id;
    if (!id) return;
    const isSaved = state.saved.has(id);
    btn.textContent = isSaved ? "Saved" : "Save";
    btn.setAttribute("aria-pressed", isSaved ? "true" : "false");
  });
}

function updateSavedCount() {
  const el = $("#savedCount");
  if (el) {
    el.textContent = String(state.saved.size);
  }
}

function renderSavedSection() {
  const wrap = $("#savedSection");
  if (!wrap) return;

  const items = DATA.filter(item => state.saved.has(item.id));

  if (items.length === 0) {
    wrap.innerHTML = "<p>No saved items yet.</p>";
    return;
  }

  const parts = items.map(item => {
    return `<p>${item.title} — ${item.cat}, ${item.size}, $${item.price}
      <button data-unsave="${item.id}" class="unsave-btn">Remove</button>
    </p>`;
  });

  wrap.innerHTML = parts.join("");

  $$(".unsave-btn", wrap).forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-unsave");
      if (!id) return;
      state.saved.delete(id);
      saveSaved();
      updateSaveButtons();
      renderSavedSection();
      announce("Item removed from saved.");
    });
  });
}

async function loadEvents() {
  const list = $("#eventsList");
  const loading = $("#eventsLoading");
  const error = $("#eventsError");
  if (!list || !loading || !error) {
    return; 
  }

  loading.classList.remove("hidden");
  error.classList.add("hidden");
  list.innerHTML = "";

  try {
    const res = await fetch("events.json", { cache: "no-cache" });
    if (!res.ok) throw new Error("network");
    const events = await res.json();

    loading.classList.add("hidden");
    error.classList.add("hidden");
    list.innerHTML = events.map(e => `<li>${e.when}: ${e.what}</li>`).join("");
    announce("Events loaded.");
  } catch {
    loading.classList.add("hidden");
    error.classList.remove("hidden");
    announce("Could not load events.");
  }
}

function initHomePage() {
  const homeContainer = $("#homeResults");
  if (!homeContainer) return;
  renderCards(homeContainer, DATA, null);
  renderSavedSection();
}

function initListingsPage() {
  const grid = $("#resultsGrid");
  const form = $("#filterForm");
  const status = $("#resultsStatus");
  if (!grid || !form) return;

  const qParam = getParam("q");
  const catParam = getParam("cat");
  const sizeParam = getParam("size");

  const searchInput = $("#search");
  const catSelect = $("#category");
  const sizeSelect = $("#size");

  if (searchInput) searchInput.value = qParam;
  if (catSelect) catSelect.value = catParam;
  if (sizeSelect) sizeSelect.value = sizeParam;

  let current = filterData(qParam, catParam, sizeParam);
  renderCards(grid, current, status);

  function updateFromForm() {
    const q = searchInput ? searchInput.value : "";
    const cat = catSelect ? catSelect.value : "";
    const size = sizeSelect ? sizeSelect.value : "";
    current = filterData(q, cat, size);
    renderCards(grid, current, status);

    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (cat) params.set("cat", cat);
    if (size) params.set("size", size);
    const newUrl = params.toString() ? "resources.html?" + params.toString() : "resources.html";
    window.history.replaceState(null, "", newUrl);
  }

  form.addEventListener("input", updateFromForm);
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    updateFromForm();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initPrefsUI();
  updateSavedCount();
  renderSavedSection();
  initHomePage();
  initListingsPage();
  loadEvents();
});
