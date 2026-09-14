import crypto from 'node:crypto';
import { isAdminRequest } from './_admin-session.js';

const CLOUD_NAME = String(process.env.CLOUDINARY_CLOUD_NAME || '').trim();
const API_KEY = String(process.env.CLOUDINARY_API_KEY || '').trim();
const API_SECRET = String(process.env.CLOUDINARY_API_SECRET || '').trim();
const FOLDER = 'ndanji-portfolio';
const PUBLIC_ID = 'profile-main';
const FORMAT = 'jpg';

function signParams(params) {
  const base = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');
  return crypto.createHash('sha1').update(base + API_SECRET).digest('hex');
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!isAdminRequest(req)) return res.status(401).json({ error: 'Unauthorized' });

  if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
    return res.status(500).json({ error: 'Cloudinary environment variables are not configured.' });
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const params = {
    folder: FOLDER,
    format: FORMAT,
    invalidate: 'true',
    overwrite: 'true',
    public_id: PUBLIC_ID,
    timestamp
  };

  const signature = signParams(params);
  const stableUrl = `https://res.cloudinary.com/${encodeURIComponent(CLOUD_NAME)}/image/upload/${FOLDER}/${PUBLIC_ID}.${FORMAT}`;

  return res.status(200).json({
    cloudName: CLOUD_NAME,
    apiKey: API_KEY,
    timestamp,
    folder: FOLDER,
    publicId: PUBLIC_ID,
    format: FORMAT,
    overwrite: true,
    invalidate: true,
    signature,
    stableUrl
  });
}
