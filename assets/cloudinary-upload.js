function icon(name) {
  const icons = {
    overview: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></svg>',
    content: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16M4 12h12M4 19h9"/></svg>',
    images: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="m5 18 5-5 3 3 2-2 4 4"/></svg>',
    preview: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/></svg>',
    advanced: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 9-3 3 3 3M16 9l3 3-3 3M14 5l-4 14"/></svg>',
    security: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 5 6v5c0 4.6 2.9 8 7 10 4.1-2 7-5.4 7-10V6l-7-3Z"/><path d="m9.5 12 1.7 1.7 3.7-4"/></svg>',
    profile: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c.8-5 3.4-7 8-7s7.2 2 8 7"/></svg>',
    external: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9"/><path d="M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6"/></svg>'
  };
  return icons[name] || '';
}

function addProfilePhotoNavLink() {
  const nav = document.querySelector('.nav');
  if (!nav || nav.querySelector('[data-profile-photo-link]')) return;
  const link = document.createElement('a');
  link.href = '/profile-image.html';
  link.innerHTML = `${icon('profile')}<span>Profile Photo</span>`;
  link.setAttribute('data-profile-photo-link', 'true');
  const viewPortfolio = [...nav.querySelectorAll('a')].find((a) => a.getAttribute('href') === '/');
  if (viewPortfolio) nav.insertBefore(link, viewPortfolio);
  else nav.appendChild(link);
}

