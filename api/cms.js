import { isAdminRequest } from './_admin-session.js';

const REPO = process.env.GITHUB_REPO || 'cath365/Ndanji-Nachangwa';
const BRANCH = process.env.GITHUB_BRANCH || 'main';
const PATH = 'data/cms-content.json';

function headers(token) {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json'
  };
}

function validContent(data) {
  if (!data || typeof data !== 'object' || !data.pages || typeof data.pages !== 'object') return false;
  const allowed = ['/', '/about.html', '/experience.html', '/impact.html', '/insights.html', '/education.html', '/contact.html'];
  return Object.keys(data.pages).every(key => allowed.includes(key));
}

async function getGitHubFile(token) {
  const response = await fetch(`https://api.github.com/repos/${REPO}/contents/${PATH}?ref=${encodeURIComponent(BRANCH)}`, {
    headers: headers(token)
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub read failed (${response.status}): ${text.slice(0, 180)}`);
  }
  return response.json();
}

export default async function handler(req, res) {
  if (!isAdminRequest(req)) return res.status(401).json({ error: 'Unauthorized' });

  const token = process.env.GITHUB_TOKEN;
  if (!token) return res.status(500).json({ error: 'GITHUB_TOKEN is not configured.' });

  if (req.method === 'GET') {
    try {
      const file = await getGitHubFile(token);
      const decoded = Buffer.from(String(file.content || '').replace(/\n/g, ''), 'base64').toString('utf8');
      return res.status(200).json({ content: JSON.parse(decoded), sha: file.sha, branch: BRANCH });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method !== 'PUT') {
    res.setHeader('Allow', 'GET, PUT');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const content = req.body?.content;
  if (!validContent(content)) return res.status(400).json({ error: 'Invalid CMS content.' });

  const encoded = Buffer.from(JSON.stringify({ ...content, version: 1, updatedAt: new Date().toISOString() }, null, 2) + '\n').toString('base64');
  if (encoded.length > 900000) return res.status(413).json({ error: 'CMS content is too large.' });

  try {
    const current = await getGitHubFile(token);
    const response = await fetch(`https://api.github.com/repos/${REPO}/contents/${PATH}`, {
      method: 'PUT',
      headers: headers(token),
      body: JSON.stringify({
        message: 'Update portfolio content from admin dashboard',
        content: encoded,
        sha: current.sha,
        branch: BRANCH
      })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result?.message || `GitHub update failed (${response.status})`);
    return res.status(200).json({ ok: true, commit: result.commit?.sha || null, updatedAt: new Date().toISOString() });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
