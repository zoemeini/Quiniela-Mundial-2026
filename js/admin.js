let results = {};
let koReal  = {};  // { matchId: { gh, ga, winner } }
let realBr  = { complete: false, resolved: {} }; // equipos reales del cuadro

// Recalcula los equipos reales de cada eliminatoria a partir de los resultados
// reales de grupos + los ganadores reales ya introducidos.
function recomputeRealBr() {
  const gr = {};
  MATCHES.forEach(m => {
    const r = results[m.id];
    if (r && r.status === 'finished') gr[m.id] = { home: r.home, away: r.away };
  });
  realBr = realKnockout(gr, koReal);
}

// ── Password gate ────────────────────────────────────────
const passwordInput = document.getElementById('password-input');
const passwordError = document.getElementById('password-error');

document.getElementById('password-submit').addEventListener('click', tryLogin);
passwordInput.addEventListener('keydown', e => { if (e.key === 'Enter') tryLogin(); });

function tryLogin() {
  if (passwordInput.value === ADMIN_PASSWORD) {
    document.getElementById('password-gate').classList.add('hidden');
    document.getElementById('admin-panel').classList.remove('hidden');
    document.getElementById('logout-btn').style.display = '';
    initAdmin();
  } else {
    passwordError.classList.remove('hidden');
    passwordInput.value = '';
    passwordInput.focus();
  }
}

document.getElementById('logout-btn').addEventListener('click', () => {
  document.getElementById('password-gate').classList.remove('hidden');
  document.getElementById('admin-panel').classList.add('hidden');
  document.getElementById('logout-btn').style.display = 'none';
  passwordInput.value = '';
});

// ── Admin init ───────────────────────────────────────────
async function initAdmin() {
  try {
    const data = await api.getAll();
    results = {};
    (data.results || []).forEach(r => { results[r.matchId] = r; });
    koReal = {};
    (data.knockoutReal || []).forEach(k => {
      koReal[k.matchId] = { gh: k.gh, ga: k.ga, winner: k.winner };
    });
  } catch (err) {
    console.error('initAdmin', err);
    alert('No se pudieron cargar los resultados existentes. Revisa SHEET_API_URL en js/config.js.');
  }
  recomputeRealBr();
  buildAdminUI();
  buildAdminKoUI();
}

// Sub-conmutador grupos / eliminatorias / minijuego
function showAdminTab(which) { // 'groups' | 'ko' | 'game'
  document.getElementById('admin-groups').classList.toggle('hidden', which !== 'groups');
  document.getElementById('admin-ko').classList.toggle('hidden', which !== 'ko');
  document.getElementById('admin-minigame').classList.toggle('hidden', which !== 'game');
  document.getElementById('admin-groups-btn').classList.toggle('active', which === 'groups');
  document.getElementById('admin-ko-btn').classList.toggle('active', which === 'ko');
  document.getElementById('admin-game-btn').classList.toggle('active', which === 'game');
  if (which === 'game' && window.initMinigame) window.initMinigame();
}
document.getElementById('admin-groups-btn').addEventListener('click', () => showAdminTab('groups'));
document.getElementById('admin-ko-btn').addEventListener('click', () => showAdminTab('ko'));
document.getElementById('admin-game-btn').addEventListener('click', () => showAdminTab('game'));

// ── Navegador por días (mismo estilo que la página principal) ───────────
let adminDay = null, adminDays = [], adminByDay = {};

function adminDayLabel(key) {
  const lbl = formatKickoff(adminByDay[key][0].kickoff).date; // p.ej. "vie, 12 jun"
  return lbl.charAt(0).toUpperCase() + lbl.slice(1);
}
// Primer día (por fecha) que sea hoy o posterior; si ya pasaron todos, el último.
function adminNearestDay() {
  const today = madridDayKey(new Date());
  return adminDays.find(k => k >= today) || adminDays[adminDays.length - 1];
}

