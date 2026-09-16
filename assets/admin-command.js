import { uploadImageToCloudinary } from '/assets/cloudinary-upload.js?v=20260916-2';
import { changeAdminPassword, currentAdminUser, resetAdminPassword, signInAdmin, signOutAdmin } from '/assets/firebase-admin.js?v=20260916-2';

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const PAGES = {
  home: 'Profile',
  about: 'About',
  experience: 'Experience',
  impact: 'Impact',
  engagements: 'Engagements & Recognition',
  insights: 'Publications',
  education: 'Credentials',
  contact: 'Engagement / Contact'
};
const DRAFT_PREFIX = 'ndanji-cms-draft:';
const MEDIA_KEY = 'ndanji-cloudinary-images';

let doc = null;
let currentPage = 'home';
let dirty = false;
let selectedUpload = null;
let selectedImageIndex = 0;
let historyStack = [];
let historyIndex = -1;
let historyTimer = null;
let draftTimer = null;
let lastPublish = null;

const loginView = $('#loginView');
const dashboard = $('#dashboard');
const loginMessage = $('#loginMessage');
const globalMessage = $('#globalMessage');

function setMsg(el, text, type = '') {
  if (!el) return;
  el.textContent = text || '';
  el.className = 'msg' + (type ? ' ' + type : '');
}
function setStatus(text) {
  $('#statStatus').textContent = text;
}
function pageLabel() {
  return PAGES[currentPage] || currentPage;
}
function serialize() {
  if (!doc) return '';
  return '<!doctype html>\n' + doc.documentElement.outerHTML;
}
function parseHtml(html) {
  return new DOMParser().parseFromString(html, 'text/html');
}
function formatDate(value) {
  if (!value) return '—';
  try { return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)); }
  catch { return String(value); }
}
function formatBytes(n) {
  const value = Number(n || 0);
  if (value > 1048576) return (value / 1048576).toFixed(1) + ' MB';
  if (value > 1024) return (value / 1024).toFixed(1) + ' KB';
  return value + ' B';
}
function metaTag(name, attr = 'name') {
  if (!doc) return null;
  return doc.head.querySelector(`meta[${attr}="${CSS.escape(name)}"]`);
}
function ensureMeta(name, attr = 'name') {
  let el = metaTag(name, attr);
  if (!el) {
    el = doc.createElement('meta');
    el.setAttribute(attr, name);
    doc.head.appendChild(el);
  }
  return el;
}
function draftKey() { return DRAFT_PREFIX + currentPage; }
function loadDraftRecord() {
  try { return JSON.parse(localStorage.getItem(draftKey()) || 'null'); }
  catch { return null; }
}
function saveDraftRecord(showMessage = false) {
  if (!doc) return;
  const record = { page: currentPage, html: serialize(), savedAt: new Date().toISOString() };
  localStorage.setItem(draftKey(), JSON.stringify(record));
  $('#statDraft').textContent = 'Saved';
  $('#statDraftNote').textContent = formatDate(record.savedAt);
  renderDraftBar();
  if (showMessage) setMsg(globalMessage, 'Draft saved in this browser. It is not public until you publish.', 'ok');
}
function clearDraftRecord() {
  localStorage.removeItem(draftKey());
  $('#statDraft').textContent = 'None';
  $('#statDraftNote').textContent = 'No local draft';
  renderDraftBar();
}
function scheduleDraft() {
  clearTimeout(draftTimer);
  draftTimer = setTimeout(() => saveDraftRecord(false), 800);
}
function pushHistorySnapshot(force = false) {
  if (!doc) return;
  const html = serialize();
  if (!force && historyStack[historyIndex] === html) return;
  historyStack = historyStack.slice(0, historyIndex + 1);
  historyStack.push(html);
  if (historyStack.length > 35) historyStack.shift();
  historyIndex = historyStack.length - 1;
  updateHistoryButtons();
}
function scheduleHistory() {
  clearTimeout(historyTimer);
  historyTimer = setTimeout(() => pushHistorySnapshot(), 450);
}
function updateHistoryButtons() {
  $('#undoBtn').disabled = historyIndex <= 0;
  $('#redoBtn').disabled = historyIndex < 0 || historyIndex >= historyStack.length - 1;
}
function markDirty(reason = 'Edited') {
  dirty = true;
  $('#dirtyState').textContent = 'Unsaved changes';
  $('#publishBtn').disabled = false;
  setStatus(reason);
  scheduleDraft();
  scheduleHistory();
}
function restoreHistory(index) {
  if (index < 0 || index >= historyStack.length) return;
  historyIndex = index;
  doc = parseHtml(historyStack[historyIndex]);
  dirty = true;
  $('#dirtyState').textContent = 'Unsaved changes';
  $('#publishBtn').disabled = false;
  setStatus('Edited');
  refreshEditors();
  saveDraftRecord(false);
  updateHistoryButtons();
}

