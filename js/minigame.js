// ============================================================
//  Minijuego diario «¿Más o menos?» (Higher / Lower)
//  EN PRUEBAS: aparece como una BURBUJA flotante 🎮 (abajo-izquierda),
//  solo en el panel de admin → los amigos aún no lo ven.
//
//  Mecánica: ¿el siguiente jugador vale MÁS o MENOS que el actual?
//  Tienes 15 s por pregunta (si se agota, fallas → así no da tiempo a
//  buscar la respuesta). Aciertas → sigues; fallas → fin del día.
//  La secuencia es la MISMA para todos cada día (semilla = fecha).
//
//  Depende de data.js (madridDayKey).
// ============================================================

// Valor de mercado APROXIMADO en millones de € (fácil de editar a mano).
// No hace falta que sea exacto: es para jugar. iso = bandera (flagcdn).
const MG_PLAYERS = [
  { n: 'Vinícius Júnior',      iso: 'br',     v: 200 },
  { n: 'Kylian Mbappé',        iso: 'fr',     v: 180 },
  { n: 'Erling Haaland',       iso: 'no',     v: 180 },
  { n: 'Jude Bellingham',      iso: 'gb-eng', v: 180 },
  { n: 'Lamine Yamal',         iso: 'es',     v: 180 },
  { n: 'Florian Wirtz',        iso: 'de',     v: 140 },
  { n: 'Jamal Musiala',        iso: 'de',     v: 140 },
  { n: 'Bukayo Saka',          iso: 'gb-eng', v: 140 },
  { n: 'Rodri',                iso: 'es',     v: 130 },
  { n: 'Phil Foden',           iso: 'gb-eng', v: 130 },
  { n: 'Cole Palmer',          iso: 'gb-eng', v: 130 },
  { n: 'Federico Valverde',    iso: 'uy',     v: 130 },
  { n: 'Declan Rice',          iso: 'gb-eng', v: 110 },
  { n: 'Martin Ødegaard',      iso: 'no',     v: 110 },
  { n: 'Lautaro Martínez',     iso: 'ar',     v: 110 },
  { n: 'Harry Kane',           iso: 'gb-eng', v: 100 },
  { n: 'Pedri',                iso: 'es',     v: 100 },
  { n: 'Victor Osimhen',       iso: 'ng',     v: 100 },
  { n: 'Julián Álvarez',       iso: 'ar',     v: 90 },
  { n: 'Gavi',                 iso: 'es',     v: 90 },
  { n: 'Eduardo Camavinga',    iso: 'fr',     v: 90 },
  { n: 'Alexander Isak',       iso: 'se',     v: 90 },
  { n: 'Khvicha Kvaratskhelia',iso: 'ge',     v: 85 },
  { n: 'Aurélien Tchouaméni',  iso: 'fr',     v: 80 },
  { n: 'Bruno Guimarães',      iso: 'br',     v: 80 },
  { n: 'Pau Cubarsí',          iso: 'es',     v: 80 },
  { n: 'Rafael Leão',          iso: 'pt',     v: 75 },
  { n: 'Rúben Dias',           iso: 'pt',     v: 75 },
  { n: 'Enzo Fernández',       iso: 'ar',     v: 70 },
  { n: 'Alexis Mac Allister',  iso: 'ar',     v: 70 },
  { n: 'Nico Williams',        iso: 'es',     v: 70 },
  { n: 'João Neves',           iso: 'pt',     v: 70 },
  { n: 'Achraf Hakimi',        iso: 'ma',     v: 60 },
  { n: 'Dani Olmo',            iso: 'es',     v: 60 },
  { n: 'Theo Hernández',       iso: 'fr',     v: 50 },
  { n: 'Bruno Fernandes',      iso: 'pt',     v: 50 },
  { n: 'Mohamed Salah',        iso: 'eg',     v: 50 },
  { n: 'Son Heung-min',        iso: 'kr',     v: 40 },
  { n: 'Gianluigi Donnarumma', iso: 'it',     v: 40 },
  { n: 'Mike Maignan',         iso: 'fr',     v: 35 },
  { n: 'Kevin De Bruyne',      iso: 'be',     v: 30 },
  { n: 'Alisson Becker',       iso: 'br',     v: 30 },
  { n: 'Lionel Messi',         iso: 'ar',     v: 30 },
  { n: 'Thibaut Courtois',     iso: 'be',     v: 25 },
  { n: 'Antoine Griezmann',    iso: 'fr',     v: 25 },
  { n: 'Neymar Jr',            iso: 'br',     v: 20 },
  { n: 'Cristiano Ronaldo',    iso: 'pt',     v: 15 },
  { n: 'Robert Lewandowski',   iso: 'pl',     v: 15 },
  { n: 'Luka Modrić',          iso: 'hr',     v: 10 },
];

