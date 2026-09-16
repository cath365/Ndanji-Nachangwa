const AUTH_BASE = 'https://identitytoolkit.googleapis.com/v1';
const SESSION_KEY = 'ndanji-firebase-admin-session';
let firebaseApiKeyPromise = null;

async function getFirebaseApiKey() {
  if (!firebaseApiKeyPromise) {
    firebaseApiKeyPromise = fetch('/api/firebase-config', {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store'
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data?.apiKey) {
          throw new Error(data?.error || 'Firebase is not configured for this deployment.');
        }
        return String(data.apiKey).trim();
      })
      .catch((error) => {
        firebaseApiKeyPromise = null;
        throw error;
      });
  }
  return firebaseApiKeyPromise;
}

function friendlyFirebaseError(code) {
  const errors = {
    EMAIL_NOT_FOUND: 'No authorized Firebase account was found for that email.',
    INVALID_PASSWORD: 'The password is incorrect.',
    INVALID_LOGIN_CREDENTIALS: 'The email or password is incorrect.',
    USER_DISABLED: 'This Firebase account is disabled.',
    TOO_MANY_ATTEMPTS_TRY_LATER: 'Too many login attempts. Please wait a little and try again.',
    EMAIL_EXISTS: 'That email is already in use.',
    WEAK_PASSWORD: 'The new password is too weak.',
    INVALID_ID_TOKEN: 'Your Firebase session expired. Please sign in again.',
    TOKEN_EXPIRED: 'Your Firebase session expired. Please sign in again.'
  };
  return errors[code] || String(code || 'Firebase authentication failed.').replaceAll('_', ' ').toLowerCase();
}

async function firebaseRequest(endpoint, body, timeoutMs = 15000) {
  const apiKey = await getFirebaseApiKey();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${AUTH_BASE}/${endpoint}?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: 'no-store'
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const code = data?.error?.message || `HTTP_${response.status}`;
      throw new Error(friendlyFirebaseError(code));
    }
    return data;
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error('Firebase login timed out. Check your internet connection and try again.');
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function saveSession(data, fallbackEmail = '') {
  const record = {
    idToken: data?.idToken || '',
    email: data?.email || fallbackEmail || '',
    refreshToken: data?.refreshToken || '',
    expiresAt: Date.now() + Math.max(60, Number(data?.expiresIn || 3600) - 60) * 1000
  };
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(record)); } catch {}
  return record;
}

function readSession() {
  try {
    const record = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
    if (!record?.idToken || Number(record.expiresAt || 0) <= Date.now()) return null;
    return record;
  } catch {
    return null;
  }
}

function clearSession() {
  try { sessionStorage.removeItem(SESSION_KEY); } catch {}
}

export async function signInAdmin(email, password) {
  const cleanEmail = String(email || '').trim();
  if (!cleanEmail) throw new Error('Enter the admin email.');
  if (!password) throw new Error('Enter the admin password.');

  const data = await firebaseRequest('accounts:signInWithPassword', {
    email: cleanEmail,
    password,
    returnSecureToken: true
  });
  const session = saveSession(data, cleanEmail);
  return { idToken: session.idToken, email: session.email };
}

export async function signOutAdmin() {
  clearSession();
}

export function currentAdminUser() {
  const session = readSession();
  return session ? { email: session.email, idToken: session.idToken } : null;
}

export async function changeAdminPassword(currentPassword, newPassword) {
  const existing = readSession();
  if (!existing?.email) throw new Error('Please sign in again before changing the password.');
  if (!currentPassword) throw new Error('Enter your current password.');
  if (!newPassword || newPassword.length < 8) throw new Error('Use at least 8 characters for the new password.');

  const signedIn = await firebaseRequest('accounts:signInWithPassword', {
    email: existing.email,
    password: currentPassword,
    returnSecureToken: true
  });

  const updated = await firebaseRequest('accounts:update', {
    idToken: signedIn.idToken,
    password: newPassword,
    returnSecureToken: true
  });
  saveSession({ ...updated, email: updated.email || existing.email }, existing.email);
}

export async function resetAdminPassword(email) {
  const cleanEmail = String(email || '').trim();
  if (!cleanEmail) throw new Error('Enter the admin email first.');
  await firebaseRequest('accounts:sendOobCode', {
    requestType: 'PASSWORD_RESET',
    email: cleanEmail
  });
}
