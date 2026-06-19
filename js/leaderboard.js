const me = localStorage.getItem('wc2026_username');
if (me) document.getElementById('username-display').textContent = me;

// ── OG = la porra original (lista fija). Quien se una después = "invitados". ──
const WC_FRIENDS = ['Zoesita', 'cacota', 'Real Bertis', 'Nai', 'Vicky', 'EricYamal', 'oscar', 'Mariona', 'Joan', 'Guillem', 'Jon Aritz', 'saracarbonero', 'TontoAQuienLeGaneElDummy', 'Cacu', 'Alex Martos', 'Piti Alonso', 'ikerxu', 'Jontxu', 'erikaso', 'Clara', 'Belenchu', 'Jordi Alba', 'Roger'];
function normName(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim(); }
const FRIEND_SET = new Set(WC_FRIENDS.map(normName));
const isFriend = u => FRIEND_SET.has(normName(u));
let lbTab = 'friends';   // pestaña activa: 'friends' (OG) | 'others' (invitados)
let lastRows = null;     // últimas filas calculadas (para repintar al cambiar de pestaña)

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

    // Apuesta de la final: equipos reales del cuadro + marcador real de la final.
    const koReal = {};
    (data.knockoutReal || []).forEach(k => { koReal[k.matchId] = { winner: k.winner || '', gh: k.gh, ga: k.ga }; });
    const grp = {}; MATCHES.forEach(m => { if (realResults[m.id]) grp[m.id] = realResults[m.id]; });
    const realBr = (typeof realKnockout === 'function') ? realKnockout(grp, koReal) : { resolved: {} };
    const realFinal = realBr.resolved['M104'] || {};        // finalistas reales (cuando se sepan)
    const realFinalScore = realResults['M104'] || null;      // marcador real de la final
    // Campeón real: el ganador que registra el admin (incluye penaltis); si no,
    // se deduce del marcador. Así un empate resuelto en penaltis tiene campeón.
    const realChampion = (realFinal.home && realFinal.away)
      ? (realFinal.winner
        || (realFinalScore ? (realFinalScore.home > realFinalScore.away ? realFinal.home
          : (realFinalScore.away > realFinalScore.home ? realFinal.away : null)) : null)) : null;
    // Puntos de la apuesta: +10 por finalista · +10 campeón · +20 marcador exacto (máx 50).
    function finalPoints(sp) {
      const fin = sp['SP_FINALISTS']; if (!fin || !realFinal.home || !realFinal.away) return 0;
      const tA = teamByIndex(fin.home), tB = teamByIndex(fin.away);
      const real = [realFinal.home, realFinal.away];
      let pts = 0, fc = 0;
      if (tA && real.indexOf(tA) >= 0) fc++;
      if (tB && tB !== tA && real.indexOf(tB) >= 0) fc++;
      pts += fc * 10;
      const scp = sp['SP_FINAL'];
      if (realFinalScore && realChampion) {
        // Empate en el marcador → campeón = finalista elegido en penaltis (SP_FINAL_PENS).
        const pens = sp['SP_FINAL_PENS'];
        const myChamp = scp ? (scp.home > scp.away ? tA
          : (scp.away > scp.home ? tB
            : (pens ? teamByIndex(pens.home) : null))) : null;
        if (myChamp && myChamp === realChampion) pts += 10;
      }
      if (realFinalScore && scp && fc === 2) {
        const goals = {}; goals[tA] = scp.home; goals[tB] = scp.away;
        if (goals[realFinal.home] === realFinalScore.home && goals[realFinal.away] === realFinalScore.away) pts += 20;
      }
      return pts;
    }

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
      const spPts = finalPoints(byUser[user]); // apuesta de la final (0 hasta que se juegue)
      return { user, group: g, ko, total: g + ko + spPts, exact };
    });

    rows.sort((a, b) => b.total - a.total || b.exact - a.exact || a.user.localeCompare(b.user));
    renderLeaderboard(rows, playedGroup, playedKo);
    lbRendered = true;
}

async function loadLeaderboard() {
  RefreshUI.set('loading');
  try {
    applyLeaderboard(await api.getAll());
    RefreshUI.set('ok');
  } catch (err) {
    if (!lbRendered) {
      document.getElementById('lb-body').innerHTML =
        `<div class="lb-loading" style="color:var(--red)">No se pudieron cargar los datos. Revisa tu conexión e inténtalo de nuevo.</div>`;
    }
    RefreshUI.set('error');
    console.error(err);
  }
}

function renderLeaderboard(rows, playedGroup, playedKo) {
  lastRows = rows;
  const subtitle = document.getElementById('lb-subtitle');
  const total = playedGroup + playedKo;
  if (total === 0) {
    subtitle.textContent = 'El torneo aún no ha empezado — los puntos aparecen al jugarse los partidos.';
  } else {
    subtitle.textContent = `${playedGroup} de ${MATCHES.length} partidos de grupos`
      + (playedKo > 0 ? ` · ${playedKo} de ${KO_MATCHES.length} de eliminatorias` : '') + ' jugados';
  }
  paintTab();
}

// Pinta la pestaña activa (Mis amigos / Los demás), con su propio ranking.
function paintTab() {
  const rows = lastRows || [];
  const friends = rows.filter(r => isFriend(r.user));
  const others = rows.filter(r => !isFriend(r.user));
  const fb = document.querySelector('[data-lbtab="friends"]'), ob = document.querySelector('[data-lbtab="others"]');
  if (fb) { fb.innerHTML = `👑 Ranking de los OG <span class="tab-check">${friends.length}</span>`; fb.classList.toggle('active', lbTab === 'friends'); }
  if (ob) { ob.innerHTML = `🎟️ Ranking de los invitados <span class="tab-check">${others.length}</span>`; ob.classList.toggle('active', lbTab === 'others'); }
  renderRows(lbTab === 'friends' ? friends : others);
}

function renderRows(rows) {
  const rankIcons = ['🥇', '🥈', '🥉'];
  const body = document.getElementById('lb-body');
  body.innerHTML = '';
  if (rows.length === 0) {
    body.innerHTML = lbTab === 'friends'
      ? '<div class="lb-loading">Todavía ningún OG ha pronosticado.</div>'
      : '<div class="lb-loading">Todavía no se ha unido ningún invitado. 🌱</div>';
    return;
  }
  // Empates: misma posición solo si coinciden PUNTOS y ESTRELLAS (las estrellas
  // desempatan los puntos). Numeración correlativa, sin saltos.
  let rank = 0, prevKey = null;
  rows.forEach((row) => {
    const key = row.total + '|' + row.exact;
    if (prevKey === null || key !== prevKey) { rank++; prevKey = key; }
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

// Cambio de pestaña (Ranking de los OG / invitados): repinta al instante sin recargar.
const lbTabsEl = document.getElementById('lb-tabs');
if (lbTabsEl) lbTabsEl.addEventListener('click', e => {
  const b = e.target.closest('[data-lbtab]'); if (!b) return;
  lbTab = b.dataset.lbtab; paintTab();
});

// Barra de estado + botón 🔄 (para que en el móvil no se queden datos viejos).
RefreshUI.mount(document.getElementById('lb-subtitle'), loadLeaderboard);
// Pinta al instante lo último guardado (si hay) y luego refresca de verdad.
const lbCached = CacheStore.get('getAll');
if (lbCached) { try { applyLeaderboard(lbCached); RefreshUI.set('cache'); } catch (_) {} }
loadLeaderboard();
setInterval(loadLeaderboard, 30000);
