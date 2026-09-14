import crypto from 'node:crypto';
import { isAdminRequest } from './_admin-session.js';

const CLOUD_NAME = String(process.env.CLOUDINARY_CLOUD_NAME || '').trim();
const API_KEY = String(process.env.CLOUDINARY_API_KEY || '').trim();
const API_SECRET = String(process.env.CLOUDINARY_API_SECRET || '').trim();
const PUBLIC_ID = 'ndanji-portfolio/profile-main';

function sign(params) {
  const base = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');
  return crypto.createHash('sha1').update(base + API_SECRET).digest('hex');
}

function validSource(value) {
  if (typeof value !== 'string' || !value.trim()) return false;
  const v = value.trim();
  return v.startsWith('data:image/') || /^https:\/\//i.test(v);
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!isAdminRequest(req)) return res.status(401).json({ error: 'Unauthorized' });

  if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
    return res.status(500).json({
      error: 'Cloudinary is not configured on this Vercel deployment.',
      missing: {
        cloudName: !CLOUD_NAME,
        apiKey: !API_KEY,
        apiSecret: !API_SECRET
      }
    });
  }

  const source = String(req.body?.source || '').trim();
  if (!validSource(source)) {
    return res.status(400).json({ error: 'Choose an image or provide a valid HTTPS image URL.' });
  }

  if (source.startsWith('data:image/') && source.length > 4_000_000) {
    return res.status(413).json({ error: 'The image is still too large after compression. Choose a smaller photo.' });
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const params = {
    invalidate: 'true',
    overwrite: 'true',
    public_id: PUBLIC_ID,
    timestamp
  };
  const signature = sign(params);
  const form = new FormData();
  form.append('file', source);
  form.append('api_key', API_KEY);
  form.append('timestamp', String(timestamp));
  form.append('public_id', PUBLIC_ID);
  form.append('overwrite', 'true');
  form.append('invalidate', 'true');
  form.append('signature', signature);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);
  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(CLOUD_NAME)}/image/upload`, {
      method: 'POST',
      body: form,
      signal: controller.signal
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const detail = data?.error?.message || `Cloudinary upload failed (${response.status}).`;
      return res.status(502).json({ error: detail });
    }

    return res.status(200).json({
      ok: true,
      secureUrl: data.secure_url,
      version: data.version || null,
      width: data.width || null,
      height: data.height || null,
      publicId: data.public_id || PUBLIC_ID
    });
  } catch (error) {
    if (error?.name === 'AbortError') {
      return res.status(504).json({ error: 'Cloudinary upload timed out. Please try again.' });
    }
    return res.status(500).json({ error: error.message || 'Unable to upload profile photo.' });
  } finally {
    clearTimeout(timer);
  }
}
