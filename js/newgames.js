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
    { label: 'Mezcla 4 (final)', players: [
      { n: 'Alisson', iso: 'br', x: 50, y: 91 },
      { n: 'Cucurella', iso: 'es', x: 12, y: 67 }, { n: 'Saliba', iso: 'fr', x: 37, y: 72 }, { n: 'Bastoni', iso: 'it', x: 63, y: 72 }, { n: 'Hakimi', iso: 'ma', x: 88, y: 67 },
      { n: 'Tchouaméni', iso: 'fr', x: 22, y: 47 }, { n: 'Bellingham', iso: 'gb-eng', x: 50, y: 52 }, { n: 'Wirtz', iso: 'de', x: 78, y: 47 },
      { n: 'Salah', iso: 'eg', x: 16, y: 24 }, { n: 'Kane', iso: 'gb-eng', x: 50, y: 18 }, { n: 'Lamine Yamal', iso: 'es', x: 84, y: 24 },
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
    { label: 'Cracks 4 (final)', pairs: [
      ['Modrić', 'hr', 10], ['Harry Kane', 'gb-eng', 9], ['De Bruyne', 'be', 7], ['Gakpo', 'nl', 8], ['Camavinga', 'fr', 6],
      ['Cancelo', 'pt', 20], ['Enzo Fernández', 'ar', 24], ['Dani Olmo', 'es', 21], ['Donnarumma', 'it', 1], ['Griezmann', 'fr', 11],
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
    { name: 'Egipto', iso: 'eg' },
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
    { label: 'Tanda 4 (final)', players: [
      { n: 'Modrić', c: 'Croacia', iso: 'hr', p: 'Centrocampista' }, { n: 'Alisson', c: 'Brasil', iso: 'br', p: 'Portero' },
      { n: 'Cancelo', c: 'Portugal', iso: 'pt', p: 'Defensa' }, { n: 'De Bruyne', c: 'Bélgica', iso: 'be', p: 'Centrocampista' },
      { n: 'Salah', c: 'Egipto', iso: 'eg', p: 'Delantero' }, { n: 'Dani Olmo', c: 'España', iso: 'es', p: 'Centrocampista' },
      { n: 'Griezmann', c: 'Francia', iso: 'fr', p: 'Delantero' }, { n: 'Gakpo', c: 'Países Bajos', iso: 'nl', p: 'Delantero' },
      { n: 'Tchouaméni', c: 'Francia', iso: 'fr', p: 'Centrocampista' }, { n: 'Cucurella', c: 'España', iso: 'es', p: 'Defensa' },
    ] },
  ];

  // 5) CÁLCULO MENTAL con incógnitas (⚽ balón, 🥅 portería) — 3 niveles, 75 s.
  const MATH = [
    { label: 'Fácil', level: 1 },
    { label: 'Medio', level: 2 },
    { label: 'Difícil', level: 3 },
  ];
  // 6) MASTERMIND de EQUIPACIONES — 8 equipaciones, combinación de 5 distintas.
  const KITS = [
    { t: 'España', c1: '#e11d2a', c2: '#ffd700' },
    { t: 'Brasil', c1: '#ffd400', c2: '#1f8a3b' },
    { t: 'Francia', c1: '#1f2a6e', c2: '#ffffff' },
    { t: 'P. Bajos', c1: '#f36c21', c2: '#ffffff' },
    { t: 'Argentina', c1: '#79b6e8', c2: '#ffffff' },
    { t: 'Alemania', c1: '#eceff4', c2: '#111111' },
    { t: 'México', c1: '#0a7d3c', c2: '#ffffff' },
    { t: 'Portugal', c1: '#7a1228', c2: '#1f8a3b' },
  ];
  const CODE = [{ label: 'Partida 1' }, { label: 'Partida 2' }, { label: 'Partida 3' }];
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

  // ── 5) CÁLCULO MENTAL con incógnitas ──────────────────────────────────
  function mountMath(root, content) {
    const DUR = 25000, lvl = content.level;
    let phase = 'intro', score = 0, cur = null, deadline = 0, timer = null, typed = '';
    function genPuzzle() {
      const cap = lvl === 1 ? 12 : 15;
      const vb = ri(2, cap), vp = ri(2, cap);            // valores de ⚽ y 🥅
      const ab = ri(6, 49), ap = ri(6, 49);
      const eqB = `${ab} + ⚽ = ${ab + vb}`;
      const eqP = `${ap} + 🥅 = ${ap + vp}`;
      let expr, ans;
      if (lvl === 1) { expr = '⚽ + 🥅'; ans = vb + vp; }
      else if (lvl === 2) {
        const f = [
          () => { const c = ri(2, 9); return { e: `⚽ + 2·🥅 + ${c}`, a: vb + 2 * vp + c }; },
          () => { const c = ri(2, 9); return { e: `2·⚽ + 🥅 + ${c}`, a: 2 * vb + vp + c }; },
          () => ({ e: `⚽ + 🥅`, a: vb + vp }),
        ][ri(0, 2)](); expr = f.e; ans = f.a;
      } else {
        const f = [
          () => ({ e: `2·⚽ + 3·🥅`, a: 2 * vb + 3 * vp }),
          () => { const c = ri(2, 12); return { e: `⚽ + 2·🥅 + ${c}`, a: vb + 2 * vp + c }; },
          () => { const c = ri(1, 9), r = 3 * vb - vp + c; return r > 0 ? { e: `3·⚽ − 🥅 + ${c}`, a: r } : { e: `2·⚽ + 🥅`, a: 2 * vb + vp }; },
        ][ri(0, 2)](); expr = f.e; ans = f.a;
      }
      return { eqB, eqP, expr, ans };
    }
    function paintRound() {
      cur = genPuzzle(); typed = '';
      root.innerHTML = `<div class="ng-math">
        <div class="ng-card-meta">Aciertos: <b>${score}</b></div>
        <div class="ng-card-bar"><div class="ng-card-bar-fill" data-bar style="width:100%"></div></div>
        <div class="ng-math-puzzle">
          <div class="ng-math-eq">${cur.eqB}</div>
          <div class="ng-math-eq">${cur.eqP}</div>
          <div class="ng-math-final">${cur.expr} = <span class="ng-math-ans" data-disp>_</span></div>
        </div>
        <div class="ng-math-pad">
          ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => `<button type="button" class="ng-mk" data-k="${d}">${d}</button>`).join('')}
          <button type="button" class="ng-mk" data-k="del">⌫</button>
          <button type="button" class="ng-mk" data-k="0">0</button>
          <button type="button" class="ng-mk ok" data-k="ok">✓</button>
        </div>
      </div>`;
    }
    function updateDisp() { const d = root.querySelector('[data-disp]'); if (d) d.textContent = typed || '_'; }
    function submit() {
      if (typed === '') return;
      if (+typed === cur.ans) { score++; paintRound(); }
      else { const d = root.querySelector('[data-disp]'); if (d) { d.classList.add('bad'); setTimeout(() => { const x = root.querySelector('[data-disp]'); if (x) x.classList.remove('bad'); }, 350); } typed = ''; updateDisp(); }
    }
    function startTimer() {
      clearInterval(timer); deadline = performance.now() + DUR;
      timer = setInterval(() => {
        const rem = Math.max(0, deadline - performance.now());
        const bar = root.querySelector('[data-bar]'); if (bar) { bar.style.width = (rem / DUR * 100) + '%'; bar.classList.toggle('low', rem <= 7000); }
        if (rem <= 0) { clearInterval(timer); finish(); }
      }, 100);
    }
    function finish() {
      clearInterval(timer);
      root.innerHTML = `<div class="ng-controls"><div class="ng-result">${score} ${score === 1 ? 'acierto' : 'aciertos'} en 25 s ${score >= 6 ? '🏆' : score >= 3 ? '👏' : '💪'}</div><button type="button" class="btn-outline ng-btn" data-act="reset">🔄 Otra vez</button></div>`;
    }
    function paintIntro() {
      phase = 'intro'; clearInterval(timer);
      root.innerHTML = intro('🧮', `<p class="ng-intro-rules"><b>Cálculo con incógnitas.</b> Con las dos primeras pistas descubres cuánto vale el <b>⚽ balón</b> y la <b>🥅 portería</b>; luego resuelve la operación final lo más rápido que puedas. <b>Escribe el resultado</b> con el teclado y pulsa <b>✓</b>.</p>
        <div class="ng-intro-example"><b>Ejemplo:</b> 52 + ⚽ = 70 → ⚽ vale 18 · 9 + 🥅 = 13 → 🥅 vale 4 · ⚽ + 2·🥅 + 2 = <b>28</b></div>
        <p class="ng-intro-note">Resuelve el máximo en 25 s · gana quien más acierte.</p>`, '▶️ Empezar');
    }
    root.addEventListener('click', e => {
      const act = e.target.closest('[data-act]');
      if (act) { if (act.dataset.act === 'start') { score = 0; phase = 'play'; paintRound(); startTimer(); } else if (act.dataset.act === 'reset') paintIntro(); return; }
      if (phase !== 'play') return;
      const k = e.target.closest('[data-k]'); if (!k) return;
      const v = k.dataset.k;
      if (v === 'del') { typed = typed.slice(0, -1); updateDisp(); }
      else if (v === 'ok') submit();
      else if (typed.length < 4) { typed += v; updateDisp(); }
    });
    paintIntro();
  }

  // ── 6) MASTERMIND DE EQUIPACIONES ─────────────────────────────────────
  function mountKits(root) {
    const LEN = 5, MAX = 10;
    let phase = 'intro', secret = [], guess = [], history = [], done = false;
    function newSecret() { return Array.from({ length: LEN }, () => ri(0, KITS.length - 1)); } // con repeticiones
    function evalGuess(g) {
      let exact = 0; const sc = {}, gc = {};
      for (let i = 0; i < LEN; i++) { if (g[i] === secret[i]) exact++; else { sc[secret[i]] = (sc[secret[i]] || 0) + 1; gc[g[i]] = (gc[g[i]] || 0) + 1; } }
      let white = 0; for (const k in gc) white += Math.min(gc[k], sc[k] || 0);
      return { exact, white };
    }
    function kitSVG(i, s) { const k = KITS[i]; s = s || 30; return `<svg class="ng-kit" width="${s}" height="${s}" viewBox="0 0 32 32" role="img" aria-label="${esc(k.t)}"><path d="M11 4 L4 8 L7 14.5 L11 12.5 V28 H21 V12.5 L25 14.5 L28 8 L21 4 L18.5 6 Q16 8 13.5 6 Z" fill="${k.c1}" stroke="rgba(0,0,0,.4)" stroke-width="1"/><path d="M13.5 4 Q16 6.6 18.5 4 L18.5 6 Q16 8 13.5 6 Z" fill="${k.c2}"/></svg>`; }
    function kitChip(i) { return `<span class="ng-kit-chip">${kitSVG(i, 28)}<span class="ng-kit-name">${esc(KITS[i].t)}</span></span>`; }
    function paint() {
      if (phase === 'intro') {
        root.innerHTML = intro('🎽', `<p class="ng-intro-rules"><b>Mastermind de equipaciones.</b> Hay un código oculto de <b>5 equipaciones</b> (de 8 posibles, en cierto orden, <b>se pueden repetir</b>). Propón una combinación y verás bolas de pista:</p>
          <ul class="ng-intro-list">
            <li><span class="ng-peg black"></span> <b>bola negra</b>: una equipación correcta <b>y en su posición</b>.</li>
            <li><span class="ng-peg white"></span> <b>bola blanca</b>: una equipación correcta pero <b>mal colocada</b>.</li>
          </ul>
          <p class="ng-intro-note">Las bolas <b>no dicen cuáles</b> son. Tienes <b>${MAX} intentos</b> para deducir el código.</p>`, '▶️ Empezar');
        return;
      }
      const pegs = (exact, white) => { let s = ''; for (let i = 0; i < exact; i++) s += '<span class="ng-peg black"></span>'; for (let i = 0; i < white; i++) s += '<span class="ng-peg white"></span>'; for (let i = exact + white; i < LEN; i++) s += '<span class="ng-peg empty"></span>'; return `<span class="ng-pegs">${s}</span>`; };
      const hist = history.map(h => `<div class="ng-kit-row"><span class="ng-kit-row-kits">${h.g.map(i => kitSVG(i, 26)).join('')}</span>${pegs(h.exact, h.white)}</div>`).join('');
      const slots = `<div class="ng-kit-slots">${[0, 1, 2, 3, 4].map(i => `<button type="button" class="ng-kit-slot${guess[i] != null ? ' filled' : ''}" data-slot="${i}"${done ? ' disabled' : ''}>${guess[i] != null ? kitSVG(guess[i], 30) : '<span class="ng-kit-slot-n">' + (i + 1) + '</span>'}</button>`).join('')}</div>`;
      const palette = `<div class="ng-kit-palette">${KITS.map((k, i) => `<button type="button" class="ng-kit-btn" data-kit="${i}"${(guess.length >= LEN || done) ? ' disabled' : ''}>${kitSVG(i, 30)}<span class="ng-kit-name">${esc(k.t)}</span></button>`).join('')}</div>`;
      let foot = '';
      if (done) {
        const win = history.length && history[history.length - 1].exact === LEN;
        foot = win ? `<div class="ng-result">¡Lo sacaste en <b>${history.length}</b> ${history.length === 1 ? 'intento' : 'intentos'}! ${history.length <= 4 ? '🏆' : history.length <= 7 ? '👏' : '💪'}</div>`
                   : `<div class="ng-result">No lo sacaste 😅 El código era:</div><div class="ng-kit-row-kits ng-kit-reveal">${secret.map(i => kitChip(i)).join('')}</div>`;
        foot += `<button type="button" class="btn-outline ng-btn" data-act="reset">🔄 Otra vez</button>`;
      } else {
        foot = `<button type="button" class="btn-primary ng-btn" data-act="try"${guess.length < LEN ? ' disabled' : ''}>✅ Probar (${guess.length}/5)</button>`;
      }
      root.innerHTML = `<div class="ng-kit-game">
        <div class="ng-card-meta">Intento <b>${history.length}</b>/${MAX}</div>
        <div class="ng-kit-history">${hist || '<div class="ng-hint">Propón 5 equipaciones (pueden repetirse) y pulsa Probar.</div>'}</div>
        ${done ? '' : slots + palette}
        <div class="ng-controls">${foot}</div>
      </div>`;
    }
    root.addEventListener('click', e => {
      const act = e.target.closest('[data-act]'), kit = e.target.closest('[data-kit]'), slot = e.target.closest('[data-slot]');
      if (act) {
        if (act.dataset.act === 'start') { secret = newSecret(); guess = []; history = []; done = false; phase = 'play'; paint(); }
        else if (act.dataset.act === 'reset') { phase = 'intro'; paint(); }
        else if (act.dataset.act === 'try' && guess.length === LEN) {
          const m = evalGuess(guess); history.push({ g: guess.slice(), exact: m.exact, white: m.white });
          if (m.exact === LEN || history.length >= MAX) done = true;
          guess = []; paint();
        }
        return;
      }
      if (done || phase !== 'play') return;
      if (slot) { const i = +slot.dataset.slot; if (guess[i] != null) { guess.splice(i, 1); paint(); } return; }
      if (kit) { const i = +kit.dataset.kit; if (guess.length < LEN) { guess.push(i); paint(); } }
    });
    paint();
  }

  // ── ROTACIÓN COMPLETA (test) + BONUS TRACK de la final ────────────────
  // Los 6 juegos nuevos jugables. mount(el, bonus): bonus=true usa CONTENIDO NUEVO.
  const NEW_GAMES = [
    { key: 'memory', emoji: '🧠', name: 'Memory', mount: (el, i) => mountMemory(el, LINEUPS[(i || 0) % LINEUPS.length]) },
    { key: 'keepie', emoji: '⚽', name: 'Que no caiga', mount: (el, i) => mountKeepie(el, KEEPIE[(i || 0) % KEEPIE.length]) },
    { key: 'card', emoji: '🟨', name: 'Gol o tarjeta', mount: (el, i) => mountCard(el, CARD_SETS[(i || 0) % CARD_SETS.length]) },
    { key: 'math', emoji: '🧮', name: 'Cálculo', mount: (el, i) => mountMath(el, MATH[(i || 0) % MATH.length]) },
    { key: 'mastermind', emoji: '🎽', name: 'Mastermind', mount: (el) => mountKits(el) },
    { key: 'dorsales', emoji: '🔢', name: 'Dorsales', mount: (el, i) => mountDorsales(el, DORSAL_SETS[(i || 0) % DORSAL_SETS.length]) },
  ];
  const ROT_ORIG = [['🎯', '¿Más o menos?'], ['🌍', '¿De qué selección es?'], ['📸', '¿Quién es este jugador?'], ['🥅', 'Puntería'], ['🕵️', 'Adivina con pistas'], ['🔤', 'Wordle de jugadores'], ['⚽', 'Goles míticos'], ['🧩', 'Sudoku de fútbol']];
  function watchDone(body, cb) { const o = new MutationObserver(() => { if (body.querySelector('.ng-result')) { o.disconnect(); cb(); } }); o.observe(body, { childList: true, subtree: true }); return o; }

  function mountRotationTest(host, exit) {
    const SEQ = ROT_ORIG.map(o => ({ orig: true, emoji: o[0], name: o[1] })).concat(NEW_GAMES.map(g => ({ orig: false, g })));
    let idx = 0, obs = null, bonusAdv = null;
    const bar = (label, name, emoji) => `<div class="ng-seq-bar"><span class="ng-seq-day">${label}</span><span class="ng-seq-name">${emoji} ${esc(name)}</span><button type="button" class="ng-seq-exit" data-seq="exit">✕</button></div>`;
    function clearObs() { if (obs) { obs.disconnect(); obs = null; } }
    function advance() { clearObs(); idx++; if (idx < SEQ.length) render(); else bonusIntro(); }
    function render() {
      bonusAdv = null;
      const it = SEQ[idx]; const name = it.orig ? it.name : it.g.name, emoji = it.orig ? it.emoji : it.g.emoji;
      host.innerHTML = `<div class="ng-seq">${bar('Día ' + (idx + 1) + ' / 14', name, emoji)}
        <div class="ng-seq-body"></div>
        <div class="ng-seq-foot"><button type="button" class="btn-primary ng-btn ng-seq-next" data-seq="next">➡️ Día siguiente</button></div></div>`;
      const body = host.querySelector('.ng-seq-body');
      if (it.orig) body.innerHTML = `<div class="ng-seq-orig"><div class="ng-seq-orig-emoji">${emoji}</div><p><b>${esc(name)}</b></p><p class="ng-hint">Juego original (ya en producción). Pruébalo desde el «Reto del día». Pulsa «Día siguiente» para continuar.</p></div>`;
      else { it.g.mount(body, false); obs = watchDone(body, () => { const n = host.querySelector('.ng-seq-next'); if (n) n.classList.add('ready'); }); }
    }
    function bonusIntro() {
      clearObs(); bonusAdv = null;
      host.innerHTML = `<div class="ng-bonus">${bar('🏆 Final', 'Bonus track', '🏆')}
        <div class="ng-bonus-body">
          <p class="ng-intro-rules">Elige tus <b>3 minijuegos</b> favoritos y juégalos seguidos (con <b>contenido nuevo</b>). En la final real, tus 3 puntuaciones se normalizan (0–100) y se suman → <b>ranking del bonus</b>.</p>
          <p class="ng-intro-note">(En la prueba eliges entre los 6 nuevos; en producción saldrán los 14.)</p>
          <div class="ng-bonus-pick">${NEW_GAMES.map((g, i) => `<button type="button" class="ng-bonus-opt" data-pick="${i}">${g.emoji}<span>${esc(g.name)}</span></button>`).join('')}</div>
          <button type="button" class="btn-primary ng-btn" data-bonus="go" disabled>▶️ Jugar los 3</button>
        </div></div>`;
      const picked = [], go = host.querySelector('[data-bonus="go"]');
      host.querySelectorAll('[data-pick]').forEach(b => b.addEventListener('click', () => {
        const i = +b.dataset.pick, at = picked.indexOf(i);
        if (at >= 0) { picked.splice(at, 1); b.classList.remove('on'); }
        else { if (picked.length >= 3) return; picked.push(i); b.classList.add('on'); }
        go.disabled = picked.length !== 3;
      }));
      go.addEventListener('click', () => { if (picked.length === 3) bonusPlay(picked.slice()); });
    }
    function bonusPlay(picks) {
      let bi = 0, results = [], o2 = null;
      function adv() {
        if (o2) { o2.disconnect(); o2 = null; }
        const r = host.querySelector('.ng-seq-body .ng-result');
        results[bi] = { name: NEW_GAMES[picks[bi]].name, emoji: NEW_GAMES[picks[bi]].emoji, txt: r ? r.textContent.trim() : '— (sin terminar)' };
        bi++; if (bi < 3) step(); else summary();
      }
      function step() {
        const g = NEW_GAMES[picks[bi]];
        host.innerHTML = `<div class="ng-seq">${bar('Bonus ' + (bi + 1) + ' / 3', g.name, g.emoji)}
          <div class="ng-seq-body"></div>
          <div class="ng-seq-foot"><button type="button" class="btn-primary ng-btn ng-seq-next" data-seq="next">➡️ Siguiente</button></div></div>`;
        const body = host.querySelector('.ng-seq-body');
        g.mount(body, true);
        o2 = watchDone(body, () => { const n = host.querySelector('.ng-seq-next'); if (n) n.classList.add('ready'); });
      }
      function summary() {
        bonusAdv = null;
        host.innerHTML = `<div class="ng-bonus">${bar('🏆 Final', 'Bonus completado', '🏆')}
          <div class="ng-bonus-body">
            <div class="ng-intro-emoji">🎉</div>
            <div class="ng-bonus-res">${results.map(r => `<div class="ng-bonus-res-row"><span>${r.emoji} <b>${esc(r.name)}</b></span><span class="ng-bonus-res-txt">${esc(r.txt)}</span></div>`).join('')}</div>
            <p class="ng-intro-note">En la final real, cada resultado pasa a una <b>nota 0–100</b> (según lo bien que lo hagas frente al resto) y se suman las 3 → ranking del bonus.</p>
            <button type="button" class="btn-outline ng-btn" data-seq="restart">🔄 Repetir desde el principio</button>
          </div></div>`;
      }
      bonusAdv = adv; // el botón "Siguiente" del bonus avanza entre los 3 juegos
      step();
    }
    // Delegación de los controles del stepper (onclick = reemplaza, no acumula)
    host.onclick = e => {
      const s = e.target.closest('[data-seq]'); if (!s) return;
      if (s.dataset.seq === 'exit') { clearObs(); if (exit) exit(); }
      else if (s.dataset.seq === 'restart') { idx = 0; render(); }
      else if (s.dataset.seq === 'next') { if (bonusAdv) bonusAdv(); else advance(); }
    };
    render();
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

    // Panel "Probar la rotación completa" (juega seguido hasta el bonus de la final)
    const rot = section('🗓️', 'Probar la rotación completa', 'Juega los juegos seguidos (al acabar uno → «➡️ Día siguiente») hasta llegar al bonus track de la final. Los 8 originales son un paso rápido; los 6 nuevos, jugables.');
    const rotCard = document.createElement('div'); rotCard.className = 'ng-game'; rotCard.id = 'ng-rot-host';
    rot.appendChild(rotCard); host.appendChild(rot);
    (function openRot() { rotCard.innerHTML = '<div style="text-align:center;padding:6px"><button type="button" class="btn-primary ng-btn" id="ng-rot-start">▶️ Empezar la rotación de prueba</button></div>'; document.getElementById('ng-rot-start').onclick = () => mountRotationTest(rotCard, openRot); })();

    const s1 = section('🧠', 'Memory: memoriza la alineación (mezcla)', '11 jugadores de distintos países, 20 s para memorizar, luego escribe quién va en cada posición.');
    LINEUPS.forEach(lu => { const c = card(lu.label, '4-3-3'); s1.appendChild(c); mountMemory(c.querySelector('.ng-game-body'), lu); });

    const s2 = section('🔢', 'Relaciona jugador y dorsal', 'Empareja 10 jugadores con su dorsal de selección.');
    DORSAL_SETS.forEach(ds => { const c = card(ds.label, '10 jugadores'); s2.appendChild(c); mountDorsales(c.querySelector('.ng-game-body'), ds); });

    const s3 = section('⚽', 'Que no caiga la pelota', 'Toca la pelota para mantenerla en el aire. 3 intentos, cuenta el mejor.');
    KEEPIE.forEach(kp => { const c = card(kp.label, ''); s3.appendChild(c); mountKeepie(c.querySelector('.ng-game-body'), kp); });

    const s4 = section('🟨', 'Gol o tarjeta', '¿País y posición correctos? ⚽ gol · 🟨 uno mal · 🟥 los dos mal. 10 s × 10 jugadores.');
    CARD_SETS.forEach(cs => { const c = card(cs.label, '10 jugadores'); s4.appendChild(c); mountCard(c.querySelector('.ng-game-body'), cs); });

    const s5 = section('🧮', 'Cálculo con incógnitas', 'Descubre cuánto vale el ⚽ y la 🥅, y resuelve la operación final. 25 s.');
    MATH.forEach(m => { const c = card(m.label, '25 s'); s5.appendChild(c); mountMath(c.querySelector('.ng-game-body'), m); });

    const s6 = section('🎽', 'Mastermind de equipaciones', 'Adivina el código de 5 equipaciones (de 8) con pistas de aciertos y posición.');
    CODE.forEach(cd => { const c = card(cd.label, '10 intentos'); s6.appendChild(c); mountKits(c.querySelector('.ng-game-body')); });

    host.appendChild(s1); host.appendChild(s2); host.appendChild(s3); host.appendChild(s4); host.appendChild(s5); host.appendChild(s6);
  }
  // ── Bonus track autónomo (para el pop-up real) ───────────────────────
  function mountBonus(host) {
    const bar = (label, name, emoji) => `<div class="ng-seq-bar"><span class="ng-seq-day">${label}</span><span class="ng-seq-name">${emoji} ${esc(name)}</span></div>`;
    let picks = [], bi = 0, results = [], o2 = null, adv = null;
    function intro() {
      if (o2) { o2.disconnect(); o2 = null; } adv = null; picks = [];
      host.innerHTML = `<div class="ng-bonus"><div class="ng-intro-emoji">🏆</div><h3 class="ng-bonus-title">Bonus track de la final</h3>
        <p class="ng-intro-rules">Elige tus <b>3 minijuegos</b> favoritos y juégalos seguidos (con <b>contenido nuevo</b>). Tus 3 notas se normalizan (0–100) y se suman → ranking.</p>
        <div class="ng-bonus-pick">${NEW_GAMES.map((g, i) => `<button type="button" class="ng-bonus-opt" data-pick="${i}">${g.emoji}<span>${esc(g.name)}</span></button>`).join('')}</div>
        <button type="button" class="btn-primary ng-btn" data-bonus="go" disabled>▶️ Jugar los 3</button></div>`;
    }
    function step() {
      const g = NEW_GAMES[picks[bi]];
      host.innerHTML = `<div class="ng-seq">${bar('Bonus ' + (bi + 1) + ' / 3', g.name, g.emoji)}<div class="ng-seq-body"></div><div class="ng-seq-foot"><button type="button" class="btn-primary ng-btn ng-seq-next" data-bonus="next">➡️ Siguiente</button></div></div>`;
      g.mount(host.querySelector('.ng-seq-body'), true);
      o2 = watchDone(host.querySelector('.ng-seq-body'), () => { const n = host.querySelector('.ng-seq-next'); if (n) n.classList.add('ready'); });
      adv = () => { if (o2) { o2.disconnect(); o2 = null; } const r = host.querySelector('.ng-seq-body .ng-result'); results[bi] = { name: g.name, emoji: g.emoji, txt: r ? r.textContent.trim() : '— (sin terminar)' }; bi++; if (bi < 3) step(); else summary(); };
    }
    function summary() {
      adv = null;
      host.innerHTML = `<div class="ng-bonus"><div class="ng-intro-emoji">🎉</div><h3 class="ng-bonus-title">¡Bonus completado!</h3>
        <div class="ng-bonus-res">${results.map(r => `<div class="ng-bonus-res-row"><span>${r.emoji} <b>${esc(r.name)}</b></span><span class="ng-bonus-res-txt">${esc(r.txt)}</span></div>`).join('')}</div>
        <p class="ng-intro-note">En la final real, cada resultado pasa a una nota 0–100 (según tu posición frente al resto) y se suman → ranking del bonus.</p>
        <button type="button" class="btn-outline ng-btn" data-bonus="again">🔄 Otra vez</button></div>`;
    }
    host.onclick = e => {
      const p = e.target.closest('[data-pick]'), b = e.target.closest('[data-bonus]');
      if (p) { const i = +p.dataset.pick, at = picks.indexOf(i); if (at >= 0) { picks.splice(at, 1); p.classList.remove('on'); } else { if (picks.length >= 3) return; picks.push(i); p.classList.add('on'); } const go = host.querySelector('[data-bonus="go"]'); if (go) go.disabled = picks.length !== 3; return; }
      if (b) { if (b.dataset.bonus === 'go') { if (picks.length === 3) { bi = 0; results = []; step(); } } else if (b.dataset.bonus === 'next') { if (adv) adv(); } else if (b.dataset.bonus === 'again') intro(); }
    };
    intro();
  }

  // Librería pública para que el pop-up real (minigame.js) juegue los juegos nuevos.
  window.NG = {
    has: k => NEW_GAMES.some(g => g.key === k),
    list: NEW_GAMES.map(g => ({ key: g.key, emoji: g.emoji, name: g.name })),
    meta: k => { const g = NEW_GAMES.find(g => g.key === k) || {}; return { emoji: g.emoji || '🎮', name: g.name || k }; },
    mount: (k, el, idx) => { const g = NEW_GAMES.find(g => g.key === k); if (g) g.mount(el, idx || 0); },
    mountBonus: mountBonus,
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
