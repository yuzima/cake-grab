'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { WebSocketServer } = require('ws');

const PORT = Number(process.env.PORT) || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

// ---- Game constants ----
const MAX_PLAYERS = 18;
const MIN_PLAYERS = 2;
const MAX_ROUNDS = 9;

const COUNTDOWN_SECONDS = 10; // default; host-selectable
const COUNTDOWN_OPTIONS = [10, 15, 20, 25, 30];
const READY_MS = 5000;        // "get ready" lead-in before each countdown
const REVEAL_MS = 3000;       // time-diff ranking shown first
const WINNER_MS = 2000;       // winner celebration (who grabbed) after reveal
const LATE_WINDOW_MS = 2000;  // grace period after 0 for late presses
const NAME_MAX = 16;

// ---- Rooms ----
const rooms = new Map(); // code(number) -> Room

function sanitizeName(raw) {
  let s = String(raw == null ? '' : raw).replace(/[\u0000-\u001f\u007f]/g, '').trim();
  if (!s) s = 'Player';
  return s.slice(0, NAME_MAX);
}

function normalizeAvatar(raw) {
  const n = Number(raw);
  if (Number.isInteger(n) && n >= 1 && n <= 20) return n;
  return 1;
}

function newRoomCode() {
  let code;
  do {
    code = 1000 + Math.floor(Math.random() * 9000);
  } while (rooms.has(code));
  return code;
}

class Room {
  constructor(code) {
    this.code = code;
    this.phase = 'lobby'; // lobby | ready | snatch | reveal | winner | leaderboard
    this.players = new Map();
    this.order = [];
    this.round = 0;
    this.countdownStart = 0;
    this.hiddenAt = 0;
    this.zeroAt = 0;
    this.lateUntil = 0;
    this.hiddenWindow = 0;
    this.countdownSeconds = COUNTDOWN_SECONDS;
    this.pressSeq = 0;
    this.results = [];
    this.holderId = null;
    this.winnerId = null;
    this.timers = [];
  }

  schedule(fn, delayMs) {
    const t = setTimeout(() => {
      this.timers = this.timers.filter((x) => x !== t);
      fn();
    }, delayMs);
    this.timers.push(t);
  }

  clearTimers() {
    for (const t of this.timers) clearTimeout(t);
    this.timers = [];
  }

  serialize() {
    return {
      phase: this.phase,
      roomCode: this.code,
      round: this.round,
      maxRounds: MAX_ROUNDS,

      countdownSeconds: this.countdownSeconds,
      maxPlayers: MAX_PLAYERS,
      minPlayers: MIN_PLAYERS,
      hiddenWindow: this.hiddenWindow,
      countdownStart: this.countdownStart,
      hiddenAt: this.hiddenAt,
      zeroAt: this.zeroAt,
      lateUntil: this.lateUntil,
      holderId: this.holderId,
      winnerId: this.winnerId,
      results: this.results.map((r) => ({
        id: r.id, name: r.name, avatar: r.avatar, diff: r.diff, seq: r.seq,
      })),
      players: [...this.players.values()].map((p) => ({
        id: p.id, name: p.name, avatar: p.avatar, isHost: p.isHost, cakes: p.cakes,
        pressed: p.pressed, diff: p.diff,
      })),
    };
  }

  broadcast(msg) {
    const data = JSON.stringify(msg);
    for (const p of this.players.values()) {
      if (p.ws.readyState === p.ws.OPEN) p.ws.send(data);
    }
  }

  broadcastState() {
    this.broadcast({ type: 'state', state: this.serialize() });
  }

  closestResult() {
    let best = null;
    for (const r of this.results) {
      if (!best) { best = r; continue; }
      const a = Math.abs(r.diff);
      const b = Math.abs(best.diff);
      if (a < b || (a === b && r.seq < best.seq)) best = r;
    }
    return best;
  }

