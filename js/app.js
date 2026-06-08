// ── Estado ───────────────────────────────────────────────
let currentUser = null;
let predictions = {};   // { matchId: { home, away } }
let koPred      = {};   // { koMatchId: { home, away, pen } }  (eliminatorias)
let results     = {};   // { matchId: { home, away, status } }
let saveTimers  = {};   // temporizadores de guardado por partido
let currentPhase = 'groups';
let currentKoRound = 'R32';
let wasComplete = false; // para autosaltar a eliminatorias al completar grupos

const isLocked = () => Date.now() >= PREDICTION_DEADLINE.getTime();

// ── Gestión de usuario ───────────────────────────────────
function loadUser() {
  currentUser = localStorage.getItem('wc2026_username');
  if (!currentUser) {
    document.getElementById('username-modal').classList.remove('hidden');
  } else {
    applyUser();
  }
}

function applyUser() {
  document.getElementById('username-display').textContent = currentUser;
  document.getElementById('username-modal').classList.add('hidden');
  loadData();
  setInterval(loadData, 60000); // refresca resultados periódicamente
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
  if (isLocked()) return; // tras el cierre no se puede borrar
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
    await api.deleteUser({ user: currentUser });   // borra en la hoja
    localStorage.removeItem('wc2026_username');     // solo si el borrado tuvo éxito
    location.reload();
  } catch (err) {
    console.error('deleteUser', err);
    alert('No se pudo borrar el usuario ahora mismo. Inténtalo de nuevo en un momento.');
    btn.textContent = 'Sí, borrar y empezar'; btn.disabled = false;
  }
});

// ── Cuenta atrás ─────────────────────────────────────────
function updateCountdown() {
  const deadlineBanner = document.getElementById('deadline-banner');
  const lockedBanner   = document.getElementById('locked-banner');
  const deadlineText   = document.getElementById('deadline-text');

  if (isLocked()) {
    deadlineBanner.classList.add('hidden');
    lockedBanner.classList.remove('hidden');
    document.querySelectorAll('.match-card, .ko-card').forEach(c => c.classList.add('locked'));
    const delBtn = document.getElementById('change-user-btn');
    if (delBtn) delBtn.style.display = 'none'; // tras el cierre no se borra ni se cambia
    return;
  }

  lockedBanner.classList.add('hidden');
  deadlineBanner.classList.remove('hidden');

  const diff  = PREDICTION_DEADLINE.getTime() - Date.now();
  const days  = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins  = Math.floor((diff % 3600000)  / 60000);
  const secs  = Math.floor((diff % 60000)    / 1000);

  if (days > 0) {
    deadlineText.textContent = `Los pronósticos se cierran en ${days}d ${hours}h ${mins}m — ¡envíalos antes del 11 de junio!`;
  } else if (hours > 0) {
    deadlineText.textContent = `Los pronósticos se cierran en ${hours}h ${mins}m ${secs}s — ¡date prisa!`;
  } else {
    deadlineText.textContent = `Los pronósticos se cierran en ${mins}m ${secs}s — ¡envíalos ya!`;
  }
}
setInterval(updateCountdown, 1000);

// ── Construir interfaz ───────────────────────────────────
function buildUI() {
  const tabsEl    = document.getElementById('group-tabs');
  const contentEl = document.getElementById('group-content');
  tabsEl.innerHTML    = '';
  contentEl.innerHTML = '';

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

    matches.forEach(match => {
      document.getElementById(`grid-${group}`).appendChild(buildMatchCard(match));
    });
  });
}

function switchGroup(group) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.group === group));
  document.querySelectorAll('.group-panel').forEach(p => p.classList.toggle('active', p.id === `panel-${group}`));
}

