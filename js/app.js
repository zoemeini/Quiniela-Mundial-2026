// ── Estado ───────────────────────────────────────────────
// Modelo unificado: se pronostica el MARCADOR de cada partido real (grupos y
// eliminatorias). Cada partido se cierra a su hora de inicio. Lo no rellenado
// cuenta como 0–0. Las eliminatorias muestran los equipos REALES por ronda.
let currentUser  = null;
let predictions  = {};   // { matchId: { home, away } }  (grupos + eliminatorias)
let dirty        = {};   // pronósticos escritos pero aún no confirmados en la hoja
let results      = {};   // { matchId: { home, away, status } }  (grupos, reales)
let koReal       = {};   // { koMatchId: { winner, gh, ga } }  (eliminatorias, reales)
let realBr       = { complete: false, resolved: {} }; // equipos reales del cuadro
let saveTimers   = {};
let currentPhase = 'groups';
let groupTabs    = [];        // ['upcoming', '2026-06-11', ...]
let currentGroupTab = 'upcoming';
let currentKoRound = 'R32';

const lockedM = m => matchLocked(m.kickoff);
const getAnyMatch = id => getMatchById(id) || getKoMatch(id);

// Resultado real de un partido (grupo o eliminatoria), o null si no jugado.
function resultFor(matchId) {
  if (matchId[0] !== 'M') {
    const r = results[matchId];
    return (r && r.status === 'finished') ? { home: r.home, away: r.away, status: 'finished' } : null;
  }
  const kr = koReal[matchId];
  if (kr && kr.gh !== '' && kr.gh != null && kr.ga !== '' && kr.ga != null) {
    return { home: Number(kr.gh), away: Number(kr.ga), status: 'finished' };
  }
  return null;
}

// ── Gestión de usuario ───────────────────────────────────
function loadUser() {
  currentUser = localStorage.getItem('wc2026_username');
  if (!currentUser) document.getElementById('username-modal').classList.remove('hidden');
  else applyUser();
}
function applyUser() {
  document.getElementById('username-display').textContent = currentUser;
  document.getElementById('username-modal').classList.add('hidden');
  loadData();
  setInterval(loadData, 60000);
}
document.getElementById('username-submit').addEventListener('click', () => {
  const val = document.getElementById('username-input').value.trim();
  if (!val) return;
  currentUser = val;
  localStorage.setItem('wc2026_username', val);
  applyUser();
});
document.getElementById('username-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('username-submit').click();
});
// "Borrar" no permite cambiar de nombre libremente: borra tu usuario (y todos
// tus pronósticos) y solo entonces puedes crear uno nuevo. Evita jugar 2 veces.
document.getElementById('change-user-btn').addEventListener('click', () => {
  document.getElementById('delete-name').textContent = currentUser;
  document.getElementById('delete-modal').classList.remove('hidden');
});
document.getElementById('delete-cancel').addEventListener('click', () => {
  document.getElementById('delete-modal').classList.add('hidden');
});
document.getElementById('delete-confirm').addEventListener('click', async () => {
  const btn = document.getElementById('delete-confirm');
  btn.textContent = 'Borrando…'; btn.disabled = true;
  try {
    await api.deleteUser({ user: currentUser });
    localStorage.removeItem('wc2026_username');
    location.reload();
  } catch (err) {
    console.error('deleteUser', err);
    alert('No se pudo borrar el usuario ahora mismo. Inténtalo de nuevo en un momento.');
    btn.textContent = 'Sí, borrar y empezar'; btn.disabled = false;
  }
});

// ── Aviso (sin cuenta atrás global: cada partido se cierra a su hora) ─────
function setupBanner() {
  const banner = document.getElementById('deadline-banner');
  document.getElementById('locked-banner').classList.add('hidden');
  banner.classList.remove('hidden');
  document.getElementById('deadline-text').textContent =
    'Cada partido se cierra a su hora de inicio. Lo que no rellenes cuenta como 0–0.';
}

