'use strict';

(function () {
  const $ = (s) => document.querySelector(s);

  // ---------- DOM ----------
  const el = {
    connBadge: $('#conn-badge'),
    connText: $('#conn-text'),
    roundBadge: $('#round-badge'),

    viewLobby: $('#view-lobby'),
    viewGame: $('#view-game'),
    viewLeaderboard: $('#view-leaderboard'),

    // lobby
    lobbyMeterFill: $('#lobby-meter-fill'),
    lobbyMeterPct: $('#lobby-meter-pct'),
    lobbyStatus: $('#lobby-status'),
    lobbyCount: $('#lobby-count'),
    playerGrid: $('#player-grid'),
    nameInput: $('#name-input'),
    avatarPicker: $('#avatar-picker'),
    btnStart: $('#btn-start'),
    btnShare: $('#btn-share'),
    countdownOptions: document.querySelectorAll('.countdown-option'),
    // home / room entry
    viewHome: $('#view-home'),
    btnCreate: $('#btn-create'),
    btnJoin: $('#btn-join'),
    joinError: $('#join-error'),

    // lobby room chip
    roomChip: $('#room-chip'),

    // share modal
    shareModal: $('#share-modal'),
    shareUrl: $('#share-url'),
    shareCode: $('#share-code'),
    btnShareClose: $('#btn-share-close'),
    btnCopyUrl: $('#btn-copy-url'),
    btnCopyCode: $('#btn-copy-code'),


    // game
    arena: $('#arena'),
    players: $('#players'),
    cake: $('#cake'),
    clock: $('#clock'),
    clockNum: $('#clock-num'),
    clockSub: $('#clock-sub'),
    diffList: $('#diff-list'),
    btnGrab: $('#btn-grab'),
    winnerOverlay: $('#winner-overlay'),
    winnerAvatar: $('#winner-avatar'),
    winnerName: $('#winner-name'),
    winnerSub: $('#winner-sub'),
    winnerAvatarWrap: $('#winner-overlay .winner-avatar-wrap'),

    // leaderboard
    lbWinnerBadge: $('#lb-winner-badge'),
    lbRank1: $('#lb-rank1'),
    lbList: $('#lb-list'),
    btnLobby: $('#btn-lobby'),

    toast: $('#toast'),
  };

  const AVATAR_COUNT = 20;
  const avatarUrl = (n) => `/assets/avatars/${String(n).padStart(2, '0')}.png?v=4`;
  const fmtDiff = (ms) => {
    const s = Math.abs(ms) / 1000;
    return (ms <= 0 ? '-' : '+') + s.toFixed(2) + 's';
  };

  // ---------- i18n ----------
  const LOCALE = location.pathname.replace(/\/+$/, '').endsWith('/zh') ? 'zh' : 'en';

  const I18N = {
    en: {
      title: 'Cake Grab — Rhythm Cake Snatch',
      connecting: 'Connecting…',
      connected: 'Connected',
      disconnected: 'Disconnected',
      home: 'Home',
      lobby: 'Lobby',
      results: 'Results',
      roundN: 'Round {n} / {max}',
      homeTitle: 'Ready to <span class="home-accent">Grab?</span>',
      tabCreate: 'Create',
      tabJoin: 'Join',
      createRoomTitle: 'Create Room',
      createRoomDesc: 'Start a new room and invite your friends!',
      createRoom: 'Create Room',
      joinRoomTitle: 'Join Room',
      joinRoomDesc: 'Enter the 4-digit room code to join.',
      joinRoom: 'Join Room',
      serverOnline: 'Server Online',
      lobbyTitle: 'Cake Grab',
      roomChip: 'Room #{code}',
      waitingPlayers: 'Waiting for players ({n}/{max})',
      yourName: 'Your Name',
      namePlaceholder: 'Enter name…',
      chooseAvatar: 'Choose Avatar',
      countdownLabel: 'Countdown (seconds)',
      startGame: 'Start Game',
      waitingHost: 'Waiting for host',
      shareInvite: 'Share Invite',
      contestants: 'Contestants',
      waiting: 'Waiting',
      you: ' (you)',
      diffTitle: 'Time Diff',
      grab: 'GRAB!',
      grabbed: 'Grabbed!',
      getReady: 'Get ready…',
      revealing: 'Revealing…',
      waitingSnatch: 'Waiting for players to grab…',
      nextRoundSoon: 'Next round coming soon…',
      nextSoon: 'Next one coming soon…',
      scoring: 'Scoring…',
      noWinner: 'Nobody grabbed',
      revealSub: 'Reveal',
      winnerBadge: 'Game over · {name} wins',
      gameOver: 'Game over',
      backToLobby: 'Back to Lobby',
      leaderboardTitle: 'Leaderboard',
      shareRoom: 'Share Room',
      inviteLink: 'Invite Link',
      copy: 'Copy',
      roomCodeLabel: 'Room Code',
      enterRoomCode: 'Enter the 4-digit room code',
      linkCopied: 'Link copied — send it to your friends!',
      codeCopied: 'Room code copied',
    },
    zh: {
      title: 'Cake Grab — 节奏抢蛋糕',
      connecting: '连接中…',
      connected: '已连接',
      disconnected: '已断开',
      home: '首页',
      lobby: '大厅',
      results: '结算',
      roundN: '第 {n} / {max} 轮',
      homeTitle: '准备<span class="home-accent">抢蛋糕？</span>',
      tabCreate: '创建',
      tabJoin: '加入',
      createRoomTitle: '创建房间',
      createRoomDesc: '开启一个新房间，邀请好友一起玩！',
      createRoom: '创建房间',
      joinRoomTitle: '加入房间',
      joinRoomDesc: '输入 4 位房间号加入游戏。',
      joinRoom: '加入房间',
      serverOnline: '服务器在线',
      lobbyTitle: '抢蛋糕',
      roomChip: '房间 #{code}',
      waitingPlayers: '等待玩家加入 ({n}/{max})',
      yourName: '你的名字',
      namePlaceholder: '输入名字…',
      chooseAvatar: '选择头像',
      countdownLabel: '倒计时时长（秒）',
      startGame: '开始游戏',
      waitingHost: '等待主持人',
      shareInvite: '分享邀请',
      contestants: '参赛者',
      waiting: '等待中',
      you: ' (你)',
      diffTitle: '时差排行',
      grab: '抢！',
      grabbed: '已抢！',
      getReady: '准备…',
      revealing: '揭晓中…',
      waitingSnatch: '等待玩家抢蛋糕…',
      nextRoundSoon: '下一轮即将开始…',
      nextSoon: '下一次即将开始…',
      scoring: '结算中…',
      noWinner: '无人抢到',
      revealSub: '揭晓',
      winnerBadge: '游戏结束 · {name} 获胜',
      gameOver: '游戏结束',
      backToLobby: '回到大厅',
      leaderboardTitle: '排行榜',
      shareRoom: '分享房间',
      inviteLink: '邀请链接',
      copy: '复制',
      roomCodeLabel: '房间号',
      enterRoomCode: '请输入 4 位房间号',
      linkCopied: '链接已复制，发给朋友加入吧！',
      codeCopied: '房间号已复制',
    },
  };

  function t(key, vars) {
    let s = (I18N[LOCALE] && I18N[LOCALE][key]) || (I18N.en && I18N.en[key]) || key;
    if (vars) for (const k in vars) s = s.split('{' + k + '}').join(vars[k]);
    return s;
  }

  function applyStaticI18n() {
    document.documentElement.lang = LOCALE === 'zh' ? 'zh-CN' : 'en';
    document.querySelectorAll('[data-i18n]').forEach((n) => { n.textContent = t(n.dataset.i18n); });
    document.querySelectorAll('[data-i18n-html]').forEach((n) => { n.innerHTML = t(n.dataset.i18nHtml); });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((n) => { n.placeholder = t(n.dataset.i18nPlaceholder); });
  }

  // ---------- State ----------
  let ws = null;
  let selfId = null;
  let state = null;
  let roomCode = null;
  let pendingJoin = null;


  let offset = 0;              // server time = Date.now() + offset
  let offsetReady = false;
  let prevPhase = null;
  let prevHolder = null;
  let lastShown = null;        // last displayed whole second
  let rafId = null;
  let toastTimer = null;
  let reconnectTimer = null;

  const selfPlayer = () => (selfId && state ? state.players.find((p) => p.id === selfId) : null);

  // ---------- WebSocket ----------
  function connect() {
    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    ws = new WebSocket(`${proto}//${location.host}`);

    ws.onopen = () => {
      setConn('open', t('connected'));
      syncClock();
      if (pendingJoin) {
        const p = pendingJoin;
        pendingJoin = null;
        send(p);
      } else {
        autoJoinFromUrl();
      }
    };



    ws.onmessage = (ev) => {
      let msg;
      try { msg = JSON.parse(ev.data); } catch { return; }
      handle(msg);
    };

    ws.onclose = () => {
      setConn('closed', t('disconnected'));
      roomCode = null;
      selfId = null;
      state = null;
      bgMusic.stop();
      pendingJoin = null;
      render();
      clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(connect, 2000);
    };



    ws.onerror = () => { /* onclose follows */ };
  }

  function send(obj) {
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj));
  }

  function setConn(s, text) {
    el.connBadge.dataset.state = s;
    el.connText.textContent = text;
  }

  // ---------- Clock sync ----------
  function syncClock() {
    send({ type: 'ping', t0: Date.now() });
  }
  function onPong(msg) {
    const t1 = Date.now();
    const rtt = t1 - msg.t0;
    const sample = msg.serverNow - (msg.t0 + t1) / 2;
    // exponential smoothing
    offset = offsetReady ? offset * 0.7 + sample * 0.3 : sample;
    offsetReady = true;
    if (rtt < 120) setTimeout(syncClock, 4000);
    else setTimeout(syncClock, 1500);
  }
  const serverNow = () => Date.now() + offset;

  // ---------- Audio ----------
  const AudioFX = {
    ctx: null,
    ensure() {
      if (!this.ctx) {
        try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; }
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return this.ctx;
    },
    tone(freq, dur, type, vol, delay) {
      const ctx = this.ensure();
      if (!ctx) return;
      const t0 = ctx.currentTime + (delay || 0);
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type || 'square';
      osc.frequency.value = freq;
      g.gain.setValueAtTime(vol || 0.2, t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(g); g.connect(ctx.destination);
      osc.start(t0); osc.stop(t0 + dur + 0.02);
    },
    sweep(from, to, dur, type, vol, delay) {
      const ctx = this.ensure();
      if (!ctx) return;
      const t0 = ctx.currentTime + (delay || 0);
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type || 'sawtooth';
      osc.frequency.setValueAtTime(from, t0);
      osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);
      g.gain.setValueAtTime(vol || 0.2, t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(g); g.connect(ctx.destination);
      osc.start(t0); osc.stop(t0 + dur + 0.02);
    },
    tick(high) { this.tone(high ? 1800 : 1200, 0.07, 'square', 0.13); },
    grab() {
      // strong, confrontational snatch: downward sawtooth impact + square bite
      this.sweep(420, 85, 0.3, 'sawtooth', 0.55);
      this.tone(130, 0.22, 'square', 0.42, 0.01);
    },
    claim() {
      this.tone(140, 0.26, 'sawtooth', 0.5);
      this.tone(280, 0.18, 'square', 0.38, 0.01);
    },
    steal() {
      this.tone(660, 0.16, 'sawtooth', 0.45);
      this.tone(330, 0.18, 'square', 0.35, 0.02);
      this.tone(990, 0.1, 'sawtooth', 0.28, 0.04);
    },
    ding() { this.tone(880, 0.4, 'sine', 0.18); this.tone(1318, 0.3, 'sine', 0.10, 0.03); },
    win() { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.26, 'triangle', 0.18, i * 0.09)); },
    none() { this.tone(180, 0.3, 'sine', 0.14); },
  };
  // ---------- Background music ----------
  const bgMusic = (() => {
    const audio = new Audio('/assets/cake_wait_bg.m4a');
    audio.volume = 0.5;
    let timer = null;
    const live = () => state && (state.phase === 'ready' || state.phase === 'snatch');
    const play = () => { const p = audio.play(); if (p) p.catch(() => {}); };
    const stop = () => { clearTimeout(timer); audio.pause(); audio.currentTime = 0; };
    return {
      play,
      playDelayed(ms) { clearTimeout(timer); timer = setTimeout(() => { if (live()) play(); }, ms); },
      stop,
      // unlock autoplay on first gesture; resume if a round is already live
      unlock() {
        const p = audio.play();
        if (p) p.then(() => { if (!live()) { audio.pause(); audio.currentTime = 0; } }).catch(() => {});
      },
    };
  })();


  // ---------- Message handling ----------
  function handle(msg) {
    if (msg.type === 'welcome') {
      selfId = msg.selfId;
      roomCode = msg.roomCode;
      history.replaceState(null, '', '?room=' + msg.roomCode);
      applyState(msg.state);
      restoreProfile();
      clearJoinError();
    } else if (msg.type === 'state') {
      applyState(msg.state);
    } else if (msg.type === 'pong') {
      onPong(msg);
    } else if (msg.type === 'error') {
      onJoinError(msg.message);
    }
  }


  function applyState(s) {
    prevPhase = state ? state.phase : null;
    prevHolder = state ? state.holderId : null;
    state = s;
    if (s.roomCode) roomCode = s.roomCode;
    render();
    detectTransitions();
  }


  function detectTransitions() {
    // phase sounds + background music
    if (state.phase !== prevPhase) {
      if (state.phase === 'ready') {
        bgMusic.playDelayed(1000);
      } else if (state.phase === 'reveal') {
        bgMusic.stop();
        if (state.winnerId) AudioFX.ding(); else AudioFX.none();
      } else if (state.phase === 'winner') {
        if (state.winnerId) AudioFX.win();
      }
    }
    // holder (steal / claim) sounds
    if (state.holderId !== prevHolder) {
      if (state.holderId && prevHolder) AudioFX.steal();
      else if (state.holderId && !prevHolder) AudioFX.claim();
    }
  }

  // ---------- Profile ----------
  function restoreProfile() {
    const saved = localStorage.getItem('cakegrab-profile');
    if (!saved) return;
    try {
      const p = JSON.parse(saved);
      if (p.name) {
        send({ type: 'update', name: p.name });
      }
    } catch { /* ignore */ }
  }
  function saveProfile(name) {
    localStorage.setItem('cakegrab-profile', JSON.stringify({ name }));
  }

  // ---------- Render dispatch ----------
  function render() {
    if (!state) {
      el.viewHome.classList.add('active');
      el.viewLobby.classList.remove('active');
      el.viewGame.classList.remove('active');
      el.viewLeaderboard.classList.remove('active');
      el.roundBadge.textContent = t('home');
      return;
    }

    const phase = state.phase;
    const me = selfPlayer();

    // top bar
    if (phase === 'lobby') el.roundBadge.textContent = t('lobby');
    else if (phase === 'leaderboard') el.roundBadge.textContent = t('results');
    else el.roundBadge.textContent = t('roundN', { n: state.round, max: state.maxRounds });

    // view switching
    el.viewHome.classList.remove('active');
    el.viewLobby.classList.toggle('active', phase === 'lobby');
    el.viewGame.classList.toggle('active', ['ready', 'snatch', 'reveal', 'winner'].includes(phase));
    el.viewLeaderboard.classList.toggle('active', phase === 'leaderboard');

    if (phase === 'lobby') renderLobby(me);
    else if (phase === 'leaderboard') renderLeaderboard();
    else renderGame(me);
  }


  // ---------- Lobby ----------
  function buildAvatarPicker() {
    el.avatarPicker.innerHTML = '';
    for (let i = 1; i <= AVATAR_COUNT; i++) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'avatar-option';
      b.dataset.avatar = String(i);
      b.innerHTML = `<img src="${avatarUrl(i)}" alt="avatar ${i}">`;
      b.addEventListener('click', () => selectAvatar(i));
      el.avatarPicker.appendChild(b);
    }
  }

  function selectAvatar(n) {
    const me = selfPlayer();
    if (me) saveProfile(me.name);
    send({ type: 'update', name: selfPlayer() ? selfPlayer().name : '', avatar: n });
    el.avatarPicker.querySelectorAll('.avatar-option').forEach((o) => {
      o.classList.toggle('selected', o.dataset.avatar === String(n));
    });
  }

  function renderLobby(me) {
    const n = state.players.length;
    const pct = Math.round((n / state.maxPlayers) * 100);
    el.lobbyMeterFill.style.width = pct + '%';
    el.lobbyMeterPct.textContent = pct + '%';
    el.lobbyStatus.textContent = t('waitingPlayers', { n, max: state.maxPlayers });
    el.lobbyCount.textContent = `${n} / ${state.maxPlayers}`;
    el.roomChip.textContent = t('roomChip', { code: state.roomCode });


    // name input (reflect self name without clobbering focus)
    if (me && document.activeElement !== el.nameInput) el.nameInput.value = me.name;

    // avatar selection highlight
    el.avatarPicker.querySelectorAll('.avatar-option').forEach((o) => {
      o.classList.toggle('selected', me && o.dataset.avatar === String(me.avatar));
    });

    // start button
    const canStart = me && me.isHost && n >= state.minPlayers;
    el.btnStart.disabled = !canStart;
    el.btnStart.innerHTML = me && me.isHost
      ? '<span class="material-symbols-outlined">play_arrow</span> ' + t('startGame')
      : '<span class="material-symbols-outlined">lock</span> ' + t('waitingHost');
    // countdown picker (host-only)
    const isHost = me && me.isHost;
    el.countdownOptions.forEach((btn) => {
      const sec = Number(btn.dataset.sec);
      btn.classList.toggle('selected', state.countdownSeconds === sec);
      btn.disabled = !isHost;
    });

    // player grid
    const cells = [];
    for (const p of state.players) {
      const self = p.id === selfId;
      cells.push(`
        <div class="player-card ${self ? 'self' : ''}">
          ${p.isHost ? '<span class="host-star"><span class="material-symbols-outlined">star</span></span>' : ''}
          <div class="pc-avatar"><img src="${avatarUrl(p.avatar)}" alt="${esc(p.name)}"></div>
          <span class="pc-name">${esc(p.name)}</span>
        </div>`);
    }
    if (n < state.maxPlayers) {
      cells.push(`
        <div class="player-card empty">
          <span class="material-symbols-outlined">person_add</span>
          <span class="pc-name">${t('waiting')}</span>
        </div>`);
    }
    el.playerGrid.innerHTML = cells.join('');
  }

  // ---------- Game ----------
  let positions = {};

  function renderGame(me) {
    layoutArena();
    renderDiffPanel();
    renderGrabButton(me);

    if (state.phase === 'winner') renderWinnerOverlay();
    else el.winnerOverlay.classList.remove('active');

    updateClock();
  }

  function orderedPlayers() {
    const list = [...state.players];
    if (selfId) {
      const i = list.findIndex((p) => p.id === selfId);
      if (i > 0) { const [me] = list.splice(i, 1); list.unshift(me); }
    }
    return list;
  }

  function layoutArena() {
    const players = orderedPlayers();
    const N = Math.max(players.length, 1);
    const w = el.arena.clientWidth;
    const h = el.arena.clientHeight;
    const cx = w / 2;
    const cy = h / 2;
    const rx = Math.max(40, w / 2 - 80);   // horizontal radius: spread avatars by page width
    const ry = Math.max(40, h / 2 - 100);  // vertical radius: keep avatars + names clear of top/bottom

    positions = {};
    if (N === 1) {
      positions[players[0].id] = { x: cx, y: cy + ry };
    } else {
      // Sample the ellipse perimeter, then place players at equal arc-length
      // intervals. Even ANGULAR spacing on a non-circular ellipse bunches
      // avatars at the left/right extremes (arc length per radian is smallest
      // at the ends of the major axis), which is the "two crowded sides" bug.
      const SAMPLE = 720;
      const pts = [];
      let total = 0;
      let px = cx, py = cy + ry; // θ = π/2 (bottom) — self avatar sits bottom-center
      for (let s = 0; s <= SAMPLE; s++) {
        const θ = Math.PI / 2 + (s / SAMPLE) * 2 * Math.PI;
        const x = cx + Math.cos(θ) * rx;
        const y = cy + Math.sin(θ) * ry;
        if (s > 0) total += Math.hypot(x - px, y - py);
        pts.push({ x, y, cum: total });
        px = x; py = y;
      }
      for (let i = 0; i < N; i++) {
        const target = (i / N) * total;
        let lo = 0, hi = SAMPLE;
        while (lo < hi) { const mid = (lo + hi) >> 1; if (pts[mid].cum >= target) hi = mid; else lo = mid + 1; }
        const a = lo > 0 ? pts[lo - 1] : pts[0];
        const b = pts[lo];
        const seg = b.cum - a.cum;
        const t = seg > 0 ? (target - a.cum) / seg : 0;
        positions[players[i].id] = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
      }
    }
    const nodes = players;

    el.players.innerHTML = nodes.map((p) => {
      const self = p.id === selfId;
      const isHolder = p.id === state.holderId;
      const showDiff = (state.phase === 'reveal' || state.phase === 'winner') && p.diff != null;
      const diff = showDiff ? fmtDiff(p.diff) : '';
      const diffClass = showDiff ? (p.diff <= 0 ? 'early' : 'late') : '';
      return `
        <div class="player-node ${self ? 'self' : ''} ${isHolder ? 'holder' : ''}" data-id="${p.id}" style="left:${positions[p.id].x}px;top:${positions[p.id].y}px">
          <span class="diff-tag ${diffClass}">${diff}</span>
          <div class="pn-avatar"><img src="${avatarUrl(p.avatar)}" alt="${esc(p.name)}"></div>
          <span class="pn-name">${esc(p.name)}${self ? t('you') : ''}</span>
        </div>`;
    }).join('');

    // cake position (toward current holder, else center)
    if (state.holderId && positions[state.holderId]) {
      const px = positions[state.holderId].x - cx;
      const py = positions[state.holderId].y - cy;
      el.cake.style.transform = `translate(calc(-50% + ${px}px), calc(-50% + ${py}px))`;
    } else {
      el.cake.style.transform = 'translate(-50%, -50%)';
    }
  }

  function renderGrabButton(me) {
    if (state.phase === 'snatch') {
      if (me && me.pressed) {
        el.btnGrab.disabled = true;
        el.btnGrab.classList.remove('armed');
        el.btnGrab.innerHTML = '<span class="material-symbols-outlined">done</span> ' + t('grabbed');
      } else {
        el.btnGrab.disabled = false;
        el.btnGrab.classList.add('armed');
        el.btnGrab.innerHTML = '<span class="material-symbols-outlined">front_hand</span> ' + t('grab');
      }
    } else if (state.phase === 'ready') {
      el.btnGrab.disabled = true;
      el.btnGrab.classList.remove('armed');
      el.btnGrab.innerHTML = '<span class="material-symbols-outlined">schedule</span> ' + t('getReady');
    } else {
      el.btnGrab.disabled = true;
      el.btnGrab.classList.remove('armed');
      el.btnGrab.innerHTML = '<span class="material-symbols-outlined">visibility</span> ' + t('revealing');
    }
  }

  function renderDiffPanel() {
    if (state.phase !== 'reveal' && state.phase !== 'winner') {
      el.diffList.innerHTML = '<div class="diff-empty">' + t('waitingSnatch') + '</div>';
      return;
    }
    const rows = [...state.results].sort((a, b) => {
      const da = Math.abs(a.diff), db = Math.abs(b.diff);
      return da === db ? a.seq - b.seq : da - db;
    });
    if (rows.length === 0) {
      el.diffList.innerHTML = '<div class="diff-empty">' + t('waitingSnatch') + '</div>';
      return;
    }
    el.diffList.innerHTML = rows.map((r, i) => {
      const early = r.diff <= 0;
      return `
        <div class="diff-row ${i === 0 ? 'rank1' : ''}">
          <span class="diff-rank">${i + 1}</span>
          <span class="da"><img src="${avatarUrl(r.avatar)}" alt=""></span>
          <span class="diff-name">${esc(r.name)}</span>
          <span class="diff-val ${early ? 'early' : 'late'}">${fmtDiff(r.diff)}</span>
        </div>`;
    }).join('');
  }

  function renderWinnerOverlay() {
    const winner = state.winnerId ? state.players.find((p) => p.id === state.winnerId) : null;
    el.winnerOverlay.classList.add('active');
    if (winner) {
      el.winnerAvatarWrap.style.display = '';
      el.winnerAvatar.src = avatarUrl(winner.avatar);
      el.winnerAvatar.alt = winner.name;
      el.winnerName.textContent = winner.name;
      el.winnerSub.textContent = state.round < state.maxRounds ? t('nextRoundSoon') : t('scoring');
    } else {
      el.winnerAvatarWrap.style.display = 'none';
      el.winnerName.textContent = t('noWinner');
      el.winnerSub.textContent = state.round < state.maxRounds ? t('nextSoon') : t('scoring');
    }
  }

  // ---------- Countdown loop ----------
  function updateClock() {
    const phase = state.phase;
    if (phase === 'ready') {
      el.clock.classList.add('hidden-clock');
      lastShown = null;
      return;
    }
    if (phase === 'reveal') {
      el.clock.classList.remove('hidden-clock');
      el.clockNum.textContent = '!';
      el.clockSub.textContent = t('revealSub');
      el.clockSub.hidden = false;
      lastShown = null;
      return;
    }
    if (phase === 'winner') {
      el.clock.classList.add('hidden-clock');
      return;
    }
    if (phase !== 'snatch') return;

    const now = serverNow();
    const remaining = state.zeroAt - now;

    if (now < state.hiddenAt) {
      // visible countdown
      const whole = Math.max(1, Math.ceil(remaining / 1000));
      el.clock.classList.remove('hidden-clock');
      el.clockNum.textContent = String(whole);
      el.clockSub.textContent = '';
      el.clockSub.hidden = true;
      if (whole !== lastShown) {
        AudioFX.tick(whole % 2 === 0);
        lastShown = whole;
      }
    } else {
      // hidden window + late window (0 passed): keep clock hidden
      el.clock.classList.add('hidden-clock');
      lastShown = null;
    }
  }

  function loop() {
    if (state) updateClock();
    rafId = requestAnimationFrame(loop);
  }


  // ---------- Leaderboard ----------
  function cakeIcons(n) {
    const max = 15;
    const count = Math.min(n, max);
    let html = '';
    for (let i = 0; i < count; i++) html += '<span class="material-symbols-outlined">cake</span>';
    if (n > max) html += `<span class="cake-count">+${n - max}</span>`;
    return html;
  }

  function renderLeaderboard() {
    const sorted = [...state.players].sort((a, b) => b.cakes - a.cakes);
    const winner = sorted[0];
    el.lbWinnerBadge.textContent = winner ? t('winnerBadge', { name: winner.name }) : t('gameOver');

    // rank 1
    if (winner) {
      el.lbRank1.innerHTML = `
        <span class="trophy"><span class="material-symbols-outlined">emoji_events</span></span>
        <div class="lb1-avatar"><img src="${avatarUrl(winner.avatar)}" alt="${esc(winner.name)}"></div>
        <div class="lb1-name">${esc(winner.name)}</div>
        <div class="lb-cakes">${cakeIcons(winner.cakes)}<span class="cake-count">×${winner.cakes}</span></div>`;
      el.lbRank1.style.display = '';
    } else {
      el.lbRank1.style.display = 'none';
    }

    // rest of the list (rank 2+)
    const medal = { 1: 'r2', 2: 'r3' };
    el.lbList.innerHTML = sorted.slice(1).map((p, i) => {
      const rank = i + 2;
      const cls = medal[rank] || '';
      return `
        <div class="lb-row ${rank === 2 ? 'silver' : ''}">
          <span class="lb-rank ${cls}">${rank}</span>
          <span class="lb-ava"><img src="${avatarUrl(p.avatar)}" alt=""></span>
          <span class="lb-name">${esc(p.name)}</span>
          <span class="lb-row-cakes">${cakeIcons(p.cakes)}<span class="cake-count">×${p.cakes}</span></span>
        </div>`;
    }).join('');

    const me = selfPlayer();
    el.btnLobby.style.display = me && me.isHost ? '' : 'none';
  }

  // ---------- Utilities ----------
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function toast(text) {
    el.toast.textContent = text;
    el.toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.toast.hidden = true; }, 2200);
  }

  // ---------- Events ----------
  function doGrab() {
    AudioFX.grab();
    send({ type: 'snatch', pressServerMs: serverNow() });
  }
  el.btnGrab.addEventListener('click', doGrab);

  window.addEventListener('keydown', (e) => {
    if (e.code !== 'Space') return;
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    if (el.btnGrab.disabled) return;
    e.preventDefault();
    doGrab();
  });

  el.btnStart.addEventListener('click', () => send({ type: 'start' }));
  el.btnLobby.addEventListener('click', () => send({ type: 'back_to_lobby' }));
  el.countdownOptions.forEach((btn) => {
    btn.addEventListener('click', () => {
      const me = selfPlayer();
      if (!me || !me.isHost || !state || state.phase !== 'lobby') return;
      send({ type: 'configure', countdownSeconds: Number(btn.dataset.sec) });
    });
  });

  el.btnShare.addEventListener('click', openShareModal);


  let nameDebounce = null;
  el.nameInput.addEventListener('input', () => {
    clearTimeout(nameDebounce);
    nameDebounce = setTimeout(() => {
      const name = el.nameInput.value;
      const me = selfPlayer();
      if (me) saveProfile(name);
      send({ type: 'update', name });
    }, 350);
  });
  el.nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); el.nameInput.blur(); }
  });

  // unlock audio on first interaction
  window.addEventListener('pointerdown', () => { AudioFX.ensure(); bgMusic.unlock(); }, { once: true });

  // keep arena laid out on resize
  window.addEventListener('resize', () => { if (state && state.phase !== 'lobby' && state.phase !== 'leaderboard') layoutArena(); });

  // ---------- Room entry / share ----------
  function createRoom() {
    clearJoinError();
    if (ws && ws.readyState === WebSocket.OPEN) send({ type: 'create', locale: LOCALE });
    else pendingJoin = { type: 'create', locale: LOCALE };
  }

  function joinRoom(code) {
    if (ws && ws.readyState === WebSocket.OPEN) send({ type: 'join', code, locale: LOCALE });
    else pendingJoin = { type: 'join', code, locale: LOCALE };
  }

  function readPin() {
    const inputs = [...document.querySelectorAll('.pin-input')];
    const s = inputs.map((i) => i.value.trim()).join('');
    return s.length === 4 ? Number(s) : null;
  }

  function clearJoinError() {
    el.joinError.hidden = true;
    el.joinError.textContent = '';
  }

  function onJoinError(message) {
    el.joinError.textContent = message;
    el.joinError.hidden = false;
    const inputs = [...document.querySelectorAll('.pin-input')];
    inputs.forEach((i) => i.classList.add('pin-error'));
    setTimeout(() => inputs.forEach((i) => i.classList.remove('pin-error')), 1200);
  }

  function autoJoinFromUrl() {
    if (roomCode || !ws || ws.readyState !== WebSocket.OPEN) return;
    const q = new URLSearchParams(location.search).get('room');
    if (!q) return;
    const code = Number(q);
    if (!Number.isInteger(code) || code < 1000 || code > 9999) return;
    joinRoom(code);
  }

  function shareUrl() {
    return `${location.origin}${location.pathname}?room=${roomCode}`;
  }

  function openShareModal() {
    if (!roomCode) return;
    el.shareUrl.value = shareUrl();
    el.shareCode.textContent = String(roomCode);
    el.shareModal.hidden = false;
  }

  function closeShareModal() {
    el.shareModal.hidden = true;
  }

  function copyText(text, okMessage) {
    const done = () => toast(okMessage);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(() => {});
    } else {
      const t = document.createElement('textarea');
      t.value = text;
      document.body.appendChild(t);
      t.select();
      try { document.execCommand('copy'); done(); } catch { /* ignore */ }
      document.body.removeChild(t);
    }
  }

  // home tabs (mobile): switch between create / join panels
  const homeTabButtons = [...document.querySelectorAll('.home-tab')];
  const homeCardCreate = document.querySelector('.home-card-host');
  const homeCardJoin = document.querySelector('.home-card-join');
  function setHomeTab(tab) {
    homeTabButtons.forEach((b) => {
      const active = b.dataset.tab === tab;
      b.classList.toggle('active', active);
      b.setAttribute('aria-selected', String(active));
    });
    homeCardCreate.classList.toggle('active', tab === 'create');
    homeCardJoin.classList.toggle('active', tab === 'join');
    if (tab === 'join') {
      const firstPin = document.querySelector('.pin-input');
      if (firstPin) setTimeout(() => firstPin.focus(), 0);
    }
  }
  homeTabButtons.forEach((b) => b.addEventListener('click', () => setHomeTab(b.dataset.tab)));

  el.btnCreate.addEventListener('click', createRoom);
  el.btnJoin.addEventListener('click', () => {
    const code = readPin();
    if (code == null) {
      onJoinError(t('enterRoomCode'));
      return;
    }
    clearJoinError();
    joinRoom(code);
  });

  // PIN input auto-advance / paste handling
  const pinInputs = [...document.querySelectorAll('.pin-input')];
  pinInputs.forEach((input, idx) => {
    input.addEventListener('input', () => {
      clearJoinError();
      const v = input.value.replace(/\D/g, '');
      input.value = v.slice(-1);
      if (v && idx < pinInputs.length - 1) pinInputs[idx + 1].focus();
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !input.value && idx > 0) pinInputs[idx - 1].focus();
      if (e.key === 'Enter') {
        const code = readPin();
        if (code != null) { clearJoinError(); joinRoom(code); }
      }
    });
  });

  el.btnShareClose.addEventListener('click', closeShareModal);
  el.shareModal.querySelector('.modal-backdrop').addEventListener('click', closeShareModal);
  el.btnCopyUrl.addEventListener('click', () => copyText(shareUrl(), t('linkCopied')));
  el.btnCopyCode.addEventListener('click', () => copyText(String(roomCode), t('codeCopied')));

  // ---------- Boot ----------
  applyStaticI18n();
  buildAvatarPicker();
  connect();
  render();
  loop();
})();
