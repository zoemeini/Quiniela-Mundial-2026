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

let initialized = false, predRendered = false;
function applyPred(data) {
    const subtitle = document.getElementById('pred-subtitle');
    document.getElementById('pred-locked').classList.add('hidden');
    allPreds = {};
    (data.predictions || []).forEach(p => { (allPreds[p.user] = allPreds[p.user] || {})[p.matchId] = { home: p.home, away: p.away }; });
    results = {}; (data.results || []).forEach(r => { results[r.matchId] = r; });
    koReal = {}; (data.knockoutReal || []).forEach(k => { koReal[k.matchId] = { winner: k.winner || '', gh: k.gh, ga: k.ga, home: k.home || '', away: k.away || '' }; });
    const gr = {}; MATCHES.forEach(m => { const r = resultFor(m.id); if (r) gr[m.id] = { home: r.home, away: r.away }; });
    realBr = realKnockout(gr, koReal);

    const players = Object.keys(allPreds).sort((a, b) => a.localeCompare(b));
    if (players.length === 0) { subtitle.textContent = 'Todavía no hay predicciones.'; predRendered = true; return; }

    subtitle.textContent = 'El pronóstico de cada partido se revela en cuanto empieza ese partido · solo lectura';
    document.getElementById('pred-content').classList.remove('hidden');
    const sel = document.getElementById('pred-player');
    const prev = sel.value;
    sel.innerHTML = players.map(p => `<option value="${escAttr(p)}">${escHtml(p)}</option>`).join('');
    if (!initialized) {
      // ?u=Nombre (al pulsar un jugador en la clasificación) tiene prioridad; si no, tú.
      const wanted = new URLSearchParams(location.search).get('u');
      sel.value = (wanted && players.includes(wanted)) ? wanted
                : (me && players.includes(me)) ? me : players[0];
      sel.addEventListener('change', () => renderPlayer(sel.value));
      initialized = true;
    } else if (players.includes(prev)) {
      sel.value = prev; // conserva tu selección en los refrescos automáticos
    }
    renderPlayer(sel.value);
    predRendered = true;
}

async function load() {
  RefreshUI.set('loading');
  try {
    applyPred(await api.getAll());
    RefreshUI.set('ok');
  } catch (err) {
    if (!predRendered) document.getElementById('pred-subtitle').textContent = 'No se pudieron cargar las predicciones. Revisa tu conexión.';
    RefreshUI.set('error');
    console.error(err);
  }
}