// ── Tarjeta de partido (compartida por grupos y eliminatorias) ───────────
function scoreRowsHtml(matchId, homeTeam, awayTeam, locked) {
  const pred = predictions[matchId];
  if (locked) {
    const hs = pred ? pred.home : 0, as = pred ? pred.away : 0;
    const cls = pred ? '' : ' unsent';
    return `<div class="mc-rows">
      <div class="mc-row">${teamFlag(homeTeam)}<span class="team-name">${teamName(homeTeam)}</span><span class="score-static${cls}">${hs}</span></div>
      <div class="mc-row">${teamFlag(awayTeam)}<span class="team-name">${teamName(awayTeam)}</span><span class="score-static${cls}">${as}</span></div>
    </div>`;
  }
  const hv = pred ? pred.home : '', av = pred ? pred.away : '';
  return `<div class="mc-rows">
    <div class="mc-row">${teamFlag(homeTeam)}<span class="team-name">${teamName(homeTeam)}</span>
      <input class="score-input" type="number" inputmode="numeric" min="0" max="20" placeholder="–" id="sc-${matchId}-home" value="${hv}"></div>
    <div class="mc-row">${teamFlag(awayTeam)}<span class="team-name">${teamName(awayTeam)}</span>
      <input class="score-input" type="number" inputmode="numeric" min="0" max="20" placeholder="–" id="sc-${matchId}-away" value="${av}"></div>
  </div>`;
}
// IMPORTANT: search within the (possibly detached) card element, NOT the document —
// the card isn't in the page yet when this runs, so document.getElementById would miss it.
function wireCardInputs(card, matchId) {
  ['home', 'away'].forEach(side => {
    const el = card.querySelector(`#sc-${matchId}-${side}`);
    if (!el) return;
    el.addEventListener('input', () => onScoreChange(matchId)); // sin salto automático
    el.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); advanceFocus(el.id); } });
    el.addEventListener('focus', () => safeSelect(el));
  });
}
function resultBadgeHtml(matchId) {
  const result = resultFor(matchId);
  if (!result) return '';
  const pred = predictions[matchId] || { home: 0, away: 0 }; // auto 0–0
  const resultStr = `${result.home} – ${result.away}`;
  const pts = calculatePoints(pred, result);
  if (pts === 5) return `<span class="result-display result-correct-exact">⭐ ¡Exacto! +5</span>`;
  if (pts === 3) return `<span class="result-display result-correct-outcome">✓ Acierto +3</span>`;
  const tu = `${pred.home}–${pred.away}`;
  return `<span class="result-display result-wrong">✗ ${tu} · real ${resultStr}</span>`;
}
function lockTag(locked, result) {
  if (result) return `<span class="lock-tag finished">Final</span>`;
  if (locked)  return `<span class="lock-tag closed">🔒 Cerrado</span>`;
  return '';
}

// ── Construir fase de grupos (pestañas por día + «Próximos») ─────
function dayKeysSorted() {
  const set = {};
  MATCHES.forEach(m => { set[madridDayKey(m.kickoff)] = true; });
  return Object.keys(set).sort();
}
function dayLabel(key) {
  const d = new Date(key + 'T12:00:00Z');
  return new Intl.DateTimeFormat('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }).format(d);
}
// Partidos de los PRÓXIMOS 3 DÍAS de juego (días naturales con partidos sin jugar).
// Se recalcula en cada render → se actualiza solo cada día. Las eliminatorias
// aparecen solo cuando ya se conocen los equipos reales.
function upcomingMatches() {
  const unlocked = allMatches().filter(m => {
    if (matchLocked(m.kickoff)) return false;
    if (m.id[0] === 'M') { const r = realBr.resolved[m.id]; if (!r || !r.home || !r.away) return false; }
    return true;
  }).sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff));
  const days = [];
  unlocked.forEach(m => { const k = madridDayKey(m.kickoff); if (!days.includes(k)) days.push(k); });
  const keep = days.slice(0, 3); // los 3 próximos días con partidos
  return unlocked.filter(m => keep.includes(madridDayKey(m.kickoff)));
}

