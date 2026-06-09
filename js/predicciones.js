// Vista de SOLO LECTURA de los pronósticos de todos.
// Regla de juego limpio: el pronóstico de un partido SOLO se revela cuando ese
// partido ha empezado. Antes de su hora se muestra 🔒. Nadie modifica nada aquí.

const me = localStorage.getItem('wc2026_username');
if (me) document.getElementById('username-display').textContent = me;

let allPreds = {}, results = {}, koReal = {}, realBr = { complete: false, resolved: {} };

function resultFor(matchId) {
  if (matchId[0] !== 'M') {
    const r = results[matchId];
    return (r && r.status === 'finished') ? { home: r.home, away: r.away } : null;
  }
  const kr = koReal[matchId];
  if (kr && kr.gh !== '' && kr.gh != null && kr.ga !== '' && kr.ga != null) return { home: Number(kr.gh), away: Number(kr.ga) };
  return null;
}
function startedById(matchId) { const m = getMatchById(matchId) || getKoMatch(matchId); return m ? matchLocked(m.kickoff) : false; }

async function load() {
  const subtitle = document.getElementById('pred-subtitle');
  document.getElementById('pred-locked').classList.add('hidden');
  try {
    const data = await api.getAll();
    allPreds = {};
    (data.predictions || []).forEach(p => { (allPreds[p.user] = allPreds[p.user] || {})[p.matchId] = { home: p.home, away: p.away }; });
    results = {}; (data.results || []).forEach(r => { results[r.matchId] = r; });
    koReal = {}; (data.knockoutReal || []).forEach(k => { koReal[k.matchId] = { winner: k.winner || '', gh: k.gh, ga: k.ga }; });
    const gr = {}; MATCHES.forEach(m => { const r = resultFor(m.id); if (r) gr[m.id] = { home: r.home, away: r.away }; });
    realBr = realKnockout(gr, koReal);

    const players = Object.keys(allPreds).sort((a, b) => a.localeCompare(b));
    if (players.length === 0) { subtitle.textContent = 'Todavía no hay predicciones.'; return; }

    subtitle.textContent = 'El pronóstico de cada partido se revela cuando empieza ese partido · solo lectura';
    document.getElementById('pred-content').classList.remove('hidden');
    const sel = document.getElementById('pred-player');
    sel.innerHTML = players.map(p => `<option value="${escAttr(p)}">${escHtml(p)}</option>`).join('');
    // ?u=Nombre (al pulsar un jugador en la clasificación) tiene prioridad; si no, tú.
    const wanted = new URLSearchParams(location.search).get('u');
    if (wanted && players.includes(wanted)) sel.value = wanted;
    else if (me && players.includes(me)) sel.value = me;
    sel.addEventListener('change', () => renderPlayer(sel.value));
    renderPlayer(sel.value);
  } catch (err) {
    subtitle.textContent = 'No se pudieron cargar las predicciones. Revisa SHEET_API_URL.';
    console.error(err);
  }
}

function matchLine(matchId, homeTeam, awayTeam, preds) {
  const started = startedById(matchId);
  const pred = preds[matchId];
  const real = resultFor(matchId);
  let mid;
  if (!started) {
    mid = `<span class="pred-score locked">🔒</span>`;
  } else if (pred) {
    mid = `<span class="pred-score">${pred.home} – ${pred.away}</span>`;
  } else {
    mid = `<span class="pred-score">0 – 0 <span class="pred-unsent">(sin enviar)</span></span>`;
  }
  const realStr = real ? `<div class="pred-real">resultado real: ${real.home} – ${real.away}</div>` : '';
  return `<div class="pred-match-wrap">
    <div class="pred-match">
      <span class="pred-team home">${teamFlag(homeTeam)} <span>${teamName(homeTeam)}</span></span>
      ${mid}
      <span class="pred-team away"><span>${teamName(awayTeam)}</span> ${teamFlag(awayTeam)}</span>
    </div>
    ${realStr}
  </div>`;
}

function renderPlayer(user) {
  const preds = allPreds[user] || {};
  const view = document.getElementById('pred-view');
  let html = '<h3 class="pred-section-title">⚽ Fase de grupos</h3>';
  GROUPS.forEach(g => {
    html += `<div class="pred-group"><div class="admin-group-title">Grupo ${g}</div>`;
    getMatchesByGroup(g).forEach(m => { html += matchLine(m.id, m.home, m.away, preds); });
    html += `</div>`;
  });

  html += '<h3 class="pred-section-title">🏆 Eliminatorias</h3>';
  if (!realBr.complete) {
    html += '<p class="ko-intro">Se mostrarán cuando termine la fase de grupos y se conozcan los clasificados reales.</p>';
  } else {
    KO_ROUNDS.forEach(round => {
      html += `<div class="pred-group"><div class="admin-group-title">${round.name}</div>`;
      getKoMatchesByRound(round.key).forEach(m => {
        const r = realBr.resolved[m.id] || {};
        if (!r.home || !r.away) html += `<div class="pred-match"><span class="tbd-text">Por determinar</span></div>`;
        else html += matchLine(m.id, r.home, r.away, preds);
      });
      html += `</div>`;
    });
  }
  view.innerHTML = html;
}

function escHtml(s) { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function escAttr(s) { return escHtml(s); }

load();