function buildAdminUI() {
  const container = document.getElementById('admin-groups');
  container.innerHTML = '';

  // Partidos de grupos en orden cronológico, agrupados por día de juego.
  const sorted = MATCHES.slice().sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff));
  adminDays = [];
  adminByDay = {};
  sorted.forEach(m => {
    const key = madridDayKey(m.kickoff);
    if (!adminByDay[key]) { adminByDay[key] = []; adminDays.push(key); }
    adminByDay[key].push(m);
  });

  if (!adminDay || !adminByDay[adminDay]) adminDay = adminNearestDay();

  // Barra de navegación: «📅 Hoy» + ‹ desplegable de días ›.
  const nav = document.createElement('div');
  nav.className = 'day-nav';
  nav.style.marginBottom = '20px';
  nav.innerHTML =
    '<button class="tab-btn" id="admin-today">📅 Hoy</button>' +
    '<div class="day-stepper">' +
      '<button class="day-arrow" id="admin-prev" aria-label="Día anterior">‹</button>' +
      '<select class="day-select" id="admin-day-select">' +
        adminDays.map(k => `<option value="${k}">${adminDayLabel(k)}</option>`).join('') +
      '</select>' +
      '<button class="day-arrow" id="admin-next" aria-label="Día siguiente">›</button>' +
    '</div>';
  container.appendChild(nav);

  const content = document.createElement('div');
  content.id = 'admin-day-content';
  container.appendChild(content);

  document.getElementById('admin-today').addEventListener('click', () => renderAdminDay(adminNearestDay()));
  document.getElementById('admin-prev').addEventListener('click', () => adminStepDay(-1));
  document.getElementById('admin-next').addEventListener('click', () => adminStepDay(1));
  document.getElementById('admin-day-select').addEventListener('change', e => renderAdminDay(e.target.value));

  renderAdminDay(adminDay);
}

function adminStepDay(dir) {
  const i = adminDays.indexOf(adminDay);
  const n = (i + dir + adminDays.length) % adminDays.length;
  renderAdminDay(adminDays[n]);
}

function renderAdminDay(key) {
  adminDay = key;
  const sel = document.getElementById('admin-day-select');
  if (sel) sel.value = key;
  const todayBtn = document.getElementById('admin-today');
  if (todayBtn) todayBtn.classList.toggle('active', key === adminNearestDay());
  const content = document.getElementById('admin-day-content');
  content.innerHTML = `<div class="admin-group"><div class="admin-group-title">📅 ${adminDayLabel(key)}</div><div id="admin-day-grid"></div></div>`;
  const grid = document.getElementById('admin-day-grid');
  (adminByDay[key] || []).forEach(match => grid.appendChild(buildAdminMatchRow(match)));
  updateAdminDayChecks();
}

// Marca con ✓ en el desplegable los días con TODOS los resultados ya metidos.
function updateAdminDayChecks() {
  const sel = document.getElementById('admin-day-select');
  if (!sel) return;
  Array.from(sel.options).forEach(opt => {
    const matches = adminByDay[opt.value] || [];
    const done = matches.length > 0 && matches.every(m => results[m.id] && results[m.id].status === 'finished');
    opt.textContent = adminDayLabel(opt.value) + (done ? ' ✓' : '');
  });
}

function buildAdminMatchRow(match) {
  const result   = results[match.id];
  const finished = result && result.status === 'finished';
  const k        = formatKickoff(match.kickoff);

  const row = document.createElement('div');
  row.className = 'admin-match';
  row.id = `admin-row-${match.id}`;

  row.innerHTML = `
    <div class="admin-match-info">
      <div class="teams"><span class="group-badge" style="color:${groupColor(match.group)};border-color:${groupColor(match.group)};background:${groupColor(match.group)}22">Grupo ${match.group}</span> ${teamFlag(match.home)} ${teamName(match.home)} vs ${teamName(match.away)} ${teamFlag(match.away)}</div>
      <div class="date">${k.date} · ${k.time} · ${match.venue}</div>
    </div>
    <div class="admin-score-form">
      <input class="admin-score-input" type="number" min="0" max="20"
             id="admin-home-${match.id}" value="${finished ? result.home : ''}" placeholder="–">
      <span class="score-separator">-</span>
      <input class="admin-score-input" type="number" min="0" max="20"
             id="admin-away-${match.id}" value="${finished ? result.away : ''}" placeholder="–">
      <button class="admin-save-btn" id="admin-save-${match.id}"
              onclick="saveResult('${match.id}')">
        ${finished ? 'Actualizar' : 'Guardar'}
      </button>
    </div>
    <div class="admin-status ${finished ? 'finished' : 'pending'}" id="admin-status-${match.id}">
      ${finished ? `✓ ${result.home}–${result.away}` : 'Pendiente'}
    </div>`;

  return row;
}

