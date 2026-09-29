# Implementation Guide — Guessing Number Game

## Overview

A web-based number guessing game where the player picks a range (e.g. 1–100), and the server generates a secret number within that range. The player then has a limited number of attempts to guess the number, with hints narrowing the range after each guess.

---

## Tech Stack

| Layer    | Technology          |
|----------|---------------------|
| Runtime  | Node.js             |
| Backend  | Express 5           |
| Frontend | Vanilla HTML/CSS/JS |
| Font     | Inter (Google Fonts) |

---

## Project Structure

```
Game/
├── server.js          # Express server — API endpoints & static file serving
├── game.js            # Core game logic — createGame(), makeGuess()
├── package.json       # Project metadata & dependencies
├── public/
│   ├── index.html     # Main HTML page
│   ├── style.css      # All styling (glassmorphism, animations, responsive)
│   └── app.js         # Frontend logic — API calls, DOM updates, history
```

---

## How It Works

### 1. Game Creation (`game.js` → `createGame()`)

When the player enters a range `[l, r]` and clicks **Start Game**:

- **Validation**: Both `l` and `r` must be integers, `r > l`, and the span cannot exceed 1 billion.
- **Secret number**: Generated using `crypto.randomInt(l, r + 1)` — cryptographically secure.
- **Attempts calculation**: Uses the formula `Math.max(1, 31 - Math.clz32(span))`, which gives roughly `⌊log₂(span)⌋` attempts. This mirrors the optimal binary-search strategy, making the game fair but challenging.

The game state object looks like:

```js
{
  l,               // current lower bound
  r,               // current upper bound
  secret,          // the number to guess
  attempts,        // remaining guesses
  finished: false  // game-over flag
}
```

### 2. Guessing (`game.js` → `makeGuess()`)

Each guess triggers one of four outcomes:

| Outcome            | What Happens                                       |
|--------------------|----------------------------------------------------|
| **Correct guess**  | Player wins, game is marked finished                |
| **Too high**       | Upper bound shrinks to `guess - 1`, attempts decrement |
| **Too low**        | Lower bound grows to `guess + 1`, attempts decrement   |
| **Invalid guess**  | Out-of-range or non-integer — attempts still decrement |

If attempts reach 0, the game is lost and the secret is revealed.

### 3. Server (`server.js`)

A lightweight Express server with two API routes:

| Route           | Method | Purpose                                 |
|-----------------|--------|-----------------------------------------|
| `/api/start`    | POST   | Creates a new game, returns game ID + state |
| `/api/guess`    | POST   | Processes a guess, returns result + updated state |

**Key details:**
- Game sessions are stored in an in-memory `Map<id, gameState>` — no database needed.
- Each game gets a unique ID via `crypto.randomUUID()`.
- Completed games (won/lost) are automatically deleted from the map.
- Static files under `public/` are served automatically by Express.

### 4. Frontend (`public/`)

#### `index.html`
- Two sections controlled by `hidden` attribute: **Setup** (range inputs) and **Play** (guess input, stats, history).
- Uses semantic HTML (`<main>`, `<section>`, `<label>`) with accessible markup.

#### `style.css`
- **Design system**: CSS custom properties (`:root`) for colors, spacing, typography.
- **Glassmorphism**: Frosted-glass card with `backdrop-filter: blur(24px)`.
- **Animated background**: Three floating orbs with radial gradients and `@keyframes float`.
- **Card glow**: A `conic-gradient` border that rotates via `@keyframes glow-spin`.
- **Micro-animations**: Bounce-in logo, shake on loss, pulse on win, pop-in history chips.
- **Responsive**: Media query at 480px adjusts padding, font sizes, and grid layout.

#### `app.js`
- `post()` — Thin wrapper around `fetch()` for JSON POST requests.
- `render()` — Updates the range text, attempts counter, and visual range bar.
- `addHistory()` / `clearHistory()` — Manages guess history chips (color-coded: blue = low, red = high, strikethrough = invalid).
- Event handlers wire up Start, Guess, Play Again buttons and Enter key shortcuts.

---

## Running the Project

```bash
# Install dependencies
npm install

# Start the server
npm start
```

The game will be available at **http://localhost:3000**.

---

## Gameplay Flow

```
Player opens page
    │
    ├─ Enters range (e.g. 1–100) → clicks "Start Game"
    │       │
    │       └─ POST /api/start → server creates game, returns ID + state
    │
    ├─ Enters a guess → clicks "Guess"
    │       │
    │       └─ POST /api/guess → server evaluates guess
    │               │
    │               ├─ Correct → "You Won!" message + play again
    │               ├─ Too high → range shrinks, attempts decrement
    │               ├─ Too low  → range grows, attempts decrement
    │               └─ No attempts left → "You Lost!" + secret revealed
    │
    └─ Clicks "Play Again" → back to setup screen
```

---

## Design Decisions

1. **Log₂-based attempts** — Ensures the game is always solvable with optimal binary search, keeping it fair regardless of range size.
2. **In-memory storage** — Keeps the project simple with zero external dependencies beyond Express. Suitable for a single-server deployment.
3. **Range narrowing hints** — Instead of just "higher/lower", the actual bounds update, giving the player a shrinking target range and a visual progress bar.
4. **Cryptographic randomness** — `crypto.randomInt()` avoids bias that `Math.random()` can introduce on large ranges.
