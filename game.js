const crypto = require('crypto');

const MAX_SPAN = 1_000_000_000;

function createGame(l, r) {
  if (!Number.isInteger(l) || !Number.isInteger(r)) throw new Error('Range must be integers.');
  if (r <= l) throw new Error('Last number must be greater than first number.');
  if (r - l > MAX_SPAN) throw new Error('Range is too large (max 1,000,000,000).');

  const span = r - l;
  return {
    l, r,
    secret: crypto.randomInt(l, r + 1),
    // same idea as std::__lg(tnum - 1); at least 1 so tiny ranges are playable
    attempts: Math.max(1, 31 - Math.clz32(span)),
    finished: false,
  };
}

function makeGuess(game, num) {
  if (game.finished) return { status: 'over', message: 'Game already finished.' };

  let message;
  if (!Number.isInteger(num) || num < game.l || num > game.r) {
    message = `Invalid guess! Guess between ${game.l} & ${game.r}`;
    game.attempts--;
  } else if (num === game.secret) {
    game.finished = true;
    return { status: 'won', secret: game.secret, message: 'Congratulations! You Won' };
  } else if (num > game.secret) {
    game.r = num - 1;
    message = `The number is between ${game.l} & ${game.r}`;
    game.attempts--;
  } else {
    game.l = num + 1;
    message = `The number is between ${game.l} & ${game.r}`;
    game.attempts--;
  }

  if (game.attempts <= 0) {
    game.finished = true;
    return { status: 'lost', secret: game.secret, message: 'Your guesses ran out. Try again!' };
  }
  return { status: 'playing', l: game.l, r: game.r, attempts: game.attempts, message };
}

module.exports = { createGame, makeGuess };
