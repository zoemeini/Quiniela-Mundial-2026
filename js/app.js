// ── Estado ───────────────────────────────────────────────
// Modelo unificado: se pronostica el MARCADOR de cada partido real (grupos y
// eliminatorias). Cada partido se cierra a su hora de inicio. Lo no rellenado
// cuenta como 0–0. Las eliminatorias muestran los equipos REALES por ronda.
let currentUser  = null;
let predictions  = {};   // { matchId: { home, away } }  (grupos + eliminatorias)
let dirty        = {};   // pronósticos escritos pero aún no confirmados en la hoja
let cleared      = {};   // pronósticos borrados (para que no reaparezcan al refrescar)
let results      = {};   // { matchId: { home, away, status } }  (grupos, reales)
let koReal       = {};   // { koMatchId: { winner, gh, ga } }  (eliminatorias, reales)
let realBr       = { complete: false, resolved: {} }; // equipos reales del cuadro
let saveTimers   = {};
let currentPhase = 'groups';
let currentGroupTab = 'upcoming'; // 'upcoming' | dayKey ('2026-06-11') | 'group:C'
let currentKoTab = null; // 'upcoming' | dayKey ('2026-06-28') — pestaña activa de eliminatorias

const lockedM = m => matchLocked(m.kickoff);
const getAnyMatch = id => getMatchById(id) || getKoMatch(id);

// Resultado real de un partido (grupo o eliminatoria), o null si no jugado.
function resultFor(matchId) {
  if (matchId[0] !== 'M') {
    const r = results[matchId];
    return (r && r.status === 'finished') ? { home: r.home, away: r.away, status: 'finished' } : null;
  }
  const kr = koReal[matchId];
  if (kr && kr.gh !== '' && kr.gh != null && kr.ga !== '' && kr.ga != null) {
    return { home: Number(kr.gh), away: Number(kr.ga), status: 'finished' };
  }
  return null;
}

// ── Gestión de usuario ───────────────────────────────────
function loadUser() {
  currentUser = localStorage.getItem('wc2026_username');
  if (!currentUser) document.getElementById('username-modal').classList.remove('hidden');
  else applyUser();
}
function applyUser() {
  document.getElementById('username-display').textContent = currentUser;
  document.getElementById('username-modal').classList.add('hidden');
  // La primera vez, muestra el «¿Cómo funciona?».
  if (!localStorage.getItem('wc2026_help_seen')) {
    localStorage.setItem('wc2026_help_seen', '1');
    setTimeout(showHelp, 400);
  } else if (!localStorage.getItem('wc2026_pin_done')) {
    // Jugadores antiguos (sin PIN aún): ofréceles proteger su usuario para
    // poder entrar desde otro dispositivo. Solo una vez.
    setTimeout(() => openPinModal('secure'), 700);
  }
  // Pinta al instante tus pronósticos guardados (si hay caché) y luego refresca.
  const cached = CacheStore.get('user_' + currentUser);
  if (cached) { try { applyData(cached); } catch (_) {} }
  loadData();
  setInterval(loadData, 60000);
}

// ── ¿Cómo funciona? (modal de ayuda) ─────────────────────
function showHelp() { document.getElementById('help-modal').classList.remove('hidden'); }
function hideHelp() { document.getElementById('help-modal').classList.add('hidden'); }
document.getElementById('help-btn').addEventListener('click', showHelp);
document.getElementById('help-close').addEventListener('click', hideHelp);
document.getElementById('help-modal').addEventListener('click', e => { if (e.target.id === 'help-modal') hideHelp(); });

// ── Aviso de partidos que empiezan pronto sin rellenar ───
function updateNudge() {
  const el = document.getElementById('nudge-banner');
  if (!el) return;
  const now = Date.now(), H = 24 * 3600 * 1000;
  let n = 0;
  const soon = m => !matchLocked(m.kickoff) && !predictions[m.id] && (new Date(m.kickoff).getTime() - now) <= H;
  MATCHES.forEach(m => { if (soon(m)) n++; });
  KO_MATCHES.forEach(m => { const r = realBr.resolved[m.id]; if (r && r.home && r.away && soon(m)) n++; });
  if (n <= 0) { el.classList.add('hidden'); return; }
  el.classList.remove('hidden');
  document.getElementById('nudge-text').textContent =
    `Tienes ${n} partido${n > 1 ? 's' : ''} por rellenar que empieza${n > 1 ? 'n' : ''} pronto (próximas 24 h).`;
}
document.getElementById('nudge-banner').addEventListener('click', () => {
  showPhase('groups');
  renderGroupTab('upcoming');
  const c = document.getElementById('day-content');
  if (c) c.scrollIntoView({ behavior: 'smooth', block: 'start' });
});
// ── Entrar / registrarse con nombre + PIN ────────────────
// Un único formulario sirve para todo:
//   · nombre nuevo → se crea con ese PIN
//   · nombre existente → el PIN debe coincidir (así recuperas tu usuario en
//     otro dispositivo y nadie puede tocar tus pronósticos)
function showAuthError(msg) {
  const el = document.getElementById('username-error');
  el.textContent = msg;
  el.classList.remove('hidden');
}
function authUser() {
  const name = document.getElementById('username-input').value.trim();
  const pin  = document.getElementById('pin-input').value.trim();
  const btn  = document.getElementById('username-submit');
  document.getElementById('username-error').classList.add('hidden');
  if (!name) { showAuthError('Escribe tu nombre.'); return; }
  if (!/^\d{4}$/.test(pin)) { showAuthError('El PIN debe tener 4 cifras (números).'); return; }
  const old = btn.textContent;
  btn.disabled = true; btn.textContent = 'Entrando…';
  api.auth({ user: name, pin })
    .then(resp => {
      currentUser = resp.user || name;
      localStorage.setItem('wc2026_username', currentUser);
      localStorage.setItem('wc2026_pin', pin);
      localStorage.setItem('wc2026_pin_done', '1');
      applyUser();
    })
    .catch(err => {
      const msg = String(err && err.message || '');
      showAuthError(/PIN/.test(msg) ? msg : 'No se pudo entrar ahora mismo. Revisa tu conexión e inténtalo de nuevo.');
      btn.disabled = false; btn.textContent = old;
    });
}
document.getElementById('username-submit').addEventListener('click', authUser);
document.getElementById('username-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('pin-input').focus();
});
document.getElementById('pin-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') authUser();
});

