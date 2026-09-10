import { isAdminRequest } from './_admin-session.js';

const REPO = process.env.GITHUB_REPO || 'cath365/Ndanji-Nachangwa';
const BRANCH = process.env.GITHUB_BRANCH || 'main';
const PAGE_MAP = {
  home: 'index.html',
  about: 'about.html',
  experience: 'experience.html',
  impact: 'impact.html',
  insights: 'insights.html',
  education: 'education.html',
  contact: 'contact.html'
};

function headers(token) {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json'
  };
}

function getPagePath(page) {
  return PAGE_MAP[String(page || '').toLowerCase()] || null;
}

async function getGitHubFile(token, path) {
  const response = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}?ref=${encodeURIComponent(BRANCH)}`, {
    headers: headers(token)
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub read failed (${response.status}): ${text.slice(0, 180)}`);
  }
  return response.json();
}

function looksLikePortfolioHtml(html) {
  if (typeof html !== 'string' || html.length < 200 || html.length > 900000) return false;
  const normalized = html.toLowerCase();
  return normalized.includes('<html') && normalized.includes('<body') && normalized.includes('ndanji');
}

export default async function handler(req, res) {
  if (!isAdminRequest(req)) return res.status(401).json({ error: 'Unauthorized' });

  const token = process.env.GITHUB_TOKEN;
  if (!token) return res.status(500).json({ error: 'GITHUB_TOKEN is not configured.' });

  const page = req.method === 'GET' ? req.query?.page : req.body?.page;
  const path = getPagePath(page);
  if (!path) return res.status(400).json({ error: 'Unknown portfolio page.' });

  if (req.method === 'GET') {
    try {
      const file = await getGitHubFile(token, path);
      const html = Buffer.from(String(file.content || '').replace(/\n/g, ''), 'base64').toString('utf8');
      return res.status(200).json({ page, path, html, sha: file.sha, branch: BRANCH });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method !== 'PUT') {
    res.setHeader('Allow', 'GET, PUT');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const html = req.body?.html;
  if (!looksLikePortfolioHtml(html)) return res.status(400).json({ error: 'Invalid portfolio HTML.' });

  try {
    const current = await getGitHubFile(token, path);
    const response = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
      method: 'PUT',
      headers: headers(token),
      body: JSON.stringify({
        message: `Update ${path} from portfolio admin`,
        content: Buffer.from(html).toString('base64'),
        sha: current.sha,
        branch: BRANCH
      })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result?.message || `GitHub update failed (${response.status})`);
    return res.status(200).json({ ok: true, page, path, commit: result.commit?.sha || null });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