function buildMatchCard(match) {
  const card = document.createElement('div');
  card.className = 'match-card' + (isLocked() ? ' locked' : '');
  card.id = `card-${match.id}`;

  const k = formatKickoff(match.kickoff);

  card.innerHTML = `
    <div class="match-meta">
      <span>${k.date}</span>
      <span class="separator">·</span>
      <span class="kickoff-time">${k.time}</span>
      <span class="separator">·</span>
      <span class="venue">${match.venue}</span>
    </div>
    <div class="mc-rows">
      <div class="mc-row">
        ${teamFlag(match.home)}
        <span class="team-name">${teamName(match.home)}</span>
        <input class="score-input" type="number" inputmode="numeric" min="0" max="20" placeholder="–"
               id="home-${match.id}" data-match="${match.id}" data-side="home">
      </div>
      <div class="mc-row">
        ${teamFlag(match.away)}
        <span class="team-name">${teamName(match.away)}</span>
        <input class="score-input" type="number" inputmode="numeric" min="0" max="20" placeholder="–"
               id="away-${match.id}" data-match="${match.id}" data-side="away">
      </div>
    </div>
    <div class="match-footer">
      <div class="save-status idle" id="status-${match.id}"></div>
      <div id="result-badge-${match.id}"></div>
    </div>`;

  [`#home-${match.id}`, `#away-${match.id}`].forEach(sel => {
    const el = card.querySelector(sel);
    el.addEventListener('input', () => { onScoreChange(match.id); scheduleAdvance(el.id, advanceGroupFocus); });
    el.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); advanceGroupFocus(el.id); } });
    el.addEventListener('focus', () => el.select());
  });

  return card;
}

// ── Navegación automática entre casillas ─────────────────
let advanceTimers = {};
function focusInput(id) {
  const el = document.getElementById(id);
  if (el) { el.focus(); if (el.select) el.select(); }
}
// Avanza tras una breve pausa (permite escribir resultados de 2 cifras como "10").
function scheduleAdvance(id, fn) {
  clearTimeout(advanceTimers[id]);
  const el = document.getElementById(id);
  if (!el || el.value === '') return;
  advanceTimers[id] = setTimeout(() => fn(id), 350);
}
function groupInputIds(group) {
  const ids = [];
  getMatchesByGroup(group).forEach(m => ids.push(`home-${m.id}`, `away-${m.id}`));
  return ids;
}
function advanceGroupFocus(currentId) {
  const matchId = currentId.replace(/^(home|away)-/, '');
  const group = matchId[0];
  const ids = groupInputIds(group);
  const idx = ids.indexOf(currentId);
  if (idx >= 0 && idx < ids.length - 1) { focusInput(ids[idx + 1]); return; }
  // Última casilla del grupo → pasa al siguiente grupo.
  const gi = GROUPS.indexOf(group);
  if (gi >= 0 && gi < GROUPS.length - 1) {
    const next = GROUPS[gi + 1];
    switchGroup(next);
    setTimeout(() => focusInput(groupInputIds(next)[0]), 40);
  }
}
function koInputIds(roundKey) {
  const ids = [];
  getKoMatchesByRound(roundKey).forEach(m => ids.push(`ko-home-${m.id}`, `ko-away-${m.id}`));
  return ids;
}
function advanceKoFocus(currentId) {
  const matchId = currentId.replace(/^ko-(home|away)-/, '');
  const round = getKoMatch(matchId).round;
  const ids = koInputIds(round).filter(id => document.getElementById(id)); // solo casillas existentes
  const idx = ids.indexOf(currentId);
  if (idx >= 0 && idx < ids.length - 1) { focusInput(ids[idx + 1]); return; }
  // Fin de la ronda → si está completa, pasa a la siguiente.
  if (roundComplete(round)) {
    const ri = KO_ROUNDS.findIndex(r => r.key === round);
    if (ri >= 0 && ri < KO_ROUNDS.length - 1) {
      const nextKey = KO_ROUNDS[ri + 1].key;
      switchKoRound(nextKey);
      setTimeout(() => {
        const first = koInputIds(nextKey).find(id => document.getElementById(id));
        if (first) focusInput(first);
      }, 40);
    }
  }
}