// ── Modal de PIN (proteger / recuperar / ver) ────────────
function openPinModal(mode) {
  const title = document.getElementById('pin-modal-title');
  const text  = document.getElementById('pin-modal-text');
  const row   = document.getElementById('pin-set-row');
  const cancel = document.getElementById('pin-set-cancel');
  document.getElementById('pin-set-error').classList.add('hidden');
  document.getElementById('pin-set-input').value = '';
  const storedPin = localStorage.getItem('wc2026_pin');
  if (mode === 'view' && storedPin) {
    title.textContent = '🔑 Tu PIN';
    text.innerHTML = `Tu PIN es <b style="font-size:1.5em;letter-spacing:4px;color:var(--green)">${storedPin}</b><br><br>Entra con tu nombre <b>${currentUser}</b> y este PIN desde cualquier dispositivo para ver y editar tus pronósticos.`;
    row.classList.add('hidden');
    cancel.textContent = 'Cerrar';
  } else {
    title.textContent = '🔐 Protege tu usuario';
    text.innerHTML = `Crea un <b>PIN de 4 cifras</b> para poder entrar y editar tus pronósticos desde <b>otro dispositivo</b> (móvil, tablet u ordenador). Lo usarás junto a tu nombre <b>${currentUser}</b>.`;
    row.classList.remove('hidden');
    cancel.textContent = 'Ahora no';
  }
  document.getElementById('pin-modal').classList.remove('hidden');
}
function closePinModal() {
  document.getElementById('pin-modal').classList.add('hidden');
  localStorage.setItem('wc2026_pin_done', '1'); // no volver a insistir
}
function submitSetPin() {
  const pin = document.getElementById('pin-set-input').value.trim();
  const err = document.getElementById('pin-set-error');
  const btn = document.getElementById('pin-set-submit');
  err.classList.add('hidden');
  if (!/^\d{4}$/.test(pin)) { err.textContent = 'El PIN debe tener 4 cifras (números).'; err.classList.remove('hidden'); return; }
  const old = btn.textContent;
  btn.disabled = true; btn.textContent = 'Guardando…';
  api.auth({ user: currentUser, pin })
    .then(() => {
      // status 'created' = PIN nuevo · 'login' = ya tenías ese mismo PIN
      localStorage.setItem('wc2026_pin', pin);
      localStorage.setItem('wc2026_pin_done', '1');
      document.getElementById('pin-modal').classList.add('hidden');
      btn.disabled = false; btn.textContent = old;
    })
    .catch(e => {
      const msg = String(e && e.message || '');
      err.textContent = /PIN/.test(msg)
        ? 'Ese nombre ya tiene otro PIN. Si es tuyo, escribe el correcto; si no lo recuerdas, pídeselo al organizador.'
        : 'No se pudo guardar ahora mismo. Inténtalo de nuevo.';
      err.classList.remove('hidden');
      btn.disabled = false; btn.textContent = old;
    });
}
document.getElementById('pin-btn').addEventListener('click', () => {
  openPinModal(localStorage.getItem('wc2026_pin') ? 'view' : 'secure');
});
document.getElementById('pin-set-submit').addEventListener('click', submitSetPin);
document.getElementById('pin-set-input').addEventListener('keydown', e => { if (e.key === 'Enter') submitSetPin(); });
document.getElementById('pin-set-cancel').addEventListener('click', closePinModal);
document.getElementById('pin-modal').addEventListener('click', e => { if (e.target.id === 'pin-modal') closePinModal(); });
// ── Cambiar de nombre (conserva pronósticos y puntos) ────
function openRenameModal() {
  document.getElementById('rename-input').value = currentUser || '';
  document.getElementById('rename-pin').value = localStorage.getItem('wc2026_pin') || '';
  document.getElementById('rename-error').classList.add('hidden');
  document.getElementById('rename-modal').classList.remove('hidden');
  setTimeout(() => { const i = document.getElementById('rename-input'); if (i) { i.focus(); i.select(); } }, 50);
}
function closeRenameModal() { document.getElementById('rename-modal').classList.add('hidden'); }
function submitRename() {
  const newName = document.getElementById('rename-input').value.trim();
  const pin = document.getElementById('rename-pin').value.trim();
  const err = document.getElementById('rename-error');
  const btn = document.getElementById('rename-submit');
  err.classList.add('hidden');
  if (!newName) { err.textContent = 'Escribe el nuevo nombre.'; err.classList.remove('hidden'); return; }
  if (newName === currentUser) { err.textContent = 'Ese ya es tu nombre actual.'; err.classList.remove('hidden'); return; }
  const old = btn.textContent; btn.disabled = true; btn.textContent = 'Guardando…';
  api.rename({ user: currentUser, newName: newName, pin: pin })
    .then(resp => {
      const prev = currentUser;
      currentUser = resp.user || newName;
      localStorage.setItem('wc2026_username', currentUser);
      try { localStorage.removeItem('wc2026_cache_user_' + prev); } catch (_) {}
      document.getElementById('username-display').textContent = currentUser;
      closeRenameModal();
      btn.disabled = false; btn.textContent = old;
      loadData();
    })
    .catch(e => {
      const msg = String(e && e.message || '');
      err.textContent = /PIN|cogido|está|largo|mismo/.test(msg) ? msg : 'No se pudo cambiar ahora mismo. Inténtalo de nuevo.';
      err.classList.remove('hidden');
      btn.disabled = false; btn.textContent = old;
    });
}
document.getElementById('rename-btn').addEventListener('click', openRenameModal);
document.getElementById('rename-submit').addEventListener('click', submitRename);
document.getElementById('rename-pin').addEventListener('keydown', e => { if (e.key === 'Enter') submitRename(); });
document.getElementById('rename-input').addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('rename-pin').focus(); });
document.getElementById('rename-cancel').addEventListener('click', closeRenameModal);
document.getElementById('rename-modal').addEventListener('click', e => { if (e.target.id === 'rename-modal') closeRenameModal(); });

// "Borrar" no permite cambiar de nombre libremente: borra tu usuario (y todos
// tus pronósticos) y solo entonces puedes crear uno nuevo. Evita jugar 2 veces.
document.getElementById('change-user-btn').addEventListener('click', () => {
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
    await api.deleteUser({ user: currentUser });
    localStorage.removeItem('wc2026_username');
    location.reload();
  } catch (err) {
    console.error('deleteUser', err);
    alert('No se pudo borrar el usuario ahora mismo. Inténtalo de nuevo en un momento.');
    btn.textContent = 'Sí, borrar y empezar'; btn.disabled = false;
  }
});

// ── Aviso (sin cuenta atrás global: cada partido se cierra a su hora) ─────
function setupBanner() {
  const banner = document.getElementById('deadline-banner');
  document.getElementById('locked-banner').classList.add('hidden');
  banner.classList.remove('hidden');
  document.getElementById('deadline-text').textContent =
    'Cada partido se cierra a su hora de inicio. Lo que no rellenes cuenta como 0–0.';
}

// ── Tarjeta de partido (compartida por grupos y eliminatorias) ───────────
function scoreRowsHtml(matchId, homeTeam, awayTeam, locked) {
  const pred = predictions[matchId];
  if (locked) {
    const hs = pred ? pred.home : 0, as = pred ? pred.away : 0;
    const cls = pred ? '' : ' unsent';
    return `<div class="mc-rows">
      <div class="mc-row">${teamFlag(homeTeam)}<span class="team-name">${teamName(homeTeam)}</span><span class="score-static${cls}">${hs}</span></div>
      <div class="mc-row">${teamFlag(awayTeam)}<span class="team-name">${teamName(awayTeam)}</span><span class="score-static${cls}">${as}</span></div>
    </div>`;
  }
  const hv = pred ? pred.home : '', av = pred ? pred.away : '';
  return `<div class="mc-rows">
    <div class="mc-row">${teamFlag(homeTeam)}<span class="team-name">${teamName(homeTeam)}</span>
      <input class="score-input" type="number" inputmode="numeric" min="0" max="20" placeholder="–" id="sc-${matchId}-home" value="${hv}"></div>
    <div class="mc-row">${teamFlag(awayTeam)}<span class="team-name">${teamName(awayTeam)}</span>
      <input class="score-input" type="number" inputmode="numeric" min="0" max="20" placeholder="–" id="sc-${matchId}-away" value="${av}"></div>
  </div>`;
}
// IMPORTANT: search within the (possibly detached) card element, NOT the document —
// the card isn't in the page yet when this runs, so document.getElementById would miss it.
function wireCardInputs(card, matchId) {
  ['home', 'away'].forEach(side => {
    const el = card.querySelector(`#sc-${matchId}-${side}`);
    if (!el) return;
    el.addEventListener('input', () => onScoreChange(matchId)); // sin salto automático
    el.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); advanceFocus(el.id); } });
    el.addEventListener('focus', () => safeSelect(el));
  });
}
function resultBadgeHtml(matchId) {
  const result = resultFor(matchId);
  if (!result) return '';
  const pred = predictions[matchId] || { home: 0, away: 0 }; // auto 0–0
  const resultStr = `${result.home} – ${result.away}`;
  const ko = isKoId(matchId);
  let penPick = null, realWinner = null;
  if (ko) {
    const pp = predictions[matchId + 'P']; penPick = pp ? teamByIndex(pp.home) : null;
    const rb = realBr.resolved[matchId]; realWinner = rb ? rb.winner : null;
  }
  const pts = pointsFor(matchId, pred, result, penPick, realWinner); // grupos 5/3 · eliminatorias 5/7
  const top = ko ? 7 : 5;
  if (pts === top) {
    const txt = (ko && result.home === result.away) ? '⭐ ¡Exacto + penalti! +7' : `⭐ ¡Exacto! +${top}`;
    return `<span class="result-display result-correct-exact">${txt}</span>`;
  }
  if (pts > 0) return `<span class="result-display result-correct-outcome">✓ Acierto +${ko ? 5 : 3}</span>`;
  const tu = `${pred.home}–${pred.away}`;
  return `<span class="result-display result-wrong">✗ ${tu} · real ${resultStr}</span>`;
}
function lockTag(locked, result) {
  if (result) return `<span class="lock-tag finished">Final</span>`;
  if (locked)  return `<span class="lock-tag closed">🔒 Cerrado</span>`;
  return '';
}

// ── Construir fase de grupos (pestañas por día + «Próximos») ─────
function dayKeysSorted() {
  const set = {};
  MATCHES.forEach(m => { set[madridDayKey(m.kickoff)] = true; });
  return Object.keys(set).sort();
}
function dayLabel(key) {
  const d = new Date(key + 'T12:00:00Z');
  return new Intl.DateTimeFormat('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }).format(d);
}
// Pestaña inicial del calendario: la fecha de HOY si hay partidos ese día; si no, «Próximos».
function defaultGroupTab() {
  const todayKey = madridDayKey(new Date());
  return dayKeysSorted().includes(todayKey) ? todayKey : 'upcoming';
}
// Partidos de los PRÓXIMOS 3 DÍAS de juego (hoy incluido). Los partidos que YA
// han empezado hoy se quedan (no desaparecen), para poder consultar fácilmente
// qué puso cada uno sin buscarlos en el calendario. Se recalcula en cada render
// → se actualiza solo cada día. Las eliminatorias aparecen solo cuando ya se
// conocen los equipos reales.
function upcomingMatches() {
  const todayKey = madridDayKey(new Date());
  const cand = allMatches().filter(m => {
    if (madridDayKey(m.kickoff) < todayKey) return false; // días pasados → pestañas por día / Resultados
    if (m.id[0] === 'M') { const r = realBr.resolved[m.id]; if (!r || !r.home || !r.away) return false; }
    return true;
  }).sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff));
  const days = [];
  cand.forEach(m => { const k = madridDayKey(m.kickoff); if (!days.includes(k)) days.push(k); });
  const keep = days.slice(0, 3); // los 3 próximos días con partidos (incl. hoy)
  return cand.filter(m => keep.includes(madridDayKey(m.kickoff)));
}

