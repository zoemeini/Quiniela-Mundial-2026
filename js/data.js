// ── World Cup 2026 — group stage data ────────────────────
// Kick-off times are stored in UTC (ISO). The site renders them
// in Spanish local time (Europe/Madrid, CEST = UTC+2 in summer).
// Source: Sky Sports UK kick-off times (UK BST = UTC+1) + FIFA.

// ISO 3166-1 codes used to load real flag images from flagcdn.com.
const TEAM_CODES = {
  'Mexico': 'mx', 'South Africa': 'za', 'South Korea': 'kr', 'Czech Republic': 'cz',
  'Canada': 'ca', 'Bosnia & Herzegovina': 'ba', 'Qatar': 'qa', 'Switzerland': 'ch',
  'Brazil': 'br', 'Morocco': 'ma', 'Haiti': 'ht', 'Scotland': 'gb-sct',
  'USA': 'us', 'Paraguay': 'py', 'Australia': 'au', 'Turkey': 'tr',
  'Germany': 'de', 'Curaçao': 'cw', 'Ivory Coast': 'ci', 'Ecuador': 'ec',
  'Netherlands': 'nl', 'Japan': 'jp', 'Sweden': 'se', 'Tunisia': 'tn',
  'Belgium': 'be', 'Egypt': 'eg', 'Iran': 'ir', 'New Zealand': 'nz',
  'Spain': 'es', 'Cape Verde': 'cv', 'Saudi Arabia': 'sa', 'Uruguay': 'uy',
  'France': 'fr', 'Senegal': 'sn', 'Iraq': 'iq', 'Norway': 'no',
  'Argentina': 'ar', 'Algeria': 'dz', 'Austria': 'at', 'Jordan': 'jo',
  'Portugal': 'pt', 'DR Congo': 'cd', 'Uzbekistan': 'uz', 'Colombia': 'co',
  'England': 'gb-eng', 'Croatia': 'hr', 'Ghana': 'gh', 'Panama': 'pa',
};

// Spanish display names (the internal keys above stay in English).
const ES_NAMES = {
  'Mexico': 'México', 'South Africa': 'Sudáfrica', 'South Korea': 'Corea del Sur', 'Czech Republic': 'Chequia',
  'Canada': 'Canadá', 'Bosnia & Herzegovina': 'Bosnia y Herzegovina', 'Qatar': 'Catar', 'Switzerland': 'Suiza',
  'Brazil': 'Brasil', 'Morocco': 'Marruecos', 'Haiti': 'Haití', 'Scotland': 'Escocia',
  'USA': 'Estados Unidos', 'Paraguay': 'Paraguay', 'Australia': 'Australia', 'Turkey': 'Turquía',
  'Germany': 'Alemania', 'Curaçao': 'Curazao', 'Ivory Coast': 'Costa de Marfil', 'Ecuador': 'Ecuador',
  'Netherlands': 'Países Bajos', 'Japan': 'Japón', 'Sweden': 'Suecia', 'Tunisia': 'Túnez',
  'Belgium': 'Bélgica', 'Egypt': 'Egipto', 'Iran': 'Irán', 'New Zealand': 'Nueva Zelanda',
  'Spain': 'España', 'Cape Verde': 'Cabo Verde', 'Saudi Arabia': 'Arabia Saudí', 'Uruguay': 'Uruguay',
  'France': 'Francia', 'Senegal': 'Senegal', 'Iraq': 'Irak', 'Norway': 'Noruega',
  'Argentina': 'Argentina', 'Algeria': 'Argelia', 'Austria': 'Austria', 'Jordan': 'Jordania',
  'Portugal': 'Portugal', 'DR Congo': 'RD Congo', 'Uzbekistan': 'Uzbekistán', 'Colombia': 'Colombia',
  'England': 'Inglaterra', 'Croatia': 'Croacia', 'Ghana': 'Ghana', 'Panama': 'Panamá',
};

const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

// A distinct color per group — interleaved across the spectrum so neighbouring
// groups look clearly different (used for badges and the group summary).
const GROUP_COLORS = {
  A: '#ef4444', // red
  B: '#3b82f6', // blue
  C: '#8b5a2b', // brown
  D: '#22c55e', // green
  E: '#a855f7', // purple
  F: '#ffe600', // bright yellow
  G: '#06b6d4', // cyan
  H: '#ec4899', // pink
  I: '#166534', // deep forest green
  J: '#f97316', // orange
  K: '#c4b5fd', // light lavender
  L: '#14b8a6', // teal
};
function groupColor(g) { return GROUP_COLORS[g] || '#34d399'; }

