// ── Caché ligera en localStorage (navegación instantánea) ──────────────────
// El backend de Google Apps Script tarda ~2-3 s por petición. Para que cambiar
// de página no se sienta lento, guardamos la última respuesta buena y la
// mostramos AL INSTANTE; mientras, se pide la versión fresca en segundo plano y
// se actualiza la pantalla cuando llega ("stale-while-revalidate").
//
// Las páginas Clasificación, Predicciones y Resultados usan los mismos datos
// (getAll), así que comparten la misma caché → tras la primera carga, saltar
// entre ellas es inmediato.
var CacheStore = {
  _k: function (key) { return 'wc2026_cache_' + key; },
  get: function (key) {
    try {
      var raw = localStorage.getItem(this._k(key));
      if (!raw) return null;
      var o = JSON.parse(raw);
      return (o && o.data) ? o.data : null;
    } catch (_) { return null; }
  },
  // Antigüedad de la caché en milisegundos (Infinity si no hay).
  age: function (key) {
    try {
      var raw = localStorage.getItem(this._k(key));
      if (!raw) return Infinity;
      var o = JSON.parse(raw);
      return (o && o.t) ? (Date.now() - o.t) : Infinity;
    } catch (_) { return Infinity; }
  },
  set: function (key, data) {
    try { localStorage.setItem(this._k(key), JSON.stringify({ t: Date.now(), data: data })); }
    catch (_) { /* almacenamiento lleno/no disponible: ignorar */ }
  }
};
