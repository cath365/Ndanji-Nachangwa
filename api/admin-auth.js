import { clearSessionCookie, createSessionToken, isAdminRequest, safePasswordEqual, sessionCookie } from './_admin-session.js';

const FIREBASE_WEB_API_KEY = 'AIzaSyC21iURx8rnfn2BY1CY73gUCXOMux7FMfM';

async function verifyFirebaseLogin(idToken) {
  const adminEmail = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  if (!adminEmail) {
    throw new Error('ADMIN_EMAIL is not configured.');
  }

  const apiKey = process.env.FIREBASE_API_KEY || FIREBASE_WEB_API_KEY;
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken })
  });

  const data = await response.json().catch(() => ({}));
  const user = Array.isArray(data.users) ? data.users[0] : null;
  if (!response.ok || !user?.email) {
    return false;
  }

  return !user.disabled && String(user.email).trim().toLowerCase() === adminEmail;
}

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

  if (!process.env.ADMIN_SESSION_SECRET) {
    return res.status(500).json({ error: 'Admin session security is not configured.' });
  }

  const idToken = req.body?.idToken;
  if (typeof idToken === 'string' && idToken.length > 20) {
    try {
      const valid = await verifyFirebaseLogin(idToken);
      if (!valid) {
        return res.status(401).json({ error: 'This Firebase account is not authorized for the portfolio admin.' });
      }
      const token = createSessionToken();
      res.setHeader('Set-Cookie', sessionCookie(token));
      return res.status(200).json({ authenticated: true, method: 'firebase' });
    } catch (error) {
      return res.status(500).json({ error: error.message || 'Firebase authentication is not configured.' });
    }
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  const password = req.body?.password;
  if (!adminPassword || !safePasswordEqual(password, adminPassword)) {
    return res.status(401).json({ error: 'Invalid login.' });
  }

  const token = createSessionToken();
  res.setHeader('Set-Cookie', sessionCookie(token));
  return res.status(200).json({ authenticated: true, method: 'legacy-password' });
}