// Color del marcador según el acierto (solo cuando ya hay resultado real):
// verde = marcador exacto · amarillo = acertó quién gana/pasa pero no el marcador · rojo = falló.
function matchLine(matchId, homeTeam, awayTeam, preds) {
  const started = startedById(matchId);
  const pred = preds[matchId];
  const real = resultFor(matchId);
  let mid;
  if (!started) {
    mid = `<span class="pred-score locked">🔒</span>`;
  } else {
    const penPick = isKoId(matchId) && preds[matchId + 'P'] ? teamByIndex(preds[matchId + 'P'].home) : null;
    const eff = pred || { home: 0, away: 0 };
    let cls = '';
    if (real) {
      const res = { home: real.home, away: real.away, status: 'finished' };
      let rw = null, kh = null, ka = null;
      if (isKoId(matchId)) { const rb = realBr.resolved[matchId]; if (rb) { rw = rb.winner; kh = rb.home; ka = rb.away; } }
      const top = isKoId(matchId) ? koMaxPoints() : GROUP_POINTS.exact;
      const pts = pointsFor(matchId, eff, res, penPick, rw, kh, ka);
      cls = pts === top ? ' ps-exact' : (pts > 0 ? ' ps-outcome' : ' ps-miss'); // verde=pleno · amarillo=parcial · rojo=fallo
    }
    if (pred) {
      mid = `<span class="pred-score${cls}">${pred.home} – ${pred.away}</span>`;
    } else {
      mid = `<span class="pred-score${cls}">0 – 0 <span class="pred-unsent">(sin enviar)</span></span>`;
    }
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

// Estadísticas del jugador HASTA EL MOMENTO (solo partidos con resultado real).
function playerStats(user) {
  const preds = allPreds[user] || {};
  let played = 0, outcome = 0, exact = 0;
  allMatches().forEach(m => {
    const real = resultFor(m.id); if (!real) return;
    played++;
    const pred = preds[m.id] || { home: 0, away: 0 }; // sin enviar = 0–0
    const res = { home: real.home, away: real.away, status: 'finished' };
    let pp = null, rw = null, kh = null, ka = null;
    if (isKoId(m.id)) { const x = preds[m.id + 'P']; pp = x ? teamByIndex(x.home) : null; const rb = realBr.resolved[m.id]; if (rb) { rw = rb.winner; kh = rb.home; ka = rb.away; } }
    if (pointsFor(m.id, pred, res, pp, rw, kh, ka) > 0) outcome++; // acertó quién pasa (incluye exactos)
    if (isExactHit(pred, res)) exact++;            // marcador exacto = estrella
  });
  return { played, outcome, exact };
}
function statsBannerHTML(user) {
  const s = playerStats(user);
  if (!s.played) return ''; // todavía no hay partidos jugados
  const pct = Math.round((s.outcome / s.played) * 100);
  return `<div class="pred-stats">
    <div class="pred-stat"><span class="pred-stat-num">${pct}%</span><span class="pred-stat-lbl">🎯 acierto de vencedor</span></div>
    <div class="pred-stat"><span class="pred-stat-num">${s.exact}/${s.played}</span><span class="pred-stat-lbl">⭐ marcadores exactos</span></div>
  </div>`;
}

// Apuesta de la final: oculta (🔒) hasta el cierre del lunes; luego se revela.
function finalBetBlockHTML(user) {
  const revealed = matchLocked(SP_FINAL_DEADLINE);
  const fin = (allPreds[user] || {})['SP_FINALISTS'];
  const sc = (allPreds[user] || {})['SP_FINAL'];
  let body;
  if (!revealed) {
    body = `<div class="fb-none">🔒 Se revela cuando se cierre (lun 15 jun · 23:59)</div>`;
  } else if (fin) {
    const tA = teamByIndex(fin.home), tB = teamByIndex(fin.away);
    if (tA && tB) {
      const pens = (allPreds[user] || {})['SP_FINAL_PENS'];
      let champ = null, viaPens = false;
      if (sc) {
        if (sc.home > sc.away) champ = tA;
        else if (sc.away > sc.home) champ = tB;
        else if (pens) { champ = teamByIndex(pens.home); viaPens = true; }
      }
      body = `<div class="fb-locked-pick">
          <span class="fb-team">${teamFlag(tA)} ${teamName(tA)}</span>
          <span class="fb-score">${sc ? sc.home + ' – ' + sc.away : '–'}</span>
          <span class="fb-team">${teamName(tB)} ${teamFlag(tB)}</span>
        </div>${champ ? `<div class="fb-champ">🏆 Campeón: <b>${teamName(champ)}</b>${viaPens ? ' <span class="fb-pen-tag">🥅 en penaltis</span>' : ''}</div>` : ''}`;
    } else body = `<div class="fb-none">Apuesta no válida</div>`;
  } else {
    body = `<div class="fb-none">No hizo su apuesta de la final 😕</div>`;
  }
  return `<div class="final-bet-card"><div class="fb-head">🏆 Apuesta de la final</div>${body}</div>`;
}

function renderPlayer(user) {
  const preds = allPreds[user] || {};
  const view = document.getElementById('pred-view');
  const legend = `<div class="pred-legend">
    <span class="pl-item"><span class="pl-dot ps-exact"></span>Acierto pleno</span>
    <span class="pl-item"><span class="pl-dot ps-outcome"></span>Acierto parcial</span>
    <span class="pl-item"><span class="pl-dot ps-miss"></span>Falló</span>
  </div>`;
  let html = statsBannerHTML(user) + finalBetBlockHTML(user) + legend + '<h3 class="pred-section-title">⚽ Fase de grupos</h3>';
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

// Barra de estado + botón 🔄 (para que en el móvil no se queden datos viejos).
RefreshUI.mount(document.getElementById('pred-subtitle'), load);
// Pinta al instante lo último guardado (si hay) y luego refresca de verdad.
const predCached = CacheStore.get('getAll');
if (predCached) { try { applyPred(predCached); RefreshUI.set('cache'); } catch (_) {} }
load();
setInterval(load, 60000); // refresca datos y revela los partidos en cuanto empiezan
