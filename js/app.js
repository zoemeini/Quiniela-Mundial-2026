// ── Estado ───────────────────────────────────────────────
// Modelo unificado: se pronostica el MARCADOR de cada partido real (grupos y
// eliminatorias). Cada partido se cierra a su hora de inicio. Lo no rellenado
// cuenta como 0–0. Las eliminatorias muestran los equipos REALES por ronda.
let currentUser  = null;
let predictions  = {};   // { matchId: { home, away } }  (grupos + eliminatorias)
let results      = {};   // { matchId: { home, away, status } }  (grupos, reales)
let koReal       = {};   // { koMatchId: { winner, gh, ga } }  (eliminatorias, reales)
let realBr       = { complete: false, resolved: {} }; // equipos reales del cuadro
let saveTimers   = {};
let currentPhase = 'groups';
let currentGroup = 'A';
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
function wireCardInputs(matchId) {
  ['home', 'away'].forEach(side => {
    const el = document.getElementById(`sc-${matchId}-${side}`);
    if (!el) return;
    el.addEventListener('input', () => { onScoreChange(matchId); scheduleAdvance(el.id, advanceFocus); });
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

// ── Construir fase de grupos ─────────────────────────────
function buildUI() {
  const tabsEl = document.getElementById('group-tabs');
  const contentEl = document.getElementById('group-content');
  tabsEl.innerHTML = ''; contentEl.innerHTML = '';

  GROUPS.forEach((group, idx) => {
    const tab = document.createElement('button');
    tab.className = 'tab-btn' + (idx === 0 ? ' active' : '');
    tab.dataset.group = group;
    tab.innerHTML = `Grupo ${group} <span class="tab-check" id="tab-check-${group}"></span>`;
    tab.addEventListener('click', () => switchGroup(group));
    tabsEl.appendChild(tab);

    const panel = document.createElement('div');
    panel.className = 'group-panel' + (idx === 0 ? ' active' : '');
    panel.id = `panel-${group}`;
    const matches = getMatchesByGroup(group);
    const teams = [...new Set(matches.flatMap(m => [m.home, m.away]))].map(teamName).join(' · ');
    panel.innerHTML = `<div class="group-header">Grupo ${group} &nbsp;·&nbsp; ${teams}</div>
                       <div class="matches-grid" id="grid-${group}"></div>`;
    contentEl.appendChild(panel);
    matches.forEach(m => document.getElementById(`grid-${group}`).appendChild(buildMatchCard(m)));
  });
}

function switchGroup(group) {
  currentGroup = group;
  document.querySelectorAll('#group-tabs .tab-btn').forEach(b => b.classList.toggle('active', b.dataset.group === group));
  document.querySelectorAll('.group-panel').forEach(p => p.classList.toggle('active', p.id === `panel-${group}`));
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
  if (!locked) wireCardInputs(match.id);
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
function visibleGroupInputIds(group) {
  const ids = [];
  getMatchesByGroup(group).forEach(m => ['home', 'away'].forEach(s => {
    if (document.getElementById(`sc-${m.id}-${s}`)) ids.push(`sc-${m.id}-${s}`);
  }));
  return ids;
}
function visibleKoInputIds(round) {
  const ids = [];
  getKoMatchesByRound(round).forEach(m => ['home', 'away'].forEach(s => {
    if (document.getElementById(`sc-${m.id}-${s}`)) ids.push(`sc-${m.id}-${s}`);
  }));
  return ids;
}
function advanceFocus(currentId) {
  const p = parseScoreId(currentId); if (!p) return;
  const isKo = p.matchId[0] === 'M';
  const ids = isKo ? visibleKoInputIds(currentKoRound) : visibleGroupInputIds(currentGroup);
  const idx = ids.indexOf(currentId);
  if (idx >= 0 && idx < ids.length - 1) { focusInput(ids[idx + 1]); return; }
  if (!isKo) {
    const gi = GROUPS.indexOf(currentGroup);
    if (gi < GROUPS.length - 1) { const n = GROUPS[gi + 1]; switchGroup(n); setTimeout(() => { const f = visibleGroupInputIds(n)[0]; if (f) focusInput(f); }, 40); }
  } else {
    const ri = KO_ROUNDS.findIndex(r => r.key === currentKoRound);
    if (ri < KO_ROUNDS.length - 1) { const n = KO_ROUNDS[ri + 1].key; switchKoRound(n); setTimeout(() => { const f = visibleKoInputIds(n)[0]; if (f) focusInput(f); }, 40); }
  }
}

// ── Guardar pronóstico ───────────────────────────────────
function onScoreChange(matchId) {
  clearTimeout(saveTimers[matchId]);
  setStatus(matchId, 'saving', '…');
  saveTimers[matchId] = setTimeout(() => savePrediction(matchId), 700);
}
async function savePrediction(matchId) {
  const m = getAnyMatch(matchId);
  if (!m || lockedM(m)) { setStatus(matchId, 'error', '🔒 Cerrado'); return; }
  const hEl = document.getElementById(`sc-${matchId}-home`);
  const aEl = document.getElementById(`sc-${matchId}-away`);
  if (!hEl || !aEl) return;
  if (hEl.value === '' || aEl.value === '') { setStatus(matchId, 'idle', ''); return; }
  const home = parseInt(hEl.value, 10), away = parseInt(aEl.value, 10);
  if (isNaN(home) || isNaN(away) || home < 0 || away < 0) return;
  try {
    await api.savePrediction({ user: currentUser, matchId, home, away });
    predictions[matchId] = { home, away };
    setStatus(matchId, 'saved', '✓ Guardado');
    updateProgress();
    if (matchId[0] !== 'M') updateTabCheck(matchId[0]);
  } catch (err) {
    setStatus(matchId, 'error', '✗ Reintentando…');
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
    predictions = {};
    (data.predictions || []).forEach(p => {
      if (!p.user || p.user === currentUser) predictions[p.matchId] = { home: p.home, away: p.away };
    });
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

    rebuildGroups();
    renderKnockout();
  } catch (err) { console.error('loadData', err); }
}

// Re-render de grupos preservando el foco del usuario.
function rebuildGroups() {
  GROUPS.forEach(group => {
    const grid = document.getElementById(`grid-${group}`);
    if (!grid) return;
    getMatchesByGroup(group).forEach(m => {
      const old = document.getElementById(`card-${m.id}`);
      const active = document.activeElement;
      const editingThis = active && active.id && active.id.indexOf(`sc-${m.id}-`) === 0;
      if (editingThis) return; // no tocar la tarjeta que se está editando
      const fresh = buildMatchCard(m);
      if (old) old.replaceWith(fresh); else grid.appendChild(fresh);
    });
  });
  updateProgress();
  GROUPS.forEach(updateTabCheck);
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
function updateTabCheck(group) {
  const done = getMatchesByGroup(group).filter(m => predictions[m.id] !== undefined).length;
  const el = document.getElementById(`tab-check-${group}`);
  if (el) el.textContent = done === 6 ? '✓' : '';
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
      'Se abrirán cuando termine la fase de grupos y se conozcan los 32 clasificados reales.';
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
  if (!locked) wireCardInputs(m.id);
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