// ── Guardar pronóstico ───────────────────────────────────
function onScoreChange(matchId) {
  clearTimeout(saveTimers[matchId]);
  setStatus(matchId, 'saving', '…');
  saveTimers[matchId] = setTimeout(() => savePrediction(matchId), 700);
}

async function savePrediction(matchId) {
  if (isLocked()) return;
  const homeVal = document.getElementById(`home-${matchId}`).value;
  const awayVal = document.getElementById(`away-${matchId}`).value;
  if (homeVal === '' || awayVal === '') { setStatus(matchId, 'idle', ''); return; }

  const home = parseInt(homeVal, 10);
  const away = parseInt(awayVal, 10);
  if (isNaN(home) || isNaN(away) || home < 0 || away < 0) return;

  try {
    await api.savePrediction({ user: currentUser, matchId, home, away });
    predictions[matchId] = { home, away };
    setStatus(matchId, 'saved', '✓ Guardado');
    updateProgress();
    updateTabCheck(matchId[0]);
    renderKnockout(); // el cuadro depende de los grupos
    maybeJumpToKnockout();
  } catch (err) {
    setStatus(matchId, 'error', '✗ Error');
    console.error(err);
  }
}

// Cuando se completan los 72 pronósticos, salta a las eliminatorias.
function maybeJumpToKnockout() {
  const complete = Object.keys(predictions).length === MATCHES.length;
  if (complete && !wasComplete) {
    wasComplete = true;
    showPhase('ko');
  }
  wasComplete = complete;
}

function setStatus(matchId, cls, text) {
  const el = document.getElementById(`status-${matchId}`);
  if (!el) return;
  el.className = `save-status ${cls}`;
  el.textContent = text;
}

// ── Cargar pronósticos + resultados desde la hoja ────────
async function loadData() {
  if (!currentUser) return;
  try {
    const data = await api.getAll();
    predictions = {};
    (data.predictions || []).forEach(p => {
      if (p.user === currentUser) predictions[p.matchId] = { home: p.home, away: p.away };
    });
    koPred = {};
    (data.bracket || []).forEach(b => {
      if (b.user !== currentUser) return;
      const h = (b.home === '' || b.home == null) ? null : Number(b.home);
      const a = (b.away === '' || b.away == null) ? null : Number(b.away);
      // For a predicted draw, the saved advancer is the penalty pick.
      const pen = (h != null && a != null && h === a && b.team) ? b.team : null;
      koPred[b.matchId] = { home: h, away: a, pen: pen };
    });
    results = {};
    (data.results || []).forEach(r => { results[r.matchId] = r; });
    renderPredictions();
    renderKnockout();
  } catch (err) {
    console.error('loadData', err);
  }
}

function renderPredictions() {
  MATCHES.forEach(match => {
    const pred = predictions[match.id];
    const hEl = document.getElementById(`home-${match.id}`);
    const aEl = document.getElementById(`away-${match.id}`);
    if (!hEl || !aEl) return;
    if (pred) {
      // No sobrescribir lo que el usuario está escribiendo ahora mismo.
      if (document.activeElement !== hEl && document.activeElement !== aEl) {
        hEl.value = pred.home;
        aEl.value = pred.away;
      }
      setStatus(match.id, 'saved', '✓ Guardado');
    }
  });
  updateProgress();
  GROUPS.forEach(g => updateTabCheck(g));
  renderResultBadges();
}

function renderResultBadges() {
  MATCHES.forEach(match => {
    const badgeEl = document.getElementById(`result-badge-${match.id}`);
    if (!badgeEl) return;
    const result = results[match.id];
    if (!result || result.status !== 'finished') { badgeEl.innerHTML = ''; return; }

    const pred = predictions[match.id];
    const resultStr = `${result.home} – ${result.away}`;
    if (!pred) {
      badgeEl.innerHTML = `<span class="result-display result-wrong">Resultado: ${resultStr}</span>`;
      return;
    }
    const pts = calculatePoints(pred, result);
    if (pts === 5)      badgeEl.innerHTML = `<span class="result-display result-correct-exact">⭐ ¡Exacto! +5pts</span>`;
    else if (pts === 3) badgeEl.innerHTML = `<span class="result-display result-correct-outcome">✓ Acierto +3pts</span>`;
    else                badgeEl.innerHTML = `<span class="result-display result-wrong">✗ ${resultStr}</span>`;
  });
}

