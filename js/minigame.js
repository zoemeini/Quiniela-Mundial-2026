// ============================================================
//  Minijuego diario — burbuja flotante 🎮 «Reto del día»
//  EN PRUEBAS: solo en el panel de admin (los amigos aún no lo ven).
//
//  CADA DÍA ROTA UN MODO/TEMA distinto (igual para todos, por fecha):
//   · ¿Más o menos?  → 9 temas (valor, goles Mundial, altura, edad,
//     seguidores IG, goles Champions, partidos selección, fichaje,
//     victorias en Mundiales).
//   · Adivina con pistas → adivina al jugador con pistas que se van
//     revelando; cuantas menos necesites, más puntos.
//
//  15 s por pregunta en «¿Más o menos?» y 45 s por reto en «Pistas»
//  (para que no dé tiempo a buscar la respuesta).
//
//  Depende de data.js (madridDayKey, formatKickoff).
// ============================================================

// ── Datos de «¿Más o menos?» (valores APROXIMADOS, fáciles de editar) ──
const MG_THEMES = [
  { key: 'valor', emoji: '💰', label: 'Valor de mercado', sub: 'valor de mercado', unit: 'M€', verb: 'vale', metric: '', players: [
    { n: 'Vinícius Júnior', iso: 'br', v: 200 }, { n: 'Kylian Mbappé', iso: 'fr', v: 180 },
    { n: 'Erling Haaland', iso: 'no', v: 180 }, { n: 'Jude Bellingham', iso: 'gb-eng', v: 180 },
    { n: 'Lamine Yamal', iso: 'es', v: 180 }, { n: 'Florian Wirtz', iso: 'de', v: 140 },
    { n: 'Jamal Musiala', iso: 'de', v: 140 }, { n: 'Bukayo Saka', iso: 'gb-eng', v: 140 },
    { n: 'Rodri', iso: 'es', v: 130 }, { n: 'Phil Foden', iso: 'gb-eng', v: 130 },
    { n: 'Cole Palmer', iso: 'gb-eng', v: 130 }, { n: 'Federico Valverde', iso: 'uy', v: 130 },
    { n: 'Lautaro Martínez', iso: 'ar', v: 110 }, { n: 'Harry Kane', iso: 'gb-eng', v: 100 },
    { n: 'Pedri', iso: 'es', v: 100 }, { n: 'Victor Osimhen', iso: 'ng', v: 100 },
    { n: 'Julián Álvarez', iso: 'ar', v: 90 }, { n: 'Rafael Leão', iso: 'pt', v: 75 },
    { n: 'Achraf Hakimi', iso: 'ma', v: 60 }, { n: 'Mohamed Salah', iso: 'eg', v: 50 },
    { n: 'Son Heung-min', iso: 'kr', v: 40 }, { n: 'Kevin De Bruyne', iso: 'be', v: 30 },
    { n: 'Lionel Messi', iso: 'ar', v: 30 }, { n: 'Antoine Griezmann', iso: 'fr', v: 25 },
    { n: 'Neymar Jr', iso: 'br', v: 20 }, { n: 'Cristiano Ronaldo', iso: 'pt', v: 15 },
    { n: 'Luka Modrić', iso: 'hr', v: 10 },
  ] },
  { key: 'goles', emoji: '⚽', label: 'Goles en Mundiales', sub: 'goles en Mundiales (histórico)', unit: 'goles', verb: 'tiene', metric: 'goles en Mundiales', players: [
    { n: 'Miroslav Klose', iso: 'de', v: 16 }, { n: 'Ronaldo Nazário', iso: 'br', v: 15 },
    { n: 'Gerd Müller', iso: 'de', v: 14 }, { n: 'Just Fontaine', iso: 'fr', v: 13 },
    { n: 'Lionel Messi', iso: 'ar', v: 13 }, { n: 'Pelé', iso: 'br', v: 12 },
    { n: 'Kylian Mbappé', iso: 'fr', v: 12 }, { n: 'Jürgen Klinsmann', iso: 'de', v: 11 },
    { n: 'Sándor Kocsis', iso: 'hu', v: 11 }, { n: 'Gabriel Batistuta', iso: 'ar', v: 10 },
    { n: 'Gary Lineker', iso: 'gb-eng', v: 10 }, { n: 'Thomas Müller', iso: 'de', v: 10 },
    { n: 'Roberto Baggio', iso: 'it', v: 9 }, { n: 'Paolo Rossi', iso: 'it', v: 9 },
    { n: 'Diego Maradona', iso: 'ar', v: 8 }, { n: 'Cristiano Ronaldo', iso: 'pt', v: 8 },
    { n: 'Neymar Jr', iso: 'br', v: 8 }, { n: 'Rivaldo', iso: 'br', v: 8 },
    { n: 'Davor Šuker', iso: 'hr', v: 6 }, { n: 'Salvatore Schillaci', iso: 'it', v: 6 },
    { n: 'Geoff Hurst', iso: 'gb-eng', v: 5 }, { n: 'Zinedine Zidane', iso: 'fr', v: 5 },
  ] },
  { key: 'altura', emoji: '📏', label: 'Altura', sub: 'altura', unit: 'cm', verb: 'mide', metric: '', players: [
    { n: 'Thibaut Courtois', iso: 'be', v: 199 }, { n: 'Erling Haaland', iso: 'no', v: 195 },
    { n: 'Virgil van Dijk', iso: 'nl', v: 193 }, { n: 'Manuel Neuer', iso: 'de', v: 193 },
    { n: 'Rodri', iso: 'es', v: 191 }, { n: 'Romelu Lukaku', iso: 'be', v: 191 },
    { n: 'Harry Kane', iso: 'gb-eng', v: 188 }, { n: 'Cristiano Ronaldo', iso: 'pt', v: 187 },
    { n: 'Jude Bellingham', iso: 'gb-eng', v: 186 }, { n: 'Robert Lewandowski', iso: 'pl', v: 185 },
    { n: 'Son Heung-min', iso: 'kr', v: 183 }, { n: 'Kevin De Bruyne', iso: 'be', v: 181 },
    { n: 'Lamine Yamal', iso: 'es', v: 180 }, { n: 'Bruno Fernandes', iso: 'pt', v: 179 },
    { n: 'Kylian Mbappé', iso: 'fr', v: 178 }, { n: 'Vinícius Júnior', iso: 'br', v: 176 },
    { n: 'Neymar Jr', iso: 'br', v: 175 }, { n: 'Mohamed Salah', iso: 'eg', v: 175 },
    { n: 'Pedri', iso: 'es', v: 174 }, { n: 'Luka Modrić', iso: 'hr', v: 172 },
    { n: 'Antoine Griezmann', iso: 'fr', v: 172 }, { n: 'Lionel Messi', iso: 'ar', v: 170 },
  ] },
  { key: 'edad', emoji: '🎂', label: 'Edad (2026)', sub: 'edad en 2026', unit: 'años', verb: 'tiene', metric: 'años', players: [
    { n: 'Pepe', iso: 'pt', v: 43 }, { n: 'Cristiano Ronaldo', iso: 'pt', v: 41 },
    { n: 'Luka Modrić', iso: 'hr', v: 40 }, { n: 'Luis Suárez', iso: 'uy', v: 39 },
    { n: 'Lionel Messi', iso: 'ar', v: 38 }, { n: 'Karim Benzema', iso: 'fr', v: 38 },
    { n: 'Ángel Di María', iso: 'ar', v: 38 }, { n: 'Robert Lewandowski', iso: 'pl', v: 37 },
    { n: 'Antoine Griezmann', iso: 'fr', v: 35 }, { n: 'Neymar Jr', iso: 'br', v: 34 },
    { n: 'Kevin De Bruyne', iso: 'be', v: 34 }, { n: 'Mohamed Salah', iso: 'eg', v: 33 },
    { n: 'Harry Kane', iso: 'gb-eng', v: 32 }, { n: 'Kylian Mbappé', iso: 'fr', v: 27 },
    { n: 'Vinícius Júnior', iso: 'br', v: 25 }, { n: 'Erling Haaland', iso: 'no', v: 25 },
    { n: 'Jamal Musiala', iso: 'de', v: 23 }, { n: 'Florian Wirtz', iso: 'de', v: 23 },
    { n: 'Pedri', iso: 'es', v: 23 }, { n: 'Jude Bellingham', iso: 'gb-eng', v: 22 },
    { n: 'Gavi', iso: 'es', v: 21 }, { n: 'Pau Cubarsí', iso: 'es', v: 19 },
    { n: 'Lamine Yamal', iso: 'es', v: 18 },
  ] },
  { key: 'instagram', emoji: '📱', label: 'Seguidores en Instagram', sub: 'seguidores en Instagram (aprox.)', unit: 'M', verb: 'tiene', metric: 'seguidores', players: [
    { n: 'Cristiano Ronaldo', iso: 'pt', v: 650 }, { n: 'Lionel Messi', iso: 'ar', v: 510 },
    { n: 'Neymar Jr', iso: 'br', v: 230 }, { n: 'Kylian Mbappé', iso: 'fr', v: 120 },
    { n: 'David Beckham', iso: 'gb-eng', v: 88 }, { n: 'Ronaldinho', iso: 'br', v: 80 },
    { n: 'Karim Benzema', iso: 'fr', v: 75 }, { n: 'Mohamed Salah', iso: 'eg', v: 70 },
    { n: 'Sergio Ramos', iso: 'es', v: 65 }, { n: 'Paul Pogba', iso: 'fr', v: 60 },
    { n: 'Marcelo', iso: 'br', v: 58 }, { n: 'James Rodríguez', iso: 'co', v: 50 },
    { n: 'Vinícius Júnior', iso: 'br', v: 50 }, { n: 'Erling Haaland', iso: 'no', v: 45 },
    { n: 'Jude Bellingham', iso: 'gb-eng', v: 42 }, { n: 'Lamine Yamal', iso: 'es', v: 40 },
    { n: 'Robert Lewandowski', iso: 'pl', v: 38 }, { n: 'Luka Modrić', iso: 'hr', v: 30 },
    { n: 'Kevin De Bruyne', iso: 'be', v: 18 }, { n: 'Harry Kane', iso: 'gb-eng', v: 17 },
  ] },
  { key: 'champions', emoji: '🥅', label: 'Goles en la Champions', sub: 'goles en la Champions (histórico)', unit: 'goles', verb: 'tiene', metric: 'goles en Champions', players: [
    { n: 'Cristiano Ronaldo', iso: 'pt', v: 140 }, { n: 'Lionel Messi', iso: 'ar', v: 129 },
    { n: 'Robert Lewandowski', iso: 'pl', v: 105 }, { n: 'Karim Benzema', iso: 'fr', v: 90 },
    { n: 'Raúl', iso: 'es', v: 71 }, { n: 'Thomas Müller', iso: 'de', v: 57 },
    { n: 'Ruud van Nistelrooy', iso: 'nl', v: 56 }, { n: 'Kylian Mbappé', iso: 'fr', v: 55 },
    { n: 'Erling Haaland', iso: 'no', v: 50 }, { n: 'Zlatan Ibrahimović', iso: 'se', v: 48 },
    { n: 'Mohamed Salah', iso: 'eg', v: 45 }, { n: 'Didier Drogba', iso: 'ci', v: 44 },
    { n: 'Neymar Jr', iso: 'br', v: 43 }, { n: 'Sergio Agüero', iso: 'ar', v: 41 },
    { n: 'Harry Kane', iso: 'gb-eng', v: 38 }, { n: 'Antoine Griezmann', iso: 'fr', v: 35 },
    { n: 'Ángel Di María', iso: 'ar', v: 30 }, { n: 'Vinícius Júnior', iso: 'br', v: 28 },
  ] },
  { key: 'caps', emoji: '🎽', label: 'Partidos con su selección', sub: 'partidos internacionales', unit: 'partidos', verb: 'tiene', metric: 'partidos con su selección', players: [
    { n: 'Cristiano Ronaldo', iso: 'pt', v: 220 }, { n: 'Lionel Messi', iso: 'ar', v: 190 },
    { n: 'Luka Modrić', iso: 'hr', v: 185 }, { n: 'Sergio Ramos', iso: 'es', v: 180 },
    { n: 'Robert Lewandowski', iso: 'pl', v: 155 }, { n: 'Ángel Di María', iso: 'ar', v: 145 },
    { n: 'Luis Suárez', iso: 'uy', v: 142 }, { n: 'Pepe', iso: 'pt', v: 140 },
    { n: 'Antoine Griezmann', iso: 'fr', v: 137 }, { n: 'Thomas Müller', iso: 'de', v: 131 },
    { n: 'Son Heung-min', iso: 'kr', v: 130 }, { n: 'Neymar Jr', iso: 'br', v: 128 },
    { n: 'Kevin De Bruyne', iso: 'be', v: 110 }, { n: 'Harry Kane', iso: 'gb-eng', v: 100 },
    { n: 'Karim Benzema', iso: 'fr', v: 97 }, { n: 'Mohamed Salah', iso: 'eg', v: 100 },
    { n: 'Kylian Mbappé', iso: 'fr', v: 90 }, { n: 'Jude Bellingham', iso: 'gb-eng', v: 40 },
    { n: 'Vinícius Júnior', iso: 'br', v: 40 }, { n: 'Lamine Yamal', iso: 'es', v: 20 },
  ] },
  { key: 'fichaje', emoji: '💸', label: 'Fichaje más caro', sub: 'su traspaso más caro', unit: 'M€', verb: 'costó', metric: '', players: [
    { n: 'Neymar Jr', iso: 'br', v: 222 }, { n: 'Kylian Mbappé', iso: 'fr', v: 180 },
    { n: 'Philippe Coutinho', iso: 'br', v: 145 }, { n: 'Ousmane Dembélé', iso: 'fr', v: 140 },
    { n: 'João Félix', iso: 'pt', v: 126 }, { n: 'Florian Wirtz', iso: 'de', v: 125 },
    { n: 'Enzo Fernández', iso: 'ar', v: 121 }, { n: 'Jack Grealish', iso: 'gb-eng', v: 117 },
    { n: 'Cristiano Ronaldo', iso: 'pt', v: 117 }, { n: 'Declan Rice', iso: 'gb-eng', v: 116 },
    { n: 'Moisés Caicedo', iso: 'ec', v: 116 }, { n: 'Romelu Lukaku', iso: 'be', v: 113 },
    { n: 'Paul Pogba', iso: 'fr', v: 105 }, { n: 'Jude Bellingham', iso: 'gb-eng', v: 103 },
    { n: 'Gareth Bale', iso: 'gb-wls', v: 101 }, { n: 'Antony', iso: 'br', v: 95 },
    { n: 'Harry Maguire', iso: 'gb-eng', v: 87 }, { n: 'Rúben Dias', iso: 'pt', v: 68 },
  ] },
  { key: 'selecciones', emoji: '🏆', label: 'Victorias en Mundiales', sub: 'partidos ganados en Mundiales (histórico)', unit: 'victorias', verb: 'tiene', metric: 'victorias en Mundiales', players: [
    { n: 'Brasil', iso: 'br', v: 76 }, { n: 'Alemania', iso: 'de', v: 68 },
    { n: 'Argentina', iso: 'ar', v: 47 }, { n: 'Italia', iso: 'it', v: 45 },
    { n: 'Francia', iso: 'fr', v: 39 }, { n: 'Inglaterra', iso: 'gb-eng', v: 32 },
    { n: 'España', iso: 'es', v: 31 }, { n: 'Países Bajos', iso: 'nl', v: 30 },
    { n: 'Uruguay', iso: 'uy', v: 24 }, { n: 'Bélgica', iso: 'be', v: 20 },
    { n: 'Suecia', iso: 'se', v: 19 }, { n: 'México', iso: 'mx', v: 16 },
    { n: 'Portugal', iso: 'pt', v: 14 }, { n: 'Croacia', iso: 'hr', v: 13 },
    { n: 'Chile', iso: 'cl', v: 11 }, { n: 'Estados Unidos', iso: 'us', v: 9 },
    { n: 'Japón', iso: 'jp', v: 6 }, { n: 'Marruecos', iso: 'ma', v: 5 },
  ] },
];

