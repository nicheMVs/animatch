export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const username = process.env.DANBOORU_USERNAME;
  const apiKey = process.env.DANBOORU_API_KEY;

  if (!username || !apiKey) {
    return res.status(500).json({ error: 'Danbooru credentials not configured' });
  }

  const { tags = 'solo rating:explicit', page = '1', limit = '100' } = req.query;

  // Danbooru uses login and api_key as URL parameters for auth
  const params = new URLSearchParams({
    tags: String(tags),
    page: String(page),
    limit: String(limit),
    login: username,
    api_key: apiKey,
  });

  try {
    const response = await fetch(`https://danbooru.donmai.us/posts.json?${params.toString()}`, {
      headers: {
        'User-Agent': 'AniMatch/1.0 (personal project)',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `Danbooru returned ${response.status}` });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Proxy error' });
  }
}