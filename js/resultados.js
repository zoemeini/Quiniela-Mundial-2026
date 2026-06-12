// Feed de resultados ya jugados + quién acertó (puntos de cada jugador).
// Se puede ver sin problema: el partido ya ha terminado.
const me = localStorage.getItem('wc2026_username');
if (me) document.getElementById('username-display').textContent = me;

let byUser = {}, results = {}, koReal = {}, realBr = { complete: false, resolved: {} };

function resultFor(matchId) {
  if (matchId[0] !== 'M') {
    const r = results[matchId];
    return (r && r.status === 'finished') ? { home: r.home, away: r.away } : null;
  }
  const kr = koReal[matchId];
  if (kr && kr.gh !== '' && kr.gh != null && kr.ga !== '' && kr.ga != null) return { home: Number(kr.gh), away: Number(kr.ga) };
  return null;
}
function teamsFor(m) {
  if (m.id[0] !== 'M') return { home: m.home, away: m.away };
  const r = realBr.resolved[m.id] || {};
  return { home: r.home, away: r.away };
}

let resRendered = false;
function applyRes(data) {
    byUser = {};
    (data.predictions || []).forEach(p => { (byUser[p.user] = byUser[p.user] || {})[p.matchId] = { home: p.home, away: p.away }; });
    results = {}; (data.results || []).forEach(r => { results[r.matchId] = r; });
    koReal = {}; (data.knockoutReal || []).forEach(k => { koReal[k.matchId] = { winner: k.winner || '', gh: k.gh, ga: k.ga }; });
    const gr = {}; MATCHES.forEach(m => { const r = resultFor(m.id); if (r) gr[m.id] = { home: r.home, away: r.away }; });
    realBr = realKnockout(gr, koReal);

    const players = Object.keys(byUser);
    const finished = allMatches().map(m => ({ m, res: resultFor(m.id) })).filter(x => x.res)
      .sort((a, b) => new Date(b.m.kickoff) - new Date(a.m.kickoff)); // más recientes primero
    render(finished, players);
    resRendered = true;
}

async function load() {
  try {
    applyRes(await api.getAll());
  } catch (err) {
    if (!resRendered) document.getElementById('res-subtitle').textContent = 'No se pudieron cargar los resultados. Revisa tu conexión.';
    console.error(err);
  }
}

function nameList(arr) {
  return arr.map(u => u === me ? `<b>${escHtml(u)}</b>` : escHtml(u)).join(', ');
}

function render(finished, players) {
  const subtitle = document.getElementById('res-subtitle');
  const body = document.getElementById('res-body');
  if (finished.length === 0) {
    subtitle.textContent = 'Aún no se ha jugado ningún partido.';
    body.innerHTML = '<div class="lb-loading">Aquí verás los resultados y quién acertó en cuanto empiece el torneo. ⚽</div>';
    return;
  }
  subtitle.textContent = `${finished.length} partido${finished.length > 1 ? 's' : ''} jugado${finished.length > 1 ? 's' : ''} · más recientes primero`;
  body.innerHTML = '';
  finished.forEach(({ m, res }) => {
    const t = teamsFor(m);
    if (!t.home || !t.away) return;
    const result = { home: res.home, away: res.away, status: 'finished' };
    const exact = [], outcome = [];
    players.forEach(u => {
      const pred = byUser[u][m.id] || { home: 0, away: 0 };
      const pts = calculatePoints(pred, result);
      if (pts === 5) exact.push(u); else if (pts === 3) outcome.push(u);
    });
    const k = formatKickoff(m.kickoff);
    const isKo = m.id[0] === 'M';
    const label = isKo ? ((KO_ROUNDS.find(r => r.key === m.round) || {}).short || 'Eliminatoria')
                       : ('Grupo ' + m.group);
    const labelColor = isKo ? 'var(--gold)' : groupColor(m.group);
    body.insertAdjacentHTML('beforeend', `
      <div class="res-card" data-mid="${m.id}">
        <div class="res-head">
          <span class="res-tag" style="color:${labelColor};border-color:${labelColor};background:${isKo ? 'var(--gold-dim)' : groupColor(m.group) + '22'}">${label}</span>
          <span class="res-date">${k.date} · ${k.time}</span>
        </div>
        <div class="res-score">
          <span class="res-team home">${teamFlag(t.home)} <span>${teamName(t.home)}</span></span>
          <span class="res-num">${res.home} – ${res.away}</span>
          <span class="res-team away"><span>${teamName(t.away)}</span> ${teamFlag(t.away)}</span>
        </div>
        <div class="res-aciertos">
          ${exact.length ? `<div class="res-line"><span class="badge badge-green">⭐ +5</span> ${nameList(exact)}</div>` : ''}
          ${outcome.length ? `<div class="res-line"><span class="badge badge-gold">✓ +3</span> ${nameList(outcome)}</div>` : ''}
          ${(!exact.length && !outcome.length) ? `<div class="res-line res-none">Nadie acertó 😬</div>` : ''}
        </div>
        <div class="mc-seepreds">👁️ Ver qué puso cada uno ›</div>
      </div>`);
  });
}

