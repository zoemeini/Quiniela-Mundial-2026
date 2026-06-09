const me = localStorage.getItem('wc2026_username');
if (me) document.getElementById('username-display').textContent = me;

let lbRendered = false;
function applyLeaderboard(data) {
    // Resultados reales por partido (grupos + eliminatorias).
    const realResults = {};
    (data.results || []).forEach(r => {
      if (r.status === 'finished') realResults[r.matchId] = { home: r.home, away: r.away };
    });
    (data.knockoutReal || []).forEach(k => {
      if (k.gh !== '' && k.gh != null && k.ga !== '' && k.ga != null) {
        realResults[k.matchId] = { home: Number(k.gh), away: Number(k.ga) };
      }
    });
    const playedGroup = MATCHES.filter(m => realResults[m.id]).length;
    const playedKo    = KO_MATCHES.filter(m => realResults[m.id]).length;

    // Pronósticos por jugador.
    const byUser = {};
    (data.predictions || []).forEach(p => {
      (byUser[p.user] = byUser[p.user] || {})[p.matchId] = { home: p.home, away: p.away };
    });
    const players = Object.keys(byUser);
    if (players.length === 0) { renderEmpty(); lbRendered = true; return; }

    const rows = players.map(user => {
      let g = 0, ko = 0, exact = 0;
      allMatches().forEach(m => {
        const res = realResults[m.id];
        if (!res) return;
        const result = { home: res.home, away: res.away, status: 'finished' };
        const pred = byUser[user][m.id] || { home: 0, away: 0 }; // no enviado = 0–0
        const pts = calculatePoints(pred, result);
        if (m.id[0] === 'M') ko += pts; else g += pts;
        if (pts === 5) exact++;
      });
      return { user, group: g, ko, total: g + ko, exact };
    });

    rows.sort((a, b) => b.total - a.total || b.exact - a.exact || a.user.localeCompare(b.user));
    renderLeaderboard(rows, playedGroup, playedKo);
    lbRendered = true;
}

async function loadLeaderboard() {
  try {
    applyLeaderboard(await api.getAll());
  } catch (err) {
    if (!lbRendered) {
      document.getElementById('lb-body').innerHTML =
        `<div class="lb-loading" style="color:var(--red)">No se pudieron cargar los datos. Revisa tu conexión e inténtalo de nuevo.</div>`;
    }
    console.error(err);
  }
}

function renderLeaderboard(rows, playedGroup, playedKo) {
  const subtitle = document.getElementById('lb-subtitle');
  const total = playedGroup + playedKo;
  if (total === 0) {
    subtitle.textContent = 'El torneo aún no ha empezado — los puntos aparecen al jugarse los partidos.';
  } else {
    subtitle.textContent = `${playedGroup} de ${MATCHES.length} partidos de grupos`
      + (playedKo > 0 ? ` · ${playedKo} de ${KO_MATCHES.length} de eliminatorias` : '') + ' jugados';
  }

  const rankIcons = ['🥇', '🥈', '🥉'];
  const body = document.getElementById('lb-body');
  body.innerHTML = '';
  rows.forEach((row, idx) => {
    const rank = idx + 1;
    const isMe = row.user === me;
    const div = document.createElement('div');
    div.className = 'lb-row clickable' + (isMe ? ' me' : '');
    div.title = `Ver los pronósticos de ${row.user}`;
    div.addEventListener('click', () => {
      location.href = 'predicciones.html?u=' + encodeURIComponent(row.user);
    });
    const rankClass = rank <= 3 ? `top-${rank}` : '';
    const rankLabel = rank <= 3 ? rankIcons[rank - 1] : rank;
    div.innerHTML = `
      <div class="lb-rank ${rankClass}">${rankLabel}</div>
      <div class="lb-name">${escHtml(row.user)}${isMe ? ' <span style="font-size:11px;color:var(--muted)">(tú)</span>' : ''}</div>
      <div class="lb-pts">${row.total}</div>
      <div class="lb-num">${row.group}</div>
      <div class="lb-num">${row.ko}</div>
      <div class="lb-num">${row.exact}</div>`;
    body.appendChild(div);
  });
}

function renderEmpty() {
  document.getElementById('lb-subtitle').textContent = 'Aún no hay jugadores — ¡sé el primero en pronosticar!';
  document.getElementById('lb-body').innerHTML =
    '<div class="lb-loading">Aún no hay jugadores. <a href="index.html" style="color:var(--green)">Haz tus pronósticos →</a></div>';
}

function escHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// Pinta al instante lo último guardado (si hay) y luego refresca de verdad.
const lbCached = CacheStore.get('getAll');
if (lbCached) { try { applyLeaderboard(lbCached); } catch (_) {} }
loadLeaderboard();
setInterval(loadLeaderboard, 30000);
