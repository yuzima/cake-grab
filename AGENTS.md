# AGENTS.md

Cake Grab (formerly Rhythm Cake Snatch) — a web-based multiplayer cake-grabbing party game. No framework, no build step; Node.js + vanilla HTML/CSS/JS.

## 1. Tech Stack

- **Server**: Node.js (CommonJS), single dependency `ws@^8.18.0`. One file, `server.js`, handles both static file serving and the WebSocket game logic.
- **Client**: vanilla HTML/CSS/JS, single-page app (all views live in `index.html`, toggled via `.view.active`).
- **Visuals**: Neo-Brutalism (4px black borders, hard shadows, Quicksand, yellow/pink/cyan).
- **i18n**: English by default, Chinese at `/zh`. Client uses an `I18N` dictionary + `data-i18n*` attributes; the server localizes default names and error messages from the `locale` field.

## 2. Directory Structure

```
cake-grab/
├── server.js                  # server (static serving + WebSocket game logic)
├── package.json               # name: cake-grab; scripts.start = node server.js
├── package-lock.json
├── .gitignore                 # node_modules/, adjusted.webp, cake_hand_transparent.png, input.webp
├── cake_wait_bg.m4a           # bg-music source file (tracked; a served copy also lives under public/assets)
└── public/
    ├── index.html             # single-page UI: topbar / home / lobby / game / leaderboard / share modal / toast
    ├── style.css              # Neo-Brutalism styling
    ├── game.js                # client logic (IIFE): WebSocket, rendering, i18n, audio, arena layout
    └── assets/
        ├── avatars/01.png..20.png   # 20 player avatars (RGBA 512px)
        ├── hero-cake.png            # home-page cake image (581×482, transparent bg)
        ├── favicon.webp             # site icon
        └── cake_wait_bg.m4a         # per-round background music (11s AAC)
```

The root `adjusted.webp`, `cake_hand_transparent.png`, and `input.webp` are temporary image-processing sources; they are gitignored and not committed.

## 3. Architecture

### 3.1 Server (server.js)

- The `Room` class owns a per-room state machine: `lobby → ready → snatch → reveal → winner → leaderboard`.
- Rooms are held in a `Map<code, Room>` keyed by a 4-digit code (1000–9999).
- Phase transitions use `Room.schedule(fn, delayMs)` timers; `beginSnatch()` starts a round, `resolveSnatch()` scores it.
- Each connection maps to a `player` (`id / ws / name / avatar / isHost / cakes / pressed / diff / locale`).
- Static serving (`serveStatic`): `/`, `/zh`, and `/zh/` all return `index.html`; the MIME map includes `.m4a` and `.webp`.

### 3.2 WebSocket Protocol

**Client → Server:**

| type | payload | notes |
|---|---|---|
| `create` | `locale` | create a room, become host |
| `join` | `code`, `locale` | join a room |
| `ping` | `t0` | clock sync (server replies `pong`) |
| `update` | `name`, `avatar` | change name/avatar (lobby only) |
| `start` | — | host starts the game |
| `configure` | `countdownSeconds` | host sets countdown (lobby only, must be an allowed value) |
| `back_to_lobby` | — | host returns to lobby from the leaderboard |
| `snatch` | `pressServerMs` | grab the cake (server timestamp for precise scoring) |

**Server → Client:**

| type | payload |
|---|---|
| `welcome` | `selfId`, `roomCode`, `state` |
| `state` | full serialized state |
| `pong` | `t0`, `serverNow` |
| `error` | `message` (localized) |

### 3.3 State Shape (`Room.serialize()`)

```
phase, roomCode, round, maxRounds
countdownSeconds, maxPlayers, minPlayers
hiddenWindow, countdownStart, hiddenAt, zeroAt, lateUntil
holderId, winnerId
results: [{ id, name, avatar, diff, seq }]
players: [{ id, name, avatar, isHost, cakes, pressed, diff }]
```

### 3.4 Client (game.js)

- An IIFE; `el` centralizes DOM references; `state` is the latest server state, `selfId` identifies the local player.
- `applyState → render → renderLobby/renderGame/renderLeaderboard`; `detectTransitions` triggers sound effects.
- `updateClock` runs in a `requestAnimationFrame` loop, rendering the countdown from `state.zeroAt` / `state.hiddenAt`.
- Clock sync: `ping`/`pong` computes an offset (exponential smoothing); `serverNow() = Date.now() + offset`.
- Audio: synthesized Web Audio SFX (`AudioFX`) + an HTML5 `<audio>` element for background music (`bgMusic`).

## 4. Game Rules

