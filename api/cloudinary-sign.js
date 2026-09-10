import crypto from 'node:crypto';
import { isAdminRequest } from './_admin-session.js';

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'dwka1eckr';
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;
const FOLDER = 'ndanji-portfolio';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!isAdminRequest(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!API_KEY || !API_SECRET) {
    return res.status(500).json({ error: 'Cloudinary environment variables are not configured.' });
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const paramsToSign = {
    folder: FOLDER,
    overwrite: 'false',
    timestamp
  };

  const signatureBase = Object.keys(paramsToSign)
    .sort()
    .map((key) => `${key}=${paramsToSign[key]}`)
    .join('&');

  const signature = crypto
    .createHash('sha1')
    .update(signatureBase + API_SECRET)
    .digest('hex');

  return res.status(200).json({
    cloudName: CLOUD_NAME,
    apiKey: API_KEY,
    timestamp,
    folder: FOLDER,
    overwrite: false,
    signature
  });
}