function buildUI() {
  const nav = document.getElementById('day-tabs');
  nav.className = 'day-nav';
  const days = dayKeysSorted();
  nav.innerHTML =
    '<button class="tab-btn" id="nav-upcoming">⏳ Próximos</button>' +
    '<div class="day-stepper">' +
      '<button class="day-arrow" id="nav-prev" aria-label="Día anterior">‹</button>' +
      '<select class="day-select" id="day-select">' +
        '<option value="">📅 Ir a un día…</option>' +
        days.map(k => `<option value="${k}">${dayLabel(k)}</option>`).join('') +
      '</select>' +
      '<button class="day-arrow" id="nav-next" aria-label="Día siguiente">›</button>' +
    '</div>';
  document.getElementById('nav-upcoming').addEventListener('click', () => renderGroupTab('upcoming'));
  document.getElementById('day-select').addEventListener('change', e => { if (e.target.value) renderGroupTab(e.target.value); });
  document.getElementById('nav-prev').addEventListener('click', () => stepDay(-1));
  document.getElementById('nav-next').addEventListener('click', () => stepDay(1));
  renderGroupTab(defaultGroupTab()); // por defecto, la fecha de hoy (o «Próximos» si hoy no hay partidos)
  buildGroupSummary();
  renderFinalBet();
}

// Las flechas recorren los días con vuelta (‹ en el primero → último, › en el último → primero).
// Desde «Próximos»: › va al primer día, ‹ al último.
function stepDay(dir) {
  const days = dayKeysSorted();
  const cur = days.indexOf(currentGroupTab);
  let idx;
  if (cur >= 0) idx = (cur + dir + days.length) % days.length;
  else idx = dir > 0 ? 0 : days.length - 1;
  renderGroupTab(days[idx]);
}

let lastUpcomingKey = '';
function renderGroupTab(tabKey) {
  currentGroupTab = tabKey;
  const upBtn = document.getElementById('nav-upcoming');
  if (upBtn) upBtn.classList.toggle('active', tabKey === 'upcoming');
  const sel = document.getElementById('day-select');
  if (sel) sel.value = (tabKey !== 'upcoming' && tabKey.indexOf('group:') !== 0) ? tabKey : '';
  const content = document.getElementById('day-content');
  let matches, header;
  if (tabKey === 'upcoming') {
    matches = upcomingMatches();
    lastUpcomingKey = matches.map(m => m.id + (matchLocked(m.kickoff) ? '!' : '')).join(',');
    header = '⏳ Próximos 3 días — rellena estos primero';
  } else {
    matches = MATCHES.filter(m => madridDayKey(m.kickoff) === tabKey)
      .sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff));
    header = 'Partidos del ' + dayLabel(tabKey);
  }
  if (matches.length === 0) {
    content.innerHTML = '<p class="ko-intro">No hay partidos próximos ahora mismo. Mira las pestañas por día. 🙂</p>';
    return;
  }
  content.innerHTML = `<div class="group-header">${header}</div><div class="matches-grid" id="day-grid"></div>`;
  const grid = document.getElementById('day-grid');
  matches.forEach(m => grid.appendChild(m.id[0] === 'M' ? buildKoCard(m) : buildMatchCard(m)));
  matches.forEach(m => { if (isKoId(m.id) && !lockedM(m)) updateKoPensRow(m.id); }); // selector de penaltis en cruces KO
}

// Refresca la pestaña «Próximos» cuando cambian los partidos (otro día), sin molestar si estás escribiendo.
function maybeRefreshUpcoming() {
  if (groupModalOpen) return; // no tocar el fondo mientras el modal de grupo está abierto
  if (currentGroupTab !== 'upcoming') return;
  const focused = document.activeElement && /^sc-/.test(document.activeElement.id || '');
  if (focused) return;
  if (upcomingMatches().map(m => m.id + (matchLocked(m.kickoff) ? '!' : '')).join(',') !== lastUpcomingKey) renderGroupTab('upcoming');
}

function buildGroupSummary() {
  const el = document.getElementById('group-summary');
  if (!el) return;
  // Clasificación según TUS pronósticos. Resalta los que pasarían:
  //   · grupo completo → 1.º y 2.º (verde) · todos los grupos completos → mejores 3.º (dorado)
  const cs = computeStandings(predictions);
  const allComplete = cs.complete;
  const qualThirds = allComplete ? new Set(bestEightThirds(cs.thirds)) : new Set();
  let html = '<div class="summary-title">📋 Grupos <span class="summary-hint">(toca uno para ver tus pronósticos)</span></div>';
  html += '<div class="summary-legend">🟢 1.º y 2.º de cada grupo' + (allComplete ? ' · 🟡 mejores 3.º' : '') + ' = los que pasarían según tus pronósticos' + (allComplete ? '' : ' (completa el grupo para verlo)') + '</div>';
  html += '<div class="summary-grid">';
  GROUPS.forEach(g => {
    const c = groupColor(g);
    const gm = getMatchesByGroup(g);
    const groupComplete = gm.every(m => predictions[m.id] !== undefined);
    const ranking = cs.standings[g] || [];
    const teams = groupComplete ? ranking : [...new Set(gm.flatMap(m => [m.home, m.away]))];
    html += `<button class="summary-group" style="border-left-color:${c}" onclick="renderGroupView('${g}')">
      <div class="summary-group-name" style="color:${c}">Grupo ${g} <span class="summary-arrow">›</span></div>`;
    teams.forEach(t => {
      let cls = 'summary-team', tag = '';
      if (groupComplete) {
        if (t === ranking[0])      { cls += ' qual';        tag = '1.º'; }
        else if (t === ranking[1]) { cls += ' qual';        tag = '2.º'; }
        else if (allComplete && t === ranking[2] && qualThirds.has(g)) { cls += ' qual qual3'; tag = '3.º'; }
      }
      html += `<div class="${cls}">${teamFlag(t)} <span>${teamName(t)}</span>${tag ? `<span class="qual-tag">(${tag})</span>` : ''}</div>`;
    });
    html += '</button>';
  });
  html += '</div>';
  el.innerHTML = html;
}

// Al tocar un grupo en el resumen: abre una VENTANA (modal) con los 6 partidos de
// ese grupo y tus pronósticos. Se superpone a todo y al cerrar vuelves donde estabas.
let groupModalOpen = false;
function renderGroupView(g) {
  const c = groupColor(g);
  const title = document.getElementById('group-modal-title');
  title.textContent = 'Grupo ' + g + ' · tus pronósticos';
  title.style.color = c;
  document.querySelector('#group-modal .modal').style.borderTop = '4px solid ' + c;
  // Vaciamos #day-content para que no haya casillas duplicadas mientras el modal está abierto.
  document.getElementById('day-content').innerHTML = '';
  const body = document.getElementById('group-modal-body');
  body.innerHTML = '<div class="matches-grid" id="group-modal-grid"></div>';
  const grid = document.getElementById('group-modal-grid');
  getMatchesByGroup(g).sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff))
    .forEach(m => grid.appendChild(buildMatchCard(m)));
  groupModalOpen = true;
  document.getElementById('group-modal').classList.remove('hidden');
}
function closeGroupModal() {
  groupModalOpen = false;
  document.getElementById('group-modal').classList.add('hidden');
  document.getElementById('group-modal-body').innerHTML = ''; // libera los IDs de las casillas
  renderGroupTab(currentGroupTab); // restaura la vista de días/próximos
}
document.getElementById('group-modal-close').addEventListener('click', closeGroupModal);
document.getElementById('group-modal').addEventListener('click', e => {
  if (e.target.id === 'group-modal') closeGroupModal(); // clic en el fondo
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && groupModalOpen) closeGroupModal(); });