  updateHolder() {
    const best = this.closestResult();
    this.holderId = best ? best.id : null;
  }

  beginSnatch() {
    this.results = [];
    this.holderId = null;
    this.winnerId = null;
    for (const p of this.players.values()) {
      p.pressed = false;
      p.diff = null;
    }
    // Hide the last `round + (countdownSeconds - 10)` seconds (10s: round N hides Ns).
    this.hiddenWindow = this.round + (this.countdownSeconds - 10);

    const now = Date.now();
    this.countdownStart = now + READY_MS;
    this.zeroAt = this.countdownStart + this.countdownSeconds * 1000;
    this.hiddenAt = this.zeroAt - this.hiddenWindow * 1000;
    this.lateUntil = this.zeroAt + LATE_WINDOW_MS;
    this.phase = 'ready';
    this.broadcastState();

    this.schedule(() => {
      if (this.phase !== 'ready') return;
      this.phase = 'snatch';
      this.broadcastState();
    }, READY_MS);

    this.schedule(() => {
      if (this.phase !== 'snatch') return;
      this.resolveSnatch();
    }, READY_MS + this.countdownSeconds * 1000 + LATE_WINDOW_MS);
  }

  resolveSnatch() {
    const best = this.closestResult();
    this.winnerId = best ? best.id : null;
    if (best) {
      const winner = this.players.get(best.id);
      if (winner) winner.cakes += 1;
    }
    this.results.sort((a, b) => {
      const da = Math.abs(a.diff);
      const db = Math.abs(b.diff);
      return da === db ? a.seq - b.seq : da - db;
    });
    this.phase = 'reveal';
    this.broadcastState();

    this.schedule(() => {
      this.phase = 'winner';
      this.broadcastState();
    }, REVEAL_MS);

    this.schedule(() => {
      if (this.round < MAX_ROUNDS) {
        this.round += 1;
        this.beginSnatch();
      } else {
        this.phase = 'leaderboard';
        this.broadcastState();
      }
    }, REVEAL_MS + WINNER_MS);
  }

  startGame() {
    if (this.phase !== 'lobby') return;
    if (this.players.size < MIN_PLAYERS) return;
    for (const p of this.players.values()) p.cakes = 0;
    this.clearTimers();
    this.round = 1;
    this.beginSnatch();
  }


  backToLobby() {
    if (this.phase !== 'leaderboard') return;
    this.clearTimers();
    this.phase = 'lobby';
    this.round = 0;
    this.results = [];
    this.holderId = null;
    this.winnerId = null;
    for (const p of this.players.values()) {
      p.pressed = false;
      p.diff = null;
    }
    this.broadcastState();
  }

  handleSnatch(player, pressServerMs) {
    if (this.phase !== 'snatch') return;
    if (player.pressed) return;
    const now = Date.now();
    let press = typeof pressServerMs === 'number' && Number.isFinite(pressServerMs)
      ? pressServerMs
      : now;
    press = Math.max(this.countdownStart, Math.min(this.lateUntil, press));
    const diff = press - this.zeroAt; // ms; negative = early, positive = late
    player.pressed = true;
    player.diff = diff;
    const seq = ++this.pressSeq;
    this.results.push({ id: player.id, name: player.name, avatar: player.avatar, diff, seq });
    this.updateHolder();
    this.broadcastState();
  }

  nextAvatar() {
    const used = new Set([...this.players.values()].map((p) => p.avatar));
    const free = [];
    for (let i = 1; i <= 20; i++) if (!used.has(i)) free.push(i);
    if (free.length) return free[Math.floor(Math.random() * free.length)];
    return 1 + Math.floor(Math.random() * 20);
  }

