let results = {};
let koReal  = {};  // { matchId: { home, away, winner } }
const ALL_TEAMS = Object.keys(TEAM_CODES).sort((a, b) => teamName(a).localeCompare(teamName(b)));

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
      koReal[k.matchId] = { home: k.home, away: k.away, gh: k.gh, ga: k.ga, winner: k.winner };
    });
  } catch (err) {
    console.error('initAdmin', err);
    alert('No se pudieron cargar los resultados existentes. Revisa SHEET_API_URL en js/config.js.');
  }
  buildAdminUI();
  buildAdminKoUI();
}

// Sub-conmutador grupos / eliminatorias
document.getElementById('admin-groups-btn').addEventListener('click', () => {
  document.getElementById('admin-groups').classList.remove('hidden');
  document.getElementById('admin-ko').classList.add('hidden');
  document.getElementById('admin-groups-btn').classList.add('active');
  document.getElementById('admin-ko-btn').classList.remove('active');
});
document.getElementById('admin-ko-btn').addEventListener('click', () => {
  document.getElementById('admin-groups').classList.add('hidden');
  document.getElementById('admin-ko').classList.remove('hidden');
  document.getElementById('admin-ko-btn').classList.add('active');
  document.getElementById('admin-groups-btn').classList.remove('active');
});

function buildAdminUI() {
  const container = document.getElementById('admin-groups');
  container.innerHTML = '';

  GROUPS.forEach(group => {
    const section = document.createElement('div');
    section.className = 'admin-group';
    section.innerHTML = `<div class="admin-group-title">Grupo ${group}</div>
                         <div id="admin-grid-${group}"></div>`;
    container.appendChild(section);

    getMatchesByGroup(group).forEach(match => {
      document.getElementById(`admin-grid-${group}`).appendChild(buildAdminMatchRow(match));
    });
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
      <div class="teams">${teamFlag(match.home)} ${teamName(match.home)} vs ${teamName(match.away)} ${teamFlag(match.away)}</div>
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

function teamOptions(selected) {
  let html = `<option value="">— equipo —</option>`;
  ALL_TEAMS.forEach(t => {
    html += `<option value="${t}"${t === selected ? ' selected' : ''}>${teamName(t)}</option>`;
  });
  return html;
}

function buildAdminKoRow(m) {
  const data = koReal[m.id] || { home: '', away: '', gh: '', ga: '', winner: '' };
  const row = document.createElement('div');
  row.className = 'admin-match';
  row.id = `admin-ko-row-${m.id}`;

  const winnerSel = data.winner && data.winner === data.home ? 'home'
                  : data.winner && data.winner === data.away ? 'away' : '';

  row.innerHTML = `
    <div class="admin-match-info" style="min-width:90px">
      <div class="teams">${m.id}</div>
      <div class="date">${KO_ROUNDS.find(r => r.key === m.round).short}</div>
    </div>
    <div class="admin-ko-form">
      <select class="admin-select" id="ko-home-${m.id}">${teamOptions(data.home)}</select>
      <input class="admin-score-input" type="number" min="0" max="20" id="ko-gh-${m.id}" value="${data.gh === '' || data.gh == null ? '' : data.gh}" placeholder="–">
      <span class="score-separator">-</span>
      <input class="admin-score-input" type="number" min="0" max="20" id="ko-ga-${m.id}" value="${data.ga === '' || data.ga == null ? '' : data.ga}" placeholder="–">
      <select class="admin-select" id="ko-away-${m.id}">${teamOptions(data.away)}</select>
      <select class="admin-select" id="ko-win-${m.id}">
        <option value="">¿quién pasa?</option>
        <option value="home"${winnerSel === 'home' ? ' selected' : ''}>← izquierda</option>
        <option value="away"${winnerSel === 'away' ? ' selected' : ''}>derecha →</option>
      </select>
      <button class="admin-save-btn" onclick="saveKoReal('${m.id}')">Guardar</button>
    </div>
    <div class="admin-status ${data.winner ? 'finished' : 'pending'}" id="ko-status-${m.id}">
      ${data.winner ? '✓ ' + teamName(data.winner) : 'Pendiente'}
    </div>`;
  return row;
}

async function saveKoReal(matchId) {
  const home = document.getElementById(`ko-home-${matchId}`).value;
  const away = document.getElementById(`ko-away-${matchId}`).value;
  const ghVal = document.getElementById(`ko-gh-${matchId}`).value;
  const gaVal = document.getElementById(`ko-ga-${matchId}`).value;
  const winSel = document.getElementById(`ko-win-${matchId}`).value;

  if (!home || !away) { alert('Elige ambos equipos.'); return; }
  if (home === away)  { alert('Los dos equipos no pueden ser el mismo.'); return; }

  const gh = ghVal === '' ? '' : parseInt(ghVal, 10);
  const ga = gaVal === '' ? '' : parseInt(gaVal, 10);

  // Si hay marcador no empatado, el ganador se deduce; si no, usa el selector.
  let winner = '';
  if (gh !== '' && ga !== '' && gh !== ga) winner = gh > ga ? home : away;
  else if (winSel === 'home') winner = home;
  else if (winSel === 'away') winner = away;

  try {
    await api.saveKnockoutReal({ matchId, home, away, gh, ga, winner });
    koReal[matchId] = { home, away, gh, ga, winner };
    const statusEl = document.getElementById(`ko-status-${matchId}`);
    statusEl.className = 'admin-status ' + (winner ? 'finished' : 'pending');
    statusEl.textContent = winner ? '✓ ' + teamName(winner) : 'Pendiente';
  } catch (err) {
    alert('Error al guardar: ' + err.message);
    console.error(err);
  }
}
