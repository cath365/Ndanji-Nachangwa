import { isAdminRequest } from './_admin-session.js';

const CLOUD_NAME = String(process.env.CLOUDINARY_CLOUD_NAME || '').trim();
const API_KEY = String(process.env.CLOUDINARY_API_KEY || '').trim();
const API_SECRET = String(process.env.CLOUDINARY_API_SECRET || '').trim();
const FOLDER_PREFIX = 'ndanji-portfolio/';

async function loadResources(resourceType, max, auth) {
  const url = new URL(`https://api.cloudinary.com/v1_1/${encodeURIComponent(CLOUD_NAME)}/resources/${resourceType}/upload`);
  url.searchParams.set('prefix', FOLDER_PREFIX);
  url.searchParams.set('max_results', String(max));
  url.searchParams.set('direction', 'desc');
  const response = await fetch(url, { headers: { Accept: 'application/json', Authorization: `Basic ${auth}` } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error?.message || `Cloudinary ${resourceType} request failed (${response.status})`);
  return (Array.isArray(data.resources) ? data.resources : []).map((r) => ({
    publicId: r.public_id,
    secureUrl: r.secure_url,
    width: r.width || null,
    height: r.height || null,
    duration: r.duration || null,
    format: r.format || '',
    bytes: r.bytes || 0,
    createdAt: r.created_at,
    resourceType: r.resource_type || resourceType,
    type: r.type || 'upload'
  }));
}

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
  try {
    const results = await Promise.allSettled([
      loadResources('image', max, auth),
      loadResources('video', max, auth),
      loadResources('raw', max, auth)
    ]);
    const items = results.flatMap((r) => r.status === 'fulfilled' ? r.value : [])
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, max);
    const warnings = results.filter((r) => r.status === 'rejected').map((r) => r.reason?.message || 'Media category unavailable');
    return res.status(200).json({ items, count: items.length, warnings });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Unable to load Cloudinary media.' });
  }
}
