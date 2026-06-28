// ============================================================
//  STEP 1 — Paste your Google Apps Script Web App URL here.
//  You get this after deploying the script inside your Google
//  Sheet (see README.md). It looks like:
//  https://script.google.com/macros/s/AKfy....../exec
// ============================================================
const SHEET_API_URL = "https://script.google.com/macros/s/AKfycbwFBcFpSv4N3p6gNfcmyKEC6SEqtIwgPGEut2O01H3J329go5u6WL1Gg2QN6RxrChHU/exec";

// ============================================================
//  STEP 2 — Set a password for the admin panel (admin.html).
//  Only you use this to enter match results from the website.
//  (You can also just type results into the Google Sheet.)
// ============================================================
const ADMIN_PASSWORD = "zoe-quiniela-2026";

// ============================================================
//  STEP 3 — Prediction deadline.
//  Predictions lock at this time (just before first kick-off).
//  This is in UTC — 2026-06-11 17:00 UTC = 19:00 hora española.
// ============================================================
const PREDICTION_DEADLINE = new Date('2026-06-11T17:00:00Z');

// ============================================================
//  Reproductor de música (opcional, abajo a la derecha)
//  Canción oficial del Mundial 2026: "Dai Dai" — Shakira & Burna Boy.
//  Pega el ID del vídeo de YouTube (lo que va después de "watch?v=").
//  NO suena sola: solo se reproduce si el usuario pulsa el botón 🎵.
//  Déjalo vacío ("") para ocultar el reproductor.
// ============================================================
const MUSIC = {
  youtubeId: "fcnDmrtj6Sk",
  title: "Dai Dai — Shakira & Burna Boy",
};

// ============================================================
//  Group-stage points (per match)
// ============================================================
const GROUP_POINTS = { exact: 5, outcome: 3 };

// ============================================================
//  Eliminatorias (por partido): hay 2 cosas (marcador exacto y quién pasa) →
//  7 si clavas las dos · 5 si aciertas una · 0 si ninguna. Distinto de los grupos.
// ============================================================
const KO_MATCH_POINTS = { exact: 7, outcome: 5 };

// ============================================================
//  Knockout points — awarded for each team you correctly
//  predict to REACH a round (compared with the real results).
//  Deeper rounds are worth more. Tweak freely.
// ============================================================
const KO_POINTS = {
  qualified: 1,   // por cada equipo que aciertes en la fase final (32)
  r16:       2,   // por cada equipo que llegue a octavos
  qf:        4,   // ... a cuartos
  sf:        8,   // ... a semifinales
  finalist:  12,  // ... a la final
  champion:  20,  // acertar el campeón
  third:     10,  // acertar el ganador del 3.º puesto
  exact:     5,   // BONUS: resultado exacto de una eliminatoria que ocurre de verdad
};
