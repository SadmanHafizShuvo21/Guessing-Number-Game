const $ = (id) => document.getElementById(id);

let gameId = null;
let originalL = null;
let originalR = null;
let guessHistory = [];

// ── API helper ──────────────────────────────────────────
async function post(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { ok: res.ok, data: await res.json() };
}

// ── UI helpers ──────────────────────────────────────────
function show(msg, cls = '') {
  $('message').textContent = msg;
  $('message').className = 'message ' + cls;
}

function render(state) {
  $('rangeText').textContent = `${state.l} – ${state.r}`;
  $('attemptsText').textContent = state.attempts;

  // Update the range bar (visual indicator of remaining range)
  const totalSpan = originalR - originalL;
  const currentSpan = state.r - state.l;
  const pct = totalSpan > 0 ? (currentSpan / totalSpan) * 100 : 0;
  $('rangeBar').style.width = pct + '%';
}

function addHistory(guess, type) {
  guessHistory.push({ guess, type });
  const li = document.createElement('li');
  li.textContent = guess;
  li.className = type; // 'high', 'low', or 'invalid'
  $('historyList').appendChild(li);
  $('historyContainer').hidden = false;
}

function clearHistory() {
  guessHistory = [];
  $('historyList').innerHTML = '';
  $('historyContainer').hidden = true;
}

function endGame() {
  $('play').hidden = true;
  $('againBtn').hidden = false;
  gameId = null;
}

// ── Start Game ──────────────────────────────────────────
$('startBtn').onclick = async () => {
  const l = $('l').value;
  const r = $('r').value;
  const { ok, data } = await post('/api/start', { l, r });
  if (!ok) return show(data.error, 'lose');

  gameId = data.id;
  originalL = data.l;
  originalR = data.r;
  clearHistory();
  render(data);

  $('setup').hidden = true;
  $('play').hidden = false;
  $('againBtn').hidden = true;
  $('guess').value = '';
  $('guess').focus();
  show('Game started. Good luck!');
};

// ── Make a Guess ────────────────────────────────────────
$('guessBtn').onclick = async () => {
  if (!gameId || $('guess').value === '') return;
  const guessVal = $('guess').value;
  const { ok, data } = await post('/api/guess', { id: gameId, guess: guessVal });
  if (!ok) return show(data.error, 'lose');

  $('guess').value = '';
  $('guess').focus();

  if (data.status === 'won') {
    addHistory(guessVal, 'low'); // correct — neutral color works but let's mark it special
    show(`${data.message} The number was ${data.secret}.`, 'win');
    endGame();
  } else if (data.status === 'lost') {
    addHistory(guessVal, 'high');
    show(`${data.message} The number was ${data.secret}.`, 'lose');
    endGame();
  } else {
    // Determine direction for history chip
    if (data.message.startsWith('Invalid')) {
      addHistory(guessVal, 'invalid');
    } else if (Number(guessVal) > data.r) {
      addHistory(guessVal, 'high'); // was too high
    } else {
      addHistory(guessVal, 'low'); // was too low
    }
    render(data);
    show(data.message);
  }
};

// Enter key submits guess
$('guess').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') $('guessBtn').click();
});

// Also allow Enter on range inputs to start game
$('l').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('startBtn').click(); });
$('r').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('startBtn').click(); });

// ── Play Again ──────────────────────────────────────────
$('againBtn').onclick = () => {
  $('setup').hidden = false;
  $('againBtn').hidden = true;
  show('');
};
