import { isAdminRequest } from './_admin-session.js';

const REPO = process.env.GITHUB_REPO || 'cath365/Ndanji-Nachangwa';
const BRANCH = process.env.GITHUB_BRANCH || 'main';
const PAGE_MAP = {
  home: 'index.html',
  about: 'about.html',
  experience: 'experience.html',
  impact: 'impact.html',
  engagements: 'engagements.html',
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

function pagePath(page) {
  return PAGE_MAP[String(page || '').toLowerCase()] || null;
}

async function gh(token, url, options = {}) {
  const response = await fetch(url, { ...options, headers: { ...headers(token), ...(options.headers || {}) } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.message || `GitHub request failed (${response.status})`);
  return data;
}

function validCommitSha(value) {
  return /^[0-9a-f]{7,40}$/i.test(String(value || ''));
}

export default async function handler(req, res) {
  if (!isAdminRequest(req)) return res.status(401).json({ error: 'Unauthorized' });
  const token = process.env.GITHUB_TOKEN;
  if (!token) return res.status(500).json({ error: 'GITHUB_TOKEN is not configured.' });

  const page = req.method === 'GET' ? req.query?.page : req.body?.page;
  const path = pagePath(page);
  if (!path) return res.status(400).json({ error: 'Unknown portfolio page.' });

  if (req.method === 'GET') {
    try {
      const url = new URL(`https://api.github.com/repos/${REPO}/commits`);
      url.searchParams.set('path', path);
      url.searchParams.set('sha', BRANCH);
      url.searchParams.set('per_page', '12');
      const commits = await gh(token, url.toString());
      return res.status(200).json({
        page,
        path,
        commits: (Array.isArray(commits) ? commits : []).map((c) => ({
          sha: c.sha,
          shortSha: String(c.sha || '').slice(0, 7),
          message: c.commit?.message || 'Portfolio update',
          author: c.commit?.author?.name || c.author?.login || 'Unknown',
          date: c.commit?.author?.date || null,
          url: c.html_url || null
        }))
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const restoreSha = req.body?.sha;
  if (!validCommitSha(restoreSha)) return res.status(400).json({ error: 'Invalid restore commit.' });

  try {
    const historic = await gh(token, `https://api.github.com/repos/${REPO}/contents/${path}?ref=${encodeURIComponent(restoreSha)}`);
    const current = await gh(token, `https://api.github.com/repos/${REPO}/contents/${path}?ref=${encodeURIComponent(BRANCH)}`);
    if (!historic?.content || !current?.sha) throw new Error('Unable to resolve the selected version.');

    const restored = await gh(token, `https://api.github.com/repos/${REPO}/contents/${path}`, {
      method: 'PUT',
      body: JSON.stringify({
        message: `Restore ${path} from ${String(restoreSha).slice(0, 7)} via portfolio admin`,
        content: String(historic.content).replace(/\n/g, ''),
        sha: current.sha,
        branch: BRANCH
      })
    });

    return res.status(200).json({
      ok: true,
      page,
      path,
      restoredFrom: restoreSha,
      commit: restored.commit?.sha || null
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Unable to restore this version.' });
  }
}
