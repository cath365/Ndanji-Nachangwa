(() => {
  const cleanPath = () => {
    let p = location.pathname || '/';
    if (p === '/index.html') p = '/';
    return p;
  };

  function applyText(map) {
    Object.entries(map || {}).forEach(([selector, value]) => {
      const el = document.querySelector(selector);
      if (el && typeof value === 'string') el.textContent = value;
    });
  }

  function applyImages(map) {
    Object.entries(map || {}).forEach(([selector, value]) => {
      const el = document.querySelector(selector);
      if (!el || !value || typeof value !== 'object') return;
      if (value.src) el.setAttribute('src', value.src);
      if (typeof value.alt === 'string') el.setAttribute('alt', value.alt);
      if (el.hasAttribute('srcset')) el.removeAttribute('srcset');
    });
  }

  function applyLinks(map) {
    Object.entries(map || {}).forEach(([selector, value]) => {
      const el = document.querySelector(selector);
      if (!el || !value || typeof value !== 'object') return;
      if (typeof value.href === 'string') el.setAttribute('href', value.href);
      if (typeof value.label === 'string' && value.label.trim()) el.textContent = value.label;
    });
  }

  async function boot() {
    try {
      const response = await fetch('/data/cms-content.json', { cache: 'no-store' });
      if (!response.ok) return;
      const data = await response.json();
      const page = data?.pages?.[cleanPath()];
      if (!page) return;
      applyText(page.text);
      applyImages(page.images);
      applyLinks(page.links);
      document.documentElement.dataset.cmsReady = 'true';
    } catch (error) {
      console.warn('CMS content could not be loaded.', error);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
