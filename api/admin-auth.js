import { clearSessionCookie, createSessionToken, isAdminRequest, safePasswordEqual, sessionCookie } from './_admin-session.js';

// Firebase Web API keys are public client identifiers. Keep this aligned with
// the Firebase web app used by the portfolio admin.
const FIREBASE_WEB_API_KEY = 'AIzaSyC21iURx8rnfn2BY1CY73gUCXOMux7FMfM';
const FIREBASE_AUTH_BASE = 'https://identitytoolkit.googleapis.com/v1';

function adminEmail() {
  return String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
}

function friendlyFirebaseError(code) {
  const errors = {
    EMAIL_NOT_FOUND: 'No Firebase account exists for that email.',
    INVALID_PASSWORD: 'The password is incorrect.',
    INVALID_LOGIN_CREDENTIALS: 'The email or password is incorrect.',
    USER_DISABLED: 'This Firebase account is disabled.',
    TOO_MANY_ATTEMPTS_TRY_LATER: 'Too many login attempts. Please wait a little and try again.',
    INVALID_ID_TOKEN: 'The Firebase session expired. Please sign in again.',
    TOKEN_EXPIRED: 'The Firebase session expired. Please sign in again.'
  };
  return errors[code] || String(code || 'Firebase authentication failed.').replaceAll('_', ' ').toLowerCase();
}

async function firebasePost(endpoint, body, timeoutMs = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(
      `${FIREBASE_AUTH_BASE}/${endpoint}?key=${encodeURIComponent(FIREBASE_WEB_API_KEY)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal
      }
    );
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const code = data?.error?.message || `HTTP_${response.status}`;
      const error = new Error(friendlyFirebaseError(code));
      error.status = response.status === 400 ? 401 : 502;
      throw error;
    }
    return data;
  } catch (error) {
    if (error?.name === 'AbortError') {
      const timeout = new Error('Firebase authentication timed out. Please try again.');
      timeout.status = 504;
      throw timeout;
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

async function verifyFirebaseLogin(idToken) {
  const expectedEmail = adminEmail();
  if (!expectedEmail) throw new Error('ADMIN_EMAIL is not configured for this deployment.');

  const data = await firebasePost('accounts:lookup', { idToken });
  const user = Array.isArray(data.users) ? data.users[0] : null;
  if (!user?.email) throw new Error('Firebase did not return an email for this account.');
  if (user.disabled) return { valid: false, reason: 'disabled' };

  const signedInEmail = String(user.email).trim().toLowerCase();
  if (signedInEmail !== expectedEmail) return { valid: false, reason: 'email-mismatch' };
  return { valid: true, email: signedInEmail };
}

async function firebasePasswordLogin(email, password) {
  const expectedEmail = adminEmail();
  if (!expectedEmail) throw new Error('ADMIN_EMAIL is not configured for this deployment.');

  const cleanEmail = String(email || '').trim().toLowerCase();
  if (!cleanEmail || !password) {
    const error = new Error('Enter the admin email and password.');
    error.status = 400;
    throw error;
  }
  if (cleanEmail !== expectedEmail) {
    const error = new Error('This email is not authorized for the portfolio admin.');
    error.status = 401;
    throw error;
  }

  const data = await firebasePost('accounts:signInWithPassword', {
    email: cleanEmail,
    password: String(password),
    returnSecureToken: true
  });

  const signedInEmail = String(data?.email || '').trim().toLowerCase();
  if (!signedInEmail || signedInEmail !== expectedEmail) {
    const error = new Error('The signed-in Firebase account is not authorized for this portfolio.');
    error.status = 401;
    throw error;
  }
  return { valid: true, email: signedInEmail };
}

function issueSession(res, method) {
  const token = createSessionToken();
  res.setHeader('Set-Cookie', sessionCookie(token));
  return res.status(200).json({ authenticated: true, method });
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');

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
    return res.status(500).json({ error: 'ADMIN_SESSION_SECRET is not configured for this deployment.' });
  }

  // Preferred path: the browser sends email/password only to this HTTPS API.
  // Vercel performs the Firebase request server-side and immediately issues the
  // secure HttpOnly CMS session cookie. This removes the previous two-step login
  // that could leave the browser sitting on “Authenticating…”.
  if (typeof req.body?.email === 'string' && typeof req.body?.password === 'string') {
    try {
      await firebasePasswordLogin(req.body.email, req.body.password);
      return issueSession(res, 'firebase-password');
    } catch (error) {
      return res.status(Number(error.status) || 500).json({ error: error.message || 'Firebase sign in failed.' });
    }
  }

  // Token verification remains supported for existing clients.
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
      return issueSession(res, 'firebase-token');
    } catch (error) {
      return res.status(Number(error.status) || 500).json({ error: error.message || 'Firebase authentication failed.' });
    }
  }

  // Temporary legacy password fallback while Firebase production settings are
  // being finalized. It can be removed after Firebase login is confirmed.
  const legacyPassword = process.env.ADMIN_PASSWORD;
  const password = req.body?.password;
  if (!legacyPassword || !safePasswordEqual(password, legacyPassword)) {
    return res.status(401).json({ error: 'Invalid login.' });
  }
  return issueSession(res, 'legacy-password');
}
