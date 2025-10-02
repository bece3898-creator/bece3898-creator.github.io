'use strict';

/* =============================
Helpers (safe fallbacks)
============================= */
// Query helpers (only define if not already present)
window.$  = window.$  || ((sel, scope = document) => scope.querySelector(sel));
window.$$ = window.$$ || ((sel, scope = document) => [...scope.querySelectorAll(sel)]);

// Ready helper
function ready(fn) {
  if (document.readyState !== 'loading') fn();
  else document.addEventListener('DOMContentLoaded', fn);
}

/* =============================
Feature: Accessibility Preferences (localStorage)
Stores: fontSize (%), highContrast (bool), reducedMotion (bool)
Optional UI controls:
  #fontSizeSelect, #highContrastToggle, #reducedMotionToggle, #resetPrefsBtn
============================= */
const A11Y_DEFAULTS = { fontSize: '100%', highContrast: false, reducedMotion: false };

function getA11yPrefs() {
  try {
    return JSON.parse(localStorage.getItem('a11yPrefs')) || { ...A11Y_DEFAULTS };
  } catch {
    return { ...A11Y_DEFAULTS };
  }
}

function saveA11yPrefs(prefs) {
  localStorage.setItem('a11yPrefs', JSON.stringify(prefs));
  applyPrefs();
}

function applyPrefs() {
  const prefs = getA11yPrefs();

  // Font size
  document.documentElement.style.setProperty('--base-font-size', prefs.fontSize);
  document.documentElement.style.fontSize = prefs.fontSize;

  // High contrast
  document.body.classList.toggle('a11y-high-contrast', !!prefs.highContrast);

  // Reduced motion
  document.documentElement.setAttribute(
    'data-reduced-motion',
    prefs.reducedMotion ? 'true' : 'false'
  );
}

function initPrefsUI() {
  const fontSizeSelect = document.getElementById('fontSizeSelect');
  const highContrastToggle = document.getElementById('highContrastToggle');
  const reducedMotionToggle = document.getElementById('reducedMotionToggle');
  const resetBtn = document.getElementById('resetPrefsBtn');

  const prefs = getA11yPrefs();

  // Reflect stored prefs into controls (only if controls exist on this page)
  if (fontSizeSelect) fontSizeSelect.value = prefs.fontSize;
  if (highContrastToggle) highContrastToggle.checked = !!prefs.highContrast;
  if (reducedMotionToggle) reducedMotionToggle.checked = !!prefs.reducedMotion;

  // Wire events
  if (fontSizeSelect) {
    fontSizeSelect.addEventListener('change', () => {
      const p = getA11yPrefs();
      p.fontSize = fontSizeSelect.value;
      saveA11yPrefs(p);
    });
  }
  if (highContrastToggle) {
    highContrastToggle.addEventListener('change', () => {
      const p = getA11yPrefs();
      p.highContrast = highContrastToggle.checked;
      saveA11yPrefs(p);
    });
  }
  if (reducedMotionToggle) {
    reducedMotionToggle.addEventListener('change', () => {
      const p = getA11yPrefs();
      p.reducedMotion = reducedMotionToggle.checked;
      saveA11yPrefs(p);
    });
  }
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      localStorage.removeItem('a11yPrefs');
      applyPrefs();
      if (fontSizeSelect) fontSizeSelect.value = A11Y_DEFAULTS.fontSize;
      if (highContrastToggle) highContrastToggle.checked = A11Y_DEFAULTS.highContrast;
      if (reducedMotionToggle) reducedMotionToggle.checked = A11Y_DEFAULTS.reducedMotion;
    });
  }
}


