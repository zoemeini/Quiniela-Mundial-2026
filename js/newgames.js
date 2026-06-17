// ============================================================
//  newgames.js — minijuegos NUEVOS en pruebas (aún NO en la rotación).
//  Se renderizan en la página admin para testearlos. Autónomo: no toca
//  minigame.js ni el backend. Cada instancia tiene su propio estado.
// ============================================================
(function () {
  'use strict';
  function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  function flag(iso) { return iso ? `<img class="team-flag-img" src="https://flagcdn.com/w40/${iso}.png" srcset="https://flagcdn.com/w80/${iso}.png 2x" alt="" loading="lazy">` : ''; }
  function shuffle(arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, '').trim().replace(/\s+/g, ' '); }
  // Distancia de edición (para aceptar erratas/faltas).
  function lev(a, b) {
    const m = a.length, n = b.length; if (!m) return n; if (!n) return m;
    let prev = Array.from({ length: n + 1 }, (_, i) => i), cur = new Array(n + 1);
    for (let i = 1; i <= m; i++) {
      cur[0] = i;
      for (let j = 1; j <= n; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      }
      const t = prev; prev = cur; cur = t;
    }
    return prev[n];
  }
  // Acierto tolerante: nombre completo, sin espacios, o cualquier palabra larga
  // (nombre/apellido), admitiendo erratas/faltas según la longitud.
  function nameMatch(input, full) {
    const a = norm(input); if (a.length < 3) return false;
    const f = norm(full);
    const targets = [f, f.replace(/ /g, '')].concat(f.split(' ').filter(w => w.length >= 3));
    for (const t of targets) {
      const allow = t.length <= 4 ? 1 : (t.length <= 7 ? 2 : 3); // tolerancia por longitud
      if (lev(a, t) <= allow) return true;
    }
    return false;
  }
  function intro(emoji, rulesHTML, btn) {
    return `<div class="ng-intro"><div class="ng-intro-emoji">${emoji}</div>${rulesHTML}
      <button type="button" class="btn-primary ng-btn" data-act="start">${btn || '▶️ Empezar'}</button></div>`;
  }

  // ── CONTENIDOS (provisionales, para revisar) ─────────────────────────
  // 1) MEMORY — alineaciones MEZCLADAS (jugadores de distintos países). 4-3-3.
  const LINEUPS = [
    { label: 'Mezcla 1', players: [
      { n: 'Courtois', iso: 'be', x: 50, y: 91 },
      { n: 'Theo Hernández', iso: 'fr', x: 12, y: 67 }, { n: 'Van Dijk', iso: 'nl', x: 37, y: 72 }, { n: 'Rúben Dias', iso: 'pt', x: 63, y: 72 }, { n: 'Hakimi', iso: 'ma', x: 88, y: 67 },
      { n: 'Bellingham', iso: 'gb-eng', x: 22, y: 47 }, { n: 'Rodri', iso: 'es', x: 50, y: 52 }, { n: 'Modrić', iso: 'hr', x: 78, y: 47 },
      { n: 'Vinícius', iso: 'br', x: 16, y: 24 }, { n: 'Haaland', iso: 'no', x: 50, y: 18 }, { n: 'Messi', iso: 'ar', x: 84, y: 24 },
    ] },
    { label: 'Mezcla 2', players: [
      { n: 'E. Martínez', iso: 'ar', x: 50, y: 91 },
      { n: 'Grimaldo', iso: 'es', x: 12, y: 67 }, { n: 'Saliba', iso: 'fr', x: 37, y: 72 }, { n: 'Romero', iso: 'ar', x: 63, y: 72 }, { n: 'Koundé', iso: 'fr', x: 88, y: 67 },
      { n: 'Pedri', iso: 'es', x: 22, y: 47 }, { n: 'De Bruyne', iso: 'be', x: 50, y: 52 }, { n: 'Bruno Fernandes', iso: 'pt', x: 78, y: 47 },
      { n: 'Mbappé', iso: 'fr', x: 16, y: 24 }, { n: 'Kane', iso: 'gb-eng', x: 50, y: 18 }, { n: 'Son', iso: 'kr', x: 84, y: 24 },
    ] },
    { label: 'Mezcla 3', players: [
      { n: 'Maignan', iso: 'fr', x: 50, y: 91 },
      { n: 'Davies', iso: 'ca', x: 12, y: 67 }, { n: 'Marquinhos', iso: 'br', x: 37, y: 72 }, { n: 'Bastoni', iso: 'it', x: 63, y: 72 }, { n: 'Carvajal', iso: 'es', x: 88, y: 67 },
      { n: 'Gavi', iso: 'es', x: 22, y: 47 }, { n: 'Kimmich', iso: 'de', x: 50, y: 52 }, { n: 'Valverde', iso: 'uy', x: 78, y: 47 },
      { n: 'Lautaro', iso: 'ar', x: 16, y: 24 }, { n: 'Lewandowski', iso: 'pl', x: 50, y: 18 }, { n: 'Lamine Yamal', iso: 'es', x: 84, y: 24 },
    ] },
  ];

  // 2) DORSALES — dorsal de SELECCIÓN (según su nº más reciente con su país).
  //    Números distintos dentro de cada set.
  const DORSAL_SETS = [
    { label: 'Cracks 1', pairs: [
      ['Messi', 'ar', 10], ['Vinícius Jr', 'br', 7], ['Harry Kane', 'gb-eng', 9], ['Van Dijk', 'nl', 4], ['Rodri', 'es', 16],
      ['Lamine Yamal', 'es', 19], ['Lautaro', 'ar', 22], ['E. Martínez', 'ar', 23], ['Salah', 'eg', 11], ['Saliba', 'fr', 17],
    ] },
    { label: 'Cracks 2', pairs: [
      ['Mbappé', 'fr', 10], ['Cristiano Ronaldo', 'pt', 7], ['Haaland', 'no', 9], ['Tchouaméni', 'fr', 8], ['Kimmich', 'de', 6],
      ['Wirtz', 'de', 17], ['Hakimi', 'ma', 2], ['Foden', 'gb-eng', 11], ['Mac Allister', 'ar', 20], ['Rúben Dias', 'pt', 3],
    ] },
    { label: 'Cracks 3', pairs: [
      ['Bellingham', 'gb-eng', 10], ['Son', 'kr', 7], ['J. Álvarez', 'ar', 9], ['Nico Williams', 'es', 17], ['Pedri', 'es', 8],
      ['Gvardiol', 'hr', 20], ['Theo Hernández', 'fr', 22], ['Maignan', 'fr', 16], ['Gündoğan', 'de', 21], ['Cucurella', 'es', 14],
    ] },
  ];

  // 3) KEEPIE — 3 variantes de dificultad (px/s²).
  const KEEPIE = [
    { label: 'Normal', gravity: 950, bounce: 460, ball: 56 },
    { label: 'Rápido', gravity: 1250, bounce: 500, ball: 50 },
    { label: 'Difícil', gravity: 1600, bounce: 540, ball: 44 },
  ];

  // 4) GOL O TARJETA — jugador con país+posición reales.
  const POSITIONS = ['Portero', 'Defensa', 'Centrocampista', 'Delantero'];
  const COUNTRIES = [
    { name: 'Argentina', iso: 'ar' }, { name: 'Brasil', iso: 'br' }, { name: 'Francia', iso: 'fr' }, { name: 'España', iso: 'es' },
    { name: 'Inglaterra', iso: 'gb-eng' }, { name: 'Portugal', iso: 'pt' }, { name: 'Alemania', iso: 'de' }, { name: 'Países Bajos', iso: 'nl' },
    { name: 'Bélgica', iso: 'be' }, { name: 'Croacia', iso: 'hr' }, { name: 'Italia', iso: 'it' }, { name: 'Uruguay', iso: 'uy' },
    { name: 'Marruecos', iso: 'ma' }, { name: 'Noruega', iso: 'no' }, { name: 'Corea del Sur', iso: 'kr' }, { name: 'Polonia', iso: 'pl' },
  ];
  const CARD_SETS = [
    { label: 'Tanda 1', players: [
      { n: 'Messi', c: 'Argentina', iso: 'ar', p: 'Delantero' }, { n: 'Courtois', c: 'Bélgica', iso: 'be', p: 'Portero' },
      { n: 'Van Dijk', c: 'Países Bajos', iso: 'nl', p: 'Defensa' }, { n: 'Rodri', c: 'España', iso: 'es', p: 'Centrocampista' },
      { n: 'Mbappé', c: 'Francia', iso: 'fr', p: 'Delantero' }, { n: 'Bellingham', c: 'Inglaterra', iso: 'gb-eng', p: 'Centrocampista' },
      { n: 'Hakimi', c: 'Marruecos', iso: 'ma', p: 'Defensa' }, { n: 'Modrić', c: 'Croacia', iso: 'hr', p: 'Centrocampista' },
      { n: 'Haaland', c: 'Noruega', iso: 'no', p: 'Delantero' }, { n: 'E. Martínez', c: 'Argentina', iso: 'ar', p: 'Portero' },
    ] },
    { label: 'Tanda 2', players: [
      { n: 'Cristiano Ronaldo', c: 'Portugal', iso: 'pt', p: 'Delantero' }, { n: 'Maignan', c: 'Francia', iso: 'fr', p: 'Portero' },
      { n: 'Rúben Dias', c: 'Portugal', iso: 'pt', p: 'Defensa' }, { n: 'Pedri', c: 'España', iso: 'es', p: 'Centrocampista' },
      { n: 'Vinícius Jr', c: 'Brasil', iso: 'br', p: 'Delantero' }, { n: 'Kimmich', c: 'Alemania', iso: 'de', p: 'Centrocampista' },
      { n: 'Saliba', c: 'Francia', iso: 'fr', p: 'Defensa' }, { n: 'Son', c: 'Corea del Sur', iso: 'kr', p: 'Delantero' },
      { n: 'Harry Kane', c: 'Inglaterra', iso: 'gb-eng', p: 'Delantero' }, { n: 'Theo Hernández', c: 'Francia', iso: 'fr', p: 'Defensa' },
    ] },
    { label: 'Tanda 3', players: [
      { n: 'Lautaro', c: 'Argentina', iso: 'ar', p: 'Delantero' }, { n: 'Donnarumma', c: 'Italia', iso: 'it', p: 'Portero' },
      { n: 'Marquinhos', c: 'Brasil', iso: 'br', p: 'Defensa' }, { n: 'De Bruyne', c: 'Bélgica', iso: 'be', p: 'Centrocampista' },
      { n: 'Lewandowski', c: 'Polonia', iso: 'pl', p: 'Delantero' }, { n: 'Gavi', c: 'España', iso: 'es', p: 'Centrocampista' },
      { n: 'Valverde', c: 'Uruguay', iso: 'uy', p: 'Centrocampista' }, { n: 'Davies', c: 'Canadá', iso: 'ca', p: 'Defensa' },
      { n: 'Lamine Yamal', c: 'España', iso: 'es', p: 'Delantero' }, { n: 'Carvajal', c: 'España', iso: 'es', p: 'Defensa' },
    ] },
  ];

  // 5) CÁLCULO RELÁMPAGO — 3 niveles de dificultad (60 s, gana quien más acierte).
  const MATH = [
    { label: 'Fácil', ops: ['add', 'sub'] },
    { label: 'Medio', ops: ['add', 'sub', 'mul'] },
    { label: 'Difícil', ops: ['add', 'sub', 'mul', 'chain'] },
  ];
  // 6) MASTERMIND DEL MARCADOR — 3 códigos (3 cifras distintas, 8 intentos).
  const CODE = [{ label: 'Código 1' }, { label: 'Código 2' }, { label: 'Código 3' }];
  function ri(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }

  // ── 1) MEMORY ─────────────────────────────────────────────────────────
  function mountMemory(root, content) {
    const players = content.players;
    let phase = 'intro', secs = 20, typed = {}, cd = null;
    function pitch(inner) { return `<div class="ng-pitch ng-phase-${phase}">${inner}</div>`; }
    function chipsMemo() { return players.map(p => `<div class="ng-chip show" style="left:${p.x}%;top:${p.y}%">${flag(p.iso)} ${esc(p.n)}</div>`).join(''); }
    function chipsInputs() { return players.map((p, i) => `<input class="ng-chip ng-input" data-chip="${i}" style="left:${p.x}%;top:${p.y}%" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="?">`).join(''); }
    function chipsDone() {
      return players.map((p, i) => {
        const ok = nameMatch(typed[i] || '', p.n);
        const shown = (typed[i] || '').trim() || '—';
        return `<div class="ng-chip ${ok ? 'correct' : 'wrong'}" style="left:${p.x}%;top:${p.y}%">${ok ? esc(p.n) : esc(shown) + `<span class="ng-chip-fix">${esc(p.n)}</span>`}</div>`;
      }).join('');
    }
    function paint() {
      if (phase === 'intro') {
        root.innerHTML = intro('🧠', `<p class="ng-intro-rules"><b>Memoriza la alineación.</b> Verás 11 jugadores de <b>distintos países</b> colocados en el campo durante <b>20 segundos</b>. Luego desaparecen y tienes que <b>escribir el nombre</b> de cada uno en su posición.</p><p class="ng-intro-note">Vale con el apellido (p. ej. «yamal») y aunque tenga alguna errata. Gana quien recuerde más.</p>`, '👀 Empezar a memorizar');
        return;
      }
      if (phase === 'memo') { root.innerHTML = pitch(chipsMemo()) + `<div class="ng-controls"><div class="ng-memo-count">Memoriza… <b>${secs}</b> s</div></div>`; return; }
      if (phase === 'recall') { root.innerHTML = pitch(chipsInputs()) + `<div class="ng-hint">Escribe el nombre de cada posición y pulsa Comprobar.</div><div class="ng-controls"><button type="button" class="btn-primary ng-btn" data-act="check">✅ Comprobar</button></div>`; return; }
      if (phase === 'done') {
        let ok = 0; players.forEach((p, i) => { if (nameMatch(typed[i] || '', p.n)) ok++; });
        root.innerHTML = pitch(chipsDone()) + `<div class="ng-controls"><div class="ng-result">Acertaste <b>${ok}/11</b> ${ok >= 9 ? '🏆' : ok >= 6 ? '👏' : '💪'}</div><button type="button" class="btn-outline ng-btn" data-act="reset">🔄 Otra vez</button></div>`;
      }
    }
    root.addEventListener('click', e => {
      const act = e.target.closest('[data-act]'); if (!act) return;
      if (act.dataset.act === 'start') { phase = 'memo'; secs = 20; typed = {}; paint(); clearInterval(cd); cd = setInterval(() => { secs--; if (secs <= 0) { clearInterval(cd); phase = 'recall'; paint(); } else paint(); }, 1000); }
      else if (act.dataset.act === 'check') { root.querySelectorAll('.ng-input').forEach(inp => { typed[+inp.dataset.chip] = inp.value; }); phase = 'done'; paint(); }
      else if (act.dataset.act === 'reset') { phase = 'intro'; paint(); }
    });
    paint();
  }

  // ── 2) DORSALES ───────────────────────────────────────────────────────
  function mountDorsales(root, content) {
    const players = content.pairs.map((p, i) => ({ idx: i, name: p[0], iso: p[1], num: p[2] }));
    const numbers = shuffle(players.map(p => p.num));
    let phase = 'intro', assign = {}, selPlayer = null;
    function numOf(idx) { return assign[idx]; }
    function playerOfNum(num) { for (const k in assign) if (assign[k] === num) return +k; return null; }
    function paint() {
      if (phase === 'intro') {
        root.innerHTML = intro('🔢', `<p class="ng-intro-rules"><b>Relaciona cada jugador con su dorsal</b> (el número que lleva con su selección). Toca un jugador y luego su número. Puedes cambiarlo antes de comprobar.</p><p class="ng-intro-note">10 jugadores · gana quien acierte más.</p>`, '▶️ Empezar');
        return;
      }
      const done = phase === 'done';
      const left = players.map(p => {
        const n = numOf(p.idx); let cls = 'ng-pl-row';
        if (selPlayer === p.idx) cls += ' sel';
        if (done) cls += (n === p.num ? ' correct' : ' wrong');
        const badge = n != null ? `<span class="ng-pl-num">${n}</span>` : `<span class="ng-pl-num empty">—</span>`;
        const fix = (done && n !== p.num) ? `<span class="ng-pl-fix">es ${p.num}</span>` : '';
        return `<button type="button" class="${cls}" data-pl="${p.idx}"${done ? ' disabled' : ''}>${flag(p.iso)}<span class="ng-pl-name">${esc(p.name)}</span>${fix}${badge}</button>`;
      }).join('');
      const right = numbers.map(num => {
        const owner = playerOfNum(num); let cls = 'ng-num'; if (owner != null) cls += ' used';
        return `<button type="button" class="${cls}" data-num="${num}"${done ? ' disabled' : ''}>${num}</button>`;
      }).join('');
      let footer;
      if (done) { let ok = 0; players.forEach(p => { if (numOf(p.idx) === p.num) ok++; }); footer = `<div class="ng-result">Acertaste <b>${ok}/10</b> ${ok >= 8 ? '🏆' : ok >= 5 ? '👏' : '💪'}</div><button type="button" class="btn-outline ng-btn" data-act="reset">🔄 Otra vez</button>`; }
      else { const placed = Object.keys(assign).length; footer = `<button type="button" class="btn-primary ng-btn" data-act="check"${placed === 0 ? ' disabled' : ''}>✅ Comprobar (${placed}/10)</button>`; }
      root.innerHTML = `<div class="ng-hint">Toca un jugador y luego su dorsal.</div><div class="ng-dorsal"><div class="ng-dorsal-players">${left}</div><div class="ng-dorsal-nums">${right}</div></div><div class="ng-controls">${footer}</div>`;
    }
    root.addEventListener('click', e => {
      const act = e.target.closest('[data-act]'), pl = e.target.closest('[data-pl]'), num = e.target.closest('[data-num]');
      if (act) { if (act.dataset.act === 'start') phase = 'play'; else if (act.dataset.act === 'check') phase = 'done'; else if (act.dataset.act === 'reset') { phase = 'intro'; assign = {}; selPlayer = null; } paint(); return; }
      if (phase !== 'play') return;
      if (pl) { const i = +pl.dataset.pl; selPlayer = (selPlayer === i) ? null : i; paint(); return; }
      if (num) { const v = +num.dataset.num; if (selPlayer == null) return; const prev = playerOfNum(v); if (prev != null) delete assign[prev]; assign[selPlayer] = v; selPlayer = null; paint(); }
    });
    paint();
  }

  // ── 3) KEEPIE (que no caiga la pelota) — 3 intentos, cuenta el mejor ──
  function mountKeepie(root, content) {
    let raf = null, last = 0, running = false, startT = 0, touches = 0;
    let attempt = 0, best = 0, b = null, w = 0, h = 0;
    function shell(controls, msg) {
      root.innerHTML = `<div class="ng-keepie-area" data-area>
          <div class="ng-keepie-hud" data-hud></div>
          <div class="ng-ball" data-ball style="display:none">⚽</div>
          ${msg ? `<div class="ng-keepie-msg" data-msg>${msg}</div>` : ''}
        </div>
        <div class="ng-controls" data-controls>${controls}</div>`;
    }
    function introScreen() {
      stop(); attempt = 0; best = 0;
      root.innerHTML = intro('⚽', `<p class="ng-intro-rules"><b>No dejes caer la pelota.</b> Tócala para impulsarla hacia arriba antes de que toque el suelo. Aguanta el máximo de segundos.</p><p class="ng-intro-note">Tienes <b>3 intentos</b> · cuenta tu <b>mejor</b> tiempo.</p>`, '▶️ Empezar');
    }
    function bestLine() { return best ? ` · 🔥 Mejor: <b>${best.toFixed(1)} s</b>` : ''; }
    function start() {
      attempt++;
      shell(`<span class="ng-hint">Intento ${attempt}/3 · toca la pelota ⚽</span>`);
      const area = root.querySelector('[data-area]'); const r = area.getBoundingClientRect();
      w = r.width; h = r.height; if (w < 20 || h < 20) { w = 320; h = 260; }
      const rad = content.ball / 2;
      b = { x: w / 2, y: h * 0.5, vx: (Math.random() * 100 - 50), vy: -content.bounce * 0.75, r: rad };
      touches = 0; running = true; startT = performance.now(); last = 0;
      const ball = root.querySelector('[data-ball]'); ball.style.display = ''; ball.style.width = ball.style.height = content.ball + 'px';
      place(); cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
    }
    function place() {
      const ball = root.querySelector('[data-ball]'); if (!ball) return;
      ball.style.left = b.x + 'px'; ball.style.top = b.y + 'px';
      const hud = root.querySelector('[data-hud]'); if (hud) hud.innerHTML = `Intento ${attempt}/3 · ⏱ <b>${((performance.now() - startT) / 1000).toFixed(1)}</b> s · ${touches} toques${bestLine()}`;
    }
    function loop(t) {
      if (!running) return;
      if (!last) last = t; let dt = (t - last) / 1000; last = t; if (dt > 0.05) dt = 0.05;
      b.vy += content.gravity * dt; b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx) * 0.85; }
      if (b.x > w - b.r) { b.x = w - b.r; b.vx = -Math.abs(b.vx) * 0.85; }
      if (b.y < b.r) { b.y = b.r; b.vy = Math.abs(b.vy) * 0.5; }
      if (b.y > h - b.r) return over();
      place(); raf = requestAnimationFrame(loop);
    }
    function tap(e) { if (!running) return; e.preventDefault(); b.vy = -content.bounce; b.vx += (Math.random() * 140 - 70); if (b.vx > 260) b.vx = 260; if (b.vx < -260) b.vx = -260; touches++; }
    function over() {
      running = false; cancelAnimationFrame(raf);
      const secs = (performance.now() - startT) / 1000; if (secs > best) best = secs;
      const ctrls = root.querySelector('[data-controls]');
      const ball = root.querySelector('[data-ball]'); if (ball) ball.style.display = 'none';
      const hud = root.querySelector('[data-hud]'); if (hud) hud.innerHTML = `💥 ¡Cayó!${bestLine()}`;
      if (attempt < 3) ctrls.innerHTML = `<div class="ng-result">Intento ${attempt}: <b>${secs.toFixed(1)} s</b></div><button type="button" class="btn-primary ng-btn" data-act="next">▶️ Intento ${attempt + 1}/3</button>`;
      else ctrls.innerHTML = `<div class="ng-result">¡Terminado! Tu mejor: <b>${best.toFixed(1)} s</b> ${best >= 20 ? '🏆' : best >= 10 ? '👏' : '💪'}</div><button type="button" class="btn-outline ng-btn" data-act="reset">🔄 Otra vez (3 intentos)</button>`;
    }
    function stop() { running = false; cancelAnimationFrame(raf); raf = null; }
    root.addEventListener('click', e => { const a = e.target.closest('[data-act]'); if (!a) return; if (a.dataset.act === 'start' || a.dataset.act === 'next') start(); else if (a.dataset.act === 'reset') introScreen(); });
    root.addEventListener('pointerdown', e => { if (e.target.closest('[data-ball]')) tap(e); });
    introScreen();
  }

  // ── 4) GOL O TARJETA ──────────────────────────────────────────────────
  function mountCard(root, content) {
    const pool = content.players;
    let phase = 'intro', rounds = [], idx = 0, score = 0, answered = false, timer = null, deadline = 0;
    function wrongCountry(p) { const opts = COUNTRIES.filter(c => c.name !== p.c); return opts[Math.floor(Math.random() * opts.length)]; }
    function wrongPos(pos) { const opts = POSITIONS.filter(x => x !== pos); return opts[Math.floor(Math.random() * opts.length)]; }
    function build() {
      const cats = shuffle(['gol', 'gol', 'gol', 'yellow', 'yellow', 'yellow', 'yellow', 'red', 'red', 'red']);
      rounds = shuffle(pool).map((p, i) => {
        const cat = cats[i]; let okC = true, okP = true;
        if (cat === 'red') { okC = okP = false; }
        else if (cat === 'yellow') { if (Math.random() < 0.5) okC = false; else okP = false; }
        return { p, country: okC ? { name: p.c, iso: p.iso } : wrongCountry(p), pos: okP ? p.p : wrongPos(p.p), ans: cat };
      });
      idx = 0; score = 0;
    }
    function clearT() { clearInterval(timer); timer = null; }
    function roundMs() { return idx < 5 ? 8000 : 4000; } // 8 s las 5 primeras, 4 s las 5 últimas
    function startTimer() {
      clearT(); const total = roundMs(); deadline = performance.now() + total;
      timer = setInterval(() => {
        const rem = Math.max(0, deadline - performance.now());
        const bar = root.querySelector('[data-bar]'); if (bar) { bar.style.width = (rem / total * 100) + '%'; bar.classList.toggle('low', rem <= total * 0.35); }
        if (rem <= 0) { clearT(); answer(null); }
      }, 80);
    }
    function paintRound() {
      const r = rounds[idx];
      root.innerHTML = `<div class="ng-card-game">
        <div class="ng-card-meta">Jugador <b>${idx + 1}/10</b> · Aciertos: <b>${score}</b></div>
        ${idx >= 5 ? '<div class="ng-card-fast">⚡ ¡Más rápido! · 4 s</div>' : ''}
        <div class="ng-card-bar"><div class="ng-card-bar-fill" data-bar style="width:100%"></div></div>
        <div class="ng-card-player">
          <div class="ng-card-name">${esc(r.p.n)}</div>
          <div class="ng-card-attrs"><span class="ng-card-attr">${flag(r.country.iso)} ${esc(r.country.name)}</span><span class="ng-card-attr">${esc(r.pos)}</span></div>
        </div>
        <div class="ng-card-btns">
          <button type="button" class="ng-card-btn gol" data-ans="gol">⚽<span>Gol</span></button>
          <button type="button" class="ng-card-btn yellow" data-ans="yellow">🟨<span>Amarilla</span></button>
          <button type="button" class="ng-card-btn red" data-ans="red">🟥<span>Roja</span></button>
        </div>
        <div class="ng-card-fb" data-fb></div>
      </div>`;
    }
    function answer(choice) {
      if (answered) return; answered = true; clearT();
      const r = rounds[idx]; const ok = choice === r.ans; if (ok) score++;
      root.querySelectorAll('.ng-card-btn').forEach(btn => { btn.disabled = true; if (btn.dataset.ans === r.ans) btn.classList.add('right'); else if (btn.dataset.ans === choice) btn.classList.add('chosen-wrong'); });
      const why = `Real: ${flag(r.p.iso)} ${esc(r.p.c)} · ${esc(r.p.p)}`;
      const fb = root.querySelector('[data-fb]'); if (fb) fb.innerHTML = `<div class="${ok ? 'ng-fb-ok' : 'ng-fb-bad'}">${ok ? '✅ ¡Bien!' : (choice ? '❌ Fallaste' : '⏱ Sin tiempo')}</div><div class="ng-fb-why">${why}</div>`;
      setTimeout(() => { idx++; if (idx >= rounds.length) finish(); else { answered = false; paintRound(); startTimer(); } }, 1500);
    }
    function finish() {
      root.innerHTML = `<div class="ng-controls"><div class="ng-result">Acertaste <b>${score}/10</b> ${score >= 8 ? '🏆' : score >= 5 ? '👏' : '💪'}</div><button type="button" class="btn-outline ng-btn" data-act="reset">🔄 Otra vez</button></div>`;
    }
    function paintIntro() {
      phase = 'intro'; clearT();
      root.innerHTML = intro('🟨', `<p class="ng-intro-rules">Verás un jugador con un <b>país</b> y una <b>posición</b>. Decide rápido:</p>
        <ul class="ng-intro-list">
          <li>⚽ <b>Gol</b> — si país <b>y</b> posición son <b>correctos</b>.</li>
          <li>🟨 <b>Amarilla</b> — si <b>solo uno</b> es correcto.</li>
          <li>🟥 <b>Roja</b> — si los <b>dos están mal</b>.</li>
        </ul>
        <div class="ng-intro-example"><b>Ejemplo:</b> «Messi · Argentina · Delantero» → ⚽ &nbsp;·&nbsp; «Messi · Brasil · Delantero» → 🟨 &nbsp;·&nbsp; «Messi · Brasil · Portero» → 🟥</div>
        <p class="ng-intro-note">10 jugadores · <b>8 s</b> los 5 primeros y <b>4 s</b> los 5 últimos (¡más rápido!) · gana quien acierte más.</p>`, '▶️ Empezar');
    }
    root.addEventListener('click', e => {
      const act = e.target.closest('[data-act]'), ans = e.target.closest('[data-ans]');
      if (act) { if (act.dataset.act === 'start') { build(); phase = 'play'; answered = false; paintRound(); startTimer(); } else if (act.dataset.act === 'reset') paintIntro(); return; }
      if (ans && phase === 'play') answer(ans.dataset.ans);
    });
    paintIntro();
  }

  // ── 5) CÁLCULO RELÁMPAGO ──────────────────────────────────────────────
  function mountMath(root, content) {
    const DUR = 60000;
    let phase = 'intro', score = 0, cur = null, deadline = 0, timer = null;
    function genOp() {
      const op = content.ops[ri(0, content.ops.length - 1)];
      let a, b, c, text, ans;
      if (op === 'add') { a = ri(8, 49); b = ri(8, 49); ans = a + b; text = `${a} + ${b}`; }
      else if (op === 'sub') { a = ri(20, 60); b = ri(5, a - 1); ans = a - b; text = `${a} − ${b}`; }
      else if (op === 'mul') { a = ri(2, 12); b = ri(2, 9); ans = a * b; text = `${a} × ${b}`; }
      else { a = ri(2, 9); b = ri(2, 9); c = ri(1, 20); const plus = Math.random() < 0.6; ans = plus ? a * b + c : a * b - c; if (ans < 0) { ans = a * b + c; text = `${a} × ${b} + ${c}`; } else text = `${a} × ${b} ${plus ? '+' : '−'} ${c}`; }
      const opts = new Set([ans]); const list = [ans];
      while (list.length < 3) { let d = ans + (Math.random() < 0.5 ? -1 : 1) * ri(1, 6); if (d < 0) d = ans + ri(1, 6); if (!opts.has(d)) { opts.add(d); list.push(d); } }
      return { text, ans, opts: shuffle(list) };
    }
    function paintRound() {
      cur = genOp();
      root.innerHTML = `<div class="ng-math">
        <div class="ng-card-meta">Aciertos: <b>${score}</b></div>
        <div class="ng-card-bar"><div class="ng-card-bar-fill" data-bar style="width:100%"></div></div>
        <div class="ng-math-op">⚽ ${cur.text} <span class="ng-math-eq">=</span> <b>?</b></div>
        <div class="ng-math-opts">${cur.opts.map(v => `<button type="button" class="ng-math-opt" data-v="${v}">${v}</button>`).join('')}</div>
      </div>`;
    }
    function startTimer() {
      clearInterval(timer); deadline = performance.now() + DUR;
      timer = setInterval(() => {
        const rem = Math.max(0, deadline - performance.now());
        const bar = root.querySelector('[data-bar]'); if (bar) { bar.style.width = (rem / DUR * 100) + '%'; bar.classList.toggle('low', rem <= 10000); }
        if (rem <= 0) { clearInterval(timer); finish(); }
      }, 100);
    }
    function finish() {
      clearInterval(timer);
      root.innerHTML = `<div class="ng-controls"><div class="ng-result">${score} ${score === 1 ? 'acierto' : 'aciertos'} en 60 s ${score >= 20 ? '🏆' : score >= 12 ? '👏' : '💪'}</div><button type="button" class="btn-outline ng-btn" data-act="reset">🔄 Otra vez</button></div>`;
    }
    function paintIntro() { phase = 'intro'; clearInterval(timer); root.innerHTML = intro('⚡', `<p class="ng-intro-rules"><b>Cálculo relámpago.</b> Resuelve el máximo de operaciones en <b>60 segundos</b>. Toca el resultado correcto; si fallas, esa opción se descarta y sigues.</p><p class="ng-intro-note">Gana quien más acierte.</p>`, '▶️ Empezar'); }
    root.addEventListener('click', e => {
      const act = e.target.closest('[data-act]'), opt = e.target.closest('[data-v]');
      if (act) { if (act.dataset.act === 'start') { score = 0; phase = 'play'; paintRound(); startTimer(); } else if (act.dataset.act === 'reset') paintIntro(); return; }
      if (opt && phase === 'play') {
        if (+opt.dataset.v === cur.ans) { score++; paintRound(); }
        else { opt.disabled = true; opt.classList.add('bad'); }
      }
    });
    paintIntro();
  }

  // ── 6) MASTERMIND DEL MARCADOR ────────────────────────────────────────
  function mountCode(root, content) {
    const LEN = 3, MAX = 8;
    let phase = 'intro', secret = [], guess = [], history = [], done = false;
    function newSecret() { const pool = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]); return pool.slice(0, LEN); }
    function evalGuess(g) { return g.map((d, i) => secret[i] === d ? 'g' : (secret.indexOf(d) >= 0 ? 'y' : 'n')); }
    function rowHTML(g, marks) { return `<div class="ng-code-row">${g.map((d, i) => `<span class="ng-code-cell ${marks[i]}">${d}</span>`).join('')}</div>`; }
    function paint() {
      if (phase === 'intro') {
        root.innerHTML = intro('🔢', `<p class="ng-intro-rules"><b>Adivina el código de 3 cifras distintas (0-9).</b> Tras cada intento verás:</p>
          <ul class="ng-intro-list">
            <li><span class="ng-code-cell g">7</span> cifra correcta <b>y en su sitio</b>.</li>
            <li><span class="ng-code-cell y">4</span> cifra correcta pero <b>mal colocada</b>.</li>
            <li><span class="ng-code-cell n">1</span> esa cifra <b>no está</b>.</li>
          </ul>
          <p class="ng-intro-note">Tienes <b>${MAX} intentos</b> · gana quien lo saque en menos.</p>`, '▶️ Empezar');
        return;
      }
      const slots = `<div class="ng-code-guess">${[0, 1, 2].map(i => `<span class="ng-code-slot${guess[i] != null ? ' filled' : ''}">${guess[i] != null ? guess[i] : ''}</span>`).join('')}</div>`;
      const pad = `<div class="ng-keypad">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(d => `<button type="button" class="ng-key" data-d="${d}"${(guess.indexOf(d) >= 0 || guess.length >= LEN || done) ? ' disabled' : ''}>${d}</button>`).join('')}
        <button type="button" class="ng-key wide" data-act="del"${guess.length === 0 || done ? ' disabled' : ''}>⌫</button>
        <button type="button" class="ng-key go" data-act="try"${guess.length < LEN || done ? ' disabled' : ''}>Probar</button></div>`;
      let foot = '';
      if (done) {
        const win = history.length && history[history.length - 1].marks.every(m => m === 'g');
        foot = win ? `<div class="ng-result">¡Lo sacaste en <b>${history.length}</b> ${history.length === 1 ? 'intento' : 'intentos'}! ${history.length <= 3 ? '🏆' : history.length <= 5 ? '👏' : '💪'}</div>`
                   : `<div class="ng-result">No lo sacaste. Era <b>${secret.join(' ')}</b> 😅</div>`;
        foot += `<button type="button" class="btn-outline ng-btn" data-act="reset">🔄 Otra vez</button>`;
      }
      root.innerHTML = `<div class="ng-code">
        <div class="ng-card-meta">Intento <b>${history.length}</b>/${MAX}</div>
        <div class="ng-code-history">${history.map(h => rowHTML(h.g, h.marks)).join('') || '<div class="ng-hint">Escribe 3 cifras distintas y pulsa Probar.</div>'}</div>
        ${done ? '' : slots + pad}
        <div class="ng-controls">${foot}</div>
      </div>`;
    }
    root.addEventListener('click', e => {
      const act = e.target.closest('[data-act]'), key = e.target.closest('[data-d]');
      if (act) {
        if (act.dataset.act === 'start') { secret = newSecret(); guess = []; history = []; done = false; phase = 'play'; paint(); }
        else if (act.dataset.act === 'reset') { phase = 'intro'; paint(); }
        else if (act.dataset.act === 'del') { guess.pop(); paint(); }
        else if (act.dataset.act === 'try' && guess.length === LEN) {
          const marks = evalGuess(guess); history.push({ g: guess.slice(), marks });
          const win = marks.every(m => m === 'g');
          if (win || history.length >= MAX) done = true;
          guess = []; paint();
        }
        return;
      }
      if (key && phase === 'play' && !done && guess.length < LEN && guess.indexOf(+key.dataset.d) < 0) { guess.push(+key.dataset.d); paint(); }
    });
    paint();
  }

  // ── Montaje en la página admin ────────────────────────────────────────
  function card(title, sub) {
    const el = document.createElement('div'); el.className = 'ng-game';
    el.innerHTML = `<div class="ng-game-head">${title}${sub ? ` <span class="ng-game-sub">${sub}</span>` : ''}</div><div class="ng-game-body"></div>`;
    return el;
  }
  function section(emoji, name, desc) {
    const s = document.createElement('section'); s.className = 'ng-section';
    s.innerHTML = `<h3 class="ng-section-title">${emoji} ${name}</h3><p class="ng-section-desc">${desc}</p>`;
    return s;
  }
  function init() {
    const host = document.getElementById('newgames-test'); if (!host || host.dataset.ready) return;
    host.dataset.ready = '1';

    const s1 = section('🧠', 'Memory: memoriza la alineación (mezcla)', '11 jugadores de distintos países, 20 s para memorizar, luego escribe quién va en cada posición.');
    LINEUPS.forEach(lu => { const c = card(lu.label, '4-3-3'); s1.appendChild(c); mountMemory(c.querySelector('.ng-game-body'), lu); });

    const s2 = section('🔢', 'Relaciona jugador y dorsal', 'Empareja 10 jugadores con su dorsal de selección.');
    DORSAL_SETS.forEach(ds => { const c = card(ds.label, '10 jugadores'); s2.appendChild(c); mountDorsales(c.querySelector('.ng-game-body'), ds); });

    const s3 = section('⚽', 'Que no caiga la pelota', 'Toca la pelota para mantenerla en el aire. 3 intentos, cuenta el mejor.');
    KEEPIE.forEach(kp => { const c = card(kp.label, ''); s3.appendChild(c); mountKeepie(c.querySelector('.ng-game-body'), kp); });

    const s4 = section('🟨', 'Gol o tarjeta', '¿País y posición correctos? ⚽ gol · 🟨 uno mal · 🟥 los dos mal. 10 s × 10 jugadores.');
    CARD_SETS.forEach(cs => { const c = card(cs.label, '10 jugadores'); s4.appendChild(c); mountCard(c.querySelector('.ng-game-body'), cs); });

    const s5 = section('⚡', 'Cálculo relámpago', 'Resuelve el máximo de operaciones en 60 s. Cálculo mental puro.');
    MATH.forEach(m => { const c = card(m.label, '60 s'); s5.appendChild(c); mountMath(c.querySelector('.ng-game-body'), m); });

    const s6 = section('🔢', 'Mastermind del marcador', 'Adivina el código de 3 cifras distintas con pistas. Deducción/lógica.');
    CODE.forEach(cd => { const c = card(cd.label, '8 intentos'); s6.appendChild(c); mountCode(c.querySelector('.ng-game-body'), cd); });

    host.appendChild(s1); host.appendChild(s2); host.appendChild(s3); host.appendChild(s4); host.appendChild(s5); host.appendChild(s6);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
