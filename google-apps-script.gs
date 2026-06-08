/**
 * ============================================================
 *  Quiniela Mundial 2026 — backend en Google Sheets
 * ============================================================
 *  Esta es la ÚNICA pieza de "servidor" que necesitas. Vive
 *  dentro de tu Google Sheet y actúa como un pequeño servidor
 *  gratuito.
 *
 *  CONFIGURACIÓN (una sola vez — pasos completos en README.md):
 *   1. Crea una nueva hoja en sheets.new
 *   2. Extensiones → Apps Script
 *   3. Borra el código que haya y pega TODO este archivo
 *   4. Pulsa Guardar (💾)
 *   5. En la barra, elige la función "setup" y pulsa ▶ Ejecutar
 *      (acepta los permisos cuando Google los pida)
 *   6. Implementar → Nueva implementación → tipo "Aplicación web"
 *        - Ejecutar como: Yo
 *        - Quién tiene acceso: Cualquier usuario
 *      Pulsa Implementar y copia la URL de la aplicación web
 *   7. Pega esa URL en js/config.js  (SHEET_API_URL)
 * ============================================================
 */

// Los 72 partidos de la fase de grupos (para rellenar la pestaña Resultados).
var MATCHES = [
  {id:'A1', label:'México vs Sudáfrica'},
  {id:'A2', label:'Corea del Sur vs Chequia'},
  {id:'A3', label:'Chequia vs Sudáfrica'},
  {id:'A4', label:'México vs Corea del Sur'},
  {id:'A5', label:'Sudáfrica vs Corea del Sur'},
  {id:'A6', label:'Chequia vs México'},
  {id:'B1', label:'Canadá vs Bosnia y Herzegovina'},
  {id:'B2', label:'Catar vs Suiza'},
  {id:'B3', label:'Suiza vs Bosnia y Herzegovina'},
  {id:'B4', label:'Canadá vs Catar'},
  {id:'B5', label:'Suiza vs Canadá'},
  {id:'B6', label:'Bosnia y Herzegovina vs Catar'},
  {id:'C1', label:'Brasil vs Marruecos'},
  {id:'C2', label:'Haití vs Escocia'},
  {id:'C3', label:'Escocia vs Marruecos'},
  {id:'C4', label:'Brasil vs Haití'},
  {id:'C5', label:'Marruecos vs Haití'},
  {id:'C6', label:'Escocia vs Brasil'},
  {id:'D1', label:'Estados Unidos vs Paraguay'},
  {id:'D2', label:'Australia vs Turquía'},
  {id:'D3', label:'Estados Unidos vs Australia'},
  {id:'D4', label:'Turquía vs Paraguay'},
  {id:'D5', label:'Turquía vs Estados Unidos'},
  {id:'D6', label:'Paraguay vs Australia'},
  {id:'E1', label:'Alemania vs Curazao'},
  {id:'E2', label:'Costa de Marfil vs Ecuador'},
  {id:'E3', label:'Alemania vs Costa de Marfil'},
  {id:'E4', label:'Ecuador vs Curazao'},
  {id:'E5', label:'Curazao vs Costa de Marfil'},
  {id:'E6', label:'Ecuador vs Alemania'},
  {id:'F1', label:'Países Bajos vs Japón'},
  {id:'F2', label:'Suecia vs Túnez'},
  {id:'F3', label:'Países Bajos vs Suecia'},
  {id:'F4', label:'Túnez vs Japón'},
  {id:'F5', label:'Túnez vs Países Bajos'},
  {id:'F6', label:'Japón vs Suecia'},
  {id:'G1', label:'Bélgica vs Egipto'},
  {id:'G2', label:'Irán vs Nueva Zelanda'},
  {id:'G3', label:'Bélgica vs Irán'},
  {id:'G4', label:'Nueva Zelanda vs Egipto'},
  {id:'G5', label:'Nueva Zelanda vs Bélgica'},
  {id:'G6', label:'Egipto vs Irán'},
  {id:'H1', label:'España vs Cabo Verde'},
  {id:'H2', label:'Arabia Saudí vs Uruguay'},
  {id:'H3', label:'España vs Arabia Saudí'},
  {id:'H4', label:'Uruguay vs Cabo Verde'},
  {id:'H5', label:'Cabo Verde vs Arabia Saudí'},
  {id:'H6', label:'Uruguay vs España'},
  {id:'I1', label:'Francia vs Senegal'},
  {id:'I2', label:'Irak vs Noruega'},
  {id:'I3', label:'Francia vs Irak'},
  {id:'I4', label:'Noruega vs Senegal'},
  {id:'I5', label:'Noruega vs Francia'},
  {id:'I6', label:'Senegal vs Irak'},
  {id:'J1', label:'Argentina vs Argelia'},
  {id:'J2', label:'Austria vs Jordania'},
  {id:'J3', label:'Argentina vs Austria'},
  {id:'J4', label:'Jordania vs Argelia'},
  {id:'J5', label:'Argelia vs Austria'},
  {id:'J6', label:'Jordania vs Argentina'},
  {id:'K1', label:'Portugal vs RD Congo'},
  {id:'K2', label:'Uzbekistán vs Colombia'},
  {id:'K3', label:'Portugal vs Uzbekistán'},
  {id:'K4', label:'Colombia vs RD Congo'},
  {id:'K5', label:'Colombia vs Portugal'},
  {id:'K6', label:'RD Congo vs Uzbekistán'},
  {id:'L1', label:'Inglaterra vs Croacia'},
  {id:'L2', label:'Ghana vs Panamá'},
  {id:'L3', label:'Inglaterra vs Ghana'},
  {id:'L4', label:'Panamá vs Croacia'},
  {id:'L5', label:'Panamá vs Inglaterra'},
  {id:'L6', label:'Croacia vs Ghana'},
];