// kickoff = UTC instant of kick-off. venue shown in Spanish.
const MATCHES = [
  // Group A
  { id: 'A1', group: 'A', kickoff: '2026-06-11T19:00:00Z', home: 'Mexico',         away: 'South Africa',        venue: 'Ciudad de México' },
  { id: 'A2', group: 'A', kickoff: '2026-06-12T02:00:00Z', home: 'South Korea',    away: 'Czech Republic',      venue: 'Zapopan' },
  { id: 'A3', group: 'A', kickoff: '2026-06-18T16:00:00Z', home: 'Czech Republic', away: 'South Africa',        venue: 'Atlanta' },
  { id: 'A4', group: 'A', kickoff: '2026-06-19T01:00:00Z', home: 'Mexico',         away: 'South Korea',         venue: 'Zapopan' },
  { id: 'A5', group: 'A', kickoff: '2026-06-25T01:00:00Z', home: 'South Africa',   away: 'South Korea',         venue: 'Guadalupe' },
  { id: 'A6', group: 'A', kickoff: '2026-06-25T01:00:00Z', home: 'Czech Republic', away: 'Mexico',              venue: 'Ciudad de México' },

  // Group B
  { id: 'B1', group: 'B', kickoff: '2026-06-12T19:00:00Z', home: 'Canada',               away: 'Bosnia & Herzegovina', venue: 'Toronto' },
  { id: 'B2', group: 'B', kickoff: '2026-06-13T19:00:00Z', home: 'Qatar',                away: 'Switzerland',          venue: 'Santa Clara' },
  { id: 'B3', group: 'B', kickoff: '2026-06-18T19:00:00Z', home: 'Switzerland',          away: 'Bosnia & Herzegovina', venue: 'Los Ángeles' },
  { id: 'B4', group: 'B', kickoff: '2026-06-18T22:00:00Z', home: 'Canada',               away: 'Qatar',                venue: 'Vancouver' },
  { id: 'B5', group: 'B', kickoff: '2026-06-24T19:00:00Z', home: 'Switzerland',          away: 'Canada',               venue: 'Vancouver' },
  { id: 'B6', group: 'B', kickoff: '2026-06-24T19:00:00Z', home: 'Bosnia & Herzegovina', away: 'Qatar',                venue: 'Seattle' },

  // Group C
  { id: 'C1', group: 'C', kickoff: '2026-06-13T22:00:00Z', home: 'Brazil',   away: 'Morocco',  venue: 'Nueva Jersey' },
  { id: 'C2', group: 'C', kickoff: '2026-06-14T01:00:00Z', home: 'Haiti',    away: 'Scotland', venue: 'Foxborough' },
  { id: 'C3', group: 'C', kickoff: '2026-06-19T22:00:00Z', home: 'Scotland', away: 'Morocco',  venue: 'Foxborough' },
  { id: 'C4', group: 'C', kickoff: '2026-06-20T00:30:00Z', home: 'Brazil',   away: 'Haiti',    venue: 'Filadelfia' },
  { id: 'C5', group: 'C', kickoff: '2026-06-24T22:00:00Z', home: 'Morocco',  away: 'Haiti',    venue: 'Atlanta' },
  { id: 'C6', group: 'C', kickoff: '2026-06-24T22:00:00Z', home: 'Scotland', away: 'Brazil',   venue: 'Miami' },

  // Group D
  { id: 'D1', group: 'D', kickoff: '2026-06-13T01:00:00Z', home: 'USA',       away: 'Paraguay',  venue: 'Los Ángeles' },
  { id: 'D2', group: 'D', kickoff: '2026-06-14T04:00:00Z', home: 'Australia', away: 'Turkey',    venue: 'Vancouver' },
  { id: 'D3', group: 'D', kickoff: '2026-06-19T19:00:00Z', home: 'USA',       away: 'Australia', venue: 'Seattle' },
  { id: 'D4', group: 'D', kickoff: '2026-06-20T03:00:00Z', home: 'Turkey',    away: 'Paraguay',  venue: 'Santa Clara' },
  { id: 'D5', group: 'D', kickoff: '2026-06-26T02:00:00Z', home: 'Turkey',    away: 'USA',       venue: 'Los Ángeles' },
  { id: 'D6', group: 'D', kickoff: '2026-06-26T02:00:00Z', home: 'Paraguay',  away: 'Australia', venue: 'Santa Clara' },

  // Group E
  { id: 'E1', group: 'E', kickoff: '2026-06-14T17:00:00Z', home: 'Germany',     away: 'Curaçao',     venue: 'Houston' },
  { id: 'E2', group: 'E', kickoff: '2026-06-14T23:00:00Z', home: 'Ivory Coast', away: 'Ecuador',     venue: 'Filadelfia' },
  { id: 'E3', group: 'E', kickoff: '2026-06-20T20:00:00Z', home: 'Germany',     away: 'Ivory Coast', venue: 'Toronto' },
  { id: 'E4', group: 'E', kickoff: '2026-06-21T00:00:00Z', home: 'Ecuador',     away: 'Curaçao',     venue: 'Kansas City' },
  { id: 'E5', group: 'E', kickoff: '2026-06-25T20:00:00Z', home: 'Curaçao',     away: 'Ivory Coast', venue: 'Filadelfia' },
  { id: 'E6', group: 'E', kickoff: '2026-06-25T20:00:00Z', home: 'Ecuador',     away: 'Germany',     venue: 'Nueva Jersey' },

  // Group F
  { id: 'F1', group: 'F', kickoff: '2026-06-14T20:00:00Z', home: 'Netherlands', away: 'Japan',       venue: 'Arlington' },
  { id: 'F2', group: 'F', kickoff: '2026-06-15T02:00:00Z', home: 'Sweden',      away: 'Tunisia',     venue: 'Guadalupe' },
  { id: 'F3', group: 'F', kickoff: '2026-06-20T17:00:00Z', home: 'Netherlands', away: 'Sweden',      venue: 'Houston' },
  { id: 'F4', group: 'F', kickoff: '2026-06-21T04:00:00Z', home: 'Tunisia',     away: 'Japan',       venue: 'Guadalupe' },
  { id: 'F5', group: 'F', kickoff: '2026-06-25T23:00:00Z', home: 'Tunisia',     away: 'Netherlands', venue: 'Kansas City' },
  { id: 'F6', group: 'F', kickoff: '2026-06-25T23:00:00Z', home: 'Japan',       away: 'Sweden',      venue: 'Arlington' },

  // Group G
  { id: 'G1', group: 'G', kickoff: '2026-06-15T19:00:00Z', home: 'Belgium',     away: 'Egypt',       venue: 'Seattle' },
  { id: 'G2', group: 'G', kickoff: '2026-06-16T01:00:00Z', home: 'Iran',        away: 'New Zealand', venue: 'Los Ángeles' },
  { id: 'G3', group: 'G', kickoff: '2026-06-21T19:00:00Z', home: 'Belgium',     away: 'Iran',        venue: 'Los Ángeles' },
  { id: 'G4', group: 'G', kickoff: '2026-06-22T01:00:00Z', home: 'New Zealand', away: 'Egypt',       venue: 'Vancouver' },
  { id: 'G5', group: 'G', kickoff: '2026-06-27T03:00:00Z', home: 'New Zealand', away: 'Belgium',     venue: 'Vancouver' },
  { id: 'G6', group: 'G', kickoff: '2026-06-27T03:00:00Z', home: 'Egypt',       away: 'Iran',        venue: 'Seattle' },

  // Group H
  { id: 'H1', group: 'H', kickoff: '2026-06-15T16:00:00Z', home: 'Spain',        away: 'Cape Verde',   venue: 'Atlanta' },
  { id: 'H2', group: 'H', kickoff: '2026-06-15T22:00:00Z', home: 'Saudi Arabia', away: 'Uruguay',      venue: 'Miami' },
  { id: 'H3', group: 'H', kickoff: '2026-06-21T16:00:00Z', home: 'Spain',        away: 'Saudi Arabia', venue: 'Atlanta' },
  { id: 'H4', group: 'H', kickoff: '2026-06-21T22:00:00Z', home: 'Uruguay',      away: 'Cape Verde',   venue: 'Miami' },
  { id: 'H5', group: 'H', kickoff: '2026-06-27T00:00:00Z', home: 'Cape Verde',   away: 'Saudi Arabia', venue: 'Houston' },
  { id: 'H6', group: 'H', kickoff: '2026-06-27T00:00:00Z', home: 'Uruguay',      away: 'Spain',        venue: 'Zapopan' },

  // Group I
  { id: 'I1', group: 'I', kickoff: '2026-06-16T19:00:00Z', home: 'France',  away: 'Senegal', venue: 'Nueva Jersey' },
  { id: 'I2', group: 'I', kickoff: '2026-06-16T22:00:00Z', home: 'Iraq',    away: 'Norway',  venue: 'Foxborough' },
  { id: 'I3', group: 'I', kickoff: '2026-06-22T21:00:00Z', home: 'France',  away: 'Iraq',    venue: 'Filadelfia' },
  { id: 'I4', group: 'I', kickoff: '2026-06-23T00:00:00Z', home: 'Norway',  away: 'Senegal', venue: 'Toronto' },
  { id: 'I5', group: 'I', kickoff: '2026-06-26T19:00:00Z', home: 'Norway',  away: 'France',  venue: 'Foxborough' },
  { id: 'I6', group: 'I', kickoff: '2026-06-26T19:00:00Z', home: 'Senegal', away: 'Iraq',    venue: 'Toronto' },

  // Group J
  { id: 'J1', group: 'J', kickoff: '2026-06-17T01:00:00Z', home: 'Argentina', away: 'Algeria',  venue: 'Kansas City' },
  { id: 'J2', group: 'J', kickoff: '2026-06-17T04:00:00Z', home: 'Austria',   away: 'Jordan',   venue: 'Santa Clara' },
  { id: 'J3', group: 'J', kickoff: '2026-06-22T17:00:00Z', home: 'Argentina', away: 'Austria',  venue: 'Arlington' },
  { id: 'J4', group: 'J', kickoff: '2026-06-23T03:00:00Z', home: 'Jordan',    away: 'Algeria',  venue: 'Santa Clara' },
  { id: 'J5', group: 'J', kickoff: '2026-06-28T02:00:00Z', home: 'Algeria',   away: 'Austria',  venue: 'Kansas City' },
  { id: 'J6', group: 'J', kickoff: '2026-06-28T02:00:00Z', home: 'Jordan',    away: 'Argentina',venue: 'Arlington' },

  // Group K
  { id: 'K1', group: 'K', kickoff: '2026-06-17T17:00:00Z', home: 'Portugal',  away: 'DR Congo',   venue: 'Houston' },
  { id: 'K2', group: 'K', kickoff: '2026-06-18T02:00:00Z', home: 'Uzbekistan',away: 'Colombia',   venue: 'Ciudad de México' },
  { id: 'K3', group: 'K', kickoff: '2026-06-23T17:00:00Z', home: 'Portugal',  away: 'Uzbekistan', venue: 'Houston' },
  { id: 'K4', group: 'K', kickoff: '2026-06-24T02:00:00Z', home: 'Colombia',  away: 'DR Congo',   venue: 'Zapopan' },
  { id: 'K5', group: 'K', kickoff: '2026-06-27T23:30:00Z', home: 'Colombia',  away: 'Portugal',   venue: 'Miami' },
  { id: 'K6', group: 'K', kickoff: '2026-06-27T23:30:00Z', home: 'DR Congo',  away: 'Uzbekistan', venue: 'Atlanta' },

  // Group L
  { id: 'L1', group: 'L', kickoff: '2026-06-17T20:00:00Z', home: 'England', away: 'Croatia', venue: 'Arlington' },
  { id: 'L2', group: 'L', kickoff: '2026-06-17T23:00:00Z', home: 'Ghana',   away: 'Panama',  venue: 'Toronto' },
  { id: 'L3', group: 'L', kickoff: '2026-06-23T20:00:00Z', home: 'England', away: 'Ghana',   venue: 'Foxborough' },
  { id: 'L4', group: 'L', kickoff: '2026-06-23T23:00:00Z', home: 'Panama',  away: 'Croatia', venue: 'Foxborough' },
  { id: 'L5', group: 'L', kickoff: '2026-06-27T21:00:00Z', home: 'Panama',  away: 'England', venue: 'Nueva Jersey' },
  { id: 'L6', group: 'L', kickoff: '2026-06-27T21:00:00Z', home: 'Croatia', away: 'Ghana',   venue: 'Filadelfia' },
];

