import { clearSessionCookie, createSessionToken, isAdminRequest, safePasswordEqual, sessionCookie } from './_admin-session.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({ authenticated: isAdminRequest(req) });
  }

  if (req.method === 'DELETE') {
    res.setHeader('Set-Cookie', clearSessionCookie());
    return res.status(200).json({ ok: true });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword || !process.env.ADMIN_SESSION_SECRET) {
    return res.status(500).json({ error: 'Admin authentication is not configured.' });
  }

  const password = req.body?.password;
  if (!safePasswordEqual(password, adminPassword)) {
    return res.status(401).json({ error: 'Invalid password.' });
  }

  const token = createSessionToken();
  res.setHeader('Set-Cookie', sessionCookie(token));
  return res.status(200).json({ authenticated: true });
}