function describeParent(node) {
  const el = node.nodeType === 3 ? node.parentElement : node;
  if (!el) return 'Content';
  const cls = String(el.className || '').split(' ').filter(Boolean).slice(0, 2).join('.');
  return el.tagName.toLowerCase() + (el.id ? '#' + el.id : cls ? '.' + cls : '');
}
function editableTextNodes() {
  if (!doc) return [];
  const out = [];
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = walker.nextNode())) {
    const p = n.parentElement;
    if (!p || ['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG'].includes(p.tagName)) continue;
    if (!n.nodeValue || !n.nodeValue.trim()) continue;
    if (p.closest('script,style,noscript')) continue;
    out.push(n);
  }
  return out;
}
function renderText() {
  const host = $('#textEditor');
  const nodes = editableTextNodes();
  $('#statText').textContent = String(nodes.length);
  host.innerHTML = '';
  nodes.forEach((node, i) => {
    const wrap = document.createElement('div');
    wrap.className = 'edit-item';
    wrap.innerHTML = `<div class="edit-meta"><span>${describeParent(node)}</span><span>#${i + 1}</span></div><textarea></textarea>`;
    const ta = wrap.querySelector('textarea');
    ta.value = node.nodeValue.trim();
    ta.addEventListener('input', () => {
      const before = node.nodeValue.match(/^\s*/)?.[0] || '';
      const after = node.nodeValue.match(/\s*$/)?.[0] || '';
      node.nodeValue = before + ta.value + after;
      markDirty();
    });
    host.appendChild(wrap);
  });
  if (!nodes.length) host.innerHTML = '<div class="notice">No editable text was found on this page.</div>';
}
function renderLinks() {
  const host = $('#linkEditor');
  const links = doc ? [...doc.querySelectorAll('a[href]')] : [];
  host.innerHTML = '';
  links.forEach((a, i) => {
    const wrap = document.createElement('div');
    wrap.className = 'edit-item';
    wrap.innerHTML = `<div class="edit-meta"><span>Link ${i + 1}</span><span>${(a.textContent || '').trim().slice(0, 46)}</span></div><input type="text">`;
    const inp = wrap.querySelector('input');
    inp.value = a.getAttribute('href') || '';
    inp.addEventListener('input', () => { a.setAttribute('href', inp.value); markDirty(); });
    host.appendChild(wrap);
  });
  if (!links.length) host.innerHTML = '<div class="notice">No links were found on this page.</div>';
}
function renderImages() {
  const host = $('#imageEditor');
  const images = doc ? [...doc.querySelectorAll('img')] : [];
  $('#statImages').textContent = String(images.length);
  const target = $('#mediaTarget');
  target.innerHTML = images.map((img, i) => `<option value="${i}">Image ${i + 1} — ${(img.getAttribute('alt') || 'No alt text').slice(0, 36)}</option>`).join('') || '<option value="0">No standard images</option>';
  selectedImageIndex = Math.min(selectedImageIndex, Math.max(0, images.length - 1));
  target.value = String(selectedImageIndex);
  host.innerHTML = '';
  images.forEach((img, i) => {
    const wrap = document.createElement('div');
    wrap.className = 'edit-item';
    const src = img.getAttribute('src') || '';
    wrap.innerHTML = `<div class="edit-meta"><span>Image ${i + 1}</span><span>${(img.getAttribute('alt') || 'No alt text').slice(0, 48)}</span></div><div class="image-row"><img class="thumb" alt="Current image"><div class="image-controls"><label class="small">Image URL</label><input class="src" type="text"><label class="small">Alternative text</label><input class="alt" type="text"><div class="actions"><button class="btn light target" type="button">Set as media target</button><button class="btn light latest" type="button">Use latest upload</button></div></div></div>`;
    wrap.querySelector('.thumb').src = src;
    wrap.querySelector('.src').value = src;
    wrap.querySelector('.alt').value = img.getAttribute('alt') || '';
    wrap.querySelector('.src').addEventListener('input', (e) => {
      img.setAttribute('src', e.target.value);
      img.removeAttribute('srcset');
      wrap.querySelector('.thumb').src = e.target.value;
      markDirty();
    });
    wrap.querySelector('.alt').addEventListener('input', (e) => { img.setAttribute('alt', e.target.value); markDirty(); });
    wrap.querySelector('.target').addEventListener('click', () => { selectedImageIndex = i; target.value = String(i); setMsg(globalMessage, `Image ${i + 1} selected as the media target.`, 'ok'); });
    wrap.querySelector('.latest').addEventListener('click', () => {
      const latest = localMedia()[0];
      if (!latest) return setMsg(globalMessage, 'Upload an image first.', 'error');
      applyMediaToImage(latest.secureUrl, i);
    });
    host.appendChild(wrap);
  });
  if (!images.length) host.innerHTML = '<div class="notice">No standard &lt;img&gt; elements were found. Special artwork can still be managed in Advanced HTML.</div>';
}
function applyMediaToImage(url, index = selectedImageIndex) {
  if (!doc) return false;
  const images = [...doc.querySelectorAll('img')];
  const img = images[index];
  if (!img) {
    setMsg(globalMessage, 'Choose a valid image target first.', 'error');
    return false;
  }
  img.setAttribute('src', url);
  img.removeAttribute('srcset');
  selectedImageIndex = index;
  markDirty('Image changed');
  renderImages();
  refreshPreview();
  setMsg(globalMessage, `Image ${index + 1} updated in the working copy. Publish when ready.`, 'ok');
  return true;
}
function renderSeo() {
  if (!doc) return;
  $('#seoTitle').value = doc.title || '';
  $('#seoDescription').value = metaTag('description')?.getAttribute('content') || '';
  $('#seoOgTitle').value = metaTag('og:title', 'property')?.getAttribute('content') || '';
  $('#seoOgDescription').value = metaTag('og:description', 'property')?.getAttribute('content') || '';
  $('#seoOgImage').value = metaTag('og:image', 'property')?.getAttribute('content') || '';
}
function applySeo() {
  if (!doc) return;
  doc.title = $('#seoTitle').value.trim();
  ensureMeta('description').setAttribute('content', $('#seoDescription').value.trim());
  ensureMeta('og:title', 'property').setAttribute('content', $('#seoOgTitle').value.trim() || doc.title);
  ensureMeta('og:description', 'property').setAttribute('content', $('#seoOgDescription').value.trim() || $('#seoDescription').value.trim());
  const ogImage = $('#seoOgImage').value.trim();
  if (ogImage) ensureMeta('og:image', 'property').setAttribute('content', ogImage);
  markDirty('SEO edited');
  refreshPreview();
  setMsg(globalMessage, 'SEO and social metadata applied to the working copy.', 'ok');
}
function syncAdvanced() { if (doc) $('#advancedHtml').value = serialize(); }
function refreshPreview() {
  if (!doc) return;
  const clone = doc.cloneNode(true);
  const base = clone.createElement('base');
  base.href = '/';
  clone.head.prepend(base);
  $('#previewFrame').srcdoc = '<!doctype html>' + clone.documentElement.outerHTML;
}
function refreshEditors() {
  renderText();
  renderLinks();
  renderImages();
  renderSeo();
  syncAdvanced();
  $('#contentTitle').textContent = pageLabel();
  $('#statPage').textContent = pageLabel();
  $('#pageHeading').textContent = pageLabel();
  refreshPreview();
}
function renderDraftBar() {
  const host = $('#draftBar');
  const record = loadDraftRecord();
  if (!record?.html) {
    host.classList.add('hidden');
    return;
  }
  host.classList.remove('hidden');
  $('#draftDate').textContent = formatDate(record.savedAt);
}
async function loadPage({ preserveMessage = false } = {}) {
  setStatus('Loading');
  $('#publishBtn').disabled = true;
  if (!preserveMessage) setMsg(globalMessage, '');
  try {
    const response = await fetch('/api/cms?page=' + encodeURIComponent(currentPage), { cache: 'no-store' });
    const data = await response.json();
    if (response.status === 401) return showLogin();
    if (!response.ok) throw new Error(data.error || 'Unable to load page');
    doc = parseHtml(data.html);
    dirty = false;
    historyStack = [];
    historyIndex = -1;
    pushHistorySnapshot(true);
    $('#dirtyState').textContent = 'Published version';
    $('#publishBtn').disabled = true;
    $('#statBranch').textContent = data.branch || 'main';
    $('#statBranchNote').textContent = data.path || '';
    setStatus('Ready');
    const draft = loadDraftRecord();
    $('#statDraft').textContent = draft?.html ? 'Saved' : 'None';
    $('#statDraftNote').textContent = draft?.savedAt ? formatDate(draft.savedAt) : 'No local draft';
    refreshEditors();
    renderDraftBar();
    loadVersions();
  } catch (error) {
    setStatus('Error');
    setMsg(globalMessage, error.message, 'error');
  }
}
async function publishPage() {
  if (!doc || !dirty) return;
  $('#publishBtn').disabled = true;
  setStatus('Publishing');
  setMsg(globalMessage, 'Publishing to GitHub and preparing the public deployment…');
  try {
    const response = await fetch('/api/cms', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page: currentPage, html: serialize() })
    });
    const data = await response.json();
    if (response.status === 401) return showLogin();
    if (!response.ok) throw new Error(data.error || 'Publish failed');
    dirty = false;
    clearDraftRecord();
    $('#dirtyState').textContent = 'Published';
    setStatus('Published');
    lastPublish = new Date().toISOString();
    $('#statPublish').textContent = 'Published';
    $('#statPublishNote').textContent = formatDate(lastPublish);
    if (data.deployment?.triggered) {
      setMsg(globalMessage, 'Published to GitHub. The public Vercel deployment was triggered successfully.', 'ok');
      setHealth('vercel', 'good', 'Deployment triggered');
    } else if (data.deployment?.configured && data.deployment?.error) {
      setMsg(globalMessage, 'GitHub was updated, but the Vercel deploy hook returned an error: ' + data.deployment.error, 'warn');
      setHealth('vercel', 'warn', 'Deploy hook error');
    } else {
      setMsg(globalMessage, 'Published to GitHub. The Vercel deploy hook is not configured yet; Git-connected deployment may still run automatically.', 'warn');
      setHealth('vercel', 'warn', 'Hook not configured');
    }
    historyStack = [serialize()];
    historyIndex = 0;
    updateHistoryButtons();
    loadVersions();
  } catch (error) {
    $('#publishBtn').disabled = false;
    setStatus('Error');
    setMsg(globalMessage, error.message, 'error');
  }
}

function localMedia() {
  try { return JSON.parse(localStorage.getItem(MEDIA_KEY) || '[]'); }
  catch { return []; }
}
function saveLocalMedia(items) {
  localStorage.setItem(MEDIA_KEY, JSON.stringify(items.slice(0, 50)));
}
function mergeMediaItems(...groups) {
  const map = new Map();
  groups.flat().filter(Boolean).forEach((item) => {
    const key = item.publicId || item.secureUrl;
    if (!key || map.has(key)) return;
    map.set(key, item);
  });
  return [...map.values()].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}
async function loadMediaLibrary() {
  const host = $('#mediaLibrary');
  host.innerHTML = '<div class="small">Loading Cloudinary media…</div>';
  let items = localMedia();
  try {
    const response = await fetch('/api/media-library?limit=60', { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Unable to load media');
    items = mergeMediaItems(data.items || [], localMedia());
    setHealth('cloudinary', 'good', `${items.length} media items available`);
    setMsg($('#mediaMessage'), '');
  } catch (error) {
    items = localMedia();
    setHealth('cloudinary', 'warn', 'Using local upload history');
    setMsg($('#mediaMessage'), 'Cloud media library could not be loaded. Recent browser uploads are shown instead.', 'warn');
  }
  renderMediaLibrary(items);
}
function renderMediaLibrary(items) {
  const host = $('#mediaLibrary');
  host.innerHTML = '';
  if (!items.length) {
    host.innerHTML = '<div class="notice">No Cloudinary images are available yet.</div>';
    return;
  }
  items.forEach((item) => {
    const card = document.createElement('article');
    card.className = 'media-card';
    card.innerHTML = `<img src="${item.secureUrl}" alt="Cloudinary media"><div class="media-meta"><b>${item.publicId || 'Portfolio media'}</b><br>${item.width || '?'} × ${item.height || '?'} • ${formatBytes(item.bytes)}</div><div class="media-actions"><button class="btn light apply">Apply to target</button><button class="btn light copy">Copy URL</button></div>`;
    card.querySelector('.apply').addEventListener('click', () => applyMediaToImage(item.secureUrl));
    card.querySelector('.copy').addEventListener('click', async (e) => {
      await navigator.clipboard.writeText(item.secureUrl);
      e.currentTarget.textContent = 'Copied';
    });
    host.appendChild(card);
  });
}
function chooseUpload(file) {
  if (!file) return;
  if (!file.type.startsWith('image/')) return setMsg($('#uploadMessage'), 'Images only.', 'error');
  selectedUpload = file;
  $('#uploadPreview').src = URL.createObjectURL(file);
  $('#uploadPreview').classList.remove('hidden');
  $('#uploadMeta').textContent = file.name + ' • ' + formatBytes(file.size);
  $('#cloudUploadBtn').classList.remove('hidden');
  setMsg($('#uploadMessage'), '');
}
async function uploadSelectedImage() {
  if (!selectedUpload) return;
  const button = $('#cloudUploadBtn');
  button.disabled = true;
  setMsg($('#uploadMessage'), 'Uploading securely to Cloudinary…');
  try {
    const result = await uploadImageToCloudinary(selectedUpload);
    const local = mergeMediaItems([result], localMedia());
    saveLocalMedia(local);

    renderMediaLibrary(local);
    const applied = applyMediaToImage(result.secureUrl, selectedImageIndex);

    selectedUpload = null;
    $('#uploadInput').value = '';
    $('#uploadPreview').removeAttribute('src');
    $('#uploadPreview').classList.add('hidden');
    $('#uploadMeta').textContent = '';
    button.classList.add('hidden');

    if (applied) {
      setMsg($('#uploadMessage'), `Upload complete and automatically applied to Image ${selectedImageIndex + 1}. Check Preview, then press Publish Changes to make it public.`, 'ok');
    } else {
      setMsg($('#uploadMessage'), 'Upload complete and saved in the Media Library. This page has no standard image target, so choose or create an image target before publishing.', 'warn');
    }

    await loadMediaLibrary();
  } catch (error) {
    setMsg($('#uploadMessage'), error.message, 'error');
  } finally {
    button.disabled = false;
  }
}

async function loadVersions() {
  const host = $('#versionList');
  host.innerHTML = '<div class="small">Loading GitHub versions…</div>';
  try {
    const response = await fetch('/api/cms-history?page=' + encodeURIComponent(currentPage), { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Unable to load version history');
    host.innerHTML = '';
    (data.commits || []).forEach((version, i) => {
      const row = document.createElement('div');
      row.className = 'version';
      row.innerHTML = `<div class="version-sha">${version.shortSha}</div><div><h4>${version.message.replace(/</g, '&lt;')}</h4><p>${version.author} • ${formatDate(version.date)}</p></div><button class="btn light restore" ${i === 0 ? 'disabled' : ''}>Restore</button>`;
      if (i > 0) row.querySelector('.restore').addEventListener('click', () => restoreVersion(version));
      host.appendChild(row);
    });
    if (!(data.commits || []).length) host.innerHTML = '<div class="notice">No version history is available for this page yet.</div>';
    setHealth('github', 'good', `${(data.commits || []).length} versions available`);
  } catch (error) {
    host.innerHTML = `<div class="notice danger">${error.message}</div>`;
    setHealth('github', 'warn', 'History unavailable');
  }
}
async function restoreVersion(version) {
  if (!confirm(`Restore ${pageLabel()} to GitHub version ${version.shortSha}? A new restore commit will be created.`)) return;
  setMsg(globalMessage, `Restoring ${pageLabel()} from ${version.shortSha}…`);
  try {
    const response = await fetch('/api/cms-history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page: currentPage, sha: version.sha })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Restore failed');
    clearDraftRecord();
    await loadPage({ preserveMessage: true });
    setMsg(globalMessage, `Version ${version.shortSha} restored to GitHub.`, 'ok');
  } catch (error) {
    setMsg(globalMessage, error.message, 'error');
  }
}

function setHealth(name, state, text) {
  const el = document.querySelector(`[data-health="${name}"]`);
  if (!el) return;
  el.classList.remove('good', 'warn');
  if (state) el.classList.add(state);
  el.querySelector('span').textContent = text;
}
async function runHealthChecks() {
  setHealth('github', '', 'Checking…');
  setHealth('cloudinary', '', 'Checking…');
  setHealth('vercel', '', 'Publish test pending');
  try {
    const response = await fetch('/api/cms?page=home', { cache: 'no-store' });
    if (!response.ok) throw new Error();
    setHealth('github', 'good', 'Publishing source connected');
  } catch { setHealth('github', 'warn', 'Publishing source unavailable'); }
  try {
    const response = await fetch('/api/media-library?limit=1', { cache: 'no-store' });
    if (!response.ok) throw new Error();
    setHealth('cloudinary', 'good', 'Media library connected');
  } catch { setHealth('cloudinary', 'warn', 'Media library unavailable'); }
  if (lastPublish) setHealth('vercel', 'good', 'Last publish completed');
  else setHealth('vercel', 'warn', 'Verified on next publish');
}

function openSection(name) {
  $$('[data-section]').forEach((b) => b.classList.toggle('active', b.dataset.section === name));
  $$('.section').forEach((s) => s.classList.toggle('active', s.id === 'section-' + name));
  if (name === 'preview') refreshPreview();
  if (name === 'advanced') syncAdvanced();
  if (name === 'seo') renderSeo();
  if (name === 'versions') loadVersions();
  if (name === 'media') loadMediaLibrary();
  if (name === 'security') updateAdminIdentity();
}
function updateAdminIdentity() {
  const user = currentAdminUser();
  $('#adminEmailDisplay').textContent = user?.email || 'Authorized Firebase administrator';
}
function showLogin() {
  dashboard.classList.add('hidden');
  loginView.classList.remove('hidden');
}
function showDashboard() {
  loginView.classList.add('hidden');
  dashboard.classList.remove('hidden');
  updateAdminIdentity();
  loadPage();
  loadMediaLibrary();
  runHealthChecks();
}
async function authStatus() {
  try {
    const response = await fetch('/api/admin-auth', { cache: 'no-store' });
    const data = await response.json();
    data.authenticated ? showDashboard() : showLogin();
  } catch { showLogin(); }
}

$('#loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  setMsg(loginMessage, 'Authenticating…');
  try {
    const firebase = await signInAdmin($('#email').value, $('#password').value);
    const response = await fetch('/api/admin-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: firebase.idToken })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Sign in failed');
    $('#password').value = '';
    setMsg(loginMessage, '');
    showDashboard();
  } catch (error) { setMsg(loginMessage, error.message || 'Sign in failed', 'error'); }
});
$('#forgotBtn').addEventListener('click', async () => {
  const email = $('#email').value.trim();
  setMsg(loginMessage, '');
  try {
    await resetAdminPassword(email);
    setMsg(loginMessage, 'Password reset email sent. Check the authorized admin inbox.', 'ok');
  } catch (error) { setMsg(loginMessage, error.message, 'error'); }
});
$('#logoutBtn').addEventListener('click', async () => {
  try { await signOutAdmin(); } catch {}
  await fetch('/api/admin-auth', { method: 'DELETE' });
  showLogin();
});
$('#changePasswordForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const message = $('#securityMessage');
  const current = $('#currentPassword').value;
  const next = $('#newPassword').value;
  const confirmPassword = $('#confirmPassword').value;
  if (next !== confirmPassword) return setMsg(message, 'The new passwords do not match.', 'error');
  if (next.length < 8) return setMsg(message, 'Use at least 8 characters for the new password.', 'error');
  setMsg(message, 'Updating password…');
  try {
    await changeAdminPassword(current, next);
    $('#currentPassword').value = $('#newPassword').value = $('#confirmPassword').value = '';
    setMsg(message, 'Password changed successfully.', 'ok');
  } catch (error) { setMsg(message, error.message || 'Unable to update password.', 'error'); }
});

$('#pageSelect').addEventListener('change', async (e) => {
  if (dirty && !confirm('Discard unsaved working changes and switch pages? Your browser draft will remain available.')) {
    e.target.value = currentPage;
    return;
  }
  currentPage = e.target.value;
  selectedImageIndex = 0;
  await loadPage();
});
$('#reloadBtn').addEventListener('click', () => { if (!dirty || confirm('Reload the published version? Your local draft will remain available.')) loadPage(); });
$('#publishBtn').addEventListener('click', publishPage);
$('#saveDraftBtn').addEventListener('click', () => saveDraftRecord(true));
$('#undoBtn').addEventListener('click', () => restoreHistory(historyIndex - 1));
$('#redoBtn').addEventListener('click', () => restoreHistory(historyIndex + 1));
$('#restoreDraftBtn').addEventListener('click', () => {
  const record = loadDraftRecord();
  if (!record?.html) return;
  doc = parseHtml(record.html);
  dirty = true;
  historyStack = [serialize()];
  historyIndex = 0;
  $('#dirtyState').textContent = 'Draft restored';
  $('#publishBtn').disabled = false;
  setStatus('Draft');
  refreshEditors();
  setMsg(globalMessage, 'Local draft restored. Preview it before publishing.', 'ok');
});
$('#discardDraftBtn').addEventListener('click', () => { if (confirm('Discard the saved browser draft for this page?')) clearDraftRecord(); });
$('#refreshPreview').addEventListener('click', refreshPreview);
$('#applySeoBtn').addEventListener('click', applySeo);
$('#applyAdvancedBtn').addEventListener('click', () => {
  const parsed = parseHtml($('#advancedHtml').value);
  if (!parsed.body || !parsed.documentElement) return setMsg(globalMessage, 'Invalid HTML.', 'error');
  doc = parsed;
  markDirty('Advanced edit');
  refreshEditors();
  setMsg(globalMessage, 'Advanced HTML applied to the working copy. Preview before publishing.', 'ok');
});
$('#resetAdvancedBtn').addEventListener('click', syncAdvanced);
$('#mediaTarget').addEventListener('change', (e) => { selectedImageIndex = Number(e.target.value || 0); });
$('#cloudUploadBtn').addEventListener('click', uploadSelectedImage);
$('#uploadInput').addEventListener('change', (e) => chooseUpload(e.target.files?.[0]));
['dragenter', 'dragover'].forEach((type) => $('#dropzone').addEventListener(type, (e) => e.preventDefault()));
$('#dropzone').addEventListener('drop', (e) => { e.preventDefault(); chooseUpload(e.dataTransfer.files?.[0]); });
$('#refreshMediaBtn').addEventListener('click', loadMediaLibrary);
$('#refreshHistoryBtn').addEventListener('click', loadVersions);
$('#healthBtn').addEventListener('click', runHealthChecks);
$$('[data-section]').forEach((b) => b.addEventListener('click', () => openSection(b.dataset.section)));
$$('[data-open-section]').forEach((b) => b.addEventListener('click', () => openSection(b.dataset.openSection)));
$$('[data-editor-tab]').forEach((b) => b.addEventListener('click', () => {
  $$('[data-editor-tab]').forEach((x) => x.classList.toggle('active', x === b));
  $('#textEditor').classList.toggle('hidden', b.dataset.editorTab !== 'text');
  $('#linkEditor').classList.toggle('hidden', b.dataset.editorTab !== 'links');
}));
window.addEventListener('beforeunload', (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

authStatus();
