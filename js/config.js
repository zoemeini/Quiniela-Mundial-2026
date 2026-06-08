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
//  Group-stage points (per match)
// ============================================================
const GROUP_POINTS = { exact: 5, outcome: 3 };

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
