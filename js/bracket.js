// ============================================================
//  bracket.js — turns group predictions into a knockout bracket
//  Shared by the predictions page, the leaderboard and the admin.
//  Pure functions; no DOM, no network.
// ============================================================

// Compute the standings of every group from a set of score predictions.
// `preds` = { matchId: { home, away } }  (group matches use ids like 'A1')
// Returns { standings, thirds, complete }.
//   standings = { A: [team1st, team2nd, team3rd, team4th], ... }  (English keys)
//   thirds    = [ { group, team, pts, gd, gf }, ... ]  (one per group, 3rd place)
//   complete  = true only if all 72 group matches are predicted
function computeStandings(preds) {
  const standings = {};
  const thirds = [];
  const groupComplete = {}; // { A:true/false, ... } — grupo con sus 6 partidos resueltos
  let complete = true;

  GROUPS.forEach(group => {
    const matches = getMatchesByGroup(group);
    const table = {};
    const ensure = t => (table[t] = table[t] || { team: t, pts: 0, gd: 0, gf: 0, ga: 0 });

    let groupComplete_ = true;
    matches.forEach(m => {
      ensure(m.home); ensure(m.away);
      const p = preds[m.id];
      if (!p || p.home == null || p.away == null) { groupComplete_ = false; return; }
      const h = table[m.home], a = table[m.away];
      h.gf += p.home; h.ga += p.away;
      a.gf += p.away; a.ga += p.home;
      if (p.home > p.away)      { h.pts += 3; }
      else if (p.home < p.away) { a.pts += 3; }
      else                      { h.pts += 1; a.pts += 1; }
    });
    Object.values(table).forEach(t => { t.gd = t.gf - t.ga; });

    // Sort: points, goal difference, goals for, then name (deterministic).
    const ranked = Object.values(table).sort((x, y) =>
      y.pts - x.pts || y.gd - x.gd || y.gf - x.gf || x.team.localeCompare(y.team));

    standings[group] = ranked.map(t => t.team);
    groupComplete[group] = groupComplete_;
    if (!groupComplete_) complete = false;
    else thirds.push({ group, team: ranked[2].team, pts: ranked[2].pts, gd: ranked[2].gd, gf: ranked[2].gf });
  });

  return { standings, thirds, complete, groupComplete };
}

// Rank the 12 third-placed teams and return the 8 best (their group letters).
function bestEightThirds(thirds) {
  const ranked = [...thirds].sort((x, y) =>
    y.pts - x.pts || y.gd - x.gd || y.gf - x.gf || x.group.localeCompare(y.group));
  return ranked.slice(0, 8).map(t => t.group);
}

// Assign the 8 qualifying third-place groups to the 8 R32 slots,
// respecting each slot's allowed-groups constraint. Backtracking match.
// Returns { T74:'C', T77:'D', ... } mapping slot -> group letter.
function assignThirds(qualGroups) {
  const slots = Object.keys(THIRD_SLOTS); // fixed order
  const result = {};
  const usedGroup = {};

  function backtrack(i) {
    if (i === slots.length) return true;
    const slot = slots[i];
    const allowed = THIRD_SLOTS[slot].allowed;
    for (const g of qualGroups) {
      if (usedGroup[g]) continue;
      if (allowed.indexOf(g) === -1) continue;
      result[slot] = g; usedGroup[g] = true;
      if (backtrack(i + 1)) return true;
      delete result[slot]; usedGroup[g] = false;
    }
    return false;
  }

  if (backtrack(0)) return result;

  // Fallback (should be rare): assign leftover groups ignoring constraints
  // so the bracket is always complete.
  const leftover = qualGroups.filter(g => !Object.values(result).includes(g));
  slots.forEach(s => { if (!result[s]) result[s] = leftover.shift(); });
  return result;
}

// Resolve every knockout match into concrete teams given standings and the
// third-place assignment. The winner of each tie is decided either by:
//   - `winnerFn(matchId, home, away)` if provided (used live, from scores), or
//   - a static `picks` map { matchId: teamName } (used when scoring saved data).
// Returns { matchId: { home, away, winner, loser } } (null where unknown).
function resolveBracket(standings, thirdAssign, picks, winnerFn) {
  const resolved = {};
  picks = picks || {};

  const side = ref => {
    if (ref.w)      return (standings[ref.w]      || [])[0] || null;
    if (ref.ru)     return (standings[ref.ru]     || [])[1] || null;
    if (ref.third)  { const g = thirdAssign[ref.third]; return g ? (standings[g] || [])[2] || null : null; }
    if (ref.winOf)  return resolved[ref.winOf] ? resolved[ref.winOf].winner : null;
    if (ref.loseOf) return resolved[ref.loseOf] ? resolved[ref.loseOf].loser : null;
    return null;
  };

  KO_MATCHES.forEach(m => {
    const home = side(m.home);
    const away = side(m.away);
    let winner = null;
    if (home && away) {
      if (winnerFn) {
        const w = winnerFn(m.id, home, away);
        winner = (w === home || w === away) ? w : null;
      } else {
        const pick = picks[m.id];
        winner = (pick === home || pick === away) ? pick : null;
      }
    }
    const loser = winner ? (winner === home ? away : home) : null;
    resolved[m.id] = { home, away, winner, loser };
  });

  return resolved;
}

// Convenience: full pipeline from predictions + picks → resolved bracket.
function buildUserBracket(preds, picks, winnerFn) {
  const { standings, thirds, complete } = computeStandings(preds);
  if (!complete) return { complete: false, standings, resolved: {}, thirdAssign: {} };
  const qual = bestEightThirds(thirds);
  const thirdAssign = assignThirds(qual);
  const resolved = resolveBracket(standings, thirdAssign, picks, winnerFn);
  return { complete: true, standings, thirdAssign, resolved };
}

// Derive the REAL knockout bracket from real results.
//   groupResults: { matchId: {home,away} } for finished GROUP matches
//   koReal:       { koMatchId: { winner } } who really advanced (admin-entered)
// Returns { complete, resolved } where resolved[matchId] = {home,away,winner,loser}
// with real teams filled in as far as they are known.
function realKnockout(groupResults, koReal) {
  koReal = koReal || {};
  const cs = computeStandings(groupResults);
  const gc = cs.groupComplete || {};
  const allComplete = cs.complete;
  const resolved = {};
  // Devuelve el equipo de un grupo en la posición idx SOLO si ese grupo ya terminó.
  const teamAt = (g, idx, ready) => (ready && cs.standings[g]) ? (cs.standings[g][idx] || null) : null;
  // Ganador (1.º) y segundo (2.º) de grupo se sacan solos de los resultados. Los
  // TERCEROS los fija el admin a mano (FIFA usa una tabla oficial de 495 combos
  // que no se puede calcular solo); por eso `third` no se auto-asigna: viene del
  // override `koReal[id].home/away` que guarda el admin en saveKnockoutReal.
  const side = ref => {
    if (ref.w)      return teamAt(ref.w, 0, gc[ref.w]);
    if (ref.ru)     return teamAt(ref.ru, 1, gc[ref.ru]);
    if (ref.third)  return null;
    if (ref.winOf)  return resolved[ref.winOf] ? resolved[ref.winOf].winner : null;
    if (ref.loseOf) return resolved[ref.loseOf] ? resolved[ref.loseOf].loser : null;
    return null;
  };
  KO_MATCHES.forEach(m => {
    let home = side(m.home), away = side(m.away);
    const ov = koReal[m.id] || {};
    if (ov.home) home = ov.home; // equipos fijados por el admin (override) — p.ej. los terceros
    if (ov.away) away = ov.away;
    let winner = null;
    if (home && away && ov.winner) { const w = ov.winner; winner = (w === home || w === away) ? w : null; }
    const loser = winner ? (winner === home ? away : home) : null;
    resolved[m.id] = { home, away, winner, loser };
  });
  return { complete: allComplete, resolved };
}

// Sets of teams that REACH each round (i.e. are participants in it),
// from a resolved (or real-knockout) bracket map.
function reachedSets(resolved) {
  const sets = { R32: new Set(), R16: new Set(), QF: new Set(), SF: new Set(), F: new Set() };
  KO_MATCHES.forEach(m => {
    if (!sets[m.round]) return; // skip 3P (its teams are already counted in SF)
    const r = resolved[m.id];
    if (!r) return;
    if (r.home) sets[m.round].add(r.home);
    if (r.away) sets[m.round].add(r.away);
  });
  const fin = resolved['M104'] || {};
  const tp  = resolved['M103'] || {};
  return { sets, champion: fin.winner || null, third: tp.winner || null };
}

// Progression score: compare a user's reached-sets to the real ones.
function scoreKnockout(userResolved, real) {
  const u = reachedSets(userResolved);
  const inter = (a, b) => { let n = 0; a.forEach(x => { if (b.has(x)) n++; }); return n; };
  let pts = 0;
  pts += inter(u.sets.R32, real.sets.R32) * KO_POINTS.qualified;
  pts += inter(u.sets.R16, real.sets.R16) * KO_POINTS.r16;
  pts += inter(u.sets.QF,  real.sets.QF)  * KO_POINTS.qf;
  pts += inter(u.sets.SF,  real.sets.SF)  * KO_POINTS.sf;
  pts += inter(u.sets.F,   real.sets.F)   * KO_POINTS.finalist;
  if (u.champion && u.champion === real.champion) pts += KO_POINTS.champion;
  if (u.third && u.third === real.third)          pts += KO_POINTS.third;
  return pts;
}
