// Vista de SOLO LECTURA de las predicciones de todos los jugadores.
// Se desbloquea cuando se cierran los pronósticos (PREDICTION_DEADLINE).
// Nadie puede modificar nada aquí.

const me = localStorage.getItem('wc2026_username');
if (me) document.getElementById('username-display').textContent = me;

const isLocked = () => Date.now() >= PREDICTION_DEADLINE.getTime();

let allPreds = {};   // { user: { matchId: {home,away} } }
let allPicks = {};   // { user: { koMatchId: team } }
let allKoScores = {}; // { user: { koMatchId: {home,away} } }

async function load() {
  const subtitle = document.getElementById('pred-subtitle');
  const locked   = document.getElementById('pred-locked');
  const content  = document.getElementById('pred-content');

  // Antes del cierre: bloqueado para que nadie copie.
  if (!isLocked()) {
    const d = PREDICTION_DEADLINE.toLocaleString('es-ES', {
      timeZone: 'Europe/Madrid', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
    });
    subtitle.textContent = `Disponible cuando se cierren los pronósticos (${d}).`;
    locked.classList.remove('hidden');
    content.classList.add('hidden');
    return;
  }

  try {
    const data = await api.getAll();
    allPreds = {}; allPicks = {}; allKoScores = {};
    (data.predictions || []).forEach(p => {
      (allPreds[p.user] = allPreds[p.user] || {})[p.matchId] = { home: p.home, away: p.away };
    });
    (data.bracket || []).forEach(b => {
      if (!allPicks[b.user]) { allPicks[b.user] = {}; allKoScores[b.user] = {}; }
      if (b.team) allPicks[b.user][b.matchId] = b.team;
      if (b.home !== '' && b.away !== '' && b.home != null && b.away != null) {
        allKoScores[b.user][b.matchId] = { home: Number(b.home), away: Number(b.away) };
      }
    });

    const players = Object.keys(allPreds).sort((a, b) => a.localeCompare(b));
    if (players.length === 0) {
      subtitle.textContent = 'Todavía no hay predicciones.';
      return;
    }

    subtitle.textContent = `${players.length} jugador${players.length === 1 ? '' : 'es'} · solo lectura`;
    locked.classList.add('hidden');
    content.classList.remove('hidden');

    const sel = document.getElementById('pred-player');
    sel.innerHTML = players.map(p => `<option value="${escAttr(p)}">${escHtml(p)}</option>`).join('');
    // Por defecto, muéstrate a ti mismo si estás en la lista.
    if (me && players.includes(me)) sel.value = me;
    sel.addEventListener('change', () => renderPlayer(sel.value));
    renderPlayer(sel.value);
  } catch (err) {
    subtitle.textContent = 'No se pudieron cargar las predicciones. Revisa SHEET_API_URL.';
    console.error(err);
  }
}

function renderPlayer(username) {
  const preds = allPreds[username] || {};
  const picks = allPicks[username] || {};
  const koScores = allKoScores[username] || {};
  const view = document.getElementById('pred-view');
  view.innerHTML = renderGroups(preds) + renderBracket(preds, picks, koScores);
}

function renderGroups(preds) {
  let html = '<h3 class="pred-section-title">⚽ Fase de grupos</h3>';
  GROUPS.forEach(g => {
    html += `<div class="pred-group"><div class="admin-group-title">Grupo ${g}</div>`;
    getMatchesByGroup(g).forEach(m => {
      const p = preds[m.id];
      const score = p ? `${p.home} – ${p.away}` : '— – —';
      html += matchRow(m.home, m.away, score, '', '');
    });
    html += `</div>`;
  });
  return html;
}

function renderBracket(preds, picks, koScores) {
  let html = '<h3 class="pred-section-title">🏆 Eliminatorias</h3>';
  const ub = buildUserBracket(preds, picks);
  if (!ub.complete) {
    return html + '<p class="ko-intro">Este jugador no completó los 72 pronósticos de grupos, así que todavía no tiene cuadro.</p>';
  }
  KO_ROUNDS.forEach(round => {
    html += `<div class="pred-group"><div class="admin-group-title">${round.name}</div>`;
    getKoMatchesByRound(round.key).forEach(m => {
      const r = ub.resolved[m.id] || {};
      if (!r.home || !r.away) {
        html += `<div class="pred-match"><span class="tbd-text">Por determinar</span></div>`;
        return;
      }
      const s = koScores[m.id];
      const score = s ? `${s.home} – ${s.away}` : 'vs';
      const hw = r.winner === r.home ? 'winner' : '';
      const aw = r.winner === r.away ? 'winner' : '';
      html += matchRow(r.home, r.away, score, hw, aw);
    });
    html += `</div>`;
  });
  const champ = (ub.resolved['M104'] || {}).winner;
  if (champ) {
    html += `<div class="pred-champion">🏆 Campeón: ${teamFlag(champ)} <b>${teamName(champ)}</b></div>`;
  }
  return html;
}

function matchRow(home, away, score, homeCls, awayCls) {
  return `<div class="pred-match">
    <span class="pred-team home ${homeCls}">${teamFlag(home)} <span>${teamName(home)}</span></span>
    <span class="pred-score">${score}</span>
    <span class="pred-team away ${awayCls}">${teamName(away)} ${teamFlag(away)}</span>
  </div>`;
}

function escHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function escAttr(s) { return escHtml(s); }

load();
