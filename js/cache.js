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

// ── Barra de actualización (estado + botón 🔄) ─────────────────────────────
// Muestra si los datos son frescos o guardados, y permite forzar una recarga.
// Clave en el móvil: si la actualización en segundo plano falla, el usuario
// VE que está viendo datos guardados y puede reintentar (antes era invisible).
var RefreshUI = {
  mount: function (afterEl, onRefresh) {
    if (!afterEl || document.getElementById('refresh-bar')) return;
    var bar = document.createElement('div');
    bar.id = 'refresh-bar';
    bar.className = 'refresh-bar';
    bar.innerHTML = '<span id="refresh-msg"></span> <button type="button" class="refresh-btn" id="refresh-btn">🔄 Actualizar</button>';
    afterEl.insertAdjacentElement('afterend', bar);
    var btn = document.getElementById('refresh-btn');
    if (btn && typeof onRefresh === 'function') btn.addEventListener('click', onRefresh);
  },
  set: function (state) {
    var msg = document.getElementById('refresh-msg');
    if (!msg) return;
    if (state === 'loading')      { msg.textContent = 'Actualizando…';                              msg.className = 'rf-load'; }
    else if (state === 'ok')      { msg.textContent = 'Actualizado ✓';                              msg.className = 'rf-ok'; }
    else if (state === 'cache')   { msg.textContent = 'Mostrando datos guardados…';                 msg.className = ''; }
    else if (state === 'error')   { msg.textContent = '⚠️ Sin conexión — mostrando datos guardados'; msg.className = 'rf-err'; }
  }
};