// ── Helpers ──────────────────────────────────────────────
function getMatchById(id)      { return MATCHES.find(m => m.id === id); }
function getMatchesByGroup(g)  { return MATCHES.filter(m => m.group === g); }

// Spanish team name
function teamName(name) { return ES_NAMES[name] || name; }

// Lista ESTABLE de las 48 selecciones (orden fijo alfabético por nombre interno).
// Se usa para la apuesta de la final: guardamos el ÍNDICE del equipo en esta lista
// (así no hace falta tocar el backend; las predicciones guardan números).
function allTeams() {
  if (allTeams._cache) return allTeams._cache;
  const set = {};
  MATCHES.forEach(m => { set[m.home] = 1; set[m.away] = 1; });
  return (allTeams._cache = Object.keys(set).sort());
}
function teamByIndex(i) { const t = allTeams(); i = parseInt(i, 10); return (i >= 0 && i < t.length) ? t[i] : null; }
function teamIndex(name) { return allTeams().indexOf(name); }
// Apuesta especial de la final: se cierra el lunes 15 jun a las 23:59 (Madrid, CEST = UTC+2).
const SP_FINAL_DEADLINE = '2026-06-15T21:59:00Z';

// Real flag image (renders everywhere, unlike emoji flags on Windows)
function teamFlag(name) {
  const code = TEAM_CODES[name];
  if (!code) return '';
  return `<img class="team-flag-img" src="https://flagcdn.com/w40/${code}.png" ` +
         `srcset="https://flagcdn.com/w80/${code}.png 2x" alt="${teamName(name)}" loading="lazy">`;
}

