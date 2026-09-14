import { clearSessionCookie, createSessionToken, isAdminRequest, safePasswordEqual, sessionCookie } from './_admin-session.js';

// Firebase Web API keys are public client identifiers. Keep this aligned with
// the Firebase web app used by admin.html so token lookup always targets the
// same Firebase project, regardless of an accidentally misconfigured Vercel var.
const FIREBASE_WEB_API_KEY = 'AIzaSyC21iURx8rnfn2BY1CY73gUCXOMux7FMfM';

async function verifyFirebaseLogin(idToken) {
  const adminEmail = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  if (!adminEmail) {
    throw new Error('ADMIN_EMAIL is not configured for this deployment.');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  let response;
  try {
    response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(FIREBASE_WEB_API_KEY)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
        signal: controller.signal
      }
    );
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error('Firebase verification timed out. Please try signing in again.');
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const firebaseMessage = data?.error?.message || 'Firebase token verification failed.';
    throw new Error(`Firebase token verification failed: ${firebaseMessage}`);
  }

  const user = Array.isArray(data.users) ? data.users[0] : null;
  if (!user?.email) {
    throw new Error('Firebase did not return an email for this account.');
  }

  if (user.disabled) {
    return { valid: false, reason: 'disabled' };
  }

  const signedInEmail = String(user.email).trim().toLowerCase();
  if (signedInEmail !== adminEmail) {
    return { valid: false, reason: 'email-mismatch' };
  }

  return { valid: true };
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
      const result = await verifyFirebaseLogin(idToken);
      if (!result.valid) {
        if (result.reason === 'email-mismatch') {
          return res.status(401).json({ error: 'Signed-in Firebase email does not match ADMIN_EMAIL for this deployment.' });
        }
        if (result.reason === 'disabled') {
          return res.status(401).json({ error: 'This Firebase account is disabled.' });
        }
        return res.status(401).json({ error: 'This Firebase account is not authorized for the portfolio admin.' });
      }

      const token = createSessionToken();
      res.setHeader('Set-Cookie', sessionCookie(token));
      return res.status(200).json({ authenticated: true, method: 'firebase' });
    } catch (error) {
      return res.status(500).json({ error: error.message || 'Firebase authentication is not configured.' });
    }
  }

  // Temporary legacy fallback while migrating from the old password-only login.
  const adminPassword = process.env.ADMIN_PASSWORD;
  const password = req.body?.password;
  if (!adminPassword || !safePasswordEqual(password, adminPassword)) {
    return res.status(401).json({ error: 'Invalid login.' });
  }

  const token = createSessionToken();
  res.setHeader('Set-Cookie', sessionCookie(token));
  return res.status(200).json({ authenticated: true, method: 'legacy-password' });
}
