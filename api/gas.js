export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method Not Allowed' });
    return;
  }

  const endpoint = process.env.GAS_API_URL || process.env.GAS_WEBAPP_URL || '';
  if (!endpoint) {
    res.status(500).json({ ok: false, error: 'GAS_API_URL is not configured' });
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const method = String(body.method || '').trim();
    const params = body.params;
    const token = process.env.GAS_API_TOKEN || '';

    const gasRes = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ method, params, token })
    });

    const text = await gasRes.text();
    let payload;
    try {
      payload = JSON.parse(text);
    } catch (_e) {
      payload = { ok: false, error: 'Invalid GAS response', raw: text };
    }

    res.status(gasRes.ok ? 200 : 502).json(payload);
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: err && err.message ? err.message : 'Proxy failed'
    });
  }
}
