// Reproductor de música flotante (opcional, abajo a la derecha).
// Usa la API de YouTube para ofrecer un control de VOLUMEN propio (fácil de usar)
// y play/pausa. No suena nada hasta que el usuario pulsa 🎵 (gesto explícito).
(function () {
  if (typeof MUSIC === 'undefined' || !MUSIC || !MUSIC.youtubeId) return;

  const fab = document.createElement('button');
  fab.className = 'music-fab';
  fab.type = 'button';
  fab.setAttribute('aria-label', 'Música: ' + (MUSIC.title || ''));
  fab.textContent = '🎵';

  const panel = document.createElement('div');
  panel.className = 'music-panel hidden';
  panel.innerHTML =
    '<div class="music-title">🎶 ' + (MUSIC.title || '') + '</div>' +
    '<div class="music-frame"><div id="yt-holder"></div></div>' +
    '<div class="music-controls">' +
      '<button type="button" id="music-toggle" class="music-btn" title="Reproducir / Pausa">⏸</button>' +
      '<span class="music-vol-ico">🔉</span>' +
      '<input type="range" id="music-vol" min="0" max="100" value="50" aria-label="Volumen">' +
    '</div>' +
    '<div class="music-hint">Arrastra la barra para subir o bajar el volumen.</div>';

  document.body.appendChild(panel);
  document.body.appendChild(fab);

  const volEl = panel.querySelector('#music-vol');
  const toggleEl = panel.querySelector('#music-toggle');
  let player = null, open = false;

  function loadApi(cb) {
    if (window.YT && window.YT.Player) { cb(); return; }
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function () { if (prev) { try { prev(); } catch (_) {} } cb(); };
    if (!document.getElementById('yt-api-script')) {
      const s = document.createElement('script');
      s.id = 'yt-api-script';
      s.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(s);
    }
  }

  function createPlayer() {
    player = new YT.Player('yt-holder', {
      height: '150', width: '100%',
      videoId: MUSIC.youtubeId,
      playerVars: { autoplay: 1, rel: 0, playsinline: 1 },
      events: {
        onReady: function (e) { try { e.target.setVolume(parseInt(volEl.value, 10)); e.target.playVideo(); } catch (_) {} },
        onStateChange: function (e) {
          if (e.data === 1) toggleEl.textContent = '⏸';
          else if (e.data === 2 || e.data === 0) toggleEl.textContent = '▶';
        }
      }
    });
  }

  fab.addEventListener('click', function () {
    open = !open;
    fab.classList.toggle('playing', open);
    if (open) {
      panel.classList.remove('hidden');
      if (!player) loadApi(createPlayer);
      else { try { player.playVideo(); } catch (_) {} }
    } else {
      panel.classList.add('hidden');
      if (player) { try { player.pauseVideo(); } catch (_) {} }
    }
  });

  volEl.addEventListener('input', function () {
    if (player && player.setVolume) { try { player.setVolume(parseInt(volEl.value, 10)); } catch (_) {} }
  });
  toggleEl.addEventListener('click', function () {
    if (!player || !player.getPlayerState) return;
    try { if (player.getPlayerState() === 1) player.pauseVideo(); else player.playVideo(); } catch (_) {}
  });
})();