// Partidos de eliminatorias (solo id + ronda) para la pestaña KnockoutReal.
var KO_MATCHES = [
  {id:'M73',round:'R32'},{id:'M74',round:'R32'},{id:'M75',round:'R32'},{id:'M76',round:'R32'},
  {id:'M77',round:'R32'},{id:'M78',round:'R32'},{id:'M79',round:'R32'},{id:'M80',round:'R32'},
  {id:'M81',round:'R32'},{id:'M82',round:'R32'},{id:'M83',round:'R32'},{id:'M84',round:'R32'},
  {id:'M85',round:'R32'},{id:'M86',round:'R32'},{id:'M87',round:'R32'},{id:'M88',round:'R32'},
  {id:'M89',round:'R16'},{id:'M90',round:'R16'},{id:'M91',round:'R16'},{id:'M92',round:'R16'},
  {id:'M93',round:'R16'},{id:'M94',round:'R16'},{id:'M95',round:'R16'},{id:'M96',round:'R16'},
  {id:'M97',round:'QF'},{id:'M98',round:'QF'},{id:'M99',round:'QF'},{id:'M100',round:'QF'},
  {id:'M101',round:'SF'},{id:'M102',round:'SF'},
  {id:'M103',round:'3P'},{id:'M104',round:'F'},
];

// ── Ejecuta esto UNA VEZ desde el editor para crear las pestañas ──
function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var pred = ss.getSheetByName('Predictions') || ss.insertSheet('Predictions');
  pred.clear();
  pred.getRange(1, 1, 1, 5).setValues([['Fecha', 'Jugador', 'ID', 'Local', 'Visitante']]);
  pred.setFrozenRows(1);
  pred.getRange(1, 1, 1, 5).setFontWeight('bold');

  var res = ss.getSheetByName('Results') || ss.insertSheet('Results');
  res.clear();
  res.getRange(1, 1, 1, 4).setValues([['ID', 'Partido', 'Local', 'Visitante']]);
  res.setFrozenRows(1);
  res.getRange(1, 1, 1, 4).setFontWeight('bold');
  var rows = MATCHES.map(function (m) { return [m.id, m.label, '', '']; });
  res.getRange(2, 1, rows.length, 4).setValues(rows);
  res.autoResizeColumns(1, 4);

  // Pronósticos de eliminatorias de los jugadores (equipo que pasa + marcador)
  var br = ss.getSheetByName('Bracket') || ss.insertSheet('Bracket');
  br.clear();
  br.getRange(1, 1, 1, 6).setValues([['Fecha', 'Jugador', 'PartidoKO', 'Pase', 'GolLocal', 'GolVisitante']]);
  br.setFrozenRows(1);
  br.getRange(1, 1, 1, 6).setFontWeight('bold');

  // Resultados REALES de eliminatorias (los rellena el admin durante el torneo)
  var kr = ss.getSheetByName('KnockoutReal') || ss.insertSheet('KnockoutReal');
  kr.clear();
  kr.getRange(1, 1, 1, 7).setValues([['PartidoKO', 'Ronda', 'EquipoLocal', 'EquipoVisitante', 'GolLocal', 'GolVisitante', 'Ganador']]);
  kr.setFrozenRows(1);
  kr.getRange(1, 1, 1, 7).setFontWeight('bold');
  var koRows = KO_MATCHES.map(function (m) { return [m.id, m.round, '', '', '', '', '']; });
  kr.getRange(2, 1, koRows.length, 7).setValues(koRows);
  kr.autoResizeColumns(1, 7);

  SpreadsheetApp.getUi().alert(
    '¡Configuración completada!\n\n' +
    'Se han creado cuatro pestañas: "Predictions" (pronósticos de grupos), ' +
    '"Results" (resultados reales de grupos), "Bracket" (eliminatorias de los jugadores) ' +
    'y "KnockoutReal" (eliminatorias reales).\n\n' +
    'Para introducir un resultado de grupos, escribe los dos goles en las columnas ' +
    'Local/Visitante de la pestaña "Results" — o usa la página admin.html.\n\n' +
    'Siguiente paso: Implementar → Nueva implementación → Aplicación web ' +
    '(ver el comentario al principio de este archivo).'
  );
}

