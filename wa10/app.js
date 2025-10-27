// Elements
const newQuoteBtn   = document.querySelector('#js-new-quote');
const showAuthorBtn = document.querySelector('#js-show-answer'); // keep existing id/label structure
const tweetBtn      = document.querySelector('#js-tweet');
const quoteEl       = document.querySelector('#js-quote-text');
const authorEl      = document.querySelector('#js-answer-text');
const spinnerEl     = document.querySelector('#js-spinner');

const API_URL = 'https://api.quotable.io/random';

// Offline fallback quotes (used if API fails)
const FALLBACKS = [
  { content: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
  { content: "What you do speaks so loudly that I cannot hear what you say.", author: "Ralph Waldo Emerson" },
  { content: "Well begun is half done.", author: "Aristotle" },
  { content: "The only way out is through.", author: "Robert Frost" }
];

let currentQuote = '';
let currentAuthor = '';

newQuoteBtn.addEventListener('click', getQuote);
showAuthorBtn.addEventListener('click', () => { authorEl.style.display = 'block'; });
tweetBtn.addEventListener('click', tweetCurrent);
document.addEventListener('DOMContentLoaded', getQuote);

function setLoading(isLoading) {
  newQuoteBtn.disabled = isLoading;
  showAuthorBtn.disabled = isLoading;
  tweetBtn.disabled = isLoading || !currentQuote;
  // show spinner while loading
  spinnerEl.setAttribute('aria-hidden', isLoading ? 'false' : 'true');
}

async function fetchQuotable() {
  const res = await fetch(API_URL, { cache: 'no-store', mode: 'cors' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function getQuote() {
  authorEl.style.display = 'none';
  authorEl.textContent = '';
  setLoading(true);

  try {
    let data;
    try {
      data = await fetchQuotable();
    } catch {
      await new Promise(r => setTimeout(r, 400)); // quick retry
      data = await fetchQuotable();
    }

    currentQuote = data.content || 'No quote returned.';
    currentAuthor = data.author || 'Unknown';

    quoteEl.textContent = `“${currentQuote}”`;
    authorEl.textContent = `— ${currentAuthor}`;
    tweetBtn.disabled = !currentQuote;

  } catch (err) {
    console.error('Quote fetch failed:', err);
    const f = FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
    currentQuote = f.content;
    currentAuthor = f.author;
    quoteEl.textContent = `“${currentQuote}”`;
    authorEl.textContent = `— ${currentAuthor}`;
    tweetBtn.disabled = false;
  } finally {
    setLoading(false);
  }
}

function tweetCurrent() {
  if (!currentQuote) return;
  const text = `“${currentQuote}” — ${currentAuthor}`;
  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank', 'noopener');
}