(function () {
  const ROUND_MS = 15000; // 15 s por pregunta
  let seq = [], idx = 0, score = 0, busy = false, over = false, started = false;
  let deadline = 0, timerId = null, open = false;

  const el = id => document.getElementById(id);
  const dayKey = () => madridDayKey(new Date());
  const seedInt = () => parseInt(dayKey().replace(/-/g, ''), 10) || 1;

  // PRNG con semilla → la secuencia del día es igual para todos.
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
    const arr = MG_PLAYERS.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    // Evita valores iguales consecutivos (así MÁS/MENOS siempre tiene respuesta).
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
  const bestKey = () => 'wc2026_mg_best_' + dayKey();
  const getBest = () => parseInt(localStorage.getItem(bestKey()) || '0', 10) || 0;
  function setBest(v) { if (v > getBest()) localStorage.setItem(bestKey(), String(v)); }

  // ── Burbuja flotante 🎮 + panel (abajo-izquierda, como el reproductor) ──
  const fab = document.createElement('button');
  fab.className = 'mg-fab';
  fab.type = 'button';
  fab.setAttribute('aria-label', 'Reto del día');
  fab.textContent = '🎮';

  const panel = document.createElement('div');
  panel.className = 'mg-panel hidden';
  panel.innerHTML =
    '<div class="mg-panel-head">' +
      '<span class="mg-panel-title">🎮 Reto del día · ¿Más o menos?</span>' +
      '<button type="button" class="mg-close" id="mg-close" aria-label="Cerrar">✕</button>' +
    '</div>' +
    '<div class="mg-timer-row">' +
      '<div class="mg-timer-track"><div class="mg-timer-bar" id="mg-timer-bar"></div></div>' +
      '<span class="mg-timer-num" id="mg-timer-num">15s</span>' +
    '</div>' +
    '<div class="mg-hud" id="mg-hud"></div>' +
    '<div id="mg-board"></div>';

  document.body.appendChild(panel);
  document.body.appendChild(fab);

  fab.addEventListener('click', function () {
    open = !open;
    panel.classList.toggle('hidden', !open);
    fab.classList.toggle('active', open);
    if (open && !started) start(); // primera vez: empieza el reto
  });
  el('mg-close').addEventListener('click', function () {
    open = false;
    panel.classList.add('hidden');
    fab.classList.remove('active');
    // El temporizador SIGUE corriendo aunque cierres (anti-trampas: no puedes
    // cerrar para buscar la respuesta y volver con tiempo de sobra).
  });

  // ── Temporizador (15 s por pregunta) ──
  function stopTimer() { if (timerId) { clearInterval(timerId); timerId = null; } }
  function startTimer() {
    stopTimer();
    deadline = Date.now() + ROUND_MS;
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

  function start() {
    seq = buildDailySeq();
    idx = 0; score = 0; over = false; busy = false; started = true;
    render();
  }

  function render() {
    const wrap = el('mg-board');
    if (!wrap) return;
    const A = seq[idx], B = seq[idx + 1];
    if (!B) { renderWin(); return; }
    wrap.innerHTML = `
      <div class="mg-card">
        ${flag(A.iso)}
        <div class="mg-name">${A.n}</div>
        <div class="mg-sub">valor de mercado</div>
        <div class="mg-val">${A.v} M€</div>
      </div>
      <div class="mg-vs">¿<b>${B.n}</b> vale más o menos?</div>
      <div class="mg-card mg-card-b">
        ${flag(B.iso)}
        <div class="mg-name">${B.n}</div>
        <div class="mg-sub">valor de mercado</div>
        <div class="mg-val mg-hidden" id="mg-bval">??? M€</div>
        <div class="mg-buttons">
          <button class="mg-btn mg-more" id="mg-more">⬆️ MÁS de ${A.v} M€</button>
          <button class="mg-btn mg-less" id="mg-less">⬇️ MENOS</button>
        </div>
      </div>`;
    el('mg-more').addEventListener('click', () => guess('mas'));
    el('mg-less').addEventListener('click', () => guess('menos'));
    updateHud();
    startTimer(); // arranca los 15 s de esta pregunta
  }

  function disableButtons() {
    ['mg-more', 'mg-less'].forEach(id => { const b = el(id); if (b) b.disabled = true; });
  }

  function guess(dir) {
    if (busy || over) return;
    busy = true;
    stopTimer(); // el reloj se detiene al responder
    const A = seq[idx], B = seq[idx + 1];
    const correct = B.v > A.v ? 'mas' : 'menos'; // sin empates (ver buildDailySeq)
    const ok = dir === correct;

    const bval = el('mg-bval');
    if (bval) {
      bval.textContent = B.v + ' M€';
      bval.classList.remove('mg-hidden');
      bval.classList.add(ok ? 'mg-ok' : 'mg-bad');
    }
    disableButtons();

    if (ok) {
      score++;
      setBest(score);
      updateHud();
      setTimeout(() => { idx++; busy = false; render(); }, 1100);
    } else {
      over = true;
      setBest(score);
      setTimeout(() => renderOver('wrong'), 1200);
    }
  }

  function timeUp() {
    if (over || busy) return;
    over = true;
    const B = seq[idx + 1];
    const bval = el('mg-bval');
    if (B && bval) {
      bval.textContent = B.v + ' M€';
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
})();
