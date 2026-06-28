# Porrita Mundial 2026

Web de porra del Mundial 2026 para amigos. HTML/CSS/JS **vanilla sin build**, hosting en
**GitHub Pages** (rama `main` → `git push` para desplegar), backend = **Google Sheet +
Google Apps Script** (`google-apps-script.gs`), API solo por **GET**.

## 👉 Antes de tocar nada, lee `TRASPASO.md`
Contiene TODO: arquitectura, mapa de ficheros con versiones, backend y cómo redesplegarlo,
puntuación, eliminatorias, minijuego, tareas pendientes y trampas conocidas.
`README.md` explica el montaje original.

## Reglas rápidas
- Idioma: **todo en español**; horas en hora de Madrid; el **móvil importa** (probar a 375px).
- **Cache-busting:** al cambiar un JS/CSS, **sube su `?v=N`** en cada HTML que lo carga
  (el HTML no se versiona pero lleva metas anti-caché).
- **Backend:** cambiar `google-apps-script.gs` **no surte efecto hasta REDESPLEGAR**
  (lo hace la organizadora; avísale). **No ejecutar `setup()`** (borra datos). Nunca borrar
  predicciones de los amigos.
- **Despliegue frontend:** commit + `git push origin main` (la organizadora pide que Claude
  haga commits/push). Mensajes en español. Cierra el commit con:
  `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`
- **Preview** (`pool-site`, `python3 -m http.server 3000`) pega contra datos en vivo;
  `Failed to fetch` en consola = rate-limit, no bug.
