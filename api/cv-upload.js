import { isAdminRequest } from './_admin-session.js';

const REPO = process.env.GITHUB_REPO || 'cath365/Ndanji-Nachangwa';
const BRANCH = process.env.GITHUB_BRANCH || 'main';
const CV_PATH = 'assets/ndanji-nachangwa-cv.pdf';
const MAX_BYTES = 3 * 1024 * 1024;

function headers(token) {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json'
  };
}

async function getCurrent(token) {
  const response = await fetch(`https://api.github.com/repos/${REPO}/contents/${CV_PATH}?ref=${encodeURIComponent(BRANCH)}`, {
    headers: headers(token)
  });
  if (response.status === 404) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.message || `GitHub read failed (${response.status})`);
  return data;
}

function validPdf(buffer) {
  return buffer.length >= 5 && buffer.subarray(0, 5).toString('ascii') === '%PDF-';
}

export default async function handler(req, res) {
  if (!isAdminRequest(req)) return res.status(401).json({ error: 'Unauthorized' });
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) return res.status(500).json({ error: 'GITHUB_TOKEN is not configured.' });

  try {
    const raw = String(req.body?.dataBase64 || '').trim();
    if (!raw) return res.status(400).json({ error: 'No PDF data was received.' });

    const base64 = raw.replace(/^data:application\/pdf;base64,/i, '').replace(/\s/g, '');
    const buffer = Buffer.from(base64, 'base64');
    if (!buffer.length) return res.status(400).json({ error: 'The uploaded PDF is empty.' });
    if (buffer.length > MAX_BYTES) return res.status(413).json({ error: 'Please keep the CV PDF below 3 MB.' });
    if (!validPdf(buffer)) return res.status(400).json({ error: 'The selected file is not a valid PDF.' });

    const current = await getCurrent(token);
    const body = {
      message: 'Update public CV from portfolio admin',
      content: buffer.toString('base64'),
      branch: BRANCH
    };
    if (current?.sha) body.sha = current.sha;

    const response = await fetch(`https://api.github.com/repos/${REPO}/contents/${CV_PATH}`, {
      method: 'PUT',
      headers: headers(token),
      body: JSON.stringify(body)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result?.message || `GitHub CV upload failed (${response.status})`);

    const version = Date.now();
    return res.status(200).json({
      ok: true,
      path: CV_PATH,
      cvUrl: `/assets/ndanji-nachangwa-cv.pdf?v=${version}`,
      commit: result.commit?.sha || null
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Unable to upload the CV.' });
  }
}
