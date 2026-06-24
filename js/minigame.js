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
//   · Wordle de jugadores → adivina el apellido de un futbolista en
//     6 intentos con pistas de color (verde/amarillo/gris). SIN crono.
//   · ¿Quién es este jugador? → foto (de Wikipedia) muy ampliada que se va
//     alejando con cada fallo hasta verse entera.
//   · Goles míticos → marca en la portería por dónde crees que entró un gol
//     mítico; puntúas según lo cerca que estés del punto real.
//   · Sudoku de fútbol → sudoku 6×6 con emojis de fútbol; puntúas por tiempo.
//
//  Algunos llevan crono (15 s ¿Más o menos?, 45 s Pistas y Foto) para que no
//  dé tiempo a buscar la respuesta; Wordle, Goles míticos y Sudoku no.
//
//  Depende de data.js (madridDayKey, formatKickoff).
// ============================================================

// ── Datos de «¿Más o menos?» (valores APROXIMADOS, fáciles de editar) ──
const MG_THEMES = [
  { key: 'valor', emoji: '💰', label: 'Valor de mercado', sub: 'valor de mercado', unit: 'M€', verb: 'vale', metric: '', players: [
    // Valores Transfermarkt aprox. junio 2026 (orden descendente).
    { n: 'Kylian Mbappé', iso: 'fr', v: 200 }, { n: 'Lamine Yamal', iso: 'es', v: 200 },
    { n: 'Erling Haaland', iso: 'no', v: 200 }, { n: 'Jude Bellingham', iso: 'gb-eng', v: 160 },
    { n: 'Vinícius Júnior', iso: 'br', v: 150 }, { n: 'Pedri', iso: 'es', v: 140 },
    { n: 'Florian Wirtz', iso: 'de', v: 140 }, { n: 'Jamal Musiala', iso: 'de', v: 140 },
    { n: 'Bukayo Saka', iso: 'gb-eng', v: 120 }, { n: 'Cole Palmer', iso: 'gb-eng', v: 110 },
    { n: 'Lautaro Martínez', iso: 'ar', v: 100 }, { n: 'Federico Valverde', iso: 'uy', v: 90 },
    { n: 'Julián Álvarez', iso: 'ar', v: 90 }, { n: 'Harry Kane', iso: 'gb-eng', v: 90 },
    { n: 'Phil Foden', iso: 'gb-eng', v: 85 }, { n: 'Achraf Hakimi', iso: 'ma', v: 80 },
    { n: 'Victor Osimhen', iso: 'ng', v: 75 }, { n: 'Rafael Leão', iso: 'pt', v: 70 },
    { n: 'Rodri', iso: 'es', v: 50 }, { n: 'Mohamed Salah', iso: 'eg', v: 35 },
    { n: 'Son Heung-min', iso: 'kr', v: 25 }, { n: 'Lionel Messi', iso: 'ar', v: 25 },
    { n: 'Antoine Griezmann', iso: 'fr', v: 20 }, { n: 'Kevin De Bruyne', iso: 'be', v: 18 },
    { n: 'Neymar Jr', iso: 'br', v: 18 }, { n: 'Cristiano Ronaldo', iso: 'pt', v: 12 },
    { n: 'Luka Modrić', iso: 'hr', v: 8 },
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
  { n: 'Son Heung-min', iso: 'kr', pais: 'Corea del Sur', pos: 'Delantero', club: 'LAFC', age: 33, num: 7 },
];

// ── Datos de «Wordle de jugadores» ──
// sol = apellido en MAYÚSCULAS sin tildes (la solución). Longitudes 4-8.
const MG_WORDLE_POOL = [
  { sol: 'MESSI',    n: 'Lionel Messi',       iso: 'ar',     pais: 'Argentina',  pos: 'Delantero' },
  { sol: 'MBAPPE',   n: 'Kylian Mbappé',      iso: 'fr',     pais: 'Francia',    pos: 'Delantero' },
  { sol: 'HAALAND',  n: 'Erling Haaland',     iso: 'no',     pais: 'Noruega',    pos: 'Delantero' },
  { sol: 'KANE',     n: 'Harry Kane',         iso: 'gb-eng', pais: 'Inglaterra', pos: 'Delantero' },
  { sol: 'MODRIC',   n: 'Luka Modrić',        iso: 'hr',     pais: 'Croacia',    pos: 'Centrocampista' },
  { sol: 'PEDRI',    n: 'Pedri',              iso: 'es',     pais: 'España',     pos: 'Centrocampista' },
  { sol: 'RODRI',    n: 'Rodri',              iso: 'es',     pais: 'España',     pos: 'Centrocampista' },
  { sol: 'SALAH',    n: 'Mohamed Salah',      iso: 'eg',     pais: 'Egipto',     pos: 'Delantero' },
  { sol: 'NEYMAR',   n: 'Neymar Jr',          iso: 'br',     pais: 'Brasil',     pos: 'Delantero' },
  { sol: 'VINICIUS', n: 'Vinícius Júnior',    iso: 'br',     pais: 'Brasil',     pos: 'Delantero' },
  { sol: 'YAMAL',    n: 'Lamine Yamal',       iso: 'es',     pais: 'España',     pos: 'Delantero' },
  { sol: 'SAKA',     n: 'Bukayo Saka',        iso: 'gb-eng', pais: 'Inglaterra', pos: 'Delantero' },
  { sol: 'FODEN',    n: 'Phil Foden',         iso: 'gb-eng', pais: 'Inglaterra', pos: 'Centrocampista' },
  { sol: 'MUSIALA',  n: 'Jamal Musiala',      iso: 'de',     pais: 'Alemania',   pos: 'Centrocampista' },
  { sol: 'WIRTZ',    n: 'Florian Wirtz',      iso: 'de',     pais: 'Alemania',   pos: 'Centrocampista' },
  { sol: 'OSIMHEN',  n: 'Victor Osimhen',     iso: 'ng',     pais: 'Nigeria',    pos: 'Delantero' },
  { sol: 'COURTOIS', n: 'Thibaut Courtois',   iso: 'be',     pais: 'Bélgica',    pos: 'Portero' },
  { sol: 'RONALDO',  n: 'Cristiano Ronaldo',  iso: 'pt',     pais: 'Portugal',   pos: 'Delantero' },
  { sol: 'VALVERDE', n: 'Federico Valverde',  iso: 'uy',     pais: 'Uruguay',    pos: 'Centrocampista' },
  { sol: 'HAKIMI',   n: 'Achraf Hakimi',      iso: 'ma',     pais: 'Marruecos',  pos: 'Defensa' },
  { sol: 'GAVI',     n: 'Gavi',               iso: 'es',     pais: 'España',     pos: 'Centrocampista' },
  { sol: 'DEMBELE',  n: 'Ousmane Dembélé',    iso: 'fr',     pais: 'Francia',    pos: 'Delantero' },
  { sol: 'LEAO',     n: 'Rafael Leão',        iso: 'pt',     pais: 'Portugal',   pos: 'Delantero' },
  { sol: 'COSTA',    n: 'Diogo Costa',        iso: 'pt',     pais: 'Portugal',   pos: 'Portero' },
];

// ── Datos de «¿Quién es este jugador?» (foto ampliada) ──
// wiki = título EXACTO del artículo en la Wikipedia en inglés (de ahí sale la foto).
// fy = altura (% de la imagen) donde está la CARA; centramos ahí el recorte para
//      que el primer plano caiga siempre en el rostro (retrato o cuerpo entero).
const MG_FOTO_POOL = [
  { n: 'Lionel Messi',       wiki: 'Lionel Messi',       iso: 'ar',     pais: 'Argentina',     pos: 'Delantero',     fy: 20 },
  { n: 'Cristiano Ronaldo',  wiki: 'Cristiano Ronaldo',  iso: 'pt',     pais: 'Portugal',      pos: 'Delantero',     fy: 24 },
  { n: 'Kylian Mbappé',      wiki: 'Kylian Mbappé',      iso: 'fr',     pais: 'Francia',       pos: 'Delantero',     fy: 18 },
  { n: 'Erling Haaland',     wiki: 'Erling Haaland',     iso: 'no',     pais: 'Noruega',       pos: 'Delantero',     fy: 28, zMul: 1.35 },
  { n: 'Neymar Jr',          wiki: 'Neymar',             iso: 'br',     pais: 'Brasil',        pos: 'Delantero',     fy: 24 },
  { n: 'Vinícius Júnior',    wiki: 'Vinícius Júnior',    iso: 'br',     pais: 'Brasil',        pos: 'Delantero',     fy: 22 },
  { n: 'Mohamed Salah',      wiki: 'Mohamed Salah',      iso: 'eg',     pais: 'Egipto',        pos: 'Delantero',     fy: 16 },
  { n: 'Robert Lewandowski', wiki: 'Robert Lewandowski', iso: 'pl',     pais: 'Polonia',       pos: 'Delantero',     fy: 17 },
  { n: 'Luka Modrić',        wiki: 'Luka Modrić',        iso: 'hr',     pais: 'Croacia',       pos: 'Centrocampista', fy: 22 },
  { n: 'Kevin De Bruyne',    wiki: 'Kevin De Bruyne',    iso: 'be',     pais: 'Bélgica',       pos: 'Centrocampista', fy: 19 },
  { n: 'Harry Kane',         wiki: 'Harry Kane',         iso: 'gb-eng', pais: 'Inglaterra',    pos: 'Delantero',     fy: 19 },
  { n: 'Jude Bellingham',    wiki: 'Jude Bellingham',    iso: 'gb-eng', pais: 'Inglaterra',    pos: 'Centrocampista', fy: 14 },
  { n: 'Lamine Yamal',       wiki: 'Lamine Yamal',       iso: 'es',     pais: 'España',        pos: 'Delantero',     fy: 10 },
  { n: 'Pedri',              wiki: 'Pedri',              iso: 'es',     pais: 'España',        pos: 'Centrocampista', fy: 10 },
  { n: 'Antoine Griezmann',  wiki: 'Antoine Griezmann',  iso: 'fr',     pais: 'Francia',       pos: 'Delantero',     fy: 24 },
  { n: 'Bukayo Saka',        wiki: 'Bukayo Saka',        iso: 'gb-eng', pais: 'Inglaterra',    pos: 'Delantero',     fy: 26 },
  { n: 'Son Heung-min',      wiki: 'Son Heung-min',      iso: 'kr',     pais: 'Corea del Sur', pos: 'Delantero',     fy: 24 },
  { n: 'Karim Benzema',      wiki: 'Karim Benzema',      iso: 'fr',     pais: 'Francia',       pos: 'Delantero',     fy: 40 },
  { n: 'Sergio Ramos',       wiki: 'Sergio Ramos',       iso: 'es',     pais: 'España',        pos: 'Defensa',       fy: 28 },
  { n: 'Manuel Neuer',       wiki: 'Manuel Neuer',       iso: 'de',     pais: 'Alemania',      pos: 'Portero',       fy: 13 },
  // Fotos LOCALES (carpeta Fotos_mini_juego). Usan `src` en vez de Wikipedia.
  { n: 'Joan García', src: 'Fotos_mini_juego/Joan_Garcia_4.jpg', iso: 'es', pais: 'España',        pos: 'Portero', fy: 36 },
  { n: 'Tim Payne',   src: 'Fotos_mini_juego/Tim_Payne_4.png',   iso: 'nz', pais: 'Nueva Zelanda', pos: 'Defensa', fy: 40 },
];

// ── Datos de «Goles míticos: ¿por dónde entró?» — SOLO goles de Mundiales ──
// x,y = punto de entrada en la PORTERÍA (fracción 0–1; x: izq→der, y: arriba→abajo),
//       desde la vista del público/portero. Valores APROXIMADOS, fáciles de editar.
const MG_PORTERIA_POOL = [
  { desc: 'Maradona · «el gol del siglo» vs Inglaterra (1986)',  x: 0.38, y: 0.80 },
  { desc: 'Iniesta · gol de la final vs Países Bajos (2010)',    x: 0.22, y: 0.64 },
  { desc: 'Puyol · cabezazo en la semifinal vs Alemania (2010)', x: 0.64, y: 0.30 },
  { desc: 'Mbappé · volea del 2-2 en la final vs Argentina (2022)', x: 0.84, y: 0.78 },
  { desc: 'Pavard · volea vs Argentina (2018)',                  x: 0.04, y: 0.16 },
  // reserva (también de Mundiales)
  { desc: 'Messi · gol vs México (2022)',                        x: 0.86, y: 0.78 },
  { desc: 'Zidane · cabezazo en la final vs Brasil (1998)',      x: 0.32, y: 0.58 },
  { desc: 'James Rodríguez · volea vs Uruguay (2014)',           x: 0.15, y: 0.14 },
];

// ── Sudokus 6×6 con solución ÚNICA verificada (0 = vacía, 1–6 = símbolo).
//    Cada día se elige uno y se le aplican transformaciones que MANTIENEN la
//    unicidad (renombrar símbolos + barajar bandas/filas/columnas). ──
const MG_SUDOKU = [
  { d: 'Fácil',   p: '610235500040006402052361240613361500' },
  { d: 'Fácil',   p: '105230023001056042214356040003631420' },
  { d: 'Fácil',   p: '001456006102365214124563010005450001' },
  { d: 'Fácil',   p: '035461614005362050040632053240400503' },
  { d: 'Media',   p: '006140401006040601010030200513035204' },
  { d: 'Media',   p: '000061360040012403435602056030100006' },
  { d: 'Media',   p: '100240004051216405003000362004500603' },
  { d: 'Media',   p: '036052050100000006620014300625062041' },
  { d: 'Difícil', p: '032061006020000250000100020000504032' },
  { d: 'Difícil', p: '000050200100304010020406400001605300' },
  { d: 'Difícil', p: '016400504200000000105023061300000040' },
  { d: 'Difícil', p: '241000000000052060000500403105100046' },
];

// ── «¿De qué selección es?» — nombres de países (para las opciones) ──
const NAT_NAMES = {
  'us': 'EE. UU.', 'ca': 'Canadá', 'gh': 'Ghana', 'gb-eng': 'Inglaterra', 'it': 'Italia',
  'ng': 'Nigeria', 'fr': 'Francia', 'nl': 'Países Bajos', 'sr': 'Surinam', 'be': 'Bélgica',
  'jm': 'Jamaica', 'gb-wls': 'Gales', 'de': 'Alemania', 'at': 'Austria', 'lr': 'Liberia',
  'ht': 'Haití', 'tt': 'Trinidad y Tobago', 'ma': 'Marruecos', 'dz': 'Argelia', 'ch': 'Suiza',
  'xk': 'Kosovo', 'al': 'Albania', 'mk': 'Macedonia del Norte', 'tr': 'Turquía', 'cm': 'Camerún',
  'ao': 'Angola', 'cd': 'RD Congo', 'sn': 'Senegal', 'ci': 'Costa de Marfil', 'ec': 'Ecuador',
  'co': 'Colombia', 'ar': 'Argentina', 'pe': 'Perú', 'pa': 'Panamá', 'ir': 'Irán',
  'az': 'Azerbaiyán', 'tm': 'Turkmenistán', 'iq': 'Irak', 'qa': 'Catar', 'jp': 'Japón',
  'kr': 'Corea del Sur', 'cn': 'China', 'th': 'Tailandia', 'vn': 'Vietnam',
  'pt': 'Portugal', 'br': 'Brasil', 'tn': 'Túnez', 'eg': 'Egipto',
};
// Jugadores (probables Mundial 2026) con nacionalidad poco evidente por el nombre.
// iso = nacionalidad real · d = 3 distractores plausibles.
// Intercalado a propósito: cada bloque de 5 (un quiz) mezcla 5 selecciones distintas.
const MG_NAT_POOL = [
  // Quiz 1
  { n: 'Yunus Musah',         iso: 'us', d: ['gh', 'gb-eng', 'it'] },
  { n: 'Alphonso Davies',     iso: 'ca', d: ['gh', 'lr', 'gb-eng'] },
  { n: 'Hakim Ziyech',        iso: 'ma', d: ['nl', 'dz', 'be'] },
  { n: 'Xherdan Shaqiri',     iso: 'ch', d: ['xk', 'al', 'mk'] },
  { n: 'Eduardo Camavinga',   iso: 'fr', d: ['ao', 'cd', 'pt'] },
  // Quiz 2
  { n: 'Folarin Balogun',     iso: 'us', d: ['ng', 'gb-eng', 'fr'] },
  { n: 'Stephen Eustáquio',   iso: 'ca', d: ['pt', 'br', 'ao'] },
  { n: 'Noussair Mazraoui',   iso: 'ma', d: ['nl', 'tn', 'dz'] },
  { n: 'Granit Xhaka',        iso: 'ch', d: ['al', 'xk', 'tr'] },
  { n: 'Randal Kolo Muani',   iso: 'fr', d: ['cd', 'cm', 'sn'] },
  // Quiz 3
  { n: 'Sergiño Dest',        iso: 'us', d: ['nl', 'sr', 'be'] },
  { n: 'Jonathan David',      iso: 'ca', d: ['us', 'ht', 'tt'] },
  { n: 'Sofyan Amrabat',      iso: 'ma', d: ['nl', 'eg', 'dz'] },
  { n: 'Breel Embolo',        iso: 'ch', d: ['cm', 'fr', 'be'] },
  { n: 'Aurélien Tchouaméni', iso: 'fr', d: ['cm', 'sn', 'ci'] },
  // Quiz 4
  { n: 'Antonee Robinson',    iso: 'us', d: ['gb-eng', 'jm', 'gb-wls'] },
  { n: 'Tajon Buchanan',      iso: 'ca', d: ['jm', 'gb-eng', 'us'] },
  { n: 'Manuel Akanji',       iso: 'ch', d: ['ng', 'gh', 'de'] },
  { n: 'Piero Hincapié',      iso: 'ec', d: ['co', 'ar', 'it'] },
  { n: 'Sardar Azmoun',       iso: 'ir', d: ['az', 'tm', 'iq'] },
  // Quiz 5
  { n: 'Weston McKennie',     iso: 'us', d: ['de', 'gb-eng', 'at'] },
  { n: 'Moisés Caicedo',      iso: 'ec', d: ['co', 'pe', 'pa'] },
  { n: 'Mehdi Taremi',        iso: 'ir', d: ['iq', 'qa', 'ma'] },
  { n: 'Wataru Endo',         iso: 'jp', d: ['kr', 'cn', 'th'] },
  { n: 'Hwang Hee-chan',      iso: 'kr', d: ['jp', 'cn', 'vn'] },
];

// ── Calendario: un reto por día del 10-jun-2026 al 19-jul-2026 (40 días).
//    Contenido distinto cada día y modos bien alternados; `i` = qué contenido
//    usa ese día dentro de su pool (tema/jugador/puzzle/gol/quiz). ──
const MG_ROTATION = [
  // Ciclo 1 (10–17 jun)
  { mode: 'mm', theme: 'valor' }, { mode: 'nat', i: 0 }, { mode: 'foto', i: 20 }, { mode: 'punteria' },
  { mode: 'pistas', i: 5 }, { mode: 'wordle', i: 3 }, { mode: 'porteria', i: 0 }, { mode: 'sudoku', i: 0 },
  // Ciclo 2 (18–25 jun)
  { mode: 'mm', theme: 'goles' }, { mode: 'nat', i: 1 }, { mode: 'foto', i: 21 }, { mode: 'punteria' },
  { mode: 'pistas', i: 2 }, { mode: 'wordle', i: 7 }, { mode: 'porteria', i: 1 }, { mode: 'sudoku', i: 4 },
  // Ciclo 3 (26 jun – 3 jul)
  { mode: 'mm', theme: 'edad' }, { mode: 'nat', i: 2 }, { mode: 'foto', i: 0 }, { mode: 'punteria' },
  { mode: 'pistas', i: 23 }, { mode: 'wordle', i: 4 }, { mode: 'porteria', i: 2 }, { mode: 'sudoku', i: 8 },
  // Ciclo 4 (4–11 jul)
  { mode: 'mm', theme: 'champions' }, { mode: 'nat', i: 3 }, { mode: 'foto', i: 3 }, { mode: 'punteria' },
  { mode: 'pistas', i: 6 }, { mode: 'wordle', i: 17 }, { mode: 'porteria', i: 3 }, { mode: 'sudoku', i: 2 },
  // Ciclo 5 (12–19 jul)
  { mode: 'mm', theme: 'selecciones' }, { mode: 'nat', i: 4 }, { mode: 'foto', i: 14 }, { mode: 'punteria' },
  { mode: 'pistas', i: 3 }, { mode: 'wordle', i: 18 }, { mode: 'porteria', i: 4 }, { mode: 'sudoku', i: 6 },
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
  // El calendario va del 10-jun-2026 al 19-jul-2026 (40 retos, uno por día). Después: «fin».
  const MG_START_ORD = (function () { const p = '2026-06-10'.split('-'); return Math.floor(Date.UTC(+p[0], +p[1] - 1, +p[2]) / 86400000); })();
  function scheduleIdx() { return dayOrdinal() - MG_START_ORD; }
  // Tester (Zoesita): puede previsualizar los retos de los días siguientes y
  // volver a jugar (sin candado), en CUALQUIER página, para revisarlos en directo.
  const isTester = () => isHidden(mgUser());
  function ordOf(s) { const p = s.split('-'); return Math.floor(Date.UTC(+p[0], +p[1] - 1, +p[2]) / 86400000); }
  function ordLabel(o) { return cap(new Intl.DateTimeFormat('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(o * 86400000))); }
  // Ciclo de 14 (8 originales + 6 nuevos, Dorsales el último) con LISTAS de
  // contenido, evitando lo ya usado esta semana en vivo (mm valor, nat0, foto20,
  // pistas5, wordle3=Kane, porteria0=Maradona, sudoku0).
  const MG_CYCLE = [
    { mode: 'mm', key: 'theme', list: ['goles', 'edad', 'champions', 'caps', 'selecciones', 'altura', 'fichaje', 'instagram'] },
    { mode: 'nat', list: [1, 2, 3, 4] },
    { mode: 'foto', list: [0, 3, 5, 11, 8, 6] },        // Messi, Haaland, Vinícius, Bellingham, Modrić, Salah (Mbappé→Messi)
    { mode: 'punteria', list: [0] },
    { mode: 'pistas', list: [21, 15, 19, 22, 27] },      // Valverde (Madrid, menos conocido) 1º; no Mbappé/Pedri
    { mode: 'wordle', list: [13, 23, 4, 18, 15] },        // Musiala, Diogo Costa (7 jul; Haaland→Costa), Modric, Valverde, Osimhen
    { mode: 'porteria', list: [[1, 3], [4, 2]] },        // PARES fijados (media de 2 distancias): 1ª aparición (24 jun) = Iniesta+Mbappé · 2ª (8 jul) = Pavard+Puyol
    { mode: 'sudoku', list: [1, 4, 8, 5, 2] },
    { mode: 'memory', list: [0, 1, 2, 3] },
    { mode: 'keepie', list: [0, 1, 2] },
    { mode: 'card', list: [0, 1, 2, 3] },
    { mode: 'math', list: [1, 0, 2] },
    { mode: 'mastermind', list: [0] },
    { mode: 'dorsales', list: [0, 1, 2, 3] },
  ];
  const MG_SIM_START = ordOf('2026-06-18'), MG_SIM_END = ordOf('2026-07-19'); // el 19-jul = bonus (final)
  // El ciclo 1 (los 8 ANTIGUOS) ya se jugó esta semana (10–17 jun). Por eso la
  // rotación EMPIEZA mañana (18 jun) con los 6 juegos NUEVOS, para completar ese
  // primer ciclo; del 24 jun en adelante se cicla el calendario completo de 14
  // (8 antiguos + 6 nuevos) en el orden de MG_CYCLE.
  function cycleGameAt(off) {
    if (off < 6) return MG_CYCLE[8 + off];          // 18–23 jun: los 6 nuevos
    return MG_CYCLE[(off - 6) % MG_CYCLE.length];   // 24 jun en adelante: ciclo de 14
  }
  const MG_TEST_SEQ = (function () {
    const seq = [], used = {};
    for (let d = MG_SIM_START; d < MG_SIM_END; d++) {
      const g = cycleGameAt(d - MG_SIM_START);
      const n = used[g.mode] || 0;
      const e = { mode: g.mode, dateOrd: d };
      const v = g.list[n % g.list.length];
      if (g.key === 'theme') e.theme = v;
      else if (Array.isArray(v)) { e.i = v[0]; e.i2 = v[1]; } // goles míticos: par (media de distancias)
      else e.i = v;
      used[g.mode] = n + 1;
      seq.push(e);
    }
    seq.push({ mode: 'bonus', dateOrd: MG_SIM_END });
    return seq;
  })();
  const MG_NEW = ['memory', 'keepie', 'card', 'math', 'mastermind', 'dorsales'];
  const MG_ORIG_META = { mm: ['🎯', '¿Más o menos?'], nat: ['🌍', '¿De qué selección?'], foto: ['📸', '¿Quién es?'], punteria: ['🥅', 'Puntería'], pistas: ['🕵️', 'Adivina con pistas'], wordle: ['🔤', 'Wordle'], porteria: ['⚽', 'Goles míticos'], sudoku: ['🧩', 'Sudoku'] };
  // BONUS de la final: elegir 3 de los 14 y jugarlos seguidos.
  let bonusSeq = null, bonusPos = 0, bonusPicks = [], bonusMode = false;
  const MG_BONUS_SEED = 20260719; // semilla FIJA → los juegos nuevos del bonus salen iguales siempre y para todos
  // Contenido FIJO del bonus de la final (igual siempre y para todos, competición
  // justa). Se eligió contenido que no sale en la rotación normal.
  function freshContent(mode) {
    if (mode === 'mm') return { theme: 'selecciones' };   // 🏆 Victorias en Mundiales (temático para la final)
    if (mode === 'nat') return { i: 4 };                  // Quiz 5 (McKennie, Caicedo, Taremi, Endo, Hwang)
    if (mode === 'foto') return { i: 7 };                 // Lewandowski
    if (mode === 'pistas') return { i: 32 };              // Son Heung-min
    if (mode === 'wordle') return { i: 16 };              // COURTOIS (más difícil que Pedri)
    if (mode === 'porteria') return { i: 6, i2: 5 };      // Zidane + Messi (media de distancias)
    if (mode === 'sudoku') return { i: 9 };               // Difícil (puzzle fijo)
    return { i: 3 };                                      // juegos nuevos: variante "final" (window.NG hace % length)
  }
  function currentEntry() {
    if (bonusSeq) return bonusSeq[bonusPos] || { mode: 'bonusdone' }; // bonus de la final en curso
    // dayOrdinal() ya incluye previewOffset (Zoesita previsualiza días siguientes).
    const off = dayOrdinal() - MG_SIM_START;
    if (off < 0) { // 17-jun (hoy) y antes: rotación ANTIGUA — el reto de hoy NO cambia
      let i = scheduleIdx(); if (i < 0) i = 0; if (i >= MG_ROTATION.length) return { mode: 'over' }; return MG_ROTATION[i];
    }
    if (off >= MG_TEST_SEQ.length) return { mode: 'over' }; // tras el 19-jul (bonus): fin
    return MG_TEST_SEQ[off]; // 18-jun en adelante: rotación nueva (6 nuevos + ciclo de 14 + bonus)
  }
  function themeByKey(k) { return MG_THEMES.find(t => t.key === k) || MG_THEMES[0]; }
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function flag(iso) { return `<img class="team-flag-img" src="https://flagcdn.com/w40/${iso}.png" srcset="https://flagcdn.com/w80/${iso}.png 2x" alt="" loading="lazy">`; }
  function norm(s) { return (s || '').toString().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, '').trim().replace(/\s+/g, ' '); }
  const bestKey = () => 'wc2026_mg_best_' + dayKey();
  const hasBest = () => localStorage.getItem(bestKey()) != null;
  const getBest = () => { const v = localStorage.getItem(bestKey()); return v == null ? 0 : parseFloat(v); };
  // Cada modo puntúa distinto. lower:true → gana quien tenga MENOS (pistas,
  // intentos, distancia o tiempo); lower:false → gana quien tenga MÁS (aciertos,
  // goles). fmt(v) = cómo se ve el valor. DNF (no lo logró) = 999 y ordena el último.
  const MG_DNF = 999;
  const pad2 = n => String(n).padStart(2, '0');
  const fmtMMSS = s => { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + pad2(s % 60); };
  const MODE_SCORING = {
    mm:       { lower: false, fmt: v => v + (v === 1 ? ' acierto' : ' aciertos') },
    nat:      { lower: false, fmt: v => v + '/5' },
    punteria: { lower: false, fmt: v => v + (v === 1 ? ' gol' : ' goles') },
    pistas:   { lower: true,  fmt: v => v >= MG_DNF ? '❌ no acertó' : v + (v === 1 ? ' pista' : ' pistas') },
    wordle:   { lower: true,  fmt: v => v >= MG_DNF ? '❌ no acertó' : v + (v === 1 ? ' intento' : ' intentos') },
    foto:     { lower: true,  fmt: v => v >= MG_DNF ? '❌ no acertó' : v + (v === 1 ? ' intento' : ' intentos') },
    porteria: { lower: true,  fmt: v => v.toFixed(1) + ' m' },
    sudoku:   { lower: true,  fmt: v => fmtMMSS(v) },
    // Juegos nuevos (gana MÁS salvo Mastermind, que es MENOS intentos).
    memory:     { lower: false, fmt: v => v + '/11' },
    dorsales:   { lower: false, fmt: v => v + '/10' },
    card:       { lower: false, fmt: v => v + '/10' },
    math:       { lower: false, fmt: v => v + (v === 1 ? ' acierto' : ' aciertos') },
    keepie:     { lower: false, fmt: v => Number(v).toFixed(1) + ' s' },
    mastermind: { lower: true,  fmt: v => v >= MG_DNF ? '❌ no lo sacó' : v + (v === 1 ? ' intento' : ' intentos') },
  };
  const scoringFor = m => MODE_SCORING[m] || { lower: false, fmt: v => String(v) };
  const dayMode = () => (currentEntry() || {}).mode || 'mm';
  const bestLabel = () => hasBest() ? scoringFor(dayMode()).fmt(getBest()) : '—';
  // Usuarios que normalmente NO aparecen en el ranking (la organizadora probando
  // los retos): en los juegos de CONOCIMIENTO, conocer las preguntas da ventaja.
  const MG_HIDDEN = ['zoesita'];
  const isHidden = u => MG_HIDDEN.indexOf((u || '').toLowerCase()) >= 0;
  // ...pero en los juegos de HABILIDAD pura (reflejos), conocer el reto NO da
  // ventaja, así que ahí los testers sí salen en el ranking.
  const MG_SKILL_MODES = ['punteria'];
  const isSkillMode = m => MG_SKILL_MODES.indexOf(m) >= 0;
  // Una fila se oculta del ranking solo si es un tester Y el modo es de conocimiento.
  const hideRow = r => isHidden(r.user) && !isSkillMode(r.mode);
  function setBest(v) {
    const cur = localStorage.getItem(bestKey());
    if (cur == null) { localStorage.setItem(bestKey(), String(v)); return; }
    const better = scoringFor(dayMode()).lower ? (v < parseFloat(cur)) : (v > parseFloat(cur));
    if (better) localStorage.setItem(bestKey(), String(v));
  }
  // 1 partida al día: al terminar (gane o pierda) se marca el día y queda bloqueado.
  const doneKey = () => 'wc2026_mg_done_' + dayKey();
  const isDone = () => localStorage.getItem(doneKey()) != null;
  function setDone() { if (!isDone()) localStorage.setItem(doneKey(), String(getBest())); }

  // ── Identidad + servidor (versión real en la web principal) ──
  function mgUser() { return (localStorage.getItem('wc2026_username') || '').trim(); }
  let mgRows = null, mgRowsAt = 0, startToken = 0;
  function ensureMgData() { // caché 25 s; degradado si no hay backend
    if (mgRows && (Date.now() - mgRowsAt) < 25000) return Promise.resolve(mgRows);
    if (typeof api === 'undefined' || !api.mgGet) return Promise.resolve(mgRows || []);
    return api.mgGet()
      .then(d => { mgRows = (d && d.rows) || []; mgRowsAt = Date.now(); return mgRows; })
      .catch(() => mgRows || []);
  }
  function playedTodayServer() { const u = mgUser(), d = dayKey(); return !!(mgRows || []).some(r => r.user === u && r.day === d); }
  // El servidor manda: si los datos cargaron bien y la hoja NO tiene tu partida de
  // hoy, se borra el candado local viejo. Así, si la organizadora elimina una fila
  // del Google Sheet, ese jugador puede volver a jugar sin tocar nada en su móvil.
  function reconcileDone() { if (mgRows && !playedTodayServer() && isDone()) localStorage.removeItem(doneKey()); }
  // El ranking manda también para "tu mejor de hoy": si la hoja tiene tu puntuación
  // de hoy, el mejor local se iguala a ella (así un mejor local antiguo de pruebas
  // no descuadra con lo que se ve en el ranking).
  function reconcileBest() { const u = mgUser(), d = dayKey(); const r = (mgRows || []).find(x => x.user === u && x.day === d); if (r) localStorage.setItem(bestKey(), String(r.score)); }
  // Si el servidor antiguo guardó duplicados, nos quedamos con la PRIMERA fila de
  // cada (usuario, día) — la que cuenta — para que todos vean lo mismo.
  function mgDedup() { const seen = {}, out = []; (mgRows || []).forEach(r => { const k = r.day + '|' + r.user; if (!seen[k]) { seen[k] = 1; out.push(r); } }); return out; }
  function myTodayScore() { const u = mgUser(), d = dayKey(); const r = (mgRows || []).find(x => x.user === u && x.day === d); return r ? r.score : getBest(); }
  function ordToKey(ord) { return new Date(ord * 86400000).toISOString().slice(0, 10); }
  function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  function saveMyScore() {
    const u = mgUser(); if (!u) return;
    const d = dayKey(), score = getBest(), mode = (currentEntry() || {}).mode || '';
    mgRows = mgRows || [];
    if (!mgRows.some(r => r.user === u && r.day === d)) mgRows.push({ user: u, day: d, score: score, mode: mode });
    if (typeof api !== 'undefined' && api.mgSave) api.mgSave({ user: u, day: d, score: score, mode: mode }).catch(() => {});
  }

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
    '<div id="mg-play-view">' +
      '<div class="mg-theme" id="mg-theme"></div>' +
      '<div class="mg-timer-row">' +
        '<div class="mg-timer-track"><div class="mg-timer-bar" id="mg-timer-bar"></div></div>' +
        '<span class="mg-timer-num" id="mg-timer-num">15s</span>' +
      '</div>' +
      '<div class="mg-hud" id="mg-hud"></div>' +
      '<div id="mg-board"></div>' +
    '</div>';

  document.body.appendChild(panel);
  document.body.appendChild(fab);

  // ── Navegador: bonus de la final (para todos) o vista previa de los días
  //    siguientes (SOLO testers / Zoesita). Oculto para el resto. ──
  (function () {
    const step = document.createElement('div');
    step.className = 'mg-teststep'; step.style.display = 'none';
    step.innerHTML = '<button type="button" class="mg-day-arrow" data-st="prev" aria-label="Anterior">‹</button>' +
      '<span class="mg-teststep-lbl" id="mg-teststep-lbl"></span>' +
      '<button type="button" class="mg-day-arrow" data-st="next" aria-label="Siguiente">›</button>';
    const pv = el('mg-play-view'); if (pv) pv.insertBefore(step, pv.firstChild);
    step.addEventListener('click', function (e) {
      const b = e.target.closest('[data-st]'); if (!b) return;
      const dir = b.dataset.st === 'next' ? 1 : -1;
      if (bonusSeq) { // navegando dentro del bonus (los 3 elegidos)
        if (dir > 0) { bonusPos++; if (bonusPos >= bonusSeq.length) { bonusSeq = null; bonusMode = false; bonusPos = 0; renderBonusSummary(); updateNav(); return; } }
        else { if (bonusPos === 0) { bonusSeq = null; bonusMode = false; } else bonusPos--; }
        started = false; gameOver = false; startDay(); return;
      }
      if (!isTester()) return; // solo Zoesita puede previsualizar otros días
      const realToday = dayOrdinal() - previewOffset, np = previewOffset + dir;
      if (np < 0) return;                                                  // no ir al pasado
      if (realToday + np - MG_SIM_START > MG_TEST_SEQ.length - 1) return;  // no pasar del bonus (19-jul)
      previewOffset = np; started = false; gameOver = false; startDay();
    });
  })();
  function gmeta(mode) {
    if (mode === 'bonus' || mode === 'bonusdone') return ['🏆', 'Bonus de la final'];
    if (window.NG && window.NG.has(mode)) { const m = window.NG.meta(mode); return [m.emoji, m.name]; }
    return MG_ORIG_META[mode] || ['🎮', mode];
  }
  function updateNav() {
    const step = document.querySelector('.mg-teststep'); if (!step) return;
    const show = !!bonusSeq || isTester();
    step.style.display = show ? '' : 'none';
    const l = el('mg-teststep-lbl'); if (!show || !l) return;
    if (bonusSeq) { const m = gmeta(bonusSeq[bonusPos].mode); l.innerHTML = `🏆 Bonus ${bonusPos + 1}/${bonusSeq.length} · ${m[0]} ${esc(m[1])}`; return; }
    const e = currentEntry(), m = gmeta(e.mode);
    const when = previewOffset === 0 ? 'Hoy' : ordLabel(dayOrdinal());
    l.innerHTML = `🧪 ${when} · ${m[0]} ${esc(m[1])}`;
  }
  // Intro corta para TODOS los juegos (también los 8 originales).
  const MG_INTROS = {
    mm: 'Te enseñamos dos jugadores. Adivina si el segundo tiene <b>MÁS o MENOS</b> que el primero en el dato del día. Encadena aciertos sin fallar.',
    nat: 'Mira el jugador y acierta <b>de qué selección</b> es. 5 jugadores; suma aciertos.',
    foto: 'Adivina el <b>jugador de la foto</b>. Cada intento la ves un poco mejor; acierta con los <b>menos intentos</b>.',
    punteria: 'Marca goles: <b>toca la portería</b> cuando el balón esté lejos del portero. ¡Aguanta el máximo!',
    pistas: 'Adivina el jugador con el <b>mínimo de pistas</b>. Cada fallo revela una pista nueva.',
    wordle: 'Adivina el <b>apellido</b> del jugador (estilo Wordle). Cuantos menos intentos, mejor.',
    porteria: 'Te decimos un <b>gol mítico</b> de un Mundial (a veces <b>dos</b>). Toca en la portería <b>por dónde entró</b> cada uno; gana quien menos se aleje (si son dos, cuenta la <b>media</b> de las distancias).',
    sudoku: '<b>Sudoku de fútbol</b> 6×6: complétalo lo más rápido que puedas.',
  };
  function showOrigIntro(mode, onStart) {
    const rules = MG_INTROS[mode], b = el('mg-board');
    if (!rules || !b) { onStart(); return; }
    const m = gmeta(mode);
    b.innerHTML = `<div class="ng-intro"><div class="ng-intro-emoji">${m[0]}</div><div class="ng-intro-title" style="font-family:'Sora',sans-serif;font-weight:800;font-size:16px;margin-bottom:6px">${esc(m[1])}</div><p class="ng-intro-rules">${rules}</p><button type="button" class="btn-primary ng-btn" id="mg-intro-go">▶️ Empezar</button></div>`;
    const go = el('mg-intro-go'); if (go) go.addEventListener('click', onStart);
  }
  function allGames() {
    const orig = Object.keys(MG_ORIG_META).map(k => ({ key: k, emoji: MG_ORIG_META[k][0], name: MG_ORIG_META[k][1] }));
    return orig.concat((window.NG && window.NG.list) ? window.NG.list : []);
  }
  function renderBonusPick() {
    setTimerVisible(false); setHud(''); if (Game && Game.teardown) Game.teardown(); Game = null;
    const tb = el('mg-theme'); if (tb) tb.innerHTML = '🏆 <b>Bonus track de la final</b>';
    const b = el('mg-board'); if (!b) return;
    b.innerHTML = `<div class="ng-intro"><div class="ng-intro-emoji">🏆</div>
      <p class="ng-intro-rules">¡Día de la final! Elige tus <b>3 minijuegos</b> favoritos y juégalos seguidos (con <b>contenido nuevo</b>). Tus 3 notas se normalizan (0–100) y se suman → ranking del bonus.</p>
      <div class="ng-bonus-pick">${allGames().map(g => `<button type="button" class="ng-bonus-opt" data-bk="${g.key}">${g.emoji}<span>${esc(g.name)}</span></button>`).join('')}</div>
      <button type="button" class="btn-primary ng-btn" id="mg-bonus-go" disabled>▶️ Jugar los 3</button></div>`;
    bonusPicks = [];
    b.querySelectorAll('[data-bk]').forEach(btn => btn.addEventListener('click', () => {
      const k = btn.dataset.bk, at = bonusPicks.indexOf(k);
      if (at >= 0) { bonusPicks.splice(at, 1); btn.classList.remove('on'); }
      else { if (bonusPicks.length >= 3) return; bonusPicks.push(k); btn.classList.add('on'); }
      const go = el('mg-bonus-go'); if (go) go.disabled = bonusPicks.length !== 3;
    }));
    const go = el('mg-bonus-go'); if (go) go.addEventListener('click', () => {
      if (bonusPicks.length !== 3) return;
      bonusSeq = bonusPicks.map(k => Object.assign({ mode: k, bonus: true }, freshContent(k)));
      bonusPos = 0; bonusMode = true; started = false; gameOver = false; startDay();
    });
  }
  function renderBonusSummary() {
    setTimerVisible(false); setHud(''); Game = null;
    const tb = el('mg-theme'); if (tb) tb.innerHTML = '🏆 <b>Bonus completado</b>';
    const b = el('mg-board'); if (!b) return;
    const names = bonusPicks.map(k => { const m = gmeta(k); return `${m[0]} ${esc(m[1])}`; });
    b.innerHTML = `<div class="mg-end"><div class="mg-end-emoji">🎉</div><h3>¡Bonus completado!</h3>
      <p>Jugaste: <b>${names.join(' · ')}</b></p>
      <p class="mg-note">En la final real, cada resultado pasa a una nota 0–100 (según tu posición frente al resto) y se suman las 3 → ranking del bonus.</p>
      <button type="button" class="btn-primary" id="mg-bonus-again">🔄 Otra vez</button></div>`;
    const ag = el('mg-bonus-again'); if (ag) ag.addEventListener('click', () => { bonusSeq = null; bonusMode = false; bonusPos = 0; bonusPicks = []; started = false; startDay(); });
  }

  fab.addEventListener('click', function () {
    open = !open;
    panel.classList.toggle('hidden', !open);
    fab.classList.toggle('active', open);
    if (open) { if (!started) startDay(); else resumeGameTimer(); }
    else pauseGameTimer();
  });
  el('mg-close').addEventListener('click', function () { open = false; panel.classList.add('hidden'); fab.classList.remove('active'); pauseGameTimer(); });

  // El icono deja de moverse (y se ve "completado") cuando ya se ha jugado hoy.
  function setFabDone(done) {
    fab.classList.toggle('mg-done', !!done);
    const em = fab.querySelector('.mg-fab-emoji'), lb = fab.querySelector('.mg-fab-label');
    if (em) em.textContent = done ? '✅' : '🎮';
    if (lb) lb.textContent = done ? 'Reto completado' : 'Reto del día';
  }
  // Al cargar: si ya jugaste hoy (en este equipo, o en otro según el servidor),
  // el icono nace quieto. Si no, sigue llamando la atención con su pulso.
  (function initFabState() {
    // Inmediato: si en ESTE equipo ya jugaste hoy, el icono nace "completado"
    // sin esperar al servidor (el backend puede tardar unos segundos en responder).
    if (isDone()) setFabDone(true);
    if (!mgUser() || typeof api === 'undefined' || !api.mgGet) return;
    // Luego, cuando llega el servidor, ajustamos al estado real (por si jugaste en
    // otro equipo, o por si te borraron la partida y hay que volver a habilitarla).
    ensureMgData().then(() => {
      reconcileDone(); // partida borrada del servidor → quita el candado local
      reconcileBest(); // alinea "tu mejor de hoy" con el ranking
      setFabDone(isDone() || playedTodayServer());
    }).catch(() => {});
  })();

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
  function setTimerVisible(show) { const r = document.querySelector('.mg-timer-row'); if (r) r.style.display = show ? '' : 'none'; }

  // ── Arranque del día: elige modo/tema y construye el juego ──
  function startDay() {
    if (Game && Game.teardown) Game.teardown(); // limpia el modo anterior (p. ej. teclado del Wordle)
    stopTimer(); // corta cualquier crono del modo anterior
    const entry = currentEntry();
    gameOver = false; busy = false; started = true;
    const tb = el('mg-theme');
    updateNav();
    if (entry.mode === 'bonus') { renderBonusPick(); return; }
    if (entry.mode === 'bonusdone') { renderBonusSummary(); return; }
    if (entry.mode === 'over') {
      if (tb) tb.innerHTML = '🏁 <b>¡Se acabó el Mundial!</b>';
      setTimerVisible(false); setHud(''); Game = null;
      const wrap = el('mg-board'); if (wrap) wrap.innerHTML = `<div class="mg-end"><div class="mg-end-emoji">🏆</div><h3>No hay más retos</h3><p>Los retos diarios fueron hasta el 19 de julio. ¡Gracias por jugar!</p></div>`;
      return;
    }
    if (!mgUser()) { // sin sesión: no se puede jugar/guardar
      gameOver = true; setTimerVisible(false); setHud(''); Game = null;
      const w = el('mg-board');
      if (w) w.innerHTML = '<div class="mg-end"><div class="mg-end-emoji">👋</div><h3>Entra con tu nombre</h3><p>Entra arriba con tu <b>nombre y PIN</b> para jugar el reto de hoy y aparecer en la clasificación.</p></div>';
      return;
    }
    const isNew = !!(window.NG && window.NG.has(entry.mode));
    if (!isNew) {
      if (entry.mode === 'pistas') { if (tb) tb.innerHTML = '🕵️ Reto de hoy: <b>Adivina con pistas</b>'; Game = PistasMode; }
      else if (entry.mode === 'wordle') { if (tb) tb.innerHTML = '🔤 Reto de hoy: <b>Wordle de jugadores</b>'; Game = WordleMode; }
      else if (entry.mode === 'foto') { if (tb) tb.innerHTML = '📸 Reto de hoy: <b>¿Quién es este jugador?</b>'; Game = FotoMode; }
      else if (entry.mode === 'porteria') { if (tb) tb.innerHTML = '🥅 Reto de hoy: <b>Goles míticos: ¿por dónde entró?</b>'; Game = PorteriaMode; }
      else if (entry.mode === 'sudoku') { if (tb) tb.innerHTML = '🧩 Reto de hoy: <b>Sudoku de fútbol</b>'; Game = SudokuMode; }
      else if (entry.mode === 'nat') { if (tb) tb.innerHTML = '🌍 Reto de hoy: <b>¿De qué selección es?</b>'; Game = NatMode; }
      else if (entry.mode === 'punteria') { if (tb) tb.innerHTML = '🎯 Reto de hoy: <b>Puntería: marca goles</b>'; Game = PunteriaMode; }
      else { const t = themeByKey(entry.theme); if (tb) tb.innerHTML = `🎯 ¿Más o menos? · <b>${t.emoji} ${t.label}</b>`; Game = MasMenosMode; }
    }
    setTimerVisible(false);
    const w = el('mg-board');
    if (w) w.innerHTML = '<div style="text-align:center;padding:28px;color:var(--muted)">Cargando el reto de hoy…</div>';
    const token = ++startToken;
    ensureMgData().then(() => {
      if (token !== startToken) return; // se reabrió/cambió de día mientras cargaba
      reconcileDone(); // si su partida se borró del servidor, limpia el candado local
      reconcileBest(); // "tu mejor de hoy" = tu puntuación registrada en el ranking
      // 1 partida al día SOLO para el reto de HOY (previewOffset 0). En la vista
      // previa de días siguientes (solo Zoesita) puede jugar/repetir para testear.
      if (!bonusMode && previewOffset === 0 && (isDone() || playedTodayServer())) { showLocked(); return; }
      setTimerVisible(false);
      if (isNew) { mountNewGame(entry); return; } // juego nuevo (newgames.js)
      // Tarjeta de intro (8 originales) → al pulsar Empezar arranca el juego.
      showOrigIntro(entry.mode, function () {
        setTimerVisible(entry.mode === 'mm' || entry.mode === 'pistas' || entry.mode === 'foto' || entry.mode === 'nat');
        Game.start();
      });
    });
  }
  // Monta un juego nuevo (newgames.js) en el pop-up real, con su propia intro.
  // Al terminar reporta la nota → se guarda, bloquea (1/día) y muestra el ranking,
  // igual que los 8 originales. En el bonus solo se juega (sin guardar/ranking).
  function mountNewGame(entry) {
    setTimerVisible(false); setHud(''); Game = null;
    const tb = el('mg-theme'), board = el('mg-board'); if (!board) return;
    board.innerHTML = '';
    const sub = document.createElement('div'); board.appendChild(sub);
    const m = window.NG.meta(entry.mode);
    if (tb) tb.innerHTML = `${m.emoji} Reto de hoy: <b>${m.name}</b>`;
    let reported = false;
    window.NG.mount(entry.mode, sub, entry.i || 0, function (score) {
      // bonus o vista previa de días futuros (testing) → solo se juega, sin guardar/bloquear.
      if (bonusMode || previewOffset !== 0) return;
      if (reported) return; reported = true;
      setBest(score);                 // mejor del día (según MODE_SCORING del modo)
      sub.querySelectorAll('[data-act="reset"]').forEach(b => b.style.display = 'none'); // sin repetir el reto de hoy
      revealRanking();                // setDone + saveMyScore + clasificación de hoy
    }, bonusMode ? MG_BONUS_SEED : seedInt()); // bonus: semilla fija · diario: semilla POR FECHA → mismo contenido para todos ese día
  }
  function showLocked() {
    gameOver = true; setTimerVisible(false);
    const sc = scoringFor(dayMode()).fmt(myTodayScore());
    setHud(`✅ Completado · Tu resultado: <b>${sc}</b>`);
    const wrap = el('mg-board');
    if (wrap) wrap.innerHTML = `<div class="mg-end"><div class="mg-end-emoji">🔒</div><h3>¡Ya jugaste el reto de hoy!</h3>
      <p>Tu resultado: <b>${sc}</b></p>
      <p class="mg-note">Solo se juega una vez al día. Vuelve mañana para el próximo reto 🔥</p></div>`;
    revealRanking();
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
      setHud(`Aciertos: <b>${this.score}</b> &nbsp;·&nbsp; Tu mejor de hoy: <b>${bestLabel()}</b> 🔥`);
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
        <p>Aciertos seguidos: <b>${this.score}</b></p><p class="mg-end-best">Tu mejor de hoy: <b>${bestLabel()}</b> 🔥</p>
        <button class="btn-primary" id="mg-again">Jugar otra vez</button></div>`;
      el('mg-again').addEventListener('click', () => this.start());
      setHud(`Aciertos: <b>${this.score}</b> &nbsp;·&nbsp; Tu mejor de hoy: <b>${bestLabel()}</b> 🔥`);
      revealRanking();
    },
    win() {
      stopTimer(); resetTimerBar();
      const wrap = el('mg-board'); if (!wrap) return;
      wrap.innerHTML = `<div class="mg-end"><div class="mg-end-emoji">🏆</div><h3>¡Los has acertado TODOS!</h3>
        <p>Puntuación máxima: <b>${this.score}</b></p><button class="btn-primary" id="mg-again">Jugar otra vez</button></div>`;
      el('mg-again').addEventListener('click', () => this.start());
      revealRanking();
    },
  };

  // ===========================================================
  //  MODO 2 — Adivina con pistas
  // ===========================================================
  const PistasMode = {
    secret: null, clues: [], shown: 1, attempts: 0, max: 6, solved: false,
    start() {
      const rng = mulberry32(seedInt() ^ 0x9e3779b9); // semilla para barajar las pistas
      this.secret = MG_PISTAS_POOL[(currentEntry().i || 0) % MG_PISTAS_POOL.length];
      const p = this.secret;
      const clues = [
        { k: 'Posición', v: p.pos },
        { k: 'Edad', v: p.age + ' años' },
        { k: 'País', v: `${flag(p.iso)} ${p.pais}` },
        { k: 'Club', v: p.club },
        { k: 'Dorsal', v: '#' + p.num },
      ];
      // Baraja el orden de las pistas con la semilla del día: no siempre se
      // empieza por la misma, pero el orden es igual para todos cada día.
      for (let i = clues.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); const t = clues[i]; clues[i] = clues[j]; clues[j] = t; }
      this.clues = clues;
      this.shown = 1; this.attempts = 0; this.solved = false; this._tries = []; gameOver = false; busy = false;
      this.render();
      startTimer(45000, () => this.timeUp());
    },
    points() { return Math.max(1, 7 - (this.attempts + 1)); }, // puntos si aciertas en el PRÓXIMO intento
    render() {
      const wrap = el('mg-board'); if (!wrap) return;
      let cluesHtml = '';
      this.clues.forEach((c, i) => {
        const locked = i >= this.shown;
        cluesHtml += `<div class="mg-clue${locked ? ' locked' : ''}"><b>${c.k}:</b> ${locked ? '🔒' : c.v}</div>`;
      });
      wrap.innerHTML = `
        <div class="mg-clues">${cluesHtml}</div>
        <div class="mg-guess-row">
          <div class="mg-guess-field">
            <input class="mg-guess-input" id="mg-guess" placeholder="Escribe un nombre…" autocomplete="off" autocorrect="off" spellcheck="false">
            <div class="mg-suggest hidden" id="mg-suggest"></div>
          </div>
          <button class="mg-guess-btn" id="mg-guess-btn">Adivinar</button>
        </div>
        <div class="mg-pts-hint">Pistas usadas: <b>${this.shown}</b>/${this.clues.length} · cuantas menos, mejor</div>
        <div class="mg-tries" id="mg-tries"></div>`;
      el('mg-guess-btn').addEventListener('click', () => this.guess());
      this.setupAutocomplete();
      setHud(`Adivina al jugador · Tu mejor de hoy: <b>${bestLabel()}</b> 🔥`);
      this.renderTries();
    },
    // Autocompletado propio: solo sugiere al escribir (≥2 letras). Al hacer
    // clic en el campo NO se despliegan todos los jugadores de golpe.
    setupAutocomplete() {
      const inp = el('mg-guess'), box = el('mg-suggest');
      if (!inp || !box) return;
      const self = this;
      let active = -1, items = [];
      const hide = () => { box.classList.add('hidden'); box.innerHTML = ''; active = -1; items = []; };
      const pick = name => { inp.value = name; hide(); inp.focus(); };
      const upd = () => { Array.from(box.children).forEach((n, i) => n.classList.toggle('active', i === active)); };
      const show = q => {
        const nq = norm(q);
        if (nq.length < 2) { hide(); return; }
        items = MG_PISTAS_POOL.filter(p => { const np = norm(p.n); return np.includes(nq) || np.split(' ').some(w => w.startsWith(nq)); }).slice(0, 5);
        if (!items.length) { hide(); return; }
        active = -1;
        box.innerHTML = items.map((p, i) => `<div class="mg-sug-item" data-i="${i}">${flag(p.iso)}<span>${p.n}</span></div>`).join('');
        box.classList.remove('hidden');
        Array.from(box.children).forEach(node => node.addEventListener('mousedown', e => { e.preventDefault(); pick(items[+node.dataset.i].n); }));
      };
      inp.addEventListener('input', () => show(inp.value));
      inp.addEventListener('keydown', e => {
        const opened = !box.classList.contains('hidden');
        if (e.key === 'ArrowDown' && opened) { e.preventDefault(); active = Math.min(active + 1, items.length - 1); upd(); }
        else if (e.key === 'ArrowUp' && opened) { e.preventDefault(); active = Math.max(active - 1, 0); upd(); }
        else if (e.key === 'Enter') { e.preventDefault(); if (opened && active >= 0 && items[active]) pick(items[active].n); else { hide(); self.guess(); } }
        else if (e.key === 'Escape') { hide(); }
      });
      inp.addEventListener('blur', () => setTimeout(hide, 120));
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
      const clues = this.shown;            // pistas que tenías visibles al acertar
      const score = win ? clues : MG_DNF;  // gana quien use MENOS pistas
      setBest(score);
      const head = win ? { e: '✅', t: `¡Acertaste con ${clues} ${clues === 1 ? 'pista' : 'pistas'}!` }
                       : { e: byTime ? '⏰' : '❌', t: byTime ? '¡Se acabó el tiempo!' : '¡No era!' };
      wrap.innerHTML = `<div class="mg-end"><div class="mg-end-emoji">${head.e}</div><h3>${head.t}</h3>
        <div class="mg-reveal">${flag(this.secret.iso)} <b>${this.secret.n}</b><br><span class="mg-reveal-sub">${this.secret.pos} · ${this.secret.club} · #${this.secret.num}</span></div>
        ${win ? `<p>Lo adivinaste con <b>${clues}</b> ${clues === 1 ? 'pista' : 'pistas'}. ¡Cuantas menos, mejor!</p>` : ''}
        <p class="mg-end-best">Tu mejor de hoy: <b>${bestLabel()}</b> 🔥</p>
        <button class="btn-primary" id="mg-again">Jugar otra vez</button></div>`;
      el('mg-again').addEventListener('click', () => { this._tries = []; this.start(); });
      setHud(`Adivina al jugador · Tu mejor de hoy: <b>${bestLabel()}</b> 🔥`);
      revealRanking();
    },
  };

  // ===========================================================
  //  MODO 3 — Wordle de jugadores
  // ===========================================================
  const WordleMode = {
    sol: '', player: null, guesses: [], cur: '', max: 6, keyState: {}, msgTimer: null, _keyHandler: null,
    start() {
      this.player = MG_WORDLE_POOL[(currentEntry().i || 0) % MG_WORDLE_POOL.length];
      this.sol = this.player.sol;
      this.guesses = []; this.cur = ''; this.keyState = {}; gameOver = false; busy = false;
      this.render();
      // Teclado físico (PC): escuchamos mientras el panel esté abierto en «Jugar»
      if (this._keyHandler) document.removeEventListener('keydown', this._keyHandler);
      this._keyHandler = (e) => {
        if (!open || view !== 'play' || gameOver || Game !== WordleMode) return;
        if (e.key === 'Enter') { e.preventDefault(); this.enter(); }
        else if (e.key === 'Backspace') { e.preventDefault(); this.back(); }
        else if (e.key.length === 1 && /[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ]/.test(e.key)) { this.type(e.key); }
      };
      document.addEventListener('keydown', this._keyHandler);
      // Sin crono: el Wordle es difícil, mejor pensar con calma.
    },
    teardown() { if (this._keyHandler) { document.removeEventListener('keydown', this._keyHandler); this._keyHandler = null; } },
    len() { return this.sol.length; },
    diffLabel() { const n = this.len(); return n <= 4 ? 'Fácil' : n <= 6 ? 'Media' : 'Difícil'; },
    normLetter(ch) { return (ch || '').toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); },
    type(ch) {
      if (gameOver) return;
      const L = this.normLetter(ch);
      if (!/^[A-Z]$/.test(L) || this.cur.length >= this.len()) return;
      this.cur += L; this.paintGrid();
    },
    back() { if (gameOver) return; this.cur = this.cur.slice(0, -1); this.paintGrid(); },
    enter() {
      if (gameOver) return;
      if (this.cur.length < this.len()) { this.flash('Faltan letras'); return; }
      const guess = this.cur, res = this.evaluate(guess);
      this.guesses.push({ g: guess, r: res });
      for (let i = 0; i < guess.length; i++) this.bumpKey(guess[i], res[i]);
      this.cur = '';
      this.paintGrid(); this.renderKeys();
      if (guess === this.sol) { gameOver = true; stopTimer(); setTimeout(() => this.end(true), 400); return; }
      if (this.guesses.length >= this.max) { gameOver = true; stopTimer(); setTimeout(() => this.end(false), 400); return; }
    },
    evaluate(guess) {
      const len = this.len(), res = new Array(len).fill('absent'), used = new Array(len).fill(false);
      for (let i = 0; i < len; i++) if (guess[i] === this.sol[i]) { res[i] = 'correct'; used[i] = true; }
      for (let i = 0; i < len; i++) {
        if (res[i] === 'correct') continue;
        for (let j = 0; j < len; j++) { if (!used[j] && this.sol[j] === guess[i]) { res[i] = 'present'; used[j] = true; break; } }
      }
      return res;
    },
    rank(s) { return s === 'correct' ? 3 : s === 'present' ? 2 : 1; },
    bumpKey(ch, st) { const c = this.keyState[ch]; if (!c || this.rank(st) > this.rank(c)) this.keyState[ch] = st; },
    render() {
      const wrap = el('mg-board'); if (!wrap) return;
      wrap.innerHTML = `
        <div class="mg-wd-hint">🔤 Apellido de futbolista · ${this.len()} letras · <b>${this.diffLabel()}</b></div>
        <div class="mg-wd-grid" id="mg-wd-grid" style="--cols:${this.len()}"></div>
        <div class="mg-wd-msg" id="mg-wd-msg"></div>
        <div class="mg-wd-keys" id="mg-wd-keys"></div>`;
      this.paintGrid(); this.renderKeys();
      setHud(`Adivina el apellido · Tu mejor de hoy: <b>${bestLabel()}</b> 🔥`);
    },
    paintGrid() {
      const grid = el('mg-wd-grid'); if (!grid) return;
      const len = this.len(); let html = '';
      for (let r = 0; r < this.max; r++) {
        const past = this.guesses[r];
        for (let c = 0; c < len; c++) {
          if (past) html += `<div class="mg-wd-cell ${past.r[c]}">${past.g[c]}</div>`;
          else if (r === this.guesses.length) { const ch = this.cur[c] || ''; html += `<div class="mg-wd-cell${ch ? ' filled' : ''}">${ch}</div>`; }
          else html += '<div class="mg-wd-cell"></div>';
        }
      }
      grid.innerHTML = html;
    },
    renderKeys() {
      const box = el('mg-wd-keys'); if (!box) return;
      const rows = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
      let html = '';
      rows.forEach((row, ri) => {
        html += '<div class="mg-wd-krow">';
        if (ri === 2) html += '<button type="button" class="mg-wd-key wide" data-k="ENTER">⏎</button>';
        for (const ch of row) html += `<button type="button" class="mg-wd-key ${this.keyState[ch] || ''}" data-k="${ch}">${ch}</button>`;
        if (ri === 2) html += '<button type="button" class="mg-wd-key wide" data-k="BACK">⌫</button>';
        html += '</div>';
      });
      box.innerHTML = html;
      Array.from(box.querySelectorAll('.mg-wd-key')).forEach(b => b.addEventListener('click', () => {
        const k = b.dataset.k;
        if (k === 'ENTER') this.enter(); else if (k === 'BACK') this.back(); else this.type(k);
      }));
    },
    flash(msg) {
      const m = el('mg-wd-msg'); if (!m) return;
      m.textContent = msg; m.classList.add('show');
      clearTimeout(this.msgTimer); this.msgTimer = setTimeout(() => m.classList.remove('show'), 1200);
    },
    end(win, byTime) {
      stopTimer(); resetTimerBar(); this.teardown();
      const wrap = el('mg-board'); if (!wrap) return;
      const k = this.guesses.length, score = win ? k : MG_DNF; // gana quien use MENOS intentos
      setBest(score);
      const head = win ? { e: '🎉', t: `¡Correcto en ${k}/${this.max}!` }
                       : { e: byTime ? '⏰' : '❌', t: byTime ? '¡Se acabó el tiempo!' : '¡Sin intentos!' };
      wrap.innerHTML = `<div class="mg-end"><div class="mg-end-emoji">${head.e}</div><h3>${head.t}</h3>
        <div class="mg-reveal">${flag(this.player.iso)} <b>${this.sol}</b><br><span class="mg-reveal-sub">${this.player.n} · ${this.player.pos}</span></div>
        ${win ? `<p>Resuelto en <b>${k}</b> ${k === 1 ? 'intento' : 'intentos'}. ¡Cuantos menos, mejor!</p>` : ''}
        <p class="mg-end-best">Tu mejor de hoy: <b>${bestLabel()}</b> 🔥</p>
        <button class="btn-primary" id="mg-again">Jugar otra vez</button></div>`;
      el('mg-again').addEventListener('click', () => this.start());
      setHud(`Adivina el apellido · Tu mejor de hoy: <b>${bestLabel()}</b> 🔥`);
      revealRanking();
    },
  };

  // ===========================================================
  //  MODO 4 — ¿Quién es este jugador? (foto ampliada de Wikipedia)
  // ===========================================================
  const MG_FOTO_CACHE = {}; // título wiki -> url de la foto (o 'FAIL')
  function fotoFetch(title) {
    return new Promise(resolve => {
      if (MG_FOTO_CACHE[title] !== undefined) { resolve(MG_FOTO_CACHE[title]); return; }
      const u = 'https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&prop=pageimages&piprop=thumbnail&pithumbsize=800&titles=' + encodeURIComponent(title);
      fetch(u).then(r => r.json()).then(d => {
        const pages = (d.query && d.query.pages) || {}; let src = '';
        for (const k in pages) { if (pages[k].thumbnail && pages[k].thumbnail.source) src = pages[k].thumbnail.source; }
        MG_FOTO_CACHE[title] = src || 'FAIL'; resolve(MG_FOTO_CACHE[title]);
      }).catch(() => { MG_FOTO_CACHE[title] = 'FAIL'; resolve('FAIL'); });
    });
  }

  const FotoMode = {
    secret: null, attempts: 0, max: 6, level: 0, _tries: [], _req: 0,
    zooms: [6.5, 4.6, 3.3, 2.3, 1.5, 1.0],
    zlabels: ['🔍 Solo un detalle', '🔍 Muy de cerca', '🔍 De cerca', '👀 Se va viendo', '🙂 Casi entera', '🖼️ Foto completa'],
    start() {
      this.secret = MG_FOTO_POOL[(currentEntry().i || 0) % MG_FOTO_POOL.length];
      this.attempts = 0; this.level = 0; this._tries = []; gameOver = false; busy = false;
      this.render();
      startTimer(120000, () => this.timeUp()); // 2 minutos (la foto se va abriendo con cada fallo)
      const req = ++this._req;
      const setImg = url => {
        if (req !== this._req) return; // cambió de día/modo: descarta
        const im = el('mg-foto-img'); if (!im) return;
        if (url && url !== 'FAIL') { im.textContent = ''; im.style.backgroundImage = `url("${url}")`; im.classList.remove('loading'); this.applyZoom(true); }
        else { im.classList.remove('loading'); im.classList.add('failed'); im.innerHTML = `Sin foto 😕<br><span class="mg-foto-fallback">${flag(this.secret.iso)} ${this.secret.pais} · ${this.secret.pos}</span>`; }
      };
      if (this.secret.src) setImg(this.secret.src);            // foto local
      else fotoFetch(this.secret.wiki).then(setImg);           // foto de Wikipedia
    },
    points() { return Math.max(1, 8 - (this.attempts + 1)); },
    applyZoom(instant) {
      const im = el('mg-foto-img');
      if (im) {
        const fy = (this.secret && this.secret.fy != null) ? this.secret.fy : 22;
        const zMul = (this.secret && this.secret.zMul) || 1; // zoom extra para algunas fotos
        im.style.backgroundPosition = '50% ' + fy + '%'; // recorta a la altura de la CARA
        im.style.transformOrigin = '50% ' + fy + '%';    // y hace zoom justo sobre ese punto
        if (!im.classList.contains('loading') && !im.classList.contains('failed')) {
          const sc = 'scale(' + (this.zooms[Math.min(this.level, this.zooms.length - 1)] * zMul) + ')';
          if (instant) { // al aparecer, aplicar el zoom SIN animación (si no, se ve la foto entera ~1s y ayuda)
            const prev = im.style.transition; im.style.transition = 'none'; im.style.transform = sc; void im.offsetWidth; im.style.transition = prev || '';
          } else { im.style.transform = sc; }
        }
      }
      const zl = el('mg-foto-zoomlbl'); if (zl) zl.textContent = this.zlabels[Math.min(this.level, this.zlabels.length - 1)];
    },
    render() {
      const wrap = el('mg-board'); if (!wrap) return;
      wrap.innerHTML = `
        <div class="mg-foto-frame"><div class="mg-foto-img loading" id="mg-foto-img">Cargando foto…</div></div>
        <div class="mg-foto-zoomlbl" id="mg-foto-zoomlbl">🔍 Muy de cerca</div>
        <div class="mg-foto-help">Cada fallo <b>aleja la foto</b> y se ve mejor 👀, pero gana quien lo adivine en <b>menos intentos</b>. ¡Arriésgate cuanto antes! ⏱️ 2 min</div>
        <div class="mg-guess-row">
          <div class="mg-guess-field">
            <input class="mg-guess-input" id="mg-guess" placeholder="¿Quién es?" autocomplete="off" autocorrect="off" spellcheck="false">
            <div class="mg-suggest hidden" id="mg-suggest"></div>
          </div>
          <button class="mg-guess-btn" id="mg-guess-btn">Adivinar</button>
        </div>
        <div class="mg-pts-hint">Intento <b>${this.attempts + 1}</b>/${this.max} · cuantos menos, mejor</div>
        <div class="mg-tries" id="mg-tries"></div>`;
      el('mg-guess-btn').addEventListener('click', () => this.guess());
      this.setupAutocomplete();
      this.renderTries();
      setHud(`Mira la foto y adivina · Tu mejor de hoy: <b>${bestLabel()}</b> 🔥`);
    },
    renderTries() {
      const t = el('mg-tries'); if (!t) return;
      t.innerHTML = (this._tries || []).map(g => `<span class="mg-try bad">✗ ${g}</span>`).join('');
    },
    matches(input) {
      const g = norm(input); if (!g) return false;
      const full = norm(this.secret.n); const words = full.split(' ');
      return g === full || (g.length >= 3 && words.includes(g));
    },
    guess() {
      if (busy || gameOver) return;
      const inp = el('mg-guess'); if (!inp) return;
      const val = inp.value.trim(); if (!val) return;
      this.attempts++;
      if (this.matches(val)) { gameOver = true; stopTimer(); this.end(true); return; }
      (this._tries = this._tries || []).push(val);
      if (this.attempts >= this.max) { gameOver = true; stopTimer(); this.end(false); return; }
      this.level = Math.min(this.level + 1, this.zooms.length - 1); this.applyZoom();
      const hint = document.querySelector('.mg-pts-hint'); if (hint) hint.innerHTML = `Intento <b>${this.attempts + 1}</b>/${this.max} · cuantos menos, mejor`;
      this.renderTries();
      inp.value = ''; inp.focus();
    },
    timeUp() { if (gameOver || busy) return; gameOver = true; this.end(false, true); },
    // Autocompletado propio (igual que en Pistas): solo sugiere al escribir.
    setupAutocomplete() {
      const inp = el('mg-guess'), box = el('mg-suggest');
      if (!inp || !box) return;
      const self = this;
      let active = -1, items = [];
      const hide = () => { box.classList.add('hidden'); box.innerHTML = ''; active = -1; items = []; };
      const pick = name => { inp.value = name; hide(); inp.focus(); };
      const upd = () => { Array.from(box.children).forEach((n, i) => n.classList.toggle('active', i === active)); };
      const show = q => {
        const nq = norm(q);
        if (nq.length < 2) { hide(); return; }
        items = MG_FOTO_POOL.filter(p => { const np = norm(p.n); return np.includes(nq) || np.split(' ').some(w => w.startsWith(nq)); }).slice(0, 5);
        if (!items.length) { hide(); return; }
        active = -1;
        box.innerHTML = items.map((p, i) => `<div class="mg-sug-item" data-i="${i}">${flag(p.iso)}<span>${p.n}</span></div>`).join('');
        box.classList.remove('hidden');
        Array.from(box.children).forEach(node => node.addEventListener('mousedown', e => { e.preventDefault(); pick(items[+node.dataset.i].n); }));
      };
      inp.addEventListener('input', () => show(inp.value));
      inp.addEventListener('keydown', e => {
        const opened = !box.classList.contains('hidden');
        if (e.key === 'ArrowDown' && opened) { e.preventDefault(); active = Math.min(active + 1, items.length - 1); upd(); }
        else if (e.key === 'ArrowUp' && opened) { e.preventDefault(); active = Math.max(active - 1, 0); upd(); }
        else if (e.key === 'Enter') { e.preventDefault(); if (opened && active >= 0 && items[active]) pick(items[active].n); else { hide(); self.guess(); } }
        else if (e.key === 'Escape') { hide(); }
      });
      inp.addEventListener('blur', () => setTimeout(hide, 120));
    },
    end(win, byTime) {
      stopTimer(); resetTimerBar();
      const wrap = el('mg-board'); if (!wrap) return;
      const tries = this.attempts;         // intentos usados
      const score = win ? tries : MG_DNF;  // gana quien acierte en MENOS intentos
      setBest(score);
      const head = win ? { e: '🎉', t: `¡Acertaste en ${tries} ${tries === 1 ? 'intento' : 'intentos'}!` }
                       : { e: byTime ? '⏰' : '❌', t: byTime ? '¡Se acabó el tiempo!' : '¡No era!' };
      const url = this.secret.src || MG_FOTO_CACHE[this.secret.wiki];
      const fy = this.secret.fy != null ? this.secret.fy : 22;
      const photo = (url && url !== 'FAIL') ? `<div class="mg-foto-reveal" style="background-image:url('${url}');background-position:50% ${fy}%"></div>` : '';
      wrap.innerHTML = `<div class="mg-end"><div class="mg-end-emoji">${head.e}</div><h3>${head.t}</h3>
        ${photo}
        <div class="mg-reveal">${flag(this.secret.iso)} <b>${this.secret.n}</b><br><span class="mg-reveal-sub">${this.secret.pais} · ${this.secret.pos}</span></div>
        ${win ? `<p>Acertado en <b>${tries}</b> ${tries === 1 ? 'intento' : 'intentos'}. ¡Cuantos menos, mejor!</p>` : ''}
        <p class="mg-end-best">Tu mejor de hoy: <b>${bestLabel()}</b> 🔥</p>
        <button class="btn-primary" id="mg-again">Jugar otra vez</button></div>`;
      el('mg-again').addEventListener('click', () => { this._tries = []; this.start(); });
      setHud(`Mira la foto y adivina · Tu mejor de hoy: <b>${bestLabel()}</b> 🔥`);
      revealRanking();
    },
  };

  // ===========================================================
  //  MODO 5 — Goles míticos: ¿por dónde entró? (puntería)
  // ===========================================================
  const PorteriaMode = {
    goals: [], idx: 0, guess: null, dists: [], done: false, locked: false,
    start() {
      const e = currentEntry(), pool = MG_PORTERIA_POOL;
      this.goals = [pool[(e.i || 0) % pool.length]];
      if (e.i2 != null) this.goals.push(pool[e.i2 % pool.length]); // 2 goles → media de distancias
      this.idx = 0; this.guess = null; this.dists = []; this.done = false; this.locked = false;
      gameOver = false; busy = false;
      this.render();
    },
    goal() { return this.goals[this.idx]; },
    render() {
      const wrap = el('mg-board'); if (!wrap) return;
      this.locked = false; this.guess = null;
      const multi = this.goals.length > 1;
      const step = multi ? `<div class="mg-net-step">⚽ Gol <b>${this.idx + 1}</b> de ${this.goals.length}</div>` : '';
      wrap.innerHTML = `
        ${step}
        <div class="mg-net-desc">⚽ <b>${this.goal().desc}</b></div>
        <div class="mg-net" id="mg-net"><div class="mg-net-ov" id="mg-net-ov"></div></div>
        <div class="mg-net-hint" id="mg-net-hint">👆 Toca en la portería por dónde crees que entró el balón</div>
        <div class="mg-net-actions" id="mg-net-actions"><button class="btn-primary" id="mg-net-confirm" disabled>Confirmar</button></div>`;
      el('mg-net').addEventListener('click', e => this.place(e));
      el('mg-net-confirm').addEventListener('click', () => this.confirm());
      setHud(`Goles míticos · Tu mejor de hoy: <b>${bestLabel()}</b> 🔥`);
    },
    place(e) {
      if (this.done || this.locked) return;
      const net = el('mg-net'), r = net.getBoundingClientRect();
      this.guess = {
        x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)),
        y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)),
      };
      this.draw(false);
      const c = el('mg-net-confirm'); if (c) c.disabled = false;
      const h = el('mg-net-hint'); if (h) h.textContent = 'Mueve la marca si quieres y pulsa Confirmar';
    },
    draw(reveal) {
      const ov = el('mg-net-ov'); if (!ov) return;
      const g = this.goal();
      let html = '';
      if (reveal && this.guess) html += `<svg class="mg-net-line" viewBox="0 0 100 100" preserveAspectRatio="none"><line x1="${(this.guess.x * 100).toFixed(1)}" y1="${(this.guess.y * 100).toFixed(1)}" x2="${(g.x * 100).toFixed(1)}" y2="${(g.y * 100).toFixed(1)}"/></svg>`;
      if (this.guess) html += `<div class="mg-net-mark you" style="left:${(this.guess.x * 100).toFixed(1)}%;top:${(this.guess.y * 100).toFixed(1)}%"></div>`;
      if (reveal) html += `<div class="mg-net-mark real" style="left:${(g.x * 100).toFixed(1)}%;top:${(g.y * 100).toFixed(1)}%">⚽</div>`;
      ov.innerHTML = html;
    },
    distOf(guess, goal) {
      const dx = (guess.x - goal.x) * 7.32; // ancho real de la portería (m)
      const dy = (guess.y - goal.y) * 2.44; // alto real (m)
      return Math.sqrt(dx * dx + dy * dy);
    },
    confirm() {
      if (this.done || this.locked || !this.guess) return;
      this.locked = true;
      this.draw(true);
      const dist = this.distOf(this.guess, this.goal());
      this.dists.push(dist);
      const em = d => d <= 0.3 ? '🎯' : d <= 0.9 ? '🔥' : d <= 2 ? '👏' : '😬';
      const last = this.idx >= this.goals.length - 1;
      if (!last) {
        const h = el('mg-net-hint'); if (h) h.innerHTML = `${em(dist)} A <b>${dist.toFixed(1)} m</b> · ahora el <b>segundo gol</b>`;
        const a = el('mg-net-actions'); if (a) a.innerHTML = '<button class="btn-primary" id="mg-next">Siguiente gol →</button>';
        const nx = el('mg-next'); if (nx) nx.addEventListener('click', () => { this.idx++; this.render(); });
        return;
      }
      this.done = true; gameOver = true;
      const avg = this.dists.reduce((a, b) => a + b, 0) / this.dists.length;
      const score = Math.round(avg * 10) / 10; // distancia (media) en metros · gana la MENOR
      setBest(score);
      const h = el('mg-net-hint');
      if (h) {
        if (this.goals.length > 1) {
          const parts = this.dists.map((d, i) => `Gol ${i + 1}: <b>${d.toFixed(1)} m</b>`).join(' · ');
          h.innerHTML = `${em(avg)} ${parts} → media <b>${score.toFixed(1)} m</b> · ¡cuanto más cerca, mejor!`;
        } else {
          h.innerHTML = `${em(avg)} A <b>${score.toFixed(1)} m</b> del punto real · ¡cuanto más cerca, mejor!`;
        }
      }
      const a = el('mg-net-actions'); if (a) a.innerHTML = '<button class="btn-primary" id="mg-again">Jugar otra vez</button>';
      const ag = el('mg-again'); if (ag) ag.addEventListener('click', () => this.start());
      setHud(`Goles míticos · Tu mejor de hoy: <b>${bestLabel()}</b> 🔥`);
      revealRanking();
    },
  };

  // ===========================================================
  //  MODO 6 — Sudoku de fútbol (6×6 con emojis)
  // ===========================================================
  const SUD_EMO = ['⚽', '🏆', '🧤', '👟', '🟨', '👕'];
  const SudokuMode = {
    cells: [], sel: -1, startT: 0, tId: null, solved: false, diff: '',
    start() {
      const rng = mulberry32(seedInt() ^ 0x68e31da4); // semilla para barajar (conserva la unicidad)
      const base = MG_SUDOKU[(currentEntry().i || 0) % MG_SUDOKU.length];
      this.diff = base.d;
      const arr = base.p.split('').map(ch => { const n = +ch; return n === 0 ? -1 : n - 1; });
      const puzzle = this.shuffle(arr, rng); // baraja conservando la unicidad
      this.cells = puzzle.map(v => v < 0 ? { v: null, given: false } : { v: v, given: true });
      this.sel = -1; this.solved = false; gameOver = false; busy = false;
      this.startT = Date.now();
      this.render();
      this.startClock();
    },
    teardown() { if (this.tId) { clearInterval(this.tId); this.tId = null; } },
    startClock() { this.teardown(); this.tId = setInterval(() => { if (open && view === 'play' && Game === SudokuMode && !this.solved) this.updHud(); }, 1000); },
    elapsed() { return Math.floor((Date.now() - this.startT) / 1000); },
    updHud() { setHud(`⏱ ${this.elapsed()}s &nbsp;·&nbsp; Tu mejor de hoy: <b>${bestLabel()}</b> 🔥`); },
    // Transforma un puzzle (con sus huecos) conservando la solución ÚNICA:
    // renombra los símbolos y baraja bandas/filas y pilas/columnas (cajas 2×3).
    shuffle(arr, rng) {
      let g = []; for (let r = 0; r < 6; r++) g.push(arr.slice(r * 6, r * 6 + 6));
      const sh = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
      const perm = sh([0, 1, 2, 3, 4, 5]);                 // renombra los símbolos (no toca huecos)
      g = g.map(r => r.map(v => v < 0 ? -1 : perm[v]));
      const rows = [];                                     // baraja filas dentro de cada banda (2 filas) y las bandas
      sh([0, 1, 2]).forEach(b => sh([0, 1]).forEach(w => rows.push(g[b * 2 + w])));
      g = rows;
      const colOrder = [];                                 // baraja columnas dentro de cada pila (3 cols) y las pilas
      sh([0, 1]).forEach(s => sh([0, 1, 2]).forEach(w => colOrder.push(s * 3 + w)));
      g = g.map(r => colOrder.map(c => r[c]));
      return g.reduce((a, r) => a.concat(r), []);
    },
    render() {
      const wrap = el('mg-board'); if (!wrap) return;
      let grid = '';
      for (let i = 0; i < 36; i++) {
        const c = this.cells[i], r = Math.floor(i / 6), col = i % 6;
        const cls = ['sud-cell'];
        if (c.given) cls.push('given');
        if (col === 2) cls.push('br');
        if (r === 1 || r === 3) cls.push('bb');
        grid += `<button class="${cls.join(' ')}" data-i="${i}"${c.given ? ' disabled' : ''}>${c.v != null ? SUD_EMO[c.v] : ''}</button>`;
      }
      let pal = SUD_EMO.map((e, v) => `<button class="sud-key" data-v="${v}">${e}</button>`).join('');
      pal += '<button class="sud-key sud-erase" data-v="-1">⌫</button>';
      wrap.innerHTML = `
        <div class="sud-grid" id="sud-grid">${grid}</div>
        <div class="sud-pal" id="sud-pal">${pal}</div>
        <div class="sud-hint">Dificultad: <b>${this.diff}</b> · toca una casilla y elige un emoji · cada fila/columna/caja con los 6, sin repetir</div>`;
      el('sud-grid').querySelectorAll('.sud-cell').forEach(b => b.addEventListener('click', () => this.selectCell(+b.dataset.i)));
      el('sud-pal').querySelectorAll('.sud-key').forEach(b => b.addEventListener('click', () => this.place(+b.dataset.v)));
      this.paint();
      this.updHud();
    },
    selectCell(i) { if (this.solved || this.cells[i].given) return; this.sel = i; this.paint(); },
    place(v) {
      if (this.solved || this.sel < 0) return;
      const c = this.cells[this.sel]; if (c.given) return;
      c.v = (v < 0) ? null : v;
      this.paint();
      this.checkSolved();
    },
    conflicts() {
      const bad = new Set();
      const check = group => { const seen = {}; group.forEach(i => { const v = this.cells[i].v; if (v == null) return; if (seen[v] != null) { bad.add(i); bad.add(seen[v]); } else seen[v] = i; }); };
      for (let r = 0; r < 6; r++) { const g = []; for (let c = 0; c < 6; c++) g.push(r * 6 + c); check(g); }
      for (let c = 0; c < 6; c++) { const g = []; for (let r = 0; r < 6; r++) g.push(r * 6 + c); check(g); }
      for (let br = 0; br < 3; br++) for (let bc = 0; bc < 2; bc++) { const g = []; for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) g.push((br * 2 + r) * 6 + (bc * 3 + c)); check(g); }
      return bad;
    },
    paint() {
      const grid = el('sud-grid'); if (!grid) return;
      const bad = this.conflicts();
      grid.querySelectorAll('.sud-cell').forEach(b => {
        const i = +b.dataset.i, c = this.cells[i];
        b.textContent = c.v != null ? SUD_EMO[c.v] : '';
        b.classList.toggle('sel', i === this.sel);
        b.classList.toggle('conflict', bad.has(i));
      });
    },
    checkSolved() {
      if (this.cells.some(c => c.v == null) || this.conflicts().size > 0) return;
      this.solved = true; gameOver = true; this.teardown();
      const t = this.elapsed();
      const score = t; // tiempo en segundos · gana quien lo resuelva ANTES
      setBest(score);
      const wrap = el('mg-board'); if (!wrap) return;
      wrap.innerHTML = `<div class="mg-end"><div class="mg-end-emoji">🧩</div><h3>¡Sudoku resuelto!</h3>
        <p>Lo resolviste en <b>${fmtMMSS(t)}</b>. ¡Cuanto antes, mejor!</p>
        <p class="mg-end-best">Tu mejor de hoy: <b>${bestLabel()}</b> 🔥</p>
        <button class="btn-primary" id="mg-again">Jugar otra vez</button></div>`;
      el('mg-again').addEventListener('click', () => this.start());
      setHud(`⏱ ${fmtMMSS(t)} &nbsp;·&nbsp; Tu mejor de hoy: <b>${bestLabel()}</b> 🔥`);
      revealRanking();
    },
  };

  // ===========================================================
  //  MODO 7 — ¿De qué selección es? (nacionalidad por el nombre)
  // ===========================================================
  const NatMode = {
    qs: [], qi: 0, score: 0,
    start() {
      const occ = currentEntry().i || 0;
      let slice = MG_NAT_POOL.slice(occ * 5, occ * 5 + 5);
      if (slice.length < 5) slice = MG_NAT_POOL.slice(0, 5);
      // baraja el orden de las 5 preguntas (para que no salga siempre la misma primero)
      const rng = mulberry32(seedInt() ^ 0x33ce71);
      for (let i = slice.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); const t = slice[i]; slice[i] = slice[j]; slice[j] = t; }
      this.qs = slice; this.qi = 0; this.score = 0; gameOver = false; busy = false;
      this.render();
    },
    render() {
      const wrap = el('mg-board'); if (!wrap) return;
      const q = this.qs[this.qi];
      if (!q) { this.end(); return; }
      const opts = [q.iso].concat(q.d);
      const rng = mulberry32(seedInt() ^ (0x4a1f + this.qi * 97)); // orden de opciones por día
      for (let i = opts.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); const t = opts[i]; opts[i] = opts[j]; opts[j] = t; }
      const btns = opts.map(iso => `<button class="mg-nat-opt" data-iso="${iso}">${flag(iso)}<span>${NAT_NAMES[iso] || iso}</span></button>`).join('');
      wrap.innerHTML = `
        <div class="mg-nat-q">¿De qué selección es?</div>
        <div class="mg-nat-name">${q.n}</div>
        <div class="mg-nat-opts">${btns}</div>`;
      el('mg-board').querySelectorAll('.mg-nat-opt').forEach(b => b.addEventListener('click', () => this.answer(b.dataset.iso, b)));
      setHud(`Pregunta ${this.qi + 1}/${this.qs.length} &nbsp;·&nbsp; Aciertos: <b>${this.score}</b>`);
      startTimer(10000, () => this.answer(null, null));
    },
    answer(iso, btn) {
      if (busy || gameOver) return;
      busy = true; stopTimer();
      const q = this.qs[this.qi];
      const correct = iso === q.iso;
      el('mg-board').querySelectorAll('.mg-nat-opt').forEach(b => { b.disabled = true; if (b.dataset.iso === q.iso) b.classList.add('ok'); else if (b === btn) b.classList.add('bad'); });
      if (correct) this.score++;
      setHud(`Pregunta ${this.qi + 1}/${this.qs.length} &nbsp;·&nbsp; Aciertos: <b>${this.score}</b>`);
      setTimeout(() => { this.qi++; busy = false; if (this.qi >= this.qs.length) this.end(); else this.render(); }, 1100);
    },
    end() {
      stopTimer(); resetTimerBar(); gameOver = true;
      setBest(this.score);
      const wrap = el('mg-board'); if (!wrap) return;
      const n = this.qs.length;
      const emoji = this.score === n ? '🏆' : this.score >= Math.ceil(n * 0.6) ? '👏' : '🙂';
      wrap.innerHTML = `<div class="mg-end"><div class="mg-end-emoji">${emoji}</div><h3>${this.score}/${n} aciertos</h3>
        <p class="mg-end-best">Tu mejor de hoy: <b>${bestLabel()}</b> 🔥</p>
        <button class="btn-primary" id="mg-again">Jugar otra vez</button></div>`;
      el('mg-again').addEventListener('click', () => this.start());
      setHud(`Aciertos: <b>${this.score}</b>/${n}`);
      revealRanking();
    },
  };

  // ===========================================================
  //  MODO 8 — Puntería: marca goles (arcade, balón en movimiento)
  // ===========================================================
  const PunteriaMode = {
    raf: null, last: 0, ballX: 0.5, ballDir: 1, ballSpd: 0.55, kX: 0.5, kDir: -1, kSpd: 0.48,
    goals: 0, lives: 3, cool: 0, ballW: 0.12, kW: 0.24,
    start() {
      this.ballX = 0.08; this.ballDir = 1; this.ballSpd = 0.55;
      this.kX = 0.5; this.kDir = -1; this.kSpd = 0.48; this.kW = 0.24;
      this.goals = 0; this.lives = 3; this.cool = 0;
      gameOver = false; busy = false;
      this.render();
      this.last = 0;
      this.teardown();
      this.raf = requestAnimationFrame(t => this.loop(t));
    },
    teardown() { if (this.raf) { cancelAnimationFrame(this.raf); this.raf = null; } },
    render() {
      const wrap = el('mg-board'); if (!wrap) return;
      wrap.innerHTML = `
        <div class="mg-pn-net" id="mg-pn-net">
          <div class="mg-pn-keeper" id="mg-pn-keeper"></div>
          <div class="mg-pn-ball" id="mg-pn-ball">⚽</div>
          <div class="mg-pn-flash" id="mg-pn-flash"></div>
        </div>
        <button class="btn-primary mg-pn-shoot" id="mg-pn-shoot">¡Chuta!</button>
        <div class="mg-pn-hint">Toca la portería (o ¡Chuta!) cuando el balón esté lejos del portero</div>`;
      el('mg-pn-net').addEventListener('click', () => this.shoot());
      el('mg-pn-shoot').addEventListener('click', () => this.shoot());
      this.paint();
      this.updHud();
    },
    updHud() { setHud(`⚽ Goles: <b>${this.goals}</b> &nbsp;·&nbsp; ${'❤️'.repeat(this.lives)}${'🖤'.repeat(3 - this.lives)} &nbsp;·&nbsp; Tu mejor: <b>${getBest()}</b>`); },
    paint() {
      const k = el('mg-pn-keeper'), b = el('mg-pn-ball');
      if (k) { k.style.left = (this.kX * 100) + '%'; k.style.width = (this.kW * 100) + '%'; }
      if (b) b.style.left = (this.ballX * 100) + '%';
    },
    loop(t) {
      this.raf = requestAnimationFrame(tt => this.loop(tt));
      if (!this.last) this.last = t;
      let dt = (t - this.last) / 1000; this.last = t;
      if (!open || view !== 'play' || Game !== PunteriaMode || gameOver) return; // pausa si no visible
      if (dt > 0.1) dt = 0.1;
      if (this.cool > 0) this.cool -= dt;
      // balón
      this.ballX += this.ballDir * this.ballSpd * dt;
      const bmin = this.ballW / 2, bmax = 1 - this.ballW / 2;
      if (this.ballX <= bmin) { this.ballX = bmin; this.ballDir = 1; } else if (this.ballX >= bmax) { this.ballX = bmax; this.ballDir = -1; }
      // portero
      this.kX += this.kDir * this.kSpd * dt;
      const kmin = this.kW / 2, kmax = 1 - this.kW / 2;
      if (this.kX <= kmin) { this.kX = kmin; this.kDir = 1; } else if (this.kX >= kmax) { this.kX = kmax; this.kDir = -1; }
      this.paint();
    },
    flash(txt, cls) { const f = el('mg-pn-flash'); if (!f) return; f.textContent = txt; f.className = 'mg-pn-flash show ' + cls; setTimeout(() => { const ff = el('mg-pn-flash'); if (ff) ff.className = 'mg-pn-flash'; }, 650); },
    shoot() {
      if (gameOver || this.cool > 0) return;
      this.cool = 0.3;
      const blocked = Math.abs(this.ballX - this.kX) < (this.kW / 2 + this.ballW / 2);
      if (blocked) {
        this.lives--; this.flash('¡Parada! 🧤', 'bad');
        if (this.lives <= 0) { this.end(); return; }
      } else {
        this.goals++; this.ballSpd = Math.min(2.4, this.ballSpd * 1.12); this.kSpd = Math.min(2.0, this.kSpd * 1.05);
        // El portero se ensancha en escalones (sube la dificultad): 10, 20, 30, 40, 50 y 60 goles.
        if (this.goals === 10) this.kW = 0.28;
        else if (this.goals === 20) this.kW = 0.31;
        else if (this.goals === 30) this.kW = 0.34;
        else if (this.goals === 40) this.kW = 0.37;
        else if (this.goals === 50) this.kW = 0.40;
        else if (this.goals === 60) this.kW = 0.43;
        this.flash('¡GOL! ⚽', 'ok');
        if (this.goals >= 70) { this.end(true); return; } // 70 goles → reto completado, se para
      }
      this.updHud();
    },
    end(won) {
      gameOver = true; this.teardown();
      setBest(this.goals);
      const wrap = el('mg-board'); if (!wrap) return;
      const head = won
        ? `<div class="mg-end-emoji">🏆</div><h3>¡Imparable! ${this.goals} goles</h3><p>Has completado el reto: ¡70 goles! 🔥</p>`
        : `<div class="mg-end-emoji">🥅</div><h3>${this.goals} ${this.goals === 1 ? 'gol' : 'goles'}</h3><p>¡Se te escapó el portero!</p>`;
      wrap.innerHTML = `<div class="mg-end">${head}
        <p class="mg-end-best">Tu mejor de hoy: <b>${bestLabel()}</b> 🔥</p>
        <button class="btn-primary" id="mg-again">Jugar otra vez</button></div>`;
      el('mg-again').addEventListener('click', () => this.start());
      setHud(`⚽ Goles: <b>${this.goals}</b> &nbsp;·&nbsp; Tu mejor de hoy: <b>${bestLabel()}</b> 🔥`);
      revealRanking();
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
    const modeLbl = entry.mode === 'pistas' ? '🕵️ Adivina con pistas'
                  : entry.mode === 'wordle' ? '🔤 Wordle de jugadores'
                  : entry.mode === 'foto' ? '📸 ¿Quién es este jugador?'
                  : entry.mode === 'porteria' ? '🥅 Goles míticos'
                  : entry.mode === 'sudoku' ? '🧩 Sudoku de fútbol'
                  : entry.mode === 'nat' ? '🌍 ¿De qué selección es?'
                  : entry.mode === 'punteria' ? '🎯 Puntería: marca goles'
                  : entry.mode === 'over' ? '🏁 Sin más retos'
                  : (themeByKey(entry.theme).emoji + ' ' + themeByKey(entry.theme).label);
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

  // ── Clasificación REAL del día (puntuaciones de tus amigos) ──
  function rankingBlockHTML() {
    const d = dayKey(), me = mgUser();
    // Una entrada por usuario/día; fuera las filas de prueba y los testers ocultos
    // (salvo en juegos de habilidad, donde los testers sí salen).
    const all = mgDedup().filter(r => r.user !== '__dedup_test__' && !hideRow(r));
    const medals = ['🥇', '🥈', '🥉'];
    const daysOf = u => { const set = {}; all.forEach(r => { if (r.user === u) set[r.day] = 1; }); return set; };
    const streak = u => { const set = daysOf(u); let n = 0, ord = dayOrdinal(); while (set[ordToKey(ord)]) { n++; ord--; } return n; };
    const row = (rank, user, val) => `<div class="mg-rank-row${user === me ? ' me' : ''}"><span class="mg-rank-pos">${rank <= 3 ? medals[rank - 1] : rank}</span>` +
      `<span class="mg-rank-name">${esc(user)}${user === me ? ' (tú)' : ''}</span>` +
      `<span class="mg-rank-streak">🔥 ${streak(user)}</span><span class="mg-rank-score">${val}</span></div>`;
    // Clasificación del DÍA: todos los que han jugado el reto de hoy, ordenados
    // según la métrica de ESE juego (a veces gana el más alto, a veces el más bajo).
    const todayRows = all.filter(r => r.day === d);
    const mode = (todayRows[0] && todayRows[0].mode) || dayMode();
    const sc = scoringFor(mode);
    const cmp = (a, b) => {
      const diff = sc.lower ? (a.score - b.score) : (b.score - a.score);
      return diff !== 0 ? diff : (streak(b.user) - streak(a.user));
    };
    const today = todayRows.slice().sort(cmp);
    // Empates: mismo puesto si tienen la MISMA puntuación; numeración correlativa (sin saltos).
    let rnk = 0, prevScore = null;
    const hoy = today.length
      ? today.map(r => { if (prevScore === null || r.score !== prevScore) { rnk++; prevScore = r.score; } return row(rnk, r.user, sc.fmt(r.score)); }).join('')
      : '<div class="mg-rank-sub" style="text-align:center;padding:6px 0">Aún nadie ha jugado el reto de hoy. ¡Avisa a tus amigos! 🎉</div>';
    const rule = sc.lower ? 'gana quien menos use ⬇️' : 'gana quien más sume ⬆️';
    return '<div id="mg-rankblock" class="mg-rankblock">' +
      '<div class="mg-rank-head">🏆 Clasificación de hoy</div>' +
      `<div class="mg-rank-sub">Reto de hoy · ${rule} · 🔥 = días seguidos jugando</div>` +
      '<div class="mg-rank-list">' + hoy + '</div>' +
      '</div>';
  }
  function revealRanking() {
    if (bonusMode) return; // en el bonus: el original solo se juega; avanzas con › (sin ranking ni guardar)
    if (previewOffset !== 0) return; // vista previa de días futuros (Zoesita testea): sin guardar/bloquear, puede repetir
    setFabDone(true); // reto completado → el icono deja de moverse
    const b = el('mg-board'); if (!b || document.getElementById('mg-rankblock')) return;
    setDone();       // 1 partida al día (caché local)
    saveMyScore();   // guarda mi puntuación en el servidor (1/día) + en mgRows
    const again = el('mg-again'); // quita "Jugar otra vez": no se puede repetir
    if (again) { const note = document.createElement('p'); note.className = 'mg-note'; note.innerHTML = '🔒 Solo se juega una vez al día · vuelve mañana 🔥'; again.replaceWith(note); }
    b.insertAdjacentHTML('beforeend', rankingBlockHTML());
  }
})();
