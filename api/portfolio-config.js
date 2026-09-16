import { isAdminRequest } from './_admin-session.js';

const REPO = process.env.GITHUB_REPO || 'cath365/Ndanji-Nachangwa';
const BRANCH = process.env.GITHUB_BRANCH || 'main';
const PATH = 'assets/portfolio-config.json';

function headers(token) {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json'
  };
}

function cleanHttps(value, { linkedin = false } = {}) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  let url;
  try { url = new URL(raw); } catch { throw new Error('Enter a valid HTTPS URL.'); }
  if (url.protocol !== 'https:') throw new Error('Only HTTPS URLs are allowed.');
  if (linkedin && !/(^|\.)linkedin\.com$/i.test(url.hostname)) throw new Error('LinkedIn URL must use linkedin.com.');
  return url.toString();
}

function normalise(input = {}) {
  const availability = String(input.availability || '').trim().slice(0, 240);
  const cvLabel = String(input.cvLabel || 'Download CV').trim().slice(0, 60) || 'Download CV';
  return {
    linkedinUrl: cleanHttps(input.linkedinUrl, { linkedin: true }),
    cvUrl: cleanHttps(input.cvUrl),
    cvLabel,
    availability,
    email: String(input.email || 'ndanjizoe@gmail.com').trim().slice(0, 160),
    phoneDisplay: String(input.phoneDisplay || '+260 973 006 049').trim().slice(0, 40),
    phoneInternational: String(input.phoneInternational || '+260973006049').trim().replace(/[^+0-9]/g, '').slice(0, 24),
    updatedAt: new Date().toISOString()
  };
}

async function getFile(token) {
  const response = await fetch(`https://api.github.com/repos/${REPO}/contents/${PATH}?ref=${encodeURIComponent(BRANCH)}`, { headers: headers(token) });
  if (response.status === 404) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.message || `GitHub read failed (${response.status})`);
  return data;
}

function deployHook() {
  const raw = String(process.env.PUBLIC_DEPLOY_HOOK_URL || '').trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' || url.hostname !== 'api.vercel.com' || !url.pathname.startsWith('/v1/integrations/deploy/')) return null;
    return url.toString();
  } catch { return null; }
}

async function triggerDeployment() {
  const hook = deployHook();
  if (!hook) return { configured: false, triggered: false };
  try {
    const response = await fetch(hook, { method: 'POST', headers: { Accept: 'application/json' } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return { configured: true, triggered: false, error: data?.error?.message || data?.message || `Deploy hook failed (${response.status})` };
    return { configured: true, triggered: true, jobId: data?.job?.id || data?.id || null };
  } catch (error) {
    return { configured: true, triggered: false, error: error.message || 'Deploy hook failed.' };
  }
}

export default async function handler(req, res) {
  if (!isAdminRequest(req)) return res.status(401).json({ error: 'Unauthorized' });
  const token = process.env.GITHUB_TOKEN;
  if (!token) return res.status(500).json({ error: 'GITHUB_TOKEN is not configured.' });

  if (req.method === 'GET') {
    try {
      const file = await getFile(token);
      if (!file?.content) return res.status(200).json({ config: normalise({ linkedinUrl: 'https://zm.linkedin.com/in/ndanji-nachangwa-59468321a' }) });
      const text = Buffer.from(String(file.content || '').replace(/\n/g, ''), 'base64').toString('utf8');
      const parsed = JSON.parse(text);
      return res.status(200).json({ config: parsed, sha: file.sha, branch: BRANCH });
    } catch (error) {
      return res.status(500).json({ error: error.message || 'Unable to load portfolio configuration.' });
    }
  }

  if (req.method !== 'PUT') {
    res.setHeader('Allow', 'GET, PUT');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const config = normalise(req.body || {});
    const current = await getFile(token);
    const body = {
      message: 'Update professional profile links from portfolio admin',
      content: Buffer.from(JSON.stringify(config, null, 2) + '\n').toString('base64'),
      branch: BRANCH
    };
    if (current?.sha) body.sha = current.sha;

    const response = await fetch(`https://api.github.com/repos/${REPO}/contents/${PATH}`, {
      method: 'PUT',
      headers: headers(token),
      body: JSON.stringify(body)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result?.message || `GitHub update failed (${response.status})`);

    const deployment = await triggerDeployment();
    return res.status(200).json({ ok: true, config, commit: result.commit?.sha || null, deployment });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Unable to update professional profile links.' });
  }
}