// ── Modal: qué puso cada uno en un partido ya empezado ───────────
// Solo para partidos ya cerrados (han empezado), así que enseñar lo de los demás
// es correcto. Carga TODAS las predicciones (api.getAll), con caché de 60 s.
let matchPredsOpen = false, allPreds = null, allPredsAt = 0, allPredsPromise = null;
function ensureAllPreds() {
  if (allPreds && Date.now() - allPredsAt < 60000) return Promise.resolve(allPreds);
  if (allPredsPromise) return allPredsPromise;
  allPredsPromise = api.getAll()
    .then(d => { allPreds = d || {}; allPredsAt = Date.now(); allPredsPromise = null; return allPreds; })
    .catch(e => {
      allPredsPromise = null;
      // Si la llamada falla puntualmente, usa lo último guardado en caché (si lo hay)
      // en vez de dejar el modal con error. No fijamos allPredsAt → reintenta en vivo luego.
      const cached = (typeof CacheStore !== 'undefined') && CacheStore.get('getAll');
      if (cached) { allPreds = cached; return allPreds; }
      throw e;
    });
  return allPredsPromise;
}
function teamsForMatch(m) {
  if (m.id[0] === 'M') { const r = realBr.resolved[m.id] || {}; return { home: r.home, away: r.away }; }
  return { home: m.home, away: m.away };
}
function escMP(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function makeCardClickable(card, id) {
  card.classList.add('mc-clickable');
  card.insertAdjacentHTML('beforeend', '<div class="mc-seepreds">👁️ Ver qué puso cada uno ›</div>');
  card.addEventListener('click', () => openMatchPredictions(id));
}
function openMatchPredictions(matchId) {
  const m = getAnyMatch(matchId); if (!m) return;
  const t = teamsForMatch(m); if (!t.home || !t.away) return;
  const result = resultFor(matchId);
  const title = document.getElementById('match-preds-title');
  const body = document.getElementById('match-preds-body');
  const scoreStr = result ? `<b>${result.home}–${result.away}</b>` : '<span class="mpred-vs">vs</span>';
  title.innerHTML = `${teamFlag(t.home)} ${teamName(t.home)} ${scoreStr} ${teamName(t.away)} ${teamFlag(t.away)}`;
  body.innerHTML = '<div class="lb-loading">Cargando pronósticos…</div>';
  matchPredsOpen = true;
  document.getElementById('match-preds-modal').classList.remove('hidden');
  ensureAllPreds()
    .then(data => { if (matchPredsOpen) renderMatchPreds(matchId, result, data, body); })
    .catch(() => { body.innerHTML = '<div class="lb-loading">No se pudieron cargar los pronósticos. Revisa tu conexión.</div>'; });
}
function renderMatchPreds(matchId, result, data, body) {
  const byUser = {};
  (data.predictions || []).forEach(p => { (byUser[p.user] = byUser[p.user] || {})[p.matchId] = { home: p.home, away: p.away }; });
  const ko = isKoId(matchId);
  const top = ko ? 7 : 5;
  const realWinner = ko && realBr.resolved[matchId] ? realBr.resolved[matchId].winner : null;
  const rows = Object.keys(byUser).map(u => {
    const pred = byUser[u][matchId] || null;
    const penPred = ko ? byUser[u][matchId + 'P'] : null;
    const penPick = penPred ? teamByIndex(penPred.home) : null;
    const pts = result ? pointsFor(matchId, pred || { home: 0, away: 0 }, result, penPick, realWinner) : null;
    return { user: u, pred, pts, penPick };
  });
  if (!rows.length) { body.innerHTML = '<div class="lb-loading">Todavía nadie ha hecho pronósticos.</div>'; return; }
  if (result) rows.sort((a, b) => b.pts - a.pts || a.user.localeCompare(b.user));
  else rows.sort((a, b) => a.user.localeCompare(b.user));
  const badge = r => r.pts === top ? `<span class="badge badge-green">⭐ +${top}</span>`
                   : r.pts > 0 ? `<span class="badge badge-gold">✓ +${ko ? 5 : 3}</span>`
                   : '<span class="badge badge-red">+0</span>';
  const sub = result ? 'Lo que puso cada uno · más puntos primero'
                     : 'Aún sin resultado · se ordenará por puntos cuando se introduzca';
  body.innerHTML = `<div class="mpred-sub">${sub} · toca un nombre para ver todas sus predicciones</div><div class="mpred-list">` + rows.map(r => {
    const isMe = r.user === currentUser;
    const penStr = (r.penPick && r.pred && r.pred.home === r.pred.away) ? ` <span class="mpred-pen">🥅 ${teamName(r.penPick)}</span>` : '';
    const score = r.pred ? `${r.pred.home}–${r.pred.away}${penStr}` : '<span class="mpred-none">sin pronóstico</span>';
    return `<a class="mpred-row${isMe ? ' me' : ''}" href="predicciones.html?u=${encodeURIComponent(r.user)}" title="Ver todas las predicciones de ${escMP(r.user)}">
      <span class="mpred-name">${escMP(r.user)}${isMe ? ' (tú)' : ''}</span>
      <span class="mpred-pred">${score}</span>
      <span class="mpred-pts">${result ? badge(r) : ''}</span>
    </a>`;
  }).join('') + '</div>';
}
// Apuesta de la final: ver lo que apostó cada uno (reutiliza el modal de partidos).
// Solo tras el cierre (mismo criterio de juego limpio que los partidos al empezar).
function openFinalBetPredictions() {
  if (!finalBetLocked()) return;
  const title = document.getElementById('match-preds-title');
  const body = document.getElementById('match-preds-body');
  title.innerHTML = '🏆 Apuesta de la final';
  body.innerHTML = '<div class="lb-loading">Cargando apuestas…</div>';
  matchPredsOpen = true;
  document.getElementById('match-preds-modal').classList.remove('hidden');
  ensureAllPreds()
    .then(data => { if (matchPredsOpen) renderFinalBetPreds(data, body); })
    .catch(() => { body.innerHTML = '<div class="lb-loading">No se pudieron cargar las apuestas. Revisa tu conexión.</div>'; });
}
function renderFinalBetPreds(data, body) {
  const byUser = {};
  (data.predictions || []).forEach(p => { (byUser[p.user] = byUser[p.user] || {})[p.matchId] = { home: p.home, away: p.away }; });
  const rows = Object.keys(byUser).map(u => ({
    user: u, fin: byUser[u]['SP_FINALISTS'], sc: byUser[u]['SP_FINAL'], pens: byUser[u]['SP_FINAL_PENS']
  })).filter(r => r.fin); // solo quienes hicieron su apuesta
  if (!rows.length) { body.innerHTML = '<div class="lb-loading">Nadie hizo su apuesta de la final.</div>'; return; }
  rows.sort((a, b) => (a.user === currentUser ? -1 : b.user === currentUser ? 1 : a.user.localeCompare(b.user)));
  const list = rows.map(r => {
    const isMe = r.user === currentUser;
    const tA = teamByIndex(r.fin.home), tB = teamByIndex(r.fin.away);
    let champ = null, viaPens = false;
    if (tA && tB && r.sc) {
      if (r.sc.home > r.sc.away) champ = tA;
      else if (r.sc.away > r.sc.home) champ = tB;
      else if (r.pens) { champ = teamByIndex(r.pens.home); viaPens = true; }
    }
    const pick = (tA && tB)
      ? `${teamFlag(tA)} ${teamName(tA)} <b class="fbpred-score">${r.sc ? r.sc.home + '–' + r.sc.away : '–'}</b> ${teamName(tB)} ${teamFlag(tB)}`
      : '<span class="mpred-none">apuesta no válida</span>';
    const champStr = champ ? `<div class="fbpred-champ">🏆 ${teamName(champ)}${viaPens ? ' <span class="fb-pen-tag">🥅 en penaltis</span>' : ''}</div>` : '';
    return `<a class="fbpred-row${isMe ? ' me' : ''}" href="predicciones.html?u=${encodeURIComponent(r.user)}" title="Ver todas las predicciones de ${escMP(r.user)}">
      <div class="fbpred-top"><span class="fbpred-user">${escMP(r.user)}${isMe ? ' (tú)' : ''}</span><span class="fbpred-go">›</span></div>
      <div class="fbpred-pick">${pick}</div>${champStr}
    </a>`;
  }).join('');
  body.innerHTML = `<div class="mpred-sub">Lo que apostó cada uno para la final · toca un nombre para ver todas sus predicciones</div><div class="fbpred-list">${list}</div>`;
}
function closeMatchPredsModal() {
  matchPredsOpen = false;
  document.getElementById('match-preds-modal').classList.add('hidden');
}
document.getElementById('match-preds-close').addEventListener('click', closeMatchPredsModal);
document.getElementById('match-preds-modal').addEventListener('click', e => { if (e.target.id === 'match-preds-modal') closeMatchPredsModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && matchPredsOpen) closeMatchPredsModal(); });
// Modal de edición de eliminatoria (desde el cuadro)
document.getElementById('ko-edit-close').addEventListener('click', closeKoEdit);
document.getElementById('ko-edit-modal').addEventListener('click', e => { if (e.target.id === 'ko-edit-modal') closeKoEdit(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && koEditMatchId) closeKoEdit(); });