function escHtml(s) { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

// ── Modal: qué puso cada uno en un partido (datos ya cargados en byUser) ──
function mpMatch(id) { return (typeof getMatchById === 'function' && getMatchById(id)) || (typeof getKoMatch === 'function' && getKoMatch(id)) || null; }
function openMatchPredictions(matchId) {
  const m = mpMatch(matchId); if (!m) return;
  const t = teamsFor(m); if (!t.home || !t.away) return;
  const result = resultFor(matchId);
  const scoreStr = result ? `<b>${result.home}–${result.away}</b>` : '<span class="mpred-vs">vs</span>';
  document.getElementById('match-preds-title').innerHTML =
    `${teamFlag(t.home)} ${teamName(t.home)} ${scoreStr} ${teamName(t.away)} ${teamFlag(t.away)}`;
  const rows = Object.keys(byUser).map(u => {
    const pred = byUser[u][matchId] || null;
    const pts = result ? calculatePoints(pred || { home: 0, away: 0 }, { home: result.home, away: result.away, status: 'finished' }) : null;
    return { user: u, pred, pts };
  });
  if (result) rows.sort((a, b) => b.pts - a.pts || a.user.localeCompare(b.user));
  else rows.sort((a, b) => a.user.localeCompare(b.user));
  const badge = pts => pts === 5 ? '<span class="badge badge-green">⭐ +5</span>'
                     : pts === 3 ? '<span class="badge badge-gold">✓ +3</span>'
                     : '<span class="badge badge-red">+0</span>';
  const sub = result ? 'Lo que puso cada uno · más puntos primero' : 'Aún sin resultado';
  const list = rows.length ? rows.map(r => {
    const isMe = r.user === me;
    const score = r.pred ? `${r.pred.home}–${r.pred.away}` : '<span class="mpred-none">sin pronóstico</span>';
    return `<div class="mpred-row${isMe ? ' me' : ''}"><span class="mpred-name">${escHtml(r.user)}${isMe ? ' (tú)' : ''}</span><span class="mpred-pred">${score}</span><span class="mpred-pts">${result ? badge(r.pts) : ''}</span></div>`;
  }).join('') : '<div class="mpred-sub" style="text-align:center">Nadie ha hecho pronósticos.</div>';
  document.getElementById('match-preds-body').innerHTML = `<div class="mpred-sub">${sub}</div><div class="mpred-list">${list}</div>`;
  document.getElementById('match-preds-modal').classList.remove('hidden');
}
function closeMatchPredsModal() { document.getElementById('match-preds-modal').classList.add('hidden'); }
document.getElementById('res-body').addEventListener('click', e => {
  const card = e.target.closest('.res-card[data-mid]');
  if (card) openMatchPredictions(card.dataset.mid);
});
document.getElementById('match-preds-close').addEventListener('click', closeMatchPredsModal);
document.getElementById('match-preds-modal').addEventListener('click', e => { if (e.target.id === 'match-preds-modal') closeMatchPredsModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMatchPredsModal(); });

// Pinta al instante lo último guardado (si hay) y luego refresca de verdad.
const resCached = CacheStore.get('getAll');
if (resCached) { try { applyRes(resCached); } catch (_) {} }
load();
setInterval(load, 60000);
