// ── Tiny API layer that talks to the Google Sheet ──────────
// Everything goes through GET requests with query parameters.
// This is the most reliable way to call a Google Apps Script
// web app from a browser (no CORS preflight, response readable).

async function apiCall(action, params = {}) {
  if (!SHEET_API_URL || SHEET_API_URL.indexOf('PASTE_YOUR') === 0) {
    throw new Error('SHEET_API_URL is not set — edit js/config.js');
  }
  const url = new URL(SHEET_API_URL);
  url.searchParams.set('action', action);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  url.searchParams.set('t', Date.now()); // cache-buster

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Network error ' + res.status);
  const data = await res.json();
  if (data && data.ok === false) throw new Error(data.error || 'API error');
  return data;
}

const api = {
  getAll:          ()  => apiCall('getAll'),
  savePrediction:  (p) => apiCall('savePrediction', p),
  saveResult:      (p) => apiCall('saveResult', p),
  savePick:        (p) => apiCall('savePick', p),          // pronóstico de eliminatorias
  saveKnockoutReal:(p) => apiCall('saveKnockoutReal', p),  // resultado real (admin)
  deleteUser:      (p) => apiCall('deleteUser', p),        // borra un jugador y sus pronósticos
};