// ── Datos de «Adivina con pistas» (datos APROXIMADOS, fáciles de editar) ──
const MG_PISTAS_POOL = [
  { n: 'Kylian Mbappé', iso: 'fr', pais: 'Francia', pos: 'Delantero', club: 'Real Madrid', age: 27, num: 9 },
  { n: 'Erling Haaland', iso: 'no', pais: 'Noruega', pos: 'Delantero', club: 'Manchester City', age: 25, num: 9 },
  { n: 'Vinícius Júnior', iso: 'br', pais: 'Brasil', pos: 'Delantero', club: 'Real Madrid', age: 25, num: 7 },
  { n: 'Jude Bellingham', iso: 'gb-eng', pais: 'Inglaterra', pos: 'Centrocampista', club: 'Real Madrid', age: 22, num: 5 },
  { n: 'Lamine Yamal', iso: 'es', pais: 'España', pos: 'Delantero', club: 'FC Barcelona', age: 18, num: 19 },
  { n: 'Pedri', iso: 'es', pais: 'España', pos: 'Centrocampista', club: 'FC Barcelona', age: 23, num: 8 },
  { n: 'Gavi', iso: 'es', pais: 'España', pos: 'Centrocampista', club: 'FC Barcelona', age: 21, num: 6 },
  { n: 'Rodri', iso: 'es', pais: 'España', pos: 'Centrocampista', club: 'Manchester City', age: 29, num: 16 },
  { n: 'Lionel Messi', iso: 'ar', pais: 'Argentina', pos: 'Delantero', club: 'Inter Miami', age: 38, num: 10 },
  { n: 'Cristiano Ronaldo', iso: 'pt', pais: 'Portugal', pos: 'Delantero', club: 'Al-Nassr', age: 41, num: 7 },
  { n: 'Neymar Jr', iso: 'br', pais: 'Brasil', pos: 'Delantero', club: 'Santos', age: 34, num: 10 },
  { n: 'Mohamed Salah', iso: 'eg', pais: 'Egipto', pos: 'Delantero', club: 'Liverpool', age: 33, num: 11 },
  { n: 'Harry Kane', iso: 'gb-eng', pais: 'Inglaterra', pos: 'Delantero', club: 'Bayern Múnich', age: 32, num: 9 },
  { n: 'Robert Lewandowski', iso: 'pl', pais: 'Polonia', pos: 'Delantero', club: 'FC Barcelona', age: 37, num: 9 },
  { n: 'Kevin De Bruyne', iso: 'be', pais: 'Bélgica', pos: 'Centrocampista', club: 'Napoli', age: 34, num: 11 },
  { n: 'Luka Modrić', iso: 'hr', pais: 'Croacia', pos: 'Centrocampista', club: 'Milan', age: 40, num: 10 },
  { n: 'Antoine Griezmann', iso: 'fr', pais: 'Francia', pos: 'Delantero', club: 'Atlético de Madrid', age: 35, num: 7 },
  { n: 'Bukayo Saka', iso: 'gb-eng', pais: 'Inglaterra', pos: 'Delantero', club: 'Arsenal', age: 24, num: 7 },
  { n: 'Phil Foden', iso: 'gb-eng', pais: 'Inglaterra', pos: 'Centrocampista', club: 'Manchester City', age: 25, num: 47 },
  { n: 'Jamal Musiala', iso: 'de', pais: 'Alemania', pos: 'Centrocampista', club: 'Bayern Múnich', age: 23, num: 42 },
  { n: 'Florian Wirtz', iso: 'de', pais: 'Alemania', pos: 'Centrocampista', club: 'Liverpool', age: 23, num: 10 },
  { n: 'Federico Valverde', iso: 'uy', pais: 'Uruguay', pos: 'Centrocampista', club: 'Real Madrid', age: 27, num: 15 },
  { n: 'Lautaro Martínez', iso: 'ar', pais: 'Argentina', pos: 'Delantero', club: 'Inter', age: 28, num: 10 },
  { n: 'Julián Álvarez', iso: 'ar', pais: 'Argentina', pos: 'Delantero', club: 'Atlético de Madrid', age: 26, num: 19 },
  { n: 'Victor Osimhen', iso: 'ng', pais: 'Nigeria', pos: 'Delantero', club: 'Galatasaray', age: 27, num: 9 },
  { n: 'Rafael Leão', iso: 'pt', pais: 'Portugal', pos: 'Delantero', club: 'Milan', age: 26, num: 10 },
  { n: 'Achraf Hakimi', iso: 'ma', pais: 'Marruecos', pos: 'Defensa', club: 'PSG', age: 27, num: 2 },
  { n: 'Virgil van Dijk', iso: 'nl', pais: 'Países Bajos', pos: 'Defensa', club: 'Liverpool', age: 34, num: 4 },
  { n: 'Rúben Dias', iso: 'pt', pais: 'Portugal', pos: 'Defensa', club: 'Manchester City', age: 28, num: 3 },
  { n: 'Thibaut Courtois', iso: 'be', pais: 'Bélgica', pos: 'Portero', club: 'Real Madrid', age: 33, num: 1 },
  { n: 'Gianluigi Donnarumma', iso: 'it', pais: 'Italia', pos: 'Portero', club: 'Manchester City', age: 27, num: 1 },
  { n: 'Alisson Becker', iso: 'br', pais: 'Brasil', pos: 'Portero', club: 'Liverpool', age: 33, num: 1 },
  { n: 'Son Heung-min', iso: 'kr', pais: 'Corea del Sur', pos: 'Delantero', club: 'Tottenham', age: 33, num: 7 },
];

