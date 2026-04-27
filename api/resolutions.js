const resolutions = new Map();
let kv = null;

try {
  // Uses Vercel env vars automatically (KV_REST_API_URL + KV_REST_API_TOKEN).
  ({ kv } = require('@vercel/kv'));
} catch (_) {
  kv = null;
}

function keyOf(cardType, cardPin) {
  return `${String(cardType || '').trim().toLowerCase()}::${String(cardPin || '').trim().toUpperCase()}`;
}

module.exports = async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const cardType = req.query && req.query.cardType;
      const cardPin = req.query && req.query.cardPin;
      if (!cardType || !cardPin) {
        res.status(400).json({ error: 'cardType and cardPin are required' });
        return;
      }
      const key = keyOf(cardType, cardPin);
      let item = null;
      if (kv) {
        item = await kv.get(key);
      }
      if (!item) {
        item = resolutions.get(key) || null;
      }
      if (!item) {
        res.status(404).json({ found: false });
        return;
      }
      res.status(200).json({ found: true, ...item });
      return;
    }

    if (req.method === 'POST') {
      const body = req.body || {};
      const cardType = body.cardType;
      const cardPin = body.cardPin;
      if (!cardType || !cardPin) {
        res.status(400).json({ error: 'cardType and cardPin are required' });
        return;
      }

      const payload = {
        cardType: String(cardType),
        cardPinUpper: String(cardPin).toUpperCase(),
        balance: typeof body.balance === 'undefined' ? undefined : String(body.balance),
        error: typeof body.error === 'undefined' ? undefined : String(body.error),
        ts: Date.now(),
        requestId: body.requestId ? String(body.requestId) : undefined,
      };
      const key = keyOf(cardType, cardPin);
      resolutions.set(key, payload);
      if (kv) {
        await kv.set(key, payload);
      }
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err && err.message ? err.message : 'Unknown server error' });
  }
};
