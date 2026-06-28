# 🧭 TRASPASO DEL PROYECTO — Porrita Mundial 2026

> **Para quien lea esto (humano o Claude):** este fichero contiene TODO lo necesario
> para seguir trabajando en el proyecto sin contexto previo. Léelo entero antes de
> hacer cambios. Está escrito en español porque la organizadora (Zoe) trabaja en español.
> Última actualización: **2026-06-28**.

---

## 1. Qué es

Web de **porra/quiniela del Mundial 2026** para un grupo de amigos (y, ya, "invitados"
que se han ido apuntando). La gente pronostica el marcador de cada partido, hay una
**clasificación en vivo**, y un **minijuego diario** oculto para enganchar a la gente.

- Idioma: **todo en español** (nombres de equipos en español, horas en hora de Madrid).
- Tono: cercano, informal, con emojis. La marca se llama **"Porrita Mundial 2026"**.
- Público: amigos por el móvil principalmente → **el móvil importa mucho** (probar a 375px).

## 2. Stack y arquitectura

```
Navegador de los amigos  ⇆  Google Apps Script (web app)  ⇆  Google Sheet
      (la web)                 (vive dentro de la hoja)         (todos los datos)
```

- **Frontend:** HTML/CSS/JS **vanilla, SIN build step**. Se edita y se sube tal cual.
- **Hosting:** **GitHub Pages** desde la rama `main`.
  - Repo: `https://github.com/zoemeini/Quiniela-Mundial-2026`
  - Para desplegar: **`git push origin main`** y GitHub Pages lo publica en ~1 min.
- **Backend:** un **Google Sheet** + un script de **Google Apps Script** (`google-apps-script.gs`)
  desplegado como "aplicación web". La organizadora eligió esto en vez de Firebase porque
  le resultaba más familiar. **No hay base de datos ni servidor propio.**
- **Todas las llamadas a la API son GET** con parámetros en la URL (a propósito: evita el
  preflight CORS que da problemas con Apps Script). Ver `js/api.js`.

## 3. Mapa de ficheros (con versiones actuales de cache-busting)

> Cada `<script>`/`<link>` en el HTML lleva `?v=N`. **Hay que SUBIR ese N cada vez que
> cambias un fichero JS/CSS**, si no los navegadores sirven la versión cacheada vieja.
> Versiones actuales (2026-06-28):

| Fichero | Qué hace | v |
|---|---|---|
| `index.html` | Página principal: "Mis Pronósticos" (grupos + eliminatorias) | — (HTML no versionado; ver §4) |
| `predicciones.html` + `js/predicciones.js` | Ver lo que pronosticó cada uno (solo lectura; cada partido se revela al empezar) | js v=34 |
| `resultados.html` + `js/resultados.js` | Feed de partidos terminados + quién acertó (badges de puntos) | js v=35 |
| `leaderboard.html` + `js/leaderboard.js` | Clasificación en vivo (2 pestañas: OG / invitados) | js v=46 |
| `admin.html` + `js/admin.js` | Panel admin (contraseña): meter resultados de grupos + eliminatorias reales | js v=33 |
| `js/config.js` | URL del backend + contraseña admin + puntos | v=33 |
| `js/api.js` | Wrapper que llama al Apps Script por GET | v=53 |
| `js/data.js` | 72 partidos de grupos + cuadro KO (`KO_MATCHES`) + nombres/banderas + puntuación | v=35 |
| `js/bracket.js` | Lógica del cuadro: `computeStandings`, `realKnockout` (resolución parcial) | v=34 |
| `js/app.js` | Lógica de pronósticos (grupos + eliminatorias, cuadro visual, modales) | v=46 |
| `js/cache.js` | Caché stale-while-revalidate en localStorage (navegación instantánea) | v=30 |
| `js/minigame.js` | Minijuego diario "Reto del día" (rotación de modos, ranking, bonus) | v=94 |
| `js/newgames.js` | 6 minijuegos nuevos integrados a la rotación (expone `window.NG`) | v=17 |
| `js/music.js` | Reproductor flotante 🎵 opcional (no autoplay) | v=30 |
| `css/style.css` | TODOS los estilos | v=85 |
| `google-apps-script.gs` | Backend (se pega dentro del Sheet, ver §5) | — |
| `.claude/launch.json` | Config del servidor de preview local (`python3 -m http.server 3000`) | — |

## 4. Caché del navegador (truco recurrente)

