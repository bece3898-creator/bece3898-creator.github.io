// Select elements
const newQuoteBtn = document.querySelector('#js-new-quote');
const showAnswerBtn = document.querySelector('#js-show-answer');
const quoteEl = document.querySelector('#js-quote-text');
const answerEl = document.querySelector('#js-answer-text');

// API endpoint
const API_URL = 'https://trivia.cyberwisp.com/getrandomchristmasquestion';

// Event listeners
newQuoteBtn.addEventListener('click', getQuote);
showAnswerBtn.addEventListener('click', () => {
  // just reveal whatever answer text we have
  answerEl.style.display = 'block';
});

// getQuote: fetch a question, log to console, handle errors
function getQuote() {
  console.log('getQuote clicked');
  fetch(API_URL)
    .then(res => {
      if (!res.ok) throw new Error('Network error: ' + res.status);
      return res.json();
    })
    .then(data => {
      console.log('Fetched:', data); // success to console
      displayQuote(data.question);
      // store the answer (hidden until user clicks Show Answer)
      answerEl.textContent = 'Answer: ' + (data.answer || '');
      answerEl.style.display = 'none';
    })
    .catch(err => {
      console.error('Fetch failed:', err); // error to console
      alert('Could not load a new question.'); // and via alert
    });
}

// displayQuote: put text in #js-quote-text
function displayQuote(text) {
  quoteEl.textContent = text || 'No question returned.';
}

// On load, show a question
document.addEventListener('DOMContentLoaded', getQuote);