function buildUI() {
  const tabsEl = document.getElementById('day-tabs');
  tabsEl.innerHTML = '';
  groupTabs = ['upcoming'].concat(dayKeysSorted());
  groupTabs.forEach(key => {
    const btn = document.createElement('button');
    btn.className = 'tab-btn' + (key === currentGroupTab ? ' active' : '');
    btn.dataset.tab = key;
    btn.innerHTML = (key === 'upcoming' ? '⏳ Próximos' : dayLabel(key))
      + ` <span class="tab-check" id="daycheck-${key}"></span>`;
    btn.addEventListener('click', () => renderGroupTab(key));
    tabsEl.appendChild(btn);
  });
  renderGroupTab(currentGroupTab);
  buildGroupSummary();
}

let lastUpcomingKey = '';
function renderGroupTab(tabKey) {
  currentGroupTab = tabKey;
  document.querySelectorAll('#day-tabs .tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tabKey));
  const content = document.getElementById('day-content');
  let matches, header;
  if (tabKey === 'upcoming') {
    matches = upcomingMatches();
    lastUpcomingKey = matches.map(m => m.id).join(',');
    header = '⏳ Próximos 3 días — rellena estos primero';
  } else {
    matches = MATCHES.filter(m => madridDayKey(m.kickoff) === tabKey)
      .sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff));
    header = 'Partidos del ' + dayLabel(tabKey);
  }
  if (matches.length === 0) {
    content.innerHTML = '<p class="ko-intro">No hay partidos próximos ahora mismo. Mira las pestañas por día. 🙂</p>';
    return;
  }
  content.innerHTML = `<div class="group-header">${header}</div><div class="matches-grid" id="day-grid"></div>`;
  const grid = document.getElementById('day-grid');
  matches.forEach(m => grid.appendChild(m.id[0] === 'M' ? buildKoCard(m) : buildMatchCard(m)));
}

// Refresca la pestaña «Próximos» cuando cambian los partidos (otro día), sin molestar si estás escribiendo.
function maybeRefreshUpcoming() {
  if (currentGroupTab !== 'upcoming') return;
  const focused = document.activeElement && /^sc-/.test(document.activeElement.id || '');
  if (focused) return;
  if (upcomingMatches().map(m => m.id).join(',') !== lastUpcomingKey) renderGroupTab('upcoming');
}

function buildGroupSummary() {
  const el = document.getElementById('group-summary');
  if (!el) return;
  let html = '<div class="summary-title">📋 Grupos <span class="summary-hint">(toca uno para ver tus pronósticos)</span></div><div class="summary-grid">';
  GROUPS.forEach(g => {
    const c = groupColor(g);
    const teams = [...new Set(getMatchesByGroup(g).flatMap(m => [m.home, m.away]))];
    html += `<button class="summary-group" style="border-left-color:${c}" onclick="renderGroupView('${g}')">
      <div class="summary-group-name" style="color:${c}">Grupo ${g} <span class="summary-arrow">›</span></div>`;
    teams.forEach(t => { html += `<div class="summary-team">${teamFlag(t)} <span>${teamName(t)}</span></div>`; });
    html += '</button>';
  });
  html += '</div>';
  el.innerHTML = html;
}

// Al tocar un grupo en el resumen: muestra los 6 partidos de ese grupo con tus pronósticos.
function renderGroupView(g) {
  currentGroupTab = 'group:' + g;
  document.querySelectorAll('#day-tabs .tab-btn').forEach(b => b.classList.remove('active'));
  const c = groupColor(g);
  const content = document.getElementById('day-content');
  const matches = getMatchesByGroup(g).sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff));
  content.innerHTML = `<div class="group-header" style="color:${c};border-left:4px solid ${c};padding-left:10px">Grupo ${g} · tus pronósticos</div>
                       <div class="matches-grid" id="day-grid"></div>`;
  const grid = document.getElementById('day-grid');
  matches.forEach(m => grid.appendChild(buildMatchCard(m)));
  content.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function buildMatchCard(match) {
  const locked = lockedM(match);
  const result = resultFor(match.id);
  const k = formatKickoff(match.kickoff);
  const card = document.createElement('div');
  card.className = 'match-card' + (locked ? ' locked' : '');
  card.id = `card-${match.id}`;
  card.innerHTML = `
    <div class="match-meta">
      <span class="group-badge" style="color:${groupColor(match.group)};border-color:${groupColor(match.group)};background:${groupColor(match.group)}22">Grupo ${match.group}</span>
      <span>${k.date}</span><span class="separator">·</span>
      <span class="kickoff-time">${k.time}</span><span class="separator">·</span>
      <span class="venue">${match.venue}</span>
      ${lockTag(locked, result)}
    </div>
    ${scoreRowsHtml(match.id, match.home, match.away, locked)}
    <div class="match-footer">
      <div class="save-status idle" id="status-${match.id}"></div>
      <div id="result-badge-${match.id}">${resultBadgeHtml(match.id)}</div>
    </div>`;
  if (!locked) wireCardInputs(card, match.id);
  return card;
}