async function saveResult(matchId) {
  const homeVal = document.getElementById(`admin-home-${matchId}`).value;
  const awayVal = document.getElementById(`admin-away-${matchId}`).value;
  if (homeVal === '' || awayVal === '') { alert('Introduce ambos resultados.'); return; }

  const home = parseInt(homeVal, 10);
  const away = parseInt(awayVal, 10);
  if (isNaN(home) || isNaN(away) || home < 0 || away < 0) {
    alert('Resultados inválidos — introduce números no negativos.');
    return;
  }

  const btn = document.getElementById(`admin-save-${matchId}`);
  btn.textContent = 'Guardando…';
  btn.disabled = true;

  try {
    await api.saveResult({ matchId, home, away });
    results[matchId] = { home, away, status: 'finished' };

    const statusEl = document.getElementById(`admin-status-${matchId}`);
    statusEl.className = 'admin-status finished';
    statusEl.textContent = `✓ ${home}–${away}`;

    btn.textContent = 'Actualizar';
    btn.disabled = false;

    updateAdminDayChecks(); // marca el día con ✓ si ya están todos sus resultados
    // Al completar los grupos aparecen los equipos reales de dieciseisavos.
    recomputeRealBr();
    buildAdminKoUI();
  } catch (err) {
    alert('Error al guardar el resultado: ' + err.message);
    btn.textContent = 'Reintentar';
    btn.disabled = false;
    console.error(err);
  }
}

// ── Eliminatorias reales (admin) ─────────────────────────
function buildAdminKoUI() {
  const container = document.getElementById('admin-ko-groups');
  container.innerHTML = '';

  KO_ROUNDS.forEach(round => {
    const matches = getKoMatchesByRound(round.key);
    const section = document.createElement('div');
    section.className = 'admin-group';
    section.innerHTML = `<div class="admin-group-title">${round.name}</div>
                         <div id="admin-ko-grid-${round.key}"></div>`;
    container.appendChild(section);
    matches.forEach(m => {
      document.getElementById(`admin-ko-grid-${round.key}`).appendChild(buildAdminKoRow(m));
    });
  });
}

