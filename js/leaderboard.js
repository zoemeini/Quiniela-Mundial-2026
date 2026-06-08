const me = localStorage.getItem('wc2026_username');
if (me) document.getElementById('username-display').textContent = me;

async function loadLeaderboard() {
  try {
    const data = await api.getAll();

    // Resultados de grupos -> mapa
    const results = {};
    (data.results || []).forEach(r => { results[r.matchId] = r; });
    const finishedGroups = Object.keys(results).length;

    // Equipos que han alcanzado realmente cada ronda (para puntuar eliminatorias)
    const realReached = buildRealReached(results, data.knockoutReal || []);
    const koStarted = (data.knockoutReal || []).length > 0;

    // Pronósticos de grupos por jugador
    const preds = {};
    (data.predictions || []).forEach(p => {
      if (!preds[p.user]) preds[p.user] = {};
      preds[p.user][p.matchId] = { home: p.home, away: p.away };
    });
    // Pronósticos de eliminatorias por jugador (equipo que pasa + marcador)
    const picks = {};
    const koScores = {};
    (data.bracket || []).forEach(b => {
      if (!picks[b.user]) { picks[b.user] = {}; koScores[b.user] = {}; }
      if (b.team) picks[b.user][b.matchId] = b.team;
      if (b.home !== '' && b.away !== '' && b.home != null && b.away != null) {
        koScores[b.user][b.matchId] = { home: Number(b.home), away: Number(b.away) };
      }
    });

    // Marcadores reales de eliminatorias (para el bonus de resultado exacto)
    const realKo = {};
    (data.knockoutReal || []).forEach(k => {
      realKo[k.matchId] = { home: k.home, away: k.away, gh: k.gh, ga: k.ga };
    });

    const players = Object.keys(preds);
    if (players.length === 0) { renderEmpty(); return; }

    const rows = players.map(username => {
      const g = computeGroupStats(preds[username], results);
      let ko = 0;
      const ub = buildUserBracket(preds[username], picks[username] || {});
      if (ub.complete) {
        ko = scoreKnockout(ub.resolved, realReached)
           + scoreKoExact(ub.resolved, koScores[username] || {}, realKo);
      }
      return {
        username,
        group: g.points,
        ko: ko,
        total: g.points + ko,
        predictedCount: Object.keys(preds[username]).length,
      };
    });

    rows.sort((a, b) => b.total - a.total || b.ko - a.ko || a.username.localeCompare(b.username));
    renderLeaderboard(rows, finishedGroups, koStarted);
  } catch (err) {
    document.getElementById('lb-body').innerHTML =
      `<div class="lb-loading" style="color:var(--red)">No se pudieron cargar los datos. Revisa SHEET_API_URL en js/config.js.</div>`;
    console.error(err);
  }
}

// ── Puntos de fase de grupos ─────────────────────────────
function computeGroupStats(preds, results) {
  let points = 0;
  Object.entries(preds).forEach(([matchId, pred]) => {
    const result = results[matchId];
    if (!result || result.status !== 'finished') return;
    points += calculatePoints(pred, result);
  });
  return { points };
}

// ── Equipos que realmente alcanzaron cada ronda ──────────
function buildRealReached(results, knockoutReal) {
  const resolvedReal = {};
  KO_MATCHES.forEach(m => { resolvedReal[m.id] = { home: null, away: null, winner: null, loser: null }; });
  knockoutReal.forEach(k => {
    const home = k.home || null, away = k.away || null, winner = k.winner || null;
    const loser = winner ? (winner === home ? away : (winner === away ? home : null)) : null;
    resolvedReal[k.matchId] = { home, away, winner, loser };
  });
  const real = reachedSets(resolvedReal);
  // Si la fase de grupos ya terminó, deriva los 32 clasificados de los resultados.
  const q = realQualifiers(results);
  if (q) real.sets.R32 = q;
  return real;
}

// Bonus por resultado EXACTO de una eliminatoria que ocurre de verdad
// (mismos dos equipos, sin importar quién sea local/visitante).
function scoreKoExact(userResolved, userScores, realKo) {
  let bonus = 0;
  KO_MATCHES.forEach(m => {
    const ur = userResolved[m.id];
    const us = userScores[m.id];
    const rk = realKo[m.id];
    if (!ur || !ur.home || !ur.away) return;
    if (!us || us.home == null || us.away == null) return;
    if (!rk || rk.gh === '' || rk.ga === '' || rk.gh == null || rk.ga == null) return;
    if (!rk.home || !rk.away) return;

    // Mismo emparejamiento (sin orden)
    const samePair = (ur.home === rk.home && ur.away === rk.away) ||
                     (ur.home === rk.away && ur.away === rk.home);
    if (!samePair) return;

    // Goles predichos por equipo vs goles reales por equipo
    const uFor = {}; uFor[ur.home] = us.home; uFor[ur.away] = us.away;
    if (uFor[rk.home] === Number(rk.gh) && uFor[rk.away] === Number(rk.ga)) {
      bonus += KO_POINTS.exact;
    }
  });
  return bonus;
}

function realQualifiers(results) {
  const predsLike = {};
  MATCHES.forEach(m => {
    const r = results[m.id];
    if (r && r.status === 'finished') predsLike[m.id] = { home: r.home, away: r.away };
  });
  const cs = computeStandings(predsLike);
  if (!cs.complete) return null;
  const set = new Set();
  GROUPS.forEach(g => { set.add(cs.standings[g][0]); set.add(cs.standings[g][1]); });
  bestEightThirds(cs.thirds).forEach(g => set.add(cs.standings[g][2]));
  return set;
}

// ── Render ───────────────────────────────────────────────
function renderLeaderboard(rows, finishedGroups, koStarted) {
  const subtitle = document.getElementById('lb-subtitle');
  if (finishedGroups === 0) {
    subtitle.textContent = 'El torneo empieza el 11 de junio — los pronósticos se cierran antes del primer partido';
  } else {
    subtitle.textContent = `${finishedGroups} de ${MATCHES.length} partidos de grupos jugados`
      + (koStarted ? ' · eliminatorias en juego' : '');
  }

  const rankIcons = ['🥇', '🥈', '🥉'];
  const body = document.getElementById('lb-body');
  body.innerHTML = '';

  rows.forEach((row, idx) => {
    const rank = idx + 1;
    const isMe = row.username === me;
    const div = document.createElement('div');
    div.className = 'lb-row' + (isMe ? ' me' : '');

    const rankClass = rank <= 3 ? `top-${rank}` : '';
    const rankLabel = rank <= 3 ? rankIcons[rank - 1] : rank;

    div.innerHTML = `
      <div class="lb-rank ${rankClass}">${rankLabel}</div>
      <div class="lb-name">${escHtml(row.username)}${isMe ? ' <span style="font-size:11px;color:var(--muted)">(tú)</span>' : ''}</div>
      <div class="lb-pts">${row.total}</div>
      <div class="lb-num">${row.group}</div>
      <div class="lb-num">${row.ko}</div>
      <div class="lb-num">${row.predictedCount}</div>`;
    body.appendChild(div);
  });
}

function renderEmpty() {
  document.getElementById('lb-subtitle').textContent = 'Aún no hay jugadores — ¡sé el primero en pronosticar!';
  document.getElementById('lb-body').innerHTML =
    '<div class="lb-loading">Aún no hay jugadores. <a href="index.html" style="color:var(--green)">Haz tus pronósticos →</a></div>';
}

function escHtml(str) {
  return String(str).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

loadLeaderboard();
setInterval(loadLeaderboard, 30000);