// ── Punto de entrada web — gestiona lecturas Y escrituras vía la URL ──
function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? String(e.parameter.action) : '';
  try {
    if (action === 'getAll')           return json(getAll());
    if (action === 'savePrediction')   return json(savePrediction(e.parameter));
    if (action === 'saveResult')       return json(saveResult(e.parameter));
    if (action === 'savePick')         return json(savePick(e.parameter));
    if (action === 'saveKnockoutReal') return json(saveKnockoutReal(e.parameter));
    return json({ ok: false, error: 'Acción desconocida. Prueba ?action=getAll' });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function sheetByName(name) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
}

function getAll() {
  var predictions = [];
  var ps = sheetByName('Predictions');
  if (ps && ps.getLastRow() > 1) {
    var pd = ps.getRange(2, 1, ps.getLastRow() - 1, 5).getValues();
    for (var i = 0; i < pd.length; i++) {
      var r = pd[i];
      if (r[1] !== '' && r[2] !== '') {
        predictions.push({ user: String(r[1]), matchId: String(r[2]), home: Number(r[3]), away: Number(r[4]) });
      }
    }
  }

  var results = [];
  var rs = sheetByName('Results');
  if (rs && rs.getLastRow() > 1) {
    var rd = rs.getRange(2, 1, rs.getLastRow() - 1, 4).getValues();
    for (var j = 0; j < rd.length; j++) {
      var row = rd[j];
      var home = row[2], away = row[3];
      var finished = home !== '' && away !== '' && !isNaN(Number(home)) && !isNaN(Number(away));
      if (finished) {
        results.push({ matchId: String(row[0]), home: Number(home), away: Number(away), status: 'finished' });
      }
    }
  }

  // Pronósticos de eliminatorias de los jugadores (equipo que pasa + marcador)
  var bracket = [];
  var bs = sheetByName('Bracket');
  if (bs && bs.getLastRow() > 1) {
    var bd = bs.getRange(2, 1, bs.getLastRow() - 1, 6).getValues();
    for (var k = 0; k < bd.length; k++) {
      var b = bd[k];
      if (b[1] !== '' && b[2] !== '') {
        bracket.push({
          user: String(b[1]), matchId: String(b[2]), team: String(b[3]),
          home: (b[4] === '' ? '' : Number(b[4])), away: (b[5] === '' ? '' : Number(b[5]))
        });
      }
    }
  }

  // Resultados reales de eliminatorias
  var knockoutReal = [];
  var ks = sheetByName('KnockoutReal');
  if (ks && ks.getLastRow() > 1) {
    var kd = ks.getRange(2, 1, ks.getLastRow() - 1, 7).getValues();
    for (var n = 0; n < kd.length; n++) {
      var kk = kd[n];
      if (kk[2] !== '' || kk[3] !== '' || kk[6] !== '') {
        knockoutReal.push({
          matchId: String(kk[0]), round: String(kk[1]),
          home: String(kk[2]), away: String(kk[3]),
          gh: (kk[4] === '' ? '' : Number(kk[4])), ga: (kk[5] === '' ? '' : Number(kk[5])),
          winner: String(kk[6])
        });
      }
    }
  }

  return { ok: true, predictions: predictions, results: results, bracket: bracket, knockoutReal: knockoutReal };
}

