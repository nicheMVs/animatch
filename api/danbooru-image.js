export default async function handler(req, res) {
  const { url } = req.query;
  if (!url || typeof url !== 'string') return res.status(400).json({ error: 'Missing url' });

  let parsed;
  try { parsed = new URL(url); } catch { return res.status(400).json({ error: 'Invalid url' }); }

  // Only allow Danbooru image hosts
  const allowedHosts = ['cdn.donmai.us', 'danbooru.donmai.us', 'safebooru.donmai.us'];
  if (!allowedHosts.some((host) => parsed.hostname.endsWith(host))) {
    return res.status(403).json({ error: 'Host not allowed' });
  }

  try {
    const upstream = await fetch(url, {
      headers: {
        'User-Agent': 'AniMatch/1.0 (personal project)',
        'Referer': 'https://danbooru.donmai.us/',
      },
    });

    if (!upstream.ok) return res.status(upstream.status).end();

    const contentType = upstream.headers.get('content-type') || 'image/jpeg';
    if (contentType.includes('text/html')) {
      return res.status(502).json({ error: 'Upstream returned HTML instead of an image' });
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
    const buffer = Buffer.from(await upstream.arrayBuffer());
    return res.status(200).send(buffer);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Image proxy error' });
  }
}