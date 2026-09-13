import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getAnalytics, isSupported as analyticsIsSupported } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-analytics.js';
import {
  EmailAuthProvider,
  getAuth,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updatePassword
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';

const firebaseConfig = {
  apiKey: 'AIzaSyC21iURx8rnfn2BY1CY73gUCXOMux7FMfM',
  authDomain: 'ndanji-cbe1f.firebaseapp.com',
  projectId: 'ndanji-cbe1f',
  storageBucket: 'ndanji-cbe1f.firebasestorage.app',
  messagingSenderId: '678287240227',
  appId: '1:678287240227:web:5576cfb90f094cc6261596',
  measurementId: 'G-V7QJRL2J2H'
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

analyticsIsSupported()
  .then((supported) => {
    if (supported) getAnalytics(app);
  })
  .catch(() => {});

export async function signInAdmin(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
  return {
    idToken: await credential.user.getIdToken(true),
    email: credential.user.email || email.trim()
  };
}

export async function signOutAdmin() {
  await signOut(auth);
}

export function currentAdminUser() {
  return auth.currentUser;
}

export async function changeAdminPassword(currentPassword, newPassword) {
  const user = auth.currentUser;
  if (!user || !user.email) throw new Error('Please sign in again before changing the password.');
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
}

export async function resetAdminPassword(email) {
  if (!email || !email.trim()) throw new Error('Enter the admin email first.');
  await sendPasswordResetEmail(auth, email.trim());
}