El problema "no veo los cambios en vivo" casi siempre es caché:
1. **JS/CSS** → llevan `?v=N`. **Sube N** en el HTML que los carga al cambiarlos.
2. **HTML** → no va versionado. Por eso las 5 páginas llevan estas metas en `<head>`:
   ```html
   <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
   <meta http-equiv="Pragma" content="no-cache">
   <meta http-equiv="Expires" content="0">
   ```
   Así el navegador rebaja el HTML y recibe el `?v=N` nuevo. Si un amigo sigue viendo lo
   viejo: que haga **Ctrl/Cmd+Shift+R** una vez.

## 5. Backend: Google Sheet + Apps Script

- **URL del web app** (ya configurada en `js/config.js` → `SHEET_API_URL`):
  `https://script.google.com/macros/s/AKfycbwFBcFpSv4N3p6gNfcmyKEC6SEqtIwgPGEut2O01H3J329go5u6WL1Gg2QN6RxrChHU/exec`
- **Contraseña admin** (en `js/config.js` → `ADMIN_PASSWORD`): `zoe-quiniela-2026`
  (ya está en el repo público; es una porra de amigos, no hay nada sensible).
- **Pestañas del Sheet** (las crea `setup()`): `Predictions` (pronósticos de grupos),
  `Results` (resultados reales de grupos), `Bracket` (picks KO de los jugadores),
  `KnockoutReal` (equipos+marcador reales de KO, los mete el admin), `Users`
  (nombre+PIN para login multi-dispositivo), `MiniGame` (puntuaciones del reto diario).
- **Acciones** (`doGet` en `google-apps-script.gs`): `getAll`, `getUser`, `auth`, `rename`,
  `savePrediction`, `deletePrediction`, `saveResult`, `savePick`, `saveKnockoutReal`,
  `deleteUser`, `mgGet`, `mgSave`, `mgDelete`.

### ⚠️ Cómo REDESPLEGAR el backend (cuando cambies `google-apps-script.gs`)

El frontend (push a GitHub) es independiente del backend. Para que un cambio en el `.gs`
surta efecto, **la organizadora** debe (Claude no puede hacerlo):
1. Abrir el Google Sheet → **Extensiones → Apps Script**.
2. Pegar TODO el `google-apps-script.gs` actualizado → **Guardar** (💾).
3. **Implementar → Gestionar implementaciones → editar (✏️) → Versión: Nueva versión → Implementar.**
   (La URL NO cambia. **NO** hace falta volver a ejecutar `setup()` salvo que quieras
   recrear pestañas — eso BORRA datos.)

### ⚠️ Gotcha de despliegue del Apps Script
El web app debe estar desplegado con **"Quién tiene acceso: Cualquier usuario"** (NO
"Cualquier usuario con cuenta de Google" — eso fuerza login y rompe el fetch anónimo). Si
"Cualquier usuario" sale en gris, la cuenta es Workspace/empresa → usar una cuenta @gmail
personal.

## 6. Cómo trabajar (flujo para Claude)

1. Edita los ficheros del proyecto.
2. **Sube el `?v=N`** de cada JS/CSS tocado en TODAS las páginas HTML que lo cargan.
3. Verifica en el preview (servidor `pool-site`, `python3 -m http.server 3000`):
   - **OJO:** el preview pega contra el **backend en vivo** (mismos datos reales).
   - Errores `Failed to fetch` en consola = rate-limit del backend en vivo, **no** bug del código.
   - El preview headless deja la página `hidden` → `requestAnimationFrame` pausado: los
     juegos en tiempo real (Puntería, keepie) se congelan. Para probarlos hay que parchear
     rAF con un shim `MessageChannel`.
4. Commit + push a `main` (la organizadora ya pidió que Claude haga commits/push directamente).
   - Mensajes de commit en español, descriptivos (mira `git log`).
   - **Cierra el mensaje con:** `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`
5. Si tocaste `google-apps-script.gs` → avisa a la organizadora de que tiene que REDESPLEGAR (§5).

## 7. Puntuación

