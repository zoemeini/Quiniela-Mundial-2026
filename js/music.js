// Reproductor de música flotante (opcional, abajo a la derecha).
// IMPORTANTE: no suena nada al cargar la página. El iframe de YouTube solo
// se crea cuando el usuario pulsa el botón 🎵 (un gesto explícito), y se
// elimina al cerrarlo para detener el audio.
(function () {
  if (typeof MUSIC === 'undefined' || !MUSIC || !MUSIC.youtubeId) return;

  const fab = document.createElement('button');
  fab.className = 'music-fab';
  fab.type = 'button';
  fab.setAttribute('aria-label', 'Reproducir música: ' + (MUSIC.title || ''));
  fab.textContent = '🎵';

  const panel = document.createElement('div');
  panel.className = 'music-panel hidden';
  panel.innerHTML =
    '<div class="music-title">🎶 ' + (MUSIC.title || '') + '</div>' +
    '<div class="music-frame" id="music-frame"></div>' +
    '<div class="music-hint">Pulsa ▶ para escuchar · toca 🎵 otra vez para parar</div>';

  document.body.appendChild(panel);
  document.body.appendChild(fab);

  let open = false;
  fab.addEventListener('click', function () {
    open = !open;
    fab.classList.toggle('playing', open);
    const holder = document.getElementById('music-frame');
    if (open) {
      panel.classList.remove('hidden');
      holder.innerHTML =
        '<iframe width="100%" height="158" ' +
        'src="https://www.youtube.com/embed/' + encodeURIComponent(MUSIC.youtubeId) + '?autoplay=1&rel=0" ' +
        'title="' + (MUSIC.title || 'Música') + '" frameborder="0" ' +
        'allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>';
    } else {
      panel.classList.add('hidden');
      holder.innerHTML = ''; // detiene el audio
    }
  });
})();
