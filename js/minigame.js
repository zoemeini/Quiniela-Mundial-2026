// ============================================================
//  Minijuego diario «¿Más o menos?» (Higher / Lower)
//  EN PRUEBAS: burbuja flotante 🎮 «Reto del día» (abajo-izquierda),
//  solo en el panel de admin → los amigos aún no lo ven.
//
//  CADA DÍA UN TEMA DISTINTO (rota por fecha, igual para todos):
//    💰 valor de mercado · ⚽ goles en Mundiales · 📏 altura ·
//    🎂 edad · 📱 seguidores en Instagram.
//  ¿El siguiente jugador tiene MÁS o MENOS (de ese dato) que el actual?
//  15 s por pregunta (si se agota, fallas → no da tiempo a buscar).
//
//  Depende de data.js (madridDayKey, formatKickoff).
// ============================================================

// Cada tema tiene su propia lista. Valores APROXIMADOS (fácil de editar).
//   n = nombre · iso = bandera (flagcdn) · v = dato del tema
const MG_THEMES = [
  {
    key: 'valor', emoji: '💰', label: 'Valor de mercado',
    sub: 'valor de mercado', unit: 'M€', verb: 'vale', metric: '',
    players: [
      { n: 'Vinícius Júnior', iso: 'br', v: 200 }, { n: 'Kylian Mbappé', iso: 'fr', v: 180 },
      { n: 'Erling Haaland', iso: 'no', v: 180 }, { n: 'Jude Bellingham', iso: 'gb-eng', v: 180 },
      { n: 'Lamine Yamal', iso: 'es', v: 180 }, { n: 'Florian Wirtz', iso: 'de', v: 140 },
      { n: 'Jamal Musiala', iso: 'de', v: 140 }, { n: 'Bukayo Saka', iso: 'gb-eng', v: 140 },
      { n: 'Rodri', iso: 'es', v: 130 }, { n: 'Phil Foden', iso: 'gb-eng', v: 130 },
      { n: 'Cole Palmer', iso: 'gb-eng', v: 130 }, { n: 'Federico Valverde', iso: 'uy', v: 130 },
      { n: 'Lautaro Martínez', iso: 'ar', v: 110 }, { n: 'Harry Kane', iso: 'gb-eng', v: 100 },
      { n: 'Pedri', iso: 'es', v: 100 }, { n: 'Victor Osimhen', iso: 'ng', v: 100 },
      { n: 'Julián Álvarez', iso: 'ar', v: 90 }, { n: 'Rafael Leão', iso: 'pt', v: 75 },
      { n: 'Achraf Hakimi', iso: 'ma', v: 60 }, { n: 'Mohamed Salah', iso: 'eg', v: 50 },
      { n: 'Son Heung-min', iso: 'kr', v: 40 }, { n: 'Kevin De Bruyne', iso: 'be', v: 30 },
      { n: 'Lionel Messi', iso: 'ar', v: 30 }, { n: 'Antoine Griezmann', iso: 'fr', v: 25 },
      { n: 'Neymar Jr', iso: 'br', v: 20 }, { n: 'Cristiano Ronaldo', iso: 'pt', v: 15 },
      { n: 'Luka Modrić', iso: 'hr', v: 10 },
    ],
  },
  {
    key: 'goles', emoji: '⚽', label: 'Goles en Mundiales',
    sub: 'goles en Mundiales (histórico)', unit: 'goles', verb: 'tiene', metric: 'goles en Mundiales',
    players: [
      { n: 'Miroslav Klose', iso: 'de', v: 16 }, { n: 'Ronaldo Nazário', iso: 'br', v: 15 },
      { n: 'Gerd Müller', iso: 'de', v: 14 }, { n: 'Just Fontaine', iso: 'fr', v: 13 },
      { n: 'Lionel Messi', iso: 'ar', v: 13 }, { n: 'Pelé', iso: 'br', v: 12 },
      { n: 'Kylian Mbappé', iso: 'fr', v: 12 }, { n: 'Jürgen Klinsmann', iso: 'de', v: 11 },
      { n: 'Sándor Kocsis', iso: 'hu', v: 11 }, { n: 'Gabriel Batistuta', iso: 'ar', v: 10 },
      { n: 'Gary Lineker', iso: 'gb-eng', v: 10 }, { n: 'Thomas Müller', iso: 'de', v: 10 },
      { n: 'Roberto Baggio', iso: 'it', v: 9 }, { n: 'Paolo Rossi', iso: 'it', v: 9 },
      { n: 'Diego Maradona', iso: 'ar', v: 8 }, { n: 'Cristiano Ronaldo', iso: 'pt', v: 8 },
      { n: 'Neymar Jr', iso: 'br', v: 8 }, { n: 'Rivaldo', iso: 'br', v: 8 },
      { n: 'Davor Šuker', iso: 'hr', v: 6 }, { n: 'Salvatore Schillaci', iso: 'it', v: 6 },
      { n: 'Geoff Hurst', iso: 'gb-eng', v: 5 }, { n: 'Zinedine Zidane', iso: 'fr', v: 5 },
    ],
  },
  {
    key: 'altura', emoji: '📏', label: 'Altura',
    sub: 'altura', unit: 'cm', verb: 'mide', metric: '',
    players: [
      { n: 'Thibaut Courtois', iso: 'be', v: 199 }, { n: 'Erling Haaland', iso: 'no', v: 195 },
      { n: 'Virgil van Dijk', iso: 'nl', v: 193 }, { n: 'Manuel Neuer', iso: 'de', v: 193 },
      { n: 'Rodri', iso: 'es', v: 191 }, { n: 'Romelu Lukaku', iso: 'be', v: 191 },
      { n: 'Harry Kane', iso: 'gb-eng', v: 188 }, { n: 'Cristiano Ronaldo', iso: 'pt', v: 187 },
      { n: 'Jude Bellingham', iso: 'gb-eng', v: 186 }, { n: 'Robert Lewandowski', iso: 'pl', v: 185 },
      { n: 'Son Heung-min', iso: 'kr', v: 183 }, { n: 'Kevin De Bruyne', iso: 'be', v: 181 },
      { n: 'Lamine Yamal', iso: 'es', v: 180 }, { n: 'Bruno Fernandes', iso: 'pt', v: 179 },
      { n: 'Kylian Mbappé', iso: 'fr', v: 178 }, { n: 'Vinícius Júnior', iso: 'br', v: 176 },
      { n: 'Neymar Jr', iso: 'br', v: 175 }, { n: 'Mohamed Salah', iso: 'eg', v: 175 },
      { n: 'Pedri', iso: 'es', v: 174 }, { n: 'Luka Modrić', iso: 'hr', v: 172 },
      { n: 'Antoine Griezmann', iso: 'fr', v: 172 }, { n: 'Lionel Messi', iso: 'ar', v: 170 },
    ],
  },
  {
    key: 'edad', emoji: '🎂', label: 'Edad (2026)',
    sub: 'edad en 2026', unit: 'años', verb: 'tiene', metric: 'años',
    players: [
      { n: 'Pepe', iso: 'pt', v: 43 }, { n: 'Cristiano Ronaldo', iso: 'pt', v: 41 },
      { n: 'Luka Modrić', iso: 'hr', v: 40 }, { n: 'Luis Suárez', iso: 'uy', v: 39 },
      { n: 'Lionel Messi', iso: 'ar', v: 38 }, { n: 'Karim Benzema', iso: 'fr', v: 38 },
      { n: 'Ángel Di María', iso: 'ar', v: 38 }, { n: 'Robert Lewandowski', iso: 'pl', v: 37 },
      { n: 'Antoine Griezmann', iso: 'fr', v: 35 }, { n: 'Neymar Jr', iso: 'br', v: 34 },
      { n: 'Kevin De Bruyne', iso: 'be', v: 34 }, { n: 'Mohamed Salah', iso: 'eg', v: 33 },
      { n: 'Harry Kane', iso: 'gb-eng', v: 32 }, { n: 'Kylian Mbappé', iso: 'fr', v: 27 },
      { n: 'Vinícius Júnior', iso: 'br', v: 25 }, { n: 'Erling Haaland', iso: 'no', v: 25 },
      { n: 'Jamal Musiala', iso: 'de', v: 23 }, { n: 'Florian Wirtz', iso: 'de', v: 23 },
      { n: 'Pedri', iso: 'es', v: 23 }, { n: 'Jude Bellingham', iso: 'gb-eng', v: 22 },
      { n: 'Gavi', iso: 'es', v: 21 }, { n: 'Pau Cubarsí', iso: 'es', v: 19 },
      { n: 'Lamine Yamal', iso: 'es', v: 18 },
    ],
  },
  {
    key: 'instagram', emoji: '📱', label: 'Seguidores en Instagram',
    sub: 'seguidores en Instagram (aprox.)', unit: 'M', verb: 'tiene', metric: 'seguidores',
    players: [
      { n: 'Cristiano Ronaldo', iso: 'pt', v: 650 }, { n: 'Lionel Messi', iso: 'ar', v: 510 },
      { n: 'Neymar Jr', iso: 'br', v: 230 }, { n: 'Kylian Mbappé', iso: 'fr', v: 120 },
      { n: 'David Beckham', iso: 'gb-eng', v: 88 }, { n: 'Ronaldinho', iso: 'br', v: 80 },
      { n: 'Karim Benzema', iso: 'fr', v: 75 }, { n: 'Mohamed Salah', iso: 'eg', v: 70 },
      { n: 'Sergio Ramos', iso: 'es', v: 65 }, { n: 'Paul Pogba', iso: 'fr', v: 60 },
      { n: 'Marcelo', iso: 'br', v: 58 }, { n: 'James Rodríguez', iso: 'co', v: 50 },
      { n: 'Vinícius Júnior', iso: 'br', v: 50 }, { n: 'Erling Haaland', iso: 'no', v: 45 },
      { n: 'Jude Bellingham', iso: 'gb-eng', v: 42 }, { n: 'Lamine Yamal', iso: 'es', v: 40 },
      { n: 'Robert Lewandowski', iso: 'pl', v: 38 }, { n: 'Luka Modrić', iso: 'hr', v: 30 },
      { n: 'Kevin De Bruyne', iso: 'be', v: 18 }, { n: 'Harry Kane', iso: 'gb-eng', v: 17 },
    ],
  },
];

