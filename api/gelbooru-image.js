export default async function handler(req, res) {
  const { url } = req.query;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing url param' });
  }

  // Only allow Gelbooru image hosts through — prevents SSRF
  const allowedHosts = [
    'img1.gelbooru.com',
    'img2.gelbooru.com',
    'img3.gelbooru.com',
    'img4.gelbooru.com',
    'video-cdn1.gelbooru.com',
    'video-cdn2.gelbooru.com',
  ];

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return res.status(400).json({ error: 'Invalid url' });
  }

  if (!allowedHosts.includes(parsed.hostname)) {
    return res.status(403).json({ error: 'Host not allowed' });
  }

  try {
    const upstream = await fetch(url, {
      headers: { 'User-Agent': 'AniMatch/1.0' },
    });

    if (!upstream.ok) {
      return res.status(upstream.status).end();
    }

    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
    res.setHeader('Access-Control-Allow-Origin', '*');

    const buffer = Buffer.from(await upstream.arrayBuffer());
    return res.status(200).send(buffer);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Image proxy error' });
  }
}