// ── Apuesta especial: la FINAL (2 finalistas + marcador) ─────────
// Se guarda como predicciones "SP_FINALISTS" (índices de equipo), "SP_FINAL"
// (marcador) y "SP_FINAL_PENS" (índice del finalista que gana en penaltis si
// el marcador es empate), reutilizando el almacenamiento normal. Cierra el lunes.
function finalBetLocked() { return matchLocked(SP_FINAL_DEADLINE); }
function fbSavePart(matchId, home, away) {
  predictions[matchId] = { home, away };
  dirty[matchId] = { home, away };
  const st = document.getElementById('fb-status'); if (st) { st.textContent = '…'; st.className = 'fb-status saving'; }
  api.savePrediction({ user: currentUser, matchId, home, away })
    .then(() => { delete dirty[matchId]; const s = document.getElementById('fb-status'); if (s) { s.textContent = '✓ Guardado'; s.className = 'fb-status saved'; } })
    .catch(() => { const s = document.getElementById('fb-status'); if (s) { s.textContent = '✗ Sin guardar — reintenta'; s.className = 'fb-status error'; } });
}
function saveFinalists() {
  if (finalBetLocked()) return;
  const a = parseInt(document.getElementById('fb-teamA').value, 10);
  const b = parseInt(document.getElementById('fb-teamB').value, 10);
  const st = document.getElementById('fb-status');
  if (isNaN(a) || a < 0 || isNaN(b) || b < 0) { if (st) { st.textContent = 'Elige los dos finalistas'; st.className = 'fb-status'; } return; }
  if (a === b) { if (st) { st.textContent = '⚠️ Elige dos equipos distintos'; st.className = 'fb-status error'; } return; }
  fbSavePart('SP_FINALISTS', a, b);
}
function saveFinalScore() {
  if (finalBetLocked()) return;
  const hv = document.getElementById('fb-golesA').value, av = document.getElementById('fb-golesB').value;
  const st = document.getElementById('fb-status');
  if (hv === '' || av === '') { if (st) { st.textContent = 'Pon el marcador de la final'; st.className = 'fb-status'; } return; }
  const home = parseInt(hv, 10), away = parseInt(av, 10);
  if (isNaN(home) || isNaN(away) || home < 0 || away < 0) return;
  fbSavePart('SP_FINAL', home, away);
}
// Empate en el marcador → hay que indicar quién gana en penaltis (= tu campeón).
function savePens(idx) {
  if (finalBetLocked()) return;
  const fin = predictions['SP_FINALISTS'];
  if (!fin || (idx !== fin.home && idx !== fin.away)) return;
  fbSavePart('SP_FINAL_PENS', idx, 0);
  updatePensRow();
}
// Muestra/oculta la fila de penaltis según si el marcador escrito es empate.
function updatePensRow() {
  const box = document.getElementById('fb-pens'); if (!box) return;
  const ha = document.getElementById('fb-golesA'), aa = document.getElementById('fb-golesB');
  if (!ha || !aa) return;
  const hv = ha.value, av = aa.value;
  const draw = hv !== '' && av !== '' && parseInt(hv, 10) === parseInt(av, 10);
  if (!draw) { box.innerHTML = ''; box.classList.remove('show'); return; }
  box.classList.add('show');
  const fin = predictions['SP_FINALISTS'];
  if (!fin) {
    box.innerHTML = `<div class="fb-pens-hint">🥅 Empate — elige primero los dos finalistas para indicar quién gana en los penaltis.</div>`;
    return;
  }
  const pens = predictions['SP_FINAL_PENS'];
  const winIdx = pens ? pens.home : null;
  const btn = idx => {
    const code = teamByIndex(idx);
    return `<button type="button" class="fb-pens-btn${winIdx === idx ? ' on' : ''}" data-pens="${idx}">${teamFlag(code)} ${teamName(code)}</button>`;
  };
  box.innerHTML = `<div class="fb-pens-q">🥅 Empate — ¿quién gana en los penaltis? <span class="fb-pens-note">(será tu campeón)</span></div>
    <div class="fb-pens-opts">${btn(fin.home)}${btn(fin.away)}</div>`;
  box.querySelectorAll('.fb-pens-btn').forEach(b => b.addEventListener('click', () => savePens(parseInt(b.dataset.pens, 10))));
}
function renderFinalBet() {
  const host = document.getElementById('final-bet'); if (!host) return;
  if (!currentUser) { host.innerHTML = ''; host.dataset.ready = ''; return; }
  // No repintar si estás eligiendo justo ahora (no perder lo que tecleas/seleccionas)
  if (host.dataset.ready && document.activeElement && host.contains(document.activeElement)) return;
  const locked = finalBetLocked();
  const fin = predictions['SP_FINALISTS'], sc = predictions['SP_FINAL'];
  const tA = fin ? teamByIndex(fin.home) : null, tB = fin ? teamByIndex(fin.away) : null;
  if (locked) {
    let inner;
    if (tA && tB) {
      const pens = predictions['SP_FINAL_PENS'];
      let champ = null, viaPens = false;
      if (sc) {
        if (sc.home > sc.away) champ = tA;
        else if (sc.away > sc.home) champ = tB;
        else if (pens) { champ = teamByIndex(pens.home); viaPens = true; }
      }
      inner = `<div class="fb-locked-pick">
          <span class="fb-team">${teamFlag(tA)} ${teamName(tA)}</span>
          <span class="fb-score">${sc ? sc.home + ' – ' + sc.away : '– – –'}</span>
          <span class="fb-team">${teamName(tB)} ${teamFlag(tB)}</span>
        </div>${champ ? `<div class="fb-champ">🏆 Tu campeón: <b>${teamName(champ)}</b>${viaPens ? ' <span class="fb-pen-tag">🥅 en penaltis</span>' : ''}</div>` : ''}`;
    } else {
      inner = `<div class="fb-none">No llegaste a hacer tu apuesta de la final 😕</div>`;
    }
    host.innerHTML = `<div class="final-bet-card locked fb-clickable" id="fb-card">
      <div class="fb-head">🏆 Tu apuesta de la final <span class="fb-closed">🔒 Cerrada</span></div>${inner}
      <div class="mc-seepreds">👁️ Ver las apuestas de todos ›</div></div>`;
    host.dataset.ready = '1';
    const card = document.getElementById('fb-card');
    if (card) card.addEventListener('click', openFinalBetPredictions);
    return;
  }
  const sorted = allTeams().slice().sort((x, y) => teamName(x).localeCompare(teamName(y)));
  const opts = selIdx => sorted.map(code => { const i = teamIndex(code); return `<option value="${i}"${selIdx === i ? ' selected' : ''}>${teamName(code)}</option>`; }).join('');
  host.innerHTML = `<div class="final-bet-card">
    <div class="fb-head">🏆 Apuesta especial: la Final <span class="fb-deadline">cierra lun 15 jun · 23:59</span></div>
    <div class="fb-sub">Elige los <b>2 finalistas</b> y el <b>marcador</b>. <b>+10</b> por finalista · <b>+10</b> campeón · <b>+20</b> marcador exacto.</div>
    <div class="fb-row">
      <select class="admin-select fb-sel" id="fb-teamA"><option value="-1">Finalista 1…</option>${opts(fin ? fin.home : -1)}</select>
      <div class="fb-scorebox">
        <input class="score-input" id="fb-golesA" type="number" inputmode="numeric" min="0" max="20" placeholder="–" value="${sc ? sc.home : ''}">
        <span class="fb-dash">–</span>
        <input class="score-input" id="fb-golesB" type="number" inputmode="numeric" min="0" max="20" placeholder="–" value="${sc ? sc.away : ''}">
      </div>
      <select class="admin-select fb-sel" id="fb-teamB"><option value="-1">Finalista 2…</option>${opts(fin ? fin.away : -1)}</select>
    </div>
    <div class="fb-pens" id="fb-pens"></div>
    <div class="fb-status" id="fb-status"></div>
  </div>`;
  host.dataset.ready = '1';
  document.getElementById('fb-teamA').addEventListener('change', saveFinalists);
  document.getElementById('fb-teamB').addEventListener('change', saveFinalists);
  document.getElementById('fb-teamA').addEventListener('change', updatePensRow);
  document.getElementById('fb-teamB').addEventListener('change', updatePensRow);
  document.getElementById('fb-golesA').addEventListener('input', saveFinalScore);
  document.getElementById('fb-golesB').addEventListener('input', saveFinalScore);
  document.getElementById('fb-golesA').addEventListener('input', updatePensRow);
  document.getElementById('fb-golesB').addEventListener('input', updatePensRow);
  updatePensRow();
}

function buildMatchCard(match) {
  const locked = lockedM(match);
  const result = resultFor(match.id);
  const k = formatKickoff(match.kickoff);
  const card = document.createElement('div');
  card.className = 'match-card' + (locked ? ' locked' : '');
  card.id = `card-${match.id}`;
  card.innerHTML = `
    <div class="match-meta">
      <span class="group-badge" style="color:${groupColor(match.group)};border-color:${groupColor(match.group)};background:${groupColor(match.group)}22">Grupo ${match.group}</span>
      <span>${k.date}</span><span class="separator">·</span>
      <span class="kickoff-time">${k.time}</span><span class="separator">·</span>
      <span class="venue">${match.venue}</span>
      ${lockTag(locked, result)}
    </div>
    ${scoreRowsHtml(match.id, match.home, match.away, locked)}
    <div class="match-footer">
      <div class="save-status idle" id="status-${match.id}"></div>
      <div id="result-badge-${match.id}">${resultBadgeHtml(match.id)}</div>
    </div>`;
  if (!locked) wireCardInputs(card, match.id);
  else makeCardClickable(card, match.id); // ya empezó → toca para ver qué puso cada uno
  return card;
}

// ── Navegación automática entre casillas ─────────────────
let advanceTimers = {};
const IS_TOUCH = (typeof window !== 'undefined') &&
  (window.matchMedia ? window.matchMedia('(pointer: coarse)').matches : ('ontouchstart' in window));
function safeSelect(el) { try { if (el && el.select) el.select(); } catch (_) {} }
function focusInput(id) { const el = document.getElementById(id); if (!el) return; try { el.focus(); } catch (_) {} safeSelect(el); }
function scheduleAdvance(id, fn) {
  if (IS_TOUCH) return;
  clearTimeout(advanceTimers[id]);
  const el = document.getElementById(id);
  if (!el || el.value === '') return;
  advanceTimers[id] = setTimeout(() => fn(id), 350);
}
function parseScoreId(id) { const m = id.match(/^sc-(.+)-(home|away)$/); return m ? { matchId: m[1], side: m[2] } : null; }
// Avanza dentro del contenedor visible (día activo o ronda activa); al final, salta al siguiente.
function advanceFocus(currentId) {
  const cur = document.getElementById(currentId); if (!cur) return;
  const grid = cur.closest('.matches-grid, .ko-grid'); if (!grid) return;
  const ids = Array.from(grid.querySelectorAll('.score-input')).map(i => i.id);
  const idx = ids.indexOf(currentId);
  if (idx >= 0 && idx < ids.length - 1) { focusInput(ids[idx + 1]); return; }
  // En la última casilla NO saltamos de día/ronda — el usuario revisa lo que ha puesto.
  try { cur.blur(); } catch (_) {}
}

// ── Guardar pronóstico ───────────────────────────────────
// Guarda el valor EN MEMORIA al instante (para que no desaparezca al cambiar de
// pestaña) y envía a la hoja con un pequeño retardo.
function onScoreChange(matchId) {
  const m = getAnyMatch(matchId);
  if (!m || lockedM(m)) { setStatus(matchId, 'error', '🔒 Cerrado'); return; }
  const hEl = document.getElementById(`sc-${matchId}-home`);
  const aEl = document.getElementById(`sc-${matchId}-away`);
  if (!hEl || !aEl) return;
  const hv = hEl.value, av = aEl.value;
  if (isKoId(matchId)) updateKoPensRow(matchId); // muestra/oculta el selector de penaltis (empate)
  // Si borras AMBAS casillas → eliminar el pronóstico (no debe reaparecer al refrescar).
  if (hv === '' && av === '') {
    clearTimeout(saveTimers[matchId]);
    if (predictions[matchId] || dirty[matchId]) {
      delete predictions[matchId];
      delete dirty[matchId];
      cleared[matchId] = true;
      updateProgress(); updateDayChecks(); updateNudge();
      api.deletePrediction({ user: currentUser, matchId }).catch(e => console.error('deletePrediction', e));
    }
    setStatus(matchId, 'idle', '');
    return;
  }
  if (hv === '' || av === '') { setStatus(matchId, 'idle', ''); return; } // a medias: no guardar todavía
  const home = parseInt(hv, 10), away = parseInt(av, 10);
  if (isNaN(home) || isNaN(away) || home < 0 || away < 0) return;
  delete cleared[matchId]; // vuelve a tener pronóstico
  predictions[matchId] = { home, away }; // se conserva aunque cambies de pestaña al instante
  dirty[matchId] = { home, away };
  updateProgress();
  updateDayChecks();
  updateNudge();
  setStatus(matchId, 'saving', '…');
  clearTimeout(saveTimers[matchId]);
  saveTimers[matchId] = setTimeout(() => savePrediction(matchId), 600);
}
async function savePrediction(matchId) {
  const pred = predictions[matchId];
  if (!pred) return;
  try {
    await api.savePrediction({ user: currentUser, matchId, home: pred.home, away: pred.away });
    delete dirty[matchId];
    setStatus(matchId, 'saved', '✓ Guardado');
  } catch (err) {
    setStatus(matchId, 'error', '✗ Sin guardar — reintenta');
    console.error(err);
  }
}
function setStatus(matchId, cls, text) {
  const el = document.getElementById(`status-${matchId}`);
  if (!el) return;
  el.className = `save-status ${cls}`;
  el.textContent = text;
}

// ── Cargar datos ─────────────────────────────────────────
async function loadData() {
  if (!currentUser) return;
  try {
    let data;
    try { data = await api.getUser({ user: currentUser }); }
    catch (e) { data = await api.getAll(); }
    applyData(data);
  } catch (err) { console.error('loadData', err); }
}

// Procesa los datos (de la red o de la caché) y refresca la pantalla.
function applyData(data) {
    const serverPreds = {};
    (data.predictions || []).forEach(p => {
      if (!p.user || p.user === currentUser) serverPreds[p.matchId] = { home: p.home, away: p.away };
    });
    // Conserva lo que aún no se ha confirmado en la hoja (dirty manda sobre el servidor).
    predictions = Object.assign({}, serverPreds, dirty);
    // Respeta los pronósticos recién borrados hasta que el servidor confirme.
    Object.keys(cleared).forEach(id => {
      if (serverPreds[id] === undefined) delete cleared[id]; // borrado confirmado
      else delete predictions[id];                            // aún no procesado: mantenlo vacío
    });
    results = {};
    (data.results || []).forEach(r => { results[r.matchId] = r; });
    koReal = {};
    (data.knockoutReal || []).forEach(k => {
      koReal[k.matchId] = { winner: k.winner || '', gh: k.gh, ga: k.ga, home: k.home || '', away: k.away || '' };
    });
    // Equipos reales del cuadro a partir de resultados reales de grupos + ganadores reales.
    const groupResults = {};
    MATCHES.forEach(m => { const r = resultFor(m.id); if (r) groupResults[m.id] = { home: r.home, away: r.away }; });
    realBr = realKnockout(groupResults, koReal);

    syncGroupCards();
    maybeRefreshUpcoming(); // mantiene «Próximos» al día (3 días) en tiempo real
    updateNudge();
    renderFinalBet(); // apuesta especial de la final
    // Eliminatorias: re-render solo si no estás escribiendo una casilla KO ahora mismo.
    const editingKo = document.activeElement && /^sc-M/.test(document.activeElement.id || '');
    if (currentPhase === 'ko' && !editingKo) renderKnockout();
}

// Actualiza las tarjetas visibles SIN borrar lo que el usuario está escribiendo:
// solo rellena casillas vacías con lo ya guardado, refresca insignias y bloqueos.
function syncGroupCards() {
  MATCHES.forEach(m => {
    const card = document.getElementById(`card-${m.id}`);
    if (!card) return; // solo las del día visible
    if (lockedM(m)) { card.replaceWith(buildMatchCard(m)); return; } // ya empezó → solo lectura
    const pred = predictions[m.id];
    if (pred) {
      const h = document.getElementById(`sc-${m.id}-home`);
      const a = document.getElementById(`sc-${m.id}-away`);
      if (h && document.activeElement !== h && h.value === '') h.value = pred.home;
      if (a && document.activeElement !== a && a.value === '') a.value = pred.away;
      if (h && a && h.value !== '' && a.value !== '') setStatus(m.id, 'saved', '✓ Guardado');
    }
    const badge = document.getElementById(`result-badge-${m.id}`);
    if (badge) badge.innerHTML = resultBadgeHtml(m.id);
  });
  updateProgress();
  updateDayChecks();
}

// ── Progreso (solo grupos) ───────────────────────────────
function updateProgress() {
  const total = MATCHES.length;
  const done = MATCHES.filter(m => predictions[m.id] !== undefined).length;
  const pct = Math.round((done / total) * 100);
  const t = document.getElementById('progress-text');
  if (t) t.textContent = `${done} / ${total} pronósticos de grupos`;
  const p = document.getElementById('progress-pct');
  if (p) p.textContent = `${pct}%`;
  const f = document.getElementById('progress-fill');
  if (f) f.style.width = `${pct}%`;
  buildGroupSummary(); // refresca los resaltados de clasificados
}
function updateDayChecks() {
  const sel = document.getElementById('day-select');
  if (!sel) return;
  Array.from(sel.options).forEach(opt => {
    if (!opt.value) return; // placeholder «Ir a un día…»
    const matches = MATCHES.filter(m => madridDayKey(m.kickoff) === opt.value);
    const done = matches.length > 0 && matches.every(m => predictions[m.id] !== undefined);
    opt.textContent = dayLabel(opt.value) + (done ? ' ✓' : '');
  });
}

// ── Conmutador de fase ───────────────────────────────────
// La fase final ya ha empezado cuando arranca el primer partido de 16avos.
function koStarted() {
  const r32 = KO_MATCHES.filter(m => m.round === 'R32').map(m => new Date(m.kickoff).getTime());
  return r32.length > 0 && Date.now() >= Math.min.apply(null, r32);
}
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

