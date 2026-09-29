const express = require('express');
const crypto = require('crypto');
const path = require('path');
const { createGame, makeGuess } = require('./game');

const app = express();
const games = new Map(); // gameId -> game state (in memory)

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/start', (req, res) => {
  try {
    const { l, r } = req.body;
    const game = createGame(Number(l), Number(r));
    const id = crypto.randomUUID();
    games.set(id, game);
    res.json({ id, l: game.l, r: game.r, attempts: game.attempts });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/api/guess', (req, res) => {
  const { id, guess } = req.body;
  const game = games.get(id);
  if (!game) return res.status(404).json({ error: 'Game not found. Start a new one.' });

  const result = makeGuess(game, Number(guess));
  if (result.status === 'won' || result.status === 'lost') games.delete(id);
  res.json(result);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Game running at http://localhost:${PORT}`));
