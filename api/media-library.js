import { isAdminRequest } from './_admin-session.js';

const CLOUD_NAME = String(process.env.CLOUDINARY_CLOUD_NAME || '').trim();
const API_KEY = String(process.env.CLOUDINARY_API_KEY || '').trim();
const API_SECRET = String(process.env.CLOUDINARY_API_SECRET || '').trim();
const FOLDER_PREFIX = 'ndanji-portfolio/';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!isAdminRequest(req)) return res.status(401).json({ error: 'Unauthorized' });
  if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
    return res.status(500).json({ error: 'Cloudinary environment variables are not configured.' });
  }

  const max = Math.max(1, Math.min(100, Number(req.query?.limit || 60)));
  const auth = Buffer.from(`${API_KEY}:${API_SECRET}`).toString('base64');
  const url = new URL(`https://api.cloudinary.com/v1_1/${encodeURIComponent(CLOUD_NAME)}/resources/image/upload`);
  url.searchParams.set('prefix', FOLDER_PREFIX);
  url.searchParams.set('max_results', String(max));
  url.searchParams.set('direction', 'desc');

  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        Authorization: `Basic ${auth}`
      }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.error?.message || `Cloudinary media request failed (${response.status})`);

    const items = (Array.isArray(data.resources) ? data.resources : []).map((r) => ({
      publicId: r.public_id,
      secureUrl: r.secure_url,
      width: r.width,
      height: r.height,
      format: r.format,
      bytes: r.bytes,
      createdAt: r.created_at
    }));

    return res.status(200).json({ items, count: items.length });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Unable to load Cloudinary media.' });
  }
}