// ── Progreso ─────────────────────────────────────────────
function updateProgress() {
  const total = MATCHES.length;
  const done  = Object.keys(predictions).length;
  const pct   = Math.round((done / total) * 100);
  document.getElementById('progress-text').textContent = `${done} / ${total} pronósticos`;
  document.getElementById('progress-pct').textContent  = `${pct}%`;
  document.getElementById('progress-fill').style.width = `${pct}%`;
}

function updateTabCheck(group) {
  const matches = getMatchesByGroup(group);
  const done    = matches.filter(m => predictions[m.id] !== undefined).length;
  const el      = document.getElementById(`tab-check-${group}`);
  if (el) el.textContent = done === 6 ? '✓' : '';
}

// ── Conmutador de fase (grupos / eliminatorias) ──────────
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

// ── Eliminatorias ────────────────────────────────────────
let bracket = null;     // { complete, standings, thirdAssign, resolved }
let koSaveTimers = {};

// El ganador de cada eliminatoria se deduce del marcador (en empate, penaltis).
function koWinnerFn(matchId, home, away) {
  const pr = koPred[matchId];
  if (!pr || pr.home == null || pr.away == null) return null;
  if (pr.home > pr.away) return home;
  if (pr.away > pr.home) return away;
  return (pr.pen === home || pr.pen === away) ? pr.pen : null;
}

function rebuildBracket() {
  bracket = buildUserBracket(predictions, null, koWinnerFn);
}

// Qué partidos dependen de cada partido (para borrar los posteriores si cambia un ganador).
const KO_CHILDREN = {};
KO_MATCHES.forEach(m => {
  [m.home, m.away].forEach(ref => {
    const parent = ref.winOf || ref.loseOf;
    if (parent) (KO_CHILDREN[parent] = KO_CHILDREN[parent] || []).push(m.id);
  });
});

function renderKnockout() {
  rebuildBracket();

  const lockedMsg = document.getElementById('ko-locked-msg');
  const koContent = document.getElementById('ko-content');

  if (!bracket.complete) {
    lockedMsg.classList.remove('hidden');
    koContent.classList.add('hidden');
    const done = Object.keys(predictions).length;
    document.getElementById('ko-locked-progress').textContent =
      `Llevas ${done} de ${MATCHES.length} pronósticos de grupos.`;
    return;
  }

  lockedMsg.classList.add('hidden');
  koContent.classList.remove('hidden');
  buildKoRoundTabs();
  renderKoRound(currentKoRound);
}

function buildKoRoundTabs() {
  const tabsEl = document.getElementById('ko-round-tabs');
  if (tabsEl.dataset.built) { updateKoTabChecks(); return; }
  tabsEl.innerHTML = '';
  KO_ROUNDS.forEach(r => {
    const btn = document.createElement('button');
    btn.className = 'tab-btn' + (r.key === currentKoRound ? ' active' : '');
    btn.dataset.round = r.key;
    btn.innerHTML = `${r.short} <span class="tab-check" id="ko-tab-check-${r.key}"></span>`;
    btn.addEventListener('click', () => switchKoRound(r.key));
    tabsEl.appendChild(btn);
  });
  tabsEl.dataset.built = '1';
  updateKoTabChecks();
}

function switchKoRound(roundKey) {
  currentKoRound = roundKey;
  document.querySelectorAll('#ko-round-tabs .tab-btn')
    .forEach(b => b.classList.toggle('active', b.dataset.round === roundKey));
  renderKoRound(roundKey);
}

function renderKoRound(roundKey) {
  const container = document.getElementById('ko-rounds');
  const round = KO_ROUNDS.find(r => r.key === roundKey);
  const matches = getKoMatchesByRound(roundKey);

  container.innerHTML = `<div class="group-header">${round.name}</div>
                         <div class="ko-grid" id="ko-grid"></div>`;
  const grid = document.getElementById('ko-grid');
  matches.forEach(m => grid.appendChild(buildKoCard(m)));
  updateKoTabChecks();
}

function buildKoCard(m) {
  const r  = bracket.resolved[m.id] || {};
  const pr = koPred[m.id] || {};
  const card = document.createElement('div');
  card.className = 'ko-card' + (isLocked() ? ' locked' : '');
  card.id = `ko-card-${m.id}`;

  const label = (m.round === 'F') ? '🏆 Final'
    : (m.round === '3P') ? '🥉 Tercer puesto' : '';

  // Equipos aún por determinar (faltan pronósticos de rondas anteriores)
  if (!r.home || !r.away) {
    card.innerHTML = `${label ? `<div class="ko-card-label">${label}</div>` : ''}
      <div class="ko-rows">
        <div class="ko-row"><span class="ko-team-name tbd-text">Por determinar</span></div>
        <div class="ko-row"><span class="ko-team-name tbd-text">Por determinar</span></div>
      </div>`;
    return card;
  }

  const hv = pr.home == null ? '' : pr.home;
  const av = pr.away == null ? '' : pr.away;
  const isDraw = pr.home != null && pr.away != null && pr.home === pr.away;

  card.innerHTML = `
    ${label ? `<div class="ko-card-label">${label}</div>` : ''}
    <div class="ko-rows">
      <div class="ko-row home${r.winner === r.home ? ' winner' : ''}">
        ${teamFlag(r.home)}<span class="ko-team-name">${teamName(r.home)}</span>
        <input class="score-input" type="number" inputmode="numeric" min="0" max="20" placeholder="–" id="ko-home-${m.id}" value="${hv}">
        <span class="ko-check">✓</span>
      </div>
      <div class="ko-row away${r.winner === r.away ? ' winner' : ''}">
        ${teamFlag(r.away)}<span class="ko-team-name">${teamName(r.away)}</span>
        <input class="score-input" type="number" inputmode="numeric" min="0" max="20" placeholder="–" id="ko-away-${m.id}" value="${av}">
        <span class="ko-check">✓</span>
      </div>
    </div>
    <div class="ko-pen ${isDraw ? '' : 'hidden'}" id="ko-pen-${m.id}">
      <span class="ko-pen-label">Empate — ¿quién pasa en penaltis?</span>
      <div class="ko-pen-btns">
        <button class="ko-pen-btn${pr.pen === r.home ? ' picked' : ''}" data-team="${r.home}">${teamName(r.home)}</button>
        <button class="ko-pen-btn${pr.pen === r.away ? ' picked' : ''}" data-team="${r.away}">${teamName(r.away)}</button>
      </div>
    </div>`;

  [`#ko-home-${m.id}`, `#ko-away-${m.id}`].forEach(sel => {
    const el = card.querySelector(sel);
    el.addEventListener('input', () => { onKoScore(m.id); scheduleAdvance(el.id, advanceKoFocus); });
    el.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); advanceKoFocus(el.id); } });
    el.addEventListener('focus', () => el.select());
  });
  card.querySelectorAll('.ko-pen-btn').forEach(btn =>
    btn.addEventListener('click', () => onKoPenalty(m.id, btn.dataset.team)));
  return card;
}

// Actualiza el resaltado del ganador y la fila de penaltis SIN recrear los inputs.
function updateKoCardUI(matchId) {
  const card = document.getElementById(`ko-card-${matchId}`);
  if (!card) return;
  const r  = bracket.resolved[matchId] || {};
  const pr = koPred[matchId] || {};
  const homeSide = card.querySelector('.ko-row.home');
  const awaySide = card.querySelector('.ko-row.away');
  if (homeSide) homeSide.classList.toggle('winner', !!r.winner && r.winner === r.home);
  if (awaySide) awaySide.classList.toggle('winner', !!r.winner && r.winner === r.away);
  const pen = card.querySelector('.ko-pen');
  const isDraw = pr.home != null && pr.away != null && pr.home === pr.away;
  if (pen) {
    pen.classList.toggle('hidden', !isDraw);
    pen.querySelectorAll('.ko-pen-btn').forEach(b => b.classList.toggle('picked', b.dataset.team === pr.pen));
  }
}

function onKoScore(matchId) {
  if (isLocked()) return;
  const hEl = document.getElementById(`ko-home-${matchId}`);
  const aEl = document.getElementById(`ko-away-${matchId}`);
  const h = hEl.value === '' ? null : parseInt(hEl.value, 10);
  const a = aEl.value === '' ? null : parseInt(aEl.value, 10);
  const prev = koPred[matchId] || {};
  koPred[matchId] = {
    home: (h == null || isNaN(h) || h < 0) ? null : h,
    away: (a == null || isNaN(a) || a < 0) ? null : a,
    pen:  prev.pen || null,
  };

  const before = bracket.resolved[matchId] ? bracket.resolved[matchId].winner : null;
  rebuildBracket();
  const after = bracket.resolved[matchId] ? bracket.resolved[matchId].winner : null;
  if (before !== after) { clearDescendants(matchId); rebuildBracket(); }

  updateKoCardUI(matchId);
  updateKoTabChecks();

  clearTimeout(koSaveTimers[matchId]);
  koSaveTimers[matchId] = setTimeout(() => { saveKoPred(matchId); autoAdvanceRound(); }, 700);
}

function onKoPenalty(matchId, team) {
  if (isLocked()) return;
  const pr = koPred[matchId];
  if (!pr) return;
  const before = bracket.resolved[matchId] ? bracket.resolved[matchId].winner : null;
  pr.pen = team;
  rebuildBracket();
  const after = bracket.resolved[matchId] ? bracket.resolved[matchId].winner : null;
  if (before !== after) { clearDescendants(matchId); rebuildBracket(); }
  updateKoCardUI(matchId);
  updateKoTabChecks();
  saveKoPred(matchId);
  autoAdvanceRound();
}

function saveKoPred(matchId) {
  if (isLocked()) return;
  const pr = koPred[matchId] || {};
  const r  = bracket.resolved[matchId] || {};
  api.savePick({
    user: currentUser,
    matchId,
    team: r.winner || '',
    home: pr.home == null ? '' : pr.home,
    away: pr.away == null ? '' : pr.away,
  }).catch(err => console.error('savePick', err));
}

// Si el ganador de un partido cambia, los partidos posteriores que dependían de él
// ya no son válidos: se borran sus marcadores (en memoria y en la hoja).
function clearDescendants(matchId) {
  const queue = [...(KO_CHILDREN[matchId] || [])];
  while (queue.length) {
    const id = queue.shift();
    if (koPred[id]) {
      delete koPred[id];
      api.savePick({ user: currentUser, matchId: id, team: '', home: '', away: '' }).catch(() => {});
    }
    (KO_CHILDREN[id] || []).forEach(c => queue.push(c));
  }
}

function roundComplete(roundKey) {
  return getKoMatchesByRound(roundKey).every(m => {
    const r = bracket.resolved[m.id];
    return r && r.winner;
  });
}

function updateKoTabChecks() {
  KO_ROUNDS.forEach(r => {
    const el = document.getElementById(`ko-tab-check-${r.key}`);
    if (el) el.textContent = roundComplete(r.key) ? '✓' : '';
  });
}

// Al completar una ronda, salta automáticamente a la siguiente.
function autoAdvanceRound() {
  updateKoTabChecks();
  if (!roundComplete(currentKoRound)) return;
  const idx = KO_ROUNDS.findIndex(r => r.key === currentKoRound);
  if (idx >= 0 && idx < KO_ROUNDS.length - 1) {
    switchKoRound(KO_ROUNDS[idx + 1].key);
  }
}

// ── Init ─────────────────────────────────────────────────
buildUI();
updateCountdown();
loadUser();