// ── Navegación automática entre casillas ─────────────────
let advanceTimers = {};
const IS_TOUCH = (typeof window !== 'undefined') &&
  (window.matchMedia ? window.matchMedia('(pointer: coarse)').matches : ('ontouchstart' in window));
function safeSelect(el) { try { if (el && el.select) el.select(); } catch (_) {} }
function focusInput(id) { const el = document.getElementById(id); if (!el) return; try { el.focus(); } catch (_) {} safeSelect(el); }
function scheduleAdvance(id, fn) {
  if (IS_TOUCH) return;
  clearTimeout(advanceTimers[id]);
  const el = document.getElementById(id);
  if (!el || el.value === '') return;
  advanceTimers[id] = setTimeout(() => fn(id), 350);
}
function parseScoreId(id) { const m = id.match(/^sc-(.+)-(home|away)$/); return m ? { matchId: m[1], side: m[2] } : null; }
// Avanza dentro del contenedor visible (día activo o ronda activa); al final, salta al siguiente.
function advanceFocus(currentId) {
  const cur = document.getElementById(currentId); if (!cur) return;
  const grid = cur.closest('.matches-grid, .ko-grid'); if (!grid) return;
  const ids = Array.from(grid.querySelectorAll('.score-input')).map(i => i.id);
  const idx = ids.indexOf(currentId);
  if (idx >= 0 && idx < ids.length - 1) { focusInput(ids[idx + 1]); return; }
  // En la última casilla NO saltamos de día/ronda — el usuario revisa lo que ha puesto.
  try { cur.blur(); } catch (_) {}
}

// ── Guardar pronóstico ───────────────────────────────────
// Guarda el valor EN MEMORIA al instante (para que no desaparezca al cambiar de
// pestaña) y envía a la hoja con un pequeño retardo.
function onScoreChange(matchId) {
  const m = getAnyMatch(matchId);
  if (!m || lockedM(m)) { setStatus(matchId, 'error', '🔒 Cerrado'); return; }
  const hEl = document.getElementById(`sc-${matchId}-home`);
  const aEl = document.getElementById(`sc-${matchId}-away`);
  if (!hEl || !aEl) return;
  if (hEl.value === '' || aEl.value === '') { setStatus(matchId, 'idle', ''); return; }
  const home = parseInt(hEl.value, 10), away = parseInt(aEl.value, 10);
  if (isNaN(home) || isNaN(away) || home < 0 || away < 0) return;
  predictions[matchId] = { home, away }; // se conserva aunque cambies de pestaña al instante
  dirty[matchId] = { home, away };
  updateProgress();
  updateDayChecks();
  setStatus(matchId, 'saving', '…');
  clearTimeout(saveTimers[matchId]);
  saveTimers[matchId] = setTimeout(() => savePrediction(matchId), 600);
}
async function savePrediction(matchId) {
  const pred = predictions[matchId];
  if (!pred) return;
  try {
    await api.savePrediction({ user: currentUser, matchId, home: pred.home, away: pred.away });
    delete dirty[matchId];
    setStatus(matchId, 'saved', '✓ Guardado');
  } catch (err) {
    setStatus(matchId, 'error', '✗ Sin guardar — reintenta');
    console.error(err);
  }
}
function setStatus(matchId, cls, text) {
  const el = document.getElementById(`status-${matchId}`);
  if (!el) return;
  el.className = `save-status ${cls}`;
  el.textContent = text;
}

