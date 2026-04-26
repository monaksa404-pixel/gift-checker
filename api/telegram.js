module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const text = req.body && req.body.text ? String(req.body.text) : '';

  if (!token || !chatId) {
    res.status(500).json({ error: 'Telegram env vars are missing on server' });
    return;
  }
  if (!text) {
    res.status(400).json({ error: 'Missing message text' });
    return;
  }

  try {
    const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
      }),
    });

    if (!tgRes.ok) {
      const errBody = await tgRes.text();
      res.status(502).json({ error: `Telegram API error: ${errBody}` });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err && err.message ? err.message : 'Unknown server error' });
  }
};