function enhanceAdminUI() {
  const shell = document.querySelector('.shell');
  const nav = document.querySelector('.nav');
  if (!shell || !nav || document.querySelector('#ndanji-admin-upgrade')) return;

  const style = document.createElement('style');
  style.id = 'ndanji-admin-upgrade';
  style.textContent = `
    :root{--admin-bg:#f3efe6;--admin-card:#fffdf8;--admin-navy:#071d42;--admin-blue:#315c9b;--admin-soft:#e9eff8;--admin-gold:#d9b45b;--admin-shadow:0 18px 48px rgba(7,29,66,.08)}
    html,body{background:var(--admin-bg)!important}
    .shell{max-width:none!important;background:linear-gradient(180deg,#f7f3eb 0%,#efe9dd 100%)!important;grid-template-columns:286px minmax(0,1fr)!important}
    aside{position:sticky;top:0;height:100vh;padding:28px 18px!important;background:linear-gradient(180deg,#071d42 0%,#0b2d61 100%)!important;border-right:1px solid rgba(255,255,255,.06);box-shadow:12px 0 40px rgba(7,29,66,.08)}
    aside .brand{font-size:1.35rem!important;line-height:1.05;letter-spacing:.02em}
    .admin-tag{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.12)!important}
    .nav{gap:5px!important}
    .nav button,.nav a{display:flex!important;align-items:center;gap:11px;padding:12px 13px!important;border-radius:12px!important;font-size:.8rem!important;color:#cfdbef!important;transition:.18s ease}
    .nav button svg,.nav a svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;flex:0 0 auto}
    .nav button:hover,.nav a:hover{transform:translateX(2px);background:rgba(255,255,255,.08)!important;color:#fff!important}
    .nav .active{background:linear-gradient(90deg,rgba(255,255,255,.16),rgba(255,255,255,.07))!important;color:#fff!important;box-shadow:inset 3px 0 0 #efd58a}
    .main{padding:38px clamp(20px,4vw,58px)!important;max-width:1480px;width:100%;margin:0 auto}
    .topbar{padding-bottom:22px;border-bottom:1px solid rgba(12,40,87,.1);align-items:center!important}
    .topbar h1{font-size:clamp(3rem,5vw,5.7rem)!important;letter-spacing:-.02em}
    .topbar .eyebrow{color:#6e7f9d!important}
    .btn{transition:.18s ease;box-shadow:none!important}
    .btn:hover{transform:translateY(-1px)}
    .btn.primary{background:linear-gradient(135deg,#315c9b,#244a82)!important}
    .btn.dark{background:#071d42!important}
    .stats{gap:14px!important;margin:24px 0 26px!important}
    .stat{position:relative;overflow:hidden;padding:19px!important;border-radius:16px!important;background:rgba(255,253,248,.9)!important;box-shadow:var(--admin-shadow);border-color:rgba(12,40,87,.08)!important}
    .stat:before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:#315c9b}
    .stat small{font-size:.68rem!important;text-transform:uppercase;letter-spacing:.1em}
    .stat strong{font-size:1.7rem!important}
    .panel{background:rgba(255,253,248,.94)!important;border-color:rgba(12,40,87,.09)!important;border-radius:20px!important;box-shadow:var(--admin-shadow);padding:24px!important}
    .panel-head{padding-bottom:14px;border-bottom:1px solid rgba(12,40,87,.08)}
    .status{background:#e7eef8!important;color:#244a82!important;border:1px solid #d5e0f0}
    .field label,.small{color:#6a778b!important}
    input,textarea,select{border-radius:11px!important;border-color:rgba(12,40,87,.14)!important;background:#fffefa!important}
    input:focus,textarea:focus,select:focus{border-color:#5479b0!important;box-shadow:0 0 0 3px rgba(84,121,176,.14)!important}
    .edit-item{border-radius:14px!important;border-color:rgba(12,40,87,.09)!important;background:#fffefa!important}
    .notice{background:#fbf2d8!important;border-color:#ead9a4!important;color:#594b27!important}
    .drop{background:linear-gradient(180deg,#fffdf8,#fbf6e8)!important;border-color:#9aacc7!important}
    .preview-frame{box-shadow:0 10px 30px rgba(7,29,66,.08)}
    .cms-health{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:18px}
    .health-card{display:flex;align-items:center;gap:10px;border:1px solid rgba(12,40,87,.09);border-radius:14px;padding:13px 14px;background:#fffefa}
    .health-dot{width:9px;height:9px;border-radius:50%;background:#2f9363;box-shadow:0 0 0 4px rgba(47,147,99,.12)}
    .health-card b{display:block;font-size:.76rem}.health-card span{display:block;color:#718096;font-size:.68rem;margin-top:2px}
    .quick-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:18px}
    .quick-card{display:block;padding:17px;border-radius:15px;border:1px solid rgba(12,40,87,.1);background:#fffefa;text-decoration:none;color:inherit;transition:.18s ease}
    .quick-card:hover{transform:translateY(-2px);box-shadow:0 10px 24px rgba(7,29,66,.08)}
    .quick-card strong{display:block;font-size:.85rem}.quick-card span{display:block;font-size:.72rem;color:#718096;margin-top:5px;line-height:1.4}
    @media(max-width:1080px){.shell{grid-template-columns:1fr!important}aside{position:sticky;height:auto;top:0;z-index:30;overflow-x:auto;padding:11px 13px!important}.nav button,.nav a{padding:10px!important}.nav button svg,.nav a svg{display:none}.main{padding:22px!important}.cms-health,.quick-grid{grid-template-columns:1fr 1fr}}
    @media(max-width:620px){.cms-health,.quick-grid{grid-template-columns:1fr}.topbar{gap:14px}.topbar .actions{width:100%}.topbar .actions .btn{flex:1}.stats{grid-template-columns:1fr 1fr!important}}
  `;
  document.head.appendChild(style);

  const iconBySection = {overview:'overview',content:'content',images:'images',preview:'preview',advanced:'advanced',security:'security'};
  nav.querySelectorAll('button[data-section]').forEach((button) => {
    if (button.querySelector('svg')) return;
    const label = button.textContent.trim();
    button.innerHTML = `${icon(iconBySection[button.dataset.section])}<span>${label}</span>`;
  });
  const liveLink = [...nav.querySelectorAll('a')].find((a) => a.getAttribute('href') === '/');
  if (liveLink && !liveLink.querySelector('svg')) liveLink.innerHTML = `${icon('external')}<span>View Live Site</span>`;

  const overview = document.querySelector('#section-overview .panel');
  if (overview && !overview.querySelector('.cms-health')) {
    const health = document.createElement('div');
    health.className = 'cms-health';
    health.innerHTML = `
      <div class="health-card"><i class="health-dot"></i><div><b>GitHub</b><span>Shared publishing source</span></div></div>
      <div class="health-card"><i class="health-dot"></i><div><b>Cloudinary</b><span>Media storage connected</span></div></div>
      <div class="health-card"><i class="health-dot"></i><div><b>Vercel</b><span>Production deployment</span></div></div>`;
    overview.appendChild(health);

    const quick = document.createElement('div');
    quick.className = 'quick-grid';
    quick.innerHTML = `
      <a class="quick-card" href="/profile-image.html"><strong>Profile Photo</strong><span>Upload from phone/laptop or paste a link, then publish.</span></a>
      <a class="quick-card" href="#" data-quick-section="images"><strong>Media & Images</strong><span>Upload and apply images to the selected portfolio page.</span></a>
      <a class="quick-card" href="/" target="_blank" rel="noopener"><strong>Open Live Portfolio</strong><span>Check the current public production website.</span></a>`;
    overview.appendChild(quick);
    quick.querySelector('[data-quick-section="images"]')?.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelector('[data-section="images"]')?.click();
    });
  }
}

function initAdminEnhancements() {
  addProfilePhotoNavLink();
  enhanceAdminUI();
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAdminEnhancements, { once: true });
  else initAdminEnhancements();
}

export async function uploadImageToCloudinary(file) {
  if (!(file instanceof File)) throw new TypeError('A valid image File is required.');
  if (!file.type.startsWith('image/')) throw new TypeError('Only image uploads are allowed.');

  const signResponse = await fetch('/api/cloudinary-sign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}'
  });
  if (!signResponse.ok) {
    const message = await signResponse.text();
    throw new Error(`Unable to prepare Cloudinary upload: ${message}`);
  }

  const config = await signResponse.json();
  const form = new FormData();
  form.append('file', file);
  form.append('api_key', config.apiKey);
  form.append('timestamp', String(config.timestamp));
  form.append('folder', config.folder);
  form.append('overwrite', String(config.overwrite));
  form.append('signature', config.signature);

  const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudName)}/image/upload`, { method: 'POST', body: form });
  if (!uploadResponse.ok) {
    const message = await uploadResponse.text();
    throw new Error(`Cloudinary image upload failed: ${message}`);
  }

  const result = await uploadResponse.json();
  return {
    publicId: result.public_id,
    secureUrl: result.secure_url,
    width: result.width,
    height: result.height,
    format: result.format,
    bytes: result.bytes
  };
}