- **Players**: 2–18 (`MIN_PLAYERS=2`, `MAX_PLAYERS=18`); the host also plays.
- **Rounds**: fixed 9 (`MAX_ROUNDS=9`); each player may grab exactly once per round.
- **Countdown length**: host chooses 10 / 15 / 20 / 25 / 30 seconds in the lobby (`COUNTDOWN_OPTIONS`); default 10.
- **Round flow**:
  1. `ready` 5s (`READY_MS`; the clock panel is hidden; background music starts 1s in).
  2. `snatch` countdown (chosen seconds) + 2s grace after 0 (`LATE_WINDOW_MS`).
  3. `reveal` 3s (`REVEAL_MS`; shows the time-diff ranking).
  4. `winner` 2s (`WINNER_MS`; shows who grabbed this round).
- **Scoring**: `diff = press time - zeroAt` (ms); negative = early, positive = late. Round winner = `min |diff|`; ties go to the earlier press (smaller `seq`). Winner earns +1 cake.
- **Diff display**: `fmtDiff` uses a `-`/`+` prefix plus seconds (e.g. `-0.60s`), shown only during reveal/winner.
- **Countdown hiding**: `hiddenWindow = round + (countdownSeconds - 10)`, `hiddenAt = zeroAt - hiddenWindow*1000`.
  - 10s: round N hides the last N seconds.
  - 15s: round 1 hides 6s (1+5), round 2 hides 7s, and so on.
  - 30s: round 9 hides 29s (only "30" shows for 1s).
  - At 0 and beyond the clock is fully hidden.
- **Final score**: after 9 rounds, the leaderboard sorts players by cake count descending; the host can return to the lobby.
- **Controls**: grab via the button click or the `Space` key; Space is ignored while an input is focused, and when the grab button is disabled (ready/reveal/already-pressed).

## 5. Key Constants

| Constant | Value | Location |
|---|---|---|
| `MAX_PLAYERS` / `MIN_PLAYERS` | 18 / 2 | server.js |
| `MAX_ROUNDS` | 9 | server.js |
| `COUNTDOWN_OPTIONS` | [10,15,20,25,30] | server.js |
| `READY_MS` | 5000 | server.js |
| `REVEAL_MS` / `WINNER_MS` | 3000 / 2000 | server.js |
| `LATE_WINDOW_MS` | 2000 | server.js |
| `NAME_MAX` | 16 | server.js |
| `AVATAR_COUNT` | 20 | game.js |

## 6. Run & Deploy

```bash
npm install
npm start        # equivalent to `node server.js`; listens on PORT (default 3000)
```

- `/` serves English, `/zh` serves Chinese.
- Render deploy: Build `npm install`, Start `node server.js`; `PORT` is injected by the platform.

## 7. Test Plan

The repo has **no committed automated test suite**; verification is ad-hoc, one-off scripts (kept in `/tmp`, not committed). After a change, verify as follows rather than running a full suite.

### 7.1 Syntax check

```bash
node --check server.js
node --check public/game.js
```

### 7.2 Server logic (Node WebSocket scripts)

Drive the game server directly with `ws` (`create / join / start / configure / snatch`) and assert fields in `state`. Scripts live in `/tmp`, so resolve `ws` explicitly:

```bash
NODE_PATH=/Users/yuzi/workspace/cake-grab/node_modules node /tmp/xxx-test.js
```

Typical assertions: room code, player cap, `countdownSeconds`, `hiddenWindow`, `zeroAt - countdownStart`, `hiddenAt`, press `diff`/`pressed`, localized error messages.

### 7.3 UI / rendering (headless Chrome CDP)

1. `spawn` the local Chrome: `--headless=new --remote-debugging-port=<PORT> --user-data-dir=/tmp/...`.
2. `fetch http://127.0.0.1:<PORT>/json` to get the page's `webSocketDebuggerUrl`.
3. Connect with `ws`, then `Page.navigate` + `Runtime.evaluate` to read/drive the DOM (`getComputedStyle`, `textContent`, `classList`, `.click()`, dispatching `KeyboardEvent`, etc.).
4. For a real multi-player scenario: one `ws` connection acts as host, while the browser joins via `?room=<code>` as the second player.

Common checks: `data-i18n` copy, countdown panel show/hide, button disabled state, arena avatar positions, winner overlay, spacebar grab, bouncing/animations.

### 7.4 Conventions

- After touching client static assets, bump the cache-busters in `index.html` (`style.css?v=`, `game.js?v=`). Server responses already send `Cache-Control: no-cache`, but browsers still cache.
- After editing `server.js`, restart the server (hub process `cakegrab`, `restart`).
- Sound quality can't be asserted in headless Chrome; rely on `node --check` + code review + real-device listening.

## 8. Development Conventions

- Keep logic in `server.js` / `game.js`; do not introduce a framework or build step.
- All UI copy goes through the `I18N` dictionary (en/zh) + `t(key, vars)`; static HTML uses `data-i18n`. Do not hardcode Chinese/English strings in render code.
- Brand shouts (`CAKE GRAB`, `CAKE GRABBED!`, `GAME OVER!`) stay English in both locales.
- Numeric/timing rules live in the constants at the top of `server.js`; the client only consumes server-computed timestamps (`zeroAt` / `hiddenAt`).