(function () {
  const ROUND_MS = 15000; // 15 s por pregunta
  let theme = MG_THEMES[0];
  let seq = [], idx = 0, score = 0, busy = false, over = false, started = false;
  let deadline = 0, timerId = null, open = false, previewOffset = 0, view = 'play';
  let paused = false, pausedRemaining = 0;

  const el = id => document.getElementById(id);
  const gameDate = () => { const d = new Date(); d.setDate(d.getDate() + previewOffset); return d; };
  const dayKey = () => madridDayKey(gameDate());
  const seedInt = () => parseInt(dayKey().replace(/-/g, ''), 10) || 1;
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

  // Día como número entero → el TEMA rota cada día (igual para todos).
  function dayOrdinal() {
    const p = dayKey().split('-');
    return Math.floor(Date.UTC(+p[0], +p[1] - 1, +p[2]) / 86400000);
  }
  function currentTheme() {
    const i = ((dayOrdinal() % MG_THEMES.length) + MG_THEMES.length) % MG_THEMES.length;
    return MG_THEMES[i];
  }

  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function buildDailySeq() {
    const rng = mulberry32(seedInt());
    const arr = theme.players.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    const out = [], leftover = [];
    arr.forEach(p => {
      if (out.length === 0 || out[out.length - 1].v !== p.v) out.push(p);
      else leftover.push(p);
    });
    leftover.forEach(p => {
      for (let k = 1; k < out.length; k++) {
        if (out[k - 1].v !== p.v && out[k].v !== p.v) { out.splice(k, 0, p); break; }
      }
    });
    return out;
  }
  function flag(iso) {
    return `<img class="team-flag-img" src="https://flagcdn.com/w40/${iso}.png" ` +
           `srcset="https://flagcdn.com/w80/${iso}.png 2x" alt="" loading="lazy">`;
  }
  const fmtV = v => `${v} ${theme.unit}`;
  const bestKey = () => 'wc2026_mg_best_' + dayKey();
  const getBest = () => parseInt(localStorage.getItem(bestKey()) || '0', 10) || 0;
  function setBest(v) { if (v > getBest()) localStorage.setItem(bestKey(), String(v)); }

  // ── Burbuja flotante 🎮 «Reto del día» + panel (abajo-izquierda) ──
  const fab = document.createElement('button');
  fab.className = 'mg-fab';
  fab.type = 'button';
  fab.setAttribute('aria-label', 'Reto del día');
  fab.innerHTML = '<span class="mg-fab-emoji">🎮</span><span class="mg-fab-label">Reto del día</span>';

  const panel = document.createElement('div');
  panel.className = 'mg-panel hidden';
  panel.innerHTML =
    '<div class="mg-panel-head">' +
      '<span class="mg-panel-title">🎮 Reto del día · ¿Más o menos?</span>' +
      '<button type="button" class="mg-close" id="mg-close" aria-label="Cerrar">✕</button>' +
    '</div>' +
    '<div class="mg-tabs">' +
      '<button type="button" class="mg-tab active" id="mg-tab-play">▶️ Jugar</button>' +
      '<button type="button" class="mg-tab" id="mg-tab-rank">🏆 Ranking</button>' +
    '</div>' +
    '<div id="mg-play-view">' +
      '<div class="mg-theme" id="mg-theme"></div>' +
      '<div class="mg-timer-row">' +
        '<div class="mg-timer-track"><div class="mg-timer-bar" id="mg-timer-bar"></div></div>' +
        '<span class="mg-timer-num" id="mg-timer-num">15s</span>' +
      '</div>' +
      '<div class="mg-hud" id="mg-hud"></div>' +
      '<div id="mg-board"></div>' +
      '<div class="mg-daypreview" id="mg-daypreview"></div>' +
    '</div>' +
    '<div id="mg-rank" class="hidden"></div>';

  document.body.appendChild(panel);
  document.body.appendChild(fab);

  fab.addEventListener('click', function () {
    open = !open;
    panel.classList.toggle('hidden', !open);
    fab.classList.toggle('active', open);
    if (open) {
      if (view === 'rank') renderRanking();
      else if (!started) start();
      else resumeGameTimer();
    } else {
      pauseGameTimer();
    }
  });
  el('mg-close').addEventListener('click', function () {
    open = false;
    panel.classList.add('hidden');
    fab.classList.remove('active');
    pauseGameTimer();
  });
  el('mg-tab-play').addEventListener('click', () => switchView('play'));
  el('mg-tab-rank').addEventListener('click', () => switchView('rank'));

  function switchView(v) {
    view = v;
    el('mg-tab-play').classList.toggle('active', v === 'play');
    el('mg-tab-rank').classList.toggle('active', v === 'rank');
    el('mg-play-view').classList.toggle('hidden', v !== 'play');
    el('mg-rank').classList.toggle('hidden', v !== 'rank');
    if (v === 'play') { if (!started) start(); else resumeGameTimer(); }
    else { pauseGameTimer(); renderRanking(); }
  }

  // ── Temporizador (15 s por pregunta; pausa al mirar ranking / minimizar) ──
  function stopTimer() { if (timerId) { clearInterval(timerId); timerId = null; } }
  function startTimer() {
    stopTimer();
    paused = false;
    deadline = Date.now() + ROUND_MS;
    tick();
    timerId = setInterval(tick, 150);
  }
  function pauseGameTimer() {
    if (!started || over || busy || !timerId) return;
    pausedRemaining = Math.max(0, deadline - Date.now());
    stopTimer();
    paused = true;
  }
  function resumeGameTimer() {
    if (!started || over || busy || !paused) return;
    paused = false;
    deadline = Date.now() + pausedRemaining;
    tick();
    timerId = setInterval(tick, 150);
  }
  function tick() {
    const remaining = Math.max(0, deadline - Date.now());
    const pct = (remaining / ROUND_MS) * 100;
    const secs = Math.ceil(remaining / 1000);
    const low = remaining <= 5000;
    const bar = el('mg-timer-bar'), num = el('mg-timer-num');
    if (bar) { bar.style.width = pct + '%'; bar.classList.toggle('low', low); }
    if (num) { num.textContent = secs + 's'; num.classList.toggle('low', low); }
    if (remaining <= 0) { stopTimer(); timeUp(); }
  }
  function resetTimerBar() {
    const bar = el('mg-timer-bar'), num = el('mg-timer-num');
    if (bar) { bar.style.width = '100%'; bar.classList.remove('low'); }
    if (num) { num.textContent = '15s'; num.classList.remove('low'); }
  }

  function updateHud() {
    const h = el('mg-hud');
    if (h) h.innerHTML = `Aciertos: <b>${score}</b> &nbsp;·&nbsp; Mejor de hoy: <b>${getBest()}</b> 🔥`;
  }
  function renderThemeBanner() {
    const tb = el('mg-theme');
    if (tb) tb.innerHTML = `🎯 Tema de hoy: <b>${theme.emoji} ${theme.label}</b>`;
  }

  function start() {
    theme = currentTheme();
    seq = buildDailySeq();
    idx = 0; score = 0; over = false; busy = false; started = true;
    renderThemeBanner();
    render();
    renderDayPreview();
  }

  function render() {
    const wrap = el('mg-board');
    if (!wrap) return;
    const A = seq[idx], B = seq[idx + 1];
    if (!B) { renderWin(); return; }
    const metric = theme.metric ? ' ' + theme.metric : '';
    wrap.innerHTML = `
      <div class="mg-card">
        ${flag(A.iso)}
        <div class="mg-name">${A.n}</div>
        <div class="mg-sub">${theme.sub}</div>
        <div class="mg-val">${fmtV(A.v)}</div>
      </div>
      <div class="mg-vs">¿<b>${B.n}</b> ${theme.verb} más o menos${metric}?</div>
      <div class="mg-card mg-card-b">
        ${flag(B.iso)}
        <div class="mg-name">${B.n}</div>
        <div class="mg-sub">${theme.sub}</div>
        <div class="mg-val mg-hidden" id="mg-bval">??? ${theme.unit}</div>
        <div class="mg-buttons">
          <button class="mg-btn mg-more" id="mg-more">⬆️ MÁS de ${fmtV(A.v)}</button>
          <button class="mg-btn mg-less" id="mg-less">⬇️ MENOS</button>
        </div>
      </div>`;
    el('mg-more').addEventListener('click', () => guess('mas'));
    el('mg-less').addEventListener('click', () => guess('menos'));
    updateHud();
    startTimer();
  }

  function disableButtons() {
    ['mg-more', 'mg-less'].forEach(id => { const b = el(id); if (b) b.disabled = true; });
  }

  function guess(dir) {
    if (busy || over) return;
    busy = true;
    stopTimer();
    const A = seq[idx], B = seq[idx + 1];
    const correct = B.v > A.v ? 'mas' : 'menos';
    const ok = dir === correct;

    const bval = el('mg-bval');
    if (bval) {
      bval.textContent = fmtV(B.v);
      bval.classList.remove('mg-hidden');
      bval.classList.add(ok ? 'mg-ok' : 'mg-bad');
    }
    disableButtons();

    if (ok) {
      score++; setBest(score); updateHud();
      setTimeout(() => { idx++; busy = false; render(); }, 1100);
    } else {
      over = true; setBest(score);
      setTimeout(() => renderOver('wrong'), 1200);
    }
  }

  function timeUp() {
    if (over || busy) return;
    over = true;
    const B = seq[idx + 1];
    const bval = el('mg-bval');
    if (B && bval) {
      bval.textContent = fmtV(B.v);
      bval.classList.remove('mg-hidden');
      bval.classList.add('mg-bad');
    }
    disableButtons();
    setBest(score);
    setTimeout(() => renderOver('time'), 1000);
  }

  function renderOver(reason) {
    stopTimer();
    resetTimerBar();
    const wrap = el('mg-board');
    if (!wrap) return;
    const head = reason === 'time'
      ? { e: '⏰', t: '¡Se acabó el tiempo!' }
      : { e: '😅', t: '¡Fallaste!' };
    wrap.innerHTML = `
      <div class="mg-end">
        <div class="mg-end-emoji">${head.e}</div>
        <h3>${head.t}</h3>
        <p>Puntuación de hoy: <b>${score}</b> acierto${score === 1 ? '' : 's'} seguidos.</p>
        <p class="mg-end-best">Tu mejor de hoy: <b>${getBest()}</b> 🔥</p>
        <button class="btn-primary" id="mg-again">Jugar otra vez</button>
        <p class="mg-note">⚙️ Beta. En la versión final: <b>1 partida al día</b> + ranking entre amigos.</p>
      </div>`;
    el('mg-again').addEventListener('click', start);
    updateHud();
  }

  function renderWin() {
    stopTimer();
    resetTimerBar();
    const wrap = el('mg-board');
    if (!wrap) return;
    wrap.innerHTML = `
      <div class="mg-end">
        <div class="mg-end-emoji">🏆</div>
        <h3>¡Increíble! Los has acertado TODOS</h3>
        <p>Puntuación máxima: <b>${score}</b></p>
        <button class="btn-primary" id="mg-again">Jugar otra vez</button>
      </div>`;
    el('mg-again').addEventListener('click', start);
    updateHud();
  }

  // ── Beta: previsualizar el reto (y el TEMA) de otros días ──
  function renderDayPreview() {
    const dp = el('mg-daypreview');
    if (!dp) return;
    const isToday = previewOffset === 0;
    const lbl = cap(formatKickoff(dayKey() + 'T12:00:00Z').date);
    const th = currentTheme();
    dp.innerHTML =
      '🔧 <b>Beta</b> · ver otro día: ' +
      '<button class="mg-day-arrow" id="mg-day-prev" aria-label="Día anterior">‹</button>' +
      `<span class="mg-day-lbl">${isToday ? 'Hoy' : lbl}</span>` +
      '<button class="mg-day-arrow" id="mg-day-next" aria-label="Día siguiente">›</button>' +
      `<span class="mg-day-theme">${th.emoji} ${th.label}</span>` +
      (isToday ? '' : ' <button class="mg-day-reset" id="mg-day-reset">Volver a hoy</button>');
    el('mg-day-prev').addEventListener('click', () => { previewOffset--; start(); });
    el('mg-day-next').addEventListener('click', () => { previewOffset++; start(); });
    const r = el('mg-day-reset'); if (r) r.addEventListener('click', () => { previewOffset = 0; start(); });
  }

  // ── Ranking (DATOS DE EJEMPLO — aún no hay backend del juego) ──
  function renderRanking() {
    const rank = el('mg-rank');
    if (!rank) return;
    const me = (localStorage.getItem('wc2026_username') || 'Tú').trim() || 'Tú';
    const best = getBest();
    const demo = [
      { n: 'Albert', s: 14, st: 6 }, { n: 'Alex Martos', s: 12, st: 4 },
      { n: 'Marc', s: 11, st: 5 }, { n: me + ' (tú)', s: best, st: 1, me: true },
      { n: 'Laura', s: 8, st: 2 }, { n: 'Jordi', s: 6, st: 3 },
    ];
    demo.sort((a, b) => b.s - a.s || b.st - a.st);
    const medals = ['🥇', '🥈', '🥉'];
    let rows = '';
    demo.forEach((d, i) => {
      const pos = i < 3 ? medals[i] : (i + 1);
      rows += `<div class="mg-rank-row${d.me ? ' me' : ''}">` +
        `<span class="mg-rank-pos">${pos}</span>` +
        `<span class="mg-rank-name">${d.n}</span>` +
        `<span class="mg-rank-streak">🔥 ${d.st}</span>` +
        `<span class="mg-rank-score">${d.s}</span>` +
      `</div>`;
    });
    rank.innerHTML =
      '<div class="mg-rank-head">🏆 Ranking del día <span class="mg-rank-tag">EJEMPLO</span></div>' +
      '<div class="mg-rank-sub">Aciertos seguidos de hoy · 🔥 = días seguidos jugando (racha)</div>' +
      '<div class="mg-rank-list">' + rows + '</div>' +
      '<p class="mg-note">Vista previa con datos inventados. En la versión final se guardarán las puntuaciones reales de tus amigos cada día, con ranking y rachas de verdad.</p>';
  }
})();