// ── Eliminatorias (equipos reales por ronda) ─────────────
function renderKnockout() {
  const lockedMsg = document.getElementById('ko-locked-msg');
  const koContent = document.getElementById('ko-content');
  // Los cruces se muestran EN CUANTO se conocen (por grupos terminados); el resto
  // queda «Por determinar». Solo si aún no se sabe NINGUNO mostramos el aviso.
  const anyKnown = KO_MATCHES.some(m => { const r = realBr.resolved[m.id]; return r && r.home && r.away; });
  if (!anyKnown) {
    lockedMsg.classList.remove('hidden');
    koContent.classList.add('hidden');
    document.getElementById('ko-locked-progress').textContent =
      'Los cruces irán apareciendo según terminen los grupos. ¡Vuelve pronto! ⚽';
    return;
  }
  lockedMsg.classList.add('hidden');
  koContent.classList.remove('hidden');
  buildKoDayNav();
  renderKoTab(currentKoTab || defaultKoTab());
  renderKoBracketDiagram(); // el cuadro completo va al FINAL (#ko-bracket está al final del DOM)
}
// Orden de ÁRBOL por ronda: recorre el cuadro desde la final (post-orden) para
// que los DOS partidos que alimentan al siguiente queden ADYACENTES en su columna
// (en el cuadro 2026 no van seguidos: M89 sale de M74+M77). Así los conectores
// (par → siguiente) cuadran con un layout de bracket estándar.
function koTreeOrder() {
  if (koTreeOrder._c) return koTreeOrder._c;
  const byId = {}; KO_MATCHES.forEach(m => byId[m.id] = m);
  const rounds = { R32: [], R16: [], QF: [], SF: [], F: [] };
  (function visit(id) {
    const m = byId[id]; if (!m) return;
    const hc = m.home && m.home.winOf, ac = m.away && m.away.winOf;
    if (hc) visit(hc);
    if (ac) visit(ac);
    if (rounds[m.round]) rounds[m.round].push(m.id);
  })('M104');
  return (koTreeOrder._c = rounds);
}
// Cuadro visual (solo lectura) con conectores: una columna por ronda, ganador
// real resaltado; las líneas muestran de qué dos partidos sale cada siguiente.
function renderKoBracketDiagram() {
  const host = document.getElementById('ko-bracket');
  if (!host) return;
  const order = koTreeOrder();
  const cols = [['R32', '16avos'], ['R16', 'Octavos'], ['QF', 'Cuartos'], ['SF', 'Semis'], ['F', 'Final']];
  // sc = marcador del jugador (su pronóstico) si lo ha introducido.
  const teamCell = (name, isWin, sc) => name
    ? `<div class="kbk-team${isWin ? ' win' : ''}">${teamFlag(name)}<span>${teamName(name)}</span>${sc != null ? `<b class="kbk-sc">${sc}</b>` : ''}</div>`
    : `<div class="kbk-team tbd"><span>Por definir</span></div>`;
  let html = '<div class="kbk">';
  cols.forEach(([rk, label]) => {
    html += `<div class="kbk-col"><div class="kbk-col-title">${label}</div><div class="kbk-col-body">`;
    (order[rk] || []).forEach(id => {
      const r = realBr.resolved[id] || {};
      const w = r.winner || null;
      const both = r.home && r.away;
      const p = predictions[id]; // marcador pronosticado por el jugador
      html += `<div class="kbk-match"><div class="kbk-card${both ? ' clickable' : ''}" data-mid="${id}">` +
        `${teamCell(r.home, w && w === r.home, p ? p.home : null)}${teamCell(r.away, w && w === r.away, p ? p.away : null)}</div></div>`;
    });
    html += '</div></div>';
  });
  html += '</div>';
  const tp = realBr.resolved['M103'] || {};
  const tpStr = (tp.home || tp.away)
    ? `${tp.home ? teamName(tp.home) : 'Por definir'} vs ${tp.away ? teamName(tp.away) : 'Por definir'}`
    : 'Por definir';
  html += `<div class="kbk-third"><span class="kbk-third-lbl">🥉 Tercer puesto:</span> ${tpStr}</div>`;
  host.innerHTML = html;
  // Clic en un cruce (con ambos equipos) → editar pronóstico / ver apuestas.
  host.querySelectorAll('.kbk-card.clickable').forEach(c => c.addEventListener('click', () => openKoEdit(c.dataset.mid)));
}
// Editar el pronóstico de una eliminatoria desde el cuadro (popup = tarjeta del
// calendario). Si ya empezó, muestra qué puso cada uno (solo lectura).
let koEditMatchId = null;
function openKoEdit(matchId) {
  const m = getKoMatch(matchId); if (!m) return;
  const r = realBr.resolved[matchId] || {};
  if (!r.home || !r.away) return;
  if (lockedM(m)) { openMatchPredictions(matchId); return; } // ya empezó → ver resultados/apuestas
  if (!currentUser) { openMatchPredictions(matchId); return; }
  const k = formatKickoff(m.kickoff);
  const pred = predictions[matchId];
  const hv = pred ? pred.home : '', av = pred ? pred.away : '';
  const lbl = (m.round === 'F') ? '🏆 Final' : (m.round === '3P') ? '🥉 Tercer puesto' : ((KO_ROUNDS.find(x => x.key === m.round) || {}).name || 'Eliminatoria');
  document.getElementById('ko-edit-title').innerHTML = `${teamFlag(r.home)} ${teamName(r.home)} <span class="mpred-vs">vs</span> ${teamName(r.away)} ${teamFlag(r.away)}`;
  document.getElementById('ko-edit-body').innerHTML = `
    <div class="match-meta" style="justify-content:center"><span>${lbl}</span><span class="separator">·</span><span>${k.date}</span><span class="separator">·</span><span class="kickoff-time">${k.time}</span></div>
    <div class="mc-rows">
      <div class="mc-row">${teamFlag(r.home)}<span class="team-name">${teamName(r.home)}</span><input class="score-input" type="number" inputmode="numeric" min="0" max="20" placeholder="–" id="koe-home" value="${hv}"></div>
      <div class="mc-row">${teamFlag(r.away)}<span class="team-name">${teamName(r.away)}</span><input class="score-input" type="number" inputmode="numeric" min="0" max="20" placeholder="–" id="koe-away" value="${av}"></div>
    </div>
    <div class="ko-pens" id="koe-pens"></div>
    <div class="save-status idle" id="koe-status" style="text-align:center;margin-top:8px"></div>`;
  document.getElementById('koe-home').addEventListener('input', () => koeOnChange(matchId));
  document.getElementById('koe-away').addEventListener('input', () => koeOnChange(matchId));
  koeUpdatePens(matchId);
  koEditMatchId = matchId;
  document.getElementById('ko-edit-modal').classList.remove('hidden');
}
function closeKoEdit() {
  document.getElementById('ko-edit-modal').classList.add('hidden');
  koEditMatchId = null;
  renderKoBracketDiagram(); // refleja el marcador nuevo en el cuadro
  if (currentPhase === 'ko') renderKoTab(currentKoTab || defaultKoTab()); // y en el calendario
}
function koeOnChange(matchId) {
  const m = getKoMatch(matchId); if (!m || lockedM(m)) return;
  const hEl = document.getElementById('koe-home'), aEl = document.getElementById('koe-away');
  if (!hEl || !aEl) return;
  const hv = hEl.value, av = aEl.value, st = document.getElementById('koe-status');
  koeUpdatePens(matchId);
  if (hv === '' && av === '') {
    clearTimeout(saveTimers[matchId]);
    if (predictions[matchId] || dirty[matchId]) { delete predictions[matchId]; delete dirty[matchId]; cleared[matchId] = true; api.deletePrediction({ user: currentUser, matchId }).catch(() => {}); }
    if (st) { st.textContent = ''; st.className = 'save-status idle'; }
    return;
  }
  if (hv === '' || av === '') { if (st) { st.textContent = ''; st.className = 'save-status idle'; } return; }
  const home = parseInt(hv, 10), away = parseInt(av, 10);
  if (isNaN(home) || isNaN(away) || home < 0 || away < 0) return;
  delete cleared[matchId];
  predictions[matchId] = { home, away }; dirty[matchId] = { home, away };
  if (st) { st.textContent = '…'; st.className = 'save-status saving'; }
  clearTimeout(saveTimers[matchId]);
  saveTimers[matchId] = setTimeout(() => {
    api.savePrediction({ user: currentUser, matchId, home, away })
      .then(() => { delete dirty[matchId]; const s = document.getElementById('koe-status'); if (s) { s.textContent = '✓ Guardado'; s.className = 'save-status saved'; } })
      .catch(() => { const s = document.getElementById('koe-status'); if (s) { s.textContent = '✗ Sin guardar — reintenta'; s.className = 'save-status error'; } });
  }, 500);
}
function koeUpdatePens(matchId) {
  const box = document.getElementById('koe-pens'); if (!box) return;
  const r = realBr.resolved[matchId] || {};
  const hEl = document.getElementById('koe-home'), aEl = document.getElementById('koe-away');
  const draw = hEl && aEl && hEl.value !== '' && aEl.value !== '' && parseInt(hEl.value, 10) === parseInt(aEl.value, 10);
  if (!draw || !r.home || !r.away) { box.innerHTML = ''; box.classList.remove('show'); return; }
  box.classList.add('show');
  const penPred = predictions[matchId + 'P'];
  const winName = penPred ? teamByIndex(penPred.home) : null;
  const btn = name => `<button type="button" class="ko-pens-btn${winName === name ? ' on' : ''}" data-team="${teamIndex(name)}">${teamFlag(name)} ${teamName(name)}</button>`;
  box.innerHTML = `<div class="ko-pens-q">🥅 Empate — ¿quién pasa en penaltis? <span class="ko-pens-note">(necesario para los 7 pts)</span></div>
    <div class="ko-pens-opts">${btn(r.home)}${btn(r.away)}</div>`;
  box.querySelectorAll('.ko-pens-btn').forEach(b => b.addEventListener('click', () => { saveKoPens(matchId, parseInt(b.dataset.team, 10)); koeUpdatePens(matchId); }));
}
// Días (Madrid) de las eliminatorias — calendario fijo (28-jun → 19-jul).
function koDayKeysSorted() {
  const set = {};
  KO_MATCHES.forEach(m => { set[madridDayKey(m.kickoff)] = true; });
  return Object.keys(set).sort();
}
// Pestaña inicial: el día de HOY si hay eliminatoria, si no «Próximos».
function defaultKoTab() {
  const todayKey = madridDayKey(new Date());
  return koDayKeysSorted().includes(todayKey) ? todayKey : 'upcoming';
}
// Próximos cruces (3 días de juego, hoy incl.) con equipos YA conocidos.
function koUpcomingMatches() {
  const todayKey = madridDayKey(new Date());
  const cand = KO_MATCHES.filter(m => {
    if (madridDayKey(m.kickoff) < todayKey) return false;
    const r = realBr.resolved[m.id]; return r && r.home && r.away;
  }).sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff));
  const days = [];
  cand.forEach(m => { const k = madridDayKey(m.kickoff); if (!days.includes(k)) days.push(k); });
  const keep = days.slice(0, 3);
  return cand.filter(m => keep.includes(madridDayKey(m.kickoff)));
}
// Navegador por días de eliminatorias (igual que grupos): «Próximos» + stepper.
function buildKoDayNav() {
  const nav = document.getElementById('ko-round-tabs');
  if (!nav) return;
  nav.className = 'day-nav';
  const days = koDayKeysSorted();
  nav.innerHTML =
    '<button class="tab-btn" id="ko-nav-upcoming">⏳ Próximos</button>' +
    '<div class="day-stepper">' +
      '<button class="day-arrow" id="ko-nav-prev" aria-label="Día anterior">‹</button>' +
      '<select class="day-select" id="ko-day-select">' +
        '<option value="">📅 Ir a un día…</option>' +
        days.map(k => `<option value="${k}">${dayLabel(k)}</option>`).join('') +
      '</select>' +
      '<button class="day-arrow" id="ko-nav-next" aria-label="Día siguiente">›</button>' +
    '</div>';
  document.getElementById('ko-nav-upcoming').addEventListener('click', () => renderKoTab('upcoming'));
  document.getElementById('ko-day-select').addEventListener('change', e => { if (e.target.value) renderKoTab(e.target.value); });
  document.getElementById('ko-nav-prev').addEventListener('click', () => stepKoDay(-1));
  document.getElementById('ko-nav-next').addEventListener('click', () => stepKoDay(1));
}
function stepKoDay(dir) {
  const days = koDayKeysSorted();
  const cur = days.indexOf(currentKoTab);
  let idx;
  if (cur >= 0) idx = (cur + dir + days.length) % days.length;
  else idx = dir > 0 ? 0 : days.length - 1;
  renderKoTab(days[idx]);
}
function renderKoTab(tabKey) {
  currentKoTab = tabKey;
  const upBtn = document.getElementById('ko-nav-upcoming');
  if (upBtn) upBtn.classList.toggle('active', tabKey === 'upcoming');
  const sel = document.getElementById('ko-day-select');
  if (sel) sel.value = (tabKey !== 'upcoming') ? tabKey : '';
  const container = document.getElementById('ko-rounds');
  let matches, header;
  if (tabKey === 'upcoming') {
    matches = koUpcomingMatches();
    header = '⏳ Próximos cruces — pronostícalos primero';
    if (!matches.length) {
      container.innerHTML = '<p class="ko-intro">Aún no hay cruces próximos con los dos equipos conocidos. Usa el calendario por día o mira el <b>cuadro completo</b> abajo. 🙂</p>';
      return;
    }
  } else {
    matches = KO_MATCHES.filter(m => madridDayKey(m.kickoff) === tabKey)
      .sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff));
    header = 'Eliminatorias del ' + dayLabel(tabKey);
  }
  container.innerHTML = `<div class="group-header">${header}</div><div class="ko-grid" id="ko-grid"></div>`;
  const grid = document.getElementById('ko-grid');
  matches.forEach(m => grid.appendChild(buildKoCard(m)));
  matches.forEach(m => { if (!lockedM(m)) updateKoPensRow(m.id); }); // selector de penaltis si el pronóstico es empate
}
function buildKoCard(m) {
  const r = realBr.resolved[m.id] || {};
  const locked = lockedM(m);
  const result = resultFor(m.id);
  const k = formatKickoff(m.kickoff);
  const label = (m.round === 'F') ? '🏆 Final' : (m.round === '3P') ? '🥉 Tercer puesto' : '';
  const card = document.createElement('div');
  card.className = 'ko-card' + (locked ? ' locked' : '');
  card.id = `card-${m.id}`;

  if (!r.home || !r.away) {
    // Aún no se conocen ambos rivales: mostramos el lado ya conocido (si lo hay)
    // y «Por determinar» el otro. No se puede pronosticar hasta saber los dos.
    const sideRow = nm => nm
      ? `<div class="mc-row">${teamFlag(nm)} <span class="team-name">${teamName(nm)}</span></div>`
      : `<div class="mc-row"><span class="team-name tbd-text">Por determinar</span></div>`;
    card.innerHTML = `${label ? `<div class="ko-card-label">${label}</div>` : ''}
      <div class="match-meta"><span>${k.date}</span><span class="separator">·</span><span class="kickoff-time">${k.time}</span></div>
      <div class="mc-rows">
        ${sideRow(r.home)}
        ${sideRow(r.away)}
      </div>`;
    return card;
  }
  card.innerHTML = `
    ${label ? `<div class="ko-card-label">${label}</div>` : ''}
    <div class="match-meta">
      <span>${k.date}</span><span class="separator">·</span>
      <span class="kickoff-time">${k.time}</span>
      ${lockTag(locked, result)}
    </div>
    ${scoreRowsHtml(m.id, r.home, r.away, locked)}
    ${locked ? koPensLockedHtml(m.id) : `<div class="ko-pens" id="ko-pens-${m.id}"></div>`}
    <div class="match-footer">
      <div class="save-status idle" id="status-${m.id}"></div>
      <div id="result-badge-${m.id}">${resultBadgeHtml(m.id)}</div>
    </div>`;
  if (!locked) wireCardInputs(card, m.id);
  else makeCardClickable(card, m.id); // ya empezó → toca para ver qué puso cada uno
  return card;
}
// Penaltis (a vida o muerte): si el pronóstico de esta eliminatoria es EMPATE, se
// elige quién pasa en penaltis (necesario para los 7 pts). Se guarda como una
// predicción aparte con id `<id>P` (home = índice del equipo), sin tocar el backend.
function koPensLockedHtml(matchId) {
  const pred = predictions[matchId];
  if (!pred || pred.home !== pred.away) return ''; // solo si pronosticó empate
  const penPred = predictions[matchId + 'P'];
  const winName = penPred ? teamByIndex(penPred.home) : null;
  return `<div class="ko-pens show"><div class="ko-pens-q">🥅 ${winName
    ? `Penaltis: ${teamFlag(winName)} <b>${teamName(winName)}</b>`
    : 'Empate — sin elegir penaltis'}</div></div>`;
}
function updateKoPensRow(matchId) {
  const box = document.getElementById('ko-pens-' + matchId);
  if (!box) return;
  const r = realBr.resolved[matchId] || {};
  const hEl = document.getElementById(`sc-${matchId}-home`), aEl = document.getElementById(`sc-${matchId}-away`);
  const draw = hEl && aEl && hEl.value !== '' && aEl.value !== '' && parseInt(hEl.value, 10) === parseInt(aEl.value, 10);
  if (!draw || !r.home || !r.away) { box.innerHTML = ''; box.classList.remove('show'); return; }
  box.classList.add('show');
  const penPred = predictions[matchId + 'P'];
  const winName = penPred ? teamByIndex(penPred.home) : null;
  const btn = name => `<button type="button" class="ko-pens-btn${winName === name ? ' on' : ''}" data-team="${teamIndex(name)}">${teamFlag(name)} ${teamName(name)}</button>`;
  box.innerHTML = `<div class="ko-pens-q">🥅 Empate — ¿quién pasa en penaltis? <span class="ko-pens-note">(necesario para los 7 pts)</span></div>
    <div class="ko-pens-opts">${btn(r.home)}${btn(r.away)}</div>`;
  box.querySelectorAll('.ko-pens-btn').forEach(b => b.addEventListener('click', () => saveKoPens(matchId, parseInt(b.dataset.team, 10))));
}
function saveKoPens(matchId, teamIdx) {
  const m = getKoMatch(matchId); if (!m || lockedM(m)) return;
  const id = matchId + 'P';
  predictions[id] = { home: teamIdx, away: 0 };
  dirty[id] = { home: teamIdx, away: 0 };
  api.savePrediction({ user: currentUser, matchId: id, home: teamIdx, away: 0 })
    .then(() => { delete dirty[id]; })
    .catch(e => console.error('saveKoPens', e));
  updateKoPensRow(matchId);
}

// ── Init ─────────────────────────────────────────────────
buildUI();
setupBanner();
// Una vez empezada la fase final, la web abre por defecto en Eliminatorias
// (los grupos ya no importan tanto); antes, sigue abriendo en Grupos.
showPhase(koStarted() ? 'ko' : 'groups');
loadUser();