// ── Calendario diario: qué modo/tema toca cada día (rota, igual para todos) ──
const MG_ROTATION = [
  { mode: 'mm', theme: 'valor' },
  { mode: 'pistas' },
  { mode: 'mm', theme: 'goles' },
  { mode: 'mm', theme: 'altura' },
  { mode: 'pistas' },
  { mode: 'mm', theme: 'edad' },
  { mode: 'mm', theme: 'instagram' },
  { mode: 'pistas' },
  { mode: 'mm', theme: 'champions' },
  { mode: 'mm', theme: 'caps' },
  { mode: 'pistas' },
  { mode: 'mm', theme: 'fichaje' },
  { mode: 'mm', theme: 'selecciones' },
];

(function () {
  // ── Estado del «shell» (común a todos los modos) ──
  let open = false, view = 'play', previewOffset = 0, started = false;
  let gameOver = false, busy = false;
  // Temporizador genérico
  let timerId = null, deadline = 0, totalMs = 0, onExpire = null, paused = false, pausedRemaining = 0;
  let Game = null; // modo activo

  const el = id => document.getElementById(id);
  const gameDate = () => { const d = new Date(); d.setDate(d.getDate() + previewOffset); return d; };
  const dayKey = () => madridDayKey(gameDate());
  const seedInt = () => parseInt(dayKey().replace(/-/g, ''), 10) || 1;
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  function dayOrdinal() { const p = dayKey().split('-'); return Math.floor(Date.UTC(+p[0], +p[1] - 1, +p[2]) / 86400000); }
  function currentEntry() { const i = ((dayOrdinal() % MG_ROTATION.length) + MG_ROTATION.length) % MG_ROTATION.length; return MG_ROTATION[i]; }
  function themeByKey(k) { return MG_THEMES.find(t => t.key === k) || MG_THEMES[0]; }
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function flag(iso) { return `<img class="team-flag-img" src="https://flagcdn.com/w40/${iso}.png" srcset="https://flagcdn.com/w80/${iso}.png 2x" alt="" loading="lazy">`; }
  function norm(s) { return (s || '').toString().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, '').trim().replace(/\s+/g, ' '); }
  const bestKey = () => 'wc2026_mg_best_' + dayKey();
  const getBest = () => parseInt(localStorage.getItem(bestKey()) || '0', 10) || 0;
  function setBest(v) { if (v > getBest()) localStorage.setItem(bestKey(), String(v)); }

  // ── Burbuja flotante 🎮 + panel ──
  const fab = document.createElement('button');
  fab.className = 'mg-fab'; fab.type = 'button';
  fab.setAttribute('aria-label', 'Reto del día');
  fab.innerHTML = '<span class="mg-fab-emoji">🎮</span><span class="mg-fab-label">Reto del día</span>';

  const panel = document.createElement('div');
  panel.className = 'mg-panel hidden';
  panel.innerHTML =
    '<div class="mg-panel-head">' +
      '<span class="mg-panel-title">🎮 Reto del día</span>' +
      '<button type="button" class="mg-close" id="mg-close" aria-label="Cerrar">✕</button>' +
    '</div>' +
    '<div class="mg-tabs">' +
      '<button type="button" class="mg-tab active" id="mg-tab-play">▶️ Jugar</button>' +
      '<button type="button" class="mg-tab" id="mg-tab-rank">🏆 Ranking</button>' +
    '</div>' +
    '<div id="mg-play-view">' +
      '<div class="mg-theme" id="mg-theme"></div>' +
      '<div class="mg-timer-row">' +
        '<div class="mg-timer-track"><div class="mg-timer-bar" id="mg-timer-bar"></div></div>' +
        '<span class="mg-timer-num" id="mg-timer-num">15s</span>' +
      '</div>' +
      '<div class="mg-hud" id="mg-hud"></div>' +
      '<div id="mg-board"></div>' +
      '<div class="mg-daypreview" id="mg-daypreview"></div>' +
    '</div>' +
    '<div id="mg-rank" class="hidden"></div>';

  document.body.appendChild(panel);
  document.body.appendChild(fab);

  fab.addEventListener('click', function () {
    open = !open;
    panel.classList.toggle('hidden', !open);
    fab.classList.toggle('active', open);
    if (open) { if (view === 'rank') renderRanking(); else if (!started) startDay(); else resumeGameTimer(); }
    else pauseGameTimer();
  });
  el('mg-close').addEventListener('click', function () { open = false; panel.classList.add('hidden'); fab.classList.remove('active'); pauseGameTimer(); });
  el('mg-tab-play').addEventListener('click', () => switchView('play'));
  el('mg-tab-rank').addEventListener('click', () => switchView('rank'));

  function switchView(v) {
    view = v;
    el('mg-tab-play').classList.toggle('active', v === 'play');
    el('mg-tab-rank').classList.toggle('active', v === 'rank');
    el('mg-play-view').classList.toggle('hidden', v !== 'play');
    el('mg-rank').classList.toggle('hidden', v !== 'rank');
    if (v === 'play') { if (!started) startDay(); else resumeGameTimer(); }
    else { pauseGameTimer(); renderRanking(); }
  }

  // ── Temporizador genérico ──
  function stopTimer() { if (timerId) { clearInterval(timerId); timerId = null; } }
  function startTimer(ms, expireCb) {
    stopTimer(); paused = false; totalMs = ms; onExpire = expireCb || null;
    deadline = Date.now() + ms; tick(); timerId = setInterval(tick, 150);
  }
  function pauseGameTimer() { if (!timerId || gameOver) return; pausedRemaining = Math.max(0, deadline - Date.now()); stopTimer(); paused = true; }
  function resumeGameTimer() { if (!paused || gameOver) return; paused = false; deadline = Date.now() + pausedRemaining; tick(); timerId = setInterval(tick, 150); }
  function tick() {
    const remaining = Math.max(0, deadline - Date.now());
    const pct = totalMs ? (remaining / totalMs) * 100 : 0;
    const low = remaining <= 5000;
    const bar = el('mg-timer-bar'), num = el('mg-timer-num');
    if (bar) { bar.style.width = pct + '%'; bar.classList.toggle('low', low); }
    if (num) { num.textContent = Math.ceil(remaining / 1000) + 's'; num.classList.toggle('low', low); }
    if (remaining <= 0) { stopTimer(); if (onExpire) onExpire(); }
  }
  function setHud(html) { const h = el('mg-hud'); if (h) h.innerHTML = html; }

  // ── Arranque del día: elige modo/tema y construye el juego ──
  function startDay() {
    const entry = currentEntry();
    gameOver = false; busy = false; started = true;
    const tb = el('mg-theme');
    if (entry.mode === 'pistas') { if (tb) tb.innerHTML = '🕵️ Reto de hoy: <b>Adivina con pistas</b>'; Game = PistasMode; }
    else { const t = themeByKey(entry.theme); if (tb) tb.innerHTML = `🎯 ¿Más o menos? · <b>${t.emoji} ${t.label}</b>`; Game = MasMenosMode; }
    Game.start();
    renderDayPreview();
  }

  // ===========================================================
  //  MODO 1 — ¿Más o menos?
  // ===========================================================
  const MasMenosMode = {
    theme: null, seq: [], idx: 0, score: 0,
    start() {
      this.theme = themeByKey(currentEntry().theme);
      const rng = mulberry32(seedInt());
      const arr = this.theme.players.slice();
      for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); const t = arr[i]; arr[i] = arr[j]; arr[j] = t; }
      const out = [], leftover = [];
      arr.forEach(p => { if (out.length === 0 || out[out.length - 1].v !== p.v) out.push(p); else leftover.push(p); });
      leftover.forEach(p => { for (let k = 1; k < out.length; k++) { if (out[k - 1].v !== p.v && out[k].v !== p.v) { out.splice(k, 0, p); break; } } });
      this.seq = out; this.idx = 0; this.score = 0; gameOver = false; busy = false;
      this.render();
    },
    fmt(v) { return v + ' ' + this.theme.unit; },
    render() {
      const wrap = el('mg-board'); if (!wrap) return;
      const A = this.seq[this.idx], B = this.seq[this.idx + 1];
      if (!B) { this.win(); return; }
      const metric = this.theme.metric ? ' ' + this.theme.metric : '';
      wrap.innerHTML = `
        <div class="mg-card">${flag(A.iso)}<div class="mg-name">${A.n}</div><div class="mg-sub">${this.theme.sub}</div><div class="mg-val">${this.fmt(A.v)}</div></div>
        <div class="mg-vs">¿<b>${B.n}</b> ${this.theme.verb} más o menos${metric}?</div>
        <div class="mg-card mg-card-b">${flag(B.iso)}<div class="mg-name">${B.n}</div><div class="mg-sub">${this.theme.sub}</div>
          <div class="mg-val mg-hidden" id="mg-bval">??? ${this.theme.unit}</div>
          <div class="mg-buttons">
            <button class="mg-btn mg-more" id="mg-more">⬆️ MÁS de ${this.fmt(A.v)}</button>
            <button class="mg-btn mg-less" id="mg-less">⬇️ MENOS</button>
          </div>
        </div>`;
      el('mg-more').addEventListener('click', () => this.guess('mas'));
      el('mg-less').addEventListener('click', () => this.guess('menos'));
      setHud(`Aciertos: <b>${this.score}</b> &nbsp;·&nbsp; Mejor de hoy: <b>${getBest()}</b> 🔥`);
      startTimer(15000, () => this.timeUp());
    },
    guess(dir) {
      if (busy || gameOver) return;
      busy = true; stopTimer();
      const A = this.seq[this.idx], B = this.seq[this.idx + 1];
      const ok = dir === (B.v > A.v ? 'mas' : 'menos');
      const bval = el('mg-bval');
      if (bval) { bval.textContent = this.fmt(B.v); bval.classList.remove('mg-hidden'); bval.classList.add(ok ? 'mg-ok' : 'mg-bad'); }
      ['mg-more', 'mg-less'].forEach(id => { const b = el(id); if (b) b.disabled = true; });
      if (ok) { this.score++; setBest(this.score); setTimeout(() => { this.idx++; busy = false; this.render(); }, 1000); }
      else { gameOver = true; setBest(this.score); setTimeout(() => this.end('wrong'), 1100); }
    },
    timeUp() {
      if (gameOver || busy) return;
      gameOver = true;
      const B = this.seq[this.idx + 1], bval = el('mg-bval');
      if (B && bval) { bval.textContent = this.fmt(B.v); bval.classList.remove('mg-hidden'); bval.classList.add('mg-bad'); }
      ['mg-more', 'mg-less'].forEach(id => { const b = el(id); if (b) b.disabled = true; });
      setBest(this.score); setTimeout(() => this.end('time'), 1000);
    },
    end(reason) {
      stopTimer(); resetTimerBar();
      const wrap = el('mg-board'); if (!wrap) return;
      const h = reason === 'time' ? { e: '⏰', t: '¡Se acabó el tiempo!' } : { e: '😅', t: '¡Fallaste!' };
      wrap.innerHTML = `<div class="mg-end"><div class="mg-end-emoji">${h.e}</div><h3>${h.t}</h3>
        <p>Aciertos seguidos: <b>${this.score}</b></p><p class="mg-end-best">Mejor de hoy: <b>${getBest()}</b> 🔥</p>
        <button class="btn-primary" id="mg-again">Jugar otra vez</button>
        <p class="mg-note">⚙️ Beta. En la versión final: 1 partida al día + ranking entre amigos.</p></div>`;
      el('mg-again').addEventListener('click', () => this.start());
      setHud(`Aciertos: <b>${this.score}</b> &nbsp;·&nbsp; Mejor de hoy: <b>${getBest()}</b> 🔥`);
    },
    win() {
      stopTimer(); resetTimerBar();
      const wrap = el('mg-board'); if (!wrap) return;
      wrap.innerHTML = `<div class="mg-end"><div class="mg-end-emoji">🏆</div><h3>¡Los has acertado TODOS!</h3>
        <p>Puntuación máxima: <b>${this.score}</b></p><button class="btn-primary" id="mg-again">Jugar otra vez</button></div>`;
      el('mg-again').addEventListener('click', () => this.start());
    },
  };

  // ===========================================================
  //  MODO 2 — Adivina con pistas
  // ===========================================================
  const PistasMode = {
    secret: null, clues: [], shown: 1, attempts: 0, max: 6, solved: false,
    start() {
      const rng = mulberry32(seedInt() ^ 0x9e3779b9); // semilla distinta de ¿Más o menos?
      this.secret = MG_PISTAS_POOL[Math.floor(rng() * MG_PISTAS_POOL.length)];
      const p = this.secret;
      this.clues = [
        { k: 'Posición', v: p.pos },
        { k: 'Edad', v: p.age + ' años' },
        { k: 'País', v: `${flag(p.iso)} ${p.pais}` },
        { k: 'Club', v: p.club },
        { k: 'Dorsal', v: '#' + p.num },
      ];
      this.shown = 1; this.attempts = 0; this.solved = false; gameOver = false; busy = false;
      this.render();
      startTimer(45000, () => this.timeUp());
    },
    points() { return Math.max(1, 7 - (this.attempts + 1)); }, // puntos si aciertas en el PRÓXIMO intento
    render() {
      const wrap = el('mg-board'); if (!wrap) return;
      const opts = MG_PISTAS_POOL.map(p => `<option value="${p.n}"></option>`).join('');
      let cluesHtml = '';
      this.clues.forEach((c, i) => {
        const locked = i >= this.shown;
        cluesHtml += `<div class="mg-clue${locked ? ' locked' : ''}"><b>${c.k}:</b> ${locked ? '🔒' : c.v}</div>`;
      });
      wrap.innerHTML = `
        <div class="mg-clues">${cluesHtml}</div>
        <div class="mg-guess-row">
          <input class="mg-guess-input" id="mg-guess" list="mg-pool" placeholder="¿Quién es?" autocomplete="off">
          <button class="mg-guess-btn" id="mg-guess-btn">Adivinar</button>
        </div>
        <datalist id="mg-pool">${opts}</datalist>
        <div class="mg-pts-hint">Vale ahora: <b>${this.points()}</b> pts · Intento ${this.attempts + 1}/${this.max}</div>
        <div class="mg-tries" id="mg-tries"></div>`;
      el('mg-guess-btn').addEventListener('click', () => this.guess());
      el('mg-guess').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); this.guess(); } });
      setHud(`Adivina al jugador · Mejor de hoy: <b>${getBest()}</b> 🔥`);
      this.renderTries();
    },
    renderTries() {
      const t = el('mg-tries'); if (!t) return;
      t.innerHTML = (this._tries || []).map(g => `<span class="mg-try bad">✗ ${g}</span>`).join('');
    },
    matches(input) {
      const g = norm(input);
      if (!g) return false;
      const full = norm(this.secret.n);
      const words = full.split(' ');
      return g === full || (g.length >= 3 && words.includes(g));
    },
    guess() {
      if (busy || gameOver) return;
      const inp = el('mg-guess'); if (!inp) return;
      const val = inp.value.trim();
      if (!val) return;
      this.attempts++;
      if (this.matches(val)) { this.solved = true; gameOver = true; stopTimer(); this.end(true); return; }
      // fallo: guarda el intento, revela una pista más
      (this._tries = this._tries || []).push(val);
      if (this.shown < this.clues.length) this.shown++;
      if (this.attempts >= this.max) { gameOver = true; stopTimer(); this.end(false); return; }
      this.render();
      const ni = el('mg-guess'); if (ni) ni.focus();
    },
    timeUp() { if (gameOver || busy) return; gameOver = true; this.end(false, true); },
    end(win, byTime) {
      stopTimer(); resetTimerBar();
      const wrap = el('mg-board'); if (!wrap) return;
      const score = win ? Math.max(1, 7 - this.attempts) : 0;
      if (win) setBest(score);
      const head = win ? { e: '✅', t: `¡Acertaste! (${this.attempts}/${this.max})` }
                       : { e: byTime ? '⏰' : '❌', t: byTime ? '¡Se acabó el tiempo!' : '¡No era!' };
      wrap.innerHTML = `<div class="mg-end"><div class="mg-end-emoji">${head.e}</div><h3>${head.t}</h3>
        <div class="mg-reveal">${flag(this.secret.iso)} <b>${this.secret.n}</b><br><span class="mg-reveal-sub">${this.secret.pos} · ${this.secret.club} · #${this.secret.num}</span></div>
        ${win ? `<p>Has ganado <b>${score}</b> pts.</p>` : ''}
        <p class="mg-end-best">Mejor de hoy: <b>${getBest()}</b> 🔥</p>
        <button class="btn-primary" id="mg-again">Jugar otra vez</button>
        <p class="mg-note">⚙️ Beta. En la versión final: 1 partida al día + ranking entre amigos.</p></div>`;
      el('mg-again').addEventListener('click', () => { this._tries = []; this.start(); });
      setHud(`Adivina al jugador · Mejor de hoy: <b>${getBest()}</b> 🔥`);
    },
  };

  function resetTimerBar() {
    const bar = el('mg-timer-bar'), num = el('mg-timer-num');
    if (bar) { bar.style.width = '100%'; bar.classList.remove('low'); }
    if (num) { num.textContent = '–'; num.classList.remove('low'); }
  }

  // ── Beta: previsualizar el reto (modo/tema) de otros días ──
  function renderDayPreview() {
    const dp = el('mg-daypreview'); if (!dp) return;
    const isToday = previewOffset === 0;
    const lbl = cap(formatKickoff(dayKey() + 'T12:00:00Z').date);
    const entry = currentEntry();
    const modeLbl = entry.mode === 'pistas' ? '🕵️ Adivina con pistas' : (themeByKey(entry.theme).emoji + ' ' + themeByKey(entry.theme).label);
    dp.innerHTML =
      '🔧 <b>Beta</b> · ver otro día: ' +
      '<button class="mg-day-arrow" id="mg-day-prev" aria-label="Día anterior">‹</button>' +
      `<span class="mg-day-lbl">${isToday ? 'Hoy' : lbl}</span>` +
      '<button class="mg-day-arrow" id="mg-day-next" aria-label="Día siguiente">›</button>' +
      `<span class="mg-day-theme">${modeLbl}</span>` +
      (isToday ? '' : ' <button class="mg-day-reset" id="mg-day-reset">Volver a hoy</button>');
    el('mg-day-prev').addEventListener('click', () => { previewOffset--; startDay(); });
    el('mg-day-next').addEventListener('click', () => { previewOffset++; startDay(); });
    const r = el('mg-day-reset'); if (r) r.addEventListener('click', () => { previewOffset = 0; startDay(); });
  }

  // ── Ranking (DATOS DE EJEMPLO — aún no hay backend del juego) ──
  function renderRanking() {
    const rank = el('mg-rank'); if (!rank) return;
    const me = (localStorage.getItem('wc2026_username') || 'Tú').trim() || 'Tú';
    const best = getBest();
    const demo = [
      { n: 'Albert', s: 6, st: 6 }, { n: 'Alex Martos', s: 5, st: 4 },
      { n: 'Marc', s: 5, st: 5 }, { n: me + ' (tú)', s: best, st: 1, me: true },
      { n: 'Laura', s: 4, st: 2 }, { n: 'Jordi', s: 3, st: 3 },
    ];
    demo.sort((a, b) => b.s - a.s || b.st - a.st);
    const medals = ['🥇', '🥈', '🥉'];
    let rows = '';
    demo.forEach((d, i) => {
      rows += `<div class="mg-rank-row${d.me ? ' me' : ''}"><span class="mg-rank-pos">${i < 3 ? medals[i] : (i + 1)}</span>` +
        `<span class="mg-rank-name">${d.n}</span><span class="mg-rank-streak">🔥 ${d.st}</span><span class="mg-rank-score">${d.s}</span></div>`;
    });
    rank.innerHTML =
      '<div class="mg-rank-head">🏆 Ranking del día <span class="mg-rank-tag">EJEMPLO</span></div>' +
      '<div class="mg-rank-sub">Puntos del reto de hoy · 🔥 = días seguidos jugando (racha)</div>' +
      '<div class="mg-rank-list">' + rows + '</div>' +
      '<p class="mg-note">Vista previa con datos inventados. En la versión final se guardarán las puntuaciones reales de tus amigos cada día.</p>';
  }
})();