function savePrediction(p) {
  var user = (p.user || '').toString().trim();
  var matchId = (p.matchId || '').toString().trim();
  if (!user || !matchId) return { ok: false, error: 'falta user o matchId' };
  var home = Number(p.home), away = Number(p.away);
  if (isNaN(home) || isNaN(away)) return { ok: false, error: 'resultado inválido' };

  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var s = sheetByName('Predictions');
    var last = s.getLastRow();
    var rowIndex = -1;
    if (last > 1) {
      var keys = s.getRange(2, 2, last - 1, 2).getValues(); // Jugador, ID
      for (var i = 0; i < keys.length; i++) {
        if (String(keys[i][0]) === user && String(keys[i][1]) === matchId) { rowIndex = i + 2; break; }
      }
    }
    var row = [new Date(), user, matchId, home, away];
    if (rowIndex > 0) s.getRange(rowIndex, 1, 1, 5).setValues([row]);
    else s.appendRow(row);
  } finally {
    lock.releaseLock();
  }
  return { ok: true };
}

function saveResult(p) {
  var matchId = (p.matchId || '').toString().trim();
  if (!matchId) return { ok: false, error: 'falta matchId' };
  var home = Number(p.home), away = Number(p.away);
  if (isNaN(home) || isNaN(away)) return { ok: false, error: 'resultado inválido' };

  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var s = sheetByName('Results');
    var last = s.getLastRow();
    var rowIndex = -1;
    if (last > 1) {
      var ids = s.getRange(2, 1, last - 1, 1).getValues();
      for (var i = 0; i < ids.length; i++) {
        if (String(ids[i][0]) === matchId) { rowIndex = i + 2; break; }
      }
    }
    if (rowIndex > 0) s.getRange(rowIndex, 3, 1, 2).setValues([[home, away]]);
    else s.appendRow([matchId, '', home, away]);
  } finally {
    lock.releaseLock();
  }
  return { ok: true };
}

// Guarda el pronóstico KO de un jugador: equipo que pasa + marcador.
// Si todo está vacío (team y goles), borra la fila.
function savePick(p) {
  var user = (p.user || '').toString().trim();
  var matchId = (p.matchId || '').toString().trim();
  var team = (p.team || '').toString().trim();
  var home = (p.home == null ? '' : String(p.home)).trim();
  var away = (p.away == null ? '' : String(p.away)).trim();
  if (!user || !matchId) return { ok: false, error: 'falta user o matchId' };

  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var s = sheetByName('Bracket');
    var last = s.getLastRow();
    var rowIndex = -1;
    if (last > 1) {
      var keys = s.getRange(2, 2, last - 1, 2).getValues(); // Jugador, PartidoKO
      for (var i = 0; i < keys.length; i++) {
        if (String(keys[i][0]) === user && String(keys[i][1]) === matchId) { rowIndex = i + 2; break; }
      }
    }
    if (team === '' && home === '' && away === '') {
      if (rowIndex > 0) s.deleteRow(rowIndex);
    } else {
      var row = [new Date(), user, matchId, team, home, away];
      if (rowIndex > 0) s.getRange(rowIndex, 1, 1, 6).setValues([row]);
      else s.appendRow(row);
    }
  } finally {
    lock.releaseLock();
  }
  return { ok: true };
}

// Guarda un resultado REAL de eliminatorias (equipos + marcador + ganador). Solo admin.
function saveKnockoutReal(p) {
  var matchId = (p.matchId || '').toString().trim();
  if (!matchId) return { ok: false, error: 'falta matchId' };
  var home = (p.home || '').toString().trim();
  var away = (p.away || '').toString().trim();
  var gh = (p.gh == null ? '' : String(p.gh)).trim();
  var ga = (p.ga == null ? '' : String(p.ga)).trim();
  var winner = (p.winner || '').toString().trim();

  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var s = sheetByName('KnockoutReal');
    var last = s.getLastRow();
    var rowIndex = -1;
    if (last > 1) {
      var ids = s.getRange(2, 1, last - 1, 1).getValues();
      for (var i = 0; i < ids.length; i++) {
        if (String(ids[i][0]) === matchId) { rowIndex = i + 2; break; }
      }
    }
    if (rowIndex > 0) s.getRange(rowIndex, 3, 1, 5).setValues([[home, away, gh, ga, winner]]);
    else s.appendRow([matchId, '', home, away, gh, ga, winner]);
  } finally {
    lock.releaseLock();
  }
  return { ok: true };
}
