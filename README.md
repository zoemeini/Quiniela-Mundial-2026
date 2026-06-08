# ⚽ World Cup 2026 Pool

A free, shareable football pool website for the 2026 FIFA World Cup. Hosted on GitHub Pages, with a **Google Sheet** as the (free, no-database) backend.

**Features:** predict all 72 group stage matches · live leaderboard · 5 pts for exact score, 3 pts for correct outcome · enter results from the website *or* straight in the spreadsheet · predictions lock before June 11 kick-off.

---

## How it works (the simple version)

```
Friends' browsers  ⇆  a tiny Google Apps Script  ⇆  your Google Sheet
   (the website)         (lives inside the sheet)      (all the data)
```

You make a Google Sheet, paste in a small script once, and deploy it as a "web app." That gives you **one URL**. You paste that URL into the website. Done — no database, no accounts to manage. You can open the Sheet any time to see everyone's picks.

---

## Setup (one-time, ~10 minutes)

### 1. Create the Google Sheet + script

1. Go to **[sheets.new](https://sheets.new)** to create a blank Google Sheet. Give it a name like "World Cup 2026 Pool."
2. In the menu: **Extensions → Apps Script**. A code editor opens in a new tab.
3. Delete any code that's already there, then open [`google-apps-script.gs`](google-apps-script.gs) from this project, copy **everything**, and paste it in.
4. Click the **Save** icon (💾).
5. In the toolbar, make sure the function dropdown shows **`setup`**, then click **▶ Run**.
   - Google will ask for permission the first time → click **Review permissions → choose your account → Advanced → "Go to … (unsafe)" → Allow**. *(This warning is normal — it's your own script.)*
   - You'll see a popup saying "Setup complete!" Your Sheet now has two tabs: **Predictions** and **Results**.

### 2. Deploy the script as a Web App

1. In the Apps Script editor, click **Deploy → New deployment**.
2. Click the gear ⚙ next to "Select type" → choose **Web app**.
3. Set:
   - **Description:** anything (e.g. "pool")
   - **Execute as:** **Me**
   - **Who has access:** **Anyone**  ← important, so friends don't need to log in
4. Click **Deploy**, approve if asked, then **copy the Web app URL**. It looks like:
   `https://script.google.com/macros/s/AKfy....../exec`

### 3. Paste the URL into the website

Open [`js/config.js`](js/config.js) and set:

```js
const SHEET_API_URL = "https://script.google.com/macros/s/AKfy....../exec";
const ADMIN_PASSWORD = "choose-a-password";   // for the admin.html page
```

### 4. Deploy the website to GitHub Pages

1. Create a new **public** repository on GitHub (e.g. `worldcup2026-pool`).
2. Push these files:
   ```bash
   git init
   git add .
   git commit -m "World Cup 2026 Pool"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/worldcup2026-pool.git
   git push -u origin main
   ```
3. On GitHub: repo **Settings → Pages → Source: Deploy from a branch → `main` / `(root)` → Save**.
4. After a minute your site is live at `https://YOUR_USERNAME.github.io/worldcup2026-pool/`.

### 5. Share the link!

Send friends `https://YOUR_USERNAME.github.io/worldcup2026-pool/`. They open it, enter their name, and predict all 72 matches before June 11.

---

## How to use

| Who | What |
|-----|------|
| **Friends** | Open the link, enter a name, predict scores for all 72 matches. Auto-saves. |
| **You (admin)** | Two ways to enter a final score: (a) open the **Results** tab in your Google Sheet and just type the two numbers next to the match, or (b) go to `/admin.html`, enter your password, and type scores there. |
| **Everyone** | Watch `/leaderboard.html` — it refreshes every 30 seconds. |

### Scoring

**Group stage** (per match):

| Result | Points |
|--------|--------|
| ⭐ Correct exact score | **5 pts** |
| ✓ Correct outcome (W/D/W) | **3 pts** |
| ✗ Wrong | 0 pts |

**Knockout stage** (progression — points for each team you correctly predict to *reach* a round):

| Reaches… | Points per team |
|----------|-----------------|
| Round of 32 (qualifies) | 1 |
| Round of 16 | 2 |
| Quarterfinal | 4 |
| Semifinal | 8 |
| Final | 12 |
| Correct champion | 20 |
| Correct 3rd-place winner | 10 |
| Exact knockout score (when the matchup really happens) | +5 bonus |

All point values live in `KO_POINTS` / `GROUP_POINTS` in `js/config.js` — tweak freely.

### How the knockout works

Each player predicts all 72 group matches; their **bracket fills in automatically** from those
predictions (top 2 of every group + the 8 best third-placed teams, exactly like the real 2026
format). For each knockout tie they **enter a score** — the team with more goals advances, and
if they predict a draw they tap who goes through on penalties. This continues all the way to the
champion and the third-place match. The page jumps to the next round as each one is completed. Because the bracket is built
from each player's *own* group picks, everyone fills in the whole thing — groups through the
final — before June 11, and it all locks together.

You (admin) record what *really* happens in the knockout on `admin.html` → **Eliminatorias** tab
(pick the two real teams and the winner of each tie). The leaderboard compares each player's
predicted bracket to reality and awards the progression points above.

---

## Files

```
index.html             → Predictions page (friends use this)
leaderboard.html       → Live rankings
admin.html             → Enter match results from the web (optional)
css/style.css          → All styles
js/config.js           → Your Sheet URL + admin password ← FILL THIS IN
js/api.js              → Talks to the Google Sheet
js/data.js             → All 72 fixtures (verify at fifa.com)
js/app.js              → Predictions logic (groups + knockout)
js/bracket.js          → Builds each player's knockout bracket from their group picks
js/leaderboard.js      → Leaderboard calculation (group + knockout points)
js/admin.js            → Admin panel logic
google-apps-script.gs  → Paste this into your Sheet's Apps Script (step 1)
```

---

## Notes & FAQ

- **Predictions lock** at `2026-06-11T17:00:00Z` (1pm New York time). Change `PREDICTION_DEADLINE` in `config.js` to adjust.
- **Entering results in the Sheet:** the **Results** tab already lists all 72 matches. A match counts as "finished" the moment both the Home and Away cells contain numbers. Leave them blank for matches not yet played.
- **The Sheet has 4 tabs** after setup: `Predictions` (group score picks), `Results` (real group scores), `Bracket` (players' knockout picks), `KnockoutReal` (real knockout teams + winners, filled by you in July). Running `setup()` creates all of them.
- **Real knockout seeding:** the qualified 32 are computed from the real group results automatically. For each real knockout tie you just record the two teams + the winner on the admin page.
- **If saving fails:** the most common cause is the Web App wasn't deployed with **"Who has access: Anyone."** Re-check step 2.
- **Privacy/security:** anyone with the link can read predictions and (in theory) call the script, and the admin password lives in the page source. That's fine for a friends' pool — don't store anything sensitive.
- **Changed the script later?** In Apps Script you must **Deploy → Manage deployments → edit (✏) → Version: New version → Deploy** for changes to take effect (the URL stays the same).