| Fase | Acierto | Puntos | Constante |
|---|---|---|---|
| **Grupos** | marcador exacto | **5** | `GROUP_POINTS.exact` |
| **Grupos** | solo el resultado (1X2) | **3** | `GROUP_POINTS.outcome` |
| **Eliminatorias** | marcador exacto | **7** | `KO_MATCH_POINTS.exact` |
| **Eliminatorias** | solo el vencedor (empate de los 90' incluido) | **5** | `KO_MATCH_POINTS.outcome` |

- **Eliminatorias a vida o muerte (penaltis):** si pronosticas **empate** en un cruce KO,
  además eliges **quién pasa en penaltis**. Entonces: **7** solo si aciertas marcador exacto
  Y el ganador de penaltis; **5** si aciertas que es empate pero no ambas cosas; **0** si fallas el 1X2.
- El pick de penaltis se guarda como una **predicción aparte con id `<id>P`** (p.ej. `M73P`),
  `home` = índice del equipo. **No toca el backend** (reusa `savePrediction`).
- Lógica centralizada en `js/data.js`: `koMatchPoints(pred,result,penPick,realWinner)`,
  `pointsFor(id,pred,result,penPick,realWinner)`, `isKoId(id)` (ids que empiezan por `M`),
  `isExactHit`, `calculatePoints` (grupos). Lo usan leaderboard/resultados/predicciones/app.
- Lo que no rellenas cuenta como 0-0. Cada partido se bloquea a su hora de inicio real.

## 8. Eliminatorias (cuadro)

- `KO_MATCHES` en `data.js`: M73–M88 (16avos/R32), M89–M96 (octavos/R16), M97–M100 (cuartos/QF),
  M101–M102 (semis/SF), M103 (3.º puesto), M104 (final). Cada uno tiene un **`kickoff` UTC fijo**
  del **calendario oficial 2026** → la fecha/hora NO depende de los equipos; al asignar equipos
  a una casilla, el cruce hereda esa fecha/hora. Se muestra en hora de Madrid (`formatKickoff`).
- **Resolución parcial** (`realKnockout` en `bracket.js`): los cruces se muestran **en cuanto se
  conocen**; el resto queda "Por determinar". 1.º/2.º de cada grupo se resuelven cuando ESE grupo
  está completo. **`winOf`/`loseOf`** salen del ganador/perdedor real (lo mete el admin).
- ⚠️ **Los "mejores terceros" NO se calculan solos.** FIFA usa una tabla oficial de **495
  combinaciones** (Anexo C) y, con las restricciones, hay varios repartos válidos para cada
  combinación → no es auto-derivable de forma fiable. **Solución:** el admin **asigna a mano**
  los equipos de cada cruce con dos desplegables (local/visitante) en `admin.html` →
  pestaña Eliminatorias. Se guardan vía `saveKnockoutReal` (ya guarda `home/away` → sin redeploy).
- **Cuadro visual** (`renderKoBracketDiagram` en `app.js`): árbol de torneo con conectores
  (`koTreeOrder()` ordena cada ronda para que los 2 alimentadores queden adyacentes), banderas,
  marcador pronosticado, celdas clicables → popup `#ko-edit-modal` para editar el pronóstico.
  CSS namespaced `.kbk-*`. El cuadro va **al FINAL** de la pestaña.
- La pestaña Eliminatorias **navega por días** (igual que grupos: pill "Próximos" + stepper),
  no por rondas.
- **Pestaña por defecto:** `koStarted()` (en `app.js`) → al arrancar la fase final, la web
  abre directa en Eliminatorias. Desde 2026-06-28 el umbral es **"cuando termina la fase de
  grupos"** (arranca el último partido de grupos), no el primer 16avos, para que abra en KO
  durante todo el día en que empiezan las eliminatorias.

## 9. Minijuego diario ("Reto del día")

- Burbuja/pastilla flotante 🎮 (`minigame.js`); 1 partida al día por jugador (candado
  servidor vía pestaña `MiniGame`). Ranking diario + rachas.
- **Rotación de MODOS por fecha** (mismo reto para todos ese día). 8 modos originales en
  `minigame.js` (más-o-menos por temas, "¿de qué país?", foto, puntería, pistas/Footdle,
  wordle de apellidos, portería/goles míticos, sudoku) + **6 nuevos** en `newgames.js`
  (memory, keepie/que-no-caiga, gol-o-tarjeta, cálculo, mastermind de equipaciones, dorsales).
  Ciclo de 14 (`MG_CYCLE`); contenido **determinista por fecha** (semilla = fecha) para que
  sea idéntico para todos.
- **Día de la FINAL (19-jul) = BONUS:** se juegan varios seguidos con contenido FIJO
  (`MG_BONUS_SEED=20260719`). Pendiente: normalizar puntuaciones a 0–100 y ranking común.
- **Testers:** solo **Zoesita** (`MG_HIDDEN=['zoesita']`, `isTester`) ve el navegador ‹ › para
  previsualizar/repetir días futuros, y está OCULTA del ranking de minijuegos. En vista previa
  (`previewOffset!=0`) puede jugar sin guardar ni bloquear.

## 10. Clasificación (leaderboard)

- 2 pestañas para todos: **"👑 Ranking de los OG"** (lista fija `WC_FRIENDS` en
  `js/leaderboard.js`) y **"🎟️ Ranking de los invitados"** (todos los demás).
- Para añadir/quitar a alguien de los OG: editar el array `WC_FRIENDS`. Match por nombre
  normalizado (sin acentos/mayúsculas).
- Columnas: Total · Grupos · **Elim.** · ⭐ (exactos) · % acierto.

## 11. Login y usuarios

- Login por **nombre + PIN de 4 cifras** (acción `auth`), para entrar desde varios
  dispositivos sin cuentas de Google. Nombre = **exacto, sensible a mayúsculas** (las
  predicciones se guardan por nombre).
- Botón "Borrar" (header) → borra ese jugador (`deleteUser`) y libera el nombre. Oculto tras
  el cierre.
- Hay un usuario "Dummy" (`TontoAQuienLeGaneElDummy`) con pronósticos aleatorios realistas
  como "listón". Dos seeders en el `.gs` (se ejecutan **desde el editor**, NO es redeploy):
  `seedDummy()` (72 grupos) y `seedDummyKnockout()` (M73–M104, marcadores decisivos sin
  empates → no necesita pick de penaltis; va por casilla, así encaja con cualquier equipo
  que asignes). Son independientes: `seedDummy` ya no borra las filas KO. Para correrlos:
  Apps Script → pega el `.gs` → Guardar → elige la función en el desplegable → ▶.

---

## 12. ⚠️ TAREAS PENDIENTES (lo que falta / a vigilar)

1. **Asignar a mano los "terceros" del cuadro** en `admin.html` → Eliminatorias (dos
   desplegables por cruce). Verificado que funciona: M74→Paraguay y M77→Suecia dan
   "Alemania vs Paraguay" y "Francia vs Suecia". ← **lo único realmente pendiente hoy.**
2. **Minijuego "Dorsales" — dorsales OFICIALES del Mundial 2026** (Cracks 1-3 en
   `newgames.js` siguen con dorsales provisionales; el set de la FINAL ya está verificado).
3. **Bonus de la final (19-jul):** normalización 0–100 de las puntuaciones de los 3 juegos
   elegidos + ranking común (de momento solo se juega, sin ranking conjunto).

**Ya resuelto (no hacer):**
- ✅ Resultados de la fase de grupos: **todos introducidos** (2026-06-28).
- ✅ Redeploy del Apps Script para `mgSave upd` / `mgDelete`: **ya NO es necesario** — esas
  funciones eran para el bonus de Puntería y el botón de reinicio de tester, que la
  organizadora descartó. El código queda inerte en el `.gs` (no se dispara) y la web en vivo
  funciona con lo ya desplegado. Si en el futuro hace falta recalcular notas ya guardadas del
  minijuego, *entonces* sí habría que redesplegar para usar `upd:1`.

## 13. Trampas conocidas (gotchas) — leer antes de tocar

- **Cambiar `google-apps-script.gs` NO surte efecto hasta REDESPLEGAR** (§5). Avisar siempre.
- **No ejecutar `setup()`** del `.gs` salvo que quieras recrear pestañas: **borra datos**.
- **Nunca borrar predicciones de los amigos** del Sheet.
- **Subir `?v=N`** al cambiar JS/CSS o no se verá el cambio.
- El **preview pega contra datos en vivo**; `Failed to fetch` = rate-limit, no bug.
- **rAF pausado** en el preview headless → juegos en tiempo real congelados (shim MessageChannel).
- Banderas: se usan **imágenes de flagcdn.com** (los emoji de bandera no se ven en Windows).
- No usar `@import` para fuentes (bloquea el render / colgaba el screenshot del preview);
  se cargan con `<link ... media="print" onload="this.media='all'">`.

## 14. Cómo darle contexto a un Claude nuevo

Dile algo como: *"Lee `TRASPASO.md` y `README.md` antes de empezar"*. Con eso tiene todo.
El `README.md` explica el montaje original (setup del Sheet, deploy, scoring). Este
`TRASPASO.md` es el estado actual + pendientes + trampas. Hay también un `CLAUDE.md` que se
carga solo y apunta aquí.