  handleGameMessage(player, msg) {
    switch (msg.type) {
      case 'update': {
        if (this.phase !== 'lobby') break;
        player.name = sanitizeName(msg.name);
        if (msg.avatar != null) player.avatar = normalizeAvatar(msg.avatar);
        this.broadcastState();
        break;
      }
      case 'start': {
        if (!player.isHost) break;
        this.startGame();
        break;
      }
      case 'configure': {
        if (!player.isHost || this.phase !== 'lobby') break;
        const sec = Number(msg.countdownSeconds);
        if (COUNTDOWN_OPTIONS.includes(sec)) {
          this.countdownSeconds = sec;
          this.broadcastState();
        }
        break;
      }
      case 'back_to_lobby': {
        if (!player.isHost) break;
        this.backToLobby();
        break;
      }
      case 'snatch': {
        this.handleSnatch(player, msg.pressServerMs);
        break;
      }
      default:
        break;
    }
  }
}

// ---- Static server ----
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon',
  '.m4a': 'audio/mp4',
};

function serveStatic(req, res) {
  let urlPath;
  try {
    urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch {
    res.writeHead(400);
    return res.end('Bad request');
  }
  if (urlPath === '/') urlPath = '/index.html';
  const filePath = path.normalize(path.join(PUBLIC_DIR, urlPath));
  if (!filePath.startsWith(PUBLIC_DIR + path.sep) && filePath !== PUBLIC_DIR) {
    res.writeHead(403);
    return res.end('Forbidden');
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      return res.end('Not found');
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(data);
  });
}

const server = http.createServer(serveStatic);
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  let room = null;
  let player = null;

  const sendTo = (msg) => {
    if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(msg));
  };

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }
    if (!msg || typeof msg !== 'object') return;

    switch (msg.type) {
      case 'create': {
        if (room) return;
        const code = newRoomCode();
        room = new Room(code);
        rooms.set(code, room);
        player = {
          id: crypto.randomUUID(),
          ws,
          name: '玩家' + (room.players.size + 1),
          avatar: room.nextAvatar(),
          isHost: true,
          cakes: 0,
          pressed: false,
          diff: null,
        };
        room.players.set(player.id, player);
        room.order.push(player.id);
        sendTo({ type: 'welcome', selfId: player.id, roomCode: code, state: room.serialize() });
        room.broadcastState();
        break;
      }
      case 'join': {
        if (room) return;
        const code = Number(msg.code);
        const target = rooms.get(code);
        if (!target) {
          sendTo({ type: 'error', message: '房间不存在，请检查房间号' });
          break;
        }
        if (target.players.size >= MAX_PLAYERS) {
          sendTo({ type: 'error', message: '房间已满（最多 18 人）' });
          break;
        }
        room = target;
        player = {
          id: crypto.randomUUID(),
          ws,
          name: '玩家' + (room.players.size + 1),
          avatar: room.nextAvatar(),
          isHost: false,
          cakes: 0,
          pressed: false,
          diff: null,
        };
        room.players.set(player.id, player);
        room.order.push(player.id);
        sendTo({ type: 'welcome', selfId: player.id, roomCode: code, state: room.serialize() });
        room.broadcastState();
        break;
      }
      case 'ping': {
        sendTo({ type: 'pong', t0: msg.t0, serverNow: Date.now() });
        break;
      }
      default: {
        if (room && player) room.handleGameMessage(player, msg);
        break;
      }
    }
  });

  ws.on('close', () => {
    if (!room || !player) return;
    room.players.delete(player.id);
    room.order = room.order.filter((x) => x !== player.id);
    if (room.holderId === player.id) { room.holderId = null; room.updateHolder(); }
    if (room.winnerId === player.id) room.winnerId = null;

    if (player.isHost) {
      const nextId = room.order[0];
      if (nextId) {
        const next = room.players.get(nextId);
        if (next) next.isHost = true;
      }
    }

    if (room.players.size === 0) {
      room.clearTimers();
      rooms.delete(room.code);
    } else {
      room.broadcastState();
    }
  });
});

server.listen(PORT, () => {
  console.log(`Cake Grab running at http://localhost:${PORT}`);
});
