// ============================================================
//  newgames.js — 3 minijuegos NUEVOS en pruebas (aún NO están en la
//  rotación). Se renderizan en la página admin para testearlos.
//  Autónomo: no toca minigame.js ni el backend. Cada instancia tiene
//  su propio estado (hay 3 de cada juego en pantalla a la vez).
// ============================================================
(function () {
  'use strict';
  function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  function flag(iso) { return iso ? `<img class="team-flag-img" src="https://flagcdn.com/w40/${iso}.png" srcset="https://flagcdn.com/w80/${iso}.png 2x" alt="" loading="lazy">` : ''; }
  function shuffle(arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  // ── CONTENIDOS (placeholders para revisar) ───────────────────────────
  // 1) MEMORY — alineaciones 4-3-3. x,y en % del campo (y=90 portero abajo, y=20 delantero arriba).
  const LINEUPS = [
    { team: 'España', iso: 'es', players: [
      { n: 'Unai Simón', x: 50, y: 90 },
      { n: 'Grimaldo', x: 16, y: 68 }, { n: 'Le Normand', x: 39, y: 73 }, { n: 'Laporte', x: 61, y: 73 }, { n: 'Carvajal', x: 84, y: 68 },
      { n: 'Pedri', x: 28, y: 48 }, { n: 'Rodri', x: 50, y: 53 }, { n: 'Fabián', x: 72, y: 48 },
      { n: 'Nico Williams', x: 18, y: 26 }, { n: 'Morata', x: 50, y: 19 }, { n: 'Lamine Yamal', x: 82, y: 26 },
    ] },
    { team: 'Francia', iso: 'fr', players: [
      { n: 'Maignan', x: 50, y: 90 },
      { n: 'T. Hernández', x: 16, y: 68 }, { n: 'Saliba', x: 39, y: 73 }, { n: 'Upamecano', x: 61, y: 73 }, { n: 'Koundé', x: 84, y: 68 },
      { n: 'Camavinga', x: 28, y: 48 }, { n: 'Tchouaméni', x: 50, y: 53 }, { n: 'Griezmann', x: 72, y: 48 },
      { n: 'Mbappé', x: 18, y: 26 }, { n: 'Kolo Muani', x: 50, y: 19 }, { n: 'Dembélé', x: 82, y: 26 },
    ] },
    { team: 'Argentina', iso: 'ar', players: [
      { n: 'E. Martínez', x: 50, y: 90 },
      { n: 'Tagliafico', x: 16, y: 68 }, { n: 'Romero', x: 39, y: 73 }, { n: 'Otamendi', x: 61, y: 73 }, { n: 'Molina', x: 84, y: 68 },
      { n: 'De Paul', x: 28, y: 48 }, { n: 'Enzo Fernández', x: 50, y: 53 }, { n: 'Mac Allister', x: 72, y: 48 },
      { n: 'J. Álvarez', x: 18, y: 26 }, { n: 'Lautaro', x: 50, y: 19 }, { n: 'Messi', x: 82, y: 26 },
    ] },
  ];

  // 2) DORSALES — 10 jugadores + 10 dorsales (números distintos dentro de cada set).
  const DORSAL_SETS = [
    { label: 'Cracks 1', pairs: [
      ['Messi', 'ar', 10], ['Vinícius Jr', 'br', 7], ['Haaland', 'no', 9], ['Pedri', 'es', 8], ['Lamine Yamal', 'es', 19],
      ['Van Dijk', 'nl', 4], ['Rodri', 'es', 16], ['Musiala', 'de', 14], ['Salah', 'eg', 11], ['Bellingham', 'gb-eng', 5],
    ] },
    { label: 'Cracks 2', pairs: [
      ['Mbappé', 'fr', 10], ['Cristiano Ronaldo', 'pt', 7], ['Harry Kane', 'gb-eng', 9], ['Wirtz', 'de', 17], ['Valverde', 'uy', 8],
      ['Rúben Dias', 'pt', 4], ['Alisson', 'br', 1], ['Raphinha', 'br', 11], ['Lautaro', 'ar', 22], ['Gvardiol', 'hr', 5],
    ] },
    { label: 'Cracks 3', pairs: [
      ['Bellingham', 'gb-eng', 10], ['Son', 'kr', 7], ['J. Álvarez', 'ar', 9], ['Gavi', 'es', 6], ['Foden', 'gb-eng', 11],
      ['Hakimi', 'ma', 2], ['E. Martínez', 'ar', 23], ['Declan Rice', 'gb-eng', 4], ['Gakpo', 'nl', 8], ['De Jong', 'nl', 21],
    ] },
  ];

  // 3) KEEPIE — 3 variantes de dificultad (px/s²).
  const KEEPIE = [
    { label: 'Normal', gravity: 950, bounce: 460, ball: 56 },
    { label: 'Rápido', gravity: 1250, bounce: 500, ball: 50 },
    { label: 'Difícil', gravity: 1600, bounce: 540, ball: 44 },
  ];

  // ── 1) MEMORY ─────────────────────────────────────────────────────────
  function mountMemory(root, content) {
    const players = content.players;
    let state;
    function reset() { state = { phase: 'intro', placed: {}, selected: null, secs: 5 }; paint(); }
    function chipsHTML() {
      return players.map((p, i) => {
        const placedName = state.placed[i];
        let cls = 'ng-chip', label = '';
        if (state.phase === 'memo') { cls += ' show'; label = p.n; }
        else if (state.phase === 'recall') { cls += placedName ? ' filled' : ' empty'; label = placedName || ''; }
        else if (state.phase === 'done') {
          const ok = placedName === p.n;
          cls += ok ? ' correct' : ' wrong';
          label = ok ? p.n : `${placedName || '—'}<span class="ng-chip-fix">${esc(p.n)}</span>`;
          return `<div class="${cls}" style="left:${p.x}%;top:${p.y}%">${ok ? esc(p.n) : label}</div>`;
        } else { cls += ' empty'; label = '•'; }
        return `<div class="${cls}" style="left:${p.x}%;top:${p.y}%" data-chip="${i}">${state.phase === 'memo' ? esc(label) : (placedName ? esc(placedName) : (state.phase === 'recall' ? '' : '•'))}</div>`;
      }).join('');
    }
    function bankHTML() {
      const used = Object.values(state.placed);
      return shuffleStable(players.map(p => p.n)).map(n => {
        const isUsed = used.indexOf(n) >= 0;
        return `<button type="button" class="ng-bank-name${state.selected === n ? ' sel' : ''}${isUsed ? ' used' : ''}" data-name="${esc(n)}"${isUsed ? ' disabled' : ''}>${esc(n)}</button>`;
      }).join('');
    }
    // Orden de banco estable durante la fase recall (no se baraja en cada repintado).
    let bankOrder = null;
    function shuffleStable(names) { if (!bankOrder) bankOrder = shuffle(names); return bankOrder; }

    function paint() {
      let controls = '', extra = '';
      if (state.phase === 'intro') {
        controls = `<button type="button" class="btn-primary ng-btn" data-act="memo">👀 Memorizar (5 s)</button>`;
      } else if (state.phase === 'memo') {
        controls = `<div class="ng-memo-count">Memoriza… <b>${state.secs}</b> s</div>`;
      } else if (state.phase === 'recall') {
        const placedN = Object.keys(state.placed).length;
        controls = `<div class="ng-bank">${bankHTML()}</div>
          <button type="button" class="btn-primary ng-btn" data-act="check"${placedN === 0 ? ' disabled' : ''}>✅ Comprobar (${placedN}/11)</button>`;
        extra = `<div class="ng-hint">Toca un nombre y luego su posición. Toca una posición llena para vaciarla.</div>`;
      } else if (state.phase === 'done') {
        let correct = 0; players.forEach((p, i) => { if (state.placed[i] === p.n) correct++; });
        controls = `<div class="ng-result">Acertaste <b>${correct}/11</b> jugadores ${correct >= 9 ? '🏆' : correct >= 6 ? '👏' : '💪'}</div>
          <button type="button" class="btn-outline ng-btn" data-act="reset">🔄 Reiniciar</button>`;
      }
      root.innerHTML = `<div class="ng-pitch ng-phase-${state.phase}">${chipsHTML()}</div>${extra}<div class="ng-controls">${controls}</div>`;
    }

    root.addEventListener('click', e => {
      const act = e.target.closest('[data-act]'); const chip = e.target.closest('[data-chip]'); const name = e.target.closest('[data-name]');
      if (act) {
        const a = act.dataset.act;
        if (a === 'memo') { state.phase = 'memo'; state.secs = 5; bankOrder = null; paint(); runCountdown(); }
        else if (a === 'check') { state.phase = 'done'; paint(); }
        else if (a === 'reset') { bankOrder = null; reset(); }
        return;
      }
      if (state.phase !== 'recall') return;
      if (name && !name.disabled) { state.selected = (state.selected === name.dataset.name) ? null : name.dataset.name; paint(); return; }
      if (chip) {
        const i = +chip.dataset.chip;
        if (state.placed[i]) { delete state.placed[i]; }            // vaciar
        else if (state.selected) { state.placed[i] = state.selected; state.selected = null; } // colocar
        paint();
      }
    });
    let cdTimer = null;
    function runCountdown() {
      clearInterval(cdTimer);
      cdTimer = setInterval(() => {
        state.secs--;
        if (state.secs <= 0) { clearInterval(cdTimer); state.phase = 'recall'; state.selected = null; paint(); }
        else paint();
      }, 1000);
    }
    reset();
  }

  // ── 2) DORSALES ───────────────────────────────────────────────────────
  function mountDorsales(root, content) {
    const players = content.pairs.map((p, i) => ({ idx: i, name: p[0], iso: p[1], num: p[2] }));
    const numbers = shuffle(players.map(p => p.num));
    let state;
    function reset() { state = { assign: {}, selPlayer: null, done: false }; paint(); }
    function numOf(idx) { return state.assign[idx]; }
    function playerOfNum(num) { for (const k in state.assign) if (state.assign[k] === num) return +k; return null; }
    function paint() {
      const left = players.map(p => {
        const n = numOf(p.idx);
        let cls = 'ng-pl-row';
        if (state.selPlayer === p.idx) cls += ' sel';
        if (state.done) cls += (n === p.num ? ' correct' : ' wrong');
        const badge = n != null ? `<span class="ng-pl-num">${n}</span>` : `<span class="ng-pl-num empty">—</span>`;
        const fix = (state.done && n !== p.num) ? `<span class="ng-pl-fix">es ${p.num}</span>` : '';
        return `<button type="button" class="${cls}" data-pl="${p.idx}"${state.done ? ' disabled' : ''}>${flag(p.iso)}<span class="ng-pl-name">${esc(p.name)}</span>${fix}${badge}</button>`;
      }).join('');
      const right = numbers.map(num => {
        const owner = playerOfNum(num);
        let cls = 'ng-num';
        if (owner != null) cls += ' used';
        return `<button type="button" class="${cls}" data-num="${num}"${state.done ? ' disabled' : ''}>${num}</button>`;
      }).join('');
      let footer;
      if (state.done) {
        let correct = 0; players.forEach(p => { if (numOf(p.idx) === p.num) correct++; });
        footer = `<div class="ng-result">Acertaste <b>${correct}/10</b> dorsales ${correct >= 8 ? '🏆' : correct >= 5 ? '👏' : '💪'}</div>
          <button type="button" class="btn-outline ng-btn" data-act="reset">🔄 Reiniciar</button>`;
      } else {
        const placed = Object.keys(state.assign).length;
        footer = `<button type="button" class="btn-primary ng-btn" data-act="check"${placed === 0 ? ' disabled' : ''}>✅ Comprobar (${placed}/10)</button>`;
      }
      root.innerHTML = `<div class="ng-hint">Toca un jugador y luego su dorsal.</div>
        <div class="ng-dorsal"><div class="ng-dorsal-players">${left}</div><div class="ng-dorsal-nums">${right}</div></div>
        <div class="ng-controls">${footer}</div>`;
    }
    root.addEventListener('click', e => {
      const act = e.target.closest('[data-act]'); const pl = e.target.closest('[data-pl]'); const num = e.target.closest('[data-num]');
      if (act) { if (act.dataset.act === 'check') { state.done = true; paint(); } else if (act.dataset.act === 'reset') reset(); return; }
      if (state.done) return;
      if (pl) { const i = +pl.dataset.pl; state.selPlayer = (state.selPlayer === i) ? null : i; paint(); return; }
      if (num) {
        const v = +num.dataset.num;
        if (state.selPlayer == null) return;
        const prevOwner = playerOfNum(v); if (prevOwner != null) delete state.assign[prevOwner]; // ese dorsal se mueve
        state.assign[state.selPlayer] = v; state.selPlayer = null; paint();
      }
    });
    reset();
  }

  // ── 3) KEEPIE (que no caiga la pelota) ────────────────────────────────
  function mountKeepie(root, content) {
    let raf = null, last = 0, running = false, startT = 0, touches = 0, best = 0;
    let b = null, w = 0, h = 0;
    function html(body) {
      root.innerHTML = `<div class="ng-keepie-area" data-area>
          <div class="ng-keepie-hud" data-hud></div>
          <div class="ng-ball" data-ball>⚽</div>
          ${body || ''}
        </div>
        <div class="ng-controls" data-controls></div>`;
    }
    function idle() {
      stop();
      html(`<div class="ng-keepie-msg" data-msg>Toca «Empezar» y mantén la pelota en el aire tocándola.${best ? `<br>🔥 Mejor: <b>${best.toFixed(1)} s</b>` : ''}</div>`);
      const ball = root.querySelector('[data-ball]'); if (ball) ball.style.display = 'none';
      root.querySelector('[data-controls]').innerHTML = `<button type="button" class="btn-primary ng-btn" data-act="start">▶️ Empezar</button>`;
    }
    function start() {
      const area = root.querySelector('[data-area]');
      const r = area.getBoundingClientRect(); w = r.width; h = r.height;
      if (w < 20 || h < 20) { w = 320; h = 260; }
      const rad = content.ball / 2;
      // Sale lanzado hacia arriba desde el centro para dar tiempo al primer toque.
      b = { x: w / 2, y: h * 0.5, vx: (Math.random() * 100 - 50), vy: -content.bounce * 0.75, r: rad };
      touches = 0; running = true; startT = performance.now(); last = 0;
      const ball = root.querySelector('[data-ball]');
      ball.style.display = ''; ball.style.width = ball.style.height = content.ball + 'px';
      root.querySelector('[data-msg]') && root.querySelector('[data-msg]').remove();
      root.querySelector('[data-controls]').innerHTML = `<span class="ng-hint">Toca la pelota ⚽ antes de que caiga</span>`;
      place(); cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
    }
    function place() {
      const ball = root.querySelector('[data-ball]'); if (!ball) return;
      ball.style.left = b.x + 'px'; ball.style.top = b.y + 'px';
      const hud = root.querySelector('[data-hud]'); if (hud) hud.innerHTML = `⏱ <b>${((performance.now() - startT) / 1000).toFixed(1)}</b> s · ${touches} toques`;
    }
    function loop(t) {
      if (!running) return;
      if (!last) last = t;
      let dt = (t - last) / 1000; last = t; if (dt > 0.05) dt = 0.05;
      b.vy += content.gravity * dt;
      b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx) * 0.85; }
      if (b.x > w - b.r) { b.x = w - b.r; b.vx = -Math.abs(b.vx) * 0.85; }
      if (b.y < b.r) { b.y = b.r; b.vy = Math.abs(b.vy) * 0.5; }
      if (b.y > h - b.r) { return over(); }
      place(); raf = requestAnimationFrame(loop);
    }
    function tap(e) {
      if (!running) return;
      e.preventDefault();
      b.vy = -content.bounce;
      b.vx += (Math.random() * 140 - 70);
      if (b.vx > 260) b.vx = 260; if (b.vx < -260) b.vx = -260;
      touches++;
    }
    function over() {
      running = false; cancelAnimationFrame(raf);
      const secs = (performance.now() - startT) / 1000; if (secs > best) best = secs;
      const hud = root.querySelector('[data-hud]'); if (hud) hud.innerHTML = `💥 ¡Cayó al suelo!`;
      root.querySelector('[data-controls]').innerHTML =
        `<div class="ng-result">Aguantaste <b>${secs.toFixed(1)} s</b> · ${touches} toques ${secs >= 20 ? '🏆' : secs >= 10 ? '👏' : '💪'}</div>
         <button type="button" class="btn-primary ng-btn" data-act="start">🔄 Otra vez</button>`;
    }
    function stop() { running = false; cancelAnimationFrame(raf); raf = null; }
    root.addEventListener('click', e => { const act = e.target.closest('[data-act]'); if (act && act.dataset.act === 'start') start(); });
    root.addEventListener('pointerdown', e => { if (e.target.closest('[data-ball]')) tap(e); });
    idle();
  }

  // ── Montaje en la página admin ────────────────────────────────────────
  function card(title, sub) {
    const el = document.createElement('div');
    el.className = 'ng-game';
    el.innerHTML = `<div class="ng-game-head">${title}${sub ? ` <span class="ng-game-sub">${sub}</span>` : ''}</div><div class="ng-game-body"></div>`;
    return el;
  }
  function section(emoji, name, desc) {
    const s = document.createElement('section');
    s.className = 'ng-section';
    s.innerHTML = `<h3 class="ng-section-title">${emoji} ${name}</h3><p class="ng-section-desc">${desc}</p>`;
    return s;
  }
  function init() {
    const host = document.getElementById('newgames-test'); if (!host || host.dataset.ready) return;
    host.dataset.ready = '1';

    const s1 = section('🧠', 'Memory: memoriza la alineación', 'Pulsa «Memorizar» (5 s), luego coloca cada jugador en su posición. Gana quien acierte más.');
    LINEUPS.forEach(lu => { const c = card(`${flag(lu.iso)} ${lu.team}`, '4-3-3'); s1.appendChild(c); mountMemory(c.querySelector('.ng-game-body'), lu); });

    const s2 = section('🔢', 'Relaciona jugador y dorsal', 'Empareja cada jugador con su dorsal. 10 jugadores. Gana quien acierte más.');
    DORSAL_SETS.forEach(ds => { const c = card(ds.label, '10 jugadores'); s2.appendChild(c); mountDorsales(c.querySelector('.ng-game-body'), ds); });

    const s3 = section('⚽', 'Que no caiga la pelota', 'Toca la pelota para impulsarla antes de que toque el suelo. Gana quien aguante más segundos.');
    KEEPIE.forEach(kp => { const c = card(kp.label, ''); s3.appendChild(c); mountKeepie(c.querySelector('.ng-game-body'), kp); });

    host.appendChild(s1); host.appendChild(s2); host.appendChild(s3);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
