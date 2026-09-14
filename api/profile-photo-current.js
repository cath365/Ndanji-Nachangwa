const CLOUD_NAME = String(process.env.CLOUDINARY_CLOUD_NAME || '').trim();
const API_KEY = String(process.env.CLOUDINARY_API_KEY || '').trim();
const API_SECRET = String(process.env.CLOUDINARY_API_SECRET || '').trim();
const PUBLIC_ID = 'ndanji-portfolio/profile-main';

function fallbackUrl() {
  if (!CLOUD_NAME) return null;
  return `https://res.cloudinary.com/${encodeURIComponent(CLOUD_NAME)}/image/upload/${PUBLIC_ID}.jpg`;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Pragma', 'no-cache');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
    return res.status(500).json({ error: 'Cloudinary is not configured for this deployment.' });
  }

  const auth = Buffer.from(`${API_KEY}:${API_SECRET}`).toString('base64');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(CLOUD_NAME)}/resources/image/upload/${encodeURIComponent(PUBLIC_ID)}`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
          Accept: 'application/json'
        },
        cache: 'no-store',
        signal: controller.signal
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (response.status === 404) {
        return res.status(200).json({
          found: false,
          secureUrl: fallbackUrl(),
          version: null
        });
      }
      return res.status(502).json({
        error: data?.error?.message || `Unable to read current Cloudinary profile photo (${response.status}).`
      });
    }

    const secureUrl = data.secure_url || fallbackUrl();
    return res.status(200).json({
      found: true,
      secureUrl,
      version: data.version || null,
      publicId: data.public_id || PUBLIC_ID,
      format: data.format || null,
      updatedAt: data.created_at || null
    });
  } catch (error) {
    if (error?.name === 'AbortError') {
      return res.status(504).json({ error: 'Timed out while checking the current profile photo.' });
    }
    return res.status(500).json({ error: error.message || 'Unable to read current profile photo.' });
  } finally {
    clearTimeout(timer);
  }
}