// Kick-off formatted in Spanish local time (Europe/Madrid)
function formatKickoff(iso) {
  const d = new Date(iso);
  const date = new Intl.DateTimeFormat('es-ES', {
    timeZone: 'Europe/Madrid', weekday: 'short', day: 'numeric', month: 'short'
  }).format(d);
  const time = new Intl.DateTimeFormat('es-ES', {
    timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit', hour12: false
  }).format(d);
  return { date, time };
}

// ── Knockout stage (official 2026 bracket) ───────────────
// Rounds, in order, with Spanish names.
const KO_ROUNDS = [
  { key: 'R32', name: 'Dieciseisavos de final', short: '16avos' },
  { key: 'R16', name: 'Octavos de final',        short: 'Octavos' },
  { key: 'QF',  name: 'Cuartos de final',        short: 'Cuartos' },
  { key: 'SF',  name: 'Semifinales',             short: 'Semis' },
  { key: '3P',  name: 'Tercer puesto',           short: '3.º' },
  { key: 'F',   name: 'Final',                   short: 'Final' },
];

// The 8 Round-of-32 slots that take a best-third-placed team.
// `winner` = the group winner they face. `allowed` = the groups a
// third-placed team in that slot may come from (FIFA constraint).
const THIRD_SLOTS = {
  T74: { winner: 'E', allowed: ['A', 'B', 'C', 'D', 'F'] },
  T77: { winner: 'I', allowed: ['C', 'D', 'F', 'G', 'H'] },
  T79: { winner: 'A', allowed: ['C', 'E', 'F', 'H', 'I'] },
  T80: { winner: 'L', allowed: ['E', 'H', 'I', 'J', 'K'] },
  T81: { winner: 'D', allowed: ['B', 'E', 'F', 'I', 'J'] },
  T82: { winner: 'G', allowed: ['A', 'E', 'H', 'I', 'J'] },
  T85: { winner: 'B', allowed: ['E', 'F', 'G', 'I', 'J'] },
  T87: { winner: 'K', allowed: ['D', 'E', 'I', 'J', 'L'] },
};

// Full bracket tree. Each side is a reference resolved at runtime:
//   { w:'E' }      winner of group E
//   { ru:'A' }     runner-up of group A
//   { third:'T74' } best-third assigned to slot T74
//   { winOf:'M74' } winner of match M74
//   { loseOf:'M101' } loser of match M101
// kickoff = UTC instant (used to lock each match at its real start time).
const KO_MATCHES = [
  // Round of 32
  { id: 'M73', round: 'R32', kickoff: '2026-06-28T19:00:00Z', home: { ru: 'A' }, away: { ru: 'B' } },
  { id: 'M74', round: 'R32', kickoff: '2026-06-29T20:30:00Z', home: { w: 'E' },  away: { third: 'T74' } },
  { id: 'M75', round: 'R32', kickoff: '2026-06-30T01:00:00Z', home: { w: 'F' },  away: { ru: 'C' } },
  { id: 'M76', round: 'R32', kickoff: '2026-06-29T17:00:00Z', home: { w: 'C' },  away: { ru: 'F' } },
  { id: 'M77', round: 'R32', kickoff: '2026-06-30T21:00:00Z', home: { w: 'I' },  away: { third: 'T77' } },
  { id: 'M78', round: 'R32', kickoff: '2026-06-30T17:00:00Z', home: { ru: 'E' }, away: { ru: 'I' } },
  { id: 'M79', round: 'R32', kickoff: '2026-07-01T01:00:00Z', home: { w: 'A' },  away: { third: 'T79' } },
  { id: 'M80', round: 'R32', kickoff: '2026-07-01T16:00:00Z', home: { w: 'L' },  away: { third: 'T80' } },
  { id: 'M81', round: 'R32', kickoff: '2026-07-02T00:00:00Z', home: { w: 'D' },  away: { third: 'T81' } },
  { id: 'M82', round: 'R32', kickoff: '2026-07-01T20:00:00Z', home: { w: 'G' },  away: { third: 'T82' } },
  { id: 'M83', round: 'R32', kickoff: '2026-07-02T23:00:00Z', home: { ru: 'K' }, away: { ru: 'L' } },
  { id: 'M84', round: 'R32', kickoff: '2026-07-02T19:00:00Z', home: { w: 'H' },  away: { ru: 'J' } },
  { id: 'M85', round: 'R32', kickoff: '2026-07-03T03:00:00Z', home: { w: 'B' },  away: { third: 'T85' } },
  { id: 'M86', round: 'R32', kickoff: '2026-07-03T22:00:00Z', home: { w: 'J' },  away: { ru: 'H' } },
  { id: 'M87', round: 'R32', kickoff: '2026-07-04T01:30:00Z', home: { w: 'K' },  away: { third: 'T87' } },
  { id: 'M88', round: 'R32', kickoff: '2026-07-03T18:00:00Z', home: { ru: 'D' }, away: { ru: 'G' } },
  // Round of 16
  { id: 'M89', round: 'R16', kickoff: '2026-07-04T21:00:00Z', home: { winOf: 'M74' }, away: { winOf: 'M77' } },
  { id: 'M90', round: 'R16', kickoff: '2026-07-04T17:00:00Z', home: { winOf: 'M73' }, away: { winOf: 'M75' } },
  { id: 'M91', round: 'R16', kickoff: '2026-07-05T20:00:00Z', home: { winOf: 'M76' }, away: { winOf: 'M78' } },
  { id: 'M92', round: 'R16', kickoff: '2026-07-06T00:00:00Z', home: { winOf: 'M79' }, away: { winOf: 'M80' } },
  { id: 'M93', round: 'R16', kickoff: '2026-07-06T19:00:00Z', home: { winOf: 'M83' }, away: { winOf: 'M84' } },
  { id: 'M94', round: 'R16', kickoff: '2026-07-07T00:00:00Z', home: { winOf: 'M81' }, away: { winOf: 'M82' } },
  { id: 'M95', round: 'R16', kickoff: '2026-07-07T16:00:00Z', home: { winOf: 'M86' }, away: { winOf: 'M88' } },
  { id: 'M96', round: 'R16', kickoff: '2026-07-07T20:00:00Z', home: { winOf: 'M85' }, away: { winOf: 'M87' } },
  // Quarterfinals
  { id: 'M97',  round: 'QF', kickoff: '2026-07-09T20:00:00Z', home: { winOf: 'M89' }, away: { winOf: 'M90' } },
  { id: 'M98',  round: 'QF', kickoff: '2026-07-10T19:00:00Z', home: { winOf: 'M93' }, away: { winOf: 'M94' } },
  { id: 'M99',  round: 'QF', kickoff: '2026-07-11T21:00:00Z', home: { winOf: 'M91' }, away: { winOf: 'M92' } },
  { id: 'M100', round: 'QF', kickoff: '2026-07-12T01:00:00Z', home: { winOf: 'M95' }, away: { winOf: 'M96' } },
  // Semifinals
  { id: 'M101', round: 'SF', kickoff: '2026-07-14T19:00:00Z', home: { winOf: 'M97' }, away: { winOf: 'M98' } },
  { id: 'M102', round: 'SF', kickoff: '2026-07-15T19:00:00Z', home: { winOf: 'M99' }, away: { winOf: 'M100' } },
  // Third place & Final
  { id: 'M103', round: '3P', kickoff: '2026-07-18T21:00:00Z', home: { loseOf: 'M101' }, away: { loseOf: 'M102' } },
  { id: 'M104', round: 'F',  kickoff: '2026-07-19T19:00:00Z', home: { winOf: 'M101' },  away: { winOf: 'M102' } },
];

// A match is locked (no more predictions) once its kick-off has passed.
function matchLocked(kickoff) { return Date.now() >= new Date(kickoff).getTime(); }
function allMatches() { return MATCHES.concat(KO_MATCHES); }

// Calendar day (Madrid time) used to group matches into day tabs.
function madridDayKey(kickoff) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date(kickoff));
}

function getKoMatch(id)        { return KO_MATCHES.find(m => m.id === id); }
function getKoMatchesByRound(r){ return KO_MATCHES.filter(m => m.round === r); }

function getOutcome(home, away) {
  if (home > away) return 'H';
  if (home < away) return 'A';
  return 'D';
}

function calculatePoints(pred, result) {
  if (!result || result.status !== 'finished') return 0;
  const predOutcome = getOutcome(pred.home, pred.away);
  const resOutcome  = getOutcome(result.home, result.away);
  if (predOutcome !== resOutcome) return 0;
  if (pred.home === result.home && pred.away === result.away) return GROUP_POINTS.exact;
  return GROUP_POINTS.outcome;
}

// ── Eliminatorias (a vida o muerte): 7 / 5 / 0.
//   Hay DOS cosas que acertar: (a) el MARCADOR exacto y (b) QUIÉN PASA la eliminatoria.
//   · 7 = lo clavas TODO: marcador exacto Y quién pasa (en empate, el ganador de penaltis).
//   · 5 = aciertas UNA sola: quién pasa, o el marcador, pero no las dos.
//   · 0 = no aciertas ninguna.
//   "Quién pasa" según tu pronóstico = el equipo que marca más; si pronosticas empate, tu
//   pick de penaltis. El que pasa de verdad = realWinner (lo registra el admin). Ejemplos
//   (empate 1-1, dices que pasa A): real 2-2 pasa B → 0 · real 2-2 pasa A → 5 (quién pasa)
//   · real 1-1 pasa B → 5 (marcador) · real 1-1 pasa A → 7 · real 2-1 pasa A → 5.
//   penPick/realWinner = nombres de equipo; homeTeam/awayTeam = equipos del cruce.
function koMatchPoints(pred, result, penPick, realWinner, homeTeam, awayTeam) {
  if (!result || result.status !== 'finished') return 0;
  const exact = (pred.home === result.home && pred.away === result.away); // marcador clavado
  // Equipo que PASA según cada uno: el que marca más; si empata, el pick de penaltis.
  const predAdv = pred.home > pred.away ? homeTeam
                : pred.away > pred.home ? awayTeam
                : (penPick || null);
  const realAdv = realWinner
                || (result.home > result.away ? homeTeam
                  : result.away > result.home ? awayTeam : null);
  const advOk = predAdv != null && realAdv != null && predAdv === realAdv; // acertaste quién pasa
  // Cuenta cuántas de las dos clavaste: 2 → 7 · 1 → 5 · 0 → 0.
  const hits = (exact ? 1 : 0) + (advOk ? 1 : 0);
  return hits === 2 ? KO_MATCH_POINTS.exact : hits === 1 ? KO_MATCH_POINTS.outcome : 0;
}
// ¿Es un partido de eliminatoria? (sus ids empiezan por 'M': M73…M104)
function isKoId(id) { return !!id && String(id)[0] === 'M'; }
// Puntos de un partido cualquiera, eligiendo el baremo (grupos 5/3 · KO 5/7).
// penPick/realWinner/homeTeam/awayTeam solo se usan en eliminatorias.
function pointsFor(id, pred, result, penPick, realWinner, homeTeam, awayTeam) {
  return isKoId(id) ? koMatchPoints(pred, result, penPick, realWinner, homeTeam, awayTeam) : calculatePoints(pred, result);
}
// ¿Marcador EXACTO acertado? (para contar ⭐ sin depender del valor 5/7).
function isExactHit(pred, result) {
  return !!result && result.status === 'finished'
    && pred.home === result.home && pred.away === result.away;
}
