// Vercel serverless function that proxies requests to Gelbooru.
// Credentials are read from environment variables so they never reach the browser.

export default async function handler(req, res) {
  // CORS: allow requests from the same origin (Vercel handles this) + localhost for dev
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const apiKey = process.env.GELBOORU_API_KEY;
  const userId = process.env.GELBOORU_USER_ID;

  if (!apiKey || !userId) {
    return res.status(500).json({ error: 'Gelbooru credentials not configured' });
  }

  // Forward query params from the client (tags, pid, limit)
  const { tags = 'solo', pid = '0', limit = '42' } = req.query;

  const params = new URLSearchParams({
    page: 'dapi',
    s: 'post',
    q: 'index',
    json: '1',
    api_key: apiKey,
    user_id: userId,
    tags: String(tags),
    pid: String(pid),
    limit: String(limit),
  });

  const url = `https://gelbooru.com/index.php?${params.toString()}`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'AniMatch/1.0 (personal project)',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `Gelbooru returned ${response.status}` });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Proxy error' });
  }
}