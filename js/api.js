// ── Tiny API layer that talks to the Google Sheet ──────────
// Everything goes through GET requests with query parameters.
// This is the most reliable way to call a Google Apps Script
// web app from a browser (no CORS preflight, response readable).

async function apiCall(action, params = {}, _retries = 3) {
  if (!SHEET_API_URL || SHEET_API_URL.indexOf('PASTE_YOUR') === 0) {
    throw new Error('SHEET_API_URL is not set — edit js/config.js');
  }
  const url = new URL(SHEET_API_URL);
  url.searchParams.set('action', action);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  url.searchParams.set('t', Date.now()); // cache-buster

  let res;
  try {
    // Algunos móviles abortan peticiones lentas: forzamos un timeout propio + reintentos.
    const ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    const to = ctrl ? setTimeout(() => ctrl.abort(), 12000) : null;
    res = await fetch(url.toString(), ctrl ? { signal: ctrl.signal } : undefined);
    if (to) clearTimeout(to);
    if (!res.ok) throw new Error('HTTP ' + res.status);
  } catch (netErr) {
    // Reintenta varias veces ante fallos de red (habituales en móvil con cobertura débil).
    if (_retries > 0) {
      await new Promise(r => setTimeout(r, 900));
      return apiCall(action, params, _retries - 1);
    }
    throw netErr;
  }
  const data = await res.json();
  if (data && data.ok === false) throw new Error(data.error || 'API error'); // no reintentar errores de lógica
  return data;
}

const api = {
  // getAll/getUser guardan su respuesta en caché para que la siguiente página
  // cargue al instante (ver js/cache.js).
  getAll:          ()  => apiCall('getAll').then(d => { if (d && d.ok !== false) CacheStore.set('getAll', d); return d; }),
  auth:            (p) => apiCall('auth', p),              // entrar/registrarse con nombre + PIN
  rename:          (p) => apiCall('rename', p),            // cambiar de nombre conservando pronósticos
  getUser:         (p) => apiCall('getUser', p).then(d => { if (d && d.ok !== false) CacheStore.set('user_' + (p.user || ''), d); return d; }), // solo los datos de un jugador (rápido)
  savePrediction:  (p) => apiCall('savePrediction', p),
  deletePrediction:(p) => apiCall('deletePrediction', p), // borra el pronóstico de un partido
  saveResult:      (p) => apiCall('saveResult', p),
  savePick:        (p) => apiCall('savePick', p),          // pronóstico de eliminatorias
  saveKnockoutReal:(p) => apiCall('saveKnockoutReal', p),  // resultado real (admin)
  deleteUser:      (p) => apiCall('deleteUser', p),        // borra un jugador y sus pronósticos
  mgGet:           ()  => apiCall('mgGet'),                // puntuaciones del minijuego (ranking + rachas)
  mgSave:          (p) => apiCall('mgSave', p),            // guarda la puntuación del reto de hoy (1/día)
};