function buildAdminKoRow(m) {
  const data = koReal[m.id] || { gh: '', ga: '', winner: '' };
  const r = realBr.resolved[m.id] || {};
  const row = document.createElement('div');
  row.className = 'admin-match';
  row.id = `admin-ko-row-${m.id}`;

  // Equipos aún por determinar (faltan resultados de rondas anteriores).
  if (!r.home || !r.away) {
    row.innerHTML = `
      <div class="admin-match-info" style="min-width:120px">
        <div class="teams">${m.id} · <span class="tbd-text">Por determinar</span></div>
        <div class="date">${KO_ROUNDS.find(x => x.key === m.round).short}</div>
      </div>
      <div class="admin-status pending">Esperando</div>`;
    return row;
  }

  const winnerSel = data.winner === r.home ? 'home' : data.winner === r.away ? 'away' : '';
  row.innerHTML = `
    <div class="admin-match-info" style="min-width:160px">
      <div class="teams">${teamFlag(r.home)} ${teamName(r.home)} vs ${teamName(r.away)} ${teamFlag(r.away)}</div>
      <div class="date">${m.id} · ${KO_ROUNDS.find(x => x.key === m.round).short}</div>
    </div>
    <div class="admin-ko-form">
      <input class="admin-score-input" type="number" min="0" max="20" id="ko-gh-${m.id}" value="${data.gh === '' || data.gh == null ? '' : data.gh}" placeholder="–">
      <span class="score-separator">-</span>
      <input class="admin-score-input" type="number" min="0" max="20" id="ko-ga-${m.id}" value="${data.ga === '' || data.ga == null ? '' : data.ga}" placeholder="–">
      <select class="admin-select" id="ko-win-${m.id}" title="Solo si hay empate (penaltis)">
        <option value="">pasa (si empate)</option>
        <option value="home"${winnerSel === 'home' ? ' selected' : ''}>← ${teamName(r.home)}</option>
        <option value="away"${winnerSel === 'away' ? ' selected' : ''}>${teamName(r.away)} →</option>
      </select>
      <button class="admin-save-btn" onclick="saveKoReal('${m.id}')">Guardar</button>
    </div>
    <div class="admin-status ${data.winner ? 'finished' : 'pending'}" id="ko-status-${m.id}">
      ${data.winner ? '✓ ' + teamName(data.winner) : 'Pendiente'}
    </div>`;
  return row;
}

// ── Navegación con teclado en el panel de admin ──────────
// Enter (y, en escritorio, escribir) salta a la siguiente casilla de marcador.
const IS_TOUCH_ADMIN = (typeof window !== 'undefined') &&
  (window.matchMedia ? window.matchMedia('(pointer: coarse)').matches : ('ontouchstart' in window));
function focusNextAdminInput(el) {
  const all = Array.from(document.querySelectorAll('#admin-panel .admin-score-input'))
    .filter(i => i.offsetParent !== null); // solo las visibles (pestaña activa)
  const i = all.indexOf(el);
  if (i >= 0 && i < all.length - 1) {
    const n = all[i + 1];
    try { n.focus(); } catch (_) {}
    try { if (n.select) n.select(); } catch (_) {}
  }
}
(function wireAdminKeyboard() {
  const panel = document.getElementById('admin-panel');
  if (!panel) return;
  panel.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    const el = e.target;
    if (!el.classList || !el.classList.contains('admin-score-input')) return;
    e.preventDefault();
    focusNextAdminInput(el);
  });
  panel.addEventListener('focusin', e => {
    const el = e.target;
    if (el.classList && el.classList.contains('admin-score-input')) { try { if (el.select) el.select(); } catch (_) {} }
  });
})();

async function saveKoReal(matchId) {
  const r = realBr.resolved[matchId] || {};
  if (!r.home || !r.away) { alert('Los equipos de este partido aún no están determinados.'); return; }
  const ghVal = document.getElementById(`ko-gh-${matchId}`).value;
  const gaVal = document.getElementById(`ko-ga-${matchId}`).value;
  const winSel = document.getElementById(`ko-win-${matchId}`).value;

  if (ghVal === '' || gaVal === '') { alert('Introduce el marcador.'); return; }
  const gh = parseInt(ghVal, 10), ga = parseInt(gaVal, 10);
  if (isNaN(gh) || isNaN(ga) || gh < 0 || ga < 0) { alert('Marcador inválido.'); return; }

  // Si no es empate, el ganador se deduce del marcador. Si es empate, hace falta el selector.
  let winner = '';
  if (gh !== ga) winner = gh > ga ? r.home : r.away;
  else if (winSel === 'home') winner = r.home;
  else if (winSel === 'away') winner = r.away;
  if (gh === ga && !winner) { alert('Empate: elige quién pasa en penaltis.'); return; }

  try {
    await api.saveKnockoutReal({ matchId, home: r.home, away: r.away, gh, ga, winner });
    koReal[matchId] = { gh, ga, winner };
    recomputeRealBr();   // el ganador define la siguiente ronda
    buildAdminKoUI();    // refresca para mostrar los nuevos equipos
  } catch (err) {
    alert('Error al guardar: ' + err.message);
    console.error(err);
  }
}