// ── Cargar datos ─────────────────────────────────────────
async function loadData() {
  if (!currentUser) return;
  try {
    let data;
    try { data = await api.getUser({ user: currentUser }); }
    catch (e) { data = await api.getAll(); }
    const serverPreds = {};
    (data.predictions || []).forEach(p => {
      if (!p.user || p.user === currentUser) serverPreds[p.matchId] = { home: p.home, away: p.away };
    });
    // Conserva lo que aún no se ha confirmado en la hoja (dirty manda sobre el servidor).
    predictions = Object.assign({}, serverPreds, dirty);
    results = {};
    (data.results || []).forEach(r => { results[r.matchId] = r; });
    koReal = {};
    (data.knockoutReal || []).forEach(k => {
      koReal[k.matchId] = { winner: k.winner || '', gh: k.gh, ga: k.ga };
    });
    // Equipos reales del cuadro a partir de resultados reales de grupos + ganadores reales.
    const groupResults = {};
    MATCHES.forEach(m => { const r = resultFor(m.id); if (r) groupResults[m.id] = { home: r.home, away: r.away }; });
    realBr = realKnockout(groupResults, koReal);

    syncGroupCards();
    maybeRefreshUpcoming(); // mantiene «Próximos» al día (3 días) en tiempo real
    // Eliminatorias: re-render solo si no estás escribiendo una casilla KO ahora mismo.
    const editingKo = document.activeElement && /^sc-M/.test(document.activeElement.id || '');
    if (currentPhase === 'ko' && !editingKo) renderKnockout();
  } catch (err) { console.error('loadData', err); }
}

// Actualiza las tarjetas visibles SIN borrar lo que el usuario está escribiendo:
// solo rellena casillas vacías con lo ya guardado, refresca insignias y bloqueos.
function syncGroupCards() {
  MATCHES.forEach(m => {
    const card = document.getElementById(`card-${m.id}`);
    if (!card) return; // solo las del día visible
    if (lockedM(m)) { card.replaceWith(buildMatchCard(m)); return; } // ya empezó → solo lectura
    const pred = predictions[m.id];
    if (pred) {
      const h = document.getElementById(`sc-${m.id}-home`);
      const a = document.getElementById(`sc-${m.id}-away`);
      if (h && document.activeElement !== h && h.value === '') h.value = pred.home;
      if (a && document.activeElement !== a && a.value === '') a.value = pred.away;
      if (h && a && h.value !== '' && a.value !== '') setStatus(m.id, 'saved', '✓ Guardado');
    }
    const badge = document.getElementById(`result-badge-${m.id}`);
    if (badge) badge.innerHTML = resultBadgeHtml(m.id);
  });
  updateProgress();
  updateDayChecks();
}

// ── Progreso (solo grupos) ───────────────────────────────
function updateProgress() {
  const total = MATCHES.length;
  const done = MATCHES.filter(m => predictions[m.id] !== undefined).length;
  const pct = Math.round((done / total) * 100);
  const t = document.getElementById('progress-text');
  if (t) t.textContent = `${done} / ${total} pronósticos de grupos`;
  const p = document.getElementById('progress-pct');
  if (p) p.textContent = `${pct}%`;
  const f = document.getElementById('progress-fill');
  if (f) f.style.width = `${pct}%`;
}
function updateDayChecks() {
  groupTabs.forEach(key => {
    if (key === 'upcoming') return;
    const matches = MATCHES.filter(m => madridDayKey(m.kickoff) === key);
    const done = matches.length > 0 && matches.every(m => predictions[m.id] !== undefined);
    const el = document.getElementById(`daycheck-${key}`);
    if (el) el.textContent = done ? '✓' : '';
  });
}

// ── Conmutador de fase ───────────────────────────────────
function showPhase(phase) {
  currentPhase = phase;
  document.getElementById('phase-groups').classList.toggle('hidden', phase !== 'groups');
  document.getElementById('phase-ko').classList.toggle('hidden', phase !== 'ko');
  document.getElementById('phase-groups-btn').classList.toggle('active', phase === 'groups');
  document.getElementById('phase-ko-btn').classList.toggle('active', phase === 'ko');
  if (phase === 'ko') renderKnockout();
}
document.getElementById('phase-groups-btn').addEventListener('click', () => showPhase('groups'));
document.getElementById('phase-ko-btn').addEventListener('click', () => showPhase('ko'));

// ── Eliminatorias (equipos reales por ronda) ─────────────
function renderKnockout() {
  const lockedMsg = document.getElementById('ko-locked-msg');
  const koContent = document.getElementById('ko-content');
  if (!realBr.complete) {
    lockedMsg.classList.remove('hidden');
    koContent.classList.add('hidden');
    document.getElementById('ko-locked-progress').textContent =
      'Entonces podrás pronosticar cada ronda con los equipos reales.';
    return;
  }
  lockedMsg.classList.add('hidden');
  koContent.classList.remove('hidden');
  buildKoRoundTabs();
  renderKoRound(currentKoRound);
}
function buildKoRoundTabs() {
  const tabsEl = document.getElementById('ko-round-tabs');
  tabsEl.innerHTML = '';
  KO_ROUNDS.forEach(r => {
    const btn = document.createElement('button');
    btn.className = 'tab-btn' + (r.key === currentKoRound ? ' active' : '');
    btn.dataset.round = r.key;
    btn.innerHTML = `${r.short} <span class="tab-check" id="ko-tab-check-${r.key}"></span>`;
    btn.addEventListener('click', () => switchKoRound(r.key));
    tabsEl.appendChild(btn);
  });
  updateKoTabChecks();
}
function switchKoRound(roundKey) {
  currentKoRound = roundKey;
  document.querySelectorAll('#ko-round-tabs .tab-btn').forEach(b => b.classList.toggle('active', b.dataset.round === roundKey));
  renderKoRound(roundKey);
}
function renderKoRound(roundKey) {
  const container = document.getElementById('ko-rounds');
  const round = KO_ROUNDS.find(r => r.key === roundKey);
  container.innerHTML = `<div class="group-header">${round.name}</div><div class="ko-grid" id="ko-grid"></div>`;
  const grid = document.getElementById('ko-grid');
  getKoMatchesByRound(roundKey).forEach(m => grid.appendChild(buildKoCard(m)));
  updateKoTabChecks();
}
function buildKoCard(m) {
  const r = realBr.resolved[m.id] || {};
  const locked = lockedM(m);
  const result = resultFor(m.id);
  const k = formatKickoff(m.kickoff);
  const label = (m.round === 'F') ? '🏆 Final' : (m.round === '3P') ? '🥉 Tercer puesto' : '';
  const card = document.createElement('div');
  card.className = 'ko-card' + (locked ? ' locked' : '');
  card.id = `card-${m.id}`;

  if (!r.home || !r.away) {
    card.innerHTML = `${label ? `<div class="ko-card-label">${label}</div>` : ''}
      <div class="match-meta"><span>${k.date}</span><span class="separator">·</span><span class="kickoff-time">${k.time}</span></div>
      <div class="mc-rows">
        <div class="mc-row"><span class="team-name tbd-text">Por determinar</span></div>
        <div class="mc-row"><span class="team-name tbd-text">Por determinar</span></div>
      </div>`;
    return card;
  }
  card.innerHTML = `
    ${label ? `<div class="ko-card-label">${label}</div>` : ''}
    <div class="match-meta">
      <span>${k.date}</span><span class="separator">·</span>
      <span class="kickoff-time">${k.time}</span>
      ${lockTag(locked, result)}
    </div>
    ${scoreRowsHtml(m.id, r.home, r.away, locked)}
    <div class="match-footer">
      <div class="save-status idle" id="status-${m.id}"></div>
      <div id="result-badge-${m.id}">${resultBadgeHtml(m.id)}</div>
    </div>`;
  if (!locked) wireCardInputs(card, m.id);
  return card;
}
function updateKoTabChecks() {
  KO_ROUNDS.forEach(r => {
    const matches = getKoMatchesByRound(r.key);
    const known = matches.filter(m => { const x = realBr.resolved[m.id]; return x && x.home && x.away; });
    const done = known.length > 0 && known.every(m => predictions[m.id] !== undefined || lockedM(m));
    const el = document.getElementById(`ko-tab-check-${r.key}`);
    if (el) el.textContent = done ? '✓' : '';
  });
}

// ── Init ─────────────────────────────────────────────────
buildUI();
setupBanner();
loadUser